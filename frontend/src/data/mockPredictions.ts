/**
 * Mock Predictions Data Layer
 * Estructura pensada para ser reemplazada 1:1 por un API real.
 * Cada predicción incluye: multi-mercado, cuotas comparadas, y justificación estadística.
 */

export interface BookmakerOdds {
  bookmaker: string;
  odds: number;
}

export type MarketCategory =
  | 'ganador'
  | 'goles'
  | 'corners'
  | 'tarjetas'
  | 'goleador'
  | 'handicap'
  | 'parcial'
  | 'especial'
  | 'props';

export interface Prediction {
  id: string;
  home: string;
  away: string;
  league: string;
  sport: string;
  matchDate: string;
  market: string;
  /** Categoría semántica del mercado para iconografía en PredictionCard */
  market_category: MarketCategory;
  prediction: string;
  cc: number;
  bookmakerOdds: BookmakerOdds[];
  bestBookmaker: string;
  bestOdds: number;
  statisticalReason: string;
  isLive: boolean;
  /** Fracción Kelly para cálculo de stake sugerido (0.0 - 0.05) */
  kelly_fraction?: number;
}

export interface MatchData {
  matchId: string;
  home: string;
  away: string;
  matchDate: string;
  predictions: Prediction[];
}

export interface LeagueData {
  leagueName: string;
  matches: MatchData[];
}

export interface SportData {
  sportName: string;
  icon: string;
  accentColor: string;
  leagues: LeagueData[];
}

/* ─── Helpers de generación ─── */

const BOOKMAKERS = ['Bet365', 'Bwin', 'Betfair', 'Sportium'];

const generateOdds = (base: number): BookmakerOdds[] => {
  return BOOKMAKERS.map(bk => ({
    bookmaker: bk,
    odds: Math.round((base + (Math.random() * 0.4 - 0.2)) * 100) / 100
  }));
};

const pickBest = (odds: BookmakerOdds[]): { bookmaker: string; odds: number } => {
  const best = odds.reduce((a, b) => a.odds > b.odds ? a : b);
  return { bookmaker: best.bookmaker, odds: best.odds };
};

let idCounter = 0;
const nextId = () => `pred-${++idCounter}`;

/** Infiere la market_category a partir del nombre del mercado */
const inferMarketCategory = (market: string): MarketCategory => {
  const m = market.toLowerCase();
  if (m.includes('corner'))                         return 'corners';
  if (m.includes('tarjeta') || m.includes('card'))  return 'tarjetas';
  if (m.includes('goleador') || m.includes('marca') || m.includes('anota')) return 'goleador';
  if (m.includes('handicap') || m.includes('spread') || m.includes('hándicap')) return 'handicap';
  if (m.includes('parte') || m.includes('mitad') || m.includes('cuarto') || m.includes('ht') || m.includes('descanso')) return 'parcial';
  if (m.includes('gol') || m.includes('punto') || m.includes('over') || m.includes('under') || m.includes('total') || m.includes('marcan') || m.includes('btts')) return 'goles';
  if (m.includes('prop') || m.includes('yarda') || m.includes('asist') || m.includes('rebote')) return 'props';
  if (m.includes('especial') || m.includes('podio') || m.includes('pole') || m.includes('vuelta') || m.includes('safety') || m.includes('caída') || m.includes('constructor') || m.includes('abandon') || m.includes('top')) return 'especial';
  return 'ganador';
};

const createPrediction = (
  home: string, away: string, league: string, sport: string,
  matchDate: string, market: string, prediction: string,
  cc: number, baseOdds: number, reason: string, isLive = false
): Prediction => {
  const odds = generateOdds(baseOdds);
  const best = pickBest(odds);
  return {
    id: nextId(), home, away, league, sport, matchDate,
    market,
    market_category: inferMarketCategory(market),
    prediction, cc, bookmakerOdds: odds,
    bestBookmaker: best.bookmaker, bestOdds: best.odds,
    statisticalReason: reason, isLive
  };
};

/* ═══════════════════════════════════════════════════
   FÚTBOL
   ═══════════════════════════════════════════════════ */

const laLigaPredictions: Prediction[] = [
  createPrediction('Real Madrid', 'Barcelona', 'La Liga', 'Fútbol', '2026-04-18 21:00', 'Corners Total', 'Over 10.5', 88, 1.85, 'Media de 12.3 corners por clásico en las últimas 5 temporadas. Ambos equipos presionan alto y generan centros laterales (Real Madrid: 6.1 corners/partido, Barcelona: 5.8).'),
  createPrediction('Real Madrid', 'Barcelona', 'La Liga', 'Fútbol', '2026-04-18 21:00', 'Ambos Marcan', 'Sí', 84, 1.72, 'Ambos equipos han marcado en el 85% de los clásicos desde 2020. xG combinado de 3.4 por partido. Defensas expuestas en transiciones rápidas.'),
  createPrediction('Real Madrid', 'Barcelona', 'La Liga', 'Fútbol', '2026-04-18 21:00', 'Tarjetas Total', 'Over 4.5', 82, 1.90, 'Media de 5.7 tarjetas en clásicos recientes. Árbitro designado: Gil Manzano (media de 5.2 tarjetas/partido en 2025-26).'),
  createPrediction('Atlético Madrid', 'Sevilla', 'La Liga', 'Fútbol', '2026-04-19 18:30', 'Under Goles', 'Under 2.5', 79, 1.68, 'Atlético concede solo 0.7 goles/partido en casa. Sevilla marca solo 0.9 fuera. Historial H2H de los últimos 6 partidos: 4 de 6 con Under 2.5.'),
  createPrediction('Atlético Madrid', 'Sevilla', 'La Liga', 'Fútbol', '2026-04-19 18:30', 'Resultado 1ª Parte', 'Empate HT', 77, 2.10, 'En el 62% de los partidos del Atlético en casa, el resultado al descanso fue empate. Equipo que domina la 2ª parte (67% de goles tras min 55).'),
  createPrediction('Real Sociedad', 'Athletic Club', 'La Liga', 'Fútbol', '2026-04-19 16:15', 'Handicap Asiático', 'Athletic +0.5', 76, 1.55, 'Athletic no ha perdido ninguno de los últimos 7 derbis vascos. Media de 1.1 puntos/partido fuera (sólido). xGA de 0.9 fuera de casa.'),
  createPrediction('Villarreal', 'Real Betis', 'La Liga', 'Fútbol', '2026-04-20 14:00', 'Over Goles', 'Over 2.5', 81, 1.78, 'Ambos equipos en el top 5 de xG ofensivo. Media combinada de 3.4 goles en enfrentamientos directos. Villarreal marca 2.1 goles/partido en casa.'),
  createPrediction('Villarreal', 'Real Betis', 'La Liga', 'Fútbol', '2026-04-20 14:00', 'Goleador', 'Sorloth Marca', 75, 2.30, 'Sorloth acumula 0.58 xG/90min. Máximo goleador del Villarreal con 16 goles. Ha marcado en 5 de los últimos 7 partidos en casa.'),
  createPrediction('Celta de Vigo', 'Girona', 'La Liga', 'Fútbol', '2026-04-20 16:15', 'Corners Equipo', 'Girona Over 5.5', 73, 1.95, 'Girona genera 6.3 corners/partido de media en desplazamiento. Estilo de juego basado en desborde por bandas (3º en centros completados de La Liga).'),
  createPrediction('Osasuna', 'Mallorca', 'La Liga', 'Fútbol', '2026-04-20 18:30', 'Resultado', '1 (Local)', 74, 1.65, 'Osasuna ha ganado el 72% de sus partidos en El Sadar esta temporada. Mallorca, peor equipo visitante del top 14 con solo 3 victorias fuera.'),
  createPrediction('Valencia', 'Getafe', 'La Liga', 'Fútbol', '2026-04-20 21:00', 'Tarjetas Equipo', 'Getafe Over 2.5', 80, 1.88, 'Getafe es el equipo más amonestado de La Liga (media 3.1 tarjetas/partido). Estilo defensivo-agresivo con 14.2 faltas/partido.'),
  createPrediction('Espanyol', 'Las Palmas', 'La Liga', 'Fútbol', '2026-04-21 14:00', 'Doble Oportunidad', '1X', 78, 1.35, 'Espanyol invicto en 8 de los últimos 10 partidos en casa. Las Palmas solo ha ganado 2 partidos fuera de casa en toda la temporada.'),
];

