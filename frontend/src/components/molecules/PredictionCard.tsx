import React, { useState } from 'react';
import type { Prediction, MarketCategory } from '../../data/mockPredictions';
import { ChevronDown, ChevronUp, BookmarkPlus, TrendingUp, BarChart2, Info } from 'lucide-react';
import type { BetFormData } from '../molecules/BetRegistrationModal';

interface PredictionCardProps {
  prediction: Prediction;
  index: number;
  accentColor: string;
  sport: string;
  onAddToDashboard?: (prefill: Partial<BetFormData>) => void;
}

/* ─── Tokens semánticos por tipo de mercado ─── */
const MARKET_META: Record<MarketCategory, { icon: string; label: string; color: string }> = {
  ganador:  { icon: '🏆', label: 'Resultado',  color: '#34d399' },
  goles:    { icon: '⚽', label: 'Goles',      color: '#60a5fa' },
  corners:  { icon: '🚩', label: 'Corners',    color: '#f97316' },
  tarjetas: { icon: '🟨', label: 'Tarjetas',   color: '#fbbf24' },
  goleador: { icon: '👟', label: 'Goleador',   color: '#a78bfa' },
  handicap: { icon: '⚖️', label: 'Hándicap',   color: '#fb7185' },
  parcial:  { icon: '⏱️', label: 'Parcial',    color: '#94a3b8' },
  especial: { icon: '⭐', label: 'Especial',   color: '#e2b96f' },
  props:    { icon: '📊', label: 'Props',      color: '#67e8f9' },
};

const getCCStyle = (cc: number): { color: string; label: string } => {
  if (cc >= 90) return { color: '#34d399', label: 'MUY ALTA' };
  if (cc >= 80) return { color: '#60a5fa', label: 'ALTA' };
  return { color: '#fbbf24', label: 'BUENA' };
};

/* ─── Subcomponente: Fila de cuota por bookmaker ─── */
const BookmakerRow: React.FC<{
  bookmaker: string;
  odds: number;
  isBest: boolean;
  accentColor: string;
}> = ({ bookmaker, odds, isBest, accentColor }) => (
  <div style={{
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '6px 10px',
    borderRadius: 'var(--radius-sm)',
    backgroundColor: isBest ? accentColor + '15' : 'transparent',
    border: isBest ? `1px solid ${accentColor}40` : '1px solid transparent',
    transition: 'background var(--transition-fast)',
  }}>
    <span style={{
      fontSize: '0.78rem',
      color: isBest ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
      fontWeight: isBest ? 700 : 400,
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
    }}>
      {isBest && (
        <span style={{
          fontSize: '0.6rem',
          backgroundColor: accentColor,
          color: '#000',
          padding: '1px 5px',
          borderRadius: '3px',
          fontWeight: 800,
          letterSpacing: '0.05em',
        }}>MEJOR</span>
      )}
      {bookmaker}
    </span>
    <span style={{
      fontSize: '0.9rem',
      fontWeight: 800,
      color: isBest ? accentColor : 'var(--color-text-primary)',
    }}>
      {odds.toFixed(2)}
    </span>
  </div>
);

