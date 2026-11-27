// Who Am I? — career-mystery database + engine.
// Clues are ordered HARDEST → EASIEST. Clue types: text | path (career timeline) | numbers | awards.
// Tiers: rookie, starter, allstar, superstar, legend. Data current through summer 2025.
export { AR } from './mystery-ar.js';   // the clues in Arabic
let n = 0;
const P = (tier, name, accept, decoys, clues, era) => ({ id: ++n, kind: 'player', tier, name, accept, decoys, clues, era });
const C = (tier, name, accept, decoys, clues, era) => ({ id: ++n, kind: 'coach', tier, name, accept, decoys, clues, era });
const t = content => ({ type: 'text', content });
const path = (teams, label = 'Career path') => ({ type: 'path', teams, label });
const nums = numbers => ({ type: 'numbers', numbers });
const awards = list => ({ type: 'awards', list });

export const TIERS = ['rookie', 'starter', 'allstar', 'superstar', 'legend'];
export const TIER_LABEL = { rookie: 'Rookie', starter: 'Starter', allstar: 'All-Star', superstar: 'Superstar', legend: 'NBA Legend' };
export const POINTS = [1000, 800, 600, 400, 200];
export const WRONG_PENALTY = 150;
export const ONE_CLUE_POINTS = 2000;