const premierPredictions: Prediction[] = [
  createPrediction('Arsenal', 'Liverpool', 'Premier League', 'Fútbol', '2026-04-18 17:30', 'Ambos Marcan', 'Sí', 86, 1.65, 'Ambos equipos han marcado en el 80% de los H2H recientes. Arsenal xG en casa: 2.3/partido. Liverpool xG fuera: 1.9/partido. Alta intensidad ofensiva.'),
  createPrediction('Arsenal', 'Liverpool', 'Premier League', 'Fútbol', '2026-04-18 17:30', 'Corners Total', 'Over 11.5', 83, 1.92, 'Arsenal: 7.1 corners/partido en casa. Liverpool: 5.4 corners/partido fuera. Media combinada de 12.8 corners en los últimos 4 enfrentamientos.'),
  createPrediction('Arsenal', 'Liverpool', 'Premier League', 'Fútbol', '2026-04-18 17:30', 'Goleador', 'Saka Marca', 74, 2.50, 'Saka: 0.45 xG/90, 14 goles esta temporada. Ha marcado en 3 de los últimos 5 partidos en Emirates. Explotará el lateral izquierdo débil del Liverpool.'),
  createPrediction('Man City', 'Chelsea', 'Premier League', 'Fútbol', '2026-04-19 15:00', 'Handicap', 'Man City -1.5', 77, 2.10, 'City gana por 2+ goles en el 55% de sus partidos en casa. Chelsea concede 1.8 goles/partido fuera en los últimos 10. Haaland con 0.89 xG/90.'),
  createPrediction('Man City', 'Chelsea', 'Premier League', 'Fútbol', '2026-04-19 15:00', 'Over Goles', 'Over 3.5', 79, 1.85, 'Media de 4.2 goles en los últimos 6 City-Chelsea. Ambos equipos en el top 4 de xG de la Premier. Partidos abiertos con transiciones rápidas.'),
  createPrediction('Aston Villa', 'Newcastle', 'Premier League', 'Fútbol', '2026-04-19 15:00', 'Resultado', 'X (Empate)', 72, 3.20, '4 de los últimos 6 H2H acabaron en empate. Ambos equipos con rendimiento similar (Villa 1.8 pts/partido, Newcastle 1.7). Equilibrio táctico.'),
  createPrediction('Tottenham', 'Brighton', 'Premier League', 'Fútbol', '2026-04-19 17:30', 'Over Goles', 'Over 2.5', 80, 1.55, 'Tottenham en casa: 2.4 goles marcados de media. Brighton marca 1.3 goles/partido fuera. Solo 2 de los últimos 10 H2H tuvieron Under 2.5.'),
  createPrediction('Wolves', 'Bournemouth', 'Premier League', 'Fútbol', '2026-04-20 15:00', 'Under Goles', 'Under 2.5', 75, 1.70, 'Wolves en casa: media de 1.8 goles totales/partido. Partidos cerrados con posesión baja (42% Wolves). 7 de los últimos 10 partidos de Wolves con Under 2.5.'),
  createPrediction('Everton', 'West Ham', 'Premier League', 'Fútbol', '2026-04-20 15:00', 'Tarjetas Total', 'Over 3.5', 76, 1.75, 'Everton: 2.4 tarjetas/partido en casa. West Ham: 2.1 tarjetas/partido fuera. Partidos físicos en Goodison Park, árbitros estrictos en derbis metropolitanos.'),
  createPrediction('Crystal Palace', 'Fulham', 'Premier League', 'Fútbol', '2026-04-20 17:30', 'Doble Oportunidad', '1X', 73, 1.42, 'Crystal Palace invicto en casa en los últimos 6 partidos. Fulham con solo 2 victorias fuera en 2026. Selhurst Park: fortaleza defensiva.'),
  createPrediction('Man United', 'Nottingham F.', 'Premier League', 'Fútbol', '2026-04-21 16:00', 'Resultado 1ª Parte', 'Empate HT', 71, 2.05, 'United arranca lento: 58% de sus partidos con empate al descanso. Nottingham defensivo fuera (1.1 xGA primera parte). Goles tardíos del United.'),
  createPrediction('Brentford', 'Ipswich Town', 'Premier League', 'Fútbol', '2026-04-21 16:00', 'Resultado', '1 (Local)', 78, 1.60, 'Brentford: 75% de victorias en casa esta temporada. Ipswich: peor balance fuera de la Premier (2V-2E-11D). Superioridad clara en xG.'),
];

const ligue1Predictions: Prediction[] = [
  createPrediction('PSG', 'Marseille', 'Ligue 1', 'Fútbol', '2026-04-19 21:00', 'Resultado', '1 (Local)', 85, 1.45, 'PSG invicto en casa esta temporada. Domina el H2H con 14 victorias en los últimos 20 clásicos. xG en Parc des Princes: 2.8/partido.'),
  createPrediction('PSG', 'Marseille', 'Ligue 1', 'Fútbol', '2026-04-19 21:00', 'Tarjetas Total', 'Over 4.5', 81, 1.85, 'Le Classique genera media de 5.3 tarjetas. Rivalidad intensa con faltas tácticas (media 28 faltas combinadas). Árbitro Turpin: 5.8 tarjetas/partido.'),
  createPrediction('Lyon', 'Monaco', 'Ligue 1', 'Fútbol', '2026-04-20 17:00', 'Ambos Marcan', 'Sí', 79, 1.68, 'Ambos marcan en 76% de los enfrentamientos. Lyon: 2.0 xG en casa. Monaco: 1.7 xG fuera. Defensas vulnerables en transiciones.'),
  createPrediction('Lille', 'Lens', 'Ligue 1', 'Fútbol', '2026-04-20 15:00', 'Under Goles', 'Under 2.5', 77, 1.62, 'Derby du Nord: 5 de los últimos 7 con Under 2.5. Lille: mejor defensa de Ligue 1 (0.7 goles concedidos/partido en casa). Partidos cerrados.'),
  createPrediction('Nice', 'Rennes', 'Ligue 1', 'Fútbol', '2026-04-20 15:00', 'Corners Total', 'Over 9.5', 74, 1.90, 'Nice: 5.8 corners/partido en casa. Rennes ataca por bandas (4.2 corners forzados/partido fuera). Media combinada de 10.4 en los últimos 4 H2H.'),
  createPrediction('Strasbourg', 'Toulouse', 'Ligue 1', 'Fútbol', '2026-04-20 15:00', 'Resultado', '1 (Local)', 73, 1.72, 'Strasbourg: 68% de victorias en casa. Toulouse: solo 3 victorias fuera. Ventaja clara en duelos aéreos y juego directo (71% pases largos exitosos).'),
  createPrediction('Nantes', 'Montpellier', 'Ligue 1', 'Fútbol', '2026-04-21 15:00', 'Over Goles', 'Over 2.5', 72, 1.78, 'Montpellier concede 2.1 goles/partido fuera. Nantes marca 1.6 en casa. Ambas defensas débiles: combinación para partido abierto.'),
  createPrediction('Reims', 'Brest', 'Ligue 1', 'Fútbol', '2026-04-21 15:00', 'Handicap', 'Brest +0.5', 75, 1.50, 'Brest invicto en 5 de los últimos 7 fuera de casa. Temporada histórica europea les da confianza. xGA fuera: 1.0 (sólida defensa visitante).'),
  createPrediction('Saint-Étienne', 'Le Havre', 'Ligue 1', 'Fútbol', '2026-04-21 17:00', 'Doble Oportunidad', '1X', 76, 1.30, 'Saint-Étienne en buena racha (4V-2E últimos 6 en casa). Le Havre peor equipo visitante (1V-1E-12D). Apoyo del público en Geoffroy-Guichard.'),
  createPrediction('Angers', 'Auxerre', 'Ligue 1', 'Fútbol', '2026-04-21 15:00', 'Tarjetas Equipo', 'Angers Over 2.5', 71, 1.95, 'Angers: equipo más amonestado de la zona baja (2.9 tarjetas/partido). Estilo físico-táctico con 15.4 faltas/partido. Lucha por evitar descenso = intensidad máxima.'),
  createPrediction('Bordeaux', 'Lorient', 'Ligue 1', 'Fútbol', '2026-04-21 15:00', 'Resultado 1ª Parte', '1 (Local HT)', 70, 2.20, 'Bordeaux marca el 45% de sus goles en casa antes del descanso. Lorient concede primero en el 62% de sus partidos fuera. Inicio agresivo local.'),
  createPrediction('Monaco', 'Nice', 'Ligue 1', 'Fútbol', '2026-04-22 21:00', 'Goleador', 'Embolo Marca', 72, 2.40, 'Embolo: 0.51 xG/90, 11 goles esta temporada. Ha marcado en 4 de los últimos 6 en Stade Louis II. Nice concede 1.4 goles/partido fuera.'),
];

