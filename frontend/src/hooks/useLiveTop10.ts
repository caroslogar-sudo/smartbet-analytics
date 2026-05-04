import { useState, useEffect, useCallback } from 'react';
import { firebaseService } from '../services/firebaseService';

export interface BookmakerOdds {
  bookmaker: string;
  odds: number;
}

export interface Opportunity {
  id: string;
  home: string;
  away: string;
  comp: string;
  sport: string;
  market: string;
  /** Categoría semántica del mercado para iconografía */
  market_category: MarketCategory;
  prediction: string;
  cc: number;
  odds: number;
  bookmaker: string;
  is_live: boolean;
  kelly_fraction?: number;
  commence_time?: string;
  /** Comparativa de cuotas por casa de apuestas */
  bookmaker_odds: BookmakerOdds[];
}

export type MarketCategory =
  | 'ganador'
  | 'goles'
  | 'corners'
  | 'tarjetas'
  | 'goleador'
  | 'handicap'
  | 'parcial'
  | 'especial'
  | 'props';

/* ─── Mock Data Factory ─── */

const SPORTS_DATA: Record<string, {
  teams: string[];
  comps: string[];
  markets: [string, MarketCategory, string][];
}> = {
  "Fútbol": {
    teams: ["R. Madrid", "Barcelona", "Liverpool", "Arsenal", "Bayern", "PSG", "Sevilla", "Juventus", "Inter", "AC Milan", "Porto", "Benfica", "Ajax", "PSV", "España", "Brasil", "Argentina", "Francia", "Inglaterra"],
    comps: ["LaLiga", "LaLiga 2", "Premier League", "Bundesliga", "Ligue 1", "Serie A", "Primeira Liga", "Pro League", "Eredivisie", "Champions League", "Europa League", "Mundial", "Eurocopa", "Copa América"],
    markets: [
      ["Ganador Partido",   "ganador",   "Victoria Local"],
      ["Total Goles",       "goles",     "Over 2.5"],
      ["Ambos Marcan",      "goles",     "Sí"],
      ["Corners Total",     "corners",   "Over 10.5"],
      ["Tarjetas Total",    "tarjetas",  "Over 3.5"],
      ["Handicap Asiático", "handicap",  "Local -0.5"],
      ["Ganador 1ª Parte",  "parcial",   "Empate Descanso"],
    ],
  },
  "Baloncesto": {
    teams: ["Lakers", "Celtics", "Warriors", "Bulls", "Real Madrid", "Panathinaikos", "Barcelona", "Olympiacos", "Maccabi"],
    comps: ["NBA", "Euroleague", "Liga ACB"],
    markets: [
      ["Ganador",       "ganador",  "Victoria Local"],
      ["Total Puntos",  "goles",    "Over 224.5"],
      ["Handicap",      "handicap", "-5.5"],
    ],
  },
  "Fórmula 1": {
    teams: ["Verstappen", "Norris", "Leclerc", "Sainz", "Hamilton", "Alonso"],
    comps: ["Campeonato Mundial FIA"],
    markets: [
      ["Ganador Carrera", "ganador",  "Primero"],
      ["Podio",           "especial", "Sí"],
      ["Head-to-Head",    "handicap", "Piloto 1 supera a Piloto 2"],
    ],
  },
  "NFL": {
    teams: ["Chiefs", "Eagles", "49ers", "Ravens", "Bills", "Bengals"],
    comps: ["Temporada Regular", "Playoffs"],
    markets: [
      ["Ganador",        "ganador",   "Victoria Local"],
      ["Total Puntos",   "goles",     "Over 45.5"],
      ["Spread",         "handicap",  "-3.5"],
    ],
  },
};

const BOOKMAKER_NAMES = ["Bet365", "Bwin", "Betfair", "Sportium", "Pinnacle"];

export const generateMockOpportunities = (): Opportunity[] => {
  const sportsKeys = Object.keys(SPORTS_DATA);
  return Array.from({ length: 48 }).map((_, index) => {
    const sport = sportsKeys[index % sportsKeys.length];
    const data = SPORTS_DATA[sport];
    const [market, market_category, prediction] = data.markets[index % data.markets.length];
    const baseOdds = 1.50 + (index % 7) * 0.25;

    const bookmaker_odds: BookmakerOdds[] = BOOKMAKER_NAMES.map((bk, bi) => ({
      bookmaker: bk,
      odds: Math.max(1.01, +(baseOdds + (bi - 2) * 0.04).toFixed(2)),
    }));
    const best = bookmaker_odds.reduce((a, b) => a.odds >= b.odds ? a : b);

    return {
      id: `mock-${index + 1}`,
      home: data.teams[index % data.teams.length],
      away: data.teams[(index + 1) % data.teams.length],
      comp: data.comps[index % data.comps.length],
      sport,
      market,
      market_category,
      prediction,
      cc: Math.floor(Math.random() * (99 - 70) + 70),
      odds: best.odds,
      bookmaker: best.bookmaker,
      is_live: index % 3 === 0,
      kelly_fraction: 0.025,
      bookmaker_odds,
    };
  }).sort((a, b) => b.cc - a.cc);
};

/* ─── Hook ─── */

type DataSource = 'firestore' | 'mock' | 'connecting' | 'empty_firestore';

export const useLiveTop10 = () => {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [dataSource, setDataSource] = useState<DataSource>('connecting');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const subscription = firebaseService.subscribeToTop10(
      (firestoreData) => {
        if (firestoreData.length > 0) {
          setOpportunities(firestoreData as Opportunity[]);
          setDataSource('firestore');
          setError(null);
        } else {
          console.info("ℹ️ Firestore vacío. Mostrando lista vacía para datos reales.");
          setOpportunities([]);
          setDataSource('empty_firestore');
          setError(null);
        }
        setIsConnected(true);
      },
      (firestoreError) => {
        console.warn("Firestore error:", firestoreError.message);
        setOpportunities([]);
        setDataSource('mock');
        setIsConnected(true);
        setError("Error de conexión. Mostrando lista vacía.");
      }
    );

    if (!subscription.isRealConnection) {
      console.info("🔌 Firestore no configurado. Modo offline (lista vacía).");
      setOpportunities([]);
      setDataSource('mock');
      setIsConnected(true);
    }

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const refresh = useCallback(() => {
    setIsConnected(false);
    setTimeout(() => {
      if (dataSource === 'mock' || dataSource === 'empty_firestore') {
        setOpportunities([]);
      }
      setIsConnected(true);
    }, 1500);
  }, [dataSource]);

  return { opportunities, isConnected, dataSource, error, refresh };
};
