import React, { useState, useEffect } from 'react';
import { X, Plus } from 'lucide-react';
import { Button } from '../atoms/Button';
import type { BetResult } from '../../hooks/useDashboard';

/* ─── Types ─── */

interface BetRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRegister: (bet: BetFormData) => void;
  /** Pre-fill data from a Top10 suggestion */
  prefill?: Partial<BetFormData>;
}

export interface BetFormData {
  event: string;
  sport: string;
  marketType: string;
  prediction: string;
  bookmaker: string;
  odds: number;
  stake: number;
  result: BetResult;
  ccAtBet: number;
}

/* ─── Constants ─── */

const SPORT_OPTIONS = ['Fútbol', 'Baloncesto', 'Fórmula 1', 'NFL'];
const MARKET_OPTIONS = [
  'Corners Total', 'Ambos Marcan', 'Tarjetas Total', 'Goleador', 'Handicap',
  '1X2', 'Over/Under Goles', 'Puntos Totales', 'Head-to-Head', 'Podio',
  'Spread', 'Doble Oportunidad', 'Resultado 1ª Parte'
];
const BOOKMAKER_OPTIONS = ['Bet365', 'Bwin', 'Betfair', 'Pinnacle', 'William Hill', '1xBet', '888Sport', 'Sportium', 'DraftKings'];
const RESULT_OPTIONS: { value: BetResult; label: string; color: string }[] = [
  { value: 'pending', label: 'Pendiente', color: 'var(--color-text-secondary)' },
  { value: 'won', label: 'Ganada', color: 'var(--color-success)' },
  { value: 'lost', label: 'Perdida', color: 'var(--color-danger)' },
  { value: 'draw', label: 'Empate (X)', color: 'var(--color-info)' },
  { value: 'void', label: 'Anulada', color: 'var(--color-warning)' },
  { value: 'cashout', label: 'Cashout', color: 'var(--color-primary)' },
];

/* ─── Styles ─── */

const overlayStyle: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  backgroundColor: 'rgba(0, 0, 0, 0.7)',
  backdropFilter: 'blur(4px)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1000,
  animation: 'fadeIn 200ms ease-out',
};

const modalStyle: React.CSSProperties = {
  backgroundColor: 'var(--color-surface)',
  borderRadius: 'var(--radius-lg)',
  border: '1px solid var(--color-surface-borders)',
  width: '100%',
  maxWidth: '520px',
  maxHeight: '90vh',
  overflowY: 'auto',
  boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
};

const fieldStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '4px',
};

const labelStyle: React.CSSProperties = {
  fontSize: '0.7rem',
  fontWeight: 600,
  color: 'var(--color-text-secondary)',
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
};

const inputStyle: React.CSSProperties = {
  backgroundColor: 'var(--color-background)',
  border: '1px solid var(--color-surface-borders)',
  borderRadius: 'var(--radius-md)',
  padding: 'var(--space-sm) var(--space-md)',
  color: 'var(--color-text-primary)',
  fontSize: '0.875rem',
  fontFamily: 'inherit',
  outline: 'none',
  transition: 'border-color var(--transition-fast)',
};

const selectStyle: React.CSSProperties = {
  ...inputStyle,
  appearance: 'none',
  cursor: 'pointer',
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
  backgroundRepeat: 'no-repeat',
  backgroundPositionX: 'calc(100% - 12px)',
  backgroundPositionY: 'center',
  paddingRight: 'var(--space-xl)',
};

/* ─── Component ─── */