const bundesligaPredictions: Prediction[] = [
  createPrediction('Bayern Munich', 'Dortmund', 'Bundesliga', 'Fútbol', '2026-04-18 18:30', 'Over Goles', 'Over 3.5', 87, 1.75, 'Der Klassiker: media de 4.1 goles en los últimos 10 encuentros. Bayern: 3.1 xG en casa. Dortmund: 1.8 xG fuera. Partido siempre abierto y espectacular.'),
  createPrediction('Bayern Munich', 'Dortmund', 'Bundesliga', 'Fútbol', '2026-04-18 18:30', 'Goleador', 'Kane Marca', 83, 1.55, 'Kane: 0.92 xG/90, pichichi de la Bundesliga con 28 goles. Ha marcado en los últimos 8 partidos en Allianz Arena. Contra Dortmund: 5 goles en 4 partidos.'),
  createPrediction('Bayern Munich', 'Dortmund', 'Bundesliga', 'Fútbol', '2026-04-18 18:30', 'Corners Total', 'Over 10.5', 79, 1.88, 'Bayern: 6.8 corners/partido en casa (líder Bundesliga). Dortmund: 5.1 fuera. Media combinada en H2H: 12.1 corners. Juego ofensivo de ambos = muchos centros.'),
  createPrediction('RB Leipzig', 'Leverkusen', 'Bundesliga', 'Fútbol', '2026-04-19 15:30', 'Ambos Marcan', 'Sí', 80, 1.60, 'Ambos marcan en 82% de los H2H recientes. Leverkusen: mejor ataque visitante (2.2 xG/partido fuera). Leipzig: 1.9 xG en casa. Defensas con huecos.'),
  createPrediction('Stuttgart', 'Wolfsburg', 'Bundesliga', 'Fútbol', '2026-04-19 15:30', 'Resultado', '1 (Local)', 76, 1.58, 'Stuttgart: 78% de victorias en casa. Wolfsburg pierde el 60% de sus partidos fuera de casa. Diferencial xG a favor de Stuttgart: +1.2 en casa.'),
  createPrediction('E. Frankfurt', 'Friburgo', 'Bundesliga', 'Fútbol', '2026-04-19 15:30', 'Under Goles', 'Under 2.5', 74, 1.72, 'Friburgo: equipo más defensivo visitante (0.8 goles concedidos fuera). Frankfurt marca 1.4 en casa. 6 de los últimos 9 H2H con Under 2.5.'),
  createPrediction('Mainz', 'Augsburg', 'Bundesliga', 'Fútbol', '2026-04-20 15:30', 'Tarjetas Total', 'Over 3.5', 73, 1.80, 'Augsburg: 2.6 tarjetas/partido (3º más amonestado). Mainz: físico intenso en Mewa Arena. Árbitro Dingert: media de 4.8 tarjetas/partido.'),
  createPrediction('Hoffenheim', 'Union Berlin', 'Bundesliga', 'Fútbol', '2026-04-20 15:30', 'Doble Oportunidad', 'X2', 72, 1.45, 'Union Berlin invicto en 6 de los últimos 8 fuera. Hoffenheim en crisis: peor racha de la temporada (1V en últimos 7). Moral y xGA favorecen al visitante.'),
  createPrediction('Werder Bremen', 'Heidenheim', 'Bundesliga', 'Fútbol', '2026-04-20 17:30', 'Over Goles', 'Over 2.5', 75, 1.65, 'Bremen en casa: 2.3 goles/partido. Heidenheim concede 1.7 fuera. Los últimos 3 H2H promediaron 3.7 goles. Partido abierto entre equipos ofensivos.'),
  createPrediction('Bochum', 'Darmstadt', 'Bundesliga', 'Fútbol', '2026-04-20 15:30', 'Resultado 1ª Parte', 'Empate HT', 71, 2.00, 'Partidos de zona baja arrancan cerrados. Bochum: empate al descanso en 55% de sus partidos en casa. Darmstadt: ultra defensivo (5-4-1 fuera).'),
  createPrediction('Mönchengladbach', 'Köln', 'Bundesliga', 'Fútbol', '2026-04-21 15:30', 'Corners Equipo', 'Gladbach Over 5.5', 74, 1.92, 'Gladbach: 6.2 corners/partido en casa. Juego de bandas agresivo con Plea y Hack (2º y 3º en centros de la plantilla). Köln defiende retrasado.'),
  createPrediction('Schalke 04', 'Hertha Berlin', 'Bundesliga', 'Fútbol', '2026-04-21 17:30', 'Resultado', '1 (Local)', 73, 1.70, 'Schalke: apoyo masivo de Gelsenkirchen (factor fan). 71% de victorias en casa. Hertha: solo 2 victorias fuera. Presión local en partido de necesidad.'),
];

const primeiraPredictions: Prediction[] = [
  createPrediction('Benfica', 'Porto', 'Primeira Liga', 'Fútbol', '2026-04-19 20:30', 'Over Goles', 'Over 2.5', 82, 1.72, 'O Clássico: media de 3.3 goles en los últimos 8 encuentros. Benfica: 2.5 xG en casa. Porto: 1.6 xG fuera. Rivalidad que exige ataque total.'),
  createPrediction('Benfica', 'Porto', 'Primeira Liga', 'Fútbol', '2026-04-19 20:30', 'Tarjetas Total', 'Over 4.5', 79, 1.82, 'Media de 5.1 tarjetas en clássicos. Intensidad máxima. Árbitro Artur Soares Dias: 5.4 tarjetas/partido. Faltas tácticas constantes.'),
  createPrediction('Sporting CP', 'Braga', 'Primeira Liga', 'Fútbol', '2026-04-20 18:00', 'Resultado', '1 (Local)', 80, 1.50, 'Sporting: 82% victorias en Alvalade. Braga: 38% de victorias fuera. Gyökeres con 0.78 xG/90 lidera el ataque más peligroso de Portugal.'),
  createPrediction('Sporting CP', 'Braga', 'Primeira Liga', 'Fútbol', '2026-04-20 18:00', 'Goleador', 'Gyökeres Marca', 78, 1.65, 'Gyökeres: 26 goles en 29 partidos. 0.78 xG/90. Ha marcado en los últimos 6 partidos en casa consecutivos. Braga concede 1.5 goles/partido fuera.'),
  createPrediction('Vitória SC', 'Famalicão', 'Primeira Liga', 'Fútbol', '2026-04-20 15:30', 'Ambos Marcan', 'Sí', 74, 1.75, 'Ambos marcan en 71% de los partidos de Vitória en casa. Famalicão marca fuera en el 68% de los partidos. Defensas permeables.'),
  createPrediction('Casa Pia', 'Moreirense', 'Primeira Liga', 'Fútbol', '2026-04-20 15:30', 'Under Goles', 'Under 2.5', 73, 1.60, 'Ambos equipos en zona de confort (mitad de tabla). Media de 1.8 goles en H2H. Partidos conservadores entre equipos que no necesitan arriesgar.'),
  createPrediction('Rio Ave', 'Gil Vicente', 'Primeira Liga', 'Fútbol', '2026-04-21 15:30', 'Doble Oportunidad', '1X', 75, 1.38, 'Rio Ave invicto en casa en últimos 8 partidos. Gil Vicente: 1 sola victoria fuera esta temporada. Factor Estádio dos Arcos decisivo.'),
  createPrediction('Boavista', 'Estoril', 'Primeira Liga', 'Fútbol', '2026-04-21 15:30', 'Corners Total', 'Over 9.5', 72, 1.95, 'Boavista: 5.4 corners/partido en casa. Estoril: 4.8 corners forzados fuera (juego directo). Campo estrecho del Bessa favorece centros y corners.'),
  createPrediction('Arouca', 'Estrela Amadora', 'Primeira Liga', 'Fútbol', '2026-04-21 15:30', 'Tarjetas Equipo', 'Arouca Over 2.5', 71, 1.88, 'Arouca: 2.7 tarjetas/partido (equipo frustrado en zona baja). Lucha por la permanencia = intensidad máxima. Manager cambiado recientemente.'),
  createPrediction('Nacional', 'Portimonense', 'Primeira Liga', 'Fútbol', '2026-04-21 18:00', 'Resultado', '1 (Local)', 74, 1.62, 'Nacional: 70% de victorias en Choupana. Portimonense: peor equipo visitante de la liga (0V-3E-10D). Apoyo masivo del público local.'),
  createPrediction('Vizela', 'Chaves', 'Primeira Liga', 'Fútbol', '2026-04-21 15:30', 'Handicap', 'Vizela -0.5', 70, 1.75, 'Vizela en racha (3V-1E últimos 4 en casa). Chaves colista con moral baja. xG diferencial +0.8 a favor de Vizela en partidos locales.'),
  createPrediction('Farense', 'Santa Clara', 'Primeira Liga', 'Fútbol', '2026-04-22 18:00', 'Resultado 1ª Parte', 'Empate HT', 72, 2.05, 'Farense arranca defensivo en casa (62% empates al descanso). Santa Clara: equipo cauteloso fuera. Primer gol suele llegar tras el minuto 55.'),
];