export const PEOPLE = [
  // ── PLAYERS · ROOKIE ──
  P('rookie', 'LeBron James', ['lebron'], ['Dwyane Wade', 'Carmelo Anthony', 'Chris Bosh'], [
    t('Has played for three franchises — and returned to the first one after four seasons away.'),
    t('Won Rookie of the Year in 2004 after being drafted #1 overall straight out of high school in Ohio.'),
    path(['Cleveland Cavaliers', 'Miami Heat', 'Cleveland Cavaliers', 'Los Angeles Lakers']),
    awards(['4× NBA Champion', '4× MVP', '4× Finals MVP', 'Rookie of the Year 2004']),
    t('The NBA\'s all-time leading scorer, nicknamed "The King".')], '2000s'),
  P('rookie', 'Kobe Bryant', ['kobe'], ['Shaquille O\'Neal', 'Tracy McGrady', 'Vince Carter'], [
    t('Drafted 13th overall in 1996 by Charlotte and traded on draft night for Vlade Divac.'),
    t('Spent all 20 seasons with a single franchise.'),
    nums(['8', '24']),
    awards(['5× NBA Champion', '2× Finals MVP', 'MVP 2008', '81 points in one game (2006)']),
    t('Nicknamed "Black Mamba" — the Lakers retired both his numbers.')], '2000s'),
  P('rookie', 'Stephen Curry', ['steph curry', 'steph', 'curry'], ['Klay Thompson', 'Damian Lillard', 'Kyrie Irving'], [
    t('Son of a former NBA sharpshooter; played college basketball at Davidson.'),
    t('Drafted 7th overall in 2009 — six teams passed on him.'),
    path(['Golden State Warriors']),
    awards(['4× NBA Champion', '2× MVP (2015, 2016 — unanimous)', 'Finals MVP 2022']),
    t('The all-time leader in made three-pointers; nicknamed "Chef".')], '2010s'),
  P('rookie', 'Shaquille O\'Neal', ['shaq', 'shaquille oneal', 'shaquille o neal'], ['Hakeem Olajuwon', 'Patrick Ewing', 'Alonzo Mourning'], [
    t('The #1 overall pick in 1992 out of LSU.'),
    path(['Orlando Magic', 'Los Angeles Lakers', 'Miami Heat', 'Phoenix Suns', 'Cleveland Cavaliers', 'Boston Celtics']),
    awards(['MVP 2000', '3 straight Finals MVPs (2000–02)']),
    t('Won a fourth championship in Miami in 2006, alongside Dwyane Wade.'),
    t('A 7\'1" center known as "The Diesel" and "The Big Aristotle".')], '2000s'),
  P('rookie', 'Michael Jordan', ['jordan', 'mj', 'mike jordan'], ['Scottie Pippen', 'Magic Johnson', 'Larry Bird'], [
    t('Drafted 3rd overall in 1984 out of North Carolina — behind Hakeem Olajuwon and Sam Bowie.'),
    t('Retired twice — once to play minor-league baseball.'),
    path(['Chicago Bulls', 'Washington Wizards']),
    awards(['6× NBA Champion', '6× Finals MVP', '5× MVP', '10× scoring champion']),
    t('Wore #23 for the Bulls; widely called the greatest of all time.')], '1990s'),
  P('rookie', 'Giannis Antetokounmpo', ['giannis', 'antetokounmpo', 'greek freak'], ['Joel Embiid', 'Nikola Jokić', 'Luka Dončić'], [
    t('Born in Athens to Nigerian parents; drafted 15th overall in 2013.'),
    t('Has spent his whole career with one Wisconsin franchise.'),
    awards(['Back-to-back MVP (2019, 2020)', 'Defensive Player of the Year 2020', 'Most Improved Player 2017']),
    t('Scored 50 points in the title-clinching Game 6 of the 2021 Finals.'),
    t('Known as "The Greek Freak".')], '2010s'),
  P('rookie', 'Kevin Durant', ['kd', 'durant'], ['Russell Westbrook', 'James Harden', 'Paul George'], [
    t('Drafted 2nd overall in 2007 out of Texas.'),
    t('Won Rookie of the Year with the Seattle SuperSonics — in the franchise\'s final season in Seattle.'),
    path(['Seattle SuperSonics / OKC Thunder', 'Golden State Warriors', 'Brooklyn Nets', 'Phoenix Suns', 'Houston Rockets']),
    awards(['MVP 2014', '2× NBA Champion', '2× Finals MVP (2017, 2018)', '4× scoring champion']),
    t('A 6\'11" scorer nicknamed "Slim Reaper".')], '2010s'),
  P('rookie', 'Tim Duncan', ['duncan'], ['David Robinson', 'Kevin Garnett', 'Dirk Nowitzki'], [
    t('Grew up in the U.S. Virgin Islands as a competitive swimmer.'),
    t('The #1 overall pick in 1997 out of Wake Forest.'),
    path(['San Antonio Spurs']),
    awards(['5× NBA Champion', '2× MVP', '3× Finals MVP', 'Rookie of the Year 1998']),
    t('"The Big Fundamental".')], '2000s'),

  // ── PLAYERS · STARTER ──
  P('starter', 'Dwyane Wade', ['wade', 'd wade', 'dwayne wade'], ['Chris Bosh', 'Rajon Rondo', 'Carmelo Anthony'], [
    t('Drafted 5th overall in 2003 out of Marquette.'),
    path(['Miami Heat', 'Chicago Bulls', 'Cleveland Cavaliers', 'Miami Heat']),
    awards(['Finals MVP 2006', '3× NBA Champion', 'Scoring champion 2009']),
    t('Won two of his titles alongside LeBron James.'),
    t('Wore #3 in Miami; nicknamed "Flash".')], '2000s'),
  P('starter', 'James Harden', ['harden', 'the beard'], ['Russell Westbrook', 'Chris Paul', 'Paul George'], [
    t('Drafted 3rd overall in 2009 out of Arizona State.'),
    t('Won Sixth Man of the Year in 2012 before being traded that October.'),
    path(['Oklahoma City Thunder', 'Houston Rockets', 'Brooklyn Nets', 'Philadelphia 76ers', 'Los Angeles Clippers']),
    awards(['MVP 2018', '3 straight scoring titles (2018–20)', 'Assists leader 2017, 2024']),
    t('Nicknamed "The Beard".')], '2010s'),
  P('starter', 'Chris Paul', ['cp3', 'paul'], ['Deron Williams', 'Rajon Rondo', 'Russell Westbrook'], [
    t('Drafted 4th overall in 2005 out of Wake Forest.'),
    t('Won Rookie of the Year with the New Orleans Hornets.'),
    path(['New Orleans Hornets', 'Los Angeles Clippers', 'Houston Rockets', 'Oklahoma City Thunder', 'Phoenix Suns', 'Golden State Warriors', 'San Antonio Spurs', 'Los Angeles Clippers']),
    t('Second all-time in career assists; ran "Lob City".'),
    t('Known as "CP3" and "The Point God".')], '2010s'),
  P('starter', 'Carmelo Anthony', ['melo', 'carmelo'], ['Paul Pierce', 'Vince Carter', 'Dwyane Wade'], [
    t('Won an NCAA title as a freshman at Syracuse in 2003.'),
    t('Drafted 3rd overall in 2003 — behind LeBron James and Darko Miličić.'),
    path(['Denver Nuggets', 'New York Knicks', 'Oklahoma City Thunder', 'Houston Rockets', 'Portland Trail Blazers', 'Los Angeles Lakers']),
    awards(['Scoring champion 2013', '3× Olympic gold', '10× All-Star']),
    t('Known simply as "Melo".')], '2000s'),
  P('starter', 'Dirk Nowitzki', ['dirk', 'nowitzki'], ['Pau Gasol', 'Steve Nash', 'Peja Stojaković'], [
    t('Drafted 9th overall in 1998 by Milwaukee and traded on draft night.'),
    t('The first European player to win MVP (2007).'),
    t('Played 21 seasons with a single franchise — an NBA record.'),
    awards(['NBA Champion 2011', 'Finals MVP 2011', 'MVP 2007', '14× All-Star']),
    t('A German 7-footer famous for the one-legged fadeaway.')], '2000s'),
  P('starter', 'Russell Westbrook', ['westbrook', 'russ', 'brodie'], ['Rajon Rondo', 'John Wall', 'Derrick Rose'], [
    t('Drafted 4th overall in 2008 out of UCLA.'),
    path(['Oklahoma City Thunder', 'Houston Rockets', 'Washington Wizards', 'Los Angeles Lakers', 'Los Angeles Clippers', 'Denver Nuggets']),
    t('Averaged a triple-double over a full season four times.'),
    awards(['MVP 2017', '2× scoring champion', '3× assists leader']),
    t('The all-time leader in triple-doubles; nicknamed "Brodie".')], '2010s'),
  P('starter', 'Kawhi Leonard', ['kawhi', 'leonard', 'the klaw'], ['Paul George', 'Jimmy Butler', 'DeMar DeRozan'], [
    t('Drafted 15th overall in 2011 by Indiana and traded to San Antonio that night.'),
    path(['San Antonio Spurs', 'Toronto Raptors', 'Los Angeles Clippers']),
    t('Won Finals MVP in 2014 at age 22.'),
    t('Hit the only Game 7 series-winning buzzer-beater in NBA history (2019).'),
    t('Nicknamed "The Klaw"; two Finals MVPs with two different teams.')], '2010s'),
  P('starter', 'Kyrie Irving', ['kyrie', 'irving', 'uncle drew'], ['Isaiah Thomas', 'Kemba Walker', 'Jamal Murray'], [
    t('Born in Melbourne, Australia; played one season at Duke.'),
    t('The #1 overall pick in 2011.'),
    path(['Cleveland Cavaliers', 'Boston Celtics', 'Brooklyn Nets', 'Dallas Mavericks']),
    t('Hit the title-winning three-pointer in Game 7 of the 2016 Finals.'),
    t('Known as "Uncle Drew".')], '2010s'),
  P('starter', 'Allen Iverson', ['iverson', 'ai', 'the answer'], ['Stephon Marbury', 'Steve Francis', 'Tracy McGrady'], [
    t('The #1 overall pick in 1996 out of Georgetown.'),
    path(['Philadelphia 76ers', 'Denver Nuggets', 'Detroit Pistons', 'Memphis Grizzlies', 'Philadelphia 76ers']),
    t('Won MVP in 2001 standing just 6 feet tall.'),
    awards(['MVP 2001', '4× scoring champion', 'Rookie of the Year 1997']),
    t('"The Answer".')], '2000s'),
  P('starter', 'Damian Lillard', ['dame', 'lillard'], ['CJ McCollum', 'Kyrie Irving', 'Kemba Walker'], [
    t('Drafted 6th overall in 2012 out of Weber State.'),
    t('Won Rookie of the Year in 2013.'),
    path(['Portland Trail Blazers', 'Milwaukee Bucks', 'Portland Trail Blazers']),
    t('Hit series-ending buzzer-beaters against Houston (2014) and Oklahoma City (2019).'),
    t('"Dame Time".')], '2010s'),

  // ── PLAYERS · ALL-STAR ──
  P('allstar', 'Vince Carter', ['carter', 'vinsanity'], ['Tracy McGrady', 'Jason Richardson', 'Richard Jefferson'], [
    t('Drafted 5th overall in 1998 by Golden State and traded to Toronto on draft night.'),
    t('Played 22 seasons — more than anyone in NBA history.'),
    path(['Toronto Raptors', 'New Jersey Nets', 'Orlando Magic', 'Phoenix Suns', 'Dallas Mavericks', 'Memphis Grizzlies', 'Sacramento Kings', 'Atlanta Hawks']),
    t('Won the 2000 Slam Dunk Contest.'),
    t('"Vinsanity" / "Air Canada".')], '2000s'),
  P('allstar', 'Pau Gasol', ['gasol', 'pau'], ['Marc Gasol', 'Andrea Bargnani', 'Tony Parker'], [
    t('Drafted 3rd overall in 2001 by Atlanta and traded to Memphis.'),
    t('The first European to win Rookie of the Year.'),
    path(['Memphis Grizzlies', 'Los Angeles Lakers', 'Chicago Bulls', 'San Antonio Spurs', 'Milwaukee Bucks']),
    t('Won two championships alongside Kobe Bryant.'),
    t('A Spanish 7-footer whose younger brother was also an NBA All-Star.')], '2000s'),
  P('allstar', 'Rajon Rondo', ['rondo'], ['Kendrick Perkins', 'Tony Allen', 'Derrick Rose'], [
    t('Drafted 21st overall in 2006 by Phoenix and traded to Boston.'),
    path(['Boston Celtics', 'Dallas Mavericks', 'Sacramento Kings', 'Chicago Bulls', 'New Orleans Pelicans', 'Los Angeles Lakers', 'Atlanta Hawks', 'Los Angeles Clippers', 'Los Angeles Lakers', 'Cleveland Cavaliers']),
    t('Led the league in assists three times.'),
    t('Won two championships twelve years apart — 2008 and 2020.'),
    t('The point guard on Boston\'s Big Three championship team.')], '2010s'),
  P('allstar', 'Andre Iguodala', ['iguodala', 'iggy'], ['Shaun Livingston', 'Draymond Green', 'Harrison Barnes'], [
    t('Drafted 9th overall in 2004 out of Arizona.'),
    path(['Philadelphia 76ers', 'Denver Nuggets', 'Golden State Warriors', 'Miami Heat', 'Golden State Warriors']),
    t('Made exactly one All-Star team (2012).'),
    t('Won Finals MVP in 2015 without starting a single regular-season game.'),
    t('Four championships with Golden State.')], '2010s'),
  P('allstar', 'Chauncey Billups', ['billups', 'mr big shot'], ['Richard Hamilton', 'Ben Wallace', 'Tayshaun Prince'], [
    t('Drafted 3rd overall in 1997 by Boston.'),
    path(['Boston Celtics', 'Toronto Raptors', 'Denver Nuggets', 'Minnesota Timberwolves', 'Detroit Pistons', 'Denver Nuggets', 'New York Knicks', 'Los Angeles Clippers', 'Detroit Pistons']),
    t('Won Finals MVP in 2004.'),
    t('"Mr. Big Shot".'),
    t('Became head coach of the Portland Trail Blazers in 2021.')], '2000s'),
  P('allstar', 'Tracy McGrady', ['mcgrady', 't-mac', 'tmac', 't mac'], ['Vince Carter', 'Grant Hill', 'Yao Ming'], [
    t('Drafted 9th overall in 1997 straight out of high school.'),
    t('Played alongside his cousin in Toronto.'),
    path(['Toronto Raptors', 'Orlando Magic', 'Houston Rockets', 'New York Knicks', 'Detroit Pistons', 'Atlanta Hawks', 'San Antonio Spurs']),
    t('Scored 13 points in 33 seconds against San Antonio in 2004.'),
    t('Two-time scoring champion known as "T-Mac".')], '2000s'),
  P('allstar', 'Steve Nash', ['nash'], ['Jason Kidd', 'Mike Bibby', 'Tony Parker'], [
    t('Drafted 15th overall in 1996 by Phoenix out of Santa Clara.'),
    path(['Phoenix Suns', 'Dallas Mavericks', 'Phoenix Suns', 'Los Angeles Lakers']),
    awards(['Back-to-back MVP (2005, 2006)', '5× assists leader']),
    t('A Canadian point guard who ran the "Seven Seconds or Less" offense.'),
    t('Later coached the Brooklyn Nets.')], '2000s'),
  P('allstar', 'Ray Allen', ['allen', 'jesus shuttlesworth'], ['Reggie Miller', 'Paul Pierce', 'Kyle Korver'], [
    t('Drafted 5th overall in 1996 by Minnesota and traded to Milwaukee on draft night.'),
    path(['Milwaukee Bucks', 'Seattle SuperSonics', 'Boston Celtics', 'Miami Heat']),
    t('Starred as Jesus Shuttlesworth in the film "He Got Game".'),
    t('Hit the game-tying corner three in Game 6 of the 2013 Finals.'),
    t('Held the career three-point record until Stephen Curry passed him in 2021.')], '2000s'),
  P('allstar', 'Kevin Garnett', ['garnett', 'kg', 'big ticket'], ['Paul Pierce', 'Tim Duncan', 'Chris Webber'], [
    t('Drafted 5th overall in 1995 straight out of high school — the first prep-to-pro player in 20 years.'),
    path(['Minnesota Timberwolves', 'Boston Celtics', 'Brooklyn Nets', 'Minnesota Timberwolves']),
    t('Won MVP in 2004.'),
    t('Shouted "Anything is possible!" after winning the 2008 title.'),
    t('"The Big Ticket".')], '2000s'),
  P('allstar', 'Jason Kidd', ['kidd', 'j kidd'], ['Steve Nash', 'Gary Payton', 'Grant Hill'], [
    t('Drafted 2nd overall in 1994 out of California.'),
    path(['Dallas Mavericks', 'Phoenix Suns', 'New Jersey Nets', 'Dallas Mavericks', 'New York Knicks']),
    t('Shared Rookie of the Year honours in 1995.'),
    t('Led New Jersey to two Finals, then won a title with Dallas in 2011.'),
    t('Later coached the Bucks and Mavericks.')], '2000s'),

  // ── PLAYERS · SUPERSTAR ──
  P('superstar', 'Dominique Wilkins', ['wilkins', 'nique'], [], [
    t('Drafted 3rd overall in 1982 by Utah and traded to Atlanta before playing a game.'),
    path(['Atlanta Hawks', 'Los Angeles Clippers', 'Boston Celtics', 'San Antonio Spurs', 'Orlando Magic']),
    t('Won the 1986 scoring title.'),
    t('Dueled Larry Bird in a legendary Game 7 in 1988.'),
    t('"The Human Highlight Film".')], '1980s'),
  P('superstar', 'Gary Payton', ['payton', 'the glove'], [], [
    t('Drafted 2nd overall in 1990 out of Oregon State.'),
    t('The only point guard to win Defensive Player of the Year in the 20th century (1996).'),
    path(['Seattle SuperSonics', 'Milwaukee Bucks', 'Los Angeles Lakers', 'Boston Celtics', 'Miami Heat']),
    t('Reached the 1996 Finals against Jordan\'s 72-win Bulls.'),
    t('Won his only championship in Miami in 2006; nicknamed "The Glove".')], '1990s'),
  P('superstar', 'Chris Webber', ['webber', 'c webb', 'cwebb'], [], [
    t('Led Michigan\'s "Fab Five".'),
    t('The #1 overall pick in 1993 by Orlando — traded to Golden State on draft night for Penny Hardaway.'),
    path(['Golden State Warriors', 'Washington Bullets/Wizards', 'Sacramento Kings', 'Philadelphia 76ers', 'Detroit Pistons', 'Golden State Warriors']),
    t('Won Rookie of the Year in 1994.'),
    t('The star of the early-2000s Sacramento Kings.')], '2000s'),
  P('superstar', 'Grant Hill', ['hill'], [], [
    t('Won two NCAA championships at Duke.'),
    t('Drafted 3rd overall in 1994 and shared Rookie of the Year.'),
    path(['Detroit Pistons', 'Orlando Magic', 'Phoenix Suns', 'Los Angeles Clippers']),
    t('Ankle injuries derailed his prime after a sign-and-trade to Orlando.'),
    t('Played until age 40 and later became a broadcaster and Hawks co-owner.')], '1990s'),
  P('superstar', 'Alonzo Mourning', ['mourning', 'zo'], [], [
    t('Drafted 2nd overall in 1992 out of Georgetown.'),
    path(['Charlotte Hornets', 'Miami Heat', 'New Jersey Nets', 'Miami Heat']),
    t('Won Defensive Player of the Year twice (1999, 2000).'),
    t('Returned to play after a kidney transplant.'),
    t('Won the 2006 title as Miami\'s backup center.')], '1990s'),
  P('superstar', 'Shawn Marion', ['marion', 'the matrix'], [], [
    t('Drafted 9th overall in 1999 out of UNLV.'),
    path(['Phoenix Suns', 'Miami Heat', 'Toronto Raptors', 'Dallas Mavericks', 'Cleveland Cavaliers']),
    t('Known for one of the most unorthodox jump shots in the league.'),
    t('A key starter on the 2011 champion Mavericks.'),
    t('"The Matrix".')], '2000s'),
  P('superstar', 'Detlef Schrempf', ['schrempf'], [], [
    t('Drafted 8th overall in 1985 by Dallas.'),
    path(['Dallas Mavericks', 'Indiana Pacers', 'Seattle SuperSonics', 'Portland Trail Blazers']),
    t('Won Sixth Man of the Year twice (1991, 1992).'),
    t('Reached the 1996 Finals with Seattle.'),
    t('A German forward who later appeared as himself on Parks and Recreation.')], '1990s'),
  P('superstar', 'Baron Davis', ['davis', 'b diddy'], [], [
    t('Drafted 3rd overall in 1999 out of UCLA.'),
    path(['Charlotte / New Orleans Hornets', 'Golden State Warriors', 'Los Angeles Clippers', 'Cleveland Cavaliers', 'New York Knicks']),
    t('Led the 2007 "We Believe" Warriors to an upset of the 67-win Mavericks.'),
    t('His dunk over Andrei Kirilenko is a playoff classic.'),
    t('A two-time All-Star point guard.')], '2000s'),
  P('superstar', 'Elton Brand', ['brand'], [], [
    t('The #1 overall pick in 1999 out of Duke.'),
    t('Shared Rookie of the Year with Steve Francis.'),
    path(['Chicago Bulls', 'Los Angeles Clippers', 'Philadelphia 76ers', 'Dallas Mavericks', 'Atlanta Hawks', 'Philadelphia 76ers']),
    t('Later became general manager of the 76ers.'),
    t('A two-time All-Star power forward.')], '2000s'),
  P('superstar', 'Dennis Rodman', ['rodman', 'the worm'], [], [
    t('Drafted 27th overall in 1986 out of Southeastern Oklahoma State.'),
    path(['Detroit Pistons', 'San Antonio Spurs', 'Chicago Bulls', 'Los Angeles Lakers', 'Dallas Mavericks']),
    t('Won seven straight rebounding titles.'),
    awards(['5× NBA Champion', '2× Defensive Player of the Year']),
    t('"The Worm".')], '1990s'),

  // ── PLAYERS · LEGEND ──
  P('legend', 'Bob McAdoo', ['mcadoo'], [], [
    t('Won Rookie of the Year in 1973 with the Buffalo Braves.'),
    t('Three straight scoring titles and the 1975 MVP.'),
    path(['Buffalo Braves', 'New York Knicks', 'Boston Celtics', 'Detroit Pistons', 'New Jersey Nets', 'Los Angeles Lakers', 'Philadelphia 76ers']),
    t('Won two championships as a sixth man for the 1980s Lakers.'),
    t('Finished his playing career in Italy and later spent years as a Heat assistant coach.')], '1970s'),
  P('legend', 'Moses Malone', ['malone', 'moses'], [], [
    t('The first player to go straight from high school to the pros — in the ABA, 1974.'),
    path(['Buffalo Braves', 'Houston Rockets', 'Philadelphia 76ers', 'Washington Bullets', 'Atlanta Hawks', 'Milwaukee Bucks', 'Philadelphia 76ers', 'San Antonio Spurs'], 'NBA career path'),
    t('Won three MVP awards.'),
    t('Predicted "Fo\', fo\', fo\'" before the 1983 playoffs.'),
    t('Finals MVP for the 1983 champion 76ers.')], '1980s'),
  P('legend', 'Mark Aguirre', ['aguirre'], [], [
    t('The #1 overall pick in 1981 out of DePaul.'),
    path(['Dallas Mavericks', 'Detroit Pistons', 'Los Angeles Clippers']),
    t('Traded mid-season in 1989 for Adrian Dantley.'),
    t('Won back-to-back titles with the Bad Boys.'),
    t('A childhood friend of Isiah Thomas from Chicago.')], '1980s'),
  P('legend', 'Adrian Dantley', ['dantley'], [], [
    t('Drafted 6th overall in 1976 out of Notre Dame; Rookie of the Year in 1977.'),
    path(['Buffalo Braves', 'Indiana Pacers', 'Los Angeles Lakers', 'Utah Jazz', 'Detroit Pistons', 'Dallas Mavericks', 'Milwaukee Bucks']),
    t('Won two scoring titles with Utah.'),
    t('Traded for Mark Aguirre in 1989 — months before Detroit won the title.'),
    t('Inducted into the Hall of Fame in 2008.')], '1980s'),
  P('legend', 'Spencer Haywood', ['haywood'], [], [
    t('Won Olympic gold at 19 in 1968.'),
    t('His Supreme Court case opened the door for early entry into the NBA.'),
    path(['Seattle SuperSonics', 'New York Knicks', 'New Orleans Jazz', 'Los Angeles Lakers', 'Washington Bullets']),
    t('Won a championship with the 1980 Lakers.'),
    t('Seattle retired his #24.')], '1970s'),
  P('legend', 'Paul Westphal', ['westphal'], [], [
    t('Drafted 10th overall in 1972 by Boston.'),
    path(['Boston Celtics', 'Phoenix Suns', 'Seattle SuperSonics', 'New York Knicks', 'Phoenix Suns']),
    t('Won the 1974 championship as a Celtics reserve.'),
    t('A five-time All-Star in Phoenix.'),
    t('Later coached the Suns to the 1993 Finals against Chicago.')], '1970s'),
  P('legend', 'Bernard King', ['king'], [], [
    t('Drafted 7th overall in 1977 out of Tennessee.'),
    path(['New Jersey Nets', 'Utah Jazz', 'Golden State Warriors', 'New York Knicks', 'Washington Bullets', 'New Jersey Nets']),
    t('Won the 1985 scoring title.'),
    t('Returned to All-Star level after a devastating knee injury.'),
    t('Scored 60 points on Christmas Day 1984.')], '1980s'),

  // ── COACHES · ROOKIE ──
  C('rookie', 'Phil Jackson', ['jackson', 'zen master'], ['Pat Riley', 'Gregg Popovich', 'Steve Kerr'], [
    t('Won two championships as a player with the New York Knicks.'),
    t('Coached the Albany Patroons to a CBA title before reaching the NBA.'),
    path(['Chicago Bulls', 'Los Angeles Lakers'], 'Coaching path'),
    awards(['11× NBA Champion as head coach', 'Coach of the Year 1996']),
    t('Ran the triangle offense; nicknamed the "Zen Master".')], '1990s'),
  C('rookie', 'Pat Riley', ['riley'], ['Phil Jackson', 'Chuck Daly', 'Larry Brown'], [
    t('Played on the 1972 champion Lakers.'),
    path(['Los Angeles Lakers', 'New York Knicks', 'Miami Heat'], 'Coaching path'),
    t('Trademarked the phrase "three-peat".'),
    t('Coached the Showtime Lakers to four championships.'),
    t('Later ran the Heat front office; famous for the slicked-back hair and Armani suits.')], '1980s'),
  C('rookie', 'Gregg Popovich', ['popovich', 'pop'], ['Jerry Sloan', 'Don Nelson', 'Rick Carlisle'], [
    t('Graduated from the Air Force Academy and served five years in the military.'),
    t('Named himself head coach in 1996 while serving as general manager.'),
    t('Coached a single franchise for 29 seasons.'),
    awards(['5× NBA Champion', '3× Coach of the Year', 'Most regular-season wins ever']),
    t('San Antonio Spurs.')], '2000s'),
  C('rookie', 'Steve Kerr', ['kerr'], ['Mark Jackson', 'Mike Budenholzer', 'Doc Rivers'], [
    t('Hit the title-winning shot in Game 6 of the 1997 Finals — as a player.'),
    t('Won five championships as a player with Chicago and San Antonio.'),
    t('Was the Suns\' general manager and a TNT broadcaster before ever coaching.'),
    t('His team went 73–9 in his second season.'),
    t('Four championships as head coach of the Golden State Warriors.')], '2010s'),

  // ── COACHES · STARTER ──
  C('starter', 'Doc Rivers', ['rivers', 'doc'], ['Tom Thibodeau', 'Rick Carlisle', 'Mike D\'Antoni'], [
    t('Won Coach of the Year in 2000 with Orlando.'),
    path(['Orlando Magic', 'Boston Celtics', 'Los Angeles Clippers', 'Philadelphia 76ers', 'Milwaukee Bucks'], 'Coaching path'),
    t('A 13-year playing career, mostly with Atlanta.'),
    t('Coached the 2008 champion Celtics.'),
    t('Preached "Ubuntu" to his Big Three.')], '2000s'),
  C('starter', 'Rick Carlisle', ['carlisle'], ['Frank Vogel', 'Nate McMillan', 'Jason Kidd'], [
    t('Won the 1986 title as a Celtics reserve.'),
    path(['Detroit Pistons', 'Indiana Pacers', 'Dallas Mavericks', 'Indiana Pacers'], 'Coaching path'),
    t('Coach of the Year in 2002.'),
    t('Coached Dirk Nowitzki to the 2011 championship.'),
    t('Led Indiana to the 2025 Finals.')], '2010s'),
  C('starter', 'Erik Spoelstra', ['spoelstra', 'spo'], ['Stan Van Gundy', 'Nick Nurse', 'Michael Malone'], [
    t('Started his NBA career in a video room.'),
    t('Filipino-American; has never coached another NBA franchise.'),
    t('Won back-to-back titles in 2012 and 2013.'),
    t('Six Finals appearances with one franchise, including two as a #5 and #8 seed.'),
    t('Miami Heat.')], '2010s'),
  C('starter', 'Mike D\'Antoni', ['dantoni', 'd antoni'], ['George Karl', 'Alvin Gentry', 'Terry Stotts'], [
    t('A star player and coach for Olimpia Milano in Italy.'),
    path(['Denver Nuggets', 'Phoenix Suns', 'New York Knicks', 'Los Angeles Lakers', 'Houston Rockets'], 'Coaching path'),
    t('Two Coach of the Year awards, twelve years apart (2005, 2017).'),
    t('"Seven Seconds or Less".'),
    t('Coached MVP seasons for both Steve Nash and James Harden.')], '2000s'),

  // ── COACHES · ALL-STAR ──
  C('allstar', 'Larry Brown', ['brown'], ['Chuck Daly', 'George Karl', 'Rick Adelman'], [
    t('The only coach to win both an NCAA championship and an NBA championship.'),
    path(['Denver Nuggets', 'New Jersey Nets', 'San Antonio Spurs', 'Los Angeles Clippers', 'Indiana Pacers', 'Philadelphia 76ers', 'Detroit Pistons', 'New York Knicks', 'Charlotte Bobcats'], 'NBA coaching path'),
    t('Coached Allen Iverson\'s 76ers to the 2001 Finals.'),
    t('Won the 2004 title with a Detroit team without a superstar.'),
    t('Also coached in the ABA and won the 1988 NCAA title at Kansas.')], '2000s'),
  C('allstar', 'Rudy Tomjanovich', ['tomjanovich', 'rudy t'], ['Del Harris', 'Jeff Van Gundy', 'Kevin McHale'], [
    t('Was punched by Kermit Washington in one of the most infamous incidents in league history (1977).'),
    t('A five-time All-Star as a player for Houston.'),
    path(['Houston Rockets', 'Los Angeles Lakers'], 'Coaching path'),
    t('Won back-to-back titles in 1994 and 1995.'),
    t('"Never underestimate the heart of a champion."')], '1990s'),
  C('allstar', 'Chuck Daly', ['daly'], ['Larry Brown', 'Pat Riley', 'Lenny Wilkens'], [
    t('Coached at the University of Pennsylvania for six seasons.'),
    path(['Cleveland Cavaliers', 'Detroit Pistons', 'New Jersey Nets', 'Orlando Magic'], 'Coaching path'),
    t('Coached the 1992 Olympic Dream Team.'),
    t('Won back-to-back championships in 1989 and 1990.'),
    t('The coach of the "Bad Boys".')], '1980s'),
  C('allstar', 'Nick Nurse', ['nurse'], ['Dwane Casey', 'Quin Snyder', 'Taylor Jenkins'], [
    t('Spent more than a decade coaching in the British Basketball League.'),
    t('Won two G League championships with Iowa and Rio Grande Valley.'),
    t('Was an assistant for five seasons before getting the same team\'s head job.'),
    t('Won the championship in his first season as an NBA head coach (2019).'),
    path(['Toronto Raptors', 'Philadelphia 76ers'], 'Coaching path')], '2010s'),

  // ── COACHES · SUPERSTAR / LEGEND ──
  C('superstar', 'Lenny Wilkens', ['wilkens'], [], [
    t('Served as player-coach for both Seattle and Portland.'),
    path(['Seattle SuperSonics', 'Portland Trail Blazers', 'Seattle SuperSonics', 'Cleveland Cavaliers', 'Atlanta Hawks', 'Toronto Raptors', 'New York Knicks'], 'Coaching path'),
    t('Won the 1979 championship with Seattle.'),
    t('Coached the 1996 Olympic Dream Team.'),
    t('In the Hall of Fame as both a player and a coach.')], '1970s'),
  C('superstar', 'Don Nelson', ['nelson', 'nellie'], [], [
    t('Won five championships as a Celtics player.'),
    path(['Milwaukee Bucks', 'Golden State Warriors', 'New York Knicks', 'Dallas Mavericks', 'Golden State Warriors'], 'Coaching path'),
    t('Three Coach of the Year awards.'),
    t('Pioneered small-ball — "Nellie Ball".'),
    t('Coached the 2007 "We Believe" Warriors.')], '1990s'),
  C('legend', 'Bill Fitch', ['fitch'], [], [
    t('Coached the Cleveland Cavaliers in their first-ever season (1970–71).'),
    path(['Cleveland Cavaliers', 'Boston Celtics', 'Houston Rockets', 'New Jersey Nets', 'Los Angeles Clippers'], 'Coaching path'),
    t('Coached Larry Bird\'s rookie season.'),
    t('Won the 1981 championship.'),
    t('Took Houston to the 1986 Finals.')], '1980s'),
  C('legend', 'Rick Adelman', ['adelman'], [], [
    t('Was an original member of the Portland Trail Blazers as a player (1970).'),
    path(['Portland Trail Blazers', 'Golden State Warriors', 'Sacramento Kings', 'Houston Rockets', 'Minnesota Timberwolves'], 'Coaching path'),
    t('Reached two Finals with Portland (1990, 1992).'),
    t('Coached the early-2000s Sacramento Kings.'),
    t('One of only a handful of coaches with 1,000 career wins.')], '2000s'),
  C('legend', 'Jack Ramsay', ['ramsay', 'dr jack'], [], [
    t('Coached Saint Joseph\'s University for 11 seasons.'),
    path(['Philadelphia 76ers', 'Buffalo Braves', 'Portland Trail Blazers', 'Indiana Pacers'], 'Coaching path'),
    t('Famous for his loud plaid trousers.'),
    t('Won the 1977 championship with Bill Walton.'),
    t('Later a long-time broadcaster known as "Dr. Jack".')], '1970s'),
  C('superstar', 'Mike Brown', ['brown'], [], [
    t('Won Coach of the Year in 2009.'),
    path(['Cleveland Cavaliers', 'Los Angeles Lakers', 'Cleveland Cavaliers', 'Sacramento Kings', 'New York Knicks'], 'Coaching path'),
    t('Coached LeBron James to his first Finals in 2007.'),
    t('Won titles as an assistant under Gregg Popovich and Steve Kerr.'),
    t('Won a second, unanimous Coach of the Year award in 2023.')], '2010s'),
];

