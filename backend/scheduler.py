"""
Scheduler del engine de SmartBet Analytics.

ESTRATEGIA DE CRÉDITOS (500 créditos/mes, plan gratuito The Odds API):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  - Ciclo cada 2 horas → 12 ciclos/día → 360 ciclos/mes
  - 17 ligas × 1 crédito/liga = 17 créditos por ciclo completo (EXCEDE 500/mes)
  - SOLUCIÓN APLICADA: rotación — 1 liga por ciclo
  - 1 liga × 360 ciclos = 360 créditos/mes ✅ (140 de margen de seguridad)
  - Cada liga se refresca 1 vez cada ~34 horas (17 ligas × 2h)
  - El resto de ligas permanece en Firestore hasta su turno
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
"""
import asyncio
import logging
import httpx
from datetime import datetime, timezone
from services.sports_api import SportsDataService, SUPPORTED_LEAGUES, ODDS_API_KEYS

logger = logging.getLogger(__name__)

# ── Presupuesto ───────────────────────────────────────────────────────────────
REFRESH_INTERVAL_SECONDS = 7200   # 2 horas
CREDITS_MIN_TO_FETCH     = 2      # Parar si quedan ≤ 2 créditos

# Índice de rotación (persiste durante la vida del proceso)
_league_rotation_index: int = 0


def _next_league() -> tuple:
    """Devuelve la liga del turno actual y avanza el índice para el próximo ciclo."""
    global _league_rotation_index
    league = SUPPORTED_LEAGUES[_league_rotation_index % len(SUPPORTED_LEAGUES)]
    _league_rotation_index = (_league_rotation_index + 1) % len(SUPPORTED_LEAGUES)
    return league  # (league_key, sport_name, league_name, country_name)


async def run_engine_cycle_loop() -> None:
    """
    Loop de fondo con rotación de ligas cada 2 horas.
    Coste garantizado: 1 crédito/ciclo = ≤ 360 créditos/mes.
    """
    from engine import engine
    from services.firebase_wrapper import FirebaseWrapper

    logger.info(
        "Scheduler iniciado | Intervalo: %ds | Presupuesto: 1 liga/ciclo | "
        "Ligas en rotación: %d | Coste estimado: ~%d créditos/mes",
        REFRESH_INTERVAL_SECONDS,
        len(SUPPORTED_LEAGUES),
        len(SUPPORTED_LEAGUES) * (30 * 24 * 3600 // REFRESH_INTERVAL_SECONDS) // len(SUPPORTED_LEAGUES),
    )

    # Primera carga: solo caché, 0 créditos
    try:
        await engine.get_current_top10_from_cache()
        logger.info("Estado inicial: %d oportunidades desde caché (0 créditos).", len(engine.current_state))
    except Exception as exc:
        logger.error("Error en estado inicial: %s", exc)

    while True:
        now_utc = datetime.now(timezone.utc)
        logger.info("=== Ciclo scheduler %s UTC ===", now_utc.strftime("%Y-%m-%d %H:%M"))

        try:
            # ── 1. Control de presupuesto ─────────────────────────────────────
            remaining = SportsDataService._remaining_quota
            if 0 <= remaining <= CREDITS_MIN_TO_FETCH:
                logger.warning(
                    "Créditos agotados (%d restantes). Ciclo saltado — sin llamadas a API. "
                    "Registra una nueva clave en https://the-odds-api.com",
                    remaining,
                )
                await engine.persist_current_state()
                await asyncio.sleep(REFRESH_INTERVAL_SECONDS)
                continue

            # ── 2. Liga del turno (1 crédito) ─────────────────────────────────
            league_key, sport_name, league_name, country_name = _next_league()
            logger.info(
                "Liga en turno: [%s] %s | Créditos restantes: %s",
                sport_name, league_name,
                remaining if remaining >= 0 else "desconocido",
            )

            # ── 3. Petición a la API (solo 1 liga) ────────────────────────────
            new_opps = []
            for api_key in ODDS_API_KEYS:
                try:
                    async with httpx.AsyncClient() as client:
                        league_opps = await SportsDataService._fetch_league(
                            client, league_key, sport_name, league_name, country_name, api_key
                        )
                    if league_opps:
                        new_opps = league_opps
                        logger.info(
                            "OK — %d oportunidades para '%s' (clave %s...)",
                            len(new_opps), league_name, api_key[:6],
                        )
                        break  # Primera clave que funciona, no malgastar más
                except Exception as fetch_exc:
                    logger.warning("Clave %s... falló para '%s': %s", api_key[:6], league_name, fetch_exc)

            # ── 4. Fusión con estado global (preserva otras ligas) ────────────
            if new_opps:
                other_leagues = [o for o in engine.current_state if o.comp != league_name]
                engine.current_state = other_leagues + new_opps
                engine._is_real_data = True
                engine._real_data_timestamp = now_utc.isoformat() + "Z"
                logger.info(
                    "Estado fusionado: %d oportunidades totales (%d de '%s' + %d de otras ligas).",
                    len(engine.current_state), len(new_opps), league_name, len(other_leagues),
                )
            else:
                logger.warning("No se obtuvieron datos para '%s'. Estado anterior conservado.", league_name)

            # ── 5. Persistir en Firestore ─────────────────────────────────────
            await engine.persist_current_state()
            logger.info("Persistido en Firestore: %d oportunidades.", len(engine.current_state))

            # ── 6. Limpieza de entradas >48h ──────────────────────────────────
            deleted = FirebaseWrapper.delete_old_opportunities(48)
            if deleted > 0:
                logger.info("Limpieza: %d oportunidades antiguas eliminadas.", deleted)

        except Exception as exc:
            logger.error("Error inesperado en ciclo scheduler: %s", exc)

        # Esperar al siguiente ciclo
        await asyncio.sleep(REFRESH_INTERVAL_SECONDS)
