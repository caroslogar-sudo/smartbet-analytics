import React from 'react';
import { Card } from '../atoms/Card';
import { Badge } from '../atoms/Badge';
import { useLiveTop10 } from '../../hooks/useLiveTop10';
import type { Opportunity } from '../../hooks/useLiveTop10';
import {
  Trophy,
  CircleDot,
  Zap,
  TrendingUp,
  AlertTriangle,
  Shield,
  Scale,
  Phone,
  ExternalLink
} from 'lucide-react';

/* ─── Helpers ─── */
const getSportIcon = (sport: string) => {
  switch (sport) {
    case 'Fútbol': return <Trophy size={20} />;
    case 'Baloncesto': return <CircleDot size={20} />;
    case 'Tenis': return <TrendingUp size={20} />;
    default: return <Zap size={20} />;
  }
};

const getSportGradient = (sport: string): string => {
  switch (sport) {
    case 'Fútbol': return 'linear-gradient(135deg, #1a6b3c 0%, #0f4025 100%)';
    case 'Baloncesto': return 'linear-gradient(135deg, #b45309 0%, #78350f 100%)';
    case 'Tenis': return 'linear-gradient(135deg, #4d7c0f 0%, #365314 100%)';
    default: return 'linear-gradient(135deg, #6d28d9 0%, #4c1d95 100%)';
  }
};

const getSportAccent = (sport: string): string => {
  switch (sport) {
    case 'Fútbol': return '#34d399';
    case 'Baloncesto': return '#fbbf24';
    case 'Tenis': return '#a3e635';
    default: return '#a78bfa';
  }
};

/* ─── Sub-components ─── */

const WelcomeHeader: React.FC = () => (
  <section style={{
    textAlign: 'center',
    padding: 'var(--space-xxl) var(--space-xl) var(--space-lg)',
  }}>
    <h1 style={{
      fontSize: '2.5rem',
      fontWeight: 800,
      margin: 0,
      lineHeight: 1.2,
      letterSpacing: '-0.02em'
    }}>
      Bienvenido a <span style={{ color: 'var(--color-primary)' }}>SmartBet</span>
      <span style={{ color: 'var(--color-secondary)' }}>.</span>
    </h1>
    <p style={{
      fontSize: '1.1rem',
      color: 'var(--color-text-secondary)',
      marginTop: 'var(--space-sm)',
      maxWidth: '600px',
      marginLeft: 'auto',
      marginRight: 'auto',
      lineHeight: 1.6
    }}>
      Plataforma de análisis predictivo multi-mercado de alto rendimiento.
      Explota las ineficiencias del mercado con inteligencia artificial.
    </p>
  </section>
);

interface SportHighlightCardProps {
  sport: string;
  topOpportunity: Opportunity | null;
  label: string;
}