// ── Engine ───────────────────────────────────────────
export function seededRandom(seed) { let s = 0; for (const c of String(seed)) s = (s * 31 + c.charCodeAt(0)) >>> 0; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }
export function shuffle(arr, rnd = Math.random) { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }

// skill: last game's correct count (0–20) or null → shifts tier weights (adaptive difficulty).
export function tierWeights(skill) {
  const w = { rookie: 4, starter: 4, allstar: 4, superstar: 4, legend: 4 };
  if (skill == null) return w;
  if (skill >= 15) { w.rookie = 2; w.starter = 3; w.superstar = 5; w.legend = 6; }
  else if (skill <= 8) { w.rookie = 6; w.starter = 5; w.superstar = 3; w.legend = 2; }
  return w;
}
// kind: 'player' | 'coach' | 'both'; variant: 'classic' | 'path' | 'reverse' | 'one'
export function pickMystery({ kind = 'player', variant = 'classic', count = 20, skill = null, exclude = new Set(), seed = null } = {}) {
  const rnd = seed == null ? Math.random : seededRandom(seed);
  let pool = PEOPLE.filter(p => (kind === 'both' || p.kind === kind) && !exclude.has(p.id));
  if (variant === 'path' || variant === 'reverse') pool = pool.filter(p => p.clues.some(c => c.type === 'path' && c.teams.length >= 2));
  if (pool.length < count) pool = PEOPLE.filter(p => kind === 'both' || p.kind === kind);
  const w = tierWeights(skill);
  const byTier = {}; TIERS.forEach(tt => byTier[tt] = shuffle(pool.filter(p => p.tier === tt), rnd));
  const out = [];
  while (out.length < Math.min(count, pool.length)) {
    const avail = TIERS.filter(tt => byTier[tt].length);
    const total = avail.reduce((a, tt) => a + w[tt], 0);
    let r = rnd() * total, pick = avail[0];
    for (const tt of avail) { r -= w[tt]; if (r <= 0) { pick = tt; break; } }
    out.push(byTier[pick].pop());
  }
  return out.map(p => buildQuestion(p, variant, rnd));
}
function buildQuestion(p, variant, rnd) {
  let clues = p.clues.slice();
  const pi = clues.findIndex(c => c.type === 'path');
  if ((variant === 'path' || variant === 'reverse') && pi >= 0) {
    const pc = { ...clues[pi] }; if (variant === 'reverse') { pc.teams = pc.teams.slice().reverse(); pc.label = (pc.label || 'Career path') + ' — reversed'; }
    clues = [pc, ...clues.filter((_, i) => i !== pi)];
  }
  if (variant === 'one') clues = [clues.find(c => c.type === 'text') || clues[0]];
  // Multiple choice for rookie/starter; coin-flip for all-star; free text above.
  const mc = p.decoys.length >= 3 && (p.tier === 'rookie' || p.tier === 'starter' || (p.tier === 'allstar' && rnd() < .5));
  const options = mc ? shuffle([p.name, ...p.decoys.slice(0, 3)], rnd) : null;
  return { ...p, clues, options, points: variant === 'one' ? [ONE_CLUE_POINTS] : POINTS.slice(0, clues.length) };
}
const norm = s => String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9 ]/g, '').replace(/\s+/g, ' ').trim();
function lev(a, b) { const m = a.length, k = b.length, d = Array.from({ length: m + 1 }, (_, i) => [i, ...Array(k).fill(0)]); for (let j = 1; j <= k; j++) d[0][j] = j; for (let i = 1; i <= m; i++) for (let j = 1; j <= k; j++) d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)); return d[m][k]; }
export function matches(guess, person) {
  const g = norm(guess); if (!g) return false;
  const full = norm(person.name), last = full.split(' ').pop();
  if (g === full || person.accept.some(a => norm(a) === g)) return true;
  if (g === last && last.length >= 4) return true;
  return lev(g, full) <= Math.max(1, Math.floor(full.length / 6));
}
// A guess typed in Arabic, checked against the Arabic spelling of the name:
// hamza and alef forms, taa marbuta / haa and yaa / alef maqsura count as the
// same letter, and short vowels, tatweel, spaces and dashes are ignored.
const normAr = s => String(s || '').normalize('NFKC').replace(/[\u064B-\u065F\u0670\u0640]/g, '')
  .replace(/[أإآٱ]/g, 'ا').replace(/ة/g, 'ه').replace(/ى/g, 'ي').replace(/ؤ/g, 'و').replace(/ئ/g, 'ي')
  .replace(/[^\u0621-\u064A0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
export function matchesAr(guess, arName) {
  const g = normAr(guess); if (!g || !arName) return false;
  const full = normAr(arName), last = full.split(' ').pop(), flat = x => x.replace(/ /g, '');
  if (g === full || flat(g) === flat(full)) return true;
  if (g === last && last.length >= 4) return true;
  return lev(flat(g), flat(full)) <= Math.max(1, Math.floor(flat(full).length / 6));
}
export const mysteryTitle = c => c <= 5 ? 'CASUAL FAN' : c <= 10 ? 'NBA FAN' : c <= 14 ? 'HOOPS EXPERT' : c <= 17 ? 'NBA HISTORIAN' : c <= 19 ? 'NBA ENCYCLOPEDIA' : 'BASKETBALL ORACLE';
