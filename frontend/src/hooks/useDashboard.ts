import { useState, useCallback, useMemo, useEffect } from 'react';
import type { TrendDirection } from '../components/atoms/MetricCard';
import { firebaseService } from '../services/firebaseService';

/* ─── Types ─── */

export type BetResult = 'pending' | 'won' | 'lost' | 'void' | 'cashout';

export interface RegisteredBet {
  id: string;
  event: string;
  sport: string;
  marketType: string;
  prediction: string;
  bookmaker: string;
  odds: number;
  stake: number;
  result: BetResult;
  netProfit: number;
  ccAtBet: number;
  timestamp: string;
}

export interface DashboardMetrics {
  bankrollCurrent: number;
  bankrollInitial: number;
  roiGlobal: number;
  roiTrend: TrendDirection;
  yieldGlobal: number;
  yieldTrend: TrendDirection;
  totalBets: number;
  winRate: number;
  winRateTrend: TrendDirection;
  currentStreak: { type: 'win' | 'loss'; count: number };
  maxDrawdown: number;
  bestMarket: { name: string; roi: number } | null;
  worstMarket: { name: string; roi: number } | null;
  roiByMarket: Record<string, number>;
  winRateByMarket: Record<string, number>;
  bankrollHistory: number[];
}

export type TimeFilter = '7d' | '30d' | '90d' | 'all';
export type MarketFilter = string | 'all';
export type DataSource = 'firestore' | 'localStorage' | 'mock';

/* ─── LocalStorage Persistence (fallback) ─── */

const STORAGE_KEY_BETS = 'smartbet_registered_bets';
const STORAGE_KEY_BANKROLL = 'smartbet_bankroll_initial';
const DEFAULT_BANKROLL = 1000;

const loadBetsFromStorage = (): RegisteredBet[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_BETS);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
};

const saveBetsToStorage = (bets: RegisteredBet[]): void => {
  try {
    localStorage.setItem(STORAGE_KEY_BETS, JSON.stringify(bets));
  } catch (error) {
    console.error('Error guardando apuestas en localStorage:', error);
  }
};

const loadInitialBankroll = (): number => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_BANKROLL);
    return raw ? parseFloat(raw) : DEFAULT_BANKROLL;
  } catch {
    return DEFAULT_BANKROLL;
  }
};

const saveInitialBankroll = (value: number): void => {
  try {
    localStorage.setItem(STORAGE_KEY_BANKROLL, String(value));
  } catch (error) {
    console.error('Error guardando bankroll:', error);
  }
};

/* ─── Mock Data Generator Removed ─── */
// El generador de datos de prueba ha sido eliminado a petición del usuario
// para empezar a trabajar con registros reales a partir de un estado virgen.

/* ─── Firestore data normalizer ─── */

/**
 * Normaliza los datos de Firestore (que pueden tener Timestamps en lugar de strings).
 */
const normalizeFirestoreBet = (raw: any): RegisteredBet => {
  const timestamp = raw.timestamp?.toDate
    ? raw.timestamp.toDate().toISOString()
    : raw.timestamp ?? new Date().toISOString();

  return {
    id: raw.id,
    event: raw.event ?? '',
    sport: raw.sport ?? 'Fútbol',
    marketType: raw.marketType ?? '',
    prediction: raw.prediction ?? '',
    bookmaker: raw.bookmaker ?? '',
    odds: Number(raw.odds ?? 1),
    stake: Number(raw.stake ?? 0),
    result: (raw.result as BetResult) ?? 'pending',
    netProfit: Number(raw.netProfit ?? 0),
    ccAtBet: Number(raw.ccAtBet ?? 75),
    timestamp,
  };
};

/* ─── Calculation Engine ─── */

