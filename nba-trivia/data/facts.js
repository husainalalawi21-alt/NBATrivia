import * as A from './ar.js';
// ════════════════════════════════════════════════════════════════
// facts.js — VERIFIED FACT TABLE → KNOWLEDGE POINTS → QUESTIONS
//
// Fact-first generation, per the content spec: nothing here is a reworded
// variation. Each row is source data; each COLUMN of each row is one
// knowledge point; each knowledge point yields at most ONE question.
// Distractors are drawn from the same column (era-plausible by construction).
//
// Add a season row or a draft row and the bank grows by exactly the number
// of new verified facts — never by rewording.
// ════════════════════════════════════════════════════════════════

// [season, champion, runnerUp, finalsMVP, mvp, championCoach, roy, scoringLeader]
// 1946–47 to 1948–49 were BAA seasons; the NBA counts them as its own history.
export const SEASONS = [
  ['1946-47', 'Philadelphia Warriors', 'Chicago Stags', null, null, 'Eddie Gottlieb', null, 'Joe Fulks'],
  ['1947-48', 'Baltimore Bullets', 'Philadelphia Warriors', null, null, 'Buddy Jeannette', null, 'Max Zaslofsky'],
  ['1948-49', 'Minneapolis Lakers', 'Washington Capitols', null, null, 'John Kundla', null, 'George Mikan'],
  ['1949-50', 'Minneapolis Lakers', 'Syracuse Nationals', null, null, 'John Kundla', null, 'George Mikan'],
  ['1950-51', 'Rochester Royals', 'New York Knicks', null, null, 'Les Harrison', null, 'George Mikan'],
  ['1951-52', 'Minneapolis Lakers', 'New York Knicks', null, null, 'John Kundla', null, 'Paul Arizin'],
  ['1952-53', 'Minneapolis Lakers', 'New York Knicks', null, null, 'John Kundla', 'Don Meineke', 'Neil Johnston'],
  ['1953-54', 'Minneapolis Lakers', 'Syracuse Nationals', null, null, 'John Kundla', 'Ray Felix', 'Neil Johnston'],
  ['1954-55', 'Syracuse Nationals', 'Fort Wayne Pistons', null, null, 'Al Cervi', 'Bob Pettit', 'Neil Johnston'],
  ['1955-56', 'Philadelphia Warriors', 'Fort Wayne Pistons', null, 'Bob Pettit', 'George Senesky', 'Maurice Stokes', 'Bob Pettit'],
  ['1956-57', 'Boston Celtics', 'St. Louis Hawks', null, 'Bob Cousy', 'Red Auerbach', 'Tom Heinsohn', 'Paul Arizin'],
  ['1957-58', 'St. Louis Hawks', 'Boston Celtics', null, 'Bill Russell', 'Alex Hannum', 'Woody Sauldsberry', 'George Yardley'],
  ['1958-59', 'Boston Celtics', 'Minneapolis Lakers', null, 'Bob Pettit', 'Red Auerbach', 'Elgin Baylor', 'Bob Pettit'],
  ['1959-60', 'Boston Celtics', 'St. Louis Hawks', null, 'Wilt Chamberlain', 'Red Auerbach', 'Wilt Chamberlain', 'Wilt Chamberlain'],
  ['1960-61', 'Boston Celtics', 'St. Louis Hawks', null, 'Bill Russell', 'Red Auerbach', 'Oscar Robertson', 'Wilt Chamberlain'],
  ['1961-62', 'Boston Celtics', 'Los Angeles Lakers', null, 'Bill Russell', 'Red Auerbach', 'Walt Bellamy', 'Wilt Chamberlain'],
  ['1962-63', 'Boston Celtics', 'Los Angeles Lakers', null, 'Bill Russell', 'Red Auerbach', 'Terry Dischinger', 'Wilt Chamberlain'],
  ['1963-64', 'Boston Celtics', 'San Francisco Warriors', null, 'Oscar Robertson', 'Red Auerbach', 'Jerry Lucas', 'Wilt Chamberlain'],
  ['1964-65', 'Boston Celtics', 'Los Angeles Lakers', null, 'Bill Russell', 'Red Auerbach', 'Willis Reed', 'Wilt Chamberlain'],
  ['1965-66', 'Boston Celtics', 'Los Angeles Lakers', null, 'Wilt Chamberlain', 'Red Auerbach', 'Rick Barry', 'Wilt Chamberlain'],
  ['1966-67', 'Philadelphia 76ers', 'San Francisco Warriors', null, 'Wilt Chamberlain', 'Alex Hannum', 'Dave Bing', 'Rick Barry'],
  ['1967-68', 'Boston Celtics', 'Los Angeles Lakers', null, 'Wilt Chamberlain', 'Bill Russell', 'Earl Monroe', 'Dave Bing'],
  ['1968-69', 'Boston Celtics', 'Los Angeles Lakers', 'Jerry West', 'Wes Unseld', 'Bill Russell', 'Wes Unseld', 'Elvin Hayes'],
  ['1969-70', 'New York Knicks', 'Los Angeles Lakers', 'Willis Reed', 'Willis Reed', 'Red Holzman', 'Kareem Abdul-Jabbar', 'Jerry West'],
  ['1970-71', 'Milwaukee Bucks', 'Baltimore Bullets', 'Kareem Abdul-Jabbar', 'Kareem Abdul-Jabbar', 'Larry Costello', 'Dave Cowens', 'Kareem Abdul-Jabbar'],
  ['1971-72', 'Los Angeles Lakers', 'New York Knicks', 'Wilt Chamberlain', 'Kareem Abdul-Jabbar', 'Bill Sharman', 'Sidney Wicks', 'Kareem Abdul-Jabbar'],
  ['1972-73', 'New York Knicks', 'Los Angeles Lakers', 'Willis Reed', 'Dave Cowens', 'Red Holzman', 'Bob McAdoo', 'Nate Archibald'],
  ['1973-74', 'Boston Celtics', 'Milwaukee Bucks', 'John Havlicek', 'Kareem Abdul-Jabbar', 'Tom Heinsohn', 'Ernie DiGregorio', 'Bob McAdoo'],
  ['1974-75', 'Golden State Warriors', 'Washington Bullets', 'Rick Barry', 'Bob McAdoo', 'Al Attles', 'Jamaal Wilkes', 'Bob McAdoo'],
  ['1975-76', 'Boston Celtics', 'Phoenix Suns', 'Jo Jo White', 'Kareem Abdul-Jabbar', 'Tom Heinsohn', 'Alvan Adams', 'Bob McAdoo'],
  ['1976-77', 'Portland Trail Blazers', 'Philadelphia 76ers', 'Bill Walton', 'Kareem Abdul-Jabbar', 'Jack Ramsay', 'Adrian Dantley', 'Pete Maravich'],
  ['1977-78', 'Washington Bullets', 'Seattle SuperSonics', 'Wes Unseld', 'Bill Walton', 'Dick Motta', 'Walter Davis', 'George Gervin'],
  ['1978-79', 'Seattle SuperSonics', 'Washington Bullets', 'Dennis Johnson', 'Moses Malone', 'Lenny Wilkens', 'Phil Ford', 'George Gervin'],
  ['1979-80', 'Los Angeles Lakers', 'Philadelphia 76ers', 'Magic Johnson', 'Kareem Abdul-Jabbar', 'Paul Westhead', 'Larry Bird', 'George Gervin'],
  ['1980-81', 'Boston Celtics', 'Houston Rockets', 'Cedric Maxwell', 'Julius Erving', 'Bill Fitch', 'Darrell Griffith', 'Adrian Dantley'],
  ['1981-82', 'Los Angeles Lakers', 'Philadelphia 76ers', 'Magic Johnson', 'Moses Malone', 'Pat Riley', 'Buck Williams', 'George Gervin'],
  ['1982-83', 'Philadelphia 76ers', 'Los Angeles Lakers', 'Moses Malone', 'Moses Malone', 'Billy Cunningham', 'Terry Cummings', 'Alex English'],
  ['1983-84', 'Boston Celtics', 'Los Angeles Lakers', 'Larry Bird', 'Larry Bird', 'K.C. Jones', 'Ralph Sampson', 'Adrian Dantley'],
  ['1984-85', 'Los Angeles Lakers', 'Boston Celtics', 'Kareem Abdul-Jabbar', 'Larry Bird', 'Pat Riley', 'Michael Jordan', 'Bernard King'],
  ['1985-86', 'Boston Celtics', 'Houston Rockets', 'Larry Bird', 'Larry Bird', 'K.C. Jones', 'Patrick Ewing', 'Dominique Wilkins'],
  ['1986-87', 'Los Angeles Lakers', 'Boston Celtics', 'Magic Johnson', 'Magic Johnson', 'Pat Riley', 'Chuck Person', 'Michael Jordan'],
  ['1987-88', 'Los Angeles Lakers', 'Detroit Pistons', 'James Worthy', 'Michael Jordan', 'Pat Riley', 'Mark Jackson', 'Michael Jordan'],
  ['1988-89', 'Detroit Pistons', 'Los Angeles Lakers', 'Joe Dumars', 'Magic Johnson', 'Chuck Daly', 'Mitch Richmond', 'Michael Jordan'],
  ['1989-90', 'Detroit Pistons', 'Portland Trail Blazers', 'Isiah Thomas', 'Magic Johnson', 'Chuck Daly', 'David Robinson', 'Michael Jordan'],
  ['1990-91', 'Chicago Bulls', 'Los Angeles Lakers', 'Michael Jordan', 'Michael Jordan', 'Phil Jackson', 'Derrick Coleman', 'Michael Jordan'],
  ['1991-92', 'Chicago Bulls', 'Portland Trail Blazers', 'Michael Jordan', 'Michael Jordan', 'Phil Jackson', 'Larry Johnson', 'Michael Jordan'],
  ['1992-93', 'Chicago Bulls', 'Phoenix Suns', 'Michael Jordan', 'Charles Barkley', 'Phil Jackson', "Shaquille O'Neal", 'Michael Jordan'],
  ['1993-94', 'Houston Rockets', 'New York Knicks', 'Hakeem Olajuwon', 'Hakeem Olajuwon', 'Rudy Tomjanovich', 'Chris Webber', 'David Robinson'],
  ['1994-95', 'Houston Rockets', 'Orlando Magic', 'Hakeem Olajuwon', 'David Robinson', 'Rudy Tomjanovich', null, "Shaquille O'Neal"],
  ['1995-96', 'Chicago Bulls', 'Seattle SuperSonics', 'Michael Jordan', 'Michael Jordan', 'Phil Jackson', 'Damon Stoudamire', 'Michael Jordan'],
  ['1996-97', 'Chicago Bulls', 'Utah Jazz', 'Michael Jordan', 'Karl Malone', 'Phil Jackson', 'Allen Iverson', 'Michael Jordan'],
  ['1997-98', 'Chicago Bulls', 'Utah Jazz', 'Michael Jordan', 'Michael Jordan', 'Phil Jackson', 'Tim Duncan', 'Michael Jordan'],
  ['1998-99', 'San Antonio Spurs', 'New York Knicks', 'Tim Duncan', 'Karl Malone', 'Gregg Popovich', 'Vince Carter', 'Allen Iverson'],
  ['1999-00', 'Los Angeles Lakers', 'Indiana Pacers', "Shaquille O'Neal", "Shaquille O'Neal", 'Phil Jackson', null, "Shaquille O'Neal"],
  ['2000-01', 'Los Angeles Lakers', 'Philadelphia 76ers', "Shaquille O'Neal", 'Allen Iverson', 'Phil Jackson', 'Mike Miller', 'Allen Iverson'],
  ['2001-02', 'Los Angeles Lakers', 'New Jersey Nets', "Shaquille O'Neal", 'Tim Duncan', 'Phil Jackson', 'Pau Gasol', 'Allen Iverson'],
  ['2002-03', 'San Antonio Spurs', 'New Jersey Nets', 'Tim Duncan', 'Tim Duncan', 'Gregg Popovich', "Amar'e Stoudemire", 'Tracy McGrady'],
  ['2003-04', 'Detroit Pistons', 'Los Angeles Lakers', 'Chauncey Billups', 'Kevin Garnett', 'Larry Brown', 'LeBron James', 'Tracy McGrady'],
  ['2004-05', 'San Antonio Spurs', 'Detroit Pistons', 'Tim Duncan', 'Steve Nash', 'Gregg Popovich', 'Emeka Okafor', 'Allen Iverson'],
  ['2005-06', 'Miami Heat', 'Dallas Mavericks', 'Dwyane Wade', 'Steve Nash', 'Pat Riley', 'Chris Paul', 'Kobe Bryant'],
  ['2006-07', 'San Antonio Spurs', 'Cleveland Cavaliers', 'Tony Parker', 'Dirk Nowitzki', 'Gregg Popovich', 'Brandon Roy', 'Kobe Bryant'],
  ['2007-08', 'Boston Celtics', 'Los Angeles Lakers', 'Paul Pierce', 'Kobe Bryant', 'Doc Rivers', 'Kevin Durant', 'LeBron James'],
  ['2008-09', 'Los Angeles Lakers', 'Orlando Magic', 'Kobe Bryant', 'LeBron James', 'Phil Jackson', 'Derrick Rose', 'Dwyane Wade'],
  ['2009-10', 'Los Angeles Lakers', 'Boston Celtics', 'Kobe Bryant', 'LeBron James', 'Phil Jackson', 'Tyreke Evans', 'Kevin Durant'],
  ['2010-11', 'Dallas Mavericks', 'Miami Heat', 'Dirk Nowitzki', 'Derrick Rose', 'Rick Carlisle', 'Blake Griffin', 'Kevin Durant'],
  ['2011-12', 'Miami Heat', 'Oklahoma City Thunder', 'LeBron James', 'LeBron James', 'Erik Spoelstra', 'Kyrie Irving', 'Kevin Durant'],
  ['2012-13', 'Miami Heat', 'San Antonio Spurs', 'LeBron James', 'LeBron James', 'Erik Spoelstra', 'Damian Lillard', 'Carmelo Anthony'],
  ['2013-14', 'San Antonio Spurs', 'Miami Heat', 'Kawhi Leonard', 'Kevin Durant', 'Gregg Popovich', 'Michael Carter-Williams', 'Kevin Durant'],
  ['2014-15', 'Golden State Warriors', 'Cleveland Cavaliers', 'Andre Iguodala', 'Stephen Curry', 'Steve Kerr', 'Andrew Wiggins', 'Russell Westbrook'],
  ['2015-16', 'Cleveland Cavaliers', 'Golden State Warriors', 'LeBron James', 'Stephen Curry', 'Tyronn Lue', 'Karl-Anthony Towns', 'Stephen Curry'],
  ['2016-17', 'Golden State Warriors', 'Cleveland Cavaliers', 'Kevin Durant', 'Russell Westbrook', 'Steve Kerr', 'Malcolm Brogdon', 'Russell Westbrook'],
  ['2017-18', 'Golden State Warriors', 'Cleveland Cavaliers', 'Kevin Durant', 'James Harden', 'Steve Kerr', 'Ben Simmons', 'James Harden'],
  ['2018-19', 'Toronto Raptors', 'Golden State Warriors', 'Kawhi Leonard', 'Giannis Antetokounmpo', 'Nick Nurse', 'Luka Dončić', 'James Harden'],
  ['2019-20', 'Los Angeles Lakers', 'Miami Heat', 'LeBron James', 'Giannis Antetokounmpo', 'Frank Vogel', 'Ja Morant', 'James Harden'],
  ['2020-21', 'Milwaukee Bucks', 'Phoenix Suns', 'Giannis Antetokounmpo', 'Nikola Jokić', 'Mike Budenholzer', 'LaMelo Ball', 'Stephen Curry'],
  ['2021-22', 'Golden State Warriors', 'Boston Celtics', 'Stephen Curry', 'Nikola Jokić', 'Steve Kerr', 'Scottie Barnes', 'Joel Embiid'],
  ['2022-23', 'Denver Nuggets', 'Miami Heat', 'Nikola Jokić', 'Joel Embiid', 'Michael Malone', 'Paolo Banchero', 'Joel Embiid'],
  ['2023-24', 'Boston Celtics', 'Dallas Mavericks', 'Jaylen Brown', 'Nikola Jokić', 'Joe Mazzulla', 'Victor Wembanyama', 'Luka Dončić'],
  ['2024-25', 'Oklahoma City Thunder', 'Indiana Pacers', 'Shai Gilgeous-Alexander', 'Shai Gilgeous-Alexander', 'Mark Daigneault', 'Stephon Castle', 'Shai Gilgeous-Alexander'],
];