const SportHighlightCard: React.FC<SportHighlightCardProps> = ({ sport, topOpportunity, label }) => {
  const gradient = getSportGradient(sport);
  const accent = getSportAccent(sport);

  const [isRevealed, setIsRevealed] = React.useState(false);

  return (
    <Card 
      interactive 
      onClick={() => setIsRevealed(true)}
      style={{
        flex: '1 1 0',
        minWidth: '280px',
        background: gradient,
        border: isRevealed ? `1px solid ${accent}66` : `1px solid ${accent}33`,
        padding: 0,
        overflow: 'hidden',
        transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
        transform: isRevealed ? 'translateY(-5px)' : 'translateY(0)',
        boxShadow: isRevealed ? `0 15px 30px -10px ${accent}44` : 'none'
      }}
    >
      <div style={{ padding: 'var(--space-lg)' }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 'var(--space-md)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: `${accent}22`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: accent
            }}>
              {getSportIcon(sport)}
            </div>
            <span style={{
              fontSize: '0.8rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: accent
            }}>
              {label}
            </span>
          </div>
          {topOpportunity?.is_live && (
            <Badge text="EN VIVO" variant="danger" />
          )}
        </div>

        {/* Content */}
        {!topOpportunity ? (
          <div style={{ padding: 'var(--space-md) 0' }}>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', fontStyle: 'italic' }}>
              Sin oportunidades disponibles ahora.
            </p>
          </div>
        ) : (
          <>
            <h3 style={{
              fontSize: '1.1rem',
              fontWeight: 800,
              margin: '0 0 var(--space-xs) 0',
              textTransform: 'uppercase',
              lineHeight: 1.3
            }}>
              {topOpportunity.home}{' '}
              <span style={{ color: 'var(--color-text-secondary)', fontWeight: 400 }}>vs</span>{' '}
              {topOpportunity.away}
            </h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', margin: '0 0 var(--space-md) 0' }}>
              {topOpportunity.comp} • {topOpportunity.commence_time ? new Date(topOpportunity.commence_time).toLocaleString('es-ES', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'Hoy'}
            </p>

            {/* Stats row with Reveal mechanism */}
            <div style={{
              display: 'flex',
              gap: 'var(--space-md)',
              alignItems: 'center',
              flexWrap: 'wrap',
              position: 'relative'
            }}>
              <div style={{
                backgroundColor: `${accent}22`,
                padding: 'var(--space-xs) var(--space-sm)',
                borderRadius: 'var(--radius-sm)',
                border: `1px solid ${accent}40`,
                width: '100%',
                marginBottom: '4px',
                minHeight: '44px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                cursor: isRevealed ? 'default' : 'pointer'
              }}>
                <div style={{ fontSize: '0.6rem', color: accent, letterSpacing: '0.05em' }}>PRONÓSTICO RECOMENDADO</div>
                {!isRevealed ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'white', fontSize: '0.85rem', fontWeight: 700 }}>
                    <Zap size={14} color={accent} fill={accent} /> Revelar con IA
                  </div>
                ) : (
                  <div style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--color-text-primary)', animation: 'fadeIn 0.5s ease-out' }}>
                    {topOpportunity.prediction}
                  </div>
                )}
              </div>
              
              <div style={{ display: 'flex', gap: 'var(--space-sm)', width: '100%' }}>
                <div style={{
                  backgroundColor: 'rgba(0,0,0,0.3)',
                  padding: 'var(--space-xs) var(--space-sm)',
                  borderRadius: 'var(--radius-sm)',
                  flex: 1
                }}>
                  <div style={{ fontSize: '0.6rem', color: 'var(--color-text-secondary)', letterSpacing: '0.05em' }}>CC</div>
                  {!isRevealed ? (
                    <div style={{ height: '18px', width: '24px', backgroundColor: accent, opacity: 0.2, filter: 'blur(4px)', marginTop: '2px' }}></div>
                  ) : (
                    <div style={{ fontSize: '0.85rem', fontWeight: 800, color: accent, animation: 'fadeIn 0.5s ease-out' }}>{topOpportunity.cc}%</div>
                  )}
                </div>
                <div style={{
                  backgroundColor: 'rgba(0,0,0,0.3)',
                  padding: 'var(--space-xs) var(--space-sm)',
                  borderRadius: 'var(--radius-sm)',
                  flex: 1
                }}>
                  <div style={{ fontSize: '0.6rem', color: 'var(--color-text-secondary)', letterSpacing: '0.05em' }}>CUOTA</div>
                  {!isRevealed ? (
                    <div style={{ height: '18px', width: '30px', backgroundColor: 'var(--color-secondary)', opacity: 0.2, filter: 'blur(4px)', marginTop: '2px' }}></div>
                  ) : (
                    <div style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--color-secondary)', animation: 'fadeIn 0.5s ease-out' }}>
                      {topOpportunity.odds.toFixed(2)}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Bottom accent bar */}
      <div style={{
        height: '3px',
        background: `linear-gradient(to right, ${accent}, transparent)`
      }} />
    </Card>
  );
};