const championsLeaguePredictions: Prediction[] = [
  createPrediction('Real Madrid', 'Man City', 'Champions League', 'Fútbol', '2026-04-22 21:00', 'Ambos Marcan', 'Sí', 88, 1.62, 'Ambos han marcado en el 90% de los H2H en UCL. Real Madrid: 2.6 xG en casa en Champions. Man City: 2.1 xG fuera en eliminatorias. Partidos siempre abiertos y espectaculares.'),
  createPrediction('Real Madrid', 'Man City', 'Champions League', 'Fútbol', '2026-04-22 21:00', 'Over Goles', 'Over 2.5', 85, 1.70, 'Media de 3.8 goles en los últimos 6 enfrentamientos UCL. xG combinado de 4.1/partido. Presión alta de ambos equipos genera ocasiones en transiciones rápidas.'),
  createPrediction('Real Madrid', 'Man City', 'Champions League', 'Fútbol', '2026-04-22 21:00', 'Corners Total', 'Over 11.5', 81, 1.88, 'Media de 12.6 corners en H2H de Champions. Real Madrid: 6.4 corners/partido en Bernabéu. City genera 5.8 corners/partido fuera en UCL. Juego de ataque por bandas.'),
  createPrediction('Bayern Munich', 'Arsenal', 'Champions League', 'Fútbol', '2026-04-22 21:00', 'Resultado', '1 (Local)', 79, 1.75, 'Bayern invicto en Allianz Arena en las últimas 14 eliminatorias UCL. Arsenal: 3-7 en partidos fuera en eliminatorias. Factor campo + experiencia alemana.'),
  createPrediction('Bayern Munich', 'Arsenal', 'Champions League', 'Fútbol', '2026-04-22 21:00', 'Tarjetas Total', 'Over 4.5', 77, 1.82, 'Eliminatorias UCL: media de 5.2 tarjetas/partido. Intensidad máxima entre equipos de nivel top. Árbitros europeos estrictos con faltas tácticas.'),
  createPrediction('PSG', 'Barcelona', 'Champions League', 'Fútbol', '2026-04-23 21:00', 'Over Goles', 'Over 3.5', 80, 1.92, 'PSG-Barça en UCL: media de 4.4 goles por partido histórico. Mbappé vs Lamine Yamal. Ambas defensas vulnerables en transiciones. Partidos épicos garantizados.'),
  createPrediction('PSG', 'Barcelona', 'Champions League', 'Fútbol', '2026-04-23 21:00', 'Goleador', 'Mbappé Marca', 82, 1.58, 'Mbappé: 0.74 xG/90 en UCL (élite). 47 goles en Champions League. Ha marcado en 8 de los últimos 10 partidos de eliminatorias. Parc des Princes potencia su rendimiento.'),
  createPrediction('Inter Milan', 'Atlético Madrid', 'Champions League', 'Fútbol', '2026-04-23 21:00', 'Under Goles', 'Under 2.5', 78, 1.65, 'Inter: mejor defensa de la Serie A (0.6 goles concedidos/partido en casa). Atlético: 0.8 goles concedidos fuera. Ambos equipos priorizan solidez defensiva en eliminatorias.'),
  createPrediction('Inter Milan', 'Atlético Madrid', 'Champions League', 'Fútbol', '2026-04-23 21:00', 'Resultado 1ª Parte', 'Empate HT', 76, 1.95, 'En eliminatorias UCL ambos equipos arrancan cautelosos. Inter: empate al descanso en 65% de sus eliminatorias. Atlético: maestros del 0-0 al descanso (70%).'),
  createPrediction('Dortmund', 'Liverpool', 'Champions League', 'Fútbol', '2026-04-23 21:00', 'Ambos Marcan', 'Sí', 83, 1.68, 'Dortmund-Liverpool en UCL: historial de partidos épicos. Signal Iduna Park genera +15% en xG del local. Liverpool marca fuera en el 85% de partidos UCL. Atacantes letales.'),
  createPrediction('Dortmund', 'Liverpool', 'Champions League', 'Fútbol', '2026-04-23 21:00', 'Handicap', 'Liverpool +0.5', 75, 1.52, 'Liverpool invicto en 7 de los últimos 9 partidos fuera en UCL. Dortmund: fuerte en casa pero concede contraataques. Slot ha mejorado la solidez visitante del Liverpool.'),
  createPrediction('Juventus', 'Leverkusen', 'Champions League', 'Fútbol', '2026-04-22 21:00', 'Doble Oportunidad', 'X2', 74, 1.48, 'Leverkusen invicto en 52 partidos (récord europeo). Juventus en Turin Stadium: defensiva pero sin gol. Xhaka y Wirtz controlan el medio. Leverkusen no pierde.'),
];

const europaLeaguePredictions: Prediction[] = [
  createPrediction('Atalanta', 'Athletic Club', 'Europa League', 'Fútbol', '2026-04-24 21:00', 'Over Goles', 'Over 2.5', 79, 1.75, 'Atalanta: 2.4 goles/partido en casa en UEL. Athletic: equipo ofensivo fuera (1.3 goles/partido). Últimos partidos europeos de ambos: 3.2 goles de media.'),
  createPrediction('Atalanta', 'Athletic Club', 'Europa League', 'Fútbol', '2026-04-24 21:00', 'Ambos Marcan', 'Sí', 77, 1.68, 'Athletic marca fuera en el 72% de partidos europeos. Atalanta concede en casa en el 65% de partidos UEL. Ambos con filosofía ofensiva que deja huecos atrás.'),
  createPrediction('Roma', 'Tottenham', 'Europa League', 'Fútbol', '2026-04-24 21:00', 'Resultado', '1 (Local)', 76, 1.82, 'Roma: 78% victorias en Olimpico en UEL. Tottenham: balance negativo fuera en Europa (4V-3E-5D). Presión del público romano es factor diferencial.'),
  createPrediction('Roma', 'Tottenham', 'Europa League', 'Fútbol', '2026-04-24 21:00', 'Tarjetas Total', 'Over 4.5', 80, 1.72, 'Italia vs Inglaterra: partidos intensos con media de 5.4 tarjetas. Roma: 2.3 tarjetas/partido en UEL. Tottenham: físico y directo. Árbitros estrictos en fases avanzadas.'),
  createPrediction('Real Sociedad', 'Lyon', 'Europa League', 'Fútbol', '2026-04-24 18:45', 'Handicap', 'Real Sociedad -0.5', 74, 1.65, 'Real Sociedad: invicta en Anoeta en UEL esta temporada (5V-1E). Lyon: irregular fuera de casa en Europa (3V-1E-3D). Factor Anoeta + público vasco.'),
  createPrediction('Real Sociedad', 'Lyon', 'Europa League', 'Fútbol', '2026-04-24 18:45', 'Under Goles', 'Under 2.5', 73, 1.58, 'Real Sociedad: equipo defensivo en casa en Europa (0.6 goles concedidos/partido). Lyon: cauteloso fuera. Partidos tácticos con pocos goles.'),
  createPrediction('Villarreal', 'Rangers', 'Europa League', 'Fútbol', '2026-04-24 18:45', 'Resultado', '1 (Local)', 81, 1.45, 'Villarreal: palmarés brillante en UEL (campeones 2021). 85% victorias en casa en Europa. Rangers: 2-6 fuera de las islas. Superioridad técnica clara.'),
  createPrediction('Villarreal', 'Rangers', 'Europa League', 'Fútbol', '2026-04-24 18:45', 'Corners Total', 'Over 10.5', 75, 1.90, 'Villarreal: 6.1 corners/partido en casa. Rangers defienden retrasados: conceden centros y corners. Media de 11.3 corners en H2H europeos recientes.'),
  createPrediction('Lazio', 'West Ham', 'Europa League', 'Fútbol', '2026-04-25 21:00', 'Over Goles', 'Over 2.5', 76, 1.78, 'Lazio: 2.1 goles/partido en Olimpico UEL. West Ham: marca 1.2 fuera en Europa pero concede 1.5. Partidos abiertos con espacio en transiciones.'),
  createPrediction('Fenerbahçe', 'Betis', 'Europa League', 'Fútbol', '2026-04-25 18:45', 'Ambos Marcan', 'Sí', 74, 1.72, 'Fenerbahçe: ambiente hostil en Şükrü Saracoğlu pero concede goles (1.2/partido). Betis marca fuera en el 68% de partidos europeos. Ambos ofensivos.'),
  createPrediction('Sevilla', 'Galatasaray', 'Europa League', 'Fútbol', '2026-04-25 21:00', 'Resultado', '1 (Local)', 78, 1.58, 'Sevilla: 6 veces campeón de UEL. Sánchez-Pizjuán es fortaleza europea (82% victorias). Galatasaray: fuerte en casa pero irregular fuera. ADN de Sevilla en esta competición.'),
  createPrediction('Olympique Marseille', 'Freiburg', 'Europa League', 'Fútbol', '2026-04-25 18:45', 'Doble Oportunidad', '1X', 77, 1.35, 'Marseille: invicto en Vélodrome en UEL (6V-2E). Freiburg: primera experiencia en eliminatorias europeas. Público del Vélodrome como 12º jugador. Inexperiencia visitante.'),
];

