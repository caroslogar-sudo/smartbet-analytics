

type BadgeProps = {
  text: string;
  variant?: 'danger' | 'success' | 'info';
  icon?: React.ReactNode;
};

export const Badge: React.FC<BadgeProps> = ({ text, variant = 'danger', icon }) => {
  const baseStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 'var(--space-xxs)',
    padding: 'var(--space-xxs) var(--space-xs)',
    borderRadius: 'var(--radius-sm)',
    fontSize: '0.65rem',
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  };

  const variants = {
    danger: {
      backgroundColor: 'var(--color-danger)',
      color: '#fff'
    },
    success: {
      backgroundColor: 'var(--color-success)',
      color: 'var(--color-text-inverse)'
    },
    info: {
      backgroundColor: 'var(--color-surface-hover)',
      color: 'var(--color-text-primary)'
    }
  };

  return (
    <span style={{ ...baseStyle, ...variants[variant] }}>
      {icon}
      {text}
    </span>
  );
};