// [draftYear, firstPick, draftingTeam, secondPick]
export const DRAFTS = [
  [1984, 'Hakeem Olajuwon', 'Houston Rockets', 'Sam Bowie'],
  [1985, 'Patrick Ewing', 'New York Knicks', 'Wayman Tisdale'],
  [1986, 'Brad Daugherty', 'Cleveland Cavaliers', 'Len Bias'],
  [1987, 'David Robinson', 'San Antonio Spurs', 'Armen Gilliam'],
  [1988, 'Danny Manning', 'Los Angeles Clippers', 'Rik Smits'],
  [1989, 'Pervis Ellison', 'Sacramento Kings', 'Danny Ferry'],
  [1990, 'Derrick Coleman', 'New Jersey Nets', 'Gary Payton'],
  [1991, 'Larry Johnson', 'Charlotte Hornets', 'Kenny Anderson'],
  [1992, "Shaquille O'Neal", 'Orlando Magic', 'Alonzo Mourning'],
  [1993, 'Chris Webber', 'Orlando Magic', 'Shawn Bradley'],
  [1994, 'Glenn Robinson', 'Milwaukee Bucks', 'Jason Kidd'],
  [1995, 'Joe Smith', 'Golden State Warriors', 'Antonio McDyess'],
  [1996, 'Allen Iverson', 'Philadelphia 76ers', 'Marcus Camby'],
  [1997, 'Tim Duncan', 'San Antonio Spurs', 'Keith Van Horn'],
  [1998, 'Michael Olowokandi', 'Los Angeles Clippers', 'Mike Bibby'],
  [1999, 'Elton Brand', 'Chicago Bulls', 'Steve Francis'],
  [2000, 'Kenyon Martin', 'New Jersey Nets', 'Stromile Swift'],
  [2001, 'Kwame Brown', 'Washington Wizards', 'Tyson Chandler'],
  [2002, 'Yao Ming', 'Houston Rockets', 'Jay Williams'],
  [2003, 'LeBron James', 'Cleveland Cavaliers', 'Darko Miličić'],
  [2004, 'Dwight Howard', 'Orlando Magic', 'Emeka Okafor'],
  [2005, 'Andrew Bogut', 'Milwaukee Bucks', 'Marvin Williams'],
  [2006, 'Andrea Bargnani', 'Toronto Raptors', 'LaMarcus Aldridge'],
  [2007, 'Greg Oden', 'Portland Trail Blazers', 'Kevin Durant'],
  [2008, 'Derrick Rose', 'Chicago Bulls', 'Michael Beasley'],
  [2009, 'Blake Griffin', 'Los Angeles Clippers', 'Hasheem Thabeet'],
  [2010, 'John Wall', 'Washington Wizards', 'Evan Turner'],
  [2011, 'Kyrie Irving', 'Cleveland Cavaliers', 'Derrick Williams'],
  [2012, 'Anthony Davis', 'New Orleans Hornets', 'Michael Kidd-Gilchrist'],
  [2013, 'Anthony Bennett', 'Cleveland Cavaliers', 'Victor Oladipo'],
  [2014, 'Andrew Wiggins', 'Cleveland Cavaliers', 'Jabari Parker'],
  [2015, 'Karl-Anthony Towns', 'Minnesota Timberwolves', "D'Angelo Russell"],
  [2016, 'Ben Simmons', 'Philadelphia 76ers', 'Brandon Ingram'],
  [2017, 'Markelle Fultz', 'Philadelphia 76ers', 'Lonzo Ball'],
  [2018, 'Deandre Ayton', 'Phoenix Suns', 'Marvin Bagley III'],
  [2019, 'Zion Williamson', 'New Orleans Pelicans', 'Ja Morant'],
  [2020, 'Anthony Edwards', 'Minnesota Timberwolves', 'James Wiseman'],
  [2021, 'Cade Cunningham', 'Detroit Pistons', 'Jalen Green'],
  [2022, 'Paolo Banchero', 'Orlando Magic', 'Chet Holmgren'],
  [2023, 'Victor Wembanyama', 'San Antonio Spurs', 'Brandon Miller'],
  [2024, 'Zaccharie Risacher', 'Atlanta Hawks', 'Alexandre Sarr'],
  [2025, 'Cooper Flagg', 'Dallas Mavericks', 'Dylan Harper']
];