const conferencePredictions: Prediction[] = [
  createPrediction('Fiorentina', 'Club Brugge', 'Conference League', 'Fútbol', '2026-04-24 18:45', 'Resultado', '1 (Local)', 79, 1.55, 'Fiorentina: finalista de las 2 últimas Conference League. 80% victorias en Artemio Franchi en UECL. Brugge: irregular fuera de Bélgica (3V-2E-4D).'),
  createPrediction('Fiorentina', 'Club Brugge', 'Conference League', 'Fútbol', '2026-04-24 18:45', 'Under Goles', 'Under 2.5', 75, 1.62, 'Fiorentina domina posesión en casa (62%) y no necesita goles. Brugge: defensivo fuera. Media de 1.8 goles en partidos de UECL de Fiorentina en casa.'),
  createPrediction('Real Betis', 'PAOK', 'Conference League', 'Fútbol', '2026-04-24 18:45', 'Resultado', '1 (Local)', 77, 1.58, 'Betis: 75% victorias en Benito Villamarín en Europa. PAOK: solo 2 victorias fuera de Grecia esta temporada. Superioridad técnica clara del equipo español.'),
  createPrediction('Real Betis', 'PAOK', 'Conference League', 'Fútbol', '2026-04-24 18:45', 'Over Goles', 'Over 2.5', 74, 1.80, 'Betis en casa en UECL: 2.3 goles/partido. PAOK concede 1.4 fuera. Partidos de ida en eliminatorias tienden a ser más abiertos. Isco y Lo Celso generan mucho.'),
  createPrediction('Olimpia Ljubljana', 'Aston Villa', 'Conference League', 'Fútbol', '2026-04-24 21:00', 'Resultado', '2 (Visitante)', 80, 1.65, 'Aston Villa: presupuesto 10x superior. Registro fuera en UECL: 5V-1E. Ljubljana: pierde el 70% contra equipos top-5 ligas. Diferencia de calidad abismal.'),
  createPrediction('Olimpia Ljubljana', 'Aston Villa', 'Conference League', 'Fútbol', '2026-04-24 21:00', 'Handicap', 'Aston Villa -1.5', 73, 1.95, 'Aston Villa gana por 2+ goles en el 60% de sus victorias fuera en UECL. Ljubljana: derrota media de -2.1 contra equipos de top ligas. Ollie Watkins en forma.'),
  createPrediction('Rapid Wien', 'Fenerbahçe', 'Conference League', 'Fútbol', '2026-04-25 18:45', 'Ambos Marcan', 'Sí', 76, 1.72, 'Ambos marcan en el 73% de los partidos europeos de Rapid Wien en casa. Fenerbahçe marca fuera en el 80% de partidos UECL. Defensas permeables a nivel europeo.'),
  createPrediction('Molde', 'Legia Varsovia', 'Conference League', 'Fútbol', '2026-04-25 18:45', 'Under Goles', 'Under 2.5', 72, 1.60, 'Fútbol nórdico + fútbol polaco = partidos cerrados. Media de 1.9 goles en H2H europeos de equipos escandinavos vs polacos. Clima frío limita juego abierto.'),
  createPrediction('Copenhagen', 'Basel', 'Conference League', 'Fútbol', '2026-04-25 21:00', 'Doble Oportunidad', '1X', 78, 1.38, 'Copenhagen: invicto en Parken Stadium en 11 partidos europeos. Basel: solo 1 victoria fuera de Suiza en UECL. Factor campo nórdico decisivo.'),
  createPrediction('Copenhagen', 'Basel', 'Conference League', 'Fútbol', '2026-04-25 21:00', 'Corners Total', 'Over 9.5', 73, 1.88, 'Copenhagen: 5.6 corners/partido en casa. Basel defiende retrasado fuera (concede 4.8 corners). Media combinada de 10.2 en partidos UECL recientes.'),
  createPrediction('Djurgården', 'Gent', 'Conference League', 'Fútbol', '2026-04-25 18:45', 'Resultado 1ª Parte', 'Empate HT', 74, 2.00, 'Eliminatorias UECL arrancan cautelosas. Djurgården: empate al descanso en 58% de partidos europeos. Gent: equipo táctico que estudia al rival y ataca en 2ª parte.'),
  createPrediction('Heidenheim', 'Partizan', 'Conference League', 'Fútbol', '2026-04-25 21:00', 'Resultado', '1 (Local)', 75, 1.60, 'Heidenheim: revelación alemana. 72% victorias en casa en competición europea. Partizan: inconsistente fuera de Serbia (2V-3E-4D). Disciplina táctica alemana.'),
];

/* ═══════════════════════════════════════════════════
   BALONCESTO
   ═══════════════════════════════════════════════════ */

const acbPredictions: Prediction[] = [
  createPrediction('Real Madrid', 'Barcelona', 'ACB', 'Baloncesto', '2026-04-18 20:45', 'Handicap', 'Barcelona +3.5', 82, 1.88, 'Últimos 6 clásicos ACB decididos por ≤5 puntos. Barcelona viaja bien (12-3 fuera). Diferencial de puntos en H2H: +1.8 a favor de local, dentro del margen.'),
  createPrediction('Real Madrid', 'Barcelona', 'ACB', 'Baloncesto', '2026-04-18 20:45', 'Puntos Totales', 'Over 168.5', 79, 1.72, 'Media de 174 puntos combinados en los últimos 5 clásicos. Ambos top 3 en ataque ACB. Ritmo de juego alto (posesiones/partido: RM 78, Barça 76).'),
  createPrediction('Valencia Basket', 'Unicaja', 'ACB', 'Baloncesto', '2026-04-19 18:30', 'Resultado', '1 (Local)', 78, 1.55, 'Valencia: 80% victorias en La Fonteta. Unicaja: balance negativo fuera (6-9). Valencia defiende mejor en casa (95.2 puntos concedidos vs 101.3 de Unicaja fuera).'),
  createPrediction('Baskonia', 'Joventut', 'ACB', 'Baloncesto', '2026-04-19 18:30', 'Handicap', 'Baskonia -5.5', 75, 1.85, 'Baskonia: +8.4 diferencial medio en partidos ganados en casa. Joventut: -6.2 diferencial fuera. Buesa Arena: 78% victorias locales.'),
  createPrediction('UCAM Murcia', 'Zaragoza', 'ACB', 'Baloncesto', '2026-04-20 12:30', 'Puntos Totales', 'Under 160.5', 74, 1.68, 'UCAM juega lento en casa (70.1 posesiones/partido). Zaragoza: equipo más defensivo visitante (permitiendo 88.3 pts/partido fuera). Ritmo bajo.'),
  createPrediction('Gran Canaria', 'MoraBanc Andorra', 'ACB', 'Baloncesto', '2026-04-20 18:00', 'Resultado', '1 (Local)', 77, 1.50, 'Gran Canaria: invicto en casa en últimas 7 jornadas. Andorra: 4-11 fuera. Factor Gran Canaria Arena y viaje desfavorable para Andorra.'),
  createPrediction('Bilbao Basket', 'Tenerife', 'ACB', 'Baloncesto', '2026-04-20 18:00', 'Puntos Totales', 'Over 162.5', 73, 1.75, 'Ambos equipos promedian 83+ puntos en casa/fuera respectivamente. Últimos 3 H2H: media de 168 puntos combinados. Defensa permeable de Bilbao.'),
  createPrediction('Manresa', 'Breogán', 'ACB', 'Baloncesto', '2026-04-20 18:00', 'Handicap', 'Manresa -3.5', 72, 1.82, 'Manresa: 75% victorias en Nou Congost. Breogán: 3 victorias fuera en toda la temporada. Factor cancha + racha local de 4 victorias seguidas.'),
  createPrediction('Obradoiro', 'Betis Baloncesto', 'ACB', 'Baloncesto', '2026-04-21 12:30', 'Resultado', 'X2 (Betis/Empate)', 70, 1.65, 'Betis 7-5 fuera de casa. Obradoiro: equipo débil en casa (5-8). xG defensivo favorece a Betis. Rivero con 18.3 pts/partido lidera el ataque visitante.'),
  createPrediction('Casademont Zaragoza', 'Fuenlabrada', 'ACB', 'Baloncesto', '2026-04-21 18:00', 'Resultado', '1 (Local)', 76, 1.45, 'Zaragoza: 72% en casa. Fuenlabrada: peor equipo visitante (2V-13D). Diferencial de +9.5 a favor del Príncipe Felipe. Victoria clara esperada.'),
  createPrediction('Girona Basket', 'Estudiantes', 'ACB', 'Baloncesto', '2026-04-21 18:00', 'Puntos Totales', 'Over 158.5', 71, 1.70, 'Girona: 86.3 pts/partido en casa. Estudiantes concede 84.5 fuera. Estilo run-and-gun de Girona genera posesiones rápidas (77.8 posesiones/partido).'),
  createPrediction('Tofas Bursa', 'Aliaga', 'ACB', 'Baloncesto', '2026-04-22 18:00', 'Handicap', 'Over 165.5', 73, 1.78, 'Ritmo de liga turca alto en la recta final. Ambos equipos en zona de playoffs: partidos abiertos necesitados de victorias para clasificación.'),
];

