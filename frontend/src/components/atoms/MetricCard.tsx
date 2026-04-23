import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

export type TrendDirection = 'up' | 'down' | 'neutral';

interface MetricCardProps {
  title: string;
  value: string;
  subtitle?: string;
  trend?: TrendDirection;
  trendLabel?: string;
  accentColor?: string;
  icon?: React.ReactNode;
  style?: React.CSSProperties;
}

const TREND_CONFIG: Record<TrendDirection, { color: string; Icon: typeof TrendingUp }> = {
  up: { color: 'var(--color-success)', Icon: TrendingUp },
  down: { color: 'var(--color-danger)', Icon: TrendingDown },
  neutral: { color: 'var(--color-text-secondary)', Icon: Minus },
};

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtitle,
  trend,
  trendLabel,
  accentColor = 'var(--color-primary)',
  icon,
  style,
}) => {
  const trendInfo = trend ? TREND_CONFIG[trend] : null;

  return (
    <div
      style={{
        backgroundColor: 'var(--color-surface)',
        border: '1px solid var(--color-surface-borders)',
        borderRadius: 'var(--radius-lg)',
        padding: 'var(--space-lg)',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-sm)',
        position: 'relative',
        overflow: 'hidden',
        transition: 'border-color var(--transition-normal), box-shadow var(--transition-normal)',
        ...style,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = accentColor;
        e.currentTarget.style.boxShadow = `0 0 20px ${accentColor}22`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'var(--color-surface-borders)';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      {/* Accent top stripe */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '3px',
          background: `linear-gradient(to right, ${accentColor}, transparent)`,
        }}
      />

      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span
          style={{
            fontSize: '0.7rem',
            fontWeight: 600,
            color: 'var(--color-text-secondary)',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
          }}
        >
          {title}
        </span>
        {icon && (
          <div style={{ color: accentColor, opacity: 0.6 }}>{icon}</div>
        )}
      </div>

      {/* Value */}
      <div
        style={{
          fontSize: '1.75rem',
          fontWeight: 800,
          lineHeight: 1,
          color: 'var(--color-text-primary)',
          letterSpacing: '-0.02em',
        }}
      >
        {value}
      </div>

      {/* Trend + Subtitle */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-xs)', minHeight: '20px' }}>
        {trendInfo && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '3px',
              fontSize: '0.75rem',
              fontWeight: 600,
              color: trendInfo.color,
            }}
          >
            <trendInfo.Icon size={12} />
            {trendLabel}
          </div>
        )}
        {subtitle && (
          <span style={{ fontSize: '0.7rem', color: 'var(--color-text-secondary)' }}>
            {trend ? '·' : ''} {subtitle}
          </span>
        )}
      </div>
    </div>
  );
};
