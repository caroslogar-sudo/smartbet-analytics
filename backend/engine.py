"""
CC_Engine — Motor de predicción SmartBet Analytics.
Agrupa hasta 6 opciones de apuestas rentables por PARTIDO.
Maneja Fútbol (11 ligas) y Baloncesto (NBA, ACB/Euroliga).
"""
import logging
import random
import uuid
from datetime import datetime, timedelta
from typing import List
from models import Opportunity, BookmakerOdds, Top10Response
from services.firebase_wrapper import FirebaseWrapper
from services.sports_api import SportsDataService

logger = logging.getLogger(__name__)

# Mercados extra que no están en la API gratuita pero simulamos para llegar a 6 por partido
EXTRA_MARKETS = [
    ("Corners Total", "corners", "Over 9.5 corners", (1.75, 2.10)),
    ("Tarjetas Total", "tarjetas", "Over 4.5 tarjetas", (1.80, 2.20)),
    ("Goleador", "goleador", "Anota en cualquier momento", (2.50, 4.00)),
    ("Ganador 1ª Parte", "parcial", "Empate al Descanso", (2.00, 2.30)),
]

BOOKMAKERS_MOCK = ["Bet365", "Bwin", "Betfair", "Sportium", "Pinnacle"]

class CC_Engine:
    def __init__(self):
        self.current_state: list[Opportunity] = []
        self.cycle_count = 0
        self._is_real_data = False
        self._real_data_timestamp: str | None = None

    async def get_current_top10_from_cache(self) -> Top10Response:
        self.cycle_count += 1
        # Por simplicidad, siempre llamaremos a los datos almacenados
        return self._build_response()

    async def get_current_top10_real(self) -> Top10Response:
        self.cycle_count += 1
        logger.info(f"Ciclo {self.cycle_count}: solicitando datos REALES.")

        real_opps = await SportsDataService.fetch_real_opportunities()

        if real_opps:
            # Agrupar por partido
            matches = {}
            for opp in real_opps:
                match_id = f"{opp.home} vs {opp.away}"
                if match_id not in matches:
                    matches[match_id] = []
                matches[match_id].append(opp)

            # Para cada partido, asegurar que tenemos 6 opciones (rellenando con simuladas)
            final_opps = []
            for match_id, opps in matches.items():
                existing_markets = {o.market_category for o in opps}
                simulated_needed = 6 - len(opps)
                
                # Coger una base
                base = opps[0]
                added = 0
                for market_name, market_cat, pred_suffix, odds_range in EXTRA_MARKETS:
                    if added >= simulated_needed:
                        break
                    if market_cat not in existing_markets:
                        pred = pred_suffix
                        if market_cat == "goleador":
                            pred = f"Delantero Estrella {pred_suffix}"
                        
                        sim_opp = self._generate_simulated_opp_for_match(base, market_name, market_cat, pred, odds_range)
                        opps.append(sim_opp)
                        added += 1

                final_opps.extend(opps[:6])

            self.current_state = final_opps
            self._is_real_data = True
            self._real_data_timestamp = datetime.utcnow().isoformat() + "Z"
        else:
            logger.warning("API sin datos reales.")

        await self.persist_current_state()
        return self._build_response()

    def _generate_simulated_opp_for_match(self, base_opp: Opportunity, market_name: str, market_category: str, prediction: str, odds_range: tuple) -> Opportunity:
        lo, hi = odds_range
        base_odds = round(random.uniform(lo, hi), 2)

        bk_list: list[BookmakerOdds] = []
        best_odds = 0.0
        best_bk = ""
        for bk in BOOKMAKERS_MOCK:
            variation = round(random.uniform(-0.10, 0.10), 2)
            bk_odds = max(1.01, round(base_odds + variation, 2))
            bk_list.append(BookmakerOdds(bookmaker=bk, odds=bk_odds))
            if bk_odds > best_odds:
                best_odds = bk_odds
                best_bk = bk

        cc = random.randint(72, 88)
        b = best_odds - 1.0
        implied_p = 1.0 / base_odds
        model_p = min(implied_p + 0.04, 0.98)
        kelly_raw = ((b * model_p) - (1.0 - model_p)) / b if b > 0 else 0
        kelly = round(max(min(kelly_raw * 0.25, 0.05), 0.005), 3)

        return Opportunity(
            id=f"{base_opp.id[:5]}_{market_category[:2]}",
            home=base_opp.home, away=base_opp.away, comp=base_opp.comp, sport=base_opp.sport,
            market=market_name, market_category=market_category,
            prediction=prediction,
            cc=cc, odds=best_odds, bookmaker=best_bk,
            is_live=False, kelly_fraction=kelly,
            commence_time=base_opp.commence_time,
            bookmaker_odds=sorted(bk_list, key=lambda x: x.odds, reverse=True),
        )

    async def persist_current_state(self) -> None:
        if not self.current_state: return
        try:
            opp_dicts = [opp.model_dump() for opp in self.current_state]
            FirebaseWrapper.set_top_10(opp_dicts, is_fallback=not self._is_real_data)
        except Exception as e:
            logger.error(f"Error Firestore: {e}")

    async def get_current_top10(self) -> Top10Response:
        return await self.get_current_top10_from_cache()

    def _build_response(self) -> Top10Response:
        return Top10Response(
            timestamp=datetime.utcnow().isoformat() + "Z",
            opportunities=self.current_state,
        )

engine = CC_Engine()