// [holder, record, value, detail]
export const RECORDS = [
  ['Wilt Chamberlain', 'most points in a single game', '100', 'Against the New York Knicks in Hershey, Pennsylvania, March 2, 1962.'],
  ['Wilt Chamberlain', 'most rebounds in a single game', '55', "Against Bill Russell's Celtics in 1960."],
  ['Wilt Chamberlain', 'highest single-season scoring average', '50.4 points per game', 'The 1961–62 season.'],
  ['Wilt Chamberlain', 'most career rebounds', '23,924', 'Across 14 seasons.'],
  ['Scott Skiles', 'most assists in a single game', '30', 'For Orlando against Denver in 1990.'],
  ['Elmore Smith', 'most blocks in a single game', '17', 'For the Lakers in 1973.'],
  ['John Stockton', 'most career assists', '15,806', 'All with Utah.'],
  ['John Stockton', 'most career steals', '3,265', 'Also all with Utah.'],
  ['Hakeem Olajuwon', 'most career blocked shots', '3,830', 'Since blocks were first tracked in 1973–74.'],
  ['LeBron James', 'most career points', 'over 40,000', 'He passed Kareem Abdul-Jabbar in February 2023.'],
  ['Karl Malone', 'most career free throws made', '9,787', 'Second on the all-time scoring list for years.'],
  ['Stephen Curry', 'most career three-pointers made', 'over 4,000', 'He passed Ray Allen in December 2021.'],
  ['Klay Thompson', 'most three-pointers in a single game', '14', 'Against Chicago in October 2018.'],
  ['Russell Westbrook', 'most career triple-doubles', 'over 200', "He passed Oscar Robertson's 181 in 2021."],
  ['Robert Parish', 'most career games played', '1,611', 'Over 21 seasons.'],
  ['Michael Jordan', 'highest career playoff scoring average', '33.4 points per game', 'Across 179 playoff games.'],
  ['Michael Jordan', 'most points in a playoff game', '63', 'Double overtime against Boston in 1986.'],
  ['Elgin Baylor', 'most points in an NBA Finals game', '61', 'Game 5 of the 1962 Finals.'],
  ['Bill Russell', 'most championships won as a player', '11', 'In 13 seasons with Boston.'],
  ['Phil Jackson', 'most championships won as a head coach', '11', 'Six with Chicago, five with the Lakers.'],
  ['Gregg Popovich', 'most regular-season wins as a head coach', 'over 1,390', 'All with San Antonio.'],
  ['Kareem Abdul-Jabbar', 'most MVP awards', '6', 'Between 1971 and 1980.'],
  ['Los Angeles Lakers', 'longest winning streak in NBA history', '33 games', 'The 1971–72 season.'],
  ['Golden State Warriors', 'best regular-season record', '73–9', 'The 2015–16 season.']
];

