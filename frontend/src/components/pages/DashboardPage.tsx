import React, { useState } from 'react';
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
  X,
  DollarSign,
  AlertCircle,
  Info,
  Database,
  HardDrive,
  BarChart2,
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
import type { TimeFilter, DashboardAlert, RegisteredBet, BetResult, DataSource } from '../../hooks/useDashboard';
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
};

const RESULT_LABELS: Record<BetResult, string> = {
  pending: 'Pendiente',
  won: 'Ganada',
  lost: 'Perdida',
  void: 'Anulada',
  cashout: 'Cashout',
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
  label: string;
  field: SortField;
  currentSort: { field: SortField; dir: SortDir };
  onSort: (f: SortField) => void;
}> = ({ label, field, currentSort, onSort }) => {
  const isActive = currentSort.field === field;
  return (
    <th
      onClick={() => onSort(field)}
      style={{
        padding: 'var(--space-sm) var(--space-md)',
        textAlign: 'left',
        color: isActive ? 'var(--color-primary)' : 'var(--color-text-secondary)',
        fontWeight: 600,
        fontSize: '0.65rem',
        textTransform: 'uppercase',
        letterSpacing: '0.06em',
        whiteSpace: 'nowrap',
        cursor: 'pointer',
        userSelect: 'none',
        transition: 'color var(--transition-fast)',
      }}
    >
      {label} {isActive ? (currentSort.dir === 'asc' ? '↑' : '↓') : ''}
    </th>
  );
};

