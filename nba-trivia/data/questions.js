// 20–0 question bank + selection engine. Facts current through the 2024–25 season.
// q(diff, cat, text, correct, wrongs, explanation, type) — type: mc | whoami | ba (before/after) | cmp (comparison)
let n = 0;
const q = (diff, cat, text, correct, wrongs, exp, type = 'mc') => ({ id: ++n, diff, cat, type, text, correct, wrongs, exp, active: true });
const E = 'easy', M = 'medium', H = 'hard', X = 'expert';

export const CATEGORIES = ['Players', 'Teams', 'NBA History', 'Statistics', 'Draft', 'Playoffs', 'Jersey Numbers', 'Coaches', 'Awards', 'Nicknames', 'International', 'Arenas', 'Eras', 'Rules'];

export const QUESTIONS = [
  // ── EASY ─────────────────────────────────────────────
  q(E, 'Playoffs', 'Who won the 2023 NBA Finals?', 'Denver Nuggets', ['Miami Heat', 'Boston Celtics', 'Golden State Warriors'], 'Denver beat Miami 4–1 for its first title.'),
  q(E, 'Rules', 'How many players does each team have on the court at once?', '5', ['4', '6', '7'], 'Five per side — ten players on the floor.'),
  q(E, 'Teams', 'Which team shares Los Angeles with the Clippers?', 'Los Angeles Lakers', ['Sacramento Kings', 'Golden State Warriors', 'Phoenix Suns'], 'The Lakers and Clippers both call L.A. home.'),
  q(E, 'Players', 'Michael Jordan won six championships with which team?', 'Chicago Bulls', ['Washington Wizards', 'Detroit Pistons', 'New York Knicks'], 'Two three-peats: 1991–93 and 1996–98.'),
  q(E, 'Nicknames', 'Which player is nicknamed "King James"?', 'LeBron James', ['James Harden', 'Kevin Durant', 'Kawhi Leonard'], 'The nickname dates back to his high-school days in Akron.'),
  q(E, 'Rules', 'How many points is a made shot from beyond the arc worth?', '3', ['2', '4', '1'], 'The three-point line was adopted by the NBA in 1979.'),
  q(E, 'Statistics', 'Who holds the record for most career three-pointers made?', 'Stephen Curry', ['Ray Allen', 'James Harden', 'Reggie Miller'], 'Curry passed Ray Allen in December 2021.'),
  q(E, 'Arenas', 'Which team plays its home games at Madison Square Garden?', 'New York Knicks', ['Brooklyn Nets', 'Boston Celtics', 'Philadelphia 76ers'], 'MSG has been the Knicks\' home since 1968.'),
  q(E, 'Players', 'Kobe Bryant spent his entire 20-year career with which team?', 'Los Angeles Lakers', ['Charlotte Hornets', 'Los Angeles Clippers', 'Chicago Bulls'], 'Drafted by Charlotte in 1996, traded to L.A. on draft night.'),
  q(E, 'Playoffs', 'Giannis Antetokounmpo led which team to the 2021 championship?', 'Milwaukee Bucks', ['Phoenix Suns', 'Atlanta Hawks', 'Brooklyn Nets'], 'Milwaukee\'s first title since 1971.'),
  q(E, 'Nicknames', 'Which player is known as "The Greek Freak"?', 'Giannis Antetokounmpo', ['Nikola Jokić', 'Luka Dončić', 'Joel Embiid'], 'Born in Athens to Nigerian parents.'),
  q(E, 'Draft', 'Which team drafted LeBron James first overall in 2003?', 'Cleveland Cavaliers', ['Miami Heat', 'Los Angeles Lakers', 'Detroit Pistons'], 'The Cavs won the 2003 lottery and took the Akron native.'),
  q(E, 'Teams', 'How many teams are in the NBA?', '30', ['28', '32', '26'], '15 in each conference.'),
  q(E, 'Nicknames', 'Which player is nicknamed "Chef Curry"?', 'Stephen Curry', ['Seth Curry', 'Klay Thompson', 'Damian Lillard'], 'He "cooks" defenders — hence the chef.'),
  q(E, 'Jersey Numbers', 'Which player wore #23 for the Chicago Bulls?', 'Michael Jordan', ['Scottie Pippen', 'Dennis Rodman', 'Derrick Rose'], 'The Bulls retired #23 in 1994.'),
  q(E, 'Rules', 'How many quarters are in an NBA game?', '4', ['2', '3', '6'], 'Four 12-minute quarters.'),
  q(E, 'Rules', 'How long is each quarter in an NBA game?', '12 minutes', ['10 minutes', '15 minutes', '8 minutes'], 'FIBA and college use different lengths; the NBA plays 12.'),
  q(E, 'Playoffs', 'Which team won the 2020 championship in the Orlando "bubble"?', 'Los Angeles Lakers', ['Miami Heat', 'Denver Nuggets', 'Los Angeles Clippers'], 'The Lakers beat Miami 4–2.'),
  q(E, 'Awards', 'Who was named Finals MVP in 2023?', 'Nikola Jokić', ['Jamal Murray', 'Jimmy Butler', 'Aaron Gordon'], 'Jokić averaged a triple-double for the series.'),
  q(E, 'Teams', 'Which franchise has won the most NBA championships?', 'Boston Celtics', ['Los Angeles Lakers', 'Chicago Bulls', 'Golden State Warriors'], 'Boston\'s 2024 title was its 18th, one more than the Lakers.'),
  q(E, 'Playoffs', 'Who won the 2024 NBA Finals?', 'Boston Celtics', ['Dallas Mavericks', 'Denver Nuggets', 'Minnesota Timberwolves'], 'Boston beat Dallas 4–1.'),
  q(E, 'Playoffs', 'Shaquille O\'Neal and Kobe Bryant won three straight titles (2000–02) with which team?', 'Los Angeles Lakers', ['Orlando Magic', 'Miami Heat', 'San Antonio Spurs'], 'Phil Jackson coached the three-peat.'),
  q(E, 'Teams', 'Which team is known as the "Sixers"?', 'Philadelphia 76ers', ['Portland Trail Blazers', 'Sacramento Kings', 'Indiana Pacers'], 'Named for the year of the Declaration of Independence.'),
  q(E, 'Nicknames', 'Which player is known as "The Beard"?', 'James Harden', ['Joakim Noah', 'Steven Adams', 'Jimmy Butler'], 'Harden has sported the beard since his OKC days.'),
  q(E, 'Players', 'Dirk Nowitzki played his entire career for which team?', 'Dallas Mavericks', ['Milwaukee Bucks', 'San Antonio Spurs', 'Houston Rockets'], '21 seasons in Dallas — an NBA record for one franchise.'),
  q(E, 'Players', 'Tim Duncan spent his whole career with which team?', 'San Antonio Spurs', ['Orlando Magic', 'Boston Celtics', 'Dallas Mavericks'], 'Five titles with the Spurs from 1999 to 2014.'),
  q(E, 'Teams', 'Which is the only NBA team based in Canada?', 'Toronto Raptors', ['Vancouver Grizzlies', 'Montreal Royals', 'Ottawa Senators'], 'The Grizzlies left Vancouver for Memphis in 2001.'),
  q(E, 'Nicknames', 'Which player is nicknamed "The Joker"?', 'Nikola Jokić', ['Nikola Vučević', 'Jusuf Nurkić', 'Bogdan Bogdanović'], 'A play on his surname.'),
  q(E, 'Nicknames', 'Which player was known as "Black Mamba"?', 'Kobe Bryant', ['Michael Jordan', 'Allen Iverson', 'Tracy McGrady'], 'Kobe gave himself the nickname, inspired by Kill Bill.'),
  q(E, 'Teams', 'Benny the Bull is the mascot of which team?', 'Chicago Bulls', ['Milwaukee Bucks', 'Houston Rockets', 'Denver Nuggets'], 'Benny debuted in 1969.'),
  q(E, 'Playoffs', 'Which team won the 2019 NBA championship?', 'Toronto Raptors', ['Golden State Warriors', 'Milwaukee Bucks', 'Philadelphia 76ers'], 'Toronto beat Golden State 4–2.'),
  q(E, 'Playoffs', 'Who won the 2022 NBA Finals?', 'Golden State Warriors', ['Boston Celtics', 'Miami Heat', 'Dallas Mavericks'], 'Golden State beat Boston 4–2 for its fourth title in eight years.'),
  q(E, 'Teams', 'Which NBA team is based in Phoenix?', 'Phoenix Suns', ['Phoenix Firebirds', 'Arizona Cardinals', 'Phoenix Coyotes'], 'The Suns joined the NBA in 1968.'),
  q(E, 'Players', 'Michael Jordan came out of retirement in 2001 to play for which team?', 'Washington Wizards', ['Charlotte Hornets', 'Chicago Bulls', 'Miami Heat'], 'Two seasons in Washington before retiring for good in 2003.'),
  q(E, 'Players', 'I was drafted in 2003.|I won four championships.|I played for Cleveland, Miami and the Lakers.|I am the NBA\'s all-time leading scorer.', 'LeBron James', ['Dwyane Wade', 'Carmelo Anthony', 'Chris Bosh'], 'LeBron passed Kareem Abdul-Jabbar for the scoring record in 2023.', 'whoami'),
  q(E, 'Players', 'I was drafted 7th in 2009.|I won back-to-back MVPs in 2015 and 2016.|I have four championships.|I own the record for most career three-pointers.', 'Stephen Curry', ['Klay Thompson', 'Damian Lillard', 'James Harden'], 'Curry\'s 2016 MVP was the first unanimous MVP in NBA history.', 'whoami'),
  q(E, 'Statistics', 'A triple-double requires double digits in how many stat categories?', '3', ['2', '4', '5'], 'Usually points, rebounds and assists.'),
  q(E, 'Arenas', 'Which team plays home games at TD Garden?', 'Boston Celtics', ['Toronto Raptors', 'Brooklyn Nets', 'New York Knicks'], 'It replaced the old Boston Garden in 1995.'),
  q(E, 'Arenas', 'The Chicago Bulls play home games in which arena?', 'United Center', ['Chicago Stadium', 'Wintrust Arena', 'Soldier Field'], 'Opened in 1994, shared with the NHL\'s Blackhawks.'),
  q(E, 'Teams', 'Which team is nicknamed the "Mavs"?', 'Dallas Mavericks', ['Memphis Grizzlies', 'Minnesota Timberwolves', 'Milwaukee Bucks'], 'Dallas joined the NBA in 1980.'),
  q(E, 'Awards', 'Who won the 2023–24 regular-season MVP?', 'Nikola Jokić', ['Luka Dončić', 'Shai Gilgeous-Alexander', 'Giannis Antetokounmpo'], 'Jokić\'s third MVP in four seasons.'),
  q(E, 'Awards', 'Who won the 2022–23 regular-season MVP?', 'Joel Embiid', ['Nikola Jokić', 'Giannis Antetokounmpo', 'Jayson Tatum'], 'Embiid led the league in scoring at 33.1 points per game.'),
  q(E, 'Players', 'How many NBA championships did Michael Jordan win?', '6', ['5', '7', '4'], 'Six titles, six Finals MVPs.'),
  q(E, 'Arenas', 'Which team plays at Fiserv Forum?', 'Milwaukee Bucks', ['Indiana Pacers', 'Minnesota Timberwolves', 'Detroit Pistons'], 'Opened in 2018 in downtown Milwaukee.'),
  q(E, 'Draft', 'Who was drafted first?', 'Kobe Bryant', ['LeBron James'], 'Kobe was drafted in 1996; LeBron in 2003.', 'ba'),
  q(E, 'Players', 'Who is taller?', 'Victor Wembanyama', ['Stephen Curry'], 'Wembanyama is listed at 7\'4"; Curry at 6\'2".', 'cmp'),
  q(E, 'Eras', 'In which decade did the Bulls win six championships?', '1990s', ['1980s', '2000s', '1970s'], '1991, 1992, 1993, 1996, 1997 and 1998.'),
  q(E, 'Teams', 'Since 2019 the Golden State Warriors have played their home games in which city?', 'San Francisco', ['Oakland', 'San Jose', 'Sacramento'], 'Chase Center replaced Oracle Arena in Oakland.'),
  q(E, 'Awards', 'Who won Rookie of the Year for the 2023–24 season?', 'Victor Wembanyama', ['Chet Holmgren', 'Brandon Miller', 'Jaime Jaquez Jr.'], 'Wembanyama was a unanimous choice.'),
  q(E, 'Teams', 'Which team plays in Miami?', 'Miami Heat', ['Miami Magic', 'Miami Dolphins', 'Miami Marlins'], 'The Heat entered the NBA in 1988.'),
  q(E, 'Statistics', 'How many games are in a full NBA regular season?', '82', ['80', '72', '90'], '41 home, 41 away.'),
  q(E, 'Rules', 'How long does a team have to attempt a shot before the shot clock expires?', '24 seconds', ['30 seconds', '20 seconds', '35 seconds'], 'The 24-second clock was introduced in 1954.'),

  // ── MEDIUM ───────────────────────────────────────────
  q(M, 'NBA History', 'Who won the 2016 NBA Finals?', 'Cleveland Cavaliers', ['Golden State Warriors', 'Miami Heat', 'San Antonio Spurs'], 'Cleveland came back from 3–1 down to beat Golden State 4–3.'),
  q(M, 'Statistics', 'Who has the most career assists in NBA history?', 'John Stockton', ['Jason Kidd', 'Chris Paul', 'Steve Nash'], 'Stockton finished with 15,806 assists.'),
  q(M, 'Statistics', 'Who holds the record for most points in a single game?', 'Wilt Chamberlain', ['Kobe Bryant', 'Michael Jordan', 'David Thompson'], '100 points against the Knicks on March 2, 1962.'),
  q(M, 'Teams', 'Which franchise was previously known as the Seattle SuperSonics?', 'Oklahoma City Thunder', ['Portland Trail Blazers', 'Utah Jazz', 'Sacramento Kings'], 'The Sonics relocated in 2008.'),
  q(M, 'Playoffs', 'Kawhi Leonard\'s bouncing Game 7 buzzer-beater in 2019 eliminated which team?', 'Philadelphia 76ers', ['Milwaukee Bucks', 'Orlando Magic', 'Boston Celtics'], 'The first Game 7 series-winning buzzer-beater in NBA history.'),
  q(M, 'Awards', 'Who was Finals MVP in 2016?', 'LeBron James', ['Kyrie Irving', 'Stephen Curry', 'Kevin Love'], 'LeBron led both teams in every major stat category.'),
  q(M, 'Draft', 'Which team drafted Kobe Bryant in 1996?', 'Charlotte Hornets', ['Los Angeles Lakers', 'New Jersey Nets', 'Philadelphia 76ers'], 'Charlotte took him 13th and traded him for Vlade Divac.'),
  q(M, 'Jersey Numbers', 'Which two numbers did Kobe Bryant wear for the Lakers?', '8 and 24', ['8 and 33', '24 and 34', '3 and 24'], 'Both numbers are retired by the Lakers.'),
  q(M, 'Nicknames', 'Which player was known as "The Answer"?', 'Allen Iverson', ['Stephon Marbury', 'Steve Francis', 'Vince Carter'], 'The 2001 MVP led Philadelphia to the Finals.'),
  q(M, 'Nicknames', 'Which player is called "The Process"?', 'Joel Embiid', ['Ben Simmons', 'Tyrese Maxey', 'Jahlil Okafor'], 'Named after Philadelphia\'s "Trust the Process" rebuild.'),
  q(M, 'Players', 'Kevin Durant won his two championships with which team?', 'Golden State Warriors', ['Oklahoma City Thunder', 'Brooklyn Nets', 'Phoenix Suns'], 'Titles in 2017 and 2018, both with Finals MVP honours.'),
  q(M, 'Awards', 'Who was Finals MVP in 2022?', 'Stephen Curry', ['Andrew Wiggins', 'Klay Thompson', 'Draymond Green'], 'Curry\'s first Finals MVP.'),
  q(M, 'Awards', 'Who was named Finals MVP in 2024?', 'Jaylen Brown', ['Jayson Tatum', 'Jrue Holiday', 'Derrick White'], 'Brown was also the 2024 East Finals MVP.'),
  q(M, 'NBA History', 'Which player scored 81 points in a game in 2006?', 'Kobe Bryant', ['Tracy McGrady', 'LeBron James', 'Allen Iverson'], 'Against Toronto on January 22, 2006 — second-most ever.'),
  q(M, 'Teams', 'Which franchise was formerly the New Jersey Nets?', 'Brooklyn Nets', ['New York Knicks', 'Philadelphia 76ers', 'Charlotte Hornets'], 'The Nets moved to Brooklyn in 2012.'),
  q(M, 'Teams', 'Which team began as the Vancouver Grizzlies?', 'Memphis Grizzlies', ['Toronto Raptors', 'Minnesota Timberwolves', 'Portland Trail Blazers'], 'Six seasons in Vancouver (1995–2001).'),
  q(M, 'Awards', 'Who won Rookie of the Year in 2020–21?', 'LaMelo Ball', ['Anthony Edwards', 'Tyrese Haliburton', 'James Wiseman'], 'Ball averaged 15.7 points for Charlotte.'),
  q(M, 'Awards', 'Who won the 2021–22 regular-season MVP?', 'Nikola Jokić', ['Joel Embiid', 'Giannis Antetokounmpo', 'Devin Booker'], 'Jokić\'s second straight MVP.'),
  q(M, 'Playoffs', 'Who did the Lakers beat in the 2020 Finals?', 'Miami Heat', ['Boston Celtics', 'Denver Nuggets', 'Milwaukee Bucks'], 'Jimmy Butler\'s Heat fell 4–2.'),
  q(M, 'NBA History', 'How many championships did Bill Russell win as a player?', '11', ['8', '9', '13'], '11 titles in 13 seasons with Boston.'),
  q(M, 'Draft', 'Who was the first overall pick in the 2019 draft?', 'Zion Williamson', ['Ja Morant', 'RJ Barrett', 'Darius Garland'], 'New Orleans took the Duke forward.'),
  q(M, 'Draft', 'Who was the first overall pick in the 2023 draft?', 'Victor Wembanyama', ['Scoot Henderson', 'Brandon Miller', 'Amen Thompson'], 'San Antonio won the lottery with a 14% chance.'),
  q(M, 'Draft', 'Who went first overall in the 2018 draft?', 'Deandre Ayton', ['Luka Dončić', 'Trae Young', 'Marvin Bagley III'], 'Phoenix chose Ayton; Luka went third.'),
  q(M, 'Jersey Numbers', 'Which player wore #33 for the Boston Celtics?', 'Larry Bird', ['Kevin McHale', 'Paul Pierce', 'Robert Parish'], 'Retired by the Celtics in 1993.'),
  q(M, 'Coaches', 'Which coach has won the most NBA championships?', 'Phil Jackson', ['Red Auerbach', 'Gregg Popovich', 'Pat Riley'], '11 titles: six with Chicago, five with the Lakers.'),
  q(M, 'Coaches', 'Who coached the Warriors to titles in 2015, 2017, 2018 and 2022?', 'Steve Kerr', ['Mark Jackson', 'Mike Brown', 'Luke Walton'], 'Kerr also won five titles as a player.'),
  q(M, 'Coaches', 'Which coach holds the record for most regular-season wins?', 'Gregg Popovich', ['Don Nelson', 'Lenny Wilkens', 'Phil Jackson'], 'Popovich passed Don Nelson in 2022.'),
  q(M, 'Arenas', 'Which team plays at Ball Arena?', 'Denver Nuggets', ['Utah Jazz', 'Minnesota Timberwolves', 'Portland Trail Blazers'], 'Formerly the Pepsi Center.'),
  q(M, 'Arenas', 'The Toyota Center is home to which team?', 'Houston Rockets', ['Dallas Mavericks', 'San Antonio Spurs', 'Memphis Grizzlies'], 'Opened in 2003.'),
  q(M, 'Nicknames', 'Which player is nicknamed "The Klaw"?', 'Kawhi Leonard', ['Paul George', 'Jimmy Butler', 'Anthony Davis'], 'A nod to his enormous hands.'),
  q(M, 'Nicknames', 'Which player is nicknamed "Slim Reaper"?', 'Kevin Durant', ['Kevin Garnett', 'Brandon Ingram', 'Kristaps Porziņģis'], 'Durant famously dislikes the name.'),
  q(M, 'Players', 'I was drafted 41st overall in 2014.|I was born in Serbia.|I have won three MVP awards.|I was Finals MVP in 2023.', 'Nikola Jokić', ['Bogdan Bogdanović', 'Nikola Vučević', 'Vlade Divac'], 'The lowest draft pick ever to win MVP.', 'whoami'),
  q(M, 'Players', 'I played college ball at Wake Forest.|I was nicknamed "The Big Fundamental".|I won five championships.|I spent my whole career in San Antonio.', 'Tim Duncan', ['David Robinson', 'Kevin Garnett', 'Chris Paul'], 'Duncan won titles in 1999, 2003, 2005, 2007 and 2014.', 'whoami'),
  q(M, 'Draft', 'Who was drafted first?', 'Kevin Durant', ['Stephen Curry'], 'Durant went 2nd in 2007; Curry 7th in 2009.', 'ba'),
  q(M, 'Draft', 'Who entered the league first?', 'Shaquille O\'Neal', ['Allen Iverson'], 'Shaq was drafted in 1992; Iverson in 1996.', 'ba'),
  q(M, 'Statistics', 'Who averaged more points in the 2023–24 regular season?', 'Luka Dončić', ['Jayson Tatum'], 'Dončić led the league at 33.9; Tatum averaged 26.9.', 'cmp'),
  q(M, 'Players', 'Who has more NBA championships?', 'Kobe Bryant', ['LeBron James'], 'Kobe won five; LeBron has four.', 'cmp'),
  q(M, 'Players', 'Kevin Garnett won his only championship with which team?', 'Boston Celtics', ['Minnesota Timberwolves', 'Brooklyn Nets', 'Miami Heat'], 'The 2008 Celtics beat the Lakers 4–2.'),
  q(M, 'Draft', 'Which team drafted Dirk Nowitzki in 1998 before trading him to Dallas?', 'Milwaukee Bucks', ['Boston Celtics', 'Phoenix Suns', 'Los Angeles Clippers'], 'Milwaukee took him 9th and swapped him for Robert Traylor.'),
  q(M, 'Nicknames', 'Which player is nicknamed "Spida"?', 'Donovan Mitchell', ['Darius Garland', 'Jalen Brunson', 'Devin Booker'], 'Short for Spider-Man — a childhood nickname.'),
  q(M, 'Nicknames', 'Which player is known as "Ant-Man"?', 'Anthony Edwards', ['Anthony Davis', 'Anfernee Simons', 'Andrew Wiggins'], 'Minnesota\'s #1 pick in 2020.'),
  q(M, 'Awards', 'Who won the 2024–25 regular-season MVP?', 'Shai Gilgeous-Alexander', ['Nikola Jokić', 'Giannis Antetokounmpo', 'Jayson Tatum'], 'SGA led the league in scoring and OKC to 68 wins.'),
  q(M, 'Playoffs', 'Who won the 2025 NBA Finals?', 'Oklahoma City Thunder', ['Indiana Pacers', 'New York Knicks', 'Minnesota Timberwolves'], 'OKC beat Indiana in seven games.'),
  q(M, 'Teams', 'Which franchise was known as the Washington Bullets until 1997?', 'Washington Wizards', ['Washington Nationals', 'Baltimore Ravens', 'Charlotte Hornets'], 'Owner Abe Pollin changed the name over its violent connotation.'),
  q(M, 'International', 'Which country is Luka Dončić from?', 'Slovenia', ['Serbia', 'Croatia', 'Slovakia'], 'He led Slovenia to the 2017 EuroBasket title.'),
  q(M, 'International', 'Which country is Joel Embiid from?', 'Cameroon', ['Nigeria', 'Senegal', 'France'], 'Embiid started playing basketball at 15 in Yaoundé.'),
  q(M, 'International', 'Which country is Nikola Jokić from?', 'Serbia', ['Croatia', 'Montenegro', 'Slovenia'], 'He is from Sombor, Serbia.'),
  q(M, 'Awards', 'Which German player was Finals MVP in 2011?', 'Dirk Nowitzki', ['Detlef Schrempf', 'Dennis Schröder', 'Chris Kaman'], 'Dallas beat Miami 4–2.'),
  q(M, 'Playoffs', 'Who did the Mavericks beat in the 2011 Finals?', 'Miami Heat', ['Los Angeles Lakers', 'Boston Celtics', 'Chicago Bulls'], 'The first year of Miami\'s Big Three.'),
  q(M, 'Awards', 'Who won the 2016–17 regular-season MVP?', 'Russell Westbrook', ['James Harden', 'Kawhi Leonard', 'LeBron James'], 'He averaged a triple-double for the season.'),
  q(M, 'Awards', 'Who won the 2017–18 regular-season MVP?', 'James Harden', ['LeBron James', 'Anthony Davis', 'Damian Lillard'], 'Harden led Houston to 65 wins.'),
  q(M, 'Teams', 'Which franchise has 17 championships, second-most all time?', 'Los Angeles Lakers', ['Chicago Bulls', 'Golden State Warriors', 'San Antonio Spurs'], 'Boston has 18.'),
  q(M, 'Eras', 'Which team went 73–9 in the 2015–16 season, the best record ever?', 'Golden State Warriors', ['San Antonio Spurs', 'Cleveland Cavaliers', 'Oklahoma City Thunder'], 'They lost the Finals to Cleveland.'),
  q(M, 'Eras', 'Which team\'s 72–10 record stood as the best ever until 2016?', 'Chicago Bulls', ['Los Angeles Lakers', 'Boston Celtics', 'Philadelphia 76ers'], 'The 1995–96 Bulls went on to win the title.'),
  q(M, 'NBA History', 'Who hit "The Shot" over Craig Ehlo in the 1989 playoffs?', 'Michael Jordan', ['Scottie Pippen', 'Isiah Thomas', 'Dominique Wilkins'], 'A series-winning buzzer-beater against Cleveland.'),
  q(M, 'Teams', 'Which franchise began as the Minneapolis Lakers?', 'Los Angeles Lakers', ['Minnesota Timberwolves', 'Utah Jazz', 'Milwaukee Bucks'], 'The name refers to Minnesota\'s lakes.'),
  q(M, 'Teams', 'Which team was previously the New Orleans Jazz?', 'Utah Jazz', ['New Orleans Pelicans', 'Memphis Grizzlies', 'Sacramento Kings'], 'The Jazz moved to Salt Lake City in 1979.'),
  q(M, 'Arenas', 'Since 2024, the Los Angeles Clippers play home games at which arena?', 'Intuit Dome', ['Crypto.com Arena', 'The Forum', 'SoFi Stadium'], 'Located in Inglewood, next to SoFi Stadium.'),
  q(M, 'Coaches', 'Red Auerbach coached which team to nine championships?', 'Boston Celtics', ['Philadelphia Warriors', 'Minneapolis Lakers', 'New York Knicks'], 'Including eight in a row from 1959 to 1966.'),
  q(M, 'Statistics', 'Who is the NBA\'s all-time leading scorer?', 'LeBron James', ['Kareem Abdul-Jabbar', 'Karl Malone', 'Kobe Bryant'], 'LeBron passed Kareem on February 7, 2023.'),

  // ── HARD ─────────────────────────────────────────────
  q(H, 'Statistics', 'Who is second on the all-time career scoring list?', 'Kareem Abdul-Jabbar', ['Karl Malone', 'Kobe Bryant', 'Michael Jordan'], 'Kareem held the record from 1984 until 2023.'),
  q(H, 'Statistics', 'Who holds the record for most career rebounds?', 'Wilt Chamberlain', ['Bill Russell', 'Kareem Abdul-Jabbar', 'Moses Malone'], '23,924 rebounds.'),
  q(H, 'Statistics', 'Who has the most career blocked shots?', 'Hakeem Olajuwon', ['Dikembe Mutombo', 'Kareem Abdul-Jabbar', 'Mark Eaton'], '3,830 blocks, since the stat was first tracked in 1973.'),
  q(H, 'Statistics', 'Who has the most career steals?', 'John Stockton', ['Chris Paul', 'Jason Kidd', 'Michael Jordan'], '3,265 steals.'),
  q(H, 'Statistics', 'Who has recorded the most career triple-doubles?', 'Russell Westbrook', ['Oscar Robertson', 'Magic Johnson', 'Nikola Jokić'], 'Westbrook passed Oscar Robertson\'s 181 in 2021.'),
  q(H, 'Draft', 'Who was the first overall pick in the 1984 draft?', 'Hakeem Olajuwon', ['Michael Jordan', 'Charles Barkley', 'Sam Bowie'], 'Houston took Olajuwon; Jordan went third.'),
  q(H, 'Draft', 'Who was selected 2nd in 1984, one pick before Michael Jordan?', 'Sam Bowie', ['Sam Perkins', 'Charles Barkley', 'John Stockton'], 'Portland already had Clyde Drexler at guard.'),
  q(H, 'Draft', 'Who was the first overall pick in 2007?', 'Greg Oden', ['Kevin Durant', 'Al Horford', 'Mike Conley'], 'Portland took Oden over Durant.'),
  q(H, 'Draft', 'Who went first overall in the 2013 draft?', 'Anthony Bennett', ['Victor Oladipo', 'Giannis Antetokounmpo', 'Otto Porter'], 'Cleveland\'s surprise pick played just four seasons.'),
  q(H, 'Awards', 'Who won Rookie of the Year in 2011–12?', 'Kyrie Irving', ['Klay Thompson', 'Kawhi Leonard', 'Kemba Walker'], 'Irving averaged 18.5 points for Cleveland.'),
  q(H, 'Awards', 'Who was Defensive Player of the Year in 2022–23?', 'Jaren Jackson Jr.', ['Brook Lopez', 'Evan Mobley', 'Rudy Gobert'], 'He led the league in blocks at 3.0 per game.'),
  q(H, 'Awards', 'Who has won the most regular-season MVP awards?', 'Kareem Abdul-Jabbar', ['Michael Jordan', 'Bill Russell', 'LeBron James'], 'Six MVPs between 1971 and 1980.'),
  q(H, 'Awards', 'Who is the only player to win MVP by unanimous vote?', 'Stephen Curry', ['LeBron James', 'Shaquille O\'Neal', 'Michael Jordan'], 'All 131 first-place votes in 2016.'),
  q(H, 'Draft', 'Which team drafted Kawhi Leonard in 2011 before trading him to San Antonio?', 'Indiana Pacers', ['Toronto Raptors', 'Los Angeles Clippers', 'Sacramento Kings'], 'Indiana traded him for George Hill.'),
  q(H, 'Draft', 'What pick was Giannis Antetokounmpo in the 2013 draft?', '15th', ['8th', '23rd', '2nd'], 'Milwaukee took the unknown Greek forward mid-first round.'),
  q(H, 'Draft', 'What pick was Nikola Jokić in the 2014 draft?', '41st', ['27th', '55th', '16th'], 'His selection aired during a Taco Bell commercial.'),
  q(H, 'Draft', 'Which future All-Star was the 60th and final pick of the 2011 draft?', 'Isaiah Thomas', ['Jimmy Butler', 'Chandler Parsons', 'Draymond Green'], 'He made two All-Star teams with Boston.'),
  q(H, 'NBA History', 'Kareem Abdul-Jabbar won his first championship (1971) with which team?', 'Milwaukee Bucks', ['Los Angeles Lakers', 'New York Knicks', 'Boston Celtics'], 'Alongside Oscar Robertson.'),
  q(H, 'NBA History', 'Who scored 13 points in 33 seconds to beat the Spurs in 2004?', 'Tracy McGrady', ['Kobe Bryant', 'Vince Carter', 'Allen Iverson'], 'Four three-pointers in the final 35 seconds for Houston.'),
  q(H, 'Playoffs', 'Who hit the go-ahead three-pointer in Game 7 of the 2016 Finals?', 'Kyrie Irving', ['LeBron James', 'J.R. Smith', 'Kevin Love'], 'Over Stephen Curry with 53 seconds left.'),
  q(H, 'Playoffs', 'Whose shot did LeBron James block in the final minutes of Game 7 of the 2016 Finals?', 'Andre Iguodala', ['Stephen Curry', 'Klay Thompson', 'Draymond Green'], '"The Block" kept the game tied at 89.'),
  q(H, 'Playoffs', 'Who hit the "0.4 second" shot against San Antonio in the 2004 playoffs?', 'Derek Fisher', ['Kobe Bryant', 'Robert Horry', 'Gary Payton'], 'Game 5 of the West semifinals.'),
  q(H, 'Playoffs', 'Ray Allen\'s game-tying three in Game 6 of the 2013 Finals came against which team?', 'San Antonio Spurs', ['Oklahoma City Thunder', 'Dallas Mavericks', 'Indiana Pacers'], 'Miami won Game 6 in overtime and then Game 7.'),
  q(H, 'Coaches', 'Who coached the "Showtime" Lakers to four championships in the 1980s?', 'Pat Riley', ['Paul Westhead', 'Phil Jackson', 'Jerry West'], '1982, 1985, 1987 and 1988.'),
  q(H, 'Coaches', 'Who coached the Detroit Pistons to the 2004 championship?', 'Larry Brown', ['Rick Carlisle', 'Chuck Daly', 'Flip Saunders'], 'Detroit upset the Lakers 4–1.'),
  q(H, 'Coaches', 'Who coached the Raptors to the 2019 title?', 'Nick Nurse', ['Dwane Casey', 'Masai Ujiri', 'Sam Mitchell'], 'His first season as an NBA head coach.'),
  q(H, 'Coaches', 'Who coached the Nuggets to the 2023 championship?', 'Michael Malone', ['Mike Budenholzer', 'George Karl', 'Monty Williams'], 'Denver\'s first title in franchise history.'),
  q(H, 'Coaches', 'Who coached the Bucks to the 2021 championship?', 'Mike Budenholzer', ['Jason Kidd', 'Nick Nurse', 'Doc Rivers'], 'Milwaukee beat Phoenix 4–2.'),
  q(H, 'Nicknames', 'Which player was known as "The Mailman"?', 'Karl Malone', ['Moses Malone', 'Charles Barkley', 'Karl-Anthony Towns'], 'Because he always delivered.'),
  q(H, 'Nicknames', 'Which player was known as "The Dream"?', 'Hakeem Olajuwon', ['Patrick Ewing', 'David Robinson', 'Shaquille O\'Neal'], 'Famous for the "Dream Shake".'),
  q(H, 'Nicknames', 'Which player was nicknamed "The Glove"?', 'Gary Payton', ['Jason Kidd', 'Scottie Pippen', 'Alvin Robertson'], 'For his suffocating on-ball defense.'),
  q(H, 'Nicknames', 'Which player was nicknamed "The Admiral"?', 'David Robinson', ['Tim Duncan', 'Patrick Ewing', 'Alonzo Mourning'], 'He served in the U.S. Navy before joining the Spurs.'),
  q(H, 'Nicknames', 'Which player was known as "The Worm"?', 'Dennis Rodman', ['Bill Laimbeer', 'Charles Oakley', 'Rick Mahorn'], 'A childhood nickname from playing pinball.'),
  q(H, 'Arenas', 'The San Antonio Spurs play home games at which arena?', 'Frost Bank Center', ['Alamodome', 'Moody Center', 'Toyota Center'], 'Formerly the AT&T Center.'),
  q(H, 'Arenas', 'Which team plays at Gainbridge Fieldhouse?', 'Indiana Pacers', ['Detroit Pistons', 'Cleveland Cavaliers', 'Milwaukee Bucks'], 'Formerly Conseco and then Bankers Life Fieldhouse.'),
  q(H, 'Arenas', 'Which team plays at Rocket Arena in Cleveland?', 'Cleveland Cavaliers', ['Cleveland Browns', 'Detroit Pistons', 'Indiana Pacers'], 'Previously Rocket Mortgage FieldHouse and Quicken Loans Arena.'),
  q(H, 'Players', 'I was the #1 pick in 1985.|I played at Georgetown.|I spent 15 seasons with the Knicks.|I never won an NBA championship.', 'Patrick Ewing', ['Alonzo Mourning', 'Dikembe Mutombo', 'Charles Oakley'], 'Ewing lost the 1994 Finals to Houston.', 'whoami'),
  q(H, 'Players', 'I was born in Nigeria.|I won back-to-back titles in 1994 and 1995.|I have the most career blocks.|I was the 1994 MVP.', 'Hakeem Olajuwon', ['Dikembe Mutombo', 'David Robinson', 'Patrick Ewing'], 'Olajuwon won MVP, DPOY and Finals MVP in 1994.', 'whoami'),
  q(H, 'Playoffs', 'Which championship came first?', 'Kevin Garnett\'s', ['Dirk Nowitzki\'s'], 'Garnett won in 2008; Nowitzki in 2011.', 'ba'),
  q(H, 'Players', 'Who retired first?', 'Michael Jordan', ['Reggie Miller'], 'Jordan retired for good in 2003; Miller in 2005.', 'ba'),
  q(H, 'Statistics', 'Who has more career assists?', 'Chris Paul', ['Jason Kidd'], 'Paul passed Kidd for second all-time in 2023.', 'cmp'),
  q(H, 'Awards', 'Who has more regular-season MVP awards?', 'Michael Jordan', ['LeBron James'], 'Jordan won five; LeBron has four.', 'cmp'),
  q(H, 'Playoffs', 'Which team lost the 2015 Finals?', 'Cleveland Cavaliers', ['Oklahoma City Thunder', 'Houston Rockets', 'Atlanta Hawks'], 'Golden State won 4–2 without facing Kyrie or Kevin Love for most of the series.'),
  q(H, 'Awards', 'Who was Finals MVP in 2015?', 'Andre Iguodala', ['Stephen Curry', 'Draymond Green', 'Klay Thompson'], 'The first Finals MVP to not start every game of the series.'),
  q(H, 'Awards', 'Who was Finals MVP in 2019?', 'Kawhi Leonard', ['Kyle Lowry', 'Pascal Siakam', 'Fred VanVleet'], 'His second Finals MVP, after 2014 with San Antonio.'),
  q(H, 'Awards', 'Who was Finals MVP in 2014?', 'Kawhi Leonard', ['Tim Duncan', 'Tony Parker', 'Manu Ginóbili'], 'At 22, one of the youngest Finals MVPs ever.'),
  q(H, 'Awards', 'Who was named Finals MVP in 2025?', 'Shai Gilgeous-Alexander', ['Jalen Williams', 'Chet Holmgren', 'Tyrese Haliburton'], 'He also won regular-season MVP the same year.'),
  q(H, 'Eras', 'The "Bad Boys" Pistons won back-to-back titles in which years?', '1989 and 1990', ['1987 and 1988', '1990 and 1991', '1988 and 1989'], 'They swept the Lakers in 1989 and beat Portland in 1990.'),
  q(H, 'Teams', 'Which franchise was the Fort Wayne Pistons?', 'Detroit Pistons', ['Indiana Pacers', 'Chicago Bulls', 'Milwaukee Bucks'], 'Named for owner Fred Zollner\'s piston factory.'),
  q(H, 'Teams', 'Which franchise was the San Diego Rockets?', 'Houston Rockets', ['Los Angeles Clippers', 'Sacramento Kings', 'Phoenix Suns'], 'The team moved to Houston in 1971.'),
  q(H, 'Arenas', 'The Smoothie King Center is home to which team?', 'New Orleans Pelicans', ['Memphis Grizzlies', 'Orlando Magic', 'Miami Heat'], 'Next door to the Superdome.'),
  q(H, 'Arenas', 'Which team plays at Paycom Center?', 'Oklahoma City Thunder', ['Utah Jazz', 'Dallas Mavericks', 'San Antonio Spurs'], 'Formerly Chesapeake Energy Arena.'),
  q(H, 'Arenas', 'Which team plays at the Delta Center?', 'Utah Jazz', ['Denver Nuggets', 'Portland Trail Blazers', 'Sacramento Kings'], 'The name returned in 2023 after years as Vivint Arena.'),
  q(H, 'Draft', 'Which team drafted Scottie Pippen in 1987 before trading him to Chicago?', 'Seattle SuperSonics', ['Portland Trail Blazers', 'Sacramento Kings', 'Los Angeles Clippers'], 'Chicago sent Olden Polynice to Seattle.'),
  q(H, 'International', 'Who was the first foreign-born player to win NBA MVP?', 'Hakeem Olajuwon', ['Dirk Nowitzki', 'Steve Nash', 'Patrick Ewing'], 'The Nigerian-born center won in 1994.'),
  q(H, 'Draft', 'Yao Ming was the first overall pick in which year?', '2002', ['2001', '2003', '2000'], 'Houston selected the Shanghai center.'),
  q(H, 'Jersey Numbers', 'Which number did Allen Iverson wear for the 76ers?', '3', ['1', '6', '11'], 'Retired by Philadelphia in 2014.'),
  q(H, 'Jersey Numbers', 'Which number did Reggie Miller wear for the Pacers?', '31', ['13', '33', '11'], 'Retired by Indiana in 2006.'),

  // ── EXPERT ───────────────────────────────────────────
  q(X, 'Playoffs', 'Who scored 61 points in a single NBA Finals game, the record?', 'Elgin Baylor', ['Jerry West', 'Michael Jordan', 'Rick Barry'], 'Game 5 of the 1962 Finals against Boston.'),
  q(X, 'Playoffs', 'Who holds the record for most points in a playoff game (63)?', 'Michael Jordan', ['Wilt Chamberlain', 'Elgin Baylor', 'Donovan Mitchell'], 'Double overtime against Boston in 1986.'),
  q(X, 'Statistics', 'Who holds the record for highest scoring average in a season (50.4)?', 'Wilt Chamberlain', ['Michael Jordan', 'Elgin Baylor', 'Rick Barry'], 'The 1961–62 season, when he also scored 100 in a game.'),
  q(X, 'Awards', 'Who is the only Finals MVP from the losing team?', 'Jerry West', ['Elgin Baylor', 'LeBron James', 'Wilt Chamberlain'], '1969 — the first year the award was given.'),
  q(X, 'Statistics', 'Who holds the record for most three-pointers in a single game (14)?', 'Klay Thompson', ['Stephen Curry', 'Damian Lillard', 'Zach LaVine'], 'Against Chicago in October 2018 — in just 27 minutes.'),
  q(X, 'Eras', 'Which team holds the record 33-game winning streak?', '1971–72 Los Angeles Lakers', ['1995–96 Chicago Bulls', '2012–13 Miami Heat', '2015–16 Golden State Warriors'], 'From November 1971 to January 1972.'),
  q(X, 'Coaches', 'Who coached the 1971–72 Lakers to 69 wins and a title?', 'Bill Sharman', ['Pat Riley', 'Jerry West', 'Fred Schaus'], 'Sharman introduced the game-day shootaround.'),
  q(X, 'Statistics', 'Who scored 73 points in a game in January 2024?', 'Luka Dončić', ['Joel Embiid', 'Devin Booker', 'Karl-Anthony Towns'], 'Against Atlanta — fourth-most in NBA history.'),
  q(X, 'Draft', 'Who was the first overall pick in 2001?', 'Kwame Brown', ['Tyson Chandler', 'Pau Gasol', 'Tony Parker'], 'Washington\'s pick was made by Michael Jordan.'),
  q(X, 'Draft', 'Who was the first overall pick in 2006?', 'Andrea Bargnani', ['LaMarcus Aldridge', 'Brandon Roy', 'Rudy Gay'], 'Toronto took the Italian forward.'),
  q(X, 'Draft', 'Which team drafted Vince Carter in 1998 before trading him to Toronto?', 'Golden State Warriors', ['Boston Celtics', 'Dallas Mavericks', 'Sacramento Kings'], 'Swapped for Antawn Jamison.'),
  q(X, 'Awards', 'Who won Rookie of the Year in 2001–02?', 'Pau Gasol', ['Tony Parker', 'Jason Richardson', 'Shane Battier'], 'The first European to win the award.'),
  q(X, 'Awards', 'Who won Rookie of the Year in 2002–03?', 'Amar\'e Stoudemire', ['Yao Ming', 'Caron Butler', 'Drew Gooden'], 'A rare high-school-to-NBA winner.'),
  q(X, 'Awards', 'Steve Nash won his two MVP awards in which seasons?', '2004–05 and 2005–06', ['2005–06 and 2006–07', '2003–04 and 2004–05', '2006–07 and 2007–08'], 'Both with Phoenix.'),
  q(X, 'Awards', 'Who was MVP of the lockout-shortened 1998–99 season?', 'Karl Malone', ['Tim Duncan', 'Alonzo Mourning', 'Shaquille O\'Neal'], 'Malone\'s second MVP.'),
  q(X, 'Statistics', 'Who has the most career free throws made?', 'Karl Malone', ['Moses Malone', 'Kobe Bryant', 'LeBron James'], '9,787 made free throws.'),
  q(X, 'Statistics', 'Who holds the record for most assists in a single game (30)?', 'Scott Skiles', ['John Stockton', 'Magic Johnson', 'Isiah Thomas'], 'For Orlando against Denver in 1990.'),
  q(X, 'Statistics', 'Who holds the record for most rebounds in a single game (55)?', 'Wilt Chamberlain', ['Bill Russell', 'Nate Thurmond', 'Dennis Rodman'], 'Against Bill Russell\'s Celtics in 1960.'),
  q(X, 'Statistics', 'Who holds the record for most blocks in a single game (17)?', 'Elmore Smith', ['Hakeem Olajuwon', 'Manute Bol', 'Mark Eaton'], 'For the Lakers in 1973, the first season blocks were tracked.'),
  q(X, 'NBA History', 'Against which team did Wilt Chamberlain score 100 points?', 'New York Knicks', ['Boston Celtics', 'Los Angeles Lakers', 'Syracuse Nationals'], 'Philadelphia won 169–147.'),
  q(X, 'NBA History', 'In which city was Wilt Chamberlain\'s 100-point game played?', 'Hershey, Pennsylvania', ['Philadelphia', 'New York', 'Pittsburgh'], 'A neutral-site game at Hershey Sports Arena.'),
  q(X, 'Playoffs', 'Which team won the 1979 NBA championship?', 'Seattle SuperSonics', ['Washington Bullets', 'Portland Trail Blazers', 'Philadelphia 76ers'], 'Seattle beat Washington in a Finals rematch.'),
  q(X, 'Playoffs', 'Which team won the 1977 NBA championship?', 'Portland Trail Blazers', ['Philadelphia 76ers', 'Golden State Warriors', 'Phoenix Suns'], 'Bill Walton led Portland past Philadelphia.'),
  q(X, 'Playoffs', 'Which team won the 1975 NBA championship?', 'Golden State Warriors', ['Washington Bullets', 'Boston Celtics', 'Milwaukee Bucks'], 'A sweep of Washington behind Rick Barry.'),
  q(X, 'Playoffs', 'Which team won the 1978 NBA championship?', 'Washington Bullets', ['Seattle SuperSonics', 'Philadelphia 76ers', 'Denver Nuggets'], 'The franchise\'s only title.'),
  q(X, 'Coaches', 'Who coached the Portland Trail Blazers to the 1977 title?', 'Jack Ramsay', ['Rick Adelman', 'Lenny Wilkens', 'Mike Schuler'], 'Known for his loud plaid trousers.'),
  q(X, 'Coaches', 'Who coached Houston to back-to-back titles in 1994 and 1995?', 'Rudy Tomjanovich', ['Don Chaney', 'Jeff Van Gundy', 'Bill Fitch'], '"Never underestimate the heart of a champion."'),
  q(X, 'Coaches', 'Who coached the Detroit "Bad Boys" to two championships?', 'Chuck Daly', ['Larry Brown', 'Doug Collins', 'Rick Carlisle'], 'Daly also coached the 1992 Dream Team.'),
  q(X, 'Players', 'I was born in Congo.|I won Defensive Player of the Year four times.|I was famous for wagging my finger after blocks.|I played 18 seasons.', 'Dikembe Mutombo', ['Hakeem Olajuwon', 'Serge Ibaka', 'Manute Bol'], 'Mutombo was inducted into the Hall of Fame in 2015.', 'whoami'),
  q(X, 'Players', 'I was drafted 57th overall in 1999.|I am from Argentina.|I won four championships with San Antonio.|I was Sixth Man of the Year in 2008.', 'Manu Ginóbili', ['Tony Parker', 'Luis Scola', 'Andrés Nocioni'], 'Also an Olympic gold medallist in 2004.', 'whoami'),
  q(X, 'Players', 'I was born in Croatia.|I starred for the New Jersey Nets.|I died in a car accident in 1993.|I was inducted into the Hall of Fame in 2002.', 'Dražen Petrović', ['Toni Kukoč', 'Vlade Divac', 'Dino Rađa'], 'Petrović averaged 22.3 points in his final season.', 'whoami'),
  q(X, 'Playoffs', 'Which franchise won its first championship first?', 'Dallas Mavericks', ['Toronto Raptors'], 'Dallas in 2011; Toronto in 2019.', 'ba'),
  q(X, 'Players', 'Who made his NBA debut first?', 'Tim Duncan', ['Dirk Nowitzki'], 'Duncan debuted in 1997; Nowitzki in 1999.', 'ba'),
  q(X, 'Statistics', 'Who scored more career points?', 'Karl Malone', ['Kobe Bryant'], 'Malone: 36,928. Bryant: 33,643.', 'cmp'),
  q(X, 'Statistics', 'Who has more career rebounds?', 'Bill Russell', ['Kareem Abdul-Jabbar'], 'Russell: 21,620. Kareem: 17,440.', 'cmp'),
  q(X, 'Statistics', 'Who averaged more assists per game over his career?', 'Magic Johnson', ['John Stockton'], 'Magic: 11.2 (the all-time record). Stockton: 10.5.', 'cmp'),
  q(X, 'Jersey Numbers', 'Which number did Steve Nash wear in Phoenix?', '13', ['10', '7', '3'], 'He wore 13 in Phoenix and 10 with Dallas and the Lakers.'),
  q(X, 'Arenas', 'Where did the Bulls play before moving to the United Center in 1994?', 'Chicago Stadium', ['Wrigley Field', 'Comiskey Park', 'Rosemont Horizon'], 'Home of the first three Bulls championships.'),
  q(X, 'Arenas', 'Where did the Lakers play before Staples Center opened in 1999?', 'The Forum', ['Los Angeles Memorial Sports Arena', 'Pauley Pavilion', 'Long Beach Arena'], 'The Great Western Forum in Inglewood — home of Showtime.'),
  q(X, 'Statistics', 'Who recorded a 20-point, 20-rebound, 21-assist game in 2019?', 'Russell Westbrook', ['Nikola Jokić', 'James Harden', 'LeBron James'], 'Only Wilt Chamberlain had ever posted a 20-20-20 before.'),
  q(X, 'Draft', 'Which team drafted Pau Gasol in 2001 before trading him to Memphis?', 'Atlanta Hawks', ['Memphis Grizzlies', 'Chicago Bulls', 'Vancouver Grizzlies'], 'Part of the Shareef Abdur-Rahim trade.'),
  q(X, 'Draft', 'What pick was Tony Parker in the 2001 draft?', '28th', ['15th', '41st', '19th'], 'Late first round to San Antonio.'),
  q(X, 'NBA History', 'The first BAA (NBA) game in 1946 was played in which city?', 'Toronto', ['New York', 'Boston', 'Philadelphia'], 'The Knicks beat the Toronto Huskies at Maple Leaf Gardens.'),
  q(X, 'Teams', 'Which franchise was once the Rochester Royals?', 'Sacramento Kings', ['Cleveland Cavaliers', 'Detroit Pistons', 'Atlanta Hawks'], 'Rochester → Cincinnati → Kansas City → Sacramento.'),
  q(X, 'Teams', 'Which franchise began as the Buffalo Braves?', 'Los Angeles Clippers', ['Milwaukee Bucks', 'Brooklyn Nets', 'Toronto Raptors'], 'Buffalo → San Diego → Los Angeles.'),
  q(X, 'Teams', 'Which franchise was the Tri-Cities Blackhawks?', 'Atlanta Hawks', ['Chicago Bulls', 'Detroit Pistons', 'Milwaukee Bucks'], 'Tri-Cities → Milwaukee → St. Louis → Atlanta.'),
  q(X, 'NBA History', 'In which year did the NBA and ABA merge?', '1976', ['1970', '1979', '1972'], 'Four ABA teams joined: Nets, Nuggets, Pacers and Spurs.'),
  q(X, 'NBA History', 'Which team won the first BAA/NBA championship in 1947?', 'Philadelphia Warriors', ['Minneapolis Lakers', 'Boston Celtics', 'New York Knicks'], 'Led by Joe Fulks.'),
  q(X, 'Draft', 'Who was the 2nd overall pick in the 2003 draft?', 'Darko Miličić', ['Carmelo Anthony', 'Chris Bosh', 'Dwyane Wade'], 'Detroit took him ahead of Carmelo, Bosh and Wade.'),
  q(X, 'Draft', 'Who was the 2nd overall pick in the 2004 draft?', 'Emeka Okafor', ['Ben Gordon', 'Dwight Howard', 'Shaun Livingston'], 'Charlotte took Okafor after Orlando picked Dwight Howard.'),
  q(X, 'Nicknames', 'Which player was nicknamed "AK-47"?', 'Andrei Kirilenko', ['Andrea Bargnani', 'Aleksej Pokuševski', 'Alexey Shved'], 'Initials plus his #47, and the Russian rifle.'),
];