// The same records in Arabic: [record, value, detail], in the same order.
export const RECORDS_AR = [
  ['أكثر نقاط في مباراة وحدة', '100', 'ضد نيويورك نيكس في هيرشي، بنسلفانيا، 2 مارس 1962.'],
  ['أكثر ريباوند في مباراة وحدة', '55', 'ضد بوسطن سلتكس، فريق بيل راسل، في 1960.'],
  ['أعلى معدل تسجيل في موسم واحد', '50.4 نقطة في المباراة', 'موسم 1961-62.'],
  ['أكثر ريباوند في المسيرة', '23,924', 'على مدى 14 موسماً.'],
  ['أكثر تمريرات حاسمة في مباراة وحدة', '30', 'مع أورلاندو ضد دنفر في 1990.'],
  ['أكثر بلوكات في مباراة وحدة', '17', 'مع ليكرز في 1973.'],
  ['أكثر تمريرات حاسمة في المسيرة', '15,806', 'كلها مع يوتا.'],
  ['أكثر سرقات في المسيرة', '3,265', 'وبعد كلها مع يوتا.'],
  ['أكثر بلوكات في المسيرة', '3,830', 'من أول ما بدأ تسجيل البلوكات في موسم 1973-74.'],
  ['أكثر نقاط في المسيرة', 'أكثر من 40,000', 'تخطى كريم عبد الجبار في فبراير 2023.'],
  ['أكثر رميات حرة ناجحة في المسيرة', '9,787', 'وظل ثاني هدّاف في التاريخ لسنوات.'],
  ['أكثر ثلاثيات في المسيرة', 'أكثر من 4,000', 'تخطى راي ألن في ديسمبر 2021.'],
  ['أكثر ثلاثيات في مباراة وحدة', '14', 'ضد شيكاغو في أكتوبر 2018.'],
  ['أكثر تريبل دبل في المسيرة', 'أكثر من 200', 'تخطى رقم أوسكار روبرتسون (181) في 2021.'],
  ['أكثر مباريات في المسيرة', '1,611', 'على مدى 21 موسماً.'],
  ['أعلى معدل تسجيل في البلاي أوف خلال المسيرة', '33.4 نقطة في المباراة', 'على مدى 179 مباراة بلاي أوف.'],
  ['أكثر نقاط في مباراة بلاي أوف', '63', 'بعد وقتين إضافيين ضد بوسطن في 1986.'],
  ['أكثر نقاط في مباراة بنهائيات NBA', '61', 'المباراة الخامسة في نهائيات 1962.'],
  ['أكثر بطولات كلاعب', '11', 'في 13 موسماً مع بوسطن.'],
  ['أكثر بطولات كمدرب', '11', 'ست مع شيكاغو وخمس مع ليكرز.'],
  ['أكثر انتصارات في الموسم العادي كمدرب', 'أكثر من 1,390', 'كلها مع سان أنطونيو.'],
  ['أكثر جوائز أفضل لاعب (MVP)', '6', 'بين 1971 و1980.'],
  ['أطول سلسلة انتصارات في تاريخ NBA', '33 مباراة', 'موسم 1971-72.'],
  ['أفضل سجل في الموسم العادي', A.pair(73, 9), 'موسم 2015-16.']
];
// record values as answer options
RECORDS.forEach(([, , v], i) => { A.LABELS[v] = RECORDS_AR[i][1]; });

