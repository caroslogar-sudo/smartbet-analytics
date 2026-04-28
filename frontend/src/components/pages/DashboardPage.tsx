import React, { useState, useMemo } from 'react'; // FIXED: Added useMemo
import {
  Wallet,
  TrendingUp,
  Target,
  AlertTriangle,
  Flame,
  BarChart3,
  Trophy,
  XCircle,
  Plus,
  Filter,
  Clock,
  CheckCircle,
  // X, // FIXED: Removed unused import
  DollarSign,
  AlertCircle,
  Info,
  Database,
  HardDrive,
  // BarChart2, // FIXED: Removed unused import
  Trash2,
} from 'lucide-react';
import { MetricCard } from '../atoms/MetricCard';
import { MiniChart } from '../atoms/MiniChart';
import { Card } from '../atoms/Card';
import { Badge } from '../atoms/Badge';
import { Button } from '../atoms/Button';
import { BetRegistrationModal } from '../molecules/BetRegistrationModal';
import type { BetFormData } from '../molecules/BetRegistrationModal';
import { useDashboard } from '../../hooks/useDashboard';
import type { TimeFilter, DashboardAlert, RegisteredBet, BetResult } from '../../hooks/useDashboard'; // FIXED: Removed DataSource
import { useAuth } from '../../contexts/AuthContext';

/* ─── Sub-Components ─── */

const TIME_FILTERS: { value: TimeFilter; label: string }[] = [
  { value: '7d', label: '7 días' },
  { value: '30d', label: '30 días' },
  { value: '90d', label: '90 días' },
  { value: 'all', label: 'Todo' },
];

const RESULT_COLORS: Record<BetResult, string> = {
  pending: 'var(--color-text-secondary)',
  won: 'var(--color-success)',
  lost: 'var(--color-danger)',
  void: 'var(--color-warning)',
  cashout: 'var(--color-info)',
  draw: 'var(--color-text-secondary)', // FIXED: Added draw
};

const RESULT_LABELS: Record<BetResult, string> = {
  pending: 'Pendiente',
  won: 'Ganada',
  lost: 'Perdida',
  void: 'Anulada',
  cashout: 'Cashout',
  draw: 'Empate', // FIXED: Added draw
};

const ALERT_ICONS: Record<DashboardAlert['type'], React.ReactNode> = {
  danger: <XCircle size={16} />,
  warning: <AlertTriangle size={16} />,
  success: <CheckCircle size={16} />,
  info: <Info size={16} />,
};

const ALERT_COLORS: Record<DashboardAlert['type'], string> = {
  danger: 'var(--color-danger)',
  warning: 'var(--color-warning)',
  success: 'var(--color-success)',
  info: 'var(--color-info)',
};

/* ─── FilterBar ─── */

