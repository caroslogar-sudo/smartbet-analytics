import React from 'react';

import { Button } from '../atoms/Button';
import type { Opportunity } from '../../hooks/useLiveTop10';

export const CarouselHero: React.FC<{ heroOpp?: Opportunity }> = ({ heroOpp }) => {
  return (
    <section style={{ padding: 'var(--space-xl)' }}>
      <div style={{
        position: 'relative',
        width: '100%',
        height: '350px',
        borderRadius: 'var(--radius-lg)',
        overflow: 'hidden',
        background: 'linear-gradient(135deg, var(--color-surface) 0%, var(--color-surface-hover) 100%)',
        border: '1px solid var(--color-surface-borders)',
        boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
      }}>
        <div style={{
          position: 'absolute',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'linear-gradient(to right, rgba(17, 20, 26, 0.95) 0%, rgba(17, 20, 26, 0.4) 100%)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: 'var(--space-xxl)'
        }}>
          {!heroOpp ? (
            // Skeleton Loading State - Resiliencia Visual
            <div className="animate-fade-in" style={{ maxWidth: '600px' }}>
              <div className="skeleton skeleton-text" style={{ width: '150px', marginBottom: 'var(--space-lg)' }}></div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
                <div className="skeleton skeleton-title" style={{ width: '200px', height: '3.5rem' }}></div>
                <div className="skeleton skeleton-title" style={{ width: '40px', height: '3.5rem' }}></div>
                <div className="skeleton skeleton-title" style={{ width: '200px', height: '3.5rem' }}></div>
              </div>
              <div className="skeleton skeleton-text" style={{ width: '120px', marginTop: 'var(--space-md)' }}></div>
              <div className="skeleton skeleton-title" style={{ width: '180px', height: '2.5rem', marginTop: 'var(--space-xl)', borderRadius: 'var(--radius-md)' }}></div>
            </div>
          ) : (
            // Loaded Data State
            <div className="animate-fade-in">
              <div style={{ background: 'var(--color-success)', color: 'var(--color-text-inverse)', padding: '4px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 700, width: 'fit-content', marginBottom: 'var(--space-md)' }}>
                ⭐ PREDICCIÓN TOP 1
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-xs)', marginBottom: 'var(--space-sm)' }}>
                <h1 style={{ fontSize: '3rem', fontWeight: 800, margin: 0, lineHeight: 1 }}>{heroOpp.home}</h1>
                <span style={{ color: 'var(--color-primary)', fontSize: '1.5rem', fontWeight: 700 }}>VS</span>
                <h1 style={{ fontSize: '3rem', fontWeight: 800, margin: 0, lineHeight: 1 }}>{heroOpp.away}</h1>
              </div>
              
              <div style={{ marginBottom: 'var(--space-lg)', display: 'flex', gap: 'var(--space-sm)', alignItems: 'center' }}>
                <p style={{ color: 'var(--color-text-secondary)', fontSize: '1rem', fontWeight: 500, letterSpacing: '0.05em', margin: 0 }}>
                  {heroOpp.comp.toUpperCase()}
                </p>
                <span style={{ width: '4px', height: '4px', backgroundColor: 'var(--color-surface-borders)', borderRadius: '50%' }}></span>
                <p style={{ color: 'var(--color-success)', fontSize: '1rem', fontWeight: 700, margin: 0 }}>
                  CC: {heroOpp.cc}%
                </p>
              </div>

              <div style={{ display: 'flex', gap: 'var(--space-md)' }}>
                <Button variant="primary" size="md" style={{ width: 'fit-content' }}>
                  {heroOpp.market.toUpperCase()} - {heroOpp.prediction}
                </Button>
                <Button variant="secondary" size="md" style={{ width: 'fit-content' }}>
                  CUOTA: {heroOpp.odds.toFixed(2)}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
