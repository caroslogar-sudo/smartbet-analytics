from pydantic import BaseModel
from typing import List, Optional, Dict


class BookmakerOdds(BaseModel):
    """Cuota de una casa de apuestas específica para un mercado concreto."""
    bookmaker: str
    odds: float


class Opportunity(BaseModel):
    id: str
    home: str
    away: str
    comp: str
    sport: str
    # Tipo de mercado semántico (enum-like string: "Ganador", "Total Goles", "Corners Total", etc.)
    market: str
    # Categoría de mercado para iconografía en el frontend
    market_category: str = "ganador"  # ganador | goles | corners | tarjetas | goleador | handicap | parcial | props
    prediction: str
    cc: int
    odds: float
    bookmaker: str
    is_live: bool = False
    kelly_fraction: float = 0.0
    commence_time: Optional[str] = None
    # Comparativa real de cuotas por casa de apuestas
    bookmaker_odds: List[BookmakerOdds] = []
    # Razón estadística para el frontend
    statisticalReason: str = "Análisis basado en consenso de modelos predictivos."


class Top10Response(BaseModel):
    timestamp: str
    opportunities: List[Opportunity]


class StatusResponse(BaseModel):
    status: str
    last_update: Optional[str]
    opportunity_count: int
    engine_cycles: int
    firebase_connected: bool