const FilterBar: React.FC<{
  timeFilter: TimeFilter;
  onTimeChange: (f: TimeFilter) => void;
  marketFilter: string;
  onMarketChange: (f: string) => void;
  availableMarkets: string[];
  onNewBet: () => void;
}> = ({ timeFilter, onTimeChange, marketFilter, onMarketChange, availableMarkets, onNewBet }) => (
  <div style={{
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 'var(--space-md)',
    marginBottom: 'var(--space-xl)',
  }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', flexWrap: 'wrap' }}>
      {/* Time filter */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
        <Clock size={14} color="var(--color-text-secondary)" style={{ marginRight: '4px' }} />
        {TIME_FILTERS.map(f => (
          <button
            key={f.value}
            onClick={() => onTimeChange(f.value)}
            style={{
              padding: '4px 10px',
              borderRadius: 'var(--radius-sm)',
              border: 'none',
              backgroundColor: timeFilter === f.value ? 'var(--color-primary)' : 'transparent',
              color: timeFilter === f.value ? 'white' : 'var(--color-text-secondary)',
              fontSize: '0.7rem',
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: 'inherit',
              transition: 'all var(--transition-fast)',
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Market filter */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
        <Filter size={14} color="var(--color-text-secondary)" />
        <select
          value={marketFilter}
          onChange={(e) => onMarketChange(e.target.value)}
          style={{
            backgroundColor: 'var(--color-surface)',
            border: '1px solid var(--color-surface-borders)',
            borderRadius: 'var(--radius-sm)',
            padding: '4px 8px',
            color: 'var(--color-text-primary)',
            fontSize: '0.7rem',
            fontFamily: 'inherit',
            cursor: 'pointer',
            outline: 'none',
          }}
        >
          <option value="all">Todos los mercados</option>
          {availableMarkets.map(m => <option key={m} value={m}>{m}</option>)}
        </select>
      </div>
    </div>

    <Button variant="primary" size="sm" onClick={onNewBet} style={{ gap: '6px' }}>
      <Plus size={14} /> Nueva Apuesta
    </Button>
  </div>
);

/* ─── AlertsPanel ─── */

const AlertsPanel: React.FC<{ alerts: DashboardAlert[] }> = ({ alerts }) => {
  if (alerts.length === 0) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)', marginBottom: 'var(--space-xl)' }}>
      {alerts.map(alert => (
        <div
          key={alert.id}
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: 'var(--space-sm)',
            padding: 'var(--space-sm) var(--space-md)',
            backgroundColor: `${ALERT_COLORS[alert.type]}08`,
            border: `1px solid ${ALERT_COLORS[alert.type]}30`,
            borderRadius: 'var(--radius-md)',
          }}
        >
          <div style={{ color: ALERT_COLORS[alert.type], marginTop: '2px', flexShrink: 0 }}>
            {ALERT_ICONS[alert.type]}
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: ALERT_COLORS[alert.type] }}>
              {alert.title}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
              {alert.message}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

/* ─── BetHistoryTable (avanzada) ─── */

type SortField = 'timestamp' | 'event' | 'odds' | 'stake' | 'netProfit' | 'result';
type SortDir = 'asc' | 'desc';

const PAGE_SIZE = 10;

const exportToCSV = (bets: RegisteredBet[]): void => {
  const headers = ['Fecha', 'Evento', 'Deporte', 'Mercado', 'Pronóstico', 'Casa', 'Cuota', 'Stake (€)', 'Resultado', 'P/L (€)', 'CC (%)'];
  const rows = bets.map(b => [
    new Date(b.timestamp).toLocaleDateString('es-ES'),
    `"${b.event}"`,
    b.sport,
    b.marketType,
    b.prediction,
    b.bookmaker,
    b.odds.toFixed(2),
    b.stake.toFixed(2),
    RESULT_LABELS[b.result],
    b.result !== 'pending' ? b.netProfit.toFixed(2) : '',
    b.ccAtBet,
  ]);
  const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `smartbet_historial_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
};

const SortableHeader: React.FC<{
  field: SortField;
  label: string;
  currentField: SortField;
  currentDir: SortDir;
  onSort: (f: SortField) => void;
}> = ({ field, label, currentField, currentDir, onSort }) => {
  const isActive = currentField === field;
  return (
    <th
      onClick={() => onSort(field)}
      style={{
        cursor: 'pointer',
        userSelect: 'none',
        padding: 'var(--space-sm) var(--space-md)',
        textAlign: 'left',
        fontWeight: 700,
        fontSize: '0.7rem',
        color: isActive ? 'var(--color-primary)' : 'var(--color-text-secondary)',
        borderBottom: `2px solid ${isActive ? 'var(--color-primary)' : 'var(--color-surface-borders)'}`,
        transition: 'color var(--transition-fast)',
      }}
    >
      {label} {isActive && (currentDir === 'asc' ? '▲' : '▼')}
    </th>
  );
};

const BetHistoryTable: React.FC<{
  bets: RegisteredBet[];
  onUpdateResult: (id: string, result: BetResult, netProfit: number) => void;
  onDelete: (id: string) => void;
}> = ({ bets, onUpdateResult, onDelete }) => {
  const [sortField, setSortField] = useState<SortField>('timestamp');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [currentPage, setCurrentPage] = useState(1);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('desc');
    }
    setCurrentPage(1);
  };

  const sortedBets = [...bets].sort((a, b) => {
    let aVal: any = a[sortField];
    let bVal: any = b[sortField];

    if (sortField === 'timestamp') {
      aVal = new Date(aVal).getTime();
      bVal = new Date(bVal).getTime();
    }

    if (aVal < bVal) return sortDir === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortDir === 'asc' ? 1 : -1;
    return 0;
  });

  const totalPages = Math.ceil(sortedBets.length / PAGE_SIZE);
  const paginatedBets = sortedBets.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const handleResultChange = (id: string, newResult: BetResult, odds: number, stake: number) => {
    let netProfit = 0;
    if (newResult === 'won') netProfit = stake * (odds - 1);
    if (newResult === 'lost') netProfit = -stake;
    if (newResult === 'draw') netProfit = 0; // FIXED: Added draw case
    onUpdateResult(id, newResult, netProfit);
  };

  if (bets.length === 0) {
    return (
      <Card style={{ padding: 'var(--space-xxl)', textAlign: 'center', marginBottom: 'var(--space-xxl)' }}>
        <Database size={48} color="var(--color-text-secondary)" style={{ margin: '0 auto var(--space-md)' }} />
        <h3 style={{ margin: '0 0 var(--space-xs) 0' }}>Sin registros aún</h3>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.85rem' }}>
          Comienza a registrar tus apuestas para generar estadísticas y análisis de rentabilidad.
        </p>
      </Card>
    );
  }

  return (
    <div>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 'var(--space-lg)',
      }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 800, margin: 0 }}>
          HISTORIAL COMPLETO <span style={{ color: 'var(--color-text-secondary)', fontWeight: 400 }}>({bets.length})</span>
        </h3>
        <Button variant="ghost" size="sm" onClick={() => exportToCSV(bets)} style={{ gap: '6px' }}>
          <HardDrive size={14} /> Exportar CSV
        </Button>
      </div>

      <Card style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem' }}>
            <thead>
              <tr>
                <SortableHeader field="timestamp" label="FECHA" currentField={sortField} currentDir={sortDir} onSort={handleSort} />
                <SortableHeader field="event" label="EVENTO" currentField={sortField} currentDir={sortDir} onSort={handleSort} />
                <th style={{ padding: 'var(--space-sm) var(--space-md)', textAlign: 'left', fontWeight: 700, fontSize: '0.7rem', color: 'var(--color-text-secondary)', borderBottom: '2px solid var(--color-surface-borders)' }}>MERCADO</th>
                <th style={{ padding: 'var(--space-sm) var(--space-md)', textAlign: 'left', fontWeight: 700, fontSize: '0.7rem', color: 'var(--color-text-secondary)', borderBottom: '2px solid var(--color-surface-borders)' }}>PRONÓSTICO</th>
                <SortableHeader field="odds" label="CUOTA" currentField={sortField} currentDir={sortDir} onSort={handleSort} />
                <SortableHeader field="stake" label="STAKE (€)" currentField={sortField} currentDir={sortDir} onSort={handleSort} />
                <SortableHeader field="result" label="RESULTADO" currentField={sortField} currentDir={sortDir} onSort={handleSort} />
                <SortableHeader field="netProfit" label="P/L (€)" currentField={sortField} currentDir={sortDir} onSort={handleSort} />
                <th style={{ padding: 'var(--space-sm) var(--space-md)', textAlign: 'left', fontWeight: 700, fontSize: '0.7rem', color: 'var(--color-text-secondary)', borderBottom: '2px solid var(--color-surface-borders)' }}>CC (%)</th>
                <th style={{ padding: 'var(--space-sm) var(--space-md)', textAlign: 'center', fontWeight: 700, fontSize: '0.7rem', color: 'var(--color-text-secondary)', borderBottom: '2px solid var(--color-surface-borders)' }}>ACCIONES</th>
              </tr>
            </thead>
            <tbody>
              {paginatedBets.map((bet, idx) => (
                <tr
                  key={bet.id}
                  style={{
                    backgroundColor: idx % 2 === 0 ? 'transparent' : 'var(--color-surface)',
                    transition: 'background-color var(--transition-fast)',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--color-surface-hover)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = idx % 2 === 0 ? 'transparent' : 'var(--color-surface)'; }}
                >
                  <td style={{ padding: 'var(--space-sm) var(--space-md)', whiteSpace: 'nowrap' }}>
                    {new Date(bet.timestamp).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}
                  </td>
                  <td style={{ padding: 'var(--space-sm) var(--space-md)', fontWeight: 600, maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={bet.event}>
                    {bet.event}
                  </td>
                  <td style={{ padding: 'var(--space-sm) var(--space-md)', color: 'var(--color-text-secondary)' }}>
                    {bet.marketType}
                  </td>
                  <td style={{ padding: 'var(--space-sm) var(--space-md)', color: 'var(--color-primary)' }}>
                    {bet.prediction}
                  </td>
                  <td style={{ padding: 'var(--space-sm) var(--space-md)', fontWeight: 700 }}>
                    {bet.odds.toFixed(2)}
                  </td>
                  <td style={{ padding: 'var(--space-sm) var(--space-md)' }}>
                    {bet.stake.toFixed(2)}€
                  </td>
                  <td style={{ padding: 'var(--space-sm) var(--space-md)' }}>
                    <select
                      value={bet.result}
                      onChange={(e) => handleResultChange(bet.id, e.target.value as BetResult, bet.odds, bet.stake)}
                      style={{
                        backgroundColor: RESULT_COLORS[bet.result],
                        color: bet.result === 'pending' ? 'var(--color-text-primary)' : 'white',
                        border: 'none',
                        borderRadius: 'var(--radius-sm)',
                        padding: '2px 6px',
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        fontFamily: 'inherit',
                      }}
                    >
                      <option value="pending">Pendiente</option>
                      <option value="won">Ganada</option>
                      <option value="lost">Perdida</option>
                      <option value="draw">Empate</option>
                      <option value="void">Anulada</option>
                      <option value="cashout">Cashout</option>
                    </select>
                  </td>
                  <td style={{
                    padding: 'var(--space-sm) var(--space-md)',
                    fontWeight: 800,
                    color: bet.result === 'pending' ? 'var(--color-text-secondary)' : (bet.netProfit >= 0 ? 'var(--color-success)' : 'var(--color-danger)'),
                  }}>
                    {bet.result === 'pending' ? '—' : `${bet.netProfit >= 0 ? '+' : ''}${bet.netProfit.toFixed(2)}€`}
                  </td>
                  <td style={{ padding: 'var(--space-sm) var(--space-md)', color: 'var(--color-text-secondary)' }}>
                    {bet.ccAtBet}%
                  </td>
                  <td style={{ padding: 'var(--space-sm) var(--space-md)', textAlign: 'center' }}>
                    <button
                      onClick={() => {
                        if (confirm('¿Seguro que quieres eliminar esta apuesta? Esta acción no se puede deshacer.')) {
                          onDelete(bet.id);
                        }
                      }}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--color-danger)',
                        cursor: 'pointer',
                        padding: '4px',
                        opacity: 0.6,
                        transition: 'opacity var(--transition-fast)',
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.opacity = '1'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.opacity = '0.6'; }}
                      title="Eliminar apuesta"
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: 'var(--space-sm)',
            padding: 'var(--space-md)',
            borderTop: '1px solid var(--color-surface-borders)',
          }}>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
            >
              ← Anterior
            </Button>
            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
              Página {currentPage} de {totalPages}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
            >
              Siguiente →
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
};

/* ─── Main Component ─── */

export interface DashboardPageProps {
  prefill?: Partial<BetFormData>;
  onClearPrefill?: () => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ prefill, onClearPrefill }) => {
  const { currentUser } = useAuth();
  const {
    bets,
    metrics,
    alerts,
    dataSource,
    timeFilter,
    marketFilter,
    setTimeFilter,
    setMarketFilter,
    registerBet,
    updateBetResult,
    deleteBet,
    setNewBankroll, // FIXED: Changed from updateInitialBankroll
  } = useDashboard({ uid: currentUser?.uid }); // FIXED: Pass as object with uid property

  const [isModalOpen, setIsModalOpen] = useState(false);

  React.useEffect(() => {
    if (prefill) {
      setIsModalOpen(true);
    }
  }, [prefill]);

  const handleRegisterBet = (data: BetFormData) => {
    registerBet(data);
  };

  const availableMarkets = useMemo(() => {
    return Array.from(new Set(bets.map(b => b.marketType)));
  }, [bets]);

  const bankrollDelta = metrics.bankrollCurrent - metrics.bankrollInitial;
  const bankrollDeltaPercent = metrics.bankrollInitial > 0
    ? ((bankrollDelta / metrics.bankrollInitial) * 100).toFixed(1)
    : '0.0';

  const bankrollChartData = metrics.bankrollHistory.length > 0
    ? metrics.bankrollHistory.map((val, i) => ({ label: `D${i + 1}`, value: val }))
    : [{ label: 'Inicial', value: metrics.bankrollInitial }];

  const roiByMarketChartData = Object.entries(metrics.roiByMarket).map(([market, roi]) => ({
    label: market.length > 12 ? market.substring(0, 12) + '...' : market,
    value: roi,
  }));

  const radarChartData = Object.entries(metrics.winRateByMarket).map(([market, winRate]) => ({
    label: market,
    value: winRate,
  }));

  return (
    <div style={{ padding: 'var(--space-lg) var(--space-xl) var(--space-xxl)', maxWidth: '1600px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: 'var(--space-xl)' }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 800, margin: '0 0 var(--space-xs) 0', letterSpacing: '-0.01em' }}>
          Dashboard<span style={{ color: 'var(--color-primary)' }}>.</span>
        </h1>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', margin: '0 0 var(--space-sm) 0' }}>
          Registro analítico de apuestas y seguimiento de rentabilidad en tiempo real.
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', flexWrap: 'wrap' }}>
          <Badge
            variant={dataSource === 'firestore' ? 'success' : dataSource === 'localStorage' ? 'info' : 'danger'}
            text={dataSource === 'firestore' ? '🔥 Firestore Conectado' : dataSource === 'localStorage' ? '💾 Modo Offline' : '⚠️ Mock Data'}
          />
          <button
            onClick={() => {
              const newBankroll = prompt('Introduce el nuevo bankroll inicial (€):', String(metrics.bankrollInitial));
              if (newBankroll !== null && !isNaN(parseFloat(newBankroll))) {
                setNewBankroll(parseFloat(newBankroll)); // FIXED: Changed from updateInitialBankroll
              }
            }}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--color-text-secondary)',
              fontSize: '0.75rem',
              cursor: 'pointer',
              textDecoration: 'underline',
              padding: 0,
            }}
          >
            Actualizar Bankroll Inicial
          </button>
        </div>
      </div>

      {/* Alerts */}
      <AlertsPanel alerts={alerts} />

      {/* Filters + Actions */}
      <FilterBar
        timeFilter={timeFilter}
        onTimeChange={setTimeFilter}
        marketFilter={marketFilter}
        onMarketChange={setMarketFilter}
        availableMarkets={availableMarkets}
        onNewBet={() => setIsModalOpen(true)}
      />

      {/* Metrics Cards */}
      <section style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: 'var(--space-lg)',
        marginBottom: 'var(--space-xl)',
      }}>
        <MetricCard
          title="Bankroll Actual"
          value={`${metrics.bankrollCurrent.toLocaleString('es-ES')}€`}
          trend={bankrollDelta >= 0 ? 'up' : 'down'}
          trendLabel={`${bankrollDelta >= 0 ? '+' : ''}${bankrollDeltaPercent}%`}
          subtitle={`Inicial: ${metrics.bankrollInitial}€`}
          accentColor="var(--color-primary)"
          icon={<Wallet size={18} />}
        />
        <MetricCard
          title="ROI Global"
          value={`${metrics.roiGlobal >= 0 ? '+' : ''}${metrics.roiGlobal}%`}
          trend={metrics.roiTrend}
          trendLabel={metrics.roiTrend === 'up' ? 'Subiendo' : metrics.roiTrend === 'down' ? 'Bajando' : 'Estable'}
          accentColor={metrics.roiGlobal >= 0 ? 'var(--color-success)' : 'var(--color-danger)'}
          icon={<TrendingUp size={18} />}
        />
        <MetricCard
          title="Tasa de Acierto"
          value={`${metrics.winRate}%`}
          trend={metrics.winRateTrend}
          trendLabel={`${metrics.totalBets} apuestas`}
          accentColor={metrics.winRate >= 55 ? 'var(--color-success)' : metrics.winRate >= 45 ? 'var(--color-warning)' : 'var(--color-danger)'}
          icon={<Target size={18} />}
        />
        <MetricCard
          title="Yield"
          value={`${metrics.yieldGlobal >= 0 ? '+' : ''}${metrics.yieldGlobal}€`}
          trend={metrics.yieldTrend}
          trendLabel="por apuesta"
          accentColor={metrics.yieldGlobal >= 0 ? 'var(--color-success)' : 'var(--color-danger)'}
          icon={<DollarSign size={18} />}
        />
        <MetricCard
          title="Racha Actual"
          value={`${metrics.currentStreak.count} ${metrics.currentStreak.type === 'win' ? '✓' : '✗'}`}
          trend={metrics.currentStreak.type === 'win' ? 'up' : 'down'}
          trendLabel={metrics.currentStreak.type === 'win' ? 'Ganando' : 'Perdiendo'}
          accentColor={metrics.currentStreak.type === 'win' ? 'var(--color-success)' : 'var(--color-danger)'}
          icon={<Flame size={18} />}
        />
        <MetricCard
          title="Max Drawdown"
          value={`${metrics.maxDrawdown}%`}
          trend={metrics.maxDrawdown > 15 ? 'down' : 'neutral'}
          trendLabel={metrics.maxDrawdown > 15 ? '⚠ Alto' : 'Controlado'}
          accentColor={metrics.maxDrawdown > 20 ? 'var(--color-danger)' : metrics.maxDrawdown > 10 ? 'var(--color-warning)' : 'var(--color-success)'}
          icon={<AlertCircle size={18} />}
        />
      </section>

      {/* Charts section */}
      <section style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))',
        gap: 'var(--space-lg)',
        marginBottom: 'var(--space-xl)',
      }}>
        {/* Bankroll Evolution */}
        <Card style={{ padding: 'var(--space-lg)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-md)' }}>
            <div>
              <h3 style={{ fontSize: '0.85rem', fontWeight: 700, margin: 0 }}>Evolución del Bankroll</h3>
              <p style={{ fontSize: '0.7rem', color: 'var(--color-text-secondary)', margin: '4px 0 0' }}>
                Progresión acumulada desde el inicio
              </p>
            </div>
            <BarChart3 size={16} color="var(--color-text-secondary)" />
          </div>
          <MiniChart
            data={bankrollChartData}
            type="area"
            width={360}
            height={140}
            color={bankrollDelta >= 0 ? 'var(--color-success)' : 'var(--color-danger)'}
            style={{ width: '100%' }}
          />
        </Card>

        {/* ROI por Mercado */}
        <Card style={{ padding: 'var(--space-lg)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-md)' }}>
            <div>
              <h3 style={{ fontSize: '0.85rem', fontWeight: 700, margin: 0 }}>ROI por Mercado</h3>
              <p style={{ fontSize: '0.7rem', color: 'var(--color-text-secondary)', margin: '4px 0 0' }}>
                Rentabilidad desglosada por tipo de mercado
              </p>
            </div>
            <Trophy size={16} color="var(--color-text-secondary)" />
          </div>
          <MiniChart
            data={roiByMarketChartData}
            type="bar"
            width={360}
            height={140}
            color="var(--color-primary)"
            secondaryColor="var(--color-danger)"
            showLabels
            style={{ width: '100%' }}
          />
        </Card>

        {/* Radar de rendimiento */}
        {radarChartData.length >= 3 && (
          <Card style={{ padding: 'var(--space-lg)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-md)' }}>
              <div>
                <h3 style={{ fontSize: '0.85rem', fontWeight: 700, margin: 0 }}>Perfil de Rendimiento</h3>
                <p style={{ fontSize: '0.7rem', color: 'var(--color-text-secondary)', margin: '4px 0 0' }}>
                  Tasa de acierto por tipo de mercado
                </p>
              </div>
              <Target size={16} color="var(--color-text-secondary)" />
            </div>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <MiniChart
                data={radarChartData}
                type="radar"
                width={260}
                height={220}
                color="var(--color-primary)"
              />
            </div>
          </Card>
        )}

        {/* Best/Worst Markets summary */}
        <Card style={{ padding: 'var(--space-lg)', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <h3 style={{ fontSize: '0.85rem', fontWeight: 700, margin: '0 0 var(--space-md)' }}>Mercados Destacados</h3>

          {metrics.bestMarket && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-sm)',
              padding: 'var(--space-sm) var(--space-md)',
              backgroundColor: 'rgba(16, 185, 129, 0.08)',
              borderRadius: 'var(--radius-md)',
              marginBottom: 'var(--space-sm)',
            }}>
              <Trophy size={16} color="var(--color-success)" />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700 }}>{metrics.bestMarket.name}</div>
                <div style={{ fontSize: '0.65rem', color: 'var(--color-text-secondary)' }}>Mejor rendimiento</div>
              </div>
              <span style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--color-success)' }}>
                +{metrics.bestMarket.roi}%
              </span>
            </div>
          )}

          {metrics.worstMarket && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-sm)',
              padding: 'var(--space-sm) var(--space-md)',
              backgroundColor: 'rgba(239, 68, 68, 0.08)',
              borderRadius: 'var(--radius-md)',
              marginBottom: 'var(--space-md)',
            }}>
              <AlertTriangle size={16} color="var(--color-danger)" />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700 }}>{metrics.worstMarket.name}</div>
                <div style={{ fontSize: '0.65rem', color: 'var(--color-text-secondary)' }}>Peor rendimiento</div>
              </div>
              <span style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--color-danger)' }}>
                {metrics.worstMarket.roi}%
              </span>
            </div>
          )}

          {/* Market ROI breakdown list */}
          <div style={{ fontSize: '0.7rem', color: 'var(--color-text-secondary)', marginTop: 'var(--space-xs)' }}>
            {Object.entries(metrics.roiByMarket).slice(0, 6).map(([market, roi]) => (
              <div key={market} style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '3px 0',
                borderBottom: '1px solid var(--color-surface-borders)',
              }}>
                <span>{market}</span>
                <span style={{
                  fontWeight: 700,
                  color: roi >= 0 ? 'var(--color-success)' : 'var(--color-danger)' }}>
                  {roi >= 0 ? '+' : ''}{roi.toFixed(1)}%
                </span>
              </div>
            ))}
          </div>
        </Card>
      </section>

      {/* Bet History Table */}
      <BetHistoryTable
        bets={bets}
        onUpdateResult={updateBetResult}
        onDelete={deleteBet}
      />

      {/* Registration Modal */}
      <BetRegistrationModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          onClearPrefill?.();
        }}
        onRegister={(data) => {
          handleRegisterBet(data);
          setIsModalOpen(false);
          onClearPrefill?.();
        }}
        prefill={prefill}
      />
    </div>
  );
};
