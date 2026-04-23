import React, { useState, useEffect } from 'react';
import { Activity, Clock, Trophy, AlertTriangle, Radio } from 'lucide-react';
import { Card } from '../atoms/Card';
import { Badge } from '../atoms/Badge';

// Datos simulados para demostrar el funcionamiento del sistema 4-Track
const MOCK_LIVE_MATCHES = [
  {
    id: 'live1',
    home: 'Real Madrid',
    away: 'Barcelona',
    sport: 'Fútbol',
    league: 'LaLiga',
    status: 'En Juego (2ª Parte)',
    score: '2 - 1',
    time: '68\'',
    trackStatus: 'Rastreo 3/4',
    events: ['Gol Vinicius (12\')', 'Amarilla Gavi (34\')', 'Gol Lewandowski (45\')', 'Gol Bellingham (60\')']
  },
  {
    id: 'live2',
    home: 'Lakers',
    away: 'Warriors',
    sport: 'Baloncesto',
    league: 'NBA',
    status: 'En Juego (3er Cuarto)',
    score: '78 - 82',
    time: '4:30 Q3',
    trackStatus: 'Rastreo 3/4',
    events: ['Curry 24 pts', 'LeBron 18 pts, 8 ast']
  }
];

const MOCK_FINISHED_MATCHES = [
  {
    id: 'fin1',
    home: 'Arsenal',
    away: 'Man City',
    sport: 'Fútbol',
    league: 'Premier League',
    status: 'Finalizado',
    score: '1 - 1',
    trackStatus: 'Rastreos Completados (4/4)',
  },
  {
    id: 'fin2',
    home: 'Bayern Munich',
    away: 'Dortmund',
    sport: 'Fútbol',
    league: 'Bundesliga',
    status: 'Finalizado',
    score: '3 - 0',
    trackStatus: 'Rastreos Completados (4/4)',
  }
];

export const DirectosPage: React.FC = () => {
  const [loading, setLoading] = useState(true);

  // Simular la carga inicial del "Rastreador Inteligente"
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div style={{ padding: 'var(--space-lg) var(--space-xl) var(--space-xxl)' }}>
      {/* Header */}
      <div style={{ marginBottom: 'var(--space-xl)' }}>
        <h1 style={{
          fontSize: '1.8rem',
          fontWeight: 800,
          margin: '0 0 var(--space-xs) 0',
          letterSpacing: '-0.01em',
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-sm)'
        }}>
          Panel de <span style={{ color: 'var(--color-danger)' }}>Directos</span>
          <Radio color="var(--color-danger)" size={24} />
        </h1>
        <p style={{
          color: 'var(--color-text-secondary)',
          fontSize: '0.9rem',
          margin: '0 0 var(--space-md) 0',
          maxWidth: '800px',
          lineHeight: 1.6,
        }}>
          Monitorización en tiempo real. Utilizando el algoritmo <strong>Smart 4-Track</strong>, 
          realizamos exclusivamente 4 rastreos por parte (en fútbol) o por cuarto (en baloncesto). 
          Esto garantiza máxima precisión en los momentos clave mientras reducimos drásticamente el consumo de la API.
        </p>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 'var(--space-xxl)', color: 'var(--color-text-secondary)' }}>
          <Activity size={32} style={{ animation: 'spin 2s linear infinite', marginBottom: 'var(--space-md)' }} />
          <p>Conectando al motor de rastreo 4-Track...</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xl)' }}>
          
          {/* Sección: Partidos en Directo */}
          <section>
            <h2 style={{ fontSize: '1.2rem', marginBottom: 'var(--space-md)', display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
              <Clock size={20} color="var(--color-warning)" />
              En Juego (Rastreo Activo)
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 'var(--space-md)' }}>
              {MOCK_LIVE_MATCHES.map(match => (
                <Card key={match.id} style={{ borderLeft: '4px solid var(--color-danger)', padding: 'var(--space-md)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-xs)' }}>
                    <Badge variant="danger" style={{ animation: 'pulse 2s infinite' }}>{match.status}</Badge>
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', fontWeight: 600 }}>{match.trackStatus}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: 'var(--space-md) 0' }}>
                    <div style={{ fontSize: '1.1rem', fontWeight: 700 }}>{match.home}</div>
                    <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--color-primary)' }}>{match.score}</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 700 }}>{match.away}</div>
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginTop: 'var(--space-sm)' }}>
                    {match.events.join(' • ')}
                  </div>
                </Card>
              ))}
            </div>
          </section>

          {/* Sección: Partidos Finalizados */}
          <section>
            <h2 style={{ fontSize: '1.2rem', marginBottom: 'var(--space-md)', display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
              <Trophy size={20} color="var(--color-success)" />
              Finalizados (Hoy)
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 'var(--space-md)' }}>
              {MOCK_FINISHED_MATCHES.map(match => (
                <Card key={match.id} style={{ padding: 'var(--space-md)', opacity: 0.85 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-xs)' }}>
                    <Badge variant="success">{match.status}</Badge>
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>{match.trackStatus}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: 'var(--space-sm) 0' }}>
                    <div style={{ fontSize: '1rem', fontWeight: 600 }}>{match.home}</div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 700 }}>{match.score}</div>
                    <div style={{ fontSize: '1rem', fontWeight: 600 }}>{match.away}</div>
                  </div>
                </Card>
              ))}
            </div>
          </section>

        </div>
      )}

      {/* Aviso de Consumo */}
      <div style={{
        marginTop: 'var(--space-xxl)',
        padding: 'var(--space-md)',
        backgroundColor: 'rgba(59, 130, 246, 0.05)',
        border: '1px solid rgba(59, 130, 246, 0.2)',
        borderRadius: 'var(--radius-md)',
        display: 'flex',
        alignItems: 'flex-start',
        gap: 'var(--space-sm)',
      }}>
        <AlertTriangle size={16} color="var(--color-primary)" style={{ flexShrink: 0, marginTop: '2px' }} />
        <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', margin: 0, lineHeight: 1.5 }}>
          <strong>Optimización de API:</strong> El sistema está configurado en modo Smart 4-Track. Esto significa que no solicita actualizaciones segundo a segundo, sino que toma 4 "fotografías estadísticas" precisas en cada mitad del partido para identificar oportunidades clave de apuestas live.
        </p>
      </div>

    </div>
  );
};
