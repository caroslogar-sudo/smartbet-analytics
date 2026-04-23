import React, { useState, type InputHTMLAttributes } from 'react';
import { Eye, EyeOff } from 'lucide-react';

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  error?: string;
  fullWidth?: boolean;
};

export const Input: React.FC<InputProps> = ({
  label,
  error,
  fullWidth = true,
  style,
  className,
  type,
  ...props
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const isPasswordAttribute = type === 'password';

  const containerStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-xxs)',
    width: fullWidth ? '100%' : 'auto',
    marginBottom: 'var(--space-md)',
  };

  const labelStyle: React.CSSProperties = {
    fontSize: '0.875rem',
    color: 'var(--color-text-secondary)',
    fontWeight: 500,
  };

  const inputWrapperStyle: React.CSSProperties = {
    position: 'relative',
    display: 'flex',
    alignItems: 'center'
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    backgroundColor: 'var(--color-surface-hover)',
    border: `1px solid ${error ? 'var(--color-danger)' : 'var(--color-surface-borders)'}`,
    borderRadius: 'var(--radius-md)',
    padding: 'var(--space-sm) var(--space-md)',
    paddingRight: isPasswordAttribute ? '40px' : 'var(--space-md)',
    color: 'var(--color-text-primary)',
    fontSize: '1rem',
    outline: 'none',
    transition: 'border-color var(--transition-fast)',
    ...style,
  };

  const toggleStyle: React.CSSProperties = {
    position: 'absolute',
    right: 'var(--space-sm)',
    background: 'none',
    border: 'none',
    color: 'var(--color-text-secondary)',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '4px'
  };

  const errorStyle: React.CSSProperties = {
    fontSize: '0.75rem',
    color: 'var(--color-danger)',
    marginTop: 'var(--space-xxs)',
  };

  return (
    <div style={containerStyle}>
      {label && <label style={labelStyle}>{label}</label>}
      <div style={inputWrapperStyle}>
        <input
          style={inputStyle}
          type={isPasswordAttribute ? (showPassword ? 'text' : 'password') : type}
          onFocus={(e) => {
            if (!error) e.currentTarget.style.borderColor = 'var(--color-primary)';
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = error ? 'var(--color-danger)' : 'var(--color-surface-borders)';
          }}
          {...props}
        />
        {isPasswordAttribute && (
          <button 
            type="button" 
            onClick={() => setShowPassword(!showPassword)}
            style={toggleStyle}
            tabIndex={-1}
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        )}
      </div>
      {error && <span style={errorStyle}>{error}</span>}
    </div>
  );
};