const calculateMetrics = (
  bets: RegisteredBet[],
  initialBankroll: number,
  timeFilter: TimeFilter,
  marketFilter: MarketFilter
): DashboardMetrics => {
  const now = Date.now();
  const timeRanges: Record<TimeFilter, number> = {
    '7d': 7 * 24 * 60 * 60 * 1000,
    '30d': 30 * 24 * 60 * 60 * 1000,
    '90d': 90 * 24 * 60 * 60 * 1000,
    'all': Infinity,
  };

  const filteredBets = bets
    .filter((b) => b.result !== 'pending')
    .filter((b) => marketFilter === 'all' || b.marketType === marketFilter)
    .filter((b) => now - new Date(b.timestamp).getTime() <= timeRanges[timeFilter])
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  const totalBets = filteredBets.length;
  const wonBets = filteredBets.filter((b) => b.result === 'won').length;
  const totalProfit = filteredBets.reduce((sum, b) => sum + b.netProfit, 0);
  const totalStaked = filteredBets.reduce((sum, b) => sum + b.stake, 0);

  const roiGlobal = totalStaked > 0 ? (totalProfit / totalStaked) * 100 : 0;
  const yieldGlobal = totalBets > 0 ? totalProfit / totalBets : 0;
  const winRate = totalBets > 0 ? (wonBets / totalBets) * 100 : 0;

  // Current streak
  let currentStreak = { type: 'win' as 'win' | 'loss', count: 0 };
  for (let i = filteredBets.length - 1; i >= 0; i--) {
    const betResult = filteredBets[i].result === 'won' ? 'win' : 'loss';
    if (currentStreak.count === 0) {
      currentStreak = { type: betResult, count: 1 };
    } else if (betResult === currentStreak.type) {
      currentStreak.count++;
    } else {
      break;
    }
  }

  // Bankroll history
  const bankrollHistory: number[] = [initialBankroll];
  let running = initialBankroll;
  for (const bet of filteredBets) {
    running += bet.netProfit;
    bankrollHistory.push(+running.toFixed(2));
  }

  // Max drawdown
  let peak = initialBankroll;
  let maxDrawdown = 0;
  for (const val of bankrollHistory) {
    if (val > peak) peak = val;
    const drawdown = ((peak - val) / peak) * 100;
    if (drawdown > maxDrawdown) maxDrawdown = drawdown;
  }

  // ROI & Win rate by market (uses ALL non-pending bets, ignoring filters)
  const roiByMarket: Record<string, number> = {};
  const winRateByMarket: Record<string, number> = {};
  const byMarket: Record<string, { profit: number; staked: number; won: number; total: number }> = {};

  for (const bet of bets.filter((b) => b.result !== 'pending')) {
    if (!byMarket[bet.marketType]) {
      byMarket[bet.marketType] = { profit: 0, staked: 0, won: 0, total: 0 };
    }
    byMarket[bet.marketType].profit += bet.netProfit;
    byMarket[bet.marketType].staked += bet.stake;
    byMarket[bet.marketType].total++;
    if (bet.result === 'won') byMarket[bet.marketType].won++;
  }

  for (const [market, stats] of Object.entries(byMarket)) {
    roiByMarket[market] = stats.staked > 0 ? (stats.profit / stats.staked) * 100 : 0;
    winRateByMarket[market] = stats.total > 0 ? (stats.won / stats.total) * 100 : 0;
  }

  const marketEntries = Object.entries(roiByMarket).filter(([, roi]) => !isNaN(roi));
  const sortedMarkets = [...marketEntries].sort(([, a], [, b]) => b - a);
  const bestMarket =
    sortedMarkets.length > 0
      ? { name: sortedMarkets[0][0], roi: +sortedMarkets[0][1].toFixed(1) }
      : null;
  const worstMarket =
    sortedMarkets.length > 0
      ? {
          name: sortedMarkets[sortedMarkets.length - 1][0],
          roi: +sortedMarkets[sortedMarkets.length - 1][1].toFixed(1),
        }
      : null;

  const midpoint = Math.floor(filteredBets.length / 2);
  const firstHalfProfit = filteredBets.slice(0, midpoint).reduce((s, b) => s + b.netProfit, 0);
  const secondHalfProfit = filteredBets.slice(midpoint).reduce((s, b) => s + b.netProfit, 0);
  const profitTrend: TrendDirection =
    secondHalfProfit > firstHalfProfit
      ? 'up'
      : secondHalfProfit < firstHalfProfit
      ? 'down'
      : 'neutral';

  const firstHalfWins = filteredBets.slice(0, midpoint).filter((b) => b.result === 'won').length;
  const secondHalfWins = filteredBets.slice(midpoint).filter((b) => b.result === 'won').length;
  const winTrend: TrendDirection =
    secondHalfWins > firstHalfWins ? 'up' : secondHalfWins < firstHalfWins ? 'down' : 'neutral';

  return {
    bankrollCurrent: +running.toFixed(2),
    bankrollInitial: initialBankroll,
    roiGlobal: +roiGlobal.toFixed(1),
    roiTrend: profitTrend,
    yieldGlobal: +yieldGlobal.toFixed(2),
    yieldTrend: profitTrend,
    totalBets,
    winRate: +winRate.toFixed(1),
    winRateTrend: winTrend,
    currentStreak,
    maxDrawdown: +maxDrawdown.toFixed(1),
    bestMarket,
    worstMarket,
    roiByMarket,
    winRateByMarket,
    bankrollHistory,
  };
};

