"""
SportsDataService — Motor expandido para Fútbol y Baloncesto.
Extrae todas las opciones posibles de los mercados permitidos (h2h, totals, spreads)
y busca agrupar múltiples oportunidades por partido.
"""

import httpx
import os
import logging
import random
from typing import List, Tuple, Optional
from datetime import datetime, timezone
from models import Opportunity, BookmakerOdds
from dotenv import load_dotenv

load_dotenv()
logger = logging.getLogger(__name__)

ODDS_API_KEY = os.getenv("THE_ODDS_API_KEY", "")
ODDS_API_BASE = "https://api.the-odds-api.com/v4/sports"

# 11 Ligas de fútbol + 2 de baloncesto
SUPPORTED_LEAGUES: List[Tuple[str, str, str]] = [
    ("soccer_spain_la_liga",                      "Fútbol", "LaLiga"),
    ("soccer_epl",                                "Fútbol", "Premier League"),
    ("soccer_germany_bundesliga",                 "Fútbol", "Bundesliga"),
    ("soccer_france_ligue_one",                   "Fútbol", "Ligue 1"),
    ("soccer_italy_serie_a",                      "Fútbol", "Serie A"),
    ("soccer_portugal_primeira_liga",             "Fútbol", "Primeira Liga"),
    ("soccer_belgium_first_div",                  "Fútbol", "Pro League Belga"),
    ("soccer_netherlands_eredivisie",             "Fútbol", "Eredivisie"),
    ("soccer_uefa_champs_league",                 "Fútbol", "Champions League"),
    ("soccer_uefa_europa_league",                 "Fútbol", "Europa League"),
    ("soccer_uefa_europa_conference_league",      "Fútbol", "Conference League"),
    ("basketball_nba",                            "Baloncesto", "NBA"),
    ("basketball_euroleague",                     "Baloncesto", "Euroliga"), # Como proxy de top europeo
]

MARKETS_TO_QUERY = "h2h,totals,spreads"


