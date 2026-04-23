import React from 'react';
import { ParlayRecommender } from '../organisms/ParlayRecommender';
import { useLiveTop10 } from '../../hooks/useLiveTop10';
import type { BetFormData } from '../molecules/BetRegistrationModal';

interface MultiapuestasPageProps {
  onAddToDashboard?: (prefill: Partial<BetFormData>) => void;
}

export const MultiapuestasPage: React.FC<MultiapuestasPageProps> = ({ onAddToDashboard }) => {
  const { opportunities } = useLiveTop10();

  return (
    <div style={{ padding: 'var(--space-lg) var(--space-xl) var(--space-xxl)' }}>
      <div style={{ marginBottom: 'var(--space-xl)' }}>
        <h1 style={{
          fontSize: '1.8rem',
          fontWeight: 800,
          margin: '0 0 var(--space-xs) 0',
          letterSpacing: '-0.01em',
        }}>
          Multi<span style={{ color: 'var(--color-primary)' }}>apuestas</span>
        </h1>
        <p style={{
          color: 'var(--color-text-secondary)',
          fontSize: '0.9rem',
          margin: '0 0 var(--space-lg) 0',
          maxWidth: '700px',
          lineHeight: 1.6,
        }}>
          Recomendaciones de apuestas combinadas generadas algorítmicamente agrupando mercados con alta probabilidad de acierto (CC ≥ 70%).
        </p>
      </div>

      <ParlayRecommender opportunities={opportunities} onAddToDashboard={onAddToDashboard} />
    </div>
  );
};