const nbaPredictions: Prediction[] = [
  createPrediction('Boston Celtics', 'Milwaukee Bucks', 'NBA', 'Baloncesto', '2026-04-18 01:30', 'Handicap', 'Celtics -4.5', 84, 1.90, 'Celtics: mejor record en casa de la NBA (35-6). Bucks: 18-23 fuera. Celtics con +8.2 net rating en TD Garden. Tatum: 28.3 pts/partido en casa.'),
  createPrediction('Boston Celtics', 'Milwaukee Bucks', 'NBA', 'Baloncesto', '2026-04-18 01:30', 'Puntos Totales', 'Over 228.5', 80, 1.75, 'Celtics: 119.3 pts/partido en casa. Bucks: 115.8 fuera. Ritmo de juego alto. Últimos 4 H2H: media de 234 puntos combinados.'),
  createPrediction('LA Lakers', 'Denver Nuggets', 'NBA', 'Baloncesto', '2026-04-19 03:30', 'Resultado', '2 (Visitante)', 78, 1.85, 'Nuggets: 24-17 fuera. Jokic domina a Davis en H2H (triple-doble en 3 de los últimos 5). Denver: +3.8 net rating vs Lakers en los últimos 2 años.'),
  createPrediction('Golden State', 'Phoenix Suns', 'NBA', 'Baloncesto', '2026-04-19 03:30', 'Puntos Totales', 'Over 232.5', 77, 1.70, 'Warriors en casa: 121.5 pts/partido. Suns: 118.2 fuera de casa. Estrella vs estrella (Curry vs Booker). Últimos 5 H2H: media de 238 puntos.'),
  createPrediction('Philadelphia 76ers', 'Miami Heat', 'NBA', 'Baloncesto', '2026-04-19 01:00', 'Handicap', '76ers -2.5', 75, 1.82, 'Embiid en casa: 33.1 pts, 12.4 reb/partido. Miami: 14-27 fuera. 76ers: 72% victorias en Wells Fargo Center. Butler ausente por lesión.'),
  createPrediction('Dallas Mavericks', 'Thunder', 'NBA', 'Baloncesto', '2026-04-20 01:00', 'Resultado', '2 (Visitante)', 79, 1.92, 'Thunder: mejor record fuera de la NBA (28-13). SGA: 31.2 pts/partido, MVP candidato. Dallas: inconsistente en casa sin Doncic al 100%.'),
  createPrediction('Cleveland', 'New York Knicks', 'NBA', 'Baloncesto', '2026-04-20 01:00', 'Under Puntos', 'Under 210.5', 76, 1.72, 'Cleveland: mejor defensa de la NBA (105.2 pts concedidos/partido). Knicks defensivos fuera (106.8). Ritmo lento en playoffs: 96.2 posesiones/48min.'),
  createPrediction('Sacramento', 'Minnesota', 'NBA', 'Baloncesto', '2026-04-20 22:00', 'Over Puntos', 'Over 226.5', 74, 1.78, 'Sacramento en casa: 120.8 pts/partido (3º NBA). Minnesota concede 114.5 fuera. DeAaron Fox + Sabonis: 52.1 pts combinados en Golden 1 Center.'),
  createPrediction('Indiana Pacers', 'Toronto Raptors', 'NBA', 'Baloncesto', '2026-04-21 01:00', 'Resultado', '1 (Local)', 80, 1.42, 'Pacers: 82% victorias vs sub-.500 teams en casa. Toronto: 11-30 fuera. Haliburton: 22.4 pts + 10.8 ast en casa esta temporada.'),
  createPrediction('Brooklyn Nets', 'Chicago Bulls', 'NBA', 'Baloncesto', '2026-04-21 01:00', 'Puntos Totales', 'Over 218.5', 72, 1.68, 'Ambos equipos en zona de tanking: defensas relajadas. Media combinada de 222.4 en H2H esta temporada. Ritmo rápido sin presión.'),
  createPrediction('Clippers', 'Houston', 'NBA', 'Baloncesto', '2026-04-21 22:00', 'Handicap', 'Houston +4.5', 73, 1.80, 'Houston: jóvenes talentosos compitiendo en cada partido. Clippers sin Kawhi: rendimiento irregular. Houston cubre spread en 65% de partidos fuera.'),
  createPrediction('Portland', 'Utah Jazz', 'NBA', 'Baloncesto', '2026-04-22 03:00', 'Resultado', '1 (Local)', 71, 1.58, 'Portland: mejor en casa que fuera (+4.2 diferencial). Jazz: peor equipo visitante del Oeste (10-31). Scoot Henderson con 19.8 pts en Moda Center.'),
];

/* ═══════════════════════════════════════════════════
   FÓRMULA 1
   ═══════════════════════════════════════════════════ */

const f1Predictions: Prediction[] = [
  createPrediction('Verstappen', 'Campo', 'F1 - GP Mónaco', 'Fórmula 1', '2026-04-20 15:00', 'Ganador Carrera', 'Verstappen', 82, 2.10, 'Verstappen: 3 victorias en Mónaco. Domina clasificación en calles estrechas (pole en 72% de circuits urbanos). Red Bull: mejor carga aerodinámica baja.'),
  createPrediction('Norris', 'Verstappen', 'F1 - GP Mónaco', 'Fórmula 1', '2026-04-20 15:00', 'Head-to-Head', 'Norris > Verstappen', 71, 2.80, 'McLaren con mejor rendimiento en circuitos lentos esta temporada. Norris: 2º en campeonato, 0.04s más rápido que Verstappen en media de FP1/FP2 urbanos.'),
  createPrediction('Leclerc', 'Campo', 'F1 - GP Mónaco', 'Fórmula 1', '2026-04-20 15:00', 'Podio', 'Leclerc Sí', 85, 1.55, 'Leclerc: piloto local en Mónaco. Ferrari competitivo en calles (2º en carga aerodinámica). Ha estado en podio en 4 de los últimos 5 GPs de Mónaco.'),
  createPrediction('Sainz', 'Alonso', 'F1 - GP Mónaco', 'Fórmula 1', '2026-04-20 15:00', 'Head-to-Head', 'Sainz > Alonso', 76, 1.72, 'Sainz: coche superior (Williams-Mercedes 2026 vs Aston Martin). Media de clasificación: Sainz P4.2 vs Alonso P6.8. Más consistente en este tipo de circuito.'),
  createPrediction('Safety Car', 'Campo', 'F1 - GP Mónaco', 'Fórmula 1', '2026-04-20 15:00', 'Safety Car', 'Sí', 88, 1.35, 'Mónaco ha tenido Safety Car en el 85% de las carreras desde 2015. Calles estrechas + muros + 20 coches = incidentes casi garantizados.'),
  createPrediction('Hamilton', 'Campo', 'F1 - GP Mónaco', 'Fórmula 1', '2026-04-20 15:00', 'Top 6', 'Hamilton Sí', 74, 1.60, 'Hamilton: 3 victorias en Mónaco. Ferrari competitivo en calles. Experiencia de Hamilton en gestión de neumáticos crucial en carrera sin pit stops.'),
  createPrediction('Verstappen', 'Campo', 'F1 - GP Mónaco', 'Fórmula 1', '2026-04-20 15:00', 'Pole Position', 'Verstappen', 78, 2.30, 'Verstappen en clasificación esta temporada: 6 poles en 8 GPs. Lap time en simulador Mónaco: 0.15s más rápido que el 2º. Dominio en vueltas rápidas.'),
  createPrediction('Piastri', 'Leclerc', 'F1 - GP Mónaco', 'Fórmula 1', '2026-04-20 15:00', 'Head-to-Head', 'Leclerc > Piastri', 73, 1.65, 'Leclerc: conoce cada centímetro de Mónaco (local). Ventaja de 0.08s en media de clasificación en circuitos urbanos sobre Piastri esta temporada.'),
  createPrediction('Red Bull', 'McLaren', 'F1 - GP Mónaco', 'Fórmula 1', '2026-04-20 15:00', 'Constructor Ganador', 'Red Bull', 72, 2.00, 'Red Bull: 58% de victorias esta temporada. Verstappen + Pérez combinado más consistente. McLaren: Norris fuerte pero Piastri con 3 DNF en calles.'),
  createPrediction('Abandono', 'Campo', 'F1 - GP Mónaco', 'Fórmula 1', '2026-04-20 15:00', 'Abandonos', 'Over 2.5', 77, 1.82, 'Mónaco: media de 3.2 abandonos/carrera (muros, colisiones en chicane). Esta temporada: media de 2.8 abandonos/GP. Calles estrechas amplifican errores.'),
  createPrediction('Vuelta Rápida', 'Campo', 'F1 - GP Mónaco', 'Fórmula 1', '2026-04-20 15:00', 'Vuelta Rápida', 'Norris', 70, 3.50, 'McLaren con mejor degradación de neumáticos (estrategia de final de carrera). Norris: 4 vueltas rápidas esta temporada (líder). Punto extra motivador.'),
  createPrediction('Alonso', 'Campo', 'F1 - GP Mónaco', 'Fórmula 1', '2026-04-20 15:00', 'Top 10', 'Alonso Sí', 79, 1.40, 'Alonso: experiencia suprema en calles (2 victorias Mónaco). Aston Martin mejorando (P5 en constructores). Acabar en puntos: alta probabilidad por gestión.'),
];

