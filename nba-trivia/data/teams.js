// 30 NBA franchises + a fact-driven question generator for the team mode.
// Facts verified through the 2024–25 season. Fields are optional — the generator
// only builds a question when the fact (and enough decoys) exist.
export const TEAMS = [
  { id: 'atl', city: 'Atlanta', name: 'Hawks', conf: 'East', div: 'Southeast', arena: 'State Farm Arena', colors: 'Red and yellow', titles: 1, lastTitle: 1958, former: 'Tri-Cities Blackhawks', scorer: 'Dominique Wilkins', legends: ['Bob Pettit', 'Dominique Wilkins', 'Trae Young'] },
  { id: 'bos', city: 'Boston', name: 'Celtics', conf: 'East', div: 'Atlantic', arena: 'TD Garden', colors: 'Green and white', titles: 18, lastTitle: 2024, scorer: 'John Havlicek', legends: ['Bill Russell', 'Larry Bird', 'Paul Pierce', 'Jayson Tatum'] },
  { id: 'bkn', city: 'Brooklyn', name: 'Nets', conf: 'East', div: 'Atlantic', arena: 'Barclays Center', colors: 'Black and white', titles: 0, former: 'New Jersey Nets', scorer: 'Brook Lopez', legends: ['Jason Kidd', 'Vince Carter', 'Julius Erving'] },
  { id: 'cha', city: 'Charlotte', name: 'Hornets', conf: 'East', div: 'Southeast', arena: 'Spectrum Center', colors: 'Teal and purple', titles: 0, former: 'Charlotte Bobcats', scorer: 'Kemba Walker', legends: ['Larry Johnson', 'Kemba Walker', 'LaMelo Ball'] },
  { id: 'chi', city: 'Chicago', name: 'Bulls', conf: 'East', div: 'Central', arena: 'United Center', colors: 'Red and black', titles: 6, lastTitle: 1998, scorer: 'Michael Jordan', legends: ['Michael Jordan', 'Scottie Pippen', 'Derrick Rose'] },
  { id: 'cle', city: 'Cleveland', name: 'Cavaliers', conf: 'East', div: 'Central', arena: 'Rocket Arena', colors: 'Wine and gold', titles: 1, lastTitle: 2016, scorer: 'LeBron James', legends: ['LeBron James', 'Mark Price', 'Kyrie Irving'] },
  { id: 'dal', city: 'Dallas', name: 'Mavericks', conf: 'West', div: 'Southwest', arena: 'American Airlines Center', colors: 'Blue and silver', titles: 1, lastTitle: 2011, scorer: 'Dirk Nowitzki', legends: ['Dirk Nowitzki', 'Steve Nash', 'Luka Dončić'] },
  { id: 'den', city: 'Denver', name: 'Nuggets', conf: 'West', div: 'Northwest', arena: 'Ball Arena', colors: 'Navy and gold', titles: 1, lastTitle: 2023, scorer: 'Alex English', legends: ['Alex English', 'Dikembe Mutombo', 'Nikola Jokić'] },
  { id: 'det', city: 'Detroit', name: 'Pistons', conf: 'East', div: 'Central', arena: 'Little Caesars Arena', colors: 'Red, white and blue', titles: 3, lastTitle: 2004, former: 'Fort Wayne Pistons', scorer: 'Isiah Thomas', legends: ['Isiah Thomas', 'Joe Dumars', 'Ben Wallace'] },
  { id: 'gsw', city: 'Golden State', name: 'Warriors', conf: 'West', div: 'Pacific', arena: 'Chase Center', colors: 'Blue and gold', titles: 7, lastTitle: 2022, former: 'Philadelphia Warriors', scorer: 'Stephen Curry', legends: ['Wilt Chamberlain', 'Rick Barry', 'Stephen Curry'] },
  { id: 'hou', city: 'Houston', name: 'Rockets', conf: 'West', div: 'Southwest', arena: 'Toyota Center', colors: 'Red and black', titles: 2, lastTitle: 1995, former: 'San Diego Rockets', scorer: 'Hakeem Olajuwon', legends: ['Hakeem Olajuwon', 'Yao Ming', 'James Harden'] },
  { id: 'ind', city: 'Indiana', name: 'Pacers', conf: 'East', div: 'Central', arena: 'Gainbridge Fieldhouse', colors: 'Navy and gold', titles: 0, scorer: 'Reggie Miller', legends: ['Reggie Miller', 'Jermaine O\'Neal', 'Tyrese Haliburton'] },
  { id: 'lac', city: 'Los Angeles', name: 'Clippers', conf: 'West', div: 'Pacific', arena: 'Intuit Dome', colors: 'Red and blue', titles: 0, former: 'Buffalo Braves', legends: ['Bob McAdoo', 'Chris Paul', 'Kawhi Leonard'] },
  { id: 'lal', city: 'Los Angeles', name: 'Lakers', conf: 'West', div: 'Pacific', arena: 'Crypto.com Arena', colors: 'Purple and gold', titles: 17, lastTitle: 2020, former: 'Minneapolis Lakers', scorer: 'Kobe Bryant', legends: ['Magic Johnson', 'Kareem Abdul-Jabbar', 'Kobe Bryant', 'LeBron James'] },
  { id: 'mem', city: 'Memphis', name: 'Grizzlies', conf: 'West', div: 'Southwest', arena: 'FedExForum', colors: 'Navy and beale street blue', titles: 0, former: 'Vancouver Grizzlies', scorer: 'Mike Conley', legends: ['Marc Gasol', 'Zach Randolph', 'Ja Morant'] },
  { id: 'mia', city: 'Miami', name: 'Heat', conf: 'East', div: 'Southeast', arena: 'Kaseya Center', colors: 'Red and black', titles: 3, lastTitle: 2013, scorer: 'Dwyane Wade', legends: ['Dwyane Wade', 'Alonzo Mourning', 'Jimmy Butler'] },
  { id: 'mil', city: 'Milwaukee', name: 'Bucks', conf: 'East', div: 'Central', arena: 'Fiserv Forum', colors: 'Green and cream', titles: 2, lastTitle: 2021, scorer: 'Kareem Abdul-Jabbar', legends: ['Kareem Abdul-Jabbar', 'Oscar Robertson', 'Giannis Antetokounmpo'] },
  { id: 'min', city: 'Minnesota', name: 'Timberwolves', conf: 'West', div: 'Northwest', arena: 'Target Center', colors: 'Navy and green', titles: 0, scorer: 'Karl-Anthony Towns', legends: ['Kevin Garnett', 'Karl-Anthony Towns', 'Anthony Edwards'] },
  { id: 'nop', city: 'New Orleans', name: 'Pelicans', conf: 'West', div: 'Southwest', arena: 'Smoothie King Center', colors: 'Navy, gold and red', titles: 0, former: 'New Orleans Hornets', scorer: 'Anthony Davis', legends: ['Chris Paul', 'Anthony Davis', 'Zion Williamson'] },
  { id: 'nyk', city: 'New York', name: 'Knicks', conf: 'East', div: 'Atlantic', arena: 'Madison Square Garden', colors: 'Blue and orange', titles: 2, lastTitle: 1973, scorer: 'Patrick Ewing', legends: ['Walt Frazier', 'Patrick Ewing', 'Jalen Brunson'] },
  { id: 'okc', city: 'Oklahoma City', name: 'Thunder', conf: 'West', div: 'Northwest', arena: 'Paycom Center', colors: 'Blue and orange', titles: 2, lastTitle: 2025, former: 'Seattle SuperSonics', scorer: 'Gary Payton', legends: ['Gary Payton', 'Kevin Durant', 'Shai Gilgeous-Alexander'] },
  { id: 'orl', city: 'Orlando', name: 'Magic', conf: 'East', div: 'Southeast', arena: 'Kia Center', colors: 'Blue, black and silver', titles: 0, scorer: 'Dwight Howard', legends: ['Shaquille O\'Neal', 'Penny Hardaway', 'Dwight Howard'] },
  { id: 'phi', city: 'Philadelphia', name: '76ers', conf: 'East', div: 'Atlantic', colors: 'Blue and red', titles: 3, lastTitle: 1983, former: 'Syracuse Nationals', scorer: 'Hal Greer', legends: ['Julius Erving', 'Allen Iverson', 'Joel Embiid'] },
  { id: 'phx', city: 'Phoenix', name: 'Suns', conf: 'West', div: 'Pacific', arena: 'Footprint Center', colors: 'Purple and orange', titles: 0, scorer: 'Walter Davis', legends: ['Charles Barkley', 'Steve Nash', 'Devin Booker'] },
  { id: 'por', city: 'Portland', name: 'Trail Blazers', conf: 'West', div: 'Northwest', arena: 'Moda Center', colors: 'Red and black', titles: 1, lastTitle: 1977, scorer: 'Clyde Drexler', legends: ['Bill Walton', 'Clyde Drexler', 'Damian Lillard'] },
  { id: 'sac', city: 'Sacramento', name: 'Kings', conf: 'West', div: 'Pacific', arena: 'Golden 1 Center', colors: 'Purple and silver', titles: 1, lastTitle: 1951, former: 'Rochester Royals', scorer: 'Oscar Robertson', legends: ['Oscar Robertson', 'Chris Webber', 'De\'Aaron Fox'] },
  { id: 'sas', city: 'San Antonio', name: 'Spurs', conf: 'West', div: 'Southwest', arena: 'Frost Bank Center', colors: 'Silver and black', titles: 5, lastTitle: 2014, scorer: 'Tim Duncan', legends: ['David Robinson', 'Tim Duncan', 'Victor Wembanyama'] },
  { id: 'tor', city: 'Toronto', name: 'Raptors', conf: 'East', div: 'Atlantic', arena: 'Scotiabank Arena', colors: 'Red and black', titles: 1, lastTitle: 2019, scorer: 'DeMar DeRozan', legends: ['Vince Carter', 'Kyle Lowry', 'Kawhi Leonard'] },
  { id: 'uta', city: 'Utah', name: 'Jazz', conf: 'West', div: 'Northwest', arena: 'Delta Center', colors: 'Purple, black and yellow', titles: 0, former: 'New Orleans Jazz', scorer: 'Karl Malone', legends: ['John Stockton', 'Karl Malone', 'Rudy Gobert'] },
  { id: 'was', city: 'Washington', name: 'Wizards', conf: 'East', div: 'Southeast', arena: 'Capital One Arena', colors: 'Navy, red and silver', titles: 1, lastTitle: 1978, former: 'Washington Bullets', scorer: 'Elvin Hayes', legends: ['Wes Unseld', 'Elvin Hayes', 'John Wall'] },
];
export const teamById = id => TEAMS.find(t => t.id === id);
export const fullName = t => `${t.city} ${t.name}`;
export const TEAM_TIERS = [['fan', 'Fan'], ['diehard', 'Die-Hard'], ['superfan', 'Superfan'], ['legend', 'Legend'], ['expert', 'Team Expert']];

