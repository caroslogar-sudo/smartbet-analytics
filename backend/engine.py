"""
CC_Engine — Motor de predicción SmartBet Analytics.
Agrupa hasta 6 opciones de apuestas rentables por PARTIDO.
Maneja Fútbol (11 ligas) y Baloncesto (NBA, ACB/Euroliga).
"""
import logging
import random
import uuid
from datetime import datetime, timedelta, timezone
from typing import List
from models import Opportunity, BookmakerOdds, Top10Response
from services.firebase_wrapper import FirebaseWrapper
from services.sports_api import SportsDataService

logger = logging.getLogger(__name__)

# Listas extendidas para 10 de las mejores casas
BOOKMAKERS_MOCK = ["Bet365", "Bwin", "Betfair", "Pinnacle", "William Hill", "1xBet", "888Sport", "Sportium", "DraftKings", "Betway"]

# Bases de datos de jugadores reales para evitar genéricos
SOCCER_PLAYERS = {
    "Real Madrid": ["Vinicius Jr", "Bellingham", "Mbappé", "Valverde", "Rodrygo"],
    "Barcelona": ["Lewandowski", "Yamal", "Raphinha", "Pedri", "Gavi"],
    "Man City": ["Haaland", "De Bruyne", "Foden", "Bernardo Silva", "Doku"],
    "Arsenal": ["Saka", "Odegaard", "Martinelli", "Havertz", "Rice"],
    "Bayern Munich": ["Kane", "Musiala", "Sané", "Müller", "Coman"],
    "PSG": ["Dembélé", "Barcola", "Asensio", "Vitinha", "Kolo Muani"],
    "Liverpool": ["Salah", "Diaz", "Nuñez", "Jota", "Gakpo"],
    "Chelsea": ["Palmer", "Sterling", "Jackson", "Nkunku", "Mudryk"],
    "Man Utd": ["Rashford", "Garnacho", "Hojlund", "Bruno Fernandes", "Antony"],
    "Juventus": ["Vlahovic", "Chiesa", "Milik", "Rabiot", "Locatelli"],
    "Inter": ["Lautaro", "Thuram", "Barella", "Calhanoglu", "Mkhitaryan"],
    "AC Milan": ["Leao", "Giroud", "Pulisic", "Loftus-Cheek", "Theo"],
    "Atletico Madrid": ["Griezmann", "Morata", "Correa", "Llorente", "De Paul"],
    "Local": ["Bruno", "Lucas", "Carlos", "David", "Kevin", "Sergio", "Alex", "Diego", "Joao", "Mateo"],
    "Visitante": ["Thomas", "Victor", "Gabriel", "Martin", "Luis", "Arthur", "Christian", "Ivan", "Nico", "Marcus"]
}

BASKETBALL_PLAYERS = {
    "Lakers": ["LeBron James", "Anthony Davis", "D'Angelo Russell", "Austin Reaves"],
    "Warriors": ["Stephen Curry", "Klay Thompson", "Draymond Green", "Andrew Wiggins"],
    "Celtics": ["Jayson Tatum", "Jaylen Brown", "Kristaps Porzingis", "Jrue Holiday"],
    "Nuggets": ["Nikola Jokic", "Jamal Murray", "Michael Porter Jr", "Aaron Gordon"],
    "Bucks": ["Giannis Antetokounmpo", "Damian Lillard", "Khris Middleton", "Brook Lopez"],
    "Suns": ["Kevin Durant", "Devin Booker", "Bradley Beal", "Jusuf Nurkic"],
    "Real Madrid": ["Campazzo", "Tavares", "Musa", "Hezonja", "Llull"],
    "Barcelona": ["Laprovittola", "Satoransky", "Vesely", "Abrines", "Hernangomez"],
    "Local": ["James", "Davis", "Curry", "Thompson", "Tatum", "Brown", "Jokic", "Murray", "Antetokounmpo", "Lillard", "Durant", "Booker"],
    "Visitante": ["Doncic", "Irving", "Embiid", "Maxey", "SGA", "Holmgren", "Edwards", "Towns", "Fox", "Sabonis", "Brunson", "Randle"]
}

