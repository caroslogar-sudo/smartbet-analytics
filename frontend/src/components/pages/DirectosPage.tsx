import React, { useState, useEffect, useMemo } from 'react';
import { Activity, Clock, Trophy, AlertTriangle, Radio, Ghost } from 'lucide-react';
import { Card } from '../atoms/Card';
import { Badge } from '../atoms/Badge';
import { firebaseService } from '../../services/firebaseService';

export const DirectosPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [liveMatches, setLiveMatches] = useState<any[]>([]);
  const [finishedMatches, setFinishedMatches] = useState<any[]>([]);

  useEffect(() => {
    const { unsubscribe } = firebaseService.subscribeToLiveScores((data) => {
      // 1. Filtrar solo los que realmente están en juego (tienen scores y no están completados)
      const trulyLive = data.live.filter(m => m.scores && m.scores.length > 0 && !m.completed);
      
      // 2. Lógica de limpieza de finalizados: desaparecen a las 14:00 del día siguiente
      const now = new Date();
      const filteredFinished = data.finished.filter(m => {
        if (!m.last_update) return true;
        const matchDate = new Date(m.last_update);
        const nextDay14h = new Date(matchDate);
        nextDay14h.setDate(nextDay14h.getDate() + 1);
        nextDay14h.setHours(14, 0, 0, 0);
        
        return now < nextDay14h;
      });

      setLiveMatches(trulyLive);
      setFinishedMatches(filteredFinished);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Agrupar por ligas para una mejor organización visual
  const groupedLive = useMemo(() => {
    const groups: Record<string, any[]> = {};
    liveMatches.forEach(m => {
      if (!groups[m.league]) groups[m.league] = [];
      groups[m.league].push(m);
    });
    return groups;
  }, [liveMatches]);

  const groupedFinished = useMemo(() => {
    const groups: Record<string, any[]> = {};
    finishedMatches.forEach(m => {
      if (!groups[m.league]) groups[m.league] = [];
      groups[m.league].push(m);
    });
    return groups;
  }, [finishedMatches]);

  return (
    <div style={{ padding: 'var(--space-lg) var(--space-xl) var(--space-xxl)' }}>
      {/* Header */}
      <div style={{ marginBottom: 'var(--space-xl)' }}>
        <h1 style={{
          fontSize: '1.8rem',
          fontWeight: 800,
          margin: '0 0 var(--space-xs) 0',
          letterSpacing: '-0.01em',
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-sm)'
        }}>
          Monitorización <span style={{ color: 'var(--color-danger)' }}>Smart 4-Track</span>
          <Radio color="var(--color-danger)" size={24} />
        </h1>
        <p style={{
          color: 'var(--color-text-secondary)',
          fontSize: '0.9rem',
          margin: '0 0 var(--space-md) 0',
          maxWidth: '800px',
          lineHeight: 1.6,
        }}>
          Los partidos solo aparecen cuando comienza la acción real. Los resultados finalizados se mantienen hasta las 14:00 del día siguiente.
        </p>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 'var(--space-xxl)', color: 'var(--color-text-secondary)' }}>
          <Activity size={32} style={{ animation: 'spin 2s linear infinite', marginBottom: 'var(--space-md)' }} />
          <p>Sincronizando trackers...</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xxl)' }}>
          
          {/* Sección: Partidos en Juego */}
          <section>
            <h2 style={{ fontSize: '1.2rem', marginBottom: 'var(--space-lg)', display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
              <Clock size={20} color="var(--color-warning)" />
              En Juego (Ordenado por Liga)
            </h2>
            
            {Object.keys(groupedLive).length > 0 ? (
              Object.entries(groupedLive).map(([league, matches]) => (
                <div key={league} style={{ marginBottom: 'var(--space-xl)' }}>
                  <h3 style={{ fontSize: '0.9rem', color: 'var(--color-primary)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 'var(--space-md)', borderBottom: '1px solid var(--color-surface-borders)', paddingBottom: '4px' }}>
                    {league}
                  </h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 'var(--space-md)' }}>
                    {matches.map(match => {
                      const isTennis = match.sport?.toLowerCase().includes('tenis');
                      const isBasket = match.sport?.toLowerCase().includes('baloncesto');
                      const sportColor = isTennis ? '#A3E635' : isBasket ? '#F97316' : 'var(--color-danger)';
                      
                      return (
                        <Card key={match.id} style={{ borderLeft: `4px solid ${sportColor}`, padding: 'var(--space-md)' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-xs)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <div style={{ animation: 'pulse 2s infinite' }}>
                                <Badge variant="danger" text="LIVE" />
                              </div>
                              <span style={{ fontSize: '0.7rem', color: 'var(--color-text-secondary)', fontWeight: 600 }}>
                                {isTennis ? '🎾' : isBasket ? '🏀' : '⚽'} {match.sport}
                              </span>
                            </div>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: 'var(--space-md) 0' }}>
                            <div style={{ fontSize: '1.1rem', fontWeight: 700, flex: 1, textAlign: 'right' }}>{match.home}</div>
                            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--color-primary)', margin: '0 var(--space-lg)' }}>
                              {match.scores?.find((s: any) => s.name === match.home)?.score || 0} - {match.scores?.find((s: any) => s.name === match.away)?.score || 0}
                            </div>
                            <div style={{ fontSize: '1.1rem', fontWeight: 700, flex: 1, textAlign: 'left' }}>{match.away}</div>
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              ))
            ) : (
              <div style={{ 
                padding: 'var(--space-xxl)', 
                textAlign: 'center', 
                backgroundColor: 'var(--color-surface)',
                borderRadius: 'var(--radius-lg)',
                border: '1px dashed var(--color-surface-borders)',
                color: 'var(--color-text-secondary)'
              }}>
                <Ghost size={48} style={{ marginBottom: 'var(--space-md)', opacity: 0.2 }} />
                <p style={{ margin: 0, fontWeight: 600 }}>Esperando el pitido inicial...</p>
                <p style={{ fontSize: '0.8rem', marginTop: 'var(--space-xs)' }}>No hay partidos en juego en las ligas seleccionadas.</p>
              </div>
            )}
          </section>

          {/* Sección: Partidos Finalizados */}
          {Object.keys(groupedFinished).length > 0 && (
            <section>
              <h2 style={{ fontSize: '1.2rem', marginBottom: 'var(--space-lg)', display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                <Trophy size={20} color="var(--color-success)" />
                Resultados Finalizados
              </h2>
              {Object.entries(groupedFinished).map(([league, matches]) => (
                <div key={league} style={{ marginBottom: 'var(--space-xl)' }}>
                  <h3 style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 'var(--space-sm)' }}>
                    {league}
                  </h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 'var(--space-md)' }}>
                    {matches.map(match => (
                      <Card key={match.id} style={{ padding: 'var(--space-md)', opacity: 0.85 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-xs)' }}>
                          <Badge variant="success" text="FINALIZADO" />
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: 'var(--space-sm) 0' }}>
                          <div style={{ fontSize: '1rem', fontWeight: 600, flex: 1, textAlign: 'right' }}>{match.home}</div>
                          <div style={{ fontSize: '1.2rem', fontWeight: 700, margin: '0 var(--space-md)' }}>
                            {match.scores?.find((s: any) => s.name === match.home)?.score || 0} - {match.scores?.find((s: any) => s.name === match.away)?.score || 0}
                          </div>
                          <div style={{ fontSize: '1rem', fontWeight: 600, flex: 1, textAlign: 'left' }}>{match.away}</div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              ))
            }
            </section>
          )}

        </div>
      )}

      {/* Aviso de Consumo */}
      <div style={{
        marginTop: 'var(--space-xxl)',
        padding: 'var(--space-md)',
        backgroundColor: 'rgba(59, 130, 246, 0.05)',
        border: '1px solid rgba(59, 130, 246, 0.2)',
        borderRadius: 'var(--radius-md)',
        display: 'flex',
        alignItems: 'flex-start',
        gap: 'var(--space-sm)',
      }}>
        <AlertTriangle size={16} color="var(--color-primary)" style={{ flexShrink: 0, marginTop: '2px' }} />
        <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', margin: 0, lineHeight: 1.5 }}>
          <strong>Lógica de Limpieza:</strong> El historial de resultados se reinicia automáticamente cada día a las 14:00 del día siguiente para mantener el panel limpio y enfocado.
        </p>
      </div>

    </div>
  );
};