const BetHistoryTable: React.FC<{
  bets: RegisteredBet[];
  onUpdateResult: (id: string, result: BetResult) => void;
  onDelete: (id: string) => void;
}> = ({ bets, onUpdateResult, onDelete }) => {
  const [sort, setSort] = useState<{ field: SortField; dir: SortDir }>({ field: 'timestamp', dir: 'desc' });
  const [page, setPage] = useState(0);

  const handleSort = (field: SortField) => {
    setSort(prev => ({ field, dir: prev.field === field && prev.dir === 'desc' ? 'asc' : 'desc' }));
    setPage(0);
  };

  const sortedBets = [...bets].sort((a, b) => {
    let aVal: any, bVal: any;
    switch (sort.field) {
      case 'timestamp': aVal = new Date(a.timestamp).getTime(); bVal = new Date(b.timestamp).getTime(); break;
      case 'event': aVal = a.event; bVal = b.event; break;
      case 'odds': aVal = a.odds; bVal = b.odds; break;
      case 'stake': aVal = a.stake; bVal = b.stake; break;
      case 'netProfit': aVal = a.netProfit; bVal = b.netProfit; break;
      case 'result': aVal = a.result; bVal = b.result; break;
    }
    if (aVal < bVal) return sort.dir === 'asc' ? -1 : 1;
    if (aVal > bVal) return sort.dir === 'asc' ? 1 : -1;
    return 0;
  });

  const totalPages = Math.ceil(sortedBets.length / PAGE_SIZE);
  const pageBets = sortedBets.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const headerProps = { currentSort: sort, onSort: handleSort };

  return (
    <Card style={{ overflow: 'hidden', padding: 0 }}>
      <div style={{
        padding: 'var(--space-md) var(--space-lg)',
        borderBottom: '1px solid var(--color-surface-borders)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 'var(--space-sm)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 700, margin: 0 }}>Historial de Apuestas</h3>
          <Badge text={`${bets.length} total`} variant="info" />
        </div>
        {bets.length > 0 && (
          <button
            onClick={() => exportToCSV(bets)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--color-surface-borders)',
              backgroundColor: 'transparent',
              color: 'var(--color-text-secondary)',
              fontSize: '0.7rem',
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: 'inherit',
              transition: 'all var(--transition-fast)',
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--color-primary)'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--color-primary)'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--color-surface-borders)'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--color-text-secondary)'; }}
          >
            ↓ Exportar CSV
          </button>
        )}
      </div>

      {bets.length === 0 ? (
        <div style={{
          padding: 'var(--space-xxl)',
          textAlign: 'center',
          color: 'var(--color-text-secondary)',
          fontSize: '0.85rem',
          fontStyle: 'italic',
        }}>
          No hay apuestas registradas aún. Pulsa "+ Nueva Apuesta" para empezar.
        </div>
      ) : (
        <>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--color-surface-borders)' }}>
                  <SortableHeader label="Fecha" field="timestamp" {...headerProps} />
                  <SortableHeader label="Evento" field="event" {...headerProps} />
                  <th style={{ padding: 'var(--space-sm) var(--space-md)', textAlign: 'left', color: 'var(--color-text-secondary)', fontWeight: 600, fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>Deporte</th>
                  <th style={{ padding: 'var(--space-sm) var(--space-md)', textAlign: 'left', color: 'var(--color-text-secondary)', fontWeight: 600, fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>Mercado</th>
                  <th style={{ padding: 'var(--space-sm) var(--space-md)', textAlign: 'left', color: 'var(--color-text-secondary)', fontWeight: 600, fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>Pronóstico</th>
                  <SortableHeader label="Cuota" field="odds" {...headerProps} />
                  <SortableHeader label="Stake" field="stake" {...headerProps} />
                  <SortableHeader label="Resultado" field="result" {...headerProps} />
                  <SortableHeader label="P/L" field="netProfit" {...headerProps} />
                  <th style={{ padding: 'var(--space-sm) var(--space-md)', width: '30px' }}></th>
                </tr>
              </thead>
              <tbody>
                {pageBets.map(bet => (
                  <tr
                    key={bet.id}
                    style={{ borderBottom: '1px solid var(--color-surface-borders)', transition: 'background-color var(--transition-fast)' }}
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--color-surface-hover)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                  >
                    <td style={{ padding: 'var(--space-sm) var(--space-md)', whiteSpace: 'nowrap', color: 'var(--color-text-secondary)' }}>
                      {new Date(bet.timestamp).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}
                    </td>
                    <td style={{ padding: 'var(--space-sm) var(--space-md)', fontWeight: 600, maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {bet.event}
                    </td>
                    <td style={{ padding: 'var(--space-sm) var(--space-md)', color: 'var(--color-text-secondary)', fontSize: '0.7rem' }}>
                      {bet.sport}
                    </td>
                    <td style={{ padding: 'var(--space-sm) var(--space-md)', color: 'var(--color-info)' }}>
                      {bet.marketType}
                    </td>
                    <td style={{ padding: 'var(--space-sm) var(--space-md)' }}>
                      {bet.prediction}
                    </td>
                    <td style={{ padding: 'var(--space-sm) var(--space-md)', fontWeight: 700, color: 'var(--color-secondary)' }}>
                      {bet.odds.toFixed(2)}
                    </td>
                    <td style={{ padding: 'var(--space-sm) var(--space-md)' }}>
                      {bet.stake}€
                    </td>
                    <td style={{ padding: 'var(--space-sm) var(--space-md)' }}>
                      {bet.result === 'pending' ? (
                        <select
                          value={bet.result}
                          onChange={(e) => onUpdateResult(bet.id, e.target.value as BetResult)}
                          style={{
                            backgroundColor: 'var(--color-background)',
                            border: `1px solid ${RESULT_COLORS[bet.result]}`,
                            borderRadius: 'var(--radius-sm)',
                            padding: '2px 6px',
                            color: RESULT_COLORS[bet.result],
                            fontSize: '0.7rem',
                            fontFamily: 'inherit',
                            cursor: 'pointer',
                            outline: 'none',
                          }}
                        >
                          <option value="pending">Pendiente</option>
                          <option value="won">Ganada</option>
                          <option value="lost">Perdida</option>
                          <option value="void">Anulada</option>
                          <option value="cashout">Cashout</option>
                        </select>
                      ) : (
                        <span style={{
                          padding: '2px 8px',
                          borderRadius: 'var(--radius-sm)',
                          backgroundColor: `${RESULT_COLORS[bet.result]}15`,
                          color: RESULT_COLORS[bet.result],
                          fontWeight: 600,
                          fontSize: '0.7rem',
                        }}>
                          {RESULT_LABELS[bet.result]}
                        </span>
                      )}
                    </td>
                    <td style={{
                      padding: 'var(--space-sm) var(--space-md)',
                      fontWeight: 800,
                      color: bet.netProfit >= 0 ? 'var(--color-success)' : 'var(--color-danger)',
                      whiteSpace: 'nowrap',
                    }}>
                      {bet.result !== 'pending' ? `${bet.netProfit >= 0 ? '+' : ''}${bet.netProfit.toFixed(2)}€` : '—'}
                    </td>
                    <td style={{ padding: 'var(--space-sm) var(--space-md)' }}>
                      <button
                        onClick={() => onDelete(bet.id)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--color-text-secondary)',
                          cursor: 'pointer',
                          padding: '2px',
                          opacity: 0.5,
                          transition: 'opacity var(--transition-fast)',
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.opacity = '1'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.opacity = '0.5'; }}
                        title="Eliminar apuesta"
                      >
                        <X size={12} />
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
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: 'var(--space-sm) var(--space-lg)',
              borderTop: '1px solid var(--color-surface-borders)',
              fontSize: '0.75rem',
              color: 'var(--color-text-secondary)',
            }}>
              <span>Mostrando {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, bets.length)} de {bets.length}</span>
              <div style={{ display: 'flex', gap: 'var(--space-xs)' }}>
                <button
                  onClick={() => setPage(p => Math.max(0, p - 1))}
                  disabled={page === 0}
                  style={{
                    padding: '4px 10px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--color-surface-borders)',
                    backgroundColor: 'transparent',
                    color: page === 0 ? 'var(--color-surface-borders)' : 'var(--color-text-primary)',
                    cursor: page === 0 ? 'not-allowed' : 'pointer',
                    fontSize: '0.7rem',
                    fontFamily: 'inherit',
                  }}
                >← Anterior</button>
                {Array.from({ length: totalPages }, (_, i) => (
                  <button
                    key={i}
                    onClick={() => setPage(i)}
                    style={{
                      padding: '4px 10px',
                      borderRadius: 'var(--radius-sm)',
                      border: `1px solid ${i === page ? 'var(--color-primary)' : 'var(--color-surface-borders)'}`,
                      backgroundColor: i === page ? 'var(--color-primary)' : 'transparent',
                      color: i === page ? 'white' : 'var(--color-text-secondary)',
                      cursor: 'pointer',
                      fontSize: '0.7rem',
                      fontFamily: 'inherit',
                      fontWeight: i === page ? 700 : 400,
                    }}
                  >{i + 1}</button>
                ))}
                <button
                  onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                  disabled={page === totalPages - 1}
                  style={{
                    padding: '4px 10px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--color-surface-borders)',
                    backgroundColor: 'transparent',
                    color: page === totalPages - 1 ? 'var(--color-surface-borders)' : 'var(--color-text-primary)',
                    cursor: page === totalPages - 1 ? 'not-allowed' : 'pointer',
                    fontSize: '0.7rem',
                    fontFamily: 'inherit',
                  }}
                >Siguiente →</button>
              </div>
            </div>
          )}
        </>
      )}
    </Card>
  );
};