const pick = (arr, rnd, n) => { const a = arr.slice(); const out = []; while (out.length < n && a.length) out.push(...a.splice(Math.floor(rnd() * a.length), 1)); return out; };
const others = (t, field) => TEAMS.filter(x => x.id !== t.id && x[field] != null).map(x => x[field]);

// Builds a pool of generated questions for one team at one tier.
export function templates(t, tier, rnd) {
  const F = fullName(t), qs = [];
  const add = (text, correct, wrongPool, exp, cat) => {
    const wrongs = pick([...new Set(wrongPool.filter(w => w !== correct))], rnd, 3);
    if (correct && wrongs.length === 3) qs.push({ text, correct, wrongs, exp, cat, teamId: t.id, diff: tier });
  };
  if (tier === 'fan') {
    add(`Which city do the ${t.name} play in?`, t.city, others(t, 'city'), `${F}.`, 'Team history');
    add(`Which conference do the ${t.name} play in?`, t.conf + 'ern Conference', ['Western Conference', 'Eastern Conference', 'Central Conference', 'Atlantic Conference'].filter(x => x !== t.conf + 'ern Conference'), `${F} play in the ${t.conf}ern Conference.`, 'Team history');
    if (t.arena) add(`Where do the ${t.name} play their home games?`, t.arena, others(t, 'arena'), `${F} host games at ${t.arena}.`, 'Arenas');
    add(`What are the ${t.name}' primary colours?`, t.colors, others(t, 'colors'), `${F}: ${t.colors.toLowerCase()}.`, 'Team history');
    if (t.legends) add(`Which of these players is a ${t.name} franchise legend?`, t.legends[rnd() < .5 ? 0 : t.legends.length - 1], TEAMS.filter(x => x.id !== t.id).flatMap(x => x.legends || []), `A ${F} great.`, 'Franchise legends');
  } else if (tier === 'diehard') {
    add(`Which division do the ${t.name} play in?`, t.div + ' Division', [...new Set(others(t, 'div'))].map(d => d + ' Division'), `${F} — ${t.div} Division.`, 'Team history');
    add(`How many NBA championships have the ${t.name} won?`, String(t.titles), ['0', '1', '2', '3', '5', '6', '7', '17', '18'].filter(x => x !== String(t.titles)), t.titles ? `${t.titles} title${t.titles > 1 ? 's' : ''}${t.lastTitle ? `, most recently in ${t.lastTitle}` : ''}.` : `${F} have not won a championship.`, 'Championships');
    if (t.scorer) add(`Who is the ${t.name}' all-time leading scorer?`, t.scorer, others(t, 'scorer'), `${t.scorer} tops the ${F} scoring list.`, 'Franchise records');
    if (t.legends) add(`Which player did NOT play for the ${t.name}?`, pick(TEAMS.filter(x => x.id !== t.id).flatMap(x => x.legends || []), rnd, 1)[0], t.legends, `The other three are ${F} names.`, 'Franchise legends');
  } else if (tier === 'superfan') {
    if (t.lastTitle) add(`In which year did the ${t.name} most recently win the championship?`, String(t.lastTitle), TEAMS.filter(x => x.lastTitle && x.lastTitle !== t.lastTitle).map(x => String(x.lastTitle)), `${F} — ${t.lastTitle}.`, 'Championships');
    if (t.former) add(`Which name did this franchise previously go by?`, t.former, others(t, 'former'), `${F} were once the ${t.former}.`, 'Team history');
    if (t.legends && t.legends.length >= 3) add(`Which of these is the longest-serving ${t.name} franchise cornerstone?`, t.legends[0], TEAMS.filter(x => x.id !== t.id).flatMap(x => x.legends || []), `${t.legends[0]} defined an era in ${t.city}.`, 'Franchise legends');
    add(`Which team shares the ${t.div} Division with the ${t.name}?`, pick(TEAMS.filter(x => x.div === t.div && x.id !== t.id), rnd, 1).map(x => x.name)[0], TEAMS.filter(x => x.div !== t.div).map(x => x.name), `${t.div} Division rivals.`, 'Team history');
  } else {
    const pool = TEAMS.filter(x => x.id !== t.id);
    if (t.former) add(`This franchise played under which name before its current one?`, t.former, others(t, 'former'), `${F} history: ${t.former} → ${F}.`, 'Team history');
    if (t.scorer && t.legends) add(`Which ${t.name} great scored more points for the franchise than any other?`, t.scorer, t.legends.filter(l => l !== t.scorer).concat(pool.flatMap(x => x.legends || [])), `${t.scorer} is the franchise scoring leader.`, 'Franchise records');
    if (t.lastTitle) add(`The ${t.name} lifted the trophy in which of these years?`, String(t.lastTitle), TEAMS.filter(x => x.lastTitle).map(x => String(x.lastTitle)), `${t.lastTitle}.`, 'Championships');
    if (t.arena) add(`Which arena is home to the ${t.name}?`, t.arena, others(t, 'arena'), `${t.arena}, ${t.city}.`, 'Arenas');
    if (t.legends) t.legends.forEach(l => add(`Which franchise does ${l} belong to in team lore?`, F, pool.map(fullName), `${l} — a ${F} icon.`, 'Franchise legends'));
  }
  return qs;
}