/* ═══════════════════════════════════════════════════
   MOTOCICLISMO
   ═══════════════════════════════════════════════════ */

const moto3Predictions: Prediction[] = [
  createPrediction('Ortolá', 'Campo', 'Moto3 - GP España', 'Motociclismo', '2026-04-20 11:00', 'Ganador', 'Ortolá', 74, 3.20, 'Ortolá líder del mundial. 2 victorias en Jerez en categorías inferiores. Conoce cada curva del circuito. Media de parrilla: P2.4 en las últimas 5 carreras.'),
  createPrediction('Alonso', 'Fernández', 'Moto3 - GP España', 'Motociclismo', '2026-04-20 11:00', 'Head-to-Head', 'Alonso > Fernández', 72, 1.75, 'Alonso: 0.12s más rápido de media en clasificación. Mejor ritmo de carrera (1:45.2 vs 1:45.5). Ventaja clara en Jerez por experiencia en RFME.'),
  createPrediction('Podio', 'Campo', 'Moto3 - GP España', 'Motociclismo', '2026-04-20 11:00', 'Piloto en Podio', 'Veijer Sí', 76, 1.85, 'Veijer: 4 podios en 5 carreras. Consistencia excepcional. Husqvarna competitiva en Jerez. Mejor piloto por puntos/carrera esta temporada.'),
  createPrediction('Caídas', 'Campo', 'Moto3 - GP España', 'Motociclismo', '2026-04-20 11:00', 'Caídas Carrera', 'Over 4.5', 80, 1.55, 'Moto3 en Jerez: media de 5.8 caídas/carrera. Pilotos jóvenes + frenadas duras en curva 1 y 6. Últimos 5 GPs España: 4.8-6.2 caídas.'),
  createPrediction('Top 5', 'Campo', 'Moto3 - GP España', 'Motociclismo', '2026-04-20 11:00', 'Top 5', 'Muñoz Sí', 73, 1.60, 'Muñoz: 2º en campeonato. Solo 1 vez fuera del top 5 esta temporada. Consistencia + velocidad en Jerez. KTM: moto fiable.'),
  createPrediction('Holgado', 'Ortolá', 'Moto3 - GP España', 'Motociclismo', '2026-04-20 11:00', 'Head-to-Head', 'Ortolá > Holgado', 71, 1.70, 'Ortolá: mejor ritmo esta temporada (media 1:44.9 vs 1:45.3). Más consistente en carrera. Holgado tiende a caer en las últimas 5 vueltas.'),
  createPrediction('Vuelta Rápida', 'Campo', 'Moto3 - GP España', 'Motociclismo', '2026-04-20 11:00', 'Vuelta Rápida', 'Ortolá', 70, 2.80, 'Líder del campeonato busca punto extra. KTM de Ortolá con mejor configuración para vuelta cualificante. 3 vueltas rápidas esta temporada.'),
  createPrediction('Retirados', 'Campo', 'Moto3 - GP España', 'Motociclismo', '2026-04-20 11:00', 'Retirados', 'Over 3.5', 75, 1.65, 'Moto3 alta tasa de abandono mecánico + caídas. Media de 4.2 retirados en Jerez. Calor de abril + neumáticos agresivos = más problemas.'),
  createPrediction('Primer Español', 'Campo', 'Moto3 - GP España', 'Motociclismo', '2026-04-20 11:00', 'Primer Español', 'Ortolá', 77, 2.10, '6 pilotos españoles en top 10 esta temporada. Ortolá: mejor clasificado (P1 mundial). Motivación extra en GP de casa. Público + presión positiva.'),
  createPrediction('Diferencia', 'Campo', 'Moto3 - GP España', 'Motociclismo', '2026-04-20 11:00', 'Margen Victoria', 'Under 0.5s', 78, 1.52, 'Moto3 siempre con llegadas ajustadas. Media de 0.28s de margen en últimos 5 GPs. Grupos compactos de 8-12 pilotos. Sprint final en Jerez.'),
  createPrediction('Safety Car', 'Campo', 'Moto3 - GP España', 'Motociclismo', '2026-04-20 11:00', 'Bandera Roja', 'No', 74, 1.35, 'Jerez amplio con escapatorias grandes. Solo 1 bandera roja en últimos 8 GPs de Moto3 en Jerez. Circuito seguro con grava generosa.'),
  createPrediction('Acosta en Top3', 'Campo', 'Moto3 - GP España', 'Motociclismo', '2026-04-20 11:00', 'Constructor Ganador', 'KTM', 73, 1.90, 'KTM domina Moto3: 65% de victorias. 4 pilotos KTM en top 8. Motor superior y chasis equilibrado para Jerez. Honda 2ª pero lejos.'),
];

