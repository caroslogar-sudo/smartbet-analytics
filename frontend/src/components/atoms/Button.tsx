

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
};

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  style,
  ...props
}) => {
  const baseStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 600,
    borderRadius: 'var(--radius-md)',
    transition: 'background-color var(--transition-fast)',
    width: fullWidth ? '100%' : 'auto',
    border: 'none',
    gap: 'var(--space-xs)'
  };

  const variants = {
    primary: {
      backgroundColor: 'var(--color-primary)',
      color: 'var(--color-text-primary)'
    },
    secondary: {
      backgroundColor: 'var(--color-surface-hover)',
      color: 'var(--color-text-primary)'
    },
    ghost: {
      backgroundColor: 'transparent',
      color: 'var(--color-text-secondary)',
    }
  };

  const sizes = {
    sm: { padding: 'var(--space-xs) var(--space-sm)', fontSize: '0.875rem' },
    md: { padding: 'var(--space-sm) var(--space-lg)', fontSize: '1rem' },
    lg: { padding: 'var(--space-md) var(--space-xl)', fontSize: '1.125rem' }
  };

  return (
    <button
      style={{
        ...baseStyle,
        ...variants[variant],
        ...sizes[size],
        ...style
      }}
      {...props}
      onMouseOver={(e) => {
        if (variant === 'primary') e.currentTarget.style.backgroundColor = 'var(--color-primary-hover)';
        if (variant === 'secondary') e.currentTarget.style.backgroundColor = 'var(--color-surface-glass)';
        if (variant === 'ghost') e.currentTarget.style.color = 'var(--color-text-primary)';
      }}
      onMouseOut={(e) => {
        if (variant === 'primary') e.currentTarget.style.backgroundColor = 'var(--color-primary)';
        if (variant === 'secondary') e.currentTarget.style.backgroundColor = 'var(--color-surface-hover)';
        if (variant === 'ghost') e.currentTarget.style.color = 'var(--color-text-secondary)';
      }}
    >
      {children}
    </button>
  );
};