/* ─── Alerts Engine ─── */

export interface DashboardAlert {
  id: string;
  type: 'danger' | 'warning' | 'success' | 'info';
  title: string;
  message: string;
}

const generateAlerts = (metrics: DashboardMetrics, bets: RegisteredBet[]): DashboardAlert[] => {
  const alerts: DashboardAlert[] = [];

  if (metrics.maxDrawdown > 20) {
    alerts.push({
      id: 'drawdown-severe',
      type: 'danger',
      title: 'Drawdown Severo',
      message: `Tu bankroll ha caído un ${metrics.maxDrawdown}% desde su máximo. Considera reducir stakes.`,
    });
  }

  if (metrics.currentStreak.type === 'loss' && metrics.currentStreak.count >= 5) {
    alerts.push({
      id: 'loss-streak',
      type: 'warning',
      title: 'Racha de Pérdidas',
      message: `Llevas ${metrics.currentStreak.count} apuestas perdidas seguidas. Recomendamos revisar estrategia.`,
    });
  }

  if (metrics.worstMarket && metrics.worstMarket.roi < -15) {
    alerts.push({
      id: 'worst-market',
      type: 'warning',
      title: `Rendimiento bajo en ${metrics.worstMarket.name}`,
      message: `Tu ROI en el mercado "${metrics.worstMarket.name}" es de ${metrics.worstMarket.roi}%. Considera reducir exposición.`,
    });
  }

  if (metrics.currentStreak.type === 'win' && metrics.currentStreak.count >= 5) {
    alerts.push({
      id: 'win-streak',
      type: 'success',
      title: '¡Racha Ganadora!',
      message: `Llevas ${metrics.currentStreak.count} apuestas ganadas. Consolida beneficios y mantén la disciplina.`,
    });
  }

  if (metrics.roiGlobal > 10 && metrics.totalBets >= 10) {
    alerts.push({
      id: 'positive-roi',
      type: 'success',
      title: 'ROI Positivo',
      message: `Mantienes un ROI del ${metrics.roiGlobal}% con ${metrics.totalBets} apuestas. ¡Buen trabajo!`,
    });
  }

  if (bets.filter((b) => b.result !== 'pending').length === 0) {
    alerts.push({
      id: 'no-bets',
      type: 'info',
      title: 'Empieza a registrar',
      message: 'Registra tus apuestas para ver métricas de rendimiento y alertas inteligentes.',
    });
  }

  return alerts;
};

/* ─── Hook ─── */

interface UseDashboardOptions {
  /** UID del usuario autenticado. Si es null, usa fallback localStorage. */
  uid?: string | null;
}

