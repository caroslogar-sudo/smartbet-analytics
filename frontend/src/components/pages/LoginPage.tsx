import React, { useState } from 'react';
import { Button } from '../atoms/Button';
import { Input } from '../atoms/Input';
import { Card } from '../atoms/Card';
import { Award } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export const LoginPage: React.FC = () => {
  const { login, register } = useAuth();
  
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Mapeador de errores de Firebase amigable
  const getFriendlyError = (err: any): string => {
    console.error("Firebase Auth Error:", err); // Para debugear en la consola del navegador
    const errCode = err.code;
    
    switch (errCode) {
      case 'auth/invalid-email': return 'El correo electrónico no es válido.';
      case 'auth/user-disabled': return 'Esta cuenta ha sido deshabilitada.';
      case 'auth/user-not-found': return 'No existe ninguna cuenta con este correo.';
      case 'auth/invalid-credential': return 'Contraseña incorrecta o cuenta inexistente.';
      case 'auth/email-already-in-use': return 'Este correo ya está registrado.';
      case 'auth/weak-password': return 'La contraseña debe tener al menos 6 caracteres.';
      case 'auth/network-request-failed': return 'Error de red. Revisa tu conexión.';
      case 'auth/operation-not-allowed': return 'El registro por Email/Contraseña está desactivado. Actívalo en la Consola de Firebase.';
      default: return `Error de Firebase: ${err.message || 'Desconocido'}`;
    }
  };

  const validateForm = () => {
    if (!email || !password) {
      setError('Por favor, completa todos los campos.');
      return false;
    }
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      return false;
    }
    if (isRegister && password !== confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Validaciones tempranas (Early return pattern)
    if (!validateForm()) return;

    setIsLoading(true);

    try {
      if (isRegister) {
        await register(email, password);
      } else {
        await login(email, password, rememberMe);
      }
    } catch (err: any) {
      setError(getFriendlyError(err));
    } finally {
      setIsLoading(false);
    }
  };

  const containerStyle: React.CSSProperties = {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 'var(--space-lg)',
    backgroundColor: 'var(--color-background)',
    backgroundImage: 'radial-gradient(circle at 50% 0%, rgba(59, 130, 246, 0.15) 0%, transparent 60%)',
  };

  const brandStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 'var(--space-sm)',
    marginBottom: 'var(--space-xl)',
  };

  return (
    <div style={containerStyle}>
      <Card style={{ maxWidth: '400px', width: '100%', padding: 'var(--space-xl)' }}>
        <div style={brandStyle}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'var(--color-primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Award size={24} color="var(--color-text-primary)" />
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>
            SmartBet<span style={{ color: 'var(--color-primary)' }}>.</span>
          </h2>
        </div>

        <div style={{ textAlign: 'center', marginBottom: 'var(--space-xl)' }}>
          <h1 style={{ fontSize: '1.25rem', marginBottom: 'var(--space-xs)' }}>
            {isRegister ? 'Crear una cuenta' : 'Bienvenido de nuevo'}
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>
            {isRegister ? 'Regístrate para ver el Top 10' : 'Ingresa a tu dashboard analítico'}
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <Input 
            label="Correo Electrónico" 
            type="email" 
            placeholder="tu@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Input 
            label="Contraseña" 
            type="password" 
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          {isRegister && (
            <Input 
              label="Confirmar Contraseña" 
              type="password" 
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          )}

          {!isRegister && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 'var(--space-md)'
            }}>
              <label style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '0.875rem',
                color: 'var(--color-text-secondary)',
                cursor: 'pointer'
              }}>
                <input 
                  type="checkbox" 
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  style={{ accentColor: 'var(--color-primary)', cursor: 'pointer' }}
                />
                Recordar en este dispositivo
              </label>
              <a href="#" style={{ fontSize: '0.875rem', color: 'var(--color-primary)', textDecoration: 'none' }}>
                ¿Olvidaste tu contraseña?
              </a>
            </div>
          )}
          
          {error && (
            <div className="animate-fade-in" style={{ 
              color: 'var(--color-danger)', 
              fontSize: '0.875rem',
              marginBottom: 'var(--space-md)',
              textAlign: 'center',
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              padding: 'var(--space-sm)',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid rgba(239, 68, 68, 0.3)'
            }}>
              {error}
            </div>
          )}

          <Button 
            type="submit" 
            fullWidth 
            size="lg"
            variant="primary"
            disabled={isLoading}
            style={{ marginTop: 'var(--space-sm)' }}
          >
            {isLoading ? 'Autenticando...' : (isRegister ? 'Crear Cuenta' : 'Iniciar Sesión')}
          </Button>
        </form>

        <div style={{ textAlign: 'center', marginTop: 'var(--space-lg)' }}>
          <button 
            onClick={() => {
              setIsRegister(!isRegister);
              setError('');
              setEmail('');
              setPassword('');
              setConfirmPassword('');
            }}
            type="button"
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--color-text-secondary)',
              fontSize: '0.875rem',
              cursor: 'pointer',
              textDecoration: 'underline'
            }}
          >
            {isRegister ? '¿Ya tienes cuenta? Inicia Sesión' : '¿No tienes cuenta? Regístrate aquí'}
          </button>
        </div>
      </Card>
    </div>
  );
};