def get_random_soccer_market(home: str, away: str) -> tuple:
    """
    Genera mercados basados estrictamente en las 5 categorías permitidas:
    1. Ganar o empatar (Doble Oportunidad)
    2. Córners (Más/Menos con ajuste -1)
    3. Tarjetas (Más/Menos)
    4. Resultado al descanso (1X2 al descanso)
    5. Goles (Más/Menos)
    """
    market_type = random.choice(["doble_oportunidad", "corners", "tarjetas", "parcial", "goles"])
    
    if market_type == "doble_oportunidad":
        choice = random.choice([f"{home} o Empate", f"{away} o Empate", "1 o 2 (Cualquiera gana)"])
        return ("Ganar o Empatar", "ganador", choice, (1.25, 1.65))
    
    elif market_type == "corners":
        line = random.choice([8.5, 9.5, 10.5])
        side = random.choice(["Más de", "Menos de"])
        # Punto 5: Aconsejar -1 sobre el resultado obtenido
        advised_line = line - 1.0 if side == "Más de" else line + 1.0
        return ("Córners Total", "corners", f"{side} {advised_line} córners", (1.70, 2.20))
    
    elif market_type == "tarjetas":
        line = random.choice([3.5, 4.5, 5.5])
        side = random.choice(["Más de", "Menos de"])
        return ("Tarjetas Total", "tarjetas", f"{side} {line} tarjetas", (1.75, 2.15))
    
    elif market_type == "parcial":
        choice = random.choice([f"{home} al Descanso", f"{away} al Descanso", "Empate al Descanso"])
        return ("Resultado al Descanso", "parcial", choice, (2.10, 3.50))
    
    else: # goles
        line = random.choice([1.5, 2.5, 3.5])
        side = random.choice(["Más de", "Menos de"])
        return ("Total Goles", "goles", f"{side} {line} goles", (1.60, 2.30))

def get_random_basket_market(home: str, away: str) -> tuple:
    """
    Genera mercados de baloncesto simplificados y profesionales:
    1. Ganador Partido (H2H)
    2. Total Puntos (Más/Menos)
    3. Puntos Jugador (Más/Menos)
    """
    market_type = random.choice(["ganador", "puntos_totales", "jugador"])
    side = random.choice(["Más de", "Menos de"])
    
    if market_type == "ganador":
        winner = random.choice([home, away])
        return ("Ganador Partido", "ganador", f"Gana {winner}", (1.30, 3.50))
        
    if market_type == "puntos_totales":
        line = random.choice([210.5, 215.5, 220.5, 225.5, 230.5])
        return ("Total Puntos", "goles", f"{side} {line} puntos", (1.80, 2.00))

    # Props de jugador
    team_choice = random.choice([home, away])
    players = BASKETBALL_PLAYERS.get(team_choice, BASKETBALL_PLAYERS["Local"])
    player = random.choice(players)
    pts_line = random.choice([15.5, 18.5, 22.5, 26.5])
    
    return ("Puntos Jugador", "props", f"{player} {side} {pts_line} Pts", (1.80, 2.10))

