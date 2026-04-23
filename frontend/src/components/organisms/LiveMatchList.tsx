import React from 'react';
import { Card } from '../atoms/Card';
import { Badge } from '../atoms/Badge';
import { Radio, AlertCircle, Goal, Flag, Square, UserCheck, TrendingUp } from 'lucide-react';
import { Button } from '../atoms/Button';
import type { Opportunity } from '../../hooks/useLiveTop10';

interface LiveMatchListProps {
  opportunities: Opportunity[];
  loading: boolean;
  onRefresh?: () => void;
}

export const LiveMatchList: React.FC<LiveMatchListProps> = ({ opportunities, loading, onRefresh }) => {
  const getMarketIcon = (market: string) => {
    const m = market.toLowerCase();
    if (m.includes('corner')) return <Flag size={14} style={{ color: 'var(--color-info)' }} />;
    if (m.includes('tarjeta')) return <Square size={14} style={{ fill: 'var(--color-warning)', color: 'var(--color-warning)' }} />;
    if (m.includes('goleador')) return <UserCheck size={14} style={{ color: 'var(--color-secondary)' }} />;
    if (m.includes('handicap')) return <TrendingUp size={14} style={{ color: 'var(--color-success)' }} />;
    return <Goal size={14} style={{ color: 'var(--color-text-primary)' }} />;
  };

  const grouped = opportunities.reduce((acc, opp) => {
    if (!acc[opp.sport]) acc[opp.sport] = [];
    acc[opp.sport].push(opp);
    return acc;
  }, {} as Record<string, Opportunity[]>);

  return (
    <section style={{ padding: 'var(--space-md) var(--space-xl) var(--space-xl)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', marginBottom: 'var(--space-xl)', borderBottom: '1px solid var(--color-surface-borders)', paddingBottom: 'var(--space-md)' }}>
        <h3 style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '0.05em', margin: 0 }}>
          DASHBOARD MULTI-DEPORTE
        </h3>
        {loading && <Badge text="Conectando Engine..." variant="info" />}
      </div>

      {opportunities.length === 0 ? (
        // Estado: Loading / Sin datos
        <div style={{ display: 'flex', gap: 'var(--space-md)', overflowX: 'auto', paddingBottom: 'var(--space-xs)' }}>
          {[1, 2, 3].map(i => (
            <div key={i} className="skeleton" style={{ minWidth: '280px', height: '160px', borderRadius: 'var(--radius-lg)' }}></div>
          ))}
        </div>
      ) : (
        // Estado: Cargado y Agrupado
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xxl)' }}>
          {Object.entries(grouped).map(([sport, opps]) => (
            <div key={sport}>
              <h4 style={{ fontSize: '1.1rem', fontWeight: 700, margin: '0 0 var(--space-md) 0', color: 'var(--color-primary)', textTransform: 'uppercase' }}>
                {sport}
              </h4>
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', 
                gap: 'var(--space-lg)'
              }}>
                {opps.map((opp, index) => (
                  <div key={opp.id} className="animate-fade-in" style={{ animationDelay: `${index * 0.05}s` }}>
                    <Card interactive style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-sm)' }}>
                  {opp.is_live ? (
                    <Badge text="DIRECTO" variant="danger" icon={<Radio size={10} />} />
                  ) : (
                    <Badge text="PRE-MATCH" variant="info" />
                  )}
                  <Badge text={`CC: ${opp.cc}%`} variant={opp.cc >= 90 ? 'success' : opp.cc >= 80 ? 'info' : 'danger'} />
                </div>

                <div style={{ width: '100%', height: '4px', backgroundColor: 'var(--color-surface-borders)', borderRadius: '2px', marginBottom: 'var(--space-sm)' }}>
                  <div style={{ width: `${opp.cc}%`, height: '100%', backgroundColor: opp.cc >= 90 ? 'var(--color-success)' : opp.cc >= 80 ? 'var(--color-info)' : 'var(--color-danger)', borderRadius: '2px' }} />
                </div>
                
                <div style={{ textAlign: 'center', marginBottom: 'var(--space-sm)', minHeight: '50px' }}>
                  <h4 style={{ fontSize: '1rem', fontWeight: 800, margin: 0, textTransform: 'uppercase', lineHeight: 1.2 }}>
                    {opp.home} <span style={{ color: 'var(--color-text-secondary)', fontWeight: 400 }}>-</span> {opp.away}
                  </h4>
                  <p style={{ fontSize: '0.65rem', color: 'var(--color-text-secondary)', marginTop: '6px' }}>
                    {opp.comp.toUpperCase()}
                  </p>
                </div>

                <div style={{
                  background: 'var(--color-surface-hover)', 
                  padding: 'var(--space-sm)',
                  borderRadius: 'var(--radius-md)',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  marginTop: 'auto'
                }}>
                  <div>
                    <div style={{ fontSize: '0.65rem', color: 'var(--color-text-secondary)', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      {getMarketIcon(opp.market)} MERCADO
                    </div>
                    <div style={{ fontSize: '0.875rem', fontWeight: 700 }}>{opp.market}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-primary)' }}>{opp.prediction}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.65rem', color: 'var(--color-text-secondary)' }}>{opp.bookmaker}</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-secondary)' }}>{opp.odds.toFixed(2)}</div>
                  </div>
                      </div>
                    </Card>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Acciones e Información Legal */}
      <div style={{ marginTop: 'var(--space-xxl)', textAlign: 'center', borderTop: '1px solid var(--color-surface-borders)', paddingTop: 'var(--space-xl)' }}>
        <Button 
          variant="primary" 
          size="lg" 
          onClick={onRefresh} 
          disabled={loading}
          style={{ marginBottom: 'var(--space-lg)' }}
        >
          {loading ? 'CONECTANDO...' : 'ESCANEAR RED Y RE-PROCESAR ESTADÍSTICAS'}
        </Button>
        
        <div style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'left', padding: 'var(--space-md)', backgroundColor: 'var(--color-surface-hover)', borderRadius: 'var(--radius-md)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', marginBottom: 'var(--space-xs)' }}>
            <AlertCircle size={16} color="var(--color-warning)" />
            <span style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--color-warning)' }}>Advertencia de Riesgo sobre IA</span>
          </div>
          <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', margin: 0, lineHeight: 1.5 }}>
            Esta plataforma utiliza lógicas de Inteligencia Artificial para indexar, cruzar y analizar parámetros estadísticos disponibles públicamente en páginas estadísticas y plataformas de apuestas. Las cuotas, pronósticos e índices (CC) mostrados son sugerencias matemáticas generadas en tiempo real y <strong>en ningún caso deben considerarse una garantía ni un consejo de inversión financiera absoluta.</strong> Las apuestas conllevan un alto riesgo de pérdida de capital; juega con responsabilidad.
          </p>
        </div>
      </div>
    </section>
  );
};
