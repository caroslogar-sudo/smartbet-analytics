import { useEffect, useState } from 'react';
import { Search, Activity, LogOut, Wifi, WifiOff } from 'lucide-react';
import { Button } from '../atoms/Button';
import { useAuth } from '../../contexts/AuthContext';

interface NavbarProps {
  activePage: string;
  onNavigate: (page: string) => void;
}

const NAV_ITEMS = ['INICIO', 'PREDICCIONES', 'DASHBOARD'] as const;

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const BACKEND_STATUS_URL = `${API_BASE_URL}/api/status`;
const STATUS_POLL_INTERVAL_MS = 30_000; // Incrementamos el intervalo para reducir ruido

type BackendStatus = 'unknown' | 'online' | 'offline';

const BackendIndicator: React.FC<{ status: BackendStatus }> = ({ status }) => {
  const config = {
    unknown: { color: 'var(--color-text-secondary)', icon: <Activity size={14} />, label: 'Verificando...' },
    online: { color: 'var(--color-success)', icon: <Wifi size={14} />, label: 'Engine Activo' },
    offline: { color: 'var(--color-danger)', icon: <WifiOff size={14} />, label: 'Engine Offline' },
  }[status];

  return (
    <div
      title={status === 'online' ? 'Backend conectado y engine corriendo' : 'Backend no disponible - modo mock'}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--space-xs)',
        padding: 'var(--space-xs) var(--space-sm)',
        border: `1px solid ${config.color}50`,
        borderRadius: 'var(--radius-sm)',
        marginLeft: 'var(--space-md)',
        cursor: 'default',
        transition: 'all var(--transition-normal)',
      }}
    >
      <span style={{ color: config.color }}>{config.icon}</span>
      <span style={{ fontWeight: 700, fontSize: '0.75rem', letterSpacing: '0.04em', color: config.color }}>
        {config.label}
      </span>
    </div>
  );
};

export const Navbar: React.FC<NavbarProps> = ({ activePage, onNavigate }) => {
  const { logout, currentUser } = useAuth();
  const [backendStatus, setBackendStatus] = useState<BackendStatus>('unknown');

  useEffect(() => {
    const checkBackend = async () => {
      try {
        if (!currentUser) return;
        
        const token = await currentUser.getIdToken();
        const res = await fetch(BACKEND_STATUS_URL, { 
          headers: { 'Authorization': `Bearer ${token}` },
          signal: AbortSignal.timeout(3000) 
        });
        setBackendStatus(res.ok ? 'online' : 'offline');
      } catch {
        setBackendStatus('offline');
      }
    };

    checkBackend();
    const intervalId = setInterval(checkBackend, STATUS_POLL_INTERVAL_MS);
    return () => clearInterval(intervalId);
  }, [currentUser]);

  return (
    <header style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: 'var(--space-md) var(--space-xl)',
      backgroundColor: 'var(--color-surface)',
      borderBottom: '1px solid var(--color-surface-borders)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-xl)' }}>
        <nav>
          <ul style={{ display: 'flex', listStyle: 'none', gap: 'var(--space-lg)', margin: 0, padding: 0 }}>
            {NAV_ITEMS.map((item) => {
              const isActive = activePage === item;
              return (
                <li
                  key={item}
                  onClick={() => onNavigate(item)}
                  style={{
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    color: isActive ? 'var(--color-primary)' : 'var(--color-text-primary)',
                    position: 'relative',
                    cursor: 'pointer',
                    transition: 'color var(--transition-fast)'
                  }}
                >
                  {item}
                  {isActive && (
                    <span style={{
                      position: 'absolute',
                      bottom: '-10px',
                      left: 0,
                      right: 0,
                      height: '2px',
                      backgroundColor: 'var(--color-primary)',
                      borderRadius: '1px'
                    }} />
                  )}
                </li>
              );
            })}
          </ul>
        </nav>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
        <Button variant="ghost" size="sm" onClick={logout} style={{ padding: '4px', gap: '6px' }}>
          <LogOut size={16} /> <span style={{ fontSize: '0.75rem' }}>SALIR</span>
        </Button>
        <Button variant="ghost" size="sm" style={{ padding: '4px' }}>
          <Search size={18} />
        </Button>
        <BackendIndicator status={backendStatus} />
      </div>
    </header>
  );
};
