import React, { useState, useEffect } from 'react';
import { Sparkles, RefreshCw, TrendingUp } from 'lucide-react';
import { Card } from '../atoms/Card';
import { Button } from '../atoms/Button';
import { Badge } from '../atoms/Badge';
import type { BetFormData } from '../molecules/BetRegistrationModal';

interface ParlayRecommenderProps {
  opportunities: any[];
  onAddToDashboard?: (prefill: Partial<BetFormData>) => void;
}

export const ParlayRecommender: React.FC<ParlayRecommenderProps> = ({ opportunities, onAddToDashboard }) => {
  const [parlays, setParlays] = useState<any[]>([]);

  const generateParlays = () => {
    // Filtrar solo las apuestas con alta confianza (CC >= 70)
    const validOpps = opportunities.filter(o => o.cc >= 70);
    
    if (validOpps.length < 3) {
      setParlays([]);
      return;
    }

    const generated = [];
    // Generar 6 recomendaciones de parlays
    for (let i = 0; i < 6; i++) {
      // Mezclar aleatoriamente y coger entre 3 y 6 picks
      const shuffled = [...validOpps].sort(() => 0.5 - Math.random());
      const parlaySize = Math.floor(Math.random() * 4) + 3; // 3 a 6
      const selected = shuffled.slice(0, parlaySize);
      
      const totalOdds = selected.reduce((acc, curr) => acc * curr.odds, 1);
      const avgCc = Math.round(selected.reduce((acc, curr) => acc + curr.cc, 0) / selected.length);
      
      generated.push({
        id: `parlay-${Date.now()}-${i}`,
        picks: selected,
        totalOdds: +totalOdds.toFixed(2),
        avgCc,
        size: selected.length
      });
    }
    
    // Ordenar de mayor a menor probabilidad/cuota
    setParlays(generated.sort((a, b) => b.avgCc - a.avgCc));
  };

  // Generar parlays la primera vez que tenemos oportunidades
  useEffect(() => {
    if (opportunities.length > 0 && parlays.length === 0) {
      generateParlays();
    }
  }, [opportunities]);

  if (parlays.length === 0) return null;

  return (
    <div style={{ marginBottom: 'var(--space-xxl)' }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: 'var(--space-lg)' 
      }}>
        <h2 style={{ 
          fontSize: '1.4rem', 
          fontWeight: 700, 
          margin: 0,
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-sm)'
        }}>
          <Sparkles size={24} color="var(--color-primary)" />
          Combinadas Recomendadas (Parlays)
        </h2>
        <Button 
          variant="secondary" 
          onClick={generateParlays}
          style={{ padding: '8px 16px', fontSize: '0.85rem' }}
        >
          <RefreshCw size={16} style={{ marginRight: '8px' }} />
          Nuevas Sugerencias
        </Button>
      </div>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', 
        gap: 'var(--space-lg)' 
      }}>
        {parlays.map((parlay, idx) => (
            <Card key={parlay.id} style={{ 
            padding: 'var(--space-lg)',
            border: idx === 0 ? '2px solid var(--color-primary)' : undefined,
            position: 'relative',
            overflow: 'visible'
          }}>
            {idx === 0 && (
              <div style={{ 
                position: 'absolute', 
                top: '-15px', 
                right: '16px',
                backgroundColor: 'var(--color-primary)',
                color: 'white',
                padding: '6px 14px',
                borderRadius: 'var(--radius-full)',
                fontSize: '0.75rem',
                fontWeight: 800,
                boxShadow: 'var(--shadow-glow)',
                zIndex: 10
              }}>
                ⭐ LA MEJOR OPCIÓN
              </div>
            )}
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-md)' }}>
              <div>
                <h3 style={{ margin: '0 0 4px 0', fontSize: '1.1rem' }}>Parlay {parlay.size} Selecciones</h3>
                <Badge variant="success" text={`CC Promedio: ${parlay.avgCc}%`} />
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>Cuota Total</div>
                <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--color-text-primary)' }}>@{parlay.totalOdds}</div>
              </div>
            </div>

            <div style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              gap: 'var(--space-sm)',
              marginBottom: 'var(--space-lg)',
              backgroundColor: 'var(--color-background)',
              padding: 'var(--space-sm)',
              borderRadius: 'var(--radius-md)'
            }}>
              {parlay.picks.map((pick: any, i: number) => (
                <div key={pick.id} style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '0.85rem',
                  padding: '6px 0',
                  borderBottom: i < parlay.picks.length - 1 ? '1px solid var(--color-surface-borders)' : 'none'
                }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>{pick.prediction}</div>
                    <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.75rem' }}>{pick.home} vs {pick.away}</div>
                  </div>
                  <div style={{ fontWeight: 700, color: 'var(--color-primary)', marginLeft: 'var(--space-md)' }}>
                    @{pick.odds.toFixed(2)}
                  </div>
                </div>
              ))}
            </div>

            <Button 
              fullWidth 
              onClick={() => {
                if (onAddToDashboard) {
                  const combinedDesc = parlay.picks.map((p: any) => `${p.prediction} (${p.home})`).join(' + ');
                  onAddToDashboard({
                    event: 'Apuesta Combinada (Parlay)',
                    marketType: 'Múltiple',
                    prediction: combinedDesc,
                    odds: parlay.totalOdds,
                    sport: 'Varios',
                    ccAtBet: parlay.avgCc,
                  });
                }
              }}
            >
              <TrendingUp size={18} style={{ marginRight: '8px' }} />
              Registrar Combinada
            </Button>
          </Card>
        ))}
      </div>
    </div>
  );
};
