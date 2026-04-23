import React, { useState } from 'react';
import type { Prediction, MarketCategory } from '../../data/mockPredictions';
import { MapPin, Clock, BarChart2, Info, ChevronDown, ChevronUp, PlusCircle } from 'lucide-react';
import type { BetFormData } from './BetRegistrationModal';

interface MatchCardProps {
  home: string;
  away: string;
  matchDate: string;
  league: string;
  sport: string;
  predictions: Prediction[];
  accentColor: string;
  onAddToDashboard?: (prefill: Partial<BetFormData>) => void;
}

const MARKET_META: Record<MarketCategory, { icon: string; label: string; color: string }> = {
  ganador:  { icon: '🏆', label: 'Ganador',    color: '#34d399' },
  goles:    { icon: '⚽', label: 'Goles',      color: '#60a5fa' },
  corners:  { icon: '🚩', label: 'Corners',    color: '#f97316' },
  tarjetas: { icon: '🟨', label: 'Tarjetas',   color: '#fbbf24' },
  goleador: { icon: '👟', label: 'Goleador',   color: '#a78bfa' },
  handicap: { icon: '⚖️', label: 'Hándicap',   color: '#fb7185' },
  parcial:  { icon: '⏱️', label: '1ª Parte',   color: '#94a3b8' },
  especial: { icon: '⭐', label: 'Especial',   color: '#e2b96f' },
  props:    { icon: '📊', label: 'Props',      color: '#67e8f9' },
};