// Era buckets used for distractor plausibility and coverage reporting.
export const era = season => {
  const y = parseInt(String(season).slice(0, 4), 10);
  return y < 1950 ? '1940s' : y < 1960 ? '1950s' : y < 1970 ? '1960s' : y < 1980 ? '1970s' : y < 1990 ? '1980s' : y < 2000 ? '1990s' : y < 2010 ? '2000s' : y < 2020 ? '2010s' : '2020s';
};

// ── Fact extraction → knowledge points ──────────────────────────
// Each entry: one verified fact = one knowledge point = one question.
// `column` groups facts so distractors are always same-kind and same-era.
export function extractKnowledgePoints() {
  const kps = [];
  const push = (kp, o) => kps.push(Object.assign({ knowledge_point_id: kp }, o));
  const label = s => s;

  SEASONS.forEach(([s, champ, runner, fmvp, mvp, coach, roy, scorer]) => {
    const e = era(s), yr = s;
    if (champ) push(`KP-${s}-CHAMPION`, { column: 'champion', era: e, season: s, category: 'Championships', fact: champ, question: `Which team won the ${yr} NBA championship?`, explanation: `${champ} won the ${yr} title${runner ? `, beating the ${runner}` : ''}.`, ar: { q: `مين الفريق اللي فاز ببطولة NBA موسم ${yr}؟`, e: `فاز ${A.N(champ)} بلقب ${yr}${runner ? ` على حساب ${A.N(runner)}` : ''}.` }, difficulty: e === '2020s' || e === '2010s' ? 'easy' : e === '1990s' || e === '2000s' ? 'medium' : 'hard' });
    if (runner) push(`KP-${s}-FINALS-RUNNER-UP`, { column: 'champion', era: e, season: s, category: 'Finals', fact: runner, question: `Which team lost the ${yr} NBA Finals?`, explanation: `${champ} beat the ${runner}.`, ar: { q: `أي فريق خسر نهائيات NBA موسم ${yr}؟`, e: `فاز ${A.N(champ)} على ${A.N(runner)}.` }, difficulty: e === '2020s' ? 'medium' : 'hard' });
    if (fmvp) push(`KP-${s}-FINALS-MVP`, { column: 'player', era: e, season: s, category: 'Finals', fact: fmvp, question: `Who was named Finals MVP for the ${yr} season?`, explanation: `${fmvp} won Finals MVP as ${champ} took the title.`, ar: { q: `مين كان أفضل لاعب في النهائيات موسم ${yr}؟`, e: `${A.N(fmvp)} فاز بجائزة أفضل لاعب في النهائيات وتوّج ${A.N(champ)} باللقب.` }, difficulty: e === '2020s' || e === '2010s' ? 'medium' : 'hard' });
    if (mvp) push(`KP-${s}-MVP`, { column: 'player', era: e, season: s, category: 'MVP', fact: mvp, question: `Who won the ${yr} NBA Most Valuable Player award?`, explanation: `${mvp} was named MVP for ${yr}.`, ar: { q: `مين فاز بجائزة أفضل لاعب (MVP) في NBA موسم ${yr}؟`, e: `${A.N(mvp)} كان أفضل لاعب في موسم ${yr}.` }, difficulty: e === '2020s' ? 'easy' : e === '2010s' || e === '1990s' ? 'medium' : 'hard' });
    if (coach) push(`KP-${s}-CHAMPION-COACH`, { column: 'coach', era: e, season: s, category: 'Coaches', fact: coach, question: `Who coached the ${yr} NBA champions?`, explanation: `${coach} led ${champ} to the ${yr} title.`, ar: { q: `مين كان مدرب بطل NBA موسم ${yr}؟`, e: `${A.N(coach)} قاد ${A.N(champ)} للقب ${yr}.` }, difficulty: e === '2020s' || e === '2010s' ? 'hard' : 'expert' });
    if (roy) push(`KP-${s}-ROY`, { column: 'player', era: e, season: s, category: 'Awards', fact: roy, question: `Who won Rookie of the Year for the ${yr} season?`, explanation: `${roy} was the ${yr} Rookie of the Year.`, ar: { q: `مين فاز بجائزة أفضل لاعب صاعد موسم ${yr}؟`, e: `${A.N(roy)} كان أفضل لاعب صاعد في موسم ${yr}.` }, difficulty: e === '2020s' ? 'medium' : 'hard' });
    if (scorer) push(`KP-${s}-SCORING-LEADER`, { column: 'player', era: e, season: s, category: 'Statistics', fact: scorer, question: `Who led the NBA in scoring for the ${yr} season?`, explanation: `${scorer} was the ${yr} scoring champion.`, ar: { q: `مين كان هدّاف NBA موسم ${yr}؟`, e: `${A.N(scorer)} كان هدّاف الدوري في موسم ${yr}.` }, difficulty: e === '2020s' ? 'medium' : e === '2010s' ? 'hard' : 'expert' });
  });

  DRAFTS.forEach(([y, first, team, second]) => {
    const e = era(String(y)), s = `${y - 1}-${String(y).slice(2)}`;
    push(`KP-DRAFT-${y}-FIRST-PICK`, { column: 'player', era: e, season: s, category: 'Draft', fact: first, question: `Who was the first overall pick in the ${y} NBA draft?`, explanation: `${team} selected ${first} first overall in ${y}.`, ar: { q: `مين كان الاختيار الأول في درافت NBA ${y}؟`, e: `اختار ${A.N(team)} ${A.N(first)} بالاختيار الأول في ${y}.` }, difficulty: y >= 2015 ? 'easy' : y >= 2000 ? 'medium' : 'hard' });
    push(`KP-DRAFT-${y}-FIRST-PICK-TEAM`, { column: 'team', era: e, season: s, category: 'Draft', fact: team, question: `Which team held the first overall pick in the ${y} NBA draft?`, explanation: `${team} used it on ${first}.`, ar: { q: `أي فريق كان عنده الاختيار الأول في درافت NBA ${y}؟`, e: `${A.N(team)} اختار فيه ${A.N(first)}.` }, difficulty: y >= 2015 ? 'medium' : 'hard' });
    if (second) push(`KP-DRAFT-${y}-SECOND-PICK`, { column: 'player', era: e, season: s, category: 'Draft', fact: second, question: `Who was selected second overall in the ${y} NBA draft?`, explanation: `${second} went second, behind ${first}.`, ar: { q: `مين انختار ثاني في درافت NBA ${y}؟`, e: `${A.N(second)} انختار ثاني، بعد ${A.N(first)}.` }, difficulty: 'expert' });
  });

  RECORDS.forEach(([holder, rec, value, detail], i) => {
    const [rA, vA, dA] = RECORDS_AR[i];
    const isTeam = /Lakers|Warriors|Celtics|Bulls/.test(holder) && !/Chamberlain|Russell|Jordan/.test(holder);
    push(`KP-RECORD-${String(i).padStart(3, '0')}-HOLDER`, { column: isTeam ? 'team' : 'player', era: 'all', season: null, category: 'NBA Records', fact: holder, question: `Who holds the NBA record for ${rec}?`, explanation: `${holder} — ${value}. ${detail}`, ar: { q: `مين صاحب الرقم القياسي في NBA ل${rA}؟`, e: `${A.N(holder)} — ${vA}. ${dA}` }, difficulty: i % 3 === 0 ? 'medium' : 'hard' });
    push(`KP-RECORD-${String(i).padStart(3, '0')}-VALUE`, { column: 'value', era: 'all', season: null, category: 'NBA Records', fact: value, question: `What is the NBA record for ${rec}, held by ${holder}?`, explanation: detail, ar: { q: `كم الرقم القياسي في NBA ل${rA}، اللي يملكه ${A.N(holder)}؟`, e: dA }, difficulty: 'expert' });
  });

  return kps;
}

// Distractors come from the SAME column and, where possible, the SAME era —
// legitimate, era-appropriate wrong answers, never nonsense.
export function distractorsFor(kp, allKps, rnd = Math.random) {
  const sameColumn = allKps.filter(x => x.column === kp.column && x.fact !== kp.fact);
  const sameEra = sameColumn.filter(x => x.era === kp.era);
  const pool = [...new Set((sameEra.length >= 6 ? sameEra : sameColumn).map(x => x.fact))];
  const out = [];
  while (out.length < 3 && pool.length) out.push(...pool.splice(Math.floor(rnd() * pool.length), 1));
  return out;
}