const LegalDisclaimer: React.FC = () => (
  <footer style={{
    padding: 'var(--space-xxl) var(--space-xl)',
    borderTop: '1px solid var(--color-surface-borders)',
    marginTop: 'var(--space-xxl)'
  }}>
    {/* Bloque principal de riesgo */}
    <div style={{
      backgroundColor: 'rgba(245, 158, 11, 0.08)',
      border: '1px solid rgba(245, 158, 11, 0.25)',
      borderRadius: 'var(--radius-lg)',
      padding: 'var(--space-xl)',
      marginBottom: 'var(--space-xl)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', marginBottom: 'var(--space-md)' }}>
        <AlertTriangle size={20} color="var(--color-warning)" />
        <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-warning)', margin: 0 }}>
          Advertencia sobre Riesgos de las Apuestas
        </h3>
      </div>
      <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', lineHeight: 1.7, margin: '0 0 var(--space-md) 0' }}>
        Las apuestas deportivas implican un <strong style={{ color: 'var(--color-text-primary)' }}>riesgo significativo de pérdida económica</strong>.
        No apuestes dinero que no puedas permitirte perder. Las rachas de pérdidas son inevitables incluso con análisis
        estadísticos avanzados. Ningún sistema, algoritmo o modelo predictivo puede garantizar ganancias consistentes.
      </p>
      <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', lineHeight: 1.7, margin: '0 0 var(--space-md) 0' }}>
        El juego compulsivo es un trastorno reconocido que afecta a millones de personas. Si sientes que pierdes el control
        sobre cuánto tiempo o dinero dedicas a las apuestas, <strong style={{ color: 'var(--color-text-primary)' }}>busca ayuda profesional inmediatamente</strong>.
      </p>
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: 'var(--space-md)',
        marginTop: 'var(--space-md)'
      }}>
        <a href="https://www.jugarbien.es" target="_blank" rel="noopener noreferrer"
          style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            fontSize: '0.8rem', color: 'var(--color-primary)',
            textDecoration: 'none', padding: 'var(--space-xs) var(--space-sm)',
            backgroundColor: 'var(--color-surface)', borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--color-surface-borders)'
          }}>
          <ExternalLink size={12} /> Jugarbien.es
        </a>
        <a href="https://www.fejar.org" target="_blank" rel="noopener noreferrer"
          style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            fontSize: '0.8rem', color: 'var(--color-primary)',
            textDecoration: 'none', padding: 'var(--space-xs) var(--space-sm)',
            backgroundColor: 'var(--color-surface)', borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--color-surface-borders)'
          }}>
          <ExternalLink size={12} /> FEJAR – Federación Española de Jugadores Rehabilitados
        </a>
        <span style={{
          display: 'flex', alignItems: 'center', gap: '6px',
          fontSize: '0.8rem', color: 'var(--color-text-secondary)',
          padding: 'var(--space-xs) var(--space-sm)',
          backgroundColor: 'var(--color-surface)', borderRadius: 'var(--radius-sm)',
          border: '1px solid var(--color-surface-borders)'
        }}>
          <Phone size={12} /> Línea de atención: 900 200 225
        </span>
      </div>
    </div>

    {/* Bloque legal */}
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
      gap: 'var(--space-lg)'
    }}>
      {/* Disclaimer IA */}
      <div style={{
        backgroundColor: 'var(--color-surface)',
        border: '1px solid var(--color-surface-borders)',
        borderRadius: 'var(--radius-md)',
        padding: 'var(--space-lg)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', marginBottom: 'var(--space-sm)' }}>
          <TrendingUp size={16} color="var(--color-info)" />
          <h4 style={{ fontSize: '0.85rem', fontWeight: 700, margin: 0 }}>Sobre el Motor de IA</h4>
        </div>
        <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', lineHeight: 1.6, margin: 0 }}>
          SmartBet Analytics utiliza modelos de Inteligencia Artificial para analizar datos estadísticos públicos.
          Las predicciones y el Índice de Confianza Compuesta (CC) son estimaciones matemáticas basadas en datos históricos
          y <strong>en ningún caso constituyen consejo financiero, asesoramiento de inversión ni garantía de resultados</strong>.
          Los resultados pasados no garantizan rendimientos futuros.
        </p>
      </div>

      {/* Regulación */}
      <div style={{
        backgroundColor: 'var(--color-surface)',
        border: '1px solid var(--color-surface-borders)',
        borderRadius: 'var(--radius-md)',
        padding: 'var(--space-lg)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', marginBottom: 'var(--space-sm)' }}>
          <Scale size={16} color="var(--color-warning)" />
          <h4 style={{ fontSize: '0.85rem', fontWeight: 700, margin: 0 }}>Marco Regulatorio</h4>
        </div>
        <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', lineHeight: 1.6, margin: 0 }}>
          Esta plataforma no gestiona apuestas ni opera como casa de apuestas. Cumplimiento con la Ley 13/2011 de regulación
          del juego (España) y la DGOJ (Dirección General de Ordenación del Juego). El acceso está restringido a mayores de 18 años.
          Los usuarios son responsables de cumplir la legislación aplicable en su jurisdicción.
        </p>
      </div>

      {/* Protección de Datos */}
      <div style={{
        backgroundColor: 'var(--color-surface)',
        border: '1px solid var(--color-surface-borders)',
        borderRadius: 'var(--radius-md)',
        padding: 'var(--space-lg)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', marginBottom: 'var(--space-sm)' }}>
          <Shield size={16} color="var(--color-success)" />
          <h4 style={{ fontSize: '0.85rem', fontWeight: 700, margin: 0 }}>Protección de Datos (GDPR)</h4>
        </div>
        <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', lineHeight: 1.6, margin: 0 }}>
          Tus datos personales son tratados conforme al Reglamento General de Protección de Datos (UE) 2016/679.
          Solo recopilamos la información estrictamente necesaria para el funcionamiento del servicio. Puedes ejercer tus derechos
          de acceso, rectificación, supresión y portabilidad en cualquier momento. Cifrado TLS 1.3 en tránsito y AES-256 en reposo.
        </p>
      </div>
    </div>

    {/* Footer mínimo */}
    <div style={{
      textAlign: 'center',
      marginTop: 'var(--space-xl)',
      paddingTop: 'var(--space-md)',
      borderTop: '1px solid var(--color-surface-borders)'
    }}>
      <p style={{ fontSize: '0.7rem', color: 'var(--color-text-secondary)', margin: 0, lineHeight: 1.6 }}>
        © {new Date().getFullYear()} SmartBet Analytics — Plataforma de Análisis Predictivo Multi-Mercado.
        Todos los derechos reservados. Servicio exclusivo para mayores de 18 años.
        Apuesta con responsabilidad: establece límites, no persigas pérdidas.
      </p>
    </div>
  </footer>
);