export const useDashboard = ({ uid }: UseDashboardOptions = {}) => {
  const [bets, setBets] = useState<RegisteredBet[]>([]);
  // Estado inicial 'localStorage' (ya no usamos mock por defecto)
  const [dataSource, setDataSource] = useState<DataSource>('localStorage');
  const [initialBankroll, setInitialBankroll] = useState<number>(loadInitialBankroll);
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('all');
  const [marketFilter, setMarketFilter] = useState<MarketFilter>('all');
  const [isLoadingBets, setIsLoadingBets] = useState(true);

  useEffect(() => {
    setIsLoadingBets(true);

    let unsubscribeBets = () => {};
    let unsubscribeSettings = () => {};

    // 1. Carga inmediata de datos locales para Quick Start (no bloquea la UI)
    const storedBets = loadBetsFromStorage();
    if (storedBets.length > 0) {
      setBets(storedBets);
      setDataSource('localStorage');
    } else {
      setBets([]);
      setDataSource('localStorage');
    }

    if (uid && firebaseService.isConnected()) {
      // 2. Suscribirse a Apuestas en Firestore (sobreescribe el estado local cuando llegan datos)
      const betsSub = firebaseService.subscribeToBets(
        uid,
        (rawBets) => {
          const normalized = rawBets.map(normalizeFirestoreBet);
          if (normalized.length > 0) {
            setBets(normalized);
            setDataSource('firestore'); // Solo actualizamos a 'firestore' con datos confirmados
          } else {
            // El usuario no tiene apuestas en Firestore aún (cuenta nueva). No imponemos mock.
            // Mantenemos lo que ya tenía (localStorage o mock del paso 1).
          }
          setIsLoadingBets(false);
        },
        () => setIsLoadingBets(false)
      );
      unsubscribeBets = betsSub.unsubscribe;

      // 3. Suscribirse a Settings (Bankroll inicial) en Firestore
      const settingsSub = firebaseService.subscribeToSettings(uid, (data) => {
        if (data && data.initialBankroll) {
          setInitialBankroll(data.initialBankroll);
          localStorage.setItem(STORAGE_KEY_BANKROLL, String(data.initialBankroll));
        }
      });
      unsubscribeSettings = settingsSub.unsubscribe;
    } else {
      setIsLoadingBets(false);
    }

    return () => {
      unsubscribeBets();
      unsubscribeSettings();
    };
  }, [uid]);

  const metrics = useMemo(
    () => calculateMetrics(bets, initialBankroll, timeFilter, marketFilter),
    [bets, initialBankroll, timeFilter, marketFilter]
  );

  const alerts = useMemo(() => generateAlerts(metrics, bets), [metrics, bets]);

  const availableMarkets = useMemo(() => {
    const markets = new Set(bets.map((b) => b.marketType));
    return Array.from(markets).sort();
  }, [bets]);

  const updateLocalBets = (updated: RegisteredBet[]) => {
    setBets(updated);
    if (dataSource !== 'firestore') {
      saveBetsToStorage(updated);
    }
  };

  /* ─── WRITE OPERATIONS ─── */

  const registerBet = useCallback(
    async (bet: Omit<RegisteredBet, 'id' | 'timestamp' | 'netProfit'>) => {
      const netProfit =
        bet.result === 'won'
          ? +(bet.stake * (bet.odds - 1)).toFixed(2)
          : bet.result === 'lost'
          ? -bet.stake
          : 0;

      const betPayload = { ...bet, netProfit };

      if (uid && firebaseService.isConnected()) {
        await firebaseService.addBet(uid, betPayload);
      } else {
        const newBet: RegisteredBet = {
          ...betPayload,
          id: `bet-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          timestamp: new Date().toISOString(),
        };
        const updated = [...bets, newBet];
        updateLocalBets(updated);
      }
    },
    [uid, bets, dataSource]
  );

  const updateBetResult = useCallback(
    async (betId: string, result: BetResult) => {
      if (uid && firebaseService.isConnected()) {
        const bet = bets.find((b) => b.id === betId);
        if (!bet) return;
        const netProfit =
          result === 'won'
            ? +(bet.stake * (bet.odds - 1)).toFixed(2)
            : result === 'lost'
            ? -bet.stake
            : 0;
        await firebaseService.updateBet(uid, betId, { result, netProfit });
      } else {
        const updated = bets.map((b) => {
          if (b.id !== betId) return b;
          const netProfit =
            result === 'won'
              ? +(b.stake * (b.odds - 1)).toFixed(2)
              : result === 'lost'
              ? -b.stake
              : 0;
          return { ...b, result, netProfit };
        });
        updateLocalBets(updated);
      }
    },
    [uid, bets, dataSource]
  );

  const deleteBet = useCallback(
    async (betId: string) => {
      if (uid && firebaseService.isConnected()) {
        await firebaseService.deleteBet(uid, betId);
      } else {
        const updated = bets.filter((b) => b.id !== betId);
        updateLocalBets(updated);
      }
    },
    [uid, bets, dataSource]
  );

  const setNewBankroll = useCallback((value: number) => {
    setInitialBankroll(value);
    saveInitialBankroll(value);
    if (uid && firebaseService.isConnected()) {
      firebaseService.updateSettings(uid, { initialBankroll: value });
    }
  }, [uid]);

  const clearMockData = useCallback(() => {
    setBets([]);
    setDataSource(uid && firebaseService.isConnected() ? 'firestore' : 'localStorage');
    saveBetsToStorage([]);
  }, [uid]);

  return {
    bets,
    metrics,
    alerts,
    availableMarkets,
    timeFilter,
    setTimeFilter,
    marketFilter,
    setMarketFilter,
    registerBet,
    updateBetResult,
    deleteBet,
    setNewBankroll,
    clearMockData,
    dataSource,
    isLoadingBets,
  };
};
