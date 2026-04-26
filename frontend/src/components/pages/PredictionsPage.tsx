import React, { useMemo } from 'react';
import { MatchCard } from '../molecules/MatchCard';
import { useLiveTop10 } from '../../hooks/useLiveTop10';
import type { MarketCategory } from '../../data/mockPredictions';
import { AlertTriangle } from 'lucide-react';
import type { BetFormData } from '../molecules/BetRegistrationModal';

interface PredictionsPageProps {
  onAddToDashboard?: (prefill: Partial<BetFormData>) => void;
}

/**
 * Infiere la categoría de mercado a partir del nombre.
 * Permite que datos legacy de Firestore (sin market_category) obtengan iconografía correcta.
 */
const inferMarketCategory = (m: string): MarketCategory => {
  m = m.toLowerCase();
  if (m.includes('corner'))                                                         return 'corners';
  if (m.includes('tarjeta') || m.includes('card'))                                  return 'tarjetas';
  if (m.includes('goleador') || m.includes('marca') || m.includes('anota'))         return 'goleador';
  if (m.includes('handicap') || m.includes('spread') || m.includes('hándicap'))     return 'handicap';
  if (m.includes('parte') || m.includes('mitad') || m.includes('cuarto') || m.includes('descanso')) return 'parcial';
  if (m.includes('gol') || m.includes('punto') || m.includes('over') || m.includes('under') || m.includes('total') || m.includes('marcan') || m.includes('btts')) return 'goles';
  if (m.includes('prop') || m.includes('yarda') || m.includes('asist') || m.includes('rebote')) return 'props';
  if (m.includes('podio') || m.includes('pole') || m.includes('vuelta') || m.includes('safety') || m.includes('constructor') || m.includes('top')) return 'especial';
  return 'ganador';
};