// ── Engine ───────────────────────────────────────────
export function seededRandom(seed) {
  let s = 0;
  for (const c of String(seed)) s = (s * 31 + c.charCodeAt(0)) >>> 0;
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
}
export function shuffle(arr, rnd = Math.random) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}
// Picks 20 questions: 5/5/5/5 across difficulties with slight jitter, capped per subject/category, options shuffled.
export function pickGame(seed, exclude = new Set()) {
  const rnd = seed == null ? Math.random : seededRandom(seed);
  const target = { easy: 5, medium: 5, hard: 5, expert: 5 };
  const jit = ['easy', 'medium', 'hard', 'expert'];
  const from = jit[Math.floor(rnd() * 4)], to = jit[Math.floor(rnd() * 4)];
  if (from !== to) { target[from]--; target[to]++; }
  const subj = {}, cat = {}, out = [];
  for (const d of jit) {
    const pool = shuffle(QUESTIONS.filter(x => x.active && x.diff === d && !exclude.has(x.id)), rnd);
    let taken = 0;
    for (const x of pool) {
      if (taken >= target[d]) break;
      if ((subj[x.correct] || 0) >= 2 || (cat[x.cat] || 0) >= 4) continue;
      subj[x.correct] = (subj[x.correct] || 0) + 1; cat[x.cat] = (cat[x.cat] || 0) + 1;
      out.push(x); taken++;
    }
    for (const x of pool) { if (taken >= target[d]) break; if (!out.includes(x)) { out.push(x); taken++; } }
  }
  const order = [];
  for (const d of jit) order.push(...shuffle(out.filter(x => x.diff === d), rnd));
  return order.slice(0, 20).map(x => ({ ...x, options: shuffle([x.correct, ...x.wrongs], rnd), clues: x.type === 'whoami' ? x.text.split('|') : null }));
}
// Endless feed for BUZZ / STREAK. band: array of difficulties to draw from.
// used: Set of ids already served this run. Returns a question with shuffled options, or null.
export function nextQuestion(band, used, rnd = Math.random, subj = {}) {
  let pool = QUESTIONS.filter(x => x.active && band.includes(x.diff) && !used.has(x.id) && (subj[x.correct] || 0) < 2);
  if (!pool.length) pool = QUESTIONS.filter(x => x.active && band.includes(x.diff) && !used.has(x.id));
  if (!pool.length) pool = QUESTIONS.filter(x => x.active && !used.has(x.id));
  if (!pool.length) { used.clear(); pool = QUESTIONS.filter(x => x.active && band.includes(x.diff)); }
  const x = pool[Math.floor(rnd() * pool.length)];
  used.add(x.id); subj[x.correct] = (subj[x.correct] || 0) + 1;
  return { ...x, options: shuffle([x.correct, ...x.wrongs], rnd), clues: x.type === 'whoami' ? x.text.split('|') : null };
}
// Difficulty band for a STREAK run at a given streak length.
export function streakBand(streak) {
  if (streak < 5) return ['easy'];
  if (streak < 10) return ['easy', 'medium'];
  if (streak < 20) return ['medium', 'hard'];
  if (streak < 30) return ['hard'];
  return ['hard', 'expert'];
}
// Adaptive band for BUZZ, nudged by how the player is doing this run.
export function buzzBand(answered, accuracy) {
  if (answered < 5) return ['easy'];
  if (accuracy >= .85) return answered < 15 ? ['easy', 'medium'] : answered < 30 ? ['medium', 'hard'] : ['hard', 'expert'];
  if (accuracy <= .55) return ['easy', 'medium'];
  return answered < 20 ? ['easy', 'medium'] : ['medium', 'hard'];
}
export const streakMult = s => s < 5 ? 1 : s < 10 ? 1.1 : s < 20 ? 1.25 : s < 30 ? 1.5 : 2;
export const MILESTONES = [[3, 'HEATING UP'], [5, 'HOT HAND'], [10, 'DOUBLE DIGITS'], [20, 'ALL-STAR'], [25, "YOU'RE ON FIRE"], [30, 'SUPERSTAR'], [50, 'NBA ENCYCLOPEDIA'], [75, 'HALL OF FAME'], [100, 'KNOW-IT-ALL'], [200, 'BASKETBALL GOD']];
export const BUZZ_START = 24, BUZZ_CAP = 30, BUZZ_WRONG_SEC = 3, QUESTION_LIMIT = 24000;
export const timeBonus = ms => ms < 3000 ? 5 : ms < 5000 ? 2 : 0;
export const buzzSpeedPts = ms => ms < 3000 ? 25 : ms < 5000 ? 10 : 0;