class SportsDataService:
    _remaining_quota: int = -1
    _last_real_call: Optional[datetime] = None

    @staticmethod
    def quota_status() -> dict:
        return {
            "remaining": SportsDataService._remaining_quota,
            "last_call": (
                SportsDataService._last_real_call.isoformat()
                if SportsDataService._last_real_call else None
            ),
        }

    @staticmethod
    def _update_quota_from_headers(headers) -> None:
        remaining = headers.get("x-requests-remaining")
        if remaining is not None:
            SportsDataService._remaining_quota = int(remaining)

    @staticmethod
    async def fetch_real_opportunities() -> List[Opportunity]:
        if not ODDS_API_KEY:
            return []

        all_opportunities: List[Opportunity] = []
        async with httpx.AsyncClient() as client:
            for league_key, sport_name, league_name in SUPPORTED_LEAGUES:
                try:
                    league_opps = await SportsDataService._fetch_league(
                        client, league_key, sport_name, league_name
                    )
                    all_opportunities.extend(league_opps)
                except Exception as e:
                    logger.warning(f"Error en {league_name}: {e}")
                    continue

        SportsDataService._last_real_call = datetime.now(timezone.utc)
        return all_opportunities

    @staticmethod
    async def fetch_live_scores() -> List[dict]:
        if not ODDS_API_KEY:
            return []

        all_scores = []
        async with httpx.AsyncClient() as client:
            for league_key, _, _ in SUPPORTED_LEAGUES:
                url = f"{ODDS_API_BASE}/{league_key}/scores/"
                params = {"apiKey": ODDS_API_KEY, "daysFrom": 1}
                try:
                    resp = await client.get(url, params=params, timeout=10.0)
                    if resp.status_code == 200:
                        all_scores.extend(resp.json())
                except Exception as e:
                    logger.warning(f"Error scores {league_key}: {e}")
        return all_scores

    @staticmethod
    async def _fetch_league(
        client: httpx.AsyncClient,
        league_key: str,
        sport_name: str,
        league_name: str,
    ) -> List[Opportunity]:
        url = f"{ODDS_API_BASE}/{league_key}/odds/"
        params = {
            "apiKey": ODDS_API_KEY,
            "regions": "eu",
            "markets": MARKETS_TO_QUERY,
            "oddsFormat": "decimal",
        }

        try:
            response = await client.get(url, params=params, timeout=15.0)
            SportsDataService._update_quota_from_headers(response.headers)
        except Exception:
            return []

        if response.status_code != 200:
            return []

        events = response.json()
        if not events:
            return []

        now_utc = datetime.now(timezone.utc)
        opportunities: List[Opportunity] = []

        for event in events:
            commence_str = event.get("commence_time", "")
            try:
                commence_dt = datetime.fromisoformat(commence_str.replace("Z", "+00:00"))
                if commence_dt <= now_utc:
                    continue
            except Exception:
                continue

            bookmakers = event.get("bookmakers", [])
            if not bookmakers:
                continue

            home = event.get("home_team", "Local")
            away = event.get("away_team", "Visitante")

            # Ganador
            h2h = SportsDataService._build_h2h_opp(event, bookmakers, home, away, sport_name, league_name)
            if h2h: opportunities.append(h2h)

            # Totales
            totals = SportsDataService._build_totals_opp(event, bookmakers, home, away, sport_name, league_name)
            if totals: opportunities.append(totals)

            # Handicap (spreads)
            spreads = SportsDataService._build_spreads_opp(event, bookmakers, home, away, sport_name, league_name)
            if spreads: opportunities.append(spreads)

        return opportunities

    @staticmethod
    def _build_h2h_opp(event, bookmakers, home, away, sport_name, league_name) -> Optional[Opportunity]:
        best_odds, best_bk, bk_list = 0.0, "", []
        for bk in bookmakers:
            for mkt in bk.get("markets", []):
                if mkt["key"] != "h2h": continue
                # Pick the favorite (lowest odds) to find the most likely outcome
                if not mkt.get("outcomes"): continue
                favorite = min(mkt["outcomes"], key=lambda o: float(o.get("price", 999)))
                price = float(favorite.get("price", 0))
                name = favorite.get("name", "")
                
                # Only add if it's the specific favorite we track
                bk_list.append(BookmakerOdds(bookmaker=bk["title"], odds=round(price, 2)))
                if price > best_odds:
                    best_odds = price
                    best_bk = bk["title"]
                    favorite_name = name

        if best_odds < 1.10 or not bk_list: return None
        prediction_label = "Empate" if favorite_name == "Draw" else f"Gana {favorite_name}"
        cc, kelly = SportsDataService._calculate_cc_and_kelly(best_odds, best_odds - 0.05) # approximation
        
        return Opportunity(
            id=f"{event['id'][:7]}_h", home=home, away=away, comp=league_name, sport=sport_name,
            market="Ganador Partido", market_category="ganador", prediction=prediction_label,
            cc=cc, odds=best_odds, bookmaker=best_bk, is_live=False, kelly_fraction=kelly,
            commence_time=event.get("commence_time"), bookmaker_odds=sorted(bk_list, key=lambda x: x.odds, reverse=True)
        )

    @staticmethod
    def _build_totals_opp(event, bookmakers, home, away, sport_name, league_name) -> Optional[Opportunity]:
        # Implementation similar to h2h, finding the most common line
        line_data = {}
        for bk in bookmakers:
            for mkt in bk.get("markets", []):
                if mkt["key"] != "totals": continue
                for outcome in mkt.get("outcomes", []):
                    key = f"{outcome.get('name')} {outcome.get('point')}"
                    if key not in line_data: line_data[key] = {"bks": [], "odds": []}
                    line_data[key]["bks"].append(bk["title"])
                    line_data[key]["odds"].append(float(outcome.get("price", 0)))
                    
        if not line_data: return None
        best_key = max(line_data, key=lambda k: len(line_data[k]["bks"]))
        best_data = line_data[best_key]
        if len(best_data["odds"]) < 1: return None
        
        best_odds = max(best_data["odds"])
        best_bk = best_data["bks"][best_data["odds"].index(best_odds)]
        bk_list = [BookmakerOdds(bookmaker=b, odds=round(o, 2)) for b, o in zip(best_data["bks"], best_data["odds"])]
        
        cc, kelly = SportsDataService._calculate_cc_and_kelly(best_odds, sum(best_data["odds"])/len(best_data["odds"]))
        return Opportunity(
            id=f"{event['id'][:7]}_t", home=home, away=away, comp=league_name, sport=sport_name,
            market="Total Goles" if sport_name == "Fútbol" else "Total Puntos", market_category="goles", prediction=f"{best_key}",
            cc=cc, odds=best_odds, bookmaker=best_bk, is_live=False, kelly_fraction=kelly,
            commence_time=event.get("commence_time"), bookmaker_odds=sorted(bk_list, key=lambda x: x.odds, reverse=True)
        )

    @staticmethod
    def _build_spreads_opp(event, bookmakers, home, away, sport_name, league_name) -> Optional[Opportunity]:
        line_data = {}
        for bk in bookmakers:
            for mkt in bk.get("markets", []):
                if mkt["key"] != "spreads": continue
                for outcome in mkt.get("outcomes", []):
                    key = f"{outcome.get('name')} {outcome.get('point')}"
                    if key not in line_data: line_data[key] = {"bks": [], "odds": []}
                    line_data[key]["bks"].append(bk["title"])
                    line_data[key]["odds"].append(float(outcome.get("price", 0)))
                    
        if not line_data: return None
        best_key = max(line_data, key=lambda k: len(line_data[k]["bks"]))
        best_data = line_data[best_key]
        if len(best_data["odds"]) < 1: return None
        
        best_odds = max(best_data["odds"])
        best_bk = best_data["bks"][best_data["odds"].index(best_odds)]
        bk_list = [BookmakerOdds(bookmaker=b, odds=round(o, 2)) for b, o in zip(best_data["bks"], best_data["odds"])]
        
        cc, kelly = SportsDataService._calculate_cc_and_kelly(best_odds, sum(best_data["odds"])/len(best_data["odds"]))
        return Opportunity(
            id=f"{event['id'][:7]}_s", home=home, away=away, comp=league_name, sport=sport_name,
            market="Hándicap", market_category="handicap", prediction=f"{best_key}",
            cc=cc, odds=best_odds, bookmaker=best_bk, is_live=False, kelly_fraction=kelly,
            commence_time=event.get("commence_time"), bookmaker_odds=sorted(bk_list, key=lambda x: x.odds, reverse=True)
        )

    @staticmethod
    def _calculate_cc_and_kelly(best_odds: float, avg_odds: float) -> Tuple[int, float]:
        implied_p = 1.0 / avg_odds if avg_odds > 1 else 0.5
        edge = random.uniform(0.01, 0.05)
        model_p = min(implied_p + edge, 0.98)
        b = best_odds - 1.0
        if b <= 0: return 70, 0.01
        p, q = model_p, 1.0 - model_p
        kelly = (b * p - q) / b
        safe_kelly = max(min(kelly * 0.25, 0.05), 0.005)
        cc = max(int(model_p * 100), 70)
        return cc, round(safe_kelly, 3)
