"""
Scheduler del engine de SmartBet Analytics.

Modo CONSERVADOR DE CRÉDITOS:
- El scheduler NO llama a la API real de forma automática.
- Solo refresca el estado interno del engine (mantiene los datos ya cargados).
- La API real se llama ÚNICAMENTE cuando el usuario activa /api/refresh-manual.

Esto garantiza 0 consumo de créditos en background.
"""
import asyncio
import logging
from engine import engine

logger = logging.getLogger(__name__)

# Intervalo de "heartbeat" interno: solo mantiene el estado en Firestore sin llamar a la API.
# En producción con créditos disponibles, cambiar a 3600 (1 hora) o 43200 (12 horas).
HEARTBEAT_INTERVAL_SECONDS = 3600  # 1 hora: solo persiste el estado actual


async def run_engine_cycle_loop() -> None:
    """
    Background loop de baja frecuencia.
    NO consume créditos de API — solo mantiene el estado persistido en Firestore
    para que el frontend siempre tenga datos disponibles.

    Para obtener datos reales, usar el endpoint: POST /api/refresh-manual
    """
    logger.info(
        f"Scheduler iniciado en modo conservador — "
        f"heartbeat cada {HEARTBEAT_INTERVAL_SECONDS}s "
        f"(sin llamadas automaticas a la API de cuotas)"
    )

    # Primera ejecución: usar datos fallback para que el frontend no quede vacío
    try:
        await engine.get_current_top10_from_cache()
        logger.info("Estado inicial cargado desde fallback/cache.")
    except Exception as exc:
        logger.error(f"Error en estado inicial: {exc}")

    while True:
        try:
            # 1. Limpieza de datos antiguos (ventana de 48h)
            from services.firebase_wrapper import FirebaseWrapper
            deleted_count = FirebaseWrapper.delete_old_opportunities(48)
            if deleted_count > 0:
                logger.info(f"Limpieza: {deleted_count} oportunidades antiguas eliminadas.")

            # 2. Persistencia del estado actual
            await engine.persist_current_state()
            logger.info("Heartbeat: Estado persistido y limpieza ejecutada.")
        except Exception as exc:
            logger.error(f"Error en loop de scheduler: {exc}")
        
        await asyncio.sleep(HEARTBEAT_INTERVAL_SECONDS)