export const MatchCard: React.FC<MatchCardProps> = ({
  home,
  away,
  matchDate,
  league,
  sport,
  predictions,
  accentColor,
  onAddToDashboard
}) => {
  // Seleccionar la predicción más óptima (mayor CC)
  const topPrediction = [...predictions].sort((a, b) => b.cc - a.cc)[0];

  const [expandedPredId, setExpandedPredId] = useState<string | null>(topPrediction?.id || null);

  return (
    <article style={{
      backgroundColor: 'var(--color-surface)',
      borderRadius: 'var(--radius-lg)',
      border: `1px solid var(--color-surface-borders)`,
      overflow: 'hidden',
      marginBottom: 'var(--space-md)',
      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
      flexShrink: 0,
    }}>
      {/* ─── ENCABEZADO DEL PARTIDO ─── */}
      <div style={{
        padding: '16px 20px',
        background: `linear-gradient(to right, var(--color-surface-hover), var(--color-surface))`,
        borderBottom: `1px solid var(--color-surface-borders)`,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
          <div>
            <h3 style={{ 
              margin: 0, 
              fontSize: '1.25rem', 
              fontWeight: 900, 
              color: 'var(--color-text-primary)',
              letterSpacing: '-0.02em',
              lineHeight: 1.2
            }}>
              {home} <span style={{ color: 'var(--color-text-secondary)', fontWeight: 400, margin: '0 4px' }}>vs</span> {away}
            </h3>
            <div style={{ 
              display: 'flex', 
              gap: '12px', 
              marginTop: '6px', 
              fontSize: '0.75rem', 
              color: 'var(--color-text-secondary)',
              alignItems: 'center'
            }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Clock size={12} /> {matchDate}
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <MapPin size={12} /> Estadio Local
              </span>
            </div>
          </div>
          
          <div style={{
            backgroundColor: accentColor + '20',
            color: accentColor,
            padding: '4px 8px',
            borderRadius: '4px',
            fontSize: '0.65rem',
            fontWeight: 800,
            textTransform: 'uppercase',
            letterSpacing: '0.05em'
          }}>
            {league}
          </div>
        </div>
      </div>

      {/* ─── LISTA DE 6 OPCIONES ÓPTIMAS ─── */}
      <div style={{ padding: '0' }}>
        <div style={{ 
          padding: '10px 20px', 
          backgroundColor: 'var(--color-background)', 
          borderBottom: '1px solid var(--color-surface-borders)',
          fontSize: '0.65rem',
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          color: 'var(--color-text-secondary)',
          display: 'flex',
          justifyContent: 'space-between'
        }}>
          <span>Mejores opciones detectadas ({predictions.length})</span>
          <span style={{ color: accentColor }}>Top Pick: {topPrediction?.cc}% CC</span>
        </div>

        {predictions.map((pred) => {
          const isExpanded = expandedPredId === pred.id;
          const meta = MARKET_META[pred.market_category] || MARKET_META.ganador;

          return (
            <div key={pred.id} style={{ borderBottom: '1px solid var(--color-surface-borders)' }}>
              {/* FILA DE LA OPCIÓN */}
              <div 
                onClick={() => setExpandedPredId(isExpanded ? null : pred.id)}
                style={{
                  padding: '12px 20px',
                  display: 'flex',
                  alignItems: 'center',
                  cursor: 'pointer',
                  backgroundColor: isExpanded ? 'var(--color-surface-hover)' : 'transparent',
                  transition: 'background 0.2s ease'
                }}
              >
                <div style={{ width: '32px', fontSize: '1.2rem', opacity: 0.9 }}>
                  {meta.icon}
                </div>
                
                <div style={{ flex: 1 }}>
                  <div style={{ 
                    fontSize: '0.95rem', 
                    fontWeight: 800, 
                    color: 'var(--color-text-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    {pred.prediction}
                    {pred.id === topPrediction.id && (
                      <span style={{
                        fontSize: '0.55rem',
                        backgroundColor: '#34d39920',
                        color: '#34d399',
                        padding: '2px 6px',
                        borderRadius: '3px',
                        fontWeight: 800,
                        letterSpacing: '0.05em'
                      }}>RECOMENDADO</span>
                    )}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
                    {meta.label} · {pred.market}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '20px', alignItems: 'center', textAlign: 'right' }}>
                  <div>
                    <div style={{ fontSize: '0.65rem', color: 'var(--color-text-secondary)', fontWeight: 600 }}>CC%</div>
                    <div style={{ fontSize: '1.05rem', fontWeight: 900, color: pred.cc >= 80 ? '#34d399' : '#fbbf24' }}>
                      {pred.cc}%
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.65rem', color: 'var(--color-text-secondary)', fontWeight: 600 }}>CUOTA</div>
                    <div style={{ fontSize: '1.05rem', fontWeight: 900, color: accentColor }}>
                      {pred.bestOdds.toFixed(2)}
                    </div>
                  </div>
                  <div style={{ color: 'var(--color-text-secondary)' }}>
                    {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </div>
                </div>
              </div>

              {/* DETALLE EXPANDIDO (COMPARATIVA DE CUOTAS) */}
              {isExpanded && (
                <div style={{
                  padding: '16px 20px',
                  backgroundColor: 'var(--color-background)',
                  borderTop: '1px dashed var(--color-surface-borders)'
                }}>
                  <div style={{ display: 'flex', gap: '24px' }}>
                    
                    {/* COMPARATIVA BOOKMAKERS */}
                    <div style={{ flex: 1 }}>
                      <h4 style={{ 
                        margin: '0 0 12px 0', 
                        fontSize: '0.7rem', 
                        fontWeight: 800, 
                        color: 'var(--color-text-secondary)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}>
                        <BarChart2 size={12} /> Comparativa Grandes Casas
                      </h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        {pred.bookmakerOdds.map((bk, i) => (
                          <div key={bk.bookmaker} style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '6px 10px',
                            backgroundColor: i === 0 ? accentColor + '15' : 'var(--color-surface)',
                            border: i === 0 ? `1px solid ${accentColor}40` : '1px solid transparent',
                            borderRadius: '4px'
                          }}>
                            <span style={{ fontSize: '0.8rem', color: i === 0 ? 'var(--color-text-primary)' : 'var(--color-text-secondary)', fontWeight: i === 0 ? 700 : 500 }}>
                              {bk.bookmaker}
                            </span>
                            <span style={{ fontSize: '0.9rem', fontWeight: 800, color: i === 0 ? accentColor : 'var(--color-text-primary)' }}>
                              {bk.odds.toFixed(2)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* JUSTIFICACIÓN */}
                    <div style={{ flex: 1 }}>
                      <h4 style={{ 
                        margin: '0 0 12px 0', 
                        fontSize: '0.7rem', 
                        fontWeight: 800, 
                        color: accentColor,
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}>
                        <Info size={12} /> Análisis Estadístico
                      </h4>
                      <p style={{
                        fontSize: '0.8rem',
                        lineHeight: 1.6,
                        color: 'var(--color-text-secondary)',
                        margin: 0
                      }}>
                        {pred.statisticalReason}
                      </p>
                      
                      <div style={{ 
                        marginTop: '16px', 
                        padding: '10px', 
                        backgroundColor: 'rgba(255,255,255,0.03)', 
                        borderRadius: '6px',
                        display: 'flex',
                        justifyContent: 'space-between'
                      }}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>Stake Recomendado:</span>
                        <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--color-text-primary)' }}>
                          {pred.kelly_fraction ? `${(pred.kelly_fraction * 100).toFixed(1)}% del bank` : '1.5%'}
                        </span>
                      </div>
                      
                      {/* REGISTRAR APUESTA BOTÓN */}
                      {onAddToDashboard && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onAddToDashboard({
                              event: `${home} vs ${away}`,
                              sport,
                              marketType: MARKET_META[pred.market_category]?.label || pred.market,
                              prediction: pred.prediction,
                              bookmaker: pred.bookmakerOdds[0]?.bookmaker || 'Bet365',
                              odds: pred.bookmakerOdds[0]?.odds || 1.50,
                              stake: pred.kelly_fraction ? Math.max(1, Math.round(pred.kelly_fraction * 1000)) : 10,
                              result: 'pending',
                              ccAtBet: pred.cc,
                            });
                          }}
                          style={{
                            marginTop: '12px',
                            width: '100%',
                            padding: '10px',
                            backgroundColor: accentColor,
                            color: '#000',
                            border: 'none',
                            borderRadius: '6px',
                            fontWeight: 700,
                            fontSize: '0.8rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                            cursor: 'pointer',
                            transition: 'opacity 0.2s',
                          }}
                          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = '0.9'; }}
                          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = '1'; }}
                        >
                          <PlusCircle size={16} />
                          Registrar Apuesta en Dashboard
                        </button>
                      )}
                    </div>

                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </article>
  );
};