const DATA_SOURCE_CONFIG: Record<DataSource, { label: string; icon: React.ReactNode; color: string }> = {
  firestore: { label: 'Firestore Live', icon: <Database size={12} />, color: 'var(--color-success)' },
  localStorage: { label: 'Local', icon: <HardDrive size={12} />, color: 'var(--color-warning)' },
  mock: { label: 'Demo', icon: <BarChart2 size={12} />, color: 'var(--color-info)' },
};

const DataSourceBadge: React.FC<{ source: DataSource }> = ({ source }) => {
  const config = DATA_SOURCE_CONFIG[source];
  return (
    <div style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '4px',
      padding: '3px 10px',
      borderRadius: 'var(--radius-full)',
      backgroundColor: `${config.color}18`,
      border: `1px solid ${config.color}40`,
      color: config.color,
      fontSize: '0.65rem',
      fontWeight: 700,
      letterSpacing: '0.04em',
    }}>
      {config.icon}
      {config.label}
    </div>
  );
};

/* ─── Page ─── */

export const DashboardPage: React.FC<{ prefill?: Partial<BetFormData>; onClearPrefill?: () => void }> = ({ prefill, onClearPrefill }) => {
  const { currentUser } = useAuth();
  const {
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
    clearMockData,
    dataSource,
    isLoadingBets,
  } = useDashboard({ uid: currentUser?.uid });

  const [isModalOpen, setIsModalOpen] = useState(!!prefill);

  const handleRegisterBet = (formData: BetFormData) => {
    registerBet({
      event: formData.event,
      sport: formData.sport,
      marketType: formData.marketType,
      prediction: formData.prediction,
      bookmaker: formData.bookmaker,
      odds: formData.odds,
      stake: formData.stake,
      result: formData.result,
      ccAtBet: formData.ccAtBet,
    });
  };

  // Chart data
  const bankrollChartData = metrics.bankrollHistory.map((value, index) => ({
    value,
    label: index === 0 ? 'Inicio' : `#${index}`,
  }));

  const roiByMarketChartData = Object.entries(metrics.roiByMarket)
    .map(([label, value]) => ({ value, label: label.slice(0, 6) }))
    .slice(0, 8);

  const radarChartData = Object.entries(metrics.winRateByMarket)
    .map(([label, value]) => ({ value, label: label.slice(0, 8) }))
    .slice(0, 6);

  const bankrollDelta = metrics.bankrollCurrent - metrics.bankrollInitial;
  const bankrollDeltaPercent = ((bankrollDelta / metrics.bankrollInitial) * 100).toFixed(1);

  if (isLoadingBets) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', flexDirection: 'column', gap: 'var(--space-md)' }}>
        <div style={{ width: '40px', height: '40px', borderRadius: '50%', border: '3px solid var(--color-surface-borders)', borderTopColor: 'var(--color-primary)', animation: 'spin 0.8s linear infinite' }} />
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.85rem' }}>Cargando dashboard...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: 'var(--space-xl)', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header */}
      <section style={{ marginBottom: 'var(--space-xl)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)', flexWrap: 'wrap', marginBottom: 'var(--space-xs)' }}>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0, letterSpacing: '-0.02em' }}>
            Panel de <span style={{ color: 'var(--color-primary)' }}>Gestión</span>
          </h1>
          <DataSourceBadge source={dataSource} />
          {dataSource === 'mock' && (
            <button
              onClick={clearMockData}
              title="Eliminar datos de demo y empezar con datos reales"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: '3px 10px',
                borderRadius: 'var(--radius-full)',
                backgroundColor: 'rgba(239,68,68,0.08)',
                border: '1px solid rgba(239,68,68,0.3)',
                color: 'var(--color-danger)',
                fontSize: '0.65rem',
                fontWeight: 700,
                cursor: 'pointer',
                letterSpacing: '0.04em',
              }}
            >
              <Trash2 size={11} /> Limpiar Demo
            </button>
          )}
        </div>
        <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', margin: 0 }}>
          Control financiero multi-mercado · Rendimiento en tiempo real
        </p>
      </section>

      {/* Alerts */}
      <AlertsPanel alerts={alerts} />

      {/* Filters */}
      <FilterBar
        timeFilter={timeFilter}
        onTimeChange={setTimeFilter}
        marketFilter={marketFilter}
        onMarketChange={setMarketFilter}
        availableMarkets={availableMarkets}
        onNewBet={() => setIsModalOpen(true)}
      />

      {/* KPI Grid */}
      <section style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
        gap: 'var(--space-md)',
        marginBottom: 'var(--space-xl)',
      }}>
        <MetricCard
          title="Bankroll"
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
                  color: roi >= 0 ? 'var(--color-success)' : 'var(--color-danger)',
                }}>
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