/* ─── Componente Principal ─── */
export const PredictionCard: React.FC<PredictionCardProps> = ({
  prediction,
  index,
  accentColor,
  sport,
  onAddToDashboard,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const meta = MARKET_META[prediction.market_category] ?? MARKET_META.ganador;
  const ccStyle = getCCStyle(prediction.cc);
  const bestOdds = prediction.bestOdds ?? prediction.bookmakerOdds[0]?.odds ?? 1.0;
  const kellyPct = prediction.kelly_fraction
    ? `${(prediction.kelly_fraction * 100).toFixed(1)}%`
    : null;

  const handleAddToDashboard = (e: React.MouseEvent) => {
    e.stopPropagation();
    onAddToDashboard?.({
      sport,
      competition: prediction.league,
      match: `${prediction.home} vs ${prediction.away}`,
      market: prediction.market,
      prediction: prediction.prediction,
      odds: prediction.bestOdds,
      bookmaker: prediction.bestBookmaker,
    });
  };

  return (
    <article
      style={{
        backgroundColor: 'var(--color-surface)',
        borderRadius: 'var(--radius-lg)',
        border: `1px solid ${isExpanded ? accentColor + '50' : 'var(--color-surface-borders)'}`,
        overflow: 'hidden',
        transition: 'border-color var(--transition-fast), box-shadow var(--transition-fast)',
        boxShadow: isExpanded ? `0 0 0 1px ${accentColor}30` : 'none',
      }}
    >
      {/* ─── CABECERA: Número + Liga + Mercado ─── */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--space-sm)',
        padding: '10px var(--space-md)',
        borderBottom: `1px solid var(--color-surface-borders)`,
        backgroundColor: 'var(--color-surface-hover)',
      }}>
        <span style={{
          fontSize: '0.6rem',
          fontWeight: 800,
          color: 'var(--color-text-inverse)',
          backgroundColor: accentColor,
          width: '20px', height: '20px',
          borderRadius: '50%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          {index + 1}
        </span>

        {/* Icono + badge de tipo de mercado */}
        <span style={{ fontSize: '0.95rem', lineHeight: 1 }}>{meta.icon}</span>
        <span style={{
          fontSize: '0.6rem',
          fontWeight: 800,
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
          color: meta.color,
          backgroundColor: meta.color + '18',
          padding: '2px 7px',
          borderRadius: 'var(--radius-sm)',
        }}>
          {meta.label}
        </span>

        {/* Nombre completo del mercado */}
        <span style={{
          fontSize: '0.72rem',
          color: 'var(--color-text-secondary)',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}>
          {prediction.market}
        </span>

        {/* Live badge */}
        {prediction.isLive && (
          <span style={{
            marginLeft: 'auto',
            fontSize: '0.55rem',
            fontWeight: 800,
            color: '#ef4444',
            backgroundColor: '#ef444420',
            padding: '2px 6px',
            borderRadius: 'var(--radius-sm)',
            letterSpacing: '0.06em',
            animation: 'pulse 2s infinite',
          }}>
            EN VIVO
          </span>
        )}
      </div>

      {/* ─── CUERPO: Partido + Predicción exacta ─── */}
      <button
        onClick={() => setIsExpanded(prev => !prev)}
        style={{
          width: '100%',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          textAlign: 'left',
          padding: 'var(--space-md)',
        }}
      >
        {/* Equipos y fecha */}
        <div style={{ marginBottom: 'var(--space-sm)' }}>
          <p style={{
            fontSize: '0.88rem',
            fontWeight: 800,
            color: 'var(--color-text-primary)',
            margin: '0 0 4px 0',
            letterSpacing: '-0.01em',
          }}>
            {prediction.home}
            <span style={{ fontWeight: 400, color: 'var(--color-text-secondary)', margin: '0 6px' }}>vs</span>
            {prediction.away}
          </p>
          <p style={{
            fontSize: '0.72rem',
            color: 'var(--color-text-secondary)',
            margin: 0,
          }}>
            🕐 {prediction.matchDate}
            <span style={{ margin: '0 6px', opacity: 0.4 }}>·</span>
            {prediction.league}
          </p>
        </div>

        {/* ─── PREDICCIÓN EXACTA (elemento más prominente) ─── */}
        <div style={{
          backgroundColor: accentColor + '12',
          border: `1px solid ${accentColor}35`,
          borderRadius: 'var(--radius-md)',
          padding: '10px var(--space-md)',
          marginBottom: 'var(--space-md)',
        }}>
          <p style={{
            fontSize: '0.6rem',
            fontWeight: 700,
            color: accentColor,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            margin: '0 0 4px 0',
          }}>
            Predicción exacta
          </p>
          <p style={{
            fontSize: '1.05rem',
            fontWeight: 900,
            color: 'var(--color-text-primary)',
            margin: 0,
            letterSpacing: '-0.02em',
            lineHeight: 1.2,
          }}>
            {meta.icon} {prediction.prediction}
          </p>
        </div>

        {/* ─── MÉTRICAS: CC + Cuota + Kelly ─── */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr',
          gap: 'var(--space-sm)',
        }}>
          {/* CC */}
          <div style={{ textAlign: 'center' }}>
            <p style={{
              fontSize: '0.55rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              color: 'var(--color-text-secondary)',
              margin: '0 0 2px 0',
            }}>
              Confianza
            </p>
            <p style={{
              fontSize: '1.2rem',
              fontWeight: 900,
              color: ccStyle.color,
              margin: 0,
              lineHeight: 1,
            }}>
              {prediction.cc}%
            </p>
            <p style={{
              fontSize: '0.55rem',
              color: ccStyle.color,
              margin: '2px 0 0 0',
              fontWeight: 700,
              opacity: 0.8,
            }}>
              {ccStyle.label}
            </p>
          </div>

          {/* Mejor cuota */}
          <div style={{
            textAlign: 'center',
            borderLeft: '1px solid var(--color-surface-borders)',
            borderRight: '1px solid var(--color-surface-borders)',
          }}>
            <p style={{
              fontSize: '0.55rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              color: 'var(--color-text-secondary)',
              margin: '0 0 2px 0',
            }}>
              Mejor cuota
            </p>
            <p style={{
              fontSize: '1.2rem',
              fontWeight: 900,
              color: accentColor,
              margin: 0,
              lineHeight: 1,
            }}>
              {bestOdds.toFixed(2)}
            </p>
            <p style={{
              fontSize: '0.55rem',
              color: 'var(--color-text-secondary)',
              margin: '2px 0 0 0',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}>
              {prediction.bestBookmaker}
            </p>
          </div>

          {/* Kelly / Stake */}
          <div style={{ textAlign: 'center' }}>
            <p style={{
              fontSize: '0.55rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              color: 'var(--color-text-secondary)',
              margin: '0 0 2px 0',
            }}>
              Stake Kelly
            </p>
            <p style={{
              fontSize: '1.2rem',
              fontWeight: 900,
              color: 'var(--color-text-primary)',
              margin: 0,
              lineHeight: 1,
            }}>
              {kellyPct ?? `${((1 / bestOdds) * 25).toFixed(1)}%`}
            </p>
            <p style={{
              fontSize: '0.55rem',
              color: 'var(--color-text-secondary)',
              margin: '2px 0 0 0',
            }}>
              del bankroll
            </p>
          </div>
        </div>

        {/* Expand toggle */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          marginTop: 'var(--space-sm)',
          color: 'var(--color-text-secondary)',
          fontSize: '0.7rem',
          gap: '4px',
          alignItems: 'center',
        }}>
          {isExpanded
            ? <><ChevronUp size={12} /> Ocultar análisis</>
            : <><ChevronDown size={12} /> Ver cuotas y análisis</>
          }
        </div>
      </button>

      {/* ─── DETALLE EXPANDIDO ─── */}
      {isExpanded && (
        <div style={{
          borderTop: `1px solid var(--color-surface-borders)`,
          padding: 'var(--space-md)',
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-md)',
          animation: 'slideDown 250ms ease-out',
        }}>

          {/* Tabla de cuotas por bookmaker */}
          {prediction.bookmakerOdds && prediction.bookmakerOdds.length > 0 && (
            <div>
              <p style={{
                fontSize: '0.65rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                color: 'var(--color-text-secondary)',
                margin: '0 0 var(--space-xs) 0',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
              }}>
                <BarChart2 size={11} /> Comparativa de cuotas — {prediction.prediction}
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                {prediction.bookmakerOdds
                  .slice()
                  .sort((a, b) => b.odds - a.odds)
                  .map((bk, i) => (
                    <BookmakerRow
                      key={bk.bookmaker}
                      bookmaker={bk.bookmaker}
                      odds={bk.odds}
                      isBest={i === 0}
                      accentColor={accentColor}
                    />
                  ))}
              </div>
            </div>
          )}

          {/* Justificación estadística */}
          <div style={{
            backgroundColor: 'var(--color-background)',
            borderRadius: 'var(--radius-sm)',
            padding: 'var(--space-sm)',
            borderLeft: `3px solid ${accentColor}`,
          }}>
            <p style={{
              fontSize: '0.65rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              color: accentColor,
              margin: '0 0 5px 0',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
            }}>
              <Info size={11} /> Por qué esta predicción
            </p>
            <p style={{
              fontSize: '0.78rem',
              color: 'var(--color-text-secondary)',
              lineHeight: 1.6,
              margin: 0,
            }}>
              {prediction.statisticalReason}
            </p>
          </div>

          {/* Botón Registrar en Dashboard */}
          {onAddToDashboard && (
            <button
              onClick={handleAddToDashboard}
              style={{
                width: '100%',
                padding: '10px',
                backgroundColor: accentColor,
                color: '#000',
                border: 'none',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.8rem',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                transition: 'opacity var(--transition-fast)',
              }}
              onMouseEnter={e => (e.currentTarget.style.opacity = '0.85')}
              onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
            >
              <BookmarkPlus size={14} />
              Registrar apuesta en Dashboard
            </button>
          )}
        </div>
      )}
    </article>
  );
};
