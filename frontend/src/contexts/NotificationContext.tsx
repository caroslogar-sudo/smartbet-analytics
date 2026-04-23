import React, { createContext, useContext, useState, useCallback } from 'react';
import { X, Bell, Zap, TrendingUp, Info } from 'lucide-react';

export type NotificationType = 'success' | 'warning' | 'info' | 'prediction';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  duration?: number;
}

interface NotificationContextType {
  showNotification: (notification: Omit<Notification, 'id'>) => void;
  hideNotification: (id: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const hideNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const showNotification = useCallback((notif: Omit<Notification, 'id'>) => {
    const id = Math.random().toString(36).substring(2, 9);
    const newNotif = { ...notif, id };
    
    setNotifications((prev) => [...prev, newNotif]);

    if (notif.duration !== 0) {
      setTimeout(() => hideNotification(id), notif.duration || 5000);
    }
  }, [hideNotification]);

  return (
    <NotificationContext.Provider value={{ showNotification, hideNotification }}>
      {children}
      {/* Container para Toasts en la esquina superior derecha */}
      <div style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        pointerEvents: 'none',
      }}>
        {notifications.map((n) => (
          <Toast key={n.id} notification={n} onClose={() => hideNotification(n.id)} />
        ))}
      </div>
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) throw new Error('useNotifications debe usarse dentro de NotificationProvider');
  return context;
};

/* ─── Sub-Componente Toast ─── */

const Toast: React.FC<{ notification: Notification; onClose: () => void }> = ({ notification, onClose }) => {
  const colors = {
    success: { bg: 'var(--color-success)', icon: <TrendingUp size={18} /> },
    warning: { bg: 'var(--color-warning)', icon: <Bell size={18} /> },
    info: { bg: 'var(--color-info)', icon: <Info size={18} /> },
    prediction: { bg: 'var(--color-primary)', icon: <Zap size={18} /> },
  };

  const config = colors[notification.type];

  return (
    <div
      className="animate-fade-in"
      style={{
        pointerEvents: 'auto',
        minWidth: '320px',
        maxWidth: '400px',
        backgroundColor: 'var(--color-surface)',
        border: `1px solid ${config.bg}44`,
        borderRadius: 'var(--radius-lg)',
        padding: '16px',
        boxShadow: `0 10px 25px -5px rgba(0,0,0,0.4), 0 0 15px ${config.bg}22`,
        display: 'flex',
        gap: '12px',
        color: 'var(--color-text-primary)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Indicador lateral de color */}
      <div style={{
        position: 'absolute',
        left: 0,
        top: 0,
        bottom: 0,
        width: '4px',
        backgroundColor: config.bg,
      }} />

      <div style={{
        backgroundColor: `${config.bg}15`,
        color: config.bg,
        width: '36px',
        height: '36px',
        borderRadius: 'var(--radius-md)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}>
        {config.icon}
      </div>

      <div style={{ flex: 1 }}>
        <h4 style={{ margin: '0 0 4px 0', fontSize: '0.9rem', fontWeight: 800 }}>{notification.title}</h4>
        <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--color-text-secondary)', lineHeight: 1.4 }}>
          {notification.message}
        </p>
      </div>

      <button
        onClick={onClose}
        style={{
          background: 'none',
          border: 'none',
          color: 'var(--color-text-secondary)',
          cursor: 'pointer',
          padding: '4px',
          alignSelf: 'flex-start',
          opacity: 0.6,
        }}
        onMouseEnter={(e) => { e.currentTarget.style.opacity = '1'; }}
        onMouseLeave={(e) => { e.currentTarget.style.opacity = '0.6'; }}
      >
        <X size={16} />
      </button>
    </div>
  );
};
