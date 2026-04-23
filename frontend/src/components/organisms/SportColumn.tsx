import React, { useState } from 'react';
import type { SportData } from '../../data/mockPredictions';
import { MatchCard } from '../molecules/MatchCard';
import { ChevronRight, ChevronDown } from 'lucide-react';
import type { BetFormData } from '../molecules/BetRegistrationModal';

interface SportColumnProps {
  sport: SportData;
  onAddToDashboard?: (prefill: Partial<BetFormData>) => void;
}

export const SportColumn: React.FC<SportColumnProps> = ({ sport, onAddToDashboard }) => {
  const [expandedLeague, setExpandedLeague] = useState<string | null>(null);

  const toggleLeague = (leagueName: string) => {
    setExpandedLeague(prev => prev === leagueName ? null : leagueName);
  };

  return (
    <div style={{
      flex: '1 1 0',
      minWidth: '320px',
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* Sport Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--space-sm)',
        padding: 'var(--space-md)',
        backgroundColor: 'var(--color-surface)',
        borderRadius: 'var(--radius-md) var(--radius-md) 0 0',
        borderBottom: `2px solid ${sport.accentColor}`,
      }}>
        <span style={{ fontSize: '1.3rem' }}>{sport.icon}</span>
        <h2 style={{
          fontSize: '1rem',
          fontWeight: 800,
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
          margin: 0,
          color: sport.accentColor,
        }}>
          {sport.sportName}
        </h2>
        <span style={{
          fontSize: '0.6rem',
          color: 'var(--color-text-secondary)',
          backgroundColor: 'var(--color-surface-hover)',
          padding: '2px 8px',
          borderRadius: 'var(--radius-full)',
          fontWeight: 600,
          marginLeft: 'auto',
        }}>
          {sport.leagues.length} {sport.leagues.length === 1 ? 'liga' : 'ligas'}
        </span>
      </div>

      {/* Leagues */}
      <div style={{
        backgroundColor: 'var(--color-background)',
        border: '1px solid var(--color-surface-borders)',
        borderTop: 'none',
        borderRadius: '0 0 var(--radius-md) var(--radius-md)',
        overflow: 'hidden',
      }}>
        {sport.leagues.map((league, leagueIndex) => {
          const isExpanded = expandedLeague === league.leagueName;
          
          return (
            <div key={league.leagueName}>
              {/* League Button */}
              <button
                onClick={() => toggleLeague(league.leagueName)}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: 'var(--space-sm) var(--space-md)',
                  background: isExpanded
                    ? `linear-gradient(90deg, ${sport.accentColor}11, transparent)`
                    : 'none',
                  border: 'none',
                  borderBottom: leagueIndex < sport.leagues.length - 1 || isExpanded
                    ? '1px solid var(--color-surface-borders)'
                    : 'none',
                  color: 'var(--color-text-primary)',
                  cursor: 'pointer',
                  transition: 'background-color var(--transition-fast)',
                  gap: 'var(--space-sm)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                  {isExpanded
                    ? <ChevronDown size={14} color={sport.accentColor} />
                    : <ChevronRight size={14} color="var(--color-text-secondary)" />
                  }
                  <span style={{
                    fontSize: '0.85rem',
                    fontWeight: isExpanded ? 700 : 600,
                    color: isExpanded ? sport.accentColor : 'var(--color-text-primary)',
                  }}>
                    {league.leagueName}
                  </span>
                </div>
                <span style={{
                  fontSize: '0.65rem',
                  color: 'var(--color-text-secondary)',
                  backgroundColor: 'var(--color-surface-hover)',
                  padding: '2px 6px',
                  borderRadius: 'var(--radius-sm)',
                }}>
                  {league.matches.length} partidos
                </span>
              </button>

              {/* Partidos de la Liga */}
              {isExpanded && (
                <div style={{
                  padding: 'var(--space-md)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 'var(--space-md)',
                  borderBottom: leagueIndex < sport.leagues.length - 1
                    ? '1px solid var(--color-surface-borders)'
                    : 'none',
                  maxHeight: '75vh',
                  overflowY: 'auto',
                  animation: 'slideDown 300ms ease-out',
                }}>
                  {league.matches.map((match) => (
                    <MatchCard
                      key={match.matchId}
                      home={match.home}
                      away={match.away}
                      matchDate={match.matchDate}
                      league={league.leagueName}
                      sport={sport.sportName}
                      predictions={match.predictions}
                      accentColor={sport.accentColor}
                      onAddToDashboard={onAddToDashboard}
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
