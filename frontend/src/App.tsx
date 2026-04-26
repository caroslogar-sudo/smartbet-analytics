import { useState, useEffect, useRef } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { NotificationProvider, useNotifications } from './contexts/NotificationContext';
import { firebaseService } from './services/firebaseService';
import { LoginPage } from './components/pages/LoginPage';
import { PredictionsPage } from './components/pages/PredictionsPage';
import { DashboardPage } from './components/pages/DashboardPage';
import { HomePage } from './components/pages/HomePage';
import { MultiapuestasPage } from './components/pages/MultiapuestasPage';
import { Navbar } from './components/organisms/Navbar';
import type { BetFormData } from './components/molecules/BetRegistrationModal';

type AppPage = 'INICIO' | 'PREDICCIONES' | 'MULTIAPUESTAS' | 'DASHBOARD';

/**
 * Escucha nuevas oportunidades en tiempo real y dispara alertas si CC > 90.
 */
function HotPredictionListener() {
  const { showNotification } = useNotifications();
  const notifiedIds = useRef<Set<string>>(new Set());

  useEffect(() => {
    // Escuchamos el top-10 global que actualiza el backend
    // subscribeToTop10 devuelve un any[] directamente (array de oportunidades)
    const sub = firebaseService.subscribeToTop10((data) => {
      const items = data as any[];
      if (!items || items.length === 0) return;

      items.forEach((item: any) => {
        // Si es una oportunidad TOP (>92%) y no la hemos notificado ya en esta sesión
        if (item.cc >= 92 && !notifiedIds.current.has(item.id)) {
          notifiedIds.current.add(item.id);

          showNotification({
            type: 'prediction',
            title: '🎯 ¡BOMBA DETECTADA!',
            message: `${item.home} vs ${item.away} (${item.market}). Confianza: ${item.cc}%`,
            duration: 8000
          });

          // Sonido sutil — el navegador lo bloquea sin interacción previa del usuario
          const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
          audio.volume = 0.2;
          audio.play().catch(() => {});
        }
      });
    });

    return () => sub.unsubscribe();
  }, [showNotification]);

  return null;
}

function MainApp() {
  const { currentUser } = useAuth();
  const [activePage, setActivePage] = useState<AppPage>('INICIO');
  /**
   * Prefill para el BetRegistrationModal cuando se navega desde Predicciones.
   * Se limpia automáticamente cuando el modal se cierra (DashboardPage lo gestiona).
   */
  const [dashboardPrefill, setDashboardPrefill] = useState<Partial<BetFormData> | undefined>(undefined);

  if (!currentUser) {
    return <LoginPage />;
  }

  const handleNavigate = (page: string) => {
    if (page !== 'DASHBOARD') {
      setDashboardPrefill(undefined);
    }
    setActivePage(page as AppPage);
  };

  /**
   * Callback invocado desde PredictionsPage cuando el usuario pulsa
   * "+ Registrar apuesta" en una predicción. Navega al Dashboard y abre
   * el modal pre-rellenado con los datos de la oportunidad.
   */
  const handleAddToDashboard = (prefill: Partial<BetFormData>) => {
    setDashboardPrefill(prefill);
    setActivePage('DASHBOARD');
  };

  const renderActivePage = () => {
    switch (activePage) {
      case 'PREDICCIONES':
        return <PredictionsPage onAddToDashboard={handleAddToDashboard} />;
      case 'MULTIAPUESTAS':
        return <MultiapuestasPage onAddToDashboard={handleAddToDashboard} />;
      case 'DASHBOARD':
        return <DashboardPage
          prefill={dashboardPrefill}
          onClearPrefill={() => setDashboardPrefill(undefined)}
        />;
      case 'INICIO':
      default:
        return <HomePage />;
    }
  };

  return (
    <div className="layout">
      <HotPredictionListener />
      <Navbar activePage={activePage} onNavigate={handleNavigate} />
      <main style={{ flex: 1 }}>
        {renderActivePage()}
      </main>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <MainApp />
      </NotificationProvider>
    </AuthProvider>
  );
}

export default App;