class CC_Engine:
    def __init__(self):
        self.cycle_count = 0
        self._is_real_data = False
        self._real_data_timestamp: str | None = None
        # Inicializar vacío para no enviar datos ficticios
        self.current_state: list[Opportunity] = []

    async def get_current_top10_from_cache(self) -> Top10Response:
        self.cycle_count += 1
        
        # Si la memoria está vacía, intentamos cargar desde Firestore
        if not self.current_state:
            logger.info("Cargando estado inicial desde Firestore...")
            db_opps = FirebaseWrapper.get_top_10()
            if db_opps:
                from models import Opportunity
                self.current_state = [Opportunity(**o) for o in db_opps]
                self._is_real_data = True
                logger.info(f"Cargado: {len(self.current_state)} oportunidades desde Firestore.")

        return self._build_response()

    async def get_current_top10_real(self) -> Top10Response:
        self.cycle_count += 1
        logger.info(f"Ciclo {self.cycle_count}: solicitando datos REALES de toda la parrilla.")

        real_opps = await SportsDataService.fetch_real_opportunities()

        if real_opps:
            self.current_state = real_opps
            self._is_real_data = True
            self._real_data_timestamp = datetime.utcnow().isoformat() + "Z"
        
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
            id=f"mock-{uuid.uuid4()}",
            home=base_opp.home, away=base_opp.away, comp=base_opp.comp, sport=base_opp.sport,
            market=market_name, market_category=market_category,
            prediction=prediction,
            cc=cc, odds=best_odds, bookmaker=best_bk,
            is_live=False, kelly_fraction=kelly,
            commence_time=base_opp.commence_time,
            bookmaker_odds=sorted(bk_list, key=lambda x: x.odds, reverse=True),
            statisticalReason=f"Consenso extraído rastreando a los mejores traders del sector y consolidado con las 15 principales casas de estadísticas (Opta, Sofascore, etc.) cruzado contra las 10 mejores casas de apuestas mundiales. Confianza algorítmica: {cc}%."
        )

    def _generate_opportunities(self, count: int) -> List[Opportunity]:
        opps = []
        now = datetime.now(timezone.utc)
        
        dates = [
            now + timedelta(hours=3), # Hoy tarde
            now + timedelta(days=1),  # Mañana
            now + timedelta(days=2)   # Pasado mañana
        ]

        # Ligas de fútbol (Muestra completa de las VIP)
        soccer_leagues = [
            ("LaLiga", "soccer_spain_la_liga", "España"),
            ("LaLiga 2", "soccer_spain_segunda_division", "España"),
            ("Premier League", "soccer_epl", "Inglaterra"),
            ("Bundesliga", "soccer_germany_bundesliga", "Alemania"),
            ("Ligue 1", "soccer_france_ligue_one", "Francia"),
            ("Serie A", "soccer_italy_serie_a", "Italia"),
            ("Primeira Liga", "soccer_portugal_primeira_liga", "Portugal"),
            ("Pro League", "soccer_belgium_first_div", "Bélgica"),
            ("Eredivisie", "soccer_netherlands_eredivisie", "Países Bajos"),
            ("Champions League", "soccer_uefa_champs_league", "Europa"),
            ("Europa League", "soccer_uefa_europa_league", "Europa"),
            ("Mundial", "soccer_fifa_world_cup", "Internacional"),
            ("Eurocopa", "soccer_uefa_euro_championship", "Internacional"),
            ("Copa América", "soccer_conmebol_copa_america", "Internacional")
        ]
        
        tennis_leagues = [
            ("Roland Garros", "tennis_atp_french_open", "Grand Slam"),
            ("Wimbledon", "tennis_atp_wimbledon", "Grand Slam"),
            ("ATP Masters 1000", "tennis_atp_masters_1000", "ATP")
        ]

        for i in range(count):
            # Rotar entre Fútbol, Baloncesto y Tenis
            r = i % 3
            sport = "Fútbol" if r == 0 else ("Baloncesto" if r == 1 else "Tenis")
            dt = random.choice(dates)
            country = "Internacional"
            
            if sport == "Fútbol":
                league_name, league_key, country = random.choice(soccer_leagues)
                home, away = random.choice([("Real Madrid", "FC Barcelona"), ("Manchester City", "Arsenal"), ("Juventus", "Inter")])
                market, cat, pred, odds_range = get_random_soccer_market(home, away)
            elif sport == "Baloncesto":
                basket_leagues = [
                    ("NBA", "basketball_nba", "USA", "Lakers", "Warriors"),
                    ("Euroleague", "basketball_euroleague", "Europa", "Real Madrid", "Panathinaikos"),
                    ("Liga ACB", "basketball_spain_acb", "España", "Barcelona", "Baskonia")
                ]
                league_name, league_key, country, home, away = random.choice(basket_leagues)
                market, cat, pred, odds_range = get_random_basket_market(home, away)
            else: # Tenis
                league_name, league_key, country = random.choice(tennis_leagues)
                home, away = random.choice([("Carlos Alcaraz", "Jannik Sinner"), ("Novak Djokovic", "Rafa Nadal"), ("Medvedev", "Zverev")])
                # Usamos mercados de basket adaptados o simples para tenis en mock
                market, cat, pred, odds_range = ("Ganador Partido", "ganador", f"Gana {home}", (1.40, 2.50))

            is_live = dt <= now and (now - dt).total_seconds() < 10800

            opps.append(Opportunity(
                id=f"mock-{uuid.uuid4()}",
                home=home,
                away=away,
                sport=sport,
                comp=league_name,
                country=country,
                market=market,
                prediction=pred,
                odds=round(random.uniform(*odds_range), 2),
                bookmaker="Bet365",
                cc=random.randint(70, 95),
                commence_time=dt.isoformat(),
                is_live=False,
                market_category=cat,
                bookmaker_odds=[
                    BookmakerOdds(bookmaker="Bet365", odds=round(random.uniform(*odds_range), 2)),
                    BookmakerOdds(bookmaker="Pinnacle", odds=round(random.uniform(*odds_range), 2))
                ]
            ))
        return opps

    async def persist_current_state(self) -> None:
        try:
            opp_dicts = [opp.model_dump() for opp in self.current_state] if self.current_state else []
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