const moto2Predictions: Prediction[] = [
  createPrediction('Canet', 'Aldeguer', 'Moto2 - GP España', 'Motociclismo', '2026-04-20 12:15', 'Head-to-Head', 'Aldeguer > Canet', 78, 1.82, 'Aldeguer: 0.18s más rápido de media esta temporada. Domina en Jerez (2 victorias consecutivas). Mejor gestión de neumáticos en carrera larga.'),
  createPrediction('Ganador', 'Campo', 'Moto2 - GP España', 'Motociclismo', '2026-04-20 12:15', 'Ganador', 'Aldeguer', 76, 2.80, 'Aldeguer: líder del mundial. Conoce Jerez a la perfección. 0.22s más rápido que el campo en FP combinados. Boscoscuro competitiva en curvas rápidas.'),
  createPrediction('Podio', 'Campo', 'Moto2 - GP España', 'Motociclismo', '2026-04-20 12:15', 'Podio', 'López Sí', 74, 1.70, 'López: 3 podios en 4 carreras. Consistencia brutal. 2º en campeonato a solo 8 puntos del líder. Boscoscuro domina en Jerez.'),
  createPrediction('Caídas', 'Campo', 'Moto2 - GP España', 'Motociclismo', '2026-04-20 12:15', 'Caídas', 'Over 3.5', 77, 1.60, 'Moto2 en Jerez: media de 4.1 caídas/carrera. Frenada de curva 1 problemática. Neumáticos Dunlop con agarre variable en calor de Jerez.'),
  createPrediction('Top 5', 'Campo', 'Moto2 - GP España', 'Motociclismo', '2026-04-20 12:15', 'Top 5', 'González Sí', 73, 1.55, 'González: piloto español con conocimiento profundo de Jerez. Dentro del top 5 en 3 de 4 carreras. Kalex superior en tracción.'),
  createPrediction('Vuelta Rápida', 'Campo', 'Moto2 - GP España', 'Motociclismo', '2026-04-20 12:15', 'Vuelta Rápida', 'Aldeguer', 72, 2.50, 'Aldeguer con mejor ritmo absoluto. Boscoscuro 2026 con motor actualizado. 2 vueltas rápidas en 4 carreras esta temporada.'),
  createPrediction('Diferencia', 'Campo', 'Moto2 - GP España', 'Motociclismo', '2026-04-20 12:15', 'Margen Victoria', 'Over 1.0s', 71, 2.10, 'Moto2 más espaciada que Moto3. Cuando Aldeguer lidera, gana por media de 1.4s. Estrategia de gestión de neumáticos crea gaps.'),
  createPrediction('Roberts', 'Ogura', 'Moto2 - GP España', 'Motociclismo', '2026-04-20 12:15', 'Head-to-Head', 'Ogura > Roberts', 70, 1.78, 'Ogura: más consistent en carrera. Roberts: rápido en clasif pero cae en ritmo. Ogura con mejor media de posiciones ganadas: +2.4/carrera.'),
  createPrediction('Constructor', 'Campo', 'Moto2 - GP España', 'Motociclismo', '2026-04-20 12:15', 'Constructor', 'Boscoscuro Gana', 75, 1.95, 'Boscoscuro: 3 victorias en 4 carreras con Aldeguer. Motor superior en aceleración. Kalex competitiva pero Boscoscuro es favorita clara.'),
  createPrediction('Retirados', 'Campo', 'Moto2 - GP España', 'Motociclismo', '2026-04-20 12:15', 'Retirados', 'Over 2.5', 73, 1.62, 'Media de 3.1 retirados en Moto2 GP España. Mecánicas + caídas. Calor de abril intensifica degradación. Fiabilidad: factor clave.'),
  createPrediction('Primer No-Europeo', 'Campo', 'Moto2 - GP España', 'Motociclismo', '2026-04-20 12:15', 'Primer Asiático', 'Ogura', 76, 2.20, 'Ogura: único asiático en top 5. 3º en campeonato. Consistente y rápido. Sin presión de casa = rendimiento óptimo. Kalex fiable.'),
  createPrediction('Carrera Sprint', 'Campo', 'Moto2 - GP España', 'Motociclismo', '2026-04-20 12:15', 'Sprint Winner', 'Aldeguer', 74, 2.60, 'Aldeguer domina en formato corto: 2 victorias en sprint de 4 carreras. Agresividad en primeras vueltas. Boscoscuro arranca mejor.'),
];

const motogpPredictions: Prediction[] = [
  createPrediction('Bagnaia', 'Martín', 'MotoGP - GP España', 'Motociclismo', '2026-04-20 14:00', 'Head-to-Head', 'Bagnaia > Martín', 79, 1.85, 'Bagnaia: 3 victorias en Jerez. Ducati GP26 con mejor tracción. 0.08s ventaja en clasificación media esta temporada. Maestro de Jerez.'),
  createPrediction('Ganador', 'Campo', 'MotoGP - GP España', 'Motociclismo', '2026-04-20 14:00', 'Ganador', 'Bagnaia', 77, 2.40, 'Bagnaia: favorito en Jerez por historial (3V-1P en últimos 4). Ducati dominante en curvas lentas de Jerez. 0.15s más rápido en simulaciones.'),
  createPrediction('Podio', 'Campo', 'MotoGP - GP España', 'Motociclismo', '2026-04-20 14:00', 'Podio', 'Marc Márquez Sí', 83, 1.55, 'Márquez: 8 victorias en Jerez (récord). Ducati GP26 le da la moto que siempre necesitó. 5 podios en 5 carreras esta temporada. Constancia élite.'),
  createPrediction('Márquez', 'Bastianini', 'MotoGP - GP España', 'Motociclismo', '2026-04-20 14:00', 'Head-to-Head', 'Márquez > Bastianini', 80, 1.65, 'Márquez: rey de Jerez. Experiencia en carrera larga superior. Bastianini: bueno en clasificación pero Márquez lo supera con gestión y agresividad.'),
  createPrediction('Caídas', 'Campo', 'MotoGP - GP España', 'Motociclismo', '2026-04-20 14:00', 'Caídas', 'Over 2.5', 75, 1.72, 'MotoGP en Jerez: media de 3.4 caídas/carrera. Curva 5 y 13 especialmente peligrosas. Calor = menor adherencia en la tarde. Ducatis agresivas.'),
  createPrediction('Pole', 'Campo', 'MotoGP - GP España', 'Motociclismo', '2026-04-20 14:00', 'Pole Position', 'Martín', 74, 2.50, 'Martín: especialista en vuelta rápida (5 poles esta temporada). Aprilia RS-GP26 con mejor rendimiento en clasificación. 0.03s ventaja en Q2 medias.'),
  createPrediction('Top 5 Español', 'Campo', 'MotoGP - GP España', 'Motociclismo', '2026-04-20 14:00', 'Españoles en Top 5', 'Over 2.5', 81, 1.45, 'Bagnaia, Márquez (italiano/español), Martín, Acosta, Mir. 5 españoles en top 10. Motivación GP de casa. En los últimos 3 años: 3+ españoles en top 5.'),
  createPrediction('Acosta', 'Campo', 'MotoGP - GP España', 'Motociclismo', '2026-04-20 14:00', 'Top 6', 'Acosta Sí', 76, 1.58, 'Acosta: talento generacional. 4º en campeonato con KTM. Jerez es su circuito de casa (Murcia). 22 años y ya con 3 podios MotoGP. Motivación extrema.'),
  createPrediction('Vuelta Rápida', 'Campo', 'MotoGP - GP España', 'Motociclismo', '2026-04-20 14:00', 'Vuelta Rápida', 'Bagnaia', 72, 2.80, 'Bagnaia: gestión de neumáticos superior. Ataca en últimas vueltas. 3 vueltas rápidas esta temporada (líder). Ducati con ventaja de tracción final.'),
  createPrediction('Sprint', 'Campo', 'MotoGP - GP España', 'Motociclismo', '2026-04-20 14:00', 'Sprint Winner', 'Martín', 78, 2.20, 'Martín: rey del Sprint Race (4 victorias en 5 sprints). Agresividad extrema en carrera corta. Aprilia arranca como un cohete: 0-100 en 2.6s.'),
  createPrediction('Safety Car', 'Campo', 'MotoGP - GP España', 'Motociclismo', '2026-04-20 14:00', 'Bandera Roja', 'No', 79, 1.32, 'Jerez: circuito seguro con escapatorias grandes. Solo 1 bandera roja en últimos 10 GPs de MotoGP en Jerez. Gravel traps amplias.'),
  createPrediction('Constructor', 'Campo', 'MotoGP - GP España', 'Motociclismo', '2026-04-20 14:00', 'Constructor Ganador', 'Ducati', 84, 1.48, 'Ducati: 78% de victorias en las últimas 3 temporadas. 4 pilotos Ducati en top 6 esta temporada. Dominio absolutamente abrumador. Moto referencia.'),
];

/* ═══════════════════════════════════════════════════
   EXPORTACIÓN FINAL
   ═══════════════════════════════════════════════════ */

export const ALL_SPORTS_DATA: SportData[] = [
  {
    sportName: 'Fútbol',
    icon: '⚽',
    accentColor: '#34d399',
    leagues: [
      { leagueName: 'Champions League', predictions: championsLeaguePredictions },
      { leagueName: 'Europa League', predictions: europaLeaguePredictions },
      { leagueName: 'Conference League', predictions: conferencePredictions },
      { leagueName: 'La Liga', predictions: laLigaPredictions },
      { leagueName: 'Premier League', predictions: premierPredictions },
      { leagueName: 'Ligue 1', predictions: ligue1Predictions },
      { leagueName: 'Bundesliga', predictions: bundesligaPredictions },
      { leagueName: 'Primeira Liga', predictions: primeiraPredictions },
    ]
  },
  {
    sportName: 'Baloncesto',
    icon: '🏀',
    accentColor: '#fbbf24',
    leagues: [
      { leagueName: 'ACB', predictions: acbPredictions },
      { leagueName: 'NBA', predictions: nbaPredictions },
    ]
  },
  {
    sportName: 'Fórmula 1',
    icon: '🏎️',
    accentColor: '#ef4444',
    leagues: [
      { leagueName: 'GP Mónaco', predictions: f1Predictions },
    ]
  },
  {
    sportName: 'Motociclismo',
    icon: '🏍️',
    accentColor: '#a78bfa',
    leagues: [
      { leagueName: 'Moto3', predictions: moto3Predictions },
      { leagueName: 'Moto2', predictions: moto2Predictions },
      { leagueName: 'MotoGP', predictions: motogpPredictions },
    ]
  },
];