/* ─── Page Principal ─── */
export const HomePage: React.FC = () => {
  const { opportunities } = useLiveTop10();

  // Obtener la mejor oportunidad por deporte para las 3 tarjetas top
  const getBestBySport = (sportName: string): Opportunity | null => {
    const filtered = opportunities
      .filter(o => o.sport === sportName)
      .sort((a, b) => b.cc - a.cc);
    return filtered.length > 0 ? filtered[0] : null;
  };

  // El deporte "alternativo" es el mejor que no sea Fútbol ni Baloncesto
  const getAlternativeTop = (): { sport: string; opp: Opportunity | null } => {
    const altOpps = opportunities
      .filter(o => o.sport !== 'Fútbol' && o.sport !== 'Baloncesto')
      .sort((a, b) => b.cc - a.cc);

    if (altOpps.length > 0) {
      return { sport: altOpps[0].sport, opp: altOpps[0] };
    }
    return { sport: 'Alternativo', opp: null };
  };

  const futbolTop = getBestBySport('Fútbol');
  const basketTop = getBestBySport('Baloncesto');
  const alt = getAlternativeTop();

  return (
    <div>
      <WelcomeHeader />

      {/* 3 Tarjetas Top */}
      <section style={{
        padding: '0 var(--space-xl) var(--space-xl)',
        display: 'flex',
        gap: 'var(--space-lg)',
        flexWrap: 'wrap'
      }}>
        <SportHighlightCard sport="Fútbol" topOpportunity={futbolTop} label="Top Fútbol" />
        <SportHighlightCard sport="Baloncesto" topOpportunity={basketTop} label="Top Baloncesto" />
        <SportHighlightCard sport={alt.sport} topOpportunity={alt.opp} label={`Top ${alt.sport}`} />
      </section>

      {/* ─── SECCIÓN EXCLUSIVA: LAS 10 JOYAS DEL DÍA (>75% CC) ─── */}
      <section style={{
        padding: 'var(--space-xl) var(--space-xl)',
        maxWidth: '1400px',
        margin: '0 auto'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 'var(--space-lg)',
          borderLeft: '4px solid #fbbf24',
          paddingLeft: '16px'
        }}>
          <div>
            <h2 style={{ fontSize: '1.8rem', fontWeight: 900, margin: 0, letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Zap size={24} color="#fbbf24" fill="#fbbf24" />
              Las 10 Joyas del Día
            </h2>
            <p style={{ color: 'var(--color-text-secondary)', margin: '4px 0 0 0', fontSize: '0.9rem' }}>
              Selecciones exclusivas con fiabilidad superior al <strong style={{ color: '#fbbf24' }}>75%</strong> detectadas por el algoritmo.
            </p>
          </div>
          <Badge text="MÁXIMA FIABILIDAD" variant="warning" />
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
          gap: 'var(--space-md)',
        }}>
          {opportunities
            .filter(o => o.cc >= 75)
            .sort((a, b) => b.cc - a.cc)
            .slice(0, 10)
            .map((o, idx) => {
              const [isRevealed, setIsRevealed] = React.useState(false);
              
              return (
                <div 
                  key={o.id} 
                  onClick={() => setIsRevealed(true)}
                  style={{
                    backgroundColor: 'var(--color-surface)',
                    borderRadius: 'var(--radius-lg)',
                    border: isRevealed ? '1px solid rgba(251, 191, 36, 0.4)' : '1px solid rgba(251, 191, 36, 0.1)',
                    padding: 'var(--space-lg)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px',
                    position: 'relative',
                    overflow: 'hidden',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    cursor: isRevealed ? 'default' : 'pointer',
                    boxShadow: isRevealed ? '0 10px 25px -5px rgba(251, 191, 36, 0.1)' : 'none',
                    transform: isRevealed ? 'scale(1.02)' : 'scale(1)'
                  }}
                >
                  <div style={{
                    fontSize: '1.5rem',
                    fontWeight: 900,
                    color: 'rgba(251, 191, 36, 0.1)',
                    position: 'absolute',
                    right: '10px',
                    bottom: '-5px',
                    zIndex: 0
                  }}>
                    #{idx + 1}
                  </div>
                  
                  <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '12px',
                    backgroundColor: 'rgba(251, 191, 36, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fbbf24',
                    flexShrink: 0
                  }}>
                    {getSportIcon(o.sport)}
                  </div>

                  <div style={{ flex: 1, zIndex: 1 }}>
                    <div style={{ fontSize: '0.65rem', fontWeight: 800, color: '#fbbf24', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      {o.comp}
                    </div>
                    <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--color-text-primary)' }}>
                      {o.home} vs {o.away}
                    </div>
                    
                    <div style={{ 
                      marginTop: '4px',
                      position: 'relative',
                      minHeight: '20px'
                    }}>
                      {!isRevealed ? (
                        <div style={{ 
                          fontSize: '0.85rem', 
                          fontWeight: 700, 
                          color: '#fbbf24', 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: '6px'
                        }}>
                          <Zap size={14} /> Toca para revelar pick
                        </div>
                      ) : (
                        <div style={{ 
                          fontSize: '0.85rem', 
                          fontWeight: 700, 
                          color: 'var(--color-secondary)',
                          animation: 'fadeIn 0.5s ease-out'
                        }}>
                          {o.prediction}
                        </div>
                      )}
                    </div>
                  </div>

                  <div style={{ textAlign: 'right', zIndex: 1, minWidth: '50px' }}>
                    <div style={{ fontSize: '0.6rem', color: 'var(--color-text-secondary)', fontWeight: 700 }}>CC%</div>
                    {!isRevealed ? (
                      <div style={{ 
                        width: '32px', 
                        height: '16px', 
                        backgroundColor: 'rgba(251, 191, 36, 0.2)', 
                        borderRadius: '4px',
                        marginLeft: 'auto',
                        marginTop: '4px',
                        filter: 'blur(4px)'
                      }}></div>
                    ) : (
                      <div style={{ 
                        fontSize: '1.2rem', 
                        fontWeight: 900, 
                        color: '#fbbf24',
                        animation: 'fadeIn 0.5s ease-out'
                      }}>
                        {o.cc}%
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          }
          {opportunities.filter(o => o.cc >= 75).length === 0 && (
            <div style={{
              gridColumn: '1 / -1',
              padding: 'var(--space-xxl)',
              textAlign: 'center',
              backgroundColor: 'rgba(255,255,255,0.02)',
              borderRadius: 'var(--radius-xl)',
              border: '1px dashed var(--color-surface-borders)'
            }}>
              <p style={{ color: 'var(--color-text-secondary)', fontStyle: 'italic' }}>
                Buscando gemas en el mercado... Vuelve en unos minutos.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* ─── NUEVA SECCIÓN: CONSULTA DE DATOS (AHORRO API) ─── */}
      <section style={{
        padding: 'var(--space-xl) var(--space-xl)',
        maxWidth: '1400px',
        margin: '0 auto'
      }}>
        <div style={{
          backgroundColor: 'var(--color-surface)',
          borderRadius: 'var(--radius-xl)',
          border: '1px solid var(--color-surface-borders)',
          overflow: 'hidden',
          boxShadow: '0 10px 30px rgba(0,0,0,0.2)'
        }}>
          <div style={{
            padding: 'var(--space-xl)',
            borderBottom: '1px solid var(--color-surface-borders)',
            background: 'linear-gradient(90deg, var(--color-surface), var(--color-surface-hover))'
          }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 900, margin: 0, display: 'flex', alignItems: 'center', gap: '12px' }}>
              <ExternalLink size={24} color="var(--color-primary)" />
              Centro de Consulta de Datos en Tiempo Real
            </h2>
            <p style={{ color: 'var(--color-text-secondary)', marginTop: '8px', fontSize: '0.95rem' }}>
              Utiliza estas fuentes de referencia para contrastar nuestras predicciones y seguir marcadores sin coste de API.
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: 'var(--space-lg)',
            padding: 'var(--space-xl)',
          }}>
            {/* Fuente 1: Marcadores */}
            <div style={{
              padding: 'var(--space-lg)',
              backgroundColor: 'rgba(255,255,255,0.03)',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--color-surface-borders)',
              transition: 'transform 0.3s ease',
              cursor: 'pointer'
            }}>
              <div style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--color-primary)', textTransform: 'uppercase', marginBottom: '8px' }}>Marcadores en Vivo</div>
              <h4 style={{ margin: '0 0 12px 0', fontSize: '1.2rem' }}>Flashscore / Mis Marcadores</h4>
              <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', lineHeight: 1.5, marginBottom: '20px' }}>
                La referencia número 1 para seguir tus predicciones en tiempo real con estadísticas profundas de cada partido.
              </p>
              <a href="https://www.flashscore.es" target="_blank" rel="noopener noreferrer" style={{
                display: 'inline-flex', alignItems: 'center', gap: '8px',
                padding: '10px 20px', backgroundColor: 'var(--color-primary)',
                color: 'white', borderRadius: 'var(--radius-md)', fontWeight: 700, textDecoration: 'none', fontSize: '0.9rem'
              }}>
                Abrir Marcadores <ExternalLink size={14} />
              </a>
            </div>

            {/* Fuente 2: Estadísticas Profundas */}
            <div style={{
              padding: 'var(--space-lg)',
              backgroundColor: 'rgba(255,255,255,0.03)',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--color-surface-borders)'
            }}>
              <div style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--color-secondary)', textTransform: 'uppercase', marginBottom: '8px' }}>Estadística Avanzada</div>
              <h4 style={{ margin: '0 0 12px 0', fontSize: '1.2rem' }}>Sofascore</h4>
              <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', lineHeight: 1.5, marginBottom: '20px' }}>
                Mapas de calor, alineaciones confirmadas y ratings de jugadores para validar nuestras "Razones Estadísticas".
              </p>
              <a href="https://www.sofascore.com" target="_blank" rel="noopener noreferrer" style={{
                display: 'inline-flex', alignItems: 'center', gap: '8px',
                padding: '10px 20px', backgroundColor: 'var(--color-secondary)',
                color: 'white', borderRadius: 'var(--radius-md)', fontWeight: 700, textDecoration: 'none', fontSize: '0.9rem'
              }}>
                Consultar Sofascore <ExternalLink size={14} />
              </a>
            </div>

            {/* Fuente 3: Comparativa Global */}
            <div style={{
              padding: 'var(--space-lg)',
              backgroundColor: 'rgba(255,255,255,0.03)',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--color-surface-borders)'
            }}>
              <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#f97316', textTransform: 'uppercase', marginBottom: '8px' }}>Mercado Global</div>
              <h4 style={{ margin: '0 0 12px 0', fontSize: '1.2rem' }}>OddsPortal</h4>
              <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', lineHeight: 1.5, marginBottom: '20px' }}>
                Compara el movimiento de cuotas en tiempo real para detectar dónde está entrando el dinero inteligente.
              </p>
              <a href="https://www.oddsportal.com" target="_blank" rel="noopener noreferrer" style={{
                display: 'inline-flex', alignItems: 'center', gap: '8px',
                padding: '10px 20px', backgroundColor: '#f97316',
                color: 'white', borderRadius: 'var(--radius-md)', fontWeight: 700, textDecoration: 'none', fontSize: '0.9rem'
              }}>
                Ver Movimientos <ExternalLink size={14} />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Disclaimers y datos legales */}
      <LegalDisclaimer />
    </div>
  );
};
