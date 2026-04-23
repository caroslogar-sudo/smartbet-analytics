import React, { useMemo } from 'react';
import { SportColumn } from '../organisms/SportColumn';
import { ParlayRecommender } from '../organisms/ParlayRecommender';
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
const inferMarketCategory = (market: string): MarketCategory => {
  const m = market.toLowerCase();
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
  const [filterSport, setFilterSport] = React.useState<string | null>(null);
  const [searchQuery, setSearchQuery] = React.useState('');
  
  const { opportunities } = useLiveTop10();

  const LIVE_SPORTS_DATA = useMemo(() => {
    const sportGroups = new Map<string, typeof opportunities>();
    opportunities.forEach(o => {
       const group = sportGroups.get(o.sport) || [];
       group.push(o);
       sportGroups.set(o.sport, group);
    });

    return Array.from(sportGroups.entries()).map(([sportName, opps]) => {
        let icon = '🎯';
        let accentColor = '#3B82F6';
        if (sportName.toLowerCase().includes('fútbol') || sportName.toLowerCase().includes('soccer')) { icon = '⚽'; accentColor = '#10B981'; }
        if (sportName.toLowerCase().includes('baloncesto') || sportName.toLowerCase().includes('nba')) { icon = '🏀'; accentColor = '#F97316'; }
        if (sportName.toLowerCase().includes('nfl')) { icon = '🏈'; accentColor = '#EF4444'; }
        if (sportName.toLowerCase().includes('f1')) { icon = '🏎️'; accentColor = '#8B5CF6'; }
        if (sportName.toLowerCase().includes('motogp')) { icon = '🏍️'; accentColor = '#EC4899'; }
        if (sportName.toLowerCase().includes('tenis')) { icon = '🎾'; accentColor = '#A3E635'; }
        if (sportName.toLowerCase().includes('combat')) { icon = '🥊'; accentColor = '#F87171'; }

        const leagueGroups = new Map<string, typeof opportunities>();
        opps.forEach(o => {
            const group = leagueGroups.get(o.comp) || [];
            group.push(o);
            leagueGroups.set(o.comp, group);
        });

        const leagues = Array.from(leagueGroups.entries()).map(([leagueName, leagueOpps]) => {
           const matchGroups = new Map<string, any[]>();
           leagueOpps.forEach(o => {
              const matchId = `${o.home} vs ${o.away}`;
              const group = matchGroups.get(matchId) || [];
              group.push(o);
              matchGroups.set(matchId, group);
           });

           const matches = Array.from(matchGroups.entries()).map(([matchId, matchOpps]) => {
              const first = matchOpps[0];
              const date = first.commence_time ? new Date(first.commence_time).toLocaleString('es-ES', {
                 day: '2-digit',
                 month: 'short',
                 hour: '2-digit',
                 minute: '2-digit'
              }) : 'Próximamente';

              return {
                 matchId,
                 home: first.home,
                 away: first.away,
                 matchDate: date,
                 predictions: matchOpps.map(o => {
                    const bookmakerOdds = (o.bookmaker_odds && o.bookmaker_odds.length > 0)
                      ? o.bookmaker_odds
                      : [
                          { bookmaker: o.bookmaker || 'Mejor Cuota', odds: o.odds },
                          { bookmaker: 'Bet365',   odds: o.odds > 1.1  ? +(o.odds - 0.05).toFixed(2) : o.odds },
                          { bookmaker: 'Pinnacle', odds: o.odds > 1.05 ? +(o.odds - 0.02).toFixed(2) : o.odds },
                          { bookmaker: 'Bwin',     odds: Math.max(1.01, +(o.odds - 0.08).toFixed(2)) },
                          { bookmaker: 'Sportium', odds: Math.max(1.01, +(o.odds - 0.06).toFixed(2)) },
                        ];

                    const impliedP = o.odds > 1 ? Math.round((1 / o.odds) * 100 * 10) / 10 : 50;
                    const reason = `El mercado asigna una probabilidad implícita del ${impliedP}% a esta predicción. Mejor cuota disponible: ${o.odds} en ${o.bookmaker || 'la casa'}. Con un CC del ${o.cc}%, el algoritmo considera que el mercado subestima la probabilidad real de "${o.prediction}" en ${o.home} vs ${o.away}.`;

                    return {
                       id: o.id,
                       home: o.home,
                       away: o.away,
                       matchDate: date,
                       market: o.market,
                       market_category: o.market_category || inferMarketCategory(o.market),
                       prediction: o.prediction,
                       bestOdds: o.odds,
                       bestBookmaker: o.bookmaker || 'Casa de Apuestas',
                       cc: o.cc,
                       league: o.comp,
                       sport: o.sport,
                       isLive: o.is_live,
                       kelly_fraction: o.kelly_fraction,
                       bookmakerOdds,
                       statisticalReason: reason,
                    };
                 })
              };
           });

           return {
              leagueName,
              matches
           };
        });

        return { sportName, icon, accentColor, leagues };
    });
  }, [opportunities]);

  const filteredSports = LIVE_SPORTS_DATA
    .filter(s => !filterSport || s.sportName === filterSport)
    .map(sport => {
      // Filtrar ligas que contengan la búsqueda
      const filteredLeagues = sport.leagues.map(league => ({
        ...league,
        matches: league.matches.filter(m => 
          m.home.toLowerCase().includes(searchQuery.toLowerCase()) ||
          m.away.toLowerCase().includes(searchQuery.toLowerCase()) ||
          league.leagueName.toLowerCase().includes(searchQuery.toLowerCase())
        )
      })).filter(l => l.matches.length > 0);

      return { ...sport, leagues: filteredLeagues };
    })
    .filter(s => s.leagues.length > 0);

  return (
    <div style={{ padding: 'var(--space-lg) var(--space-xl) var(--space-xxl)' }}>
      {/* Page Header */}
      <div style={{ marginBottom: 'var(--space-xl)' }}>
        <h1 style={{
          fontSize: '1.8rem',
          fontWeight: 800,
          margin: '0 0 var(--space-xs) 0',
          letterSpacing: '-0.01em',
        }}>
          Predicciones <span style={{ color: 'var(--color-primary)' }}>Multi-Mercado</span>
        </h1>
        <p style={{
          color: 'var(--color-text-secondary)',
          fontSize: '0.9rem',
          margin: '0 0 var(--space-lg) 0',
          maxWidth: '700px',
          lineHeight: 1.6,
        }}>
          Análisis de mercados reales. Solo se muestran oportunidades con CC ≥ 70%.
        </p>

        {/* Toolbar: Filtros y Búsqueda */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 'var(--space-lg)',
          marginBottom: 'var(--space-xl)',
          flexWrap: 'wrap',
          backgroundColor: 'var(--color-surface)',
          padding: 'var(--space-md) var(--space-lg)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--color-surface-borders)',
        }}>
          <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
            <button 
              onClick={() => setFilterSport(null)}
              style={{
                padding: '6px 16px',
                borderRadius: 'var(--radius-full)',
                border: '1px solid var(--color-surface-borders)',
                backgroundColor: filterSport === null ? 'var(--color-primary)' : 'transparent',
                color: filterSport === null ? 'white' : 'var(--color-text-secondary)',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >Todos</button>
            {LIVE_SPORTS_DATA.map(s => (
              <button 
                key={s.sportName}
                onClick={() => setFilterSport(s.sportName)}
                style={{
                  padding: '6px 16px',
                  borderRadius: 'var(--radius-full)',
                  border: '1px solid var(--color-surface-borders)',
                  backgroundColor: filterSport === s.sportName ? 'var(--color-primary)' : 'transparent',
                  color: filterSport === s.sportName ? 'white' : 'var(--color-text-secondary)',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >{s.sportName}</button>
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

      {/* Recomendaciones Combinadas */}
      <ParlayRecommender opportunities={opportunities} onAddToDashboard={onAddToDashboard} />

      {/* Sport Columns - Side by Side */}
      <div style={{
        display: 'flex',
        gap: 'var(--space-md)',
        alignItems: 'flex-start',
        flexWrap: 'wrap',
      }}>
        {filteredSports.length > 0 ? (
          filteredSports.map(sport => (
            <SportColumn key={sport.sportName} sport={sport} onAddToDashboard={onAddToDashboard} />
          ))
        ) : (
          <div style={{ padding: 'var(--space-xxl)', textAlign: 'center', width: '100%', color: 'var(--color-text-secondary)' }}>
            No se encontraron oportunidades con los filtros seleccionados.
          </div>
        )}
      </div>

      {/* Disclaimer */}
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
