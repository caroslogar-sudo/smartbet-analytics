

type CardProps = {
  children: React.ReactNode;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  interactive?: boolean;
  style?: React.CSSProperties;
};

export const Card: React.FC<CardProps> = ({ children, padding = 'md', interactive = false, style }) => {
  const baseStyle: React.CSSProperties = {
    backgroundColor: 'var(--color-surface)',
    borderRadius: 'var(--radius-md)',
    border: '1px solid var(--color-surface-borders)',
    boxShadow: 'var(--shadow-md)',
    transition: 'transform var(--transition-fast), border-color var(--transition-fast), box-shadow var(--transition-fast)',
    overflow: 'hidden'
  };

  const paddings = {
    none: '0',
    sm: 'var(--space-sm)',
    md: 'var(--space-md)',
    lg: 'var(--space-xl)'
  };

  return (
    <div 
      style={{ ...baseStyle, padding: paddings[padding], ...style }}
      onMouseOver={(e) => {
        if(interactive) {
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.borderColor = 'var(--color-primary)';
          e.currentTarget.style.boxShadow = 'var(--shadow-glow)';
        }
      }}
      onMouseOut={(e) => {
        if(interactive) {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.borderColor = 'var(--color-surface-borders)';
          e.currentTarget.style.boxShadow = 'var(--shadow-md)';
        }
      }}
    >
      {children}
    </div>
  );
};
