// franchises.js — what each franchise was called in a given season.
//
// balldontlie files every game under the franchise's CURRENT identity (the
// 1955 Syracuse Nationals come back as the "Philadelphia 76ers"). Questions
// about history must use the name the team had at the time, so every game is
// renamed through this table. Keys are balldontlie team ids; each entry is
// [first season (start year, 1955 = 1955–56), name in use from then on].
// Defunct teams (Chicago Stags, Baltimore Bullets of 1947–54, …) already carry
// their own names in the API and are not listed.
export const FRANCHISE_NAMES = {
  1:  [[1949, 'Tri-Cities Blackhawks'], [1951, 'Milwaukee Hawks'], [1955, 'St. Louis Hawks'], [1968, 'Atlanta Hawks']],
  2:  [[1946, 'Boston Celtics']],
  3:  [[1976, 'New York Nets'], [1977, 'New Jersey Nets'], [2012, 'Brooklyn Nets']],
  4:  [[1988, 'Charlotte Hornets'], [2004, 'Charlotte Bobcats'], [2014, 'Charlotte Hornets']],
  5:  [[1966, 'Chicago Bulls']],
  6:  [[1970, 'Cleveland Cavaliers']],
  7:  [[1980, 'Dallas Mavericks']],
  8:  [[1976, 'Denver Nuggets']],
  9:  [[1948, 'Fort Wayne Pistons'], [1957, 'Detroit Pistons']],
  10: [[1946, 'Philadelphia Warriors'], [1962, 'San Francisco Warriors'], [1971, 'Golden State Warriors']],
  11: [[1967, 'San Diego Rockets'], [1971, 'Houston Rockets']],
  12: [[1976, 'Indiana Pacers']],
  13: [[1970, 'Buffalo Braves'], [1978, 'San Diego Clippers'], [1984, 'Los Angeles Clippers']],
  14: [[1948, 'Minneapolis Lakers'], [1960, 'Los Angeles Lakers']],
  15: [[1995, 'Vancouver Grizzlies'], [2001, 'Memphis Grizzlies']],
  16: [[1988, 'Miami Heat']],
  17: [[1968, 'Milwaukee Bucks']],
  18: [[1989, 'Minnesota Timberwolves']],
  // 1988–2002 Hornets history belongs to Charlotte; listed here too in case a
  // source files those seasons under New Orleans.
  19: [[1988, 'Charlotte Hornets'], [2002, 'New Orleans Hornets'], [2005, 'New Orleans/Oklahoma City Hornets'], [2007, 'New Orleans Hornets'], [2013, 'New Orleans Pelicans']],
  20: [[1946, 'New York Knicks']],
  21: [[1967, 'Seattle SuperSonics'], [2008, 'Oklahoma City Thunder']],
  22: [[1989, 'Orlando Magic']],
  23: [[1949, 'Syracuse Nationals'], [1963, 'Philadelphia 76ers']],
  24: [[1968, 'Phoenix Suns']],
  25: [[1970, 'Portland Trail Blazers']],
  26: [[1948, 'Rochester Royals'], [1957, 'Cincinnati Royals'], [1972, 'Kansas City-Omaha Kings'], [1975, 'Kansas City Kings'], [1985, 'Sacramento Kings']],
  27: [[1976, 'San Antonio Spurs']],
  28: [[1995, 'Toronto Raptors']],
  29: [[1974, 'New Orleans Jazz'], [1979, 'Utah Jazz']],
  30: [[1961, 'Chicago Packers'], [1962, 'Chicago Zephyrs'], [1963, 'Baltimore Bullets'], [1973, 'Capital Bullets'], [1974, 'Washington Bullets'], [1997, 'Washington Wizards']]
};

// Today's abbreviation → balldontlie franchise id.
export const ABBR_ID = { ATL: 1, BOS: 2, BKN: 3, CHA: 4, CHI: 5, CLE: 6, DAL: 7, DEN: 8, DET: 9, GSW: 10, HOU: 11, IND: 12, LAC: 13, LAL: 14, MEM: 15,
  MIA: 16, MIL: 17, MIN: 18, NOP: 19, NYK: 20, OKC: 21, ORL: 22, PHI: 23, PHX: 24, POR: 25, SAC: 26, SAS: 27, TOR: 28, UTA: 29, WAS: 30 };

// Name a team as it was in `season` (balldontlie start year). Falls back to
// the API's own name for defunct teams and anything not in the table.
export function teamNameIn(team, season) {
  const list = FRANCHISE_NAMES[team.id];
  if (!list) return team.full_name === 'LA Clippers' ? 'Los Angeles Clippers' : team.full_name;
  let name = list[0][1];
  for (const [from, n] of list) if (season >= from) name = n;
  return name;
}

// Season label used everywhere in the bank: 1995 → "1995-96".
export const seasonLabel = y => `${y}-${String((y + 1) % 100).padStart(2, '0')}`;
// The year a season's Finals were played: 1995 → 1996.
export const finalsYear = y => y + 1;

// The current franchise (balldontlie id) that a historical name belonged to
// in a given season — "Seattle SuperSonics" in 1978 → 21 (Thunder).
// Returns null for defunct teams (e.g. the 1947–54 Baltimore Bullets).
export function franchiseIdFor(name, season) {
  for (const [id, list] of Object.entries(FRANCHISE_NAMES)) {
    if (season < list[0][0]) continue;
    if (teamNameIn({ id: Number(id) }, season) === name) return Number(id);
  }
  return null;
}