export const BetRegistrationModal: React.FC<BetRegistrationModalProps> = ({
  isOpen,
  onClose,
  onRegister,
  prefill,
}) => {
  const [form, setForm] = useState<BetFormData>({
    event: prefill?.event || '',
    sport: prefill?.sport || 'Fútbol',
    marketType: prefill?.marketType || 'Corners Total',
    prediction: prefill?.prediction || '',
    bookmaker: prefill?.bookmaker || 'Bet365',
    odds: prefill?.odds || 1.50,
    stake: prefill?.stake || 10,
    result: prefill?.result || 'pending',
    ccAtBet: prefill?.ccAtBet || 75,
  });

  const [errors, setErrors] = useState<Partial<Record<keyof BetFormData, string>>>({});

  // Sincronizar el form cuando llega un nuevo prefill (ej: usuario abre el modal
  // desde dos predicciones distintas sin haberlo cerrado entre medias).
  useEffect(() => {
    if (prefill && Object.keys(prefill).length > 0) {
      setForm({
        event: prefill.event || '',
        sport: prefill.sport || 'Fútbol',
        marketType: prefill.marketType || 'Corners Total',
        prediction: prefill.prediction || '',
        bookmaker: prefill.bookmaker || 'Bet365',
        odds: prefill.odds || 1.50,
        stake: prefill.stake || 10,
        result: prefill.result || 'pending',
        ccAtBet: prefill.ccAtBet || 75,
      });
      setErrors({});
    }
  }, [prefill]);

  if (!isOpen) return null;

  const updateField = <K extends keyof BetFormData>(key: K, value: BetFormData[K]) => {
    setForm(prev => ({ ...prev, [key]: value }));
    // Clear error on change
    if (errors[key]) {
      setErrors(prev => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  };

  const validateAndSubmit = () => {
    const newErrors: Partial<Record<keyof BetFormData, string>> = {};

    if (!form.event.trim()) newErrors.event = 'Requerido';
    if (!form.prediction.trim()) newErrors.prediction = 'Requerido';
    if (form.odds < 1.01) newErrors.odds = 'Mínimo 1.01';
    if (form.stake <= 0) newErrors.stake = 'Debe ser positivo';
    if (form.ccAtBet < 0 || form.ccAtBet > 100) newErrors.ccAtBet = 'Rango 0-100';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onRegister(form);
    onClose();
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  const potentialProfit = form.result === 'won'
    ? +(form.stake * (form.odds - 1)).toFixed(2)
    : form.result === 'lost'
      ? -form.stake
      : 0;

  return (
    <div style={overlayStyle} onClick={handleOverlayClick}>
      <div style={modalStyle}>
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: 'var(--space-lg)',
          borderBottom: '1px solid var(--color-surface-borders)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
            <Plus size={18} color="var(--color-primary)" />
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>Registrar Apuesta</h2>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--color-text-secondary)',
              cursor: 'pointer',
              padding: '4px',
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: 'var(--space-lg)', display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
          {/* Event */}
          <div style={fieldStyle}>
            <label style={labelStyle}>Evento *</label>
            <input
              type="text"
              placeholder="Ej: Real Madrid vs Barcelona"
              value={form.event}
              onChange={(e) => updateField('event', e.target.value)}
              style={{
                ...inputStyle,
                borderColor: errors.event ? 'var(--color-danger)' : 'var(--color-surface-borders)',
              }}
            />
            {errors.event && <span style={{ fontSize: '0.65rem', color: 'var(--color-danger)' }}>{errors.event}</span>}
          </div>

          {/* Sport + Market row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)' }}>
            <div style={fieldStyle}>
              <label style={labelStyle}>Deporte</label>
              <select value={form.sport} onChange={(e) => updateField('sport', e.target.value)} style={selectStyle}>
                {SPORT_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div style={fieldStyle}>
              <label style={labelStyle}>Mercado</label>
              <select value={form.marketType} onChange={(e) => updateField('marketType', e.target.value)} style={selectStyle}>
                {MARKET_OPTIONS.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
          </div>

          {/* Prediction */}
          <div style={fieldStyle}>
            <label style={labelStyle}>Pronóstico *</label>
            <input
              type="text"
              placeholder="Ej: Over 10.5"
              value={form.prediction}
              onChange={(e) => updateField('prediction', e.target.value)}
              style={{
                ...inputStyle,
                borderColor: errors.prediction ? 'var(--color-danger)' : 'var(--color-surface-borders)',
              }}
            />
            {errors.prediction && <span style={{ fontSize: '0.65rem', color: 'var(--color-danger)' }}>{errors.prediction}</span>}
          </div>

          {/* Bookmaker + CC row */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 'var(--space-md)' }}>
            <div style={fieldStyle}>
              <label style={labelStyle}>Casa de Apuestas</label>
              <select value={form.bookmaker} onChange={(e) => updateField('bookmaker', e.target.value)} style={selectStyle}>
                {BOOKMAKER_OPTIONS.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
            <div style={fieldStyle}>
              <label style={labelStyle}>CC (%)</label>
              <input
                type="number"
                min={0}
                max={100}
                value={form.ccAtBet}
                onChange={(e) => updateField('ccAtBet', +e.target.value)}
                style={{
                  ...inputStyle,
                  borderColor: errors.ccAtBet ? 'var(--color-danger)' : 'var(--color-surface-borders)',
                }}
              />
            </div>
          </div>

          {/* Odds + Stake row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)' }}>
            <div style={fieldStyle}>
              <label style={labelStyle}>Cuota</label>
              <input
                type="number"
                step={0.01}
                min={1.01}
                value={form.odds}
                onChange={(e) => updateField('odds', +e.target.value)}
                style={{
                  ...inputStyle,
                  borderColor: errors.odds ? 'var(--color-danger)' : 'var(--color-surface-borders)',
                }}
              />
              {errors.odds && <span style={{ fontSize: '0.65rem', color: 'var(--color-danger)' }}>{errors.odds}</span>}
            </div>
            <div style={fieldStyle}>
              <label style={labelStyle}>Stake (€)</label>
              <input
                type="number"
                step={1}
                min={1}
                value={form.stake}
                onChange={(e) => updateField('stake', +e.target.value)}
                style={{
                  ...inputStyle,
                  borderColor: errors.stake ? 'var(--color-danger)' : 'var(--color-surface-borders)',
                }}
              />
              {errors.stake && <span style={{ fontSize: '0.65rem', color: 'var(--color-danger)' }}>{errors.stake}</span>}
            </div>
          </div>

          {/* Result */}
          <div style={fieldStyle}>
            <label style={labelStyle}>Resultado</label>
            <div style={{ display: 'flex', gap: 'var(--space-xs)', flexWrap: 'wrap' }}>
              {RESULT_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => updateField('result', opt.value)}
                  style={{
                    padding: 'var(--space-xs) var(--space-sm)',
                    borderRadius: 'var(--radius-sm)',
                    border: `1px solid ${form.result === opt.value ? opt.color : 'var(--color-surface-borders)'}`,
                    backgroundColor: form.result === opt.value ? `${opt.color}18` : 'transparent',
                    color: form.result === opt.value ? opt.color : 'var(--color-text-secondary)',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    transition: 'all var(--transition-fast)',
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Profit preview */}
          {form.result !== 'pending' && (
            <div style={{
              backgroundColor: 'var(--color-background)',
              borderRadius: 'var(--radius-md)',
              padding: 'var(--space-sm) var(--space-md)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>Beneficio neto:</span>
              <span style={{
                fontSize: '1rem',
                fontWeight: 800,
                color: potentialProfit >= 0 ? 'var(--color-success)' : 'var(--color-danger)',
              }}>
                {potentialProfit >= 0 ? '+' : ''}{potentialProfit.toFixed(2)}€
              </span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          display: 'flex',
          justifyContent: 'flex-end',
          gap: 'var(--space-sm)',
          padding: 'var(--space-md) var(--space-lg)',
          borderTop: '1px solid var(--color-surface-borders)',
        }}>
          <Button variant="ghost" size="sm" onClick={onClose}>Cancelar</Button>
          <Button variant="primary" size="sm" onClick={validateAndSubmit}>
            <Plus size={14} /> Registrar
          </Button>
        </div>
      </div>
    </div>
  );
};