export function validate(qq) {
  const errs = [];
  const opts = [qq.correct, ...(qq.wrongs || [])].filter(Boolean);
  if (!qq.text || !qq.text.trim()) errs.push('Question text is empty');
  if (qq.type !== 'ba' && qq.type !== 'cmp' && opts.length !== 4) errs.push('Needs exactly 4 answer choices');
  if ((qq.type === 'ba' || qq.type === 'cmp') && opts.length !== 2) errs.push('Comparison needs exactly 2 choices');
  if (new Set(opts.map(o => o.trim().toLowerCase())).size !== opts.length) errs.push('Duplicate answer choices');
  if (!qq.correct) errs.push('No correct answer set');
  if (!CATEGORIES.includes(qq.cat)) errs.push('Unknown category');
  if (!['easy', 'medium', 'hard', 'expert'].includes(qq.diff)) errs.push('Unknown difficulty');
  return errs;
}
export const speedBonus = ms => ms < 2000 ? 100 : ms < 4000 ? 75 : ms < 7000 ? 50 : ms < 10000 ? 25 : 0;
export const rating = c => c <= 5 ? 'ROOKIE' : c <= 10 ? 'ROLE PLAYER' : c <= 14 ? 'STARTER' : c <= 17 ? 'ALL-STAR' : c <= 19 ? 'SUPERSTAR' : 'NBA LEGEND';