let uid = 900000;
// Endless team-question feed. tier order escalates with the run.
export function teamQuestion(teamId, tier, used, rnd = Math.random) {
  const t = teamById(teamId); if (!t) return null;
  const order = ['fan', 'diehard', 'superfan', 'legend', 'expert'];
  let pool = [];
  for (let i = order.indexOf(tier); i < order.length && !pool.length; i++) pool = templates(t, order[i], rnd).filter(q => !used.has(q.text));
  if (!pool.length) { used.clear(); pool = templates(t, tier, rnd); }
  const q = pool[Math.floor(rnd() * pool.length)];
  used.add(q.text);
  const options = [q.correct, ...q.wrongs];
  for (let i = options.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [options[i], options[j]] = [options[j], options[i]]; }
  return { id: ++uid, text: q.text, correct: q.correct, wrongs: q.wrongs, options, cat: q.cat, diff: q.diff, type: 'mc', exp: q.exp, clues: null };
}
export function allTemplates(teamId, rnd = Math.random) {
  const t = teamById(teamId); if (!t) return [];
  const out = [], seen = new Set();
  for (const tier of ['fan', 'diehard', 'superfan', 'legend', 'expert']) {
    for (let pass = 0; pass < 6; pass++) {
      for (const q of templates(t, tier, rnd)) {
        const key = tier + '|' + q.text;
        if (seen.has(key)) continue;
        seen.add(key); out.push(q);
      }
    }
  }
  return out;
}
export const teamTier = streak => streak < 5 ? 'fan' : streak < 12 ? 'diehard' : streak < 22 ? 'superfan' : streak < 35 ? 'legend' : 'expert';
export const TEAM_BADGES = [[5, 'Casual Fan'], [25, 'Die-Hard'], [50, 'Superfan'], [100, 'Team Historian'], [250, 'Franchise Expert'], [500, 'You Know Everything']];