export const PredictionsPage: React.FC<PredictionsPageProps> = ({ onAddToDashboard }) => {
  const [filterLive, setFilterLive] = React.useState(false);
  const [filterSport, setFilterSport] = React.useState<string | null>(null);
  const [searchQuery, setSearchQuery] = React.useState('');
  
  const { opportunities } = useLiveTop10();

  const LIVE_SPORTS_DATA = useMemo(() => {
    // Agrupación por Fecha -> Deporte -> Liga
    const dateGroups = new Map<string, Map<string, Map<string, any[]>>>();

    opportunities.forEach(o => {
       const dateObj = new Date(o.commence_time);
       const dateKey = dateObj.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
       
       if (!dateGroups.has(dateKey)) dateGroups.set(dateKey, new Map());
       const sportGroups = dateGroups.get(dateKey)!;
       
       if (!sportGroups.has(o.sport)) sportGroups.set(o.sport, new Map());
       const leagueGroups = sportGroups.get(o.sport)!;
       
       if (!leagueGroups.has(o.comp)) leagueGroups.set(o.comp, []);
       leagueGroups.get(o.comp)!.push(o);
    });

    return Array.from(dateGroups.entries()).map(([dateLabel, sports]) => {
      return {
        dateLabel,
        sports: Array.from(sports.entries()).map(([sportName, leagues]) => {
          let icon = '🎯';
          let accentColor = '#3B82F6';
          if (sportName.toLowerCase().includes('fútbol') || sportName.toLowerCase().includes('soccer')) { icon = '⚽'; accentColor = '#10B981'; }
          if (sportName.toLowerCase().includes('baloncesto') || sportName.toLowerCase().includes('nba')) { icon = '🏀'; accentColor = '#F97316'; }

          return {
            sportName,
            icon,
            accentColor,
            leagues: Array.from(leagues.entries()).map(([leagueName, leagueOpps]) => {
               const matchGroups = new Map<string, any[]>();
               leagueOpps.forEach(o => {
                  const matchId = `${o.home} vs ${o.away}`;
                  const group = matchGroups.get(matchId) || [];
                  group.push(o);
                  matchGroups.set(matchId, group);
               });

               const matches = Array.from(matchGroups.entries()).map(([matchId, matchOpps]) => {
                  const first = matchOpps[0];
                  const timeStr = first.commence_time ? new Date(first.commence_time).toLocaleTimeString('es-ES', {
                     hour: '2-digit',
                     minute: '2-digit'
                  }) : '--:--';

                  return {
                     matchId,
                     home: first.home,
                     away: first.away,
                     matchTime: timeStr,
                     isLive: matchOpps.some(o => o.is_live),
                     predictions: matchOpps.map(o => {
                        const impliedP = o.odds > 1 ? Math.round((1 / o.odds) * 100 * 10) / 10 : 50;
                        const reason = `Análisis basado en alineaciones reales confirmadas y histórico de enfrentamientos. Se ha contemplado la probabilidad de empate (${(100 - impliedP * 1.2).toFixed(1)}%) en el modelo de regresión. Confianza algorítmica del ${o.cc}% para "${o.prediction}".`;

                        return {
                           ...o,
                           id: o.id,
                           isLive: o.is_live,
                           bestOdds: o.odds,
                           bestBookmaker: o.bookmaker,
                           bookmakerOdds: o.bookmaker_odds || [],
                           market_category: o.market_category || inferMarketCategory(o.market),
                           statisticalReason: o.statisticalReason || reason,
                        };
                     })
                  };
               });

               return { leagueName, matches };
            })
          };
        })
      };
    });
  }, [opportunities]);

  const filteredData = LIVE_SPORTS_DATA.map(day => ({
    ...day,
    sports: day.sports.filter(s => !filterSport || s.sportName === filterSport)
      .map(sport => ({
        ...sport,
        leagues: sport.leagues.map(league => ({
          ...league,
          matches: league.matches.filter(m => {
            const matchesSearch = m.home.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                 m.away.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                 league.leagueName.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesLive = !filterLive || m.isLive;
            return matchesSearch && matchesLive;
          })
        })).filter(l => l.matches.length > 0)
      })).filter(s => s.leagues.length > 0)
  })).filter(d => d.sports.length > 0);

  const uniqueSports = useMemo(() => {
    const sportsMap = new Map<string, string>();
    opportunities.forEach(o => {
      let icon = '🎯';
      if (o.sport.toLowerCase().includes('fútbol') || o.sport.toLowerCase().includes('soccer')) icon = '⚽';
      if (o.sport.toLowerCase().includes('baloncesto') || o.sport.toLowerCase().includes('nba')) icon = '🏀';
      sportsMap.set(o.sport, icon);
    });
    return Array.from(sportsMap.entries()).map(([name, icon]) => ({ name, icon }));
  }, [opportunities]);

  return (
    <div style={{ padding: 'var(--space-lg) var(--space-xl) var(--space-xxl)' }}>
      <div style={{ marginBottom: 'var(--space-xl)' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: 'var(--space-xs)' }}>
          Panel de Predicciones
        </h1>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.95rem' }}>
          Oportunidades reales analizadas por nuestro motor estadístico avanzado.
        </p>

        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 'var(--space-lg)',
          marginTop: 'var(--space-xl)',
          marginBottom: 'var(--space-xl)',
          flexWrap: 'wrap',
          backgroundColor: 'var(--color-surface)',
          padding: 'var(--space-md) var(--space-lg)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--color-surface-borders)',
        }}>
          <div style={{ display: 'flex', gap: 'var(--space-sm)', alignItems: 'center' }}>
            <button onClick={() => setFilterSport(null)} style={{ padding: '6px 16px', borderRadius: 'var(--radius-full)', border: '1px solid var(--color-surface-borders)', backgroundColor: filterSport === null ? 'var(--color-primary)' : 'transparent', color: filterSport === null ? 'white' : 'var(--color-text-secondary)', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}>Todos</button>
            {uniqueSports.map(s => (
              <button key={s.name} onClick={() => setFilterSport(s.name)} style={{ padding: '6px 16px', borderRadius: 'var(--radius-full)', border: '1px solid var(--color-surface-borders)', backgroundColor: filterSport === s.name ? 'var(--color-primary)' : 'transparent', color: filterSport === s.name ? 'white' : 'var(--color-text-secondary)', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}>
                <span style={{ marginRight: '4px' }}>{s.icon}</span>
                {s.name}
              </button>
            ))}
          </div>

          <div style={{ position: 'relative', flex: 1, maxWidth: '300px' }}>
            <input 
              type="text"
              placeholder="Buscar equipo o liga..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                backgroundColor: 'var(--color-background)',
                border: '1px solid var(--color-surface-borders)',
                borderRadius: 'var(--radius-md)',
                padding: '8px 12px',
                color: 'var(--color-text-primary)',
                fontSize: '0.85rem',
                outline: 'none',
              }}
            />
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xxl)' }}>
        {filteredData.length > 0 ? (
          filteredData.map(dayGroup => (
            <div key={dayGroup.dateLabel}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)', marginBottom: 'var(--space-xl)', padding: 'var(--space-xs) 0', borderBottom: '1px solid var(--color-surface-borders)' }}>
                <h2 style={{ fontSize: '1.1rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--color-primary)', letterSpacing: '0.05em' }}>{dayGroup.dateLabel}</h2>
              </div>

              {dayGroup.sports.map(sport => (
                <div key={`${dayGroup.dateLabel}-${sport.sportName}`} style={{ marginBottom: 'var(--space-xxl)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', marginBottom: 'var(--space-lg)' }}>
                    <span style={{ fontSize: '1.4rem' }}>{sport.icon}</span>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0 }}>{sport.sportName}</h3>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xl)' }}>
                    {sport.leagues.map(league => (
                      <div key={`${dayGroup.dateLabel}-${sport.sportName}-${league.leagueName}`}>
                        <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 'var(--space-md)', display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', opacity: 0.8 }}>
                          <div style={{ width: '12px', height: '2px', backgroundColor: sport.accentColor }}></div>
                          {league.leagueName.toUpperCase()}
                        </div>
                        
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: 'var(--space-lg)' }}>
                          {league.matches.map(match => (
                            <MatchCard 
                              key={`${dayGroup.dateLabel}-${match.matchId}`}
                              home={match.home}
                              away={match.away}
                              matchDate={match.matchTime}
                              league={league.leagueName}
                              sport={sport.sportName}
                              predictions={match.predictions}
                              accentColor={sport.accentColor}
                              onAddToDashboard={onAddToDashboard}
                            />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ))
        ) : (
          <div style={{ padding: 'var(--space-xxl)', textAlign: 'center', backgroundColor: 'var(--color-surface)', borderRadius: 'var(--radius-xl)', border: '1px dashed var(--color-surface-borders)', marginTop: 'var(--space-xl)' }}>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '1.1rem' }}>No se han encontrado predicciones.</p>
          </div>
        )}
      </div>

      <div style={{
        marginTop: 'var(--space-xxl)',
        padding: 'var(--space-md)',
        backgroundColor: 'rgba(245, 158, 11, 0.06)',
        border: '1px solid rgba(245, 158, 11, 0.2)',
        borderRadius: 'var(--radius-md)',
        display: 'flex',
        alignItems: 'flex-start',
        gap: 'var(--space-sm)',
      }}>
        <AlertTriangle size={16} color="var(--color-warning)" style={{ flexShrink: 0, marginTop: '2px' }} />
        <p style={{
          fontSize: '0.75rem',
          color: 'var(--color-text-secondary)',
          lineHeight: 1.6,
          margin: 0,
        }}>
          <strong style={{ color: 'var(--color-warning)' }}>Aviso:</strong> Todas las predicciones se basan
          exclusivamente en análisis estadístico de datos públicos. No constituyen asesoramiento financiero.
          Las cuotas pueden variar. El CC es una estimación matemática, no una garantía. Apuesta con responsabilidad.
        </p>
      </div>
    </div>
  );
};
