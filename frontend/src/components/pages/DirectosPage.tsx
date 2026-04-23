import React, { useState, useEffect } from 'react';
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
      setLiveMatches(data.live);
      setFinishedMatches(data.finished);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

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
          Panel de <span style={{ color: 'var(--color-danger)' }}>Directos</span>
          <Radio color="var(--color-danger)" size={24} />
        </h1>
        <p style={{
          color: 'var(--color-text-secondary)',
          fontSize: '0.9rem',
          margin: '0 0 var(--space-md) 0',
          maxWidth: '800px',
          lineHeight: 1.6,
        }}>
          Monitorización en tiempo real con <strong>Smart 4-Track</strong>. 
          Realizamos exclusivamente 4 rastreos por parte para maximizar precisión y ahorro de API.
        </p>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 'var(--space-xxl)', color: 'var(--color-text-secondary)' }}>
          <Activity size={32} style={{ animation: 'spin 2s linear infinite', marginBottom: 'var(--space-md)' }} />
          <p>Conectando al motor de rastreo real...</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xl)' }}>
          
          {/* Sección: Partidos en Directo */}
          <section>
            <h2 style={{ fontSize: '1.2rem', marginBottom: 'var(--space-md)', display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
              <Clock size={20} color="var(--color-warning)" />
              En Juego (Rastreo Activo)
            </h2>
            
            {liveMatches.length > 0 ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 'var(--space-md)' }}>
                {liveMatches.map(match => (
                  <Card key={match.id} style={{ borderLeft: '4px solid var(--color-danger)', padding: 'var(--space-md)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-xs)' }}>
                      <div style={{ animation: 'pulse 2s infinite' }}>
                        <Badge variant="danger" text="LIVE" />
                      </div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', fontWeight: 600 }}>
                        {match.league}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: 'var(--space-md) 0' }}>
                      <div style={{ fontSize: '1.1rem', fontWeight: 700, flex: 1, textAlign: 'right' }}>{match.home}</div>
                      
                      <div style={{ textAlign: 'center', margin: '0 var(--space-lg)' }}>
                        {/* Solo mostrar marcador si el partido ya ha empezado (basado en timestamp o presencia de scores reales) */}
                        {match.scores && match.scores.length > 0 ? (
                          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--color-primary)' }}>
                            {match.scores?.find((s: any) => s.name === match.home)?.score || 0} - {match.scores?.find((s: any) => s.name === match.away)?.score || 0}
                          </div>
                        ) : (
                          <div style={{ 
                            backgroundColor: 'var(--color-background)', 
                            padding: '4px 12px', 
                            borderRadius: 'var(--radius-sm)',
                            border: '1px solid var(--color-surface-borders)'
                          }}>
                            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-text-secondary)' }}>
                              {match.last_update ? new Date(match.last_update).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                            </span>
                          </div>
                        )}
                      </div>

                      <div style={{ fontSize: '1.1rem', fontWeight: 700, flex: 1, textAlign: 'left' }}>{match.away}</div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <div style={{ 
                padding: 'var(--space-xxl)', 
                textAlign: 'center', 
                backgroundColor: 'var(--color-surface)',
                borderRadius: 'var(--radius-lg)',
                border: '1px dashed var(--color-surface-borders)',
                color: 'var(--color-text-secondary)'
              }}>
                <Ghost size={48} style={{ marginBottom: 'var(--space-md)', opacity: 0.3 }} />
                <p style={{ margin: 0, fontWeight: 600 }}>No hay partidos en directo en este momento.</p>
                <p style={{ fontSize: '0.8rem', marginTop: 'var(--space-xs)' }}>El motor Smart 4-Track está en espera para ahorrar créditos de API.</p>
              </div>
            )}
          </section>

          {/* Sección: Partidos Finalizados */}
          {finishedMatches.length > 0 && (
            <section>
              <h2 style={{ fontSize: '1.2rem', marginBottom: 'var(--space-md)', display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                <Trophy size={20} color="var(--color-success)" />
                Finalizados (Hoy)
              </h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 'var(--space-md)' }}>
                {finishedMatches.map(match => (
                  <Card key={match.id} style={{ padding: 'var(--space-md)', opacity: 0.85 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-xs)' }}>
                      <Badge variant="success" text="FINALIZADO" />
                      <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>{match.league}</span>
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
          <strong>Optimización Activa:</strong> Si no hay partidos de las ligas soportadas en curso, el sistema suspende los rastreos automáticamente para proteger tu cuota de API.
        </p>
      </div>

    </div>
  );
};
