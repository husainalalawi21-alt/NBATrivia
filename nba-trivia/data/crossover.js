// crossover.js — Crossover: a player of the day for each level, and a run of
// questions about his career.
//
// Every person gets their own three players a day (one per level), picked from
// the lists below by their account or device and the date in the Gulf. A run
// is up to 10 questions about that player, easiest first; a miss ends it and
// the player can try again with questions they haven't seen yet.
//
// The career facts are hand-written. The build (tools/build.mjs) checks them
// against the Kaggle player records (draft, college, seasons) and the
// champions table (title seasons), and reports any that disagree. Awards
// (MVP, Finals MVP, Rookie of the Year, scoring titles) are read from that
// table, not written here.
//
// Each player:
//   y   [first season, last season] as start years (1998 = 1998-99); last null = still playing
//   d   [draft year, pick, team that drafted him]; pick null for a territorial pick
//   c   college · hs: came straight from high school · ctry: plays for a country other than the USA
//   born  born outside the country he plays for · club: the club he joined the NBA from
//   t   NBA teams in order, as they were called then
//   n   [team, number] pairs
//   r   seasons he won the title
//   s   NBA seasons played (retired players)
//   k   [nickname, Arabic]
//   dp  Defensive Player of the Year awards (retired players)
//   no  templates to skip ('count' when a franchise moved or was renamed mid-career)
//   x   his own questions: [level 0-2, question, answer, [wrong×3], Arabic question, {answer: Arabic}]
import { SEASONS } from './facts.js';
import { FRANCHISE_NAMES, teamNameIn, seasonLabel } from './franchises.js';

export const LEVELS = ['easy', 'medium', 'goat'];
export const RUN = 10;
const TIERS = ['easy', 'medium', 'hard', 'hardest', 'hall_of_fame', 'goat'];
const SHIFT = { easy: 0, medium: 1, goat: 2 };

const P = (name, level, f) => ({ name, level, ...f });
export const PLAYERS = [
  // ── EASY: household names ──────────────────────────────────────────
  P('LeBron James', 'easy', { y: [2003, null], d: [2003, 1, 'Cleveland Cavaliers'], hs: true, t: ['Cleveland Cavaliers', 'Miami Heat', 'Cleveland Cavaliers', 'Los Angeles Lakers'],
    n: [['Miami Heat', '6']], r: ['2011-12', '2012-13', '2015-16', '2019-20'], k: ['King James', 'الملك جيمس'],
    x: [[0, 'In 2023 LeBron passed which player to become the NBA\'s all-time leading scorer?', 'Kareem Abdul-Jabbar', ['Karl Malone', 'Kobe Bryant', 'Michael Jordan'], 'في 2023 تخطى ليبرون أي لاعب وصار الهدّاف التاريخي لـNBA؟'],
        [1, 'Which team drafted LeBron\'s son Bronny in 2024?', 'Los Angeles Lakers', ['Cleveland Cavaliers', 'Miami Heat', 'Golden State Warriors'], 'أي فريق اختار ولد ليبرون، بروني، في درافت 2024؟']] }),
  P('Michael Jordan', 'easy', { y: [1984, 2002], d: [1984, 3, 'Chicago Bulls'], c: 'North Carolina', t: ['Chicago Bulls', 'Washington Wizards'], s: 15, dp: 1,
    n: [['Chicago Bulls', '23']], r: ['1990-91', '1991-92', '1992-93', '1995-96', '1996-97', '1997-98'], k: ['Air Jordan', 'إير جوردن'],
    x: [[1, 'Who went No. 1 in the 1984 draft, two picks before Jordan?', 'Hakeem Olajuwon', ['Sam Bowie', 'Charles Barkley', 'John Stockton'], 'مين انختار رقم 1 في درافت 1984، قبل جوردن بخيارين؟'],
        [2, 'What was Michael Jordan\'s career high in points?', '69', ['63', '64', '72'], 'كم أعلى رصيد نقاط سجله مايكل جوردن في مباراة؟'],
        [2, 'Which minor league baseball team did Jordan play for in 1994?', 'Birmingham Barons', ['Memphis Chicks', 'Nashville Sounds', 'Charlotte Knights'], 'مع أي فريق بيسبول لعب جوردن في 1994؟',
         { 'Birmingham Barons': 'برمنغهام بارونز', 'Memphis Chicks': 'ممفيس تشيكس', 'Nashville Sounds': 'ناشفيل ساوندز', 'Charlotte Knights': 'شارلوت نايتس' }]] }),
  P('Stephen Curry', 'easy', { y: [2009, null], d: [2009, 7, 'Golden State Warriors'], c: 'Davidson', t: ['Golden State Warriors'],
    n: [['Golden State Warriors', '30']], r: ['2014-15', '2016-17', '2017-18', '2021-22'], k: ['Chef Curry', 'الشيف كاري'],
    x: [[0, 'Stephen Curry\'s father also played in the NBA. Who is he?', 'Dell Curry', ['Mychal Thompson', 'Doc Rivers', 'Tim Hardaway'], 'أبو ستيفن كاري لعب في NBA بعد. مين هو؟'],
        [2, 'How many threes did Curry make in his record 2015-16 season?', '402', ['286', '354', '376'], 'كم ثلاثية سجل كاري في موسمه القياسي 2015-16؟']] }),
  P('Victor Wembanyama', 'easy', { y: [2023, null], d: [2023, 1, 'San Antonio Spurs'], ctry: 'France', club: 'Metropolitans 92', t: ['San Antonio Spurs'],
    n: [['San Antonio Spurs', '1']], k: ['The Alien', 'الفضائي'],
    x: [[1, 'Who went No. 2 in 2023, one pick after Wembanyama?', 'Brandon Miller', ['Scoot Henderson', 'Amen Thompson', 'Ausar Thompson'], 'مين انختار رقم 2 في درافت 2023، بعد ويمبانياما بخيار واحد؟']] }),
  P('Kobe Bryant', 'easy', { y: [1996, 2015], d: [1996, 13, 'Charlotte Hornets'], hs: true, t: ['Los Angeles Lakers'], s: 20,
    r: ['1999-00', '2000-01', '2001-02', '2008-09', '2009-10'], k: ['Black Mamba', 'المامبا السوداء'],
    x: [[0, 'Kobe wore No. 8 and which other number for the Lakers?', '24', ['23', '32', '33'], 'كوبي لبس رقم 8 ووش الرقم الثاني اللي لبسه مع الليكرز؟'],
        [1, 'Kobe scored 81 points in 2006 against which team?', 'Toronto Raptors', ['Phoenix Suns', 'Utah Jazz', 'Dallas Mavericks'], 'كوبي سجل 81 نقطة في 2006 ضد أي فريق؟'],
        [1, 'How many points did Kobe score in his final NBA game?', '60', ['42', '50', '55'], 'كم نقطة سجل كوبي في آخر مباراة له في NBA؟'],
        [2, 'Charlotte traded Kobe to the Lakers on draft night for which player?', 'Vlade Divac', ['Elden Campbell', 'Nick Van Exel', 'Cedric Ceballos'], 'شارلوت بادلوا كوبي للّيكرز ليلة الدرافت مقابل أي لاعب؟']] }),
  P('Shaquille O\'Neal', 'easy', { y: [1992, 2010], d: [1992, 1, 'Orlando Magic'], c: 'LSU', t: ['Orlando Magic', 'Los Angeles Lakers', 'Miami Heat', 'Phoenix Suns', 'Cleveland Cavaliers', 'Boston Celtics'], s: 19,
    n: [['Orlando Magic', '32'], ['Los Angeles Lakers', '34']], r: ['1999-00', '2000-01', '2001-02', '2005-06'], k: ['The Diesel', 'الديزل'],
    x: [[1, 'Teams fouled Shaq on purpose because of his free-throw shooting. What was the tactic called?', 'Hack-a-Shaq', ['Box-and-one', 'Triangle', 'Full-court press'], 'الفرق كانت تتعمد تخطي على شاك عشان رمياته الحرة. وش كان اسم هالخطة؟',
         { 'Hack-a-Shaq': 'هاك آ شاك', 'Box-and-one': 'بوكس آند ون', Triangle: 'المثلث', 'Full-court press': 'الضغط في كامل الملعب' }],
        [2, 'In which 1996 movie did Shaq play a genie?', 'Kazaam', ['Space Jam', 'Like Mike', 'Celtic Pride'], 'في أي فيلم سنة 1996 لعب شاك دور جني؟',
         { Kazaam: 'كازام', 'Space Jam': 'سبيس جام', 'Like Mike': 'لايك مايك', 'Celtic Pride': 'سلتك برايد' }]] }),
  P('Kevin Durant', 'easy', { y: [2007, null], d: [2007, 2, 'Seattle SuperSonics'], c: 'Texas', t: ['Seattle SuperSonics', 'Oklahoma City Thunder', 'Golden State Warriors', 'Brooklyn Nets', 'Phoenix Suns'],
    n: [['Oklahoma City Thunder', '35']], r: ['2016-17', '2017-18'], k: ['The Slim Reaper', 'سليم ريبر'],
    x: [[1, 'Who was drafted No. 1 in 2007, one pick ahead of Durant?', 'Greg Oden', ['Al Horford', 'Mike Conley', 'Joakim Noah'], 'مين انختار رقم 1 في درافت 2007، قبل ديورانت بخيار واحد؟'],
        [2, 'How many Olympic gold medals has Kevin Durant won?', '4', ['2', '3', '5'], 'كم ميدالية ذهبية أولمبية فاز فيها كيفن ديورانت؟']] }),
  P('Giannis Antetokounmpo', 'easy', { y: [2013, null], d: [2013, 15, 'Milwaukee Bucks'], ctry: 'Greece', club: 'Filathlitikos', t: ['Milwaukee Bucks'],
    n: [['Milwaukee Bucks', '34']], r: ['2020-21'], k: ['The Greek Freak', 'الوحش اليوناني'],
    x: [[1, 'How many points did Giannis score in Game 6 of the 2021 Finals?', '50', ['41', '44', '47'], 'كم نقطة سجل يانيس في المباراة السادسة من نهائيات 2021؟']] }),
  P('Nikola Jokić', 'easy', { y: [2015, null], d: [2014, 41, 'Denver Nuggets'], ctry: 'Serbia', club: 'Mega Basket', t: ['Denver Nuggets'],
    n: [['Denver Nuggets', '15']], r: ['2022-23'], k: ['The Joker', 'الجوكر'],
    x: [[1, 'TV missed Jokić\'s draft pick because it was showing an ad for what?', 'Taco Bell', ['McDonald\'s', 'Pizza Hut', 'Subway'], 'التلفزيون فوّت لحظة اختيار يوكيتش في الدرافت لأنه كان يعرض إعلان لأي مطعم؟',
         { 'Taco Bell': 'تاكو بيل', "McDonald's": 'ماكدونالدز', 'Pizza Hut': 'بيتزا هت', Subway: 'صب واي' }]] }),
  P('Luka Dončić', 'easy', { y: [2018, null], d: [2018, 3, 'Atlanta Hawks'], ctry: 'Slovenia', club: 'Real Madrid', t: ['Dallas Mavericks', 'Los Angeles Lakers'],
    n: [['Dallas Mavericks', '77']], k: ['Luka Magic', 'لوكا ماجيك'],
    x: [[1, 'Atlanta traded Luka to Dallas on draft night for which player?', 'Trae Young', ['Jaren Jackson Jr.', 'Marvin Bagley III', 'Mo Bamba'], 'أتلانتا بادلوا لوكا لدالاس ليلة الدرافت مقابل أي لاعب؟'],
        [0, 'Dallas traded Luka to the Lakers in 2025 in a deal built around which player?', 'Anthony Davis', ['Austin Reaves', 'D\'Angelo Russell', 'Rui Hachimura'], 'دالاس بادلوا لوكا للّيكرز في 2025 بصفقة كان أساسها أي لاعب؟']] }),
  P('Magic Johnson', 'easy', { y: [1979, 1995], d: [1979, 1, 'Los Angeles Lakers'], c: 'Michigan State', t: ['Los Angeles Lakers'], s: 13,
    n: [['Los Angeles Lakers', '32']], r: ['1979-80', '1981-82', '1984-85', '1986-87', '1987-88'],
    x: [[0, 'What is Magic Johnson\'s real first name?', 'Earvin', ['Ervin', 'Elvin', 'Edwin'], 'وش اسم ماجيك جونسون الحقيقي؟', { Earvin: 'إيرفن', Ervin: 'إرفن', Elvin: 'إلفن', Edwin: 'إدوين' }],
        [2, 'As a rookie, Magic started at center in Game 6 of the 1980 Finals. How many points did he score?', '42', ['31', '36', '45'], 'ماجيك وهو صاعد لعب سنتر في المباراة السادسة من نهائيات 1980. كم نقطة سجل؟']] }),
  P('Larry Bird', 'easy', { y: [1979, 1991], d: [1978, 6, 'Boston Celtics'], c: 'Indiana State', t: ['Boston Celtics'], s: 13,
    n: [['Boston Celtics', '33']], r: ['1980-81', '1983-84', '1985-86'], k: ['Larry Legend', 'لاري الأسطورة'],
    x: [[2, 'Bird won the first All-Star Three-Point Contest. In which year?', '1986', ['1984', '1985', '1988'], 'بيرد فاز بأول مسابقة ثلاثيات في أول ستار. في أي سنة؟']] }),
  P('Kareem Abdul-Jabbar', 'easy', { y: [1969, 1988], d: [1969, 1, 'Milwaukee Bucks'], c: 'UCLA', t: ['Milwaukee Bucks', 'Los Angeles Lakers'], s: 20,
    n: [['Milwaukee Bucks', '33']], r: ['1970-71', '1979-80', '1981-82', '1984-85', '1986-87', '1987-88'],
    x: [[0, 'What was Kareem\'s signature shot called?', 'Skyhook', ['Dream Shake', 'Finger roll', 'Fadeaway'], 'وش اسم التسديدة اللي اشتهر فيها كريم؟',
         { Skyhook: 'السكاي هوك', 'Dream Shake': 'الدريم شيك', 'Finger roll': 'الفينغر رول', Fadeaway: 'الفيد أواي' }],
        [1, 'What was Kareem\'s name before he changed it in 1971?', 'Lew Alcindor', ['Lew Alston', 'Lewis Allen', 'Lou Alcott'], 'وش كان اسم كريم قبل لا يغيّره في 1971؟',
         { 'Lew Alcindor': 'لو ألسندور', 'Lew Alston': 'لو ألستون', 'Lewis Allen': 'لويس ألن', 'Lou Alcott': 'لو ألكوت' }]] }),
  P('Kyrie Irving', 'easy', { y: [2011, null], d: [2011, 1, 'Cleveland Cavaliers'], c: 'Duke', born: 'Australia', t: ['Cleveland Cavaliers', 'Boston Celtics', 'Brooklyn Nets', 'Dallas Mavericks'],
    n: [['Cleveland Cavaliers', '2']], r: ['2015-16'], k: ['Uncle Drew', 'العم درو'],
    x: [[1, 'Kyrie hit the go-ahead three in Game 7 of the 2016 Finals over which player?', 'Stephen Curry', ['Klay Thompson', 'Draymond Green', 'Andre Iguodala'], 'كايري سجل ثلاثية التقدم في المباراة السابعة من نهائيات 2016 على أي لاعب؟']] }),
  P('James Harden', 'easy', { y: [2009, null], d: [2009, 3, 'Oklahoma City Thunder'], c: 'Arizona State', t: ['Oklahoma City Thunder', 'Houston Rockets', 'Brooklyn Nets', 'Philadelphia 76ers', 'Los Angeles Clippers'],
    n: [['Houston Rockets', '13']], k: ['The Beard', 'اللحية'],
    x: [[1, 'Harden won Sixth Man of the Year in 2012 with which team?', 'Oklahoma City Thunder', ['Houston Rockets', 'Brooklyn Nets', 'Los Angeles Clippers'], 'هاردن فاز بجائزة أفضل لاعب بديل في 2012 مع أي فريق؟']] }),
  P('Russell Westbrook', 'easy', { y: [2008, null], d: [2008, 4, 'Seattle SuperSonics'], c: 'UCLA', t: ['Oklahoma City Thunder', 'Houston Rockets', 'Washington Wizards', 'Los Angeles Lakers', 'Los Angeles Clippers', 'Denver Nuggets'],
    n: [['Oklahoma City Thunder', '0']], k: ['Mr. Triple-Double', 'مستر تريبل دبل'],
    x: [[1, 'In 2016-17 Westbrook averaged a triple-double for a season, the first player to do it since who?', 'Oscar Robertson', ['Magic Johnson', 'Wilt Chamberlain', 'Jason Kidd'], 'في 2016-17 وستبروك جاب معدل تريبل دبل لموسم كامل، وأول واحد يسويها من بعد مين؟']] }),
  P('Dwyane Wade', 'easy', { y: [2003, 2018], d: [2003, 5, 'Miami Heat'], c: 'Marquette', t: ['Miami Heat', 'Chicago Bulls', 'Cleveland Cavaliers', 'Miami Heat'], s: 16,
    n: [['Miami Heat', '3']], r: ['2005-06', '2011-12', '2012-13'], k: ['Flash', 'فلاش'],
    x: [[2, 'Who was drafted No. 2 in 2003, between LeBron and Carmelo, three picks ahead of Wade?', 'Darko Miličić', ['Chris Bosh', 'Chris Kaman', 'Kirk Hinrich'], 'مين انختار رقم 2 في درافت 2003، بين ليبرون وكارميلو؟']] }),
  P('Allen Iverson', 'easy', { y: [1996, 2009], d: [1996, 1, 'Philadelphia 76ers'], c: 'Georgetown', t: ['Philadelphia 76ers', 'Denver Nuggets', 'Detroit Pistons', 'Memphis Grizzlies', 'Philadelphia 76ers'], s: 14,
    n: [['Philadelphia 76ers', '3']], k: ['The Answer', 'الجواب'],
    x: [[1, 'In the 2001 Finals Iverson famously stepped over which Lakers player?', 'Tyronn Lue', ['Derek Fisher', 'Rick Fox', 'Brian Shaw'], 'في نهائيات 2001 إيفرسون عدّى من فوق أي لاعب من الليكرز في اللقطة المشهورة؟']] }),
  P('Jayson Tatum', 'easy', { y: [2017, null], d: [2017, 3, 'Boston Celtics'], c: 'Duke', t: ['Boston Celtics'], n: [['Boston Celtics', '0']], r: ['2023-24'],
    x: [[1, 'Boston traded the No. 1 pick in 2017 and took Tatum at No. 3. Who went No. 1?', 'Markelle Fultz', ['Lonzo Ball', 'De\'Aaron Fox', 'Josh Jackson'], 'بوسطن تنازلوا عن الخيار الأول في 2017 واختاروا تاتوم رقم 3. مين انختار رقم 1؟']] }),
  P('Anthony Davis', 'easy', { y: [2012, null], d: [2012, 1, 'New Orleans Hornets'], c: 'Kentucky', t: ['New Orleans Hornets', 'New Orleans Pelicans', 'Los Angeles Lakers', 'Dallas Mavericks'],
    n: [['Los Angeles Lakers', '3']], r: ['2019-20'], k: ['The Brow', 'الحاجب'], no: ['count'],
    x: [[1, 'Davis won the NCAA title with Kentucky in which year?', '2012', ['2010', '2011', '2013'], 'ديفيس فاز ببطولة الجامعات مع كنتاكي في أي سنة؟']] }),
  P('Shai Gilgeous-Alexander', 'easy', { y: [2018, null], d: [2018, 11, 'Charlotte Hornets'], c: 'Kentucky', ctry: 'Canada', t: ['Los Angeles Clippers', 'Oklahoma City Thunder'],
    n: [['Oklahoma City Thunder', '2']], r: ['2024-25'],
    x: [[1, 'The Clippers sent SGA to Oklahoma City in a trade for which player?', 'Paul George', ['Russell Westbrook', 'Chris Paul', 'Steven Adams'], 'الكليبرز أرسلوا SGA لأوكلاهوما سيتي في صفقة مقابل أي لاعب؟']] }),
  P('Joel Embiid', 'easy', { y: [2016, null], d: [2014, 3, 'Philadelphia 76ers'], c: 'Kansas', ctry: 'Cameroon', t: ['Philadelphia 76ers'], n: [['Philadelphia 76ers', '21']], k: ['The Process', 'العملية'] }),
  P('Kawhi Leonard', 'easy', { y: [2011, null], d: [2011, 15, 'Indiana Pacers'], c: 'San Diego State', t: ['San Antonio Spurs', 'Toronto Raptors', 'Los Angeles Clippers'],
    n: [['Toronto Raptors', '2']], r: ['2013-14', '2018-19'], k: ['The Claw', 'المخلب'],
    x: [[1, 'Kawhi\'s 2019 Game 7 buzzer-beater bounced four times on the rim. Which team did it knock out?', 'Philadelphia 76ers', ['Milwaukee Bucks', 'Boston Celtics', 'Orlando Magic'], 'تسديدة كواي في المباراة السابعة سنة 2019 نطّت أربع مرات على الحلق. أي فريق طلّعت؟']] }),
  P('Damian Lillard', 'easy', { y: [2012, null], d: [2012, 6, 'Portland Trail Blazers'], c: 'Weber State', t: ['Portland Trail Blazers', 'Milwaukee Bucks'],
    n: [['Portland Trail Blazers', '0']], k: ['Dame Time', 'وقت دام'],
    x: [[0, 'Portland traded Lillard in 2023 to team him up with which star in Milwaukee?', 'Giannis Antetokounmpo', ['Khris Middleton', 'Brook Lopez', 'Jrue Holiday'], 'بورتلاند بادلوا ليلارد في 2023 عشان يلعب مع أي نجم في ميلووكي؟'],
        [1, 'In 2019 Lillard waved goodbye after a series-ending buzzer-beater against which team?', 'Oklahoma City Thunder', ['Houston Rockets', 'Denver Nuggets', 'Golden State Warriors'], 'في 2019 ليلارد لوّح مودّع بعد تسديدة الإقصاء ضد أي فريق؟']] }),
  P('Carmelo Anthony', 'easy', { y: [2003, 2021], d: [2003, 3, 'Denver Nuggets'], c: 'Syracuse', t: ['Denver Nuggets', 'New York Knicks', 'Oklahoma City Thunder', 'Houston Rockets', 'Portland Trail Blazers', 'Los Angeles Lakers'], s: 19,
    n: [['Denver Nuggets', '15'], ['New York Knicks', '7']],
    x: [[1, 'Carmelo won the NCAA title with Syracuse in which year?', '2003', ['2002', '2004', '2005'], 'كارميلو فاز ببطولة الجامعات مع سيراكيوز في أي سنة؟'],
        [2, 'How many Olympic gold medals did Carmelo win?', '3', ['1', '2', '4'], 'كم ميدالية ذهبية أولمبية فاز فيها كارميلو؟']] }),
  P('Ja Morant', 'easy', { y: [2019, null], d: [2019, 2, 'Memphis Grizzlies'], c: 'Murray State', t: ['Memphis Grizzlies'], n: [['Memphis Grizzlies', '12']],
    x: [[0, 'Who went No. 1 in 2019, one pick ahead of Ja Morant?', 'Zion Williamson', ['RJ Barrett', 'De\'Andre Hunter', 'Darius Garland'], 'مين انختار رقم 1 في 2019، قبل جا مورانت بخيار واحد؟'],
        [2, 'Morant played college basketball at Murray State, in which state?', 'Kentucky', ['Tennessee', 'Ohio', 'Indiana'], 'مورانت لعب كرة السلة الجامعية في موراي ستيت، في أي ولاية؟',
         { Kentucky: 'كنتاكي', Tennessee: 'تينيسي', Ohio: 'أوهايو', Indiana: 'إنديانا' }],
        [1, 'Ja Morant won which award in 2022?', 'Most Improved Player', ['Sixth Man of the Year', 'Defensive Player of the Year', 'Clutch Player of the Year'], 'جا مورانت فاز بأي جائزة في 2022؟',
         { 'Most Improved Player': 'أكثر لاعب تطوّراً', 'Sixth Man of the Year': 'أفضل لاعب بديل', 'Defensive Player of the Year': 'أفضل مدافع', 'Clutch Player of the Year': 'أفضل لاعب في اللحظات الحاسمة' }]] }),
  P('Anthony Edwards', 'easy', { y: [2020, null], d: [2020, 1, 'Minnesota Timberwolves'], c: 'Georgia', t: ['Minnesota Timberwolves'], n: [['Minnesota Timberwolves', '5']], k: ['Ant-Man', 'آنت مان'],
    x: [[1, 'Who went No. 2 in the 2020 draft, one pick after Edwards?', 'James Wiseman', ['LaMelo Ball', 'Obi Toppin', 'Deni Avdija'], 'مين انختار رقم 2 في درافت 2020، بعد إدواردز بخيار واحد؟'],
        [2, 'In 2024 Edwards led Minnesota past the defending champions in the West semifinals. Who were they?', 'Denver Nuggets', ['Golden State Warriors', 'Phoenix Suns', 'Los Angeles Lakers'], 'في 2024 إدواردز قاد مينيسوتا للفوز على حامل اللقب في نصف نهائي الغرب. مين كانوا؟'],
        [1, 'Edwards won Olympic gold with Team USA in which year?', '2024', ['2012', '2016', '2020'], 'إدواردز فاز بالذهبية الأولمبية مع منتخب أمريكا في أي سنة؟']] }),

  // ── MEDIUM: big names, a level deeper ──────────────────────────────
  P('Jason Kidd', 'medium', { y: [1994, 2012], d: [1994, 2, 'Dallas Mavericks'], c: 'California', t: ['Dallas Mavericks', 'Phoenix Suns', 'New Jersey Nets', 'Dallas Mavericks', 'New York Knicks'], s: 19,
    n: [['New Jersey Nets', '5']], r: ['2010-11'],
    x: [[1, 'Kidd shared the 1995 Rookie of the Year award with which player?', 'Grant Hill', ['Glenn Robinson', 'Eddie Jones', 'Juwan Howard'], 'كيد تقاسم جائزة أفضل لاعب صاعد في 1995 مع أي لاعب؟'],
        [1, 'As a coach, Kidd led which team to the 2024 NBA Finals?', 'Dallas Mavericks', ['Milwaukee Bucks', 'Brooklyn Nets', 'Boston Celtics'], 'كيد كمدرب وصل بأي فريق لنهائيات 2024؟']] }),
  P('Dirk Nowitzki', 'medium', { y: [1998, 2018], d: [1998, 9, 'Milwaukee Bucks'], ctry: 'Germany', club: 'DJK Würzburg', t: ['Dallas Mavericks'], s: 21,
    n: [['Dallas Mavericks', '41']], r: ['2010-11'],
    x: [[0, 'What was Dirk\'s signature shot?', 'One-legged fadeaway', ['Skyhook', 'Dream Shake', 'Finger roll'], 'وش التسديدة اللي اشتهر فيها ديرك؟',
         { 'One-legged fadeaway': 'الفيد أواي على رجل وحدة', Skyhook: 'السكاي هوك', 'Dream Shake': 'الدريم شيك', 'Finger roll': 'الفينغر رول' }],
        [2, 'Dallas got Dirk on draft night in a trade with Milwaukee for which player?', 'Robert Traylor', ['Paul Pierce', 'Antawn Jamison', 'Vince Carter'], 'دالاس جابوا ديرك ليلة الدرافت بصفقة مع ميلووكي مقابل أي لاعب؟']] }),
  P('Tim Duncan', 'medium', { y: [1997, 2015], d: [1997, 1, 'San Antonio Spurs'], c: 'Wake Forest', born: 'U.S. Virgin Islands', t: ['San Antonio Spurs'], s: 19,
    n: [['San Antonio Spurs', '21']], r: ['1998-99', '2002-03', '2004-05', '2006-07', '2013-14'], k: ['The Big Fundamental', 'الأساسي الكبير'],
    x: [[1, 'Before basketball, Duncan trained to compete at the Olympics in which sport?', 'Swimming', ['Track', 'Boxing', 'Volleyball'], 'قبل كرة السلة، دنكن كان يتدرب عشان يشارك في الأولمبياد بأي رياضة؟',
         { Swimming: 'السباحة', Track: 'ألعاب القوى', Boxing: 'الملاكمة', Volleyball: 'كرة الطائرة' }]] }),
  P('Hakeem Olajuwon', 'medium', { y: [1984, 2001], d: [1984, 1, 'Houston Rockets'], c: 'Houston', ctry: 'Nigeria', t: ['Houston Rockets', 'Toronto Raptors'], s: 18, dp: 2,
    n: [['Houston Rockets', '34']], r: ['1993-94', '1994-95'], k: ['The Dream', 'الحلم'],
    x: [[1, 'Hakeem\'s high-flying University of Houston teams had what nickname?', 'Phi Slama Jama', ['Fab Five', 'Showtime', 'Bad Boys'], 'وش كان لقب فريق جامعة هيوستن اللي لعب فيه حكيم؟',
         { 'Phi Slama Jama': 'فاي سلاما جاما', 'Fab Five': 'الفاب فايف', Showtime: 'شوتايم', 'Bad Boys': 'باد بويز' }]] }),
  P('Kevin Garnett', 'medium', { y: [1995, 2015], d: [1995, 5, 'Minnesota Timberwolves'], hs: true, t: ['Minnesota Timberwolves', 'Boston Celtics', 'Brooklyn Nets', 'Minnesota Timberwolves'], s: 21, dp: 1,
    n: [['Minnesota Timberwolves', '21'], ['Boston Celtics', '5']], r: ['2007-08'], k: ['The Big Ticket', 'التذكرة الكبيرة'] }),
  P('Paul Pierce', 'medium', { y: [1998, 2016], d: [1998, 10, 'Boston Celtics'], c: 'Kansas', t: ['Boston Celtics', 'Brooklyn Nets', 'Washington Wizards', 'Los Angeles Clippers'], s: 19,
    n: [['Boston Celtics', '34']], r: ['2007-08'], k: ['The Truth', 'الحقيقة'] }),
  P('Ray Allen', 'medium', { y: [1996, 2013], d: [1996, 5, 'Minnesota Timberwolves'], c: 'Connecticut', t: ['Milwaukee Bucks', 'Seattle SuperSonics', 'Boston Celtics', 'Miami Heat'], s: 18,
    n: [['Boston Celtics', '20']], r: ['2007-08', '2012-13'],
    x: [[1, 'In which Spike Lee film did Ray Allen star?', 'He Got Game', ['Blue Chips', 'White Men Can\'t Jump', 'Above the Rim'], 'في أي فيلم لسبايك لي مثّل راي ألن؟',
         { 'He Got Game': 'هي غات غيم', 'Blue Chips': 'بلو تشيبس', "White Men Can't Jump": 'وايت مِن كانت جمب', 'Above the Rim': 'أبوف ذا ريم' }],
        [1, 'Ray Allen\'s famous corner three in Game 6 of the 2013 Finals came against which team?', 'San Antonio Spurs', ['Oklahoma City Thunder', 'Dallas Mavericks', 'Indiana Pacers'], 'ثلاثية راي ألن المشهورة من الزاوية في المباراة السادسة من نهائيات 2013 كانت ضد أي فريق؟']] }),
  P('Steve Nash', 'medium', { y: [1996, 2014], d: [1996, 15, 'Phoenix Suns'], c: 'Santa Clara', ctry: 'Canada', born: 'South Africa', t: ['Phoenix Suns', 'Dallas Mavericks', 'Phoenix Suns', 'Los Angeles Lakers'], s: 18,
    n: [['Phoenix Suns', '13']],
    x: [[1, 'After retiring, Nash became head coach of which team?', 'Brooklyn Nets', ['Phoenix Suns', 'Dallas Mavericks', 'Toronto Raptors'], 'بعد الاعتزال، ناش صار مدرب أي فريق؟']] }),
  P('Tony Parker', 'medium', { y: [2001, 2018], d: [2001, 28, 'San Antonio Spurs'], ctry: 'France', born: 'Belgium', club: 'Paris Basket Racing', t: ['San Antonio Spurs', 'Charlotte Hornets'], s: 18,
    n: [['San Antonio Spurs', '9']], r: ['2002-03', '2004-05', '2006-07', '2013-14'] }),
  P('Manu Ginóbili', 'medium', { y: [2002, 2017], d: [1999, 57, 'San Antonio Spurs'], ctry: 'Argentina', club: 'Virtus Bologna', t: ['San Antonio Spurs'], s: 16,
    n: [['San Antonio Spurs', '20']], r: ['2002-03', '2004-05', '2006-07', '2013-14'],
    x: [[1, 'Ginóbili led Argentina to Olympic gold in which year?', '2004', ['2000', '2008', '2012'], 'جينوبيلي قاد الأرجنتين للذهبية الأولمبية في أي سنة؟']] }),
  P('Pau Gasol', 'medium', { y: [2001, 2018], d: [2001, 3, 'Atlanta Hawks'], ctry: 'Spain', club: 'FC Barcelona', t: ['Memphis Grizzlies', 'Los Angeles Lakers', 'Chicago Bulls', 'San Antonio Spurs', 'Milwaukee Bucks'], s: 18,
    n: [['Los Angeles Lakers', '16']], r: ['2008-09', '2009-10'],
    x: [[1, 'Pau\'s brother Marc won an NBA title with which team?', 'Toronto Raptors', ['Memphis Grizzlies', 'Los Angeles Lakers', 'Golden State Warriors'], 'أخو باو، مارك، فاز ببطولة NBA مع أي فريق؟']] }),
  P('Scottie Pippen', 'medium', { y: [1987, 2003], d: [1987, 5, 'Seattle SuperSonics'], c: 'Central Arkansas', t: ['Chicago Bulls', 'Houston Rockets', 'Portland Trail Blazers', 'Chicago Bulls'], s: 17,
    n: [['Chicago Bulls', '33']], r: ['1990-91', '1991-92', '1992-93', '1995-96', '1996-97', '1997-98'],
    x: [[2, 'Seattle traded Pippen to Chicago on draft night for which player?', 'Olden Polynice', ['Horace Grant', 'Charles Oakley', 'Brad Sellers'], 'سياتل بادلوا بيبن لشيكاغو ليلة الدرافت مقابل أي لاعب؟']] }),
  P('Dennis Rodman', 'medium', { y: [1986, 1999], d: [1986, 27, 'Detroit Pistons'], c: 'Southeastern Oklahoma State', t: ['Detroit Pistons', 'San Antonio Spurs', 'Chicago Bulls', 'Los Angeles Lakers', 'Dallas Mavericks'], s: 14, dp: 2,
    n: [['Chicago Bulls', '91']], r: ['1988-89', '1989-90', '1995-96', '1996-97', '1997-98'], k: ['The Worm', 'الدودة'],
    x: [[2, 'Rodman led the NBA in rebounding how many seasons in a row?', '7', ['4', '5', '6'], 'رودمان تصدّر الدوري في الريباوند كم موسم ورا بعض؟']] }),
  P('Charles Barkley', 'medium', { y: [1984, 1999], d: [1984, 5, 'Philadelphia 76ers'], c: 'Auburn', t: ['Philadelphia 76ers', 'Phoenix Suns', 'Houston Rockets'], s: 16,
    n: [['Philadelphia 76ers', '34']], k: ['Sir Charles', 'سير تشارلز'],
    x: [[1, 'Barkley\'s Suns lost the 1993 Finals to which team?', 'Chicago Bulls', ['Houston Rockets', 'Seattle SuperSonics', 'New York Knicks'], 'فينكس مع باركلي خسروا نهائيات 1993 قدام أي فريق؟']] }),
  P('Karl Malone', 'medium', { y: [1985, 2003], d: [1985, 13, 'Utah Jazz'], c: 'Louisiana Tech', t: ['Utah Jazz', 'Los Angeles Lakers'], s: 19,
    n: [['Utah Jazz', '32']], k: ['The Mailman', 'ساعي البريد'] }),
  P('John Stockton', 'medium', { y: [1984, 2002], d: [1984, 16, 'Utah Jazz'], c: 'Gonzaga', t: ['Utah Jazz'], s: 19, n: [['Utah Jazz', '12']],
    x: [[1, 'Stockton is the NBA\'s all-time leader in which two stats?', 'Assists and steals', ['Assists and threes', 'Steals and blocks', 'Assists and games played'], 'ستوكتون هو المتصدر التاريخي لـNBA في أي إحصائيتين؟',
         { 'Assists and steals': 'التمريرات الحاسمة والسرقات', 'Assists and threes': 'التمريرات الحاسمة والثلاثيات', 'Steals and blocks': 'السرقات والصدّات', 'Assists and games played': 'التمريرات الحاسمة وعدد المباريات' }]] }),
  P('Patrick Ewing', 'medium', { y: [1985, 2001], d: [1985, 1, 'New York Knicks'], c: 'Georgetown', born: 'Jamaica', t: ['New York Knicks', 'Seattle SuperSonics', 'Orlando Magic'], s: 17,
    n: [['New York Knicks', '33']] }),
  P('David Robinson', 'medium', { y: [1989, 2002], d: [1987, 1, 'San Antonio Spurs'], c: 'Navy', t: ['San Antonio Spurs'], s: 14, dp: 1,
    n: [['San Antonio Spurs', '50']], r: ['1998-99', '2002-03'], k: ['The Admiral', 'الأدميرال'],
    x: [[2, 'Robinson won the 1994 scoring title by scoring how many points on the season\'s last day?', '71', ['52', '60', '64'], 'روبنسون فاز بلقب الهدّاف في 1994 بعد ما سجل كم نقطة في آخر يوم من الموسم؟']] }),
  P('Reggie Miller', 'medium', { y: [1987, 2004], d: [1987, 11, 'Indiana Pacers'], c: 'UCLA', t: ['Indiana Pacers'], s: 18, n: [['Indiana Pacers', '31']],
    x: [[1, 'Reggie scored 8 points in 8.9 seconds in 1995 against which team?', 'New York Knicks', ['Chicago Bulls', 'Orlando Magic', 'Boston Celtics'], 'ريجي سجل 8 نقاط في 8.9 ثانية سنة 1995 ضد أي فريق؟']] }),
  P('Tracy McGrady', 'medium', { y: [1997, 2012], d: [1997, 9, 'Toronto Raptors'], hs: true, t: ['Toronto Raptors', 'Orlando Magic', 'Houston Rockets', 'New York Knicks', 'Detroit Pistons', 'Atlanta Hawks', 'San Antonio Spurs'],
    n: [['Orlando Magic', '1']],
    x: [[1, 'T-Mac scored 13 points in about 35 seconds in 2004 against which team?', 'San Antonio Spurs', ['Dallas Mavericks', 'Los Angeles Lakers', 'Sacramento Kings'], 'تي ماك سجل 13 نقطة في 35 ثانية تقريباً سنة 2004 ضد أي فريق؟'],
        [1, 'Which future Hall of Famer is T-Mac\'s cousin and was his Toronto teammate?', 'Vince Carter', ['Chris Bosh', 'Grant Hill', 'Antonio Davis'], 'مين ولد عم تي ماك اللي لعب معه في تورنتو؟']] }),
  P('Vince Carter', 'medium', { y: [1998, 2019], d: [1998, 5, 'Golden State Warriors'], c: 'North Carolina', t: ['Toronto Raptors', 'New Jersey Nets', 'Orlando Magic', 'Phoenix Suns', 'Dallas Mavericks', 'Memphis Grizzlies', 'Sacramento Kings', 'Atlanta Hawks'], s: 22,
    n: [['Toronto Raptors', '15']], k: ['Air Canada', 'إير كندا'],
    x: [[2, 'Golden State traded Vince to Toronto on draft night for which player?', 'Antawn Jamison', ['Tracy McGrady', 'Jason Kidd', 'Paul Pierce'], 'غولدن ستيت بادلوا فينس لتورنتو ليلة الدرافت مقابل أي لاعب؟']] }),
  P('Yao Ming', 'medium', { y: [2002, 2010], d: [2002, 1, 'Houston Rockets'], ctry: 'China', club: 'Shanghai Sharks', t: ['Houston Rockets'], n: [['Houston Rockets', '11']] }),
  P('Derrick Rose', 'medium', { y: [2008, 2023], d: [2008, 1, 'Chicago Bulls'], c: 'Memphis', t: ['Chicago Bulls', 'New York Knicks', 'Cleveland Cavaliers', 'Minnesota Timberwolves', 'Detroit Pistons', 'New York Knicks', 'Memphis Grizzlies'],
    n: [['Chicago Bulls', '1']],
    x: [[1, 'Rose is the youngest MVP in NBA history. How old was he?', '22', ['21', '23', '24'], 'روز هو أصغر MVP في تاريخ NBA. كم كان عمره؟']] }),
  P('Klay Thompson', 'medium', { y: [2011, null], d: [2011, 11, 'Golden State Warriors'], c: 'Washington State', t: ['Golden State Warriors', 'Dallas Mavericks'],
    n: [['Golden State Warriors', '11']], r: ['2014-15', '2016-17', '2017-18', '2021-22'],
    x: [[1, 'Klay set an NBA record with 37 points in one what?', 'Quarter', ['Half', 'Overtime', 'Playoff game'], 'كلاي سجل رقم قياسي بـ37 نقطة في وحدة من هذي. وش هي؟',
         { Quarter: 'ربع واحد', Half: 'شوط واحد', Overtime: 'وقت إضافي', 'Playoff game': 'مباراة بلاي أوف' }],
        [2, 'Klay\'s father Mychal won two titles with which team?', 'Los Angeles Lakers', ['Portland Trail Blazers', 'Boston Celtics', 'Detroit Pistons'], 'أبو كلاي، مايكل، فاز ببطولتين مع أي فريق؟']] }),
  P('Draymond Green', 'medium', { y: [2012, null], d: [2012, 35, 'Golden State Warriors'], c: 'Michigan State', t: ['Golden State Warriors'],
    n: [['Golden State Warriors', '23']], r: ['2014-15', '2016-17', '2017-18', '2021-22'] }),
  P('Chris Bosh', 'medium', { y: [2003, 2015], d: [2003, 4, 'Toronto Raptors'], c: 'Georgia Tech', t: ['Toronto Raptors', 'Miami Heat'], s: 13,
    n: [['Toronto Raptors', '4'], ['Miami Heat', '1']], r: ['2011-12', '2012-13'],
    x: [[1, 'Bosh\'s offensive rebound in Game 6 of the 2013 Finals set up whose corner three?', 'Ray Allen', ['LeBron James', 'Mike Miller', 'Shane Battier'], 'ريباوند بوش الهجومي في المباراة السادسة من نهائيات 2013 جاب ثلاثية مين من الزاوية؟']] }),
  P('Grant Hill', 'medium', { y: [1994, 2012], d: [1994, 3, 'Detroit Pistons'], c: 'Duke', t: ['Detroit Pistons', 'Orlando Magic', 'Phoenix Suns', 'Los Angeles Clippers'],
    n: [['Detroit Pistons', '33']],
    x: [[1, 'Grant Hill shared the 1995 Rookie of the Year award with which player?', 'Jason Kidd', ['Glenn Robinson', 'Eddie Jones', 'Juwan Howard'], 'غرانت هيل تقاسم جائزة أفضل لاعب صاعد في 1995 مع أي لاعب؟']] }),
  P('Paul George', 'medium', { y: [2010, null], d: [2010, 10, 'Indiana Pacers'], c: 'Fresno State', t: ['Indiana Pacers', 'Oklahoma City Thunder', 'Los Angeles Clippers', 'Philadelphia 76ers'],
    n: [['Indiana Pacers', '24']], k: ['PG-13', 'PG-13'],
    x: [[1, 'Indiana traded Paul George to Oklahoma City for Victor Oladipo and which player?', 'Domantas Sabonis', ['Myles Turner', 'Thaddeus Young', 'Lance Stephenson'], 'إنديانا بادلوا بول جورج لأوكلاهوما سيتي مقابل فيكتور أولاديبو وأي لاعب؟'],
        [2, 'Paul George suffered a badly broken leg in 2014 while playing for which team?', 'Team USA', ['Indiana Pacers', 'Oklahoma City Thunder', 'The East All-Stars'], 'بول جورج انكسرت رجله كسر قوي في 2014 وهو يلعب مع أي فريق؟',
         { 'Team USA': 'منتخب أمريكا', 'The East All-Stars': 'منتخب الشرق في الأول ستار' }],
        [1, 'Paul George changed his Pacers number from 24 to what, to match his nickname?', '13', ['3', '23', '31'], 'بول جورج غيّر رقمه مع إنديانا من 24 لأي رقم عشان يطابق لقبه؟']] }),
  P('Jimmy Butler', 'medium', { y: [2011, null], d: [2011, 30, 'Chicago Bulls'], c: 'Marquette', t: ['Chicago Bulls', 'Minnesota Timberwolves', 'Philadelphia 76ers', 'Miami Heat', 'Golden State Warriors'],
    n: [['Miami Heat', '22']], k: ['Jimmy Buckets', 'جيمي باكتس'],
    x: [[2, 'Before Marquette, Butler played a season at which junior college?', 'Tyler Junior College', ['Chipola College', 'Odessa College', 'Trinity Valley CC'], 'قبل ماركيت، بتلر لعب موسم في أي كلية؟',
         { 'Tyler Junior College': 'كلية تايلر', 'Chipola College': 'كلية تشيبولا', 'Odessa College': 'كلية أوديسا', 'Trinity Valley CC': 'كلية ترينيتي فالي' }],
        [1, 'Miami traded Butler to Golden State in 2025 in a deal that brought back which player?', 'Andrew Wiggins', ['Jonathan Kuminga', 'Draymond Green', 'Buddy Hield'], 'ميامي بادلوا بتلر لغولدن ستيت في 2025 بصفقة جابت لهم أي لاعب؟'],
        [1, 'In 2023 Butler led an 8th seed all the way to the Finals. Which team?', 'Miami Heat', ['Chicago Bulls', 'Philadelphia 76ers', 'Minnesota Timberwolves'], 'في 2023 بتلر وصل بفريق مصنّف ثامن للنهائيات. أي فريق؟']] }),
  P('Blake Griffin', 'medium', { y: [2010, 2022], d: [2009, 1, 'Los Angeles Clippers'], c: 'Oklahoma', t: ['Los Angeles Clippers', 'Detroit Pistons', 'Brooklyn Nets', 'Boston Celtics'],
    n: [['Los Angeles Clippers', '32']],
    x: [[1, 'Blake won the 2011 Slam Dunk Contest by jumping over what?', 'A car', ['A teammate', 'A mascot', 'A table'], 'بليك فاز بمسابقة السلام دنك 2011 لما نط فوق وش؟',
         { 'A car': 'سيارة', 'A teammate': 'زميله في الفريق', 'A mascot': 'تميمة الفريق', 'A table': 'طاولة' }]] }),
  P('Wilt Chamberlain', 'medium', { y: [1959, 1972], d: [1959, null, 'Philadelphia Warriors'], c: 'Kansas', t: ['Philadelphia Warriors', 'San Francisco Warriors', 'Philadelphia 76ers', 'Los Angeles Lakers'], s: 14,
    n: [['Philadelphia Warriors', '13']], r: ['1966-67', '1971-72'], k: ['The Big Dipper', 'الدب الأكبر'], no: ['count'],
    x: [[0, 'Wilt scored 100 points in a game in 1962 against which team?', 'New York Knicks', ['Boston Celtics', 'Los Angeles Lakers', 'Syracuse Nationals'], 'ويلت سجل 100 نقطة في مباراة سنة 1962 ضد أي فريق؟']] }),

  // ── GOAT LEVEL: for the real historians ───────────────────────────
  P('Bernard King', 'goat', { y: [1977, 1992], d: [1977, 7, 'New Jersey Nets'], c: 'Tennessee', t: ['New Jersey Nets', 'Utah Jazz', 'Golden State Warriors', 'New York Knicks', 'Washington Bullets', 'New Jersey Nets'],
    n: [['New York Knicks', '30']],
    x: [[1, 'King scored 60 points on Christmas Day 1984 against which team?', 'New Jersey Nets', ['Boston Celtics', 'Philadelphia 76ers', 'Detroit Pistons'], 'كينغ سجل 60 نقطة يوم الكريسماس 1984 ضد أي فريق؟'],
        [2, 'In 1984 King scored 50 points in back-to-back games in which state?', 'Texas', ['California', 'Florida', 'Ohio'], 'في 1984 كينغ سجل 50 نقطة في مباراتين ورا بعض في أي ولاية؟', { Texas: 'تكساس', California: 'كاليفورنيا', Florida: 'فلوريدا', Ohio: 'أوهايو' }]] }),
  P('Julius Erving', 'goat', { y: [1976, 1986], d: [1972, 12, 'Milwaukee Bucks'], c: 'Massachusetts', t: ['Philadelphia 76ers'], s: 11,
    n: [['Philadelphia 76ers', '6']], r: ['1982-83'], k: ['Dr. J', 'دكتور جي'],
    x: [[1, 'Before the NBA, Dr. J won two ABA titles with which team?', 'New York Nets', ['Virginia Squires', 'Indiana Pacers', 'Kentucky Colonels'], 'قبل NBA، دكتور جي فاز ببطولتين في الـABA مع أي فريق؟',
         { 'Virginia Squires': 'فيرجينيا سكوايرز', 'Kentucky Colonels': 'كنتاكي كولونيلز' }]] }),
  P('Gary Payton', 'goat', { y: [1990, 2006], d: [1990, 2, 'Seattle SuperSonics'], c: 'Oregon State', t: ['Seattle SuperSonics', 'Milwaukee Bucks', 'Los Angeles Lakers', 'Boston Celtics', 'Miami Heat'], s: 17, dp: 1,
    n: [['Seattle SuperSonics', '20']], r: ['2005-06'], k: ['The Glove', 'القفاز'],
    x: [[2, 'Payton was the last point guard to win Defensive Player of the Year until which player in 2022?', 'Marcus Smart', ['Jrue Holiday', 'Chris Paul', 'Kawhi Leonard'], 'بايتون كان آخر صانع ألعاب يفوز بجائزة أفضل مدافع لين أي لاعب في 2022؟']] }),
  P('Dominique Wilkins', 'goat', { y: [1982, 1998], d: [1982, 3, 'Utah Jazz'], c: 'Georgia', t: ['Atlanta Hawks', 'Los Angeles Clippers', 'Boston Celtics', 'San Antonio Spurs', 'Orlando Magic'],
    n: [['Atlanta Hawks', '21']], k: ['The Human Highlight Film', 'الهايلايت البشري'],
    x: [[1, 'Wilkins\' legendary 1988 Slam Dunk Contest final was against which player?', 'Michael Jordan', ['Spud Webb', 'Clyde Drexler', 'Larry Nance'], 'نهائي مسابقة السلام دنك الأسطوري في 1988 كان بين ويلكنز وأي لاعب؟']] }),
  P('George Gervin', 'goat', { y: [1976, 1985], c: 'Eastern Michigan', t: ['San Antonio Spurs', 'Chicago Bulls'],
    n: [['San Antonio Spurs', '44']], k: ['The Iceman', 'رجل الثلج'],
    x: [[0, 'What was Gervin\'s signature shot?', 'Finger roll', ['Skyhook', 'Dream Shake', 'Step-back three'], 'وش التسديدة اللي اشتهر فيها غيرفن؟',
         { 'Finger roll': 'الفينغر رول', Skyhook: 'السكاي هوك', 'Dream Shake': 'الدريم شيك', 'Step-back three': 'الستيب باك ثري' }],
        [2, 'Gervin scored 63 on the last day of 1977-78 to win the scoring title over which player?', 'David Thompson', ['Bob McAdoo', 'Pete Maravich', 'Julius Erving'], 'غيرفن سجل 63 في آخر يوم من موسم 1977-78 وخطف لقب الهدّاف من أي لاعب؟']] }),
  P('Elgin Baylor', 'goat', { y: [1958, 1971], d: [1958, 1, 'Minneapolis Lakers'], c: 'Seattle', t: ['Minneapolis Lakers', 'Los Angeles Lakers'], s: 14,
    n: [['Los Angeles Lakers', '22']], no: ['count', 'rings'],
    x: [[1, 'Baylor scored 61 points in a 1962 Finals game against which team?', 'Boston Celtics', ['St. Louis Hawks', 'Syracuse Nationals', 'Philadelphia Warriors'], 'بايلور سجل 61 نقطة في مباراة من نهائيات 1962 ضد أي فريق؟']] }),
  P('Jerry West', 'goat', { y: [1960, 1973], d: [1960, 2, 'Minneapolis Lakers'], c: 'West Virginia', t: ['Los Angeles Lakers'], s: 14,
    n: [['Los Angeles Lakers', '44']], r: ['1971-72'], k: ['Mr. Clutch', 'مستر كلتش'],
    x: [[0, 'Jerry West\'s silhouette is said to be the model for what?', 'The NBA logo', ['The Larry O\'Brien Trophy', 'The Lakers logo', 'The MVP trophy'], 'يقولون إن صورة جيري ويست هي اللي انرسم منها وش؟',
         { 'The NBA logo': 'شعار NBA', "The Larry O'Brien Trophy": 'كأس لاري أوبراين', 'The Lakers logo': 'شعار الليكرز', 'The MVP trophy': 'كأس الـMVP' }]] }),
  P('Oscar Robertson', 'goat', { y: [1960, 1973], d: [1960, 1, 'Cincinnati Royals'], c: 'Cincinnati', t: ['Cincinnati Royals', 'Milwaukee Bucks'], s: 14,
    n: [['Cincinnati Royals', '14']], r: ['1970-71'], k: ['The Big O', 'الـO الكبير'],
    x: [[1, 'Robertson averaged a triple-double for a whole season in which year?', '1961-62', ['1960-61', '1963-64', '1966-67'], 'روبرتسون جاب معدل تريبل دبل لموسم كامل في أي موسم؟']] }),
  P('Bill Russell', 'goat', { y: [1956, 1968], d: [1956, 2, 'St. Louis Hawks'], c: 'San Francisco', t: ['Boston Celtics'], s: 13,
    n: [['Boston Celtics', '6']], r: ['1956-57', '1958-59', '1959-60', '1960-61', '1961-62', '1962-63', '1963-64', '1964-65', '1965-66', '1967-68', '1968-69'],
    x: [[0, 'Which NBA award is named after Bill Russell?', 'Finals MVP', ['MVP', 'Defensive Player of the Year', 'Rookie of the Year'], 'أي جائزة في NBA تحمل اسم بيل راسل؟',
         { 'Finals MVP': 'أفضل لاعب في النهائيات', MVP: 'أفضل لاعب في الموسم', 'Defensive Player of the Year': 'أفضل مدافع', 'Rookie of the Year': 'أفضل لاعب صاعد' }]] }),
  P('Bob Cousy', 'goat', { y: [1950, 1969], d: [1950, 3, 'Tri-Cities Blackhawks'], c: 'Holy Cross', t: ['Boston Celtics', 'Cincinnati Royals'], s: 14,
    n: [['Boston Celtics', '14']], r: ['1956-57', '1958-59', '1959-60', '1960-61', '1961-62', '1962-63'], k: ['Houdini of the Hardwood', 'هوديني الباركيه'],
    x: [[1, 'Cousy ended up in Boston after his name was drawn out of what?', 'A hat', ['A lottery machine', 'A bowl of envelopes', 'A coin toss'], 'كوزي انتقل لبوسطن بعد ما طلع اسمه من وش؟',
         { 'A hat': 'قبعة', 'A lottery machine': 'آلة قرعة', 'A bowl of envelopes': 'صحن ظروف', 'A coin toss': 'رمي عملة' }]] }),
  P('Pete Maravich', 'goat', { y: [1970, 1979], d: [1970, 3, 'Atlanta Hawks'], c: 'LSU', t: ['Atlanta Hawks', 'New Orleans Jazz', 'Utah Jazz', 'Boston Celtics'], s: 10,
    n: [['New Orleans Jazz', '7']], k: ['Pistol Pete', 'بيت المسدس'], no: ['count'],
    x: [[2, 'Maravich holds the NCAA record for career scoring average. What was it?', '44.2', ['38.1', '40.5', '41.9'], 'مارافيتش عنده الرقم القياسي لمعدل التسجيل في الجامعات. كم كان؟']] }),
  P('Rick Barry', 'goat', { y: [1965, 1979], d: [1965, 2, 'San Francisco Warriors'], c: 'Miami', t: ['San Francisco Warriors', 'Golden State Warriors', 'Houston Rockets'], s: 10,
    n: [['Golden State Warriors', '24']], r: ['1974-75'], no: ['count'],
    x: [[0, 'Rick Barry was famous for shooting free throws how?', 'Underhanded', ['One-handed', 'With his eyes closed', 'Off the backboard'], 'ريك باري كان مشهور إنه يرمي الرميات الحرة بأي طريقة؟',
         { Underhanded: 'من تحت', 'One-handed': 'بيد وحدة', 'With his eyes closed': 'وهو مغمض عيونه', 'Off the backboard': 'على اللوح' }]] }),
  P('Isiah Thomas', 'goat', { y: [1981, 1993], d: [1981, 2, 'Detroit Pistons'], c: 'Indiana', t: ['Detroit Pistons'], s: 13,
    n: [['Detroit Pistons', '11']], r: ['1988-89', '1989-90'], k: ['Zeke', 'زيك'],
    x: [[1, 'Isiah won the 1981 NCAA title at Indiana under which coach?', 'Bob Knight', ['Dean Smith', 'John Wooden', 'Mike Krzyzewski'], 'آيزايا فاز ببطولة الجامعات 1981 مع إنديانا تحت قيادة أي مدرب؟']] }),
  P('Kevin McHale', 'goat', { y: [1980, 1992], d: [1980, 3, 'Boston Celtics'], c: 'Minnesota', t: ['Boston Celtics'], s: 13,
    n: [['Boston Celtics', '32']], r: ['1980-81', '1983-84', '1985-86'],
    x: [[2, 'How many times did McHale win Sixth Man of the Year?', '2', ['1', '3', '4'], 'كم مرة فاز ماكهيل بجائزة أفضل لاعب بديل؟']] }),
  P('James Worthy', 'goat', { y: [1982, 1993], d: [1982, 1, 'Los Angeles Lakers'], c: 'North Carolina', t: ['Los Angeles Lakers'], s: 12,
    n: [['Los Angeles Lakers', '42']], r: ['1984-85', '1986-87', '1987-88'], k: ['Big Game James', 'جيمس المباريات الكبيرة'],
    x: [[1, 'Worthy won the 1982 NCAA title at North Carolina alongside which future superstar?', 'Michael Jordan', ['Patrick Ewing', 'Charles Barkley', 'Hakeem Olajuwon'], 'ورذي فاز ببطولة الجامعات 1982 مع نورث كارولاينا وكان معه أي نجم؟']] }),
  P('Clyde Drexler', 'goat', { y: [1983, 1997], d: [1983, 14, 'Portland Trail Blazers'], c: 'Houston', t: ['Portland Trail Blazers', 'Houston Rockets'], s: 15,
    n: [['Portland Trail Blazers', '22']], r: ['1994-95'], k: ['Clyde the Glide', 'كلايد الطائر'],
    x: [[1, 'Drexler won his title in Houston next to which former college teammate?', 'Hakeem Olajuwon', ['Otis Thorpe', 'Robert Horry', 'Sam Cassell'], 'دريكسلر فاز بالبطولة في هيوستن مع أي زميل قديم من أيام الجامعة؟']] }),
  P('Alex English', 'goat', { y: [1976, 1990], d: [1976, 23, 'Milwaukee Bucks'], c: 'South Carolina', t: ['Milwaukee Bucks', 'Indiana Pacers', 'Denver Nuggets', 'Dallas Mavericks'], s: 15,
    n: [['Denver Nuggets', '2']],
    x: [[1, 'Alex English scored more points than any other player in which decade?', 'The 1980s', ['The 1970s', 'The 1990s', 'The 2000s'], 'أليكس إنغلش سجل نقاط أكثر من أي لاعب ثاني في أي عقد؟',
         { 'The 1980s': 'الثمانينات', 'The 1970s': 'السبعينات', 'The 1990s': 'التسعينات', 'The 2000s': 'الألفينات' }]] }),
  P('Walt Frazier', 'goat', { y: [1967, 1979], d: [1967, 5, 'New York Knicks'], c: 'Southern Illinois', t: ['New York Knicks', 'Cleveland Cavaliers'], s: 13,
    n: [['New York Knicks', '10']], r: ['1969-70', '1972-73'], k: ['Clyde', 'كلايد'],
    x: [[2, 'In Game 7 of the 1970 Finals Frazier scored 36 points with how many assists?', '19', ['12', '15', '17'], 'في المباراة السابعة من نهائيات 1970 فريزر سجل 36 نقطة ومعها كم تمريرة حاسمة؟']] }),
  P('Willis Reed', 'goat', { y: [1964, 1973], c: 'Grambling State', t: ['New York Knicks'], s: 10,
    n: [['New York Knicks', '19']], r: ['1969-70', '1972-73'], k: ['The Captain', 'الكابتن'],
    x: [[1, 'Reed limped out for Game 7 of the 1970 Finals against which team?', 'Los Angeles Lakers', ['Boston Celtics', 'Milwaukee Bucks', 'Baltimore Bullets'], 'ريد طلع وهو يعرج في المباراة السابعة من نهائيات 1970 ضد أي فريق؟']] }),
  P('Dave Cowens', 'goat', { y: [1970, 1982], d: [1970, 4, 'Boston Celtics'], c: 'Florida State', t: ['Boston Celtics', 'Milwaukee Bucks'], s: 11,
    n: [['Boston Celtics', '18']], r: ['1973-74', '1975-76'], k: ['Big Red', 'الأحمر الكبير'],
    x: [[2, 'During a break from basketball in 1976, Cowens famously worked as what?', 'A taxi driver', ['A firefighter', 'A teacher', 'A mailman'], 'في استراحته من كرة السلة سنة 1976، كوينز اشتغل وش؟',
         { 'A taxi driver': 'سوّاق تاكسي', 'A firefighter': 'رجل إطفاء', 'A teacher': 'مدرّس', 'A mailman': 'ساعي بريد' }]] }),
  P('Bob McAdoo', 'goat', { y: [1972, 1985], d: [1972, 2, 'Buffalo Braves'], c: 'North Carolina', t: ['Buffalo Braves', 'New York Knicks', 'Boston Celtics', 'Detroit Pistons', 'New Jersey Nets', 'Los Angeles Lakers', 'Philadelphia 76ers'], s: 14,
    n: [['Buffalo Braves', '11']], r: ['1981-82', '1984-85'] }),
  P('Chris Mullin', 'goat', { y: [1985, 2000], d: [1985, 7, 'Golden State Warriors'], c: 'St. John\'s', t: ['Golden State Warriors', 'Indiana Pacers', 'Golden State Warriors'], s: 16,
    n: [['Golden State Warriors', '17']],
    x: [[0, 'Mullin, Tim Hardaway and Mitch Richmond formed which Golden State trio?', 'Run TMC', ['Splash Brothers', 'Showtime', 'Bad Boys'], 'مولين وتيم هارداواي وميتش ريتشموند كانوا أي ثلاثي في غولدن ستيت؟',
         { 'Run TMC': 'رن تي إم سي', 'Splash Brothers': 'سبلاش براذرز', Showtime: 'شوتايم', 'Bad Boys': 'باد بويز' }]] }),
  P('Alonzo Mourning', 'goat', { y: [1992, 2007], d: [1992, 2, 'Charlotte Hornets'], c: 'Georgetown', t: ['Charlotte Hornets', 'Miami Heat', 'New Jersey Nets', 'Miami Heat'], dp: 2,
    n: [['Miami Heat', '33']], r: ['2005-06'], k: ['Zo', 'زو'],
    x: [[1, 'Mourning came back to play after which organ transplant?', 'Kidney', ['Liver', 'Heart', 'Lung'], 'مورنينغ رجع يلعب بعد زراعة أي عضو؟', { Kidney: 'كلية', Liver: 'كبد', Heart: 'قلب', Lung: 'رئة' }]] }),
  P('Dikembe Mutombo', 'goat', { y: [1991, 2008], d: [1991, 4, 'Denver Nuggets'], c: 'Georgetown', ctry: 'DR Congo', t: ['Denver Nuggets', 'Atlanta Hawks', 'Philadelphia 76ers', 'New Jersey Nets', 'New York Knicks', 'Houston Rockets'], s: 18, dp: 4,
    n: [['Denver Nuggets', '55']], k: ['Mount Mutombo', 'جبل موتومبو'],
    x: [[0, 'What did Mutombo famously do after blocking a shot?', 'Wag his finger', ['Flex his arms', 'Salute the crowd', 'Point to the sky'], 'وش كان يسوي موتومبو بعد ما يصد تسديدة؟',
         { 'Wag his finger': 'يهز صبعه', 'Flex his arms': 'يستعرض عضلاته', 'Salute the crowd': 'يحيي الجمهور', 'Point to the sky': 'يأشر للسما' }]] }),
  P('Shawn Kemp', 'goat', { y: [1989, 2002], d: [1989, 17, 'Seattle SuperSonics'], t: ['Seattle SuperSonics', 'Cleveland Cavaliers', 'Portland Trail Blazers', 'Orlando Magic'], s: 14,
    n: [['Seattle SuperSonics', '40']], k: ['Reign Man', 'رين مان'],
    x: [[1, 'Kemp and Payton\'s Sonics reached the 1996 Finals and lost to which team?', 'Chicago Bulls', ['Houston Rockets', 'Utah Jazz', 'Orlando Magic'], 'سياتل مع كيمب وبايتون وصلوا نهائيات 1996 وخسروا قدام أي فريق؟']] }),
  P('Chris Webber', 'goat', { y: [1993, 2007], d: [1993, 1, 'Orlando Magic'], c: 'Michigan', t: ['Golden State Warriors', 'Washington Bullets', 'Sacramento Kings', 'Philadelphia 76ers', 'Detroit Pistons', 'Golden State Warriors'], s: 15,
    n: [['Sacramento Kings', '4']], k: ['C-Webb', 'سي ويب'],
    x: [[0, 'Webber\'s famous Michigan freshman class was called what?', 'Fab Five', ['Phi Slama Jama', 'Run TMC', 'Showtime'], 'دفعة ويبر المشهورة في ميشيغان كان اسمها وش؟',
         { 'Fab Five': 'الفاب فايف', 'Phi Slama Jama': 'فاي سلاما جاما', 'Run TMC': 'رن تي إم سي', Showtime: 'شوتايم' }],
        [2, 'Orlando traded Webber on draft night for which player?', 'Anfernee Hardaway', ['Shawn Bradley', 'Jamal Mashburn', 'Isaiah Rider'], 'أورلاندو بادلوا ويبر ليلة الدرافت مقابل أي لاعب؟']] }),
  P('Tim Hardaway', 'goat', { y: [1989, 2002], d: [1989, 14, 'Golden State Warriors'], c: 'UTEP', t: ['Golden State Warriors', 'Miami Heat', 'Dallas Mavericks', 'Denver Nuggets', 'Indiana Pacers'],
    n: [['Golden State Warriors', '10']],
    x: [[0, 'What was Hardaway\'s famous crossover called?', 'UTEP Two-Step', ['Dream Shake', 'Shammgod', 'Eurostep'], 'وش كان اسم الكروس أوفر المشهور حق هارداواي؟',
         { 'UTEP Two-Step': 'يوتيب تو ستيب', 'Dream Shake': 'الدريم شيك', Shammgod: 'شامغود', Eurostep: 'اليورو ستيب' }]] }),
  P('Earl Monroe', 'goat', { y: [1967, 1979], d: [1967, 2, 'Baltimore Bullets'], c: 'Winston-Salem State', t: ['Baltimore Bullets', 'New York Knicks'], s: 13,
    n: [['New York Knicks', '15']], r: ['1972-73'], k: ['The Pearl', 'اللؤلؤة'] }),
  P('Nate Archibald', 'goat', { y: [1970, 1983], d: [1970, 19, 'Cincinnati Royals'], c: 'UTEP', t: ['Cincinnati Royals', 'Kansas City Kings', 'New York Nets', 'Boston Celtics', 'Milwaukee Bucks'], s: 13,
    n: [['Boston Celtics', '7']], r: ['1980-81'], k: ['Tiny', 'تايني'], no: ['count'],
    x: [[1, 'In 1972-73 Archibald led the league in points and what else?', 'Assists', ['Rebounds', 'Steals', 'Minutes'], 'في 1972-73 أرشيبالد تصدّر الدوري في النقاط ووش بعد؟',
         { Assists: 'التمريرات الحاسمة', Rebounds: 'الريباوند', Steals: 'السرقات', Minutes: 'الدقايق' }]] })
];

// ── awards from the champions table ─────────────────────────────────
// [season, champion, runner-up, Finals MVP, MVP, champion coach, Rookie of the Year, scoring leader]
const BY_SEASON = new Map(SEASONS.map(r => [r[0], r]));
const AWARDS = new Map();
for (const [s, , , fmvp, mvp, , roy, scoring] of SEASONS) for (const [who, k] of [[fmvp, 'fmvp'], [mvp, 'mvp'], [roy, 'roy'], [scoring, 'scoring']]) {
  if (!who) continue;
  const a = AWARDS.get(who) || { fmvp: [], mvp: [], roy: [], scoring: [] }; a[k].push(s); AWARDS.set(who, a);
}
export const awardsOf = name => AWARDS.get(name) || { fmvp: [], mvp: [], roy: [], scoring: [] };
export const championOf = season => (BY_SEASON.get(season) || [])[1] || null;

// ── wrong answers ───────────────────────────────────────────────────
const seededRandom = seed => { let s = 0; for (const c of String(seed)) s = (s * 31 + c.charCodeAt(0)) >>> 0; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; };
const pick = (pool, n, rnd, not = []) => { const a = [...new Set(pool)].filter(x => !not.includes(x)); const out = []; while (out.length < n && a.length) out.push(a.splice(Math.floor(rnd() * a.length), 1)[0]); return out; };
const startYear = s => parseInt(s, 10);
// Every name a franchise has had → its ids (Charlotte Hornets belongs to two).
const IDS_OF = new Map();
for (const [id, list] of Object.entries(FRANCHISE_NAMES)) for (const [, name] of list) IDS_OF.set(name, [...(IDS_OF.get(name) || []), +id]);
const sameFranchise = (a, b) => a === b || (IDS_OF.get(a) || []).some(id => (IDS_OF.get(b) || []).includes(id));
// The teams of a season, as they were called then.
const teamsIn = y => Object.entries(FRANCHISE_NAMES).filter(([, l]) => y >= l[0][0]).map(([id]) => teamNameIn({ id: +id }, y));
function otherTeams(p, rnd, n = 3, keep = []) {
  const from = p.y[0], to = Math.min(p.y[1] ?? 2025, 2025), pool = [];
  for (let y = from; y <= to; y++) pool.push(...teamsIn(y));
  const mine = [...p.t, p.d ? p.d[2] : null, ...keep].filter(Boolean);
  return pick(pool.filter(x => !x.includes('/') && !mine.some(m => sameFranchise(m, x))), n, rnd);
}
const COLLEGES = ['Kentucky', 'Duke', 'North Carolina', 'Kansas', 'UCLA', 'Michigan State', 'Arizona', 'Georgetown', 'Syracuse', 'Indiana', 'Michigan', 'Texas',
  'Connecticut', 'Villanova', 'Louisville', 'Florida', 'Ohio State', 'Wake Forest', 'LSU', 'Memphis', 'Gonzaga', 'Houston', 'Marquette', 'Georgia Tech', 'Notre Dame',
  'Maryland', 'Oklahoma', 'Purdue', 'Illinois', 'Auburn', 'Alabama', 'Virginia', 'UNLV', 'Cincinnati', 'Arizona State', 'Washington', 'Stanford', 'St. John\'s'];
const COUNTRIES = ['France', 'Spain', 'Germany', 'Serbia', 'Slovenia', 'Greece', 'Argentina', 'Canada', 'Australia', 'Nigeria', 'Cameroon', 'China', 'Lithuania', 'Croatia', 'Italy', 'Turkey', 'Brazil'];
const BIRTHPLACES = ['Bahamas', 'Puerto Rico', 'Jamaica', 'England', 'Canada', 'Australia', 'Belgium', 'South Africa', 'U.S. Virgin Islands', 'Nigeria', 'France', 'Germany'];
const CLUBS = ['Real Madrid', 'FC Barcelona', 'Panathinaikos', 'Olympiacos', 'Maccabi Tel Aviv', 'CSKA Moscow', 'Fenerbahçe', 'Partizan', 'Žalgiris', 'ASVEL', 'Virtus Bologna',
  'Mega Basket', 'Metropolitans 92', 'Shanghai Sharks', 'Paris Basket Racing', 'DJK Würzburg', 'Filathlitikos', 'Anadolu Efes', 'Olimpia Milano', 'Red Star Belgrade'];
const NUMBERS = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13', '14', '15', '20', '21', '22', '23', '24', '25', '30', '31', '32', '33', '34', '35', '40', '41', '42', '44', '45', '50', '55', '77'];
const near = (v, rnd, lo = 0, spread = 3) => { const out = new Set(); let guard = 0; while (out.size < 3 && guard++ < 50) { const d = Math.ceil(rnd() * spread) * (rnd() < 0.5 ? -1 : 1), x = v + d; if (x >= lo && x !== v) out.add(x); } return [...out]; };
const nearSeasons = (s, rnd) => near(startYear(s), rnd, 1946).map(seasonLabel);
const counts = (n, rnd) => (n === 0 ? [1, 2, 3] : near(n, rnd, 0, 2)).map(String);
const pickLabel = n => `No. ${n}`;

// ── the questions about one player ─────────────────────────────────
const slug = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
export const playerId = p => slug(p.name);

// level 0 = the easiest kind of question about him; 1, 2 harder. Points follow
// the question's level, raised by one for Medium players and two for GOAT level.
export function questionsFor(p, A) {
  const N = A ? A.N : (x => x), name = p.name, an = N(name), id = playerId(p), out = [];
  const active = p.y[1] == null, a = awardsOf(name), skip = new Set(p.no || []);
  const firsts = [...new Set(p.t)];
  const others = except => firsts.filter(x => !sameFranchise(x, except));
  const add = (key, lvl, q, correct, wrongs, ar, exp, expAr, labels = null) => {
    if (!wrongs || wrongs.length < 3 || new Set([correct, ...wrongs.slice(0, 3)]).size < 4) return;
    out.push({ key, lvl, q, correct, wrongs: wrongs.slice(0, 3), ar, exp, expAr, labels });
  };
  const rndFor = key => seededRandom(`${id}:${key}`);
  // draft
  if (p.d) {
    const [y, pk, team] = p.d;
    const dx = pk ? `${name} went No. ${pk} to the ${team} in the ${y} draft.` : `The ${team} took ${name} as a territorial pick in ${y}.`;
    const dxAr = pk ? `اختاره ${N(team)} رقم ${pk} في درافت ${y}.` : `${N(team)} اختاروه كاختيار إقليمي في ${y}.`;
    const trap = firsts[0] && !sameFranchise(firsts[0], team) ? [firsts[0]] : [];
    add('draft-team', 0, `Which team drafted ${name}?`, team, [...trap, ...otherTeams(p, rndFor('draft-team'), 3 - trap.length, [team])],
      `أي فريق اختار ${an} في الدرافت؟`, dx, dxAr);
    if (pk) add('draft-pick', 1, `What pick was ${name} in the ${y} draft?`, pickLabel(pk), near(pk, rndFor('draft-pick'), 1, pk > 10 ? 6 : 3).map(pickLabel),
      `${an} انختار بأي رقم في درافت ${y}؟`, dx, dxAr);
    add('draft-year', 2, `In which year was ${name} drafted?`, String(y), near(y, rndFor('draft-year'), 1946).map(String),
      `في أي سنة انختار ${an} في الدرافت؟`, dx, dxAr);
  }
  // before the NBA
  if (p.c) add('college', 1, `Which college did ${name} play for?`, p.c, pick(COLLEGES, 3, rndFor('college'), [p.c]),
    `أي جامعة لعب لها ${an} قبل NBA؟`, `${name} played college basketball at ${p.c}.`, `${an} لعب كرة السلة الجامعية في ${N(p.c)}.`);
  if (p.club) add('club', 1, `Which club did ${name} play for before joining the NBA?`, p.club, pick(CLUBS, 3, rndFor('club'), [p.club]),
    `مع أي نادي لعب ${an} قبل لا ينضم لـNBA؟`, `${name} joined the NBA from ${p.club}.`, `${an} جا لـNBA من ${N(p.club)}.`);
  if (p.ctry) add('country', 0, `Which country is ${name} from?`, p.ctry, pick(COUNTRIES, 3, rndFor('country'), [p.ctry, p.born]),
    `${an} من أي دولة؟`, `${name} plays for ${p.ctry}.`, `${an} يلعب لمنتخب ${N(p.ctry)}.`);
  if (p.born) add('born', 1, `Where was ${name} born?`, p.born, pick(BIRTHPLACES, 3, rndFor('born'), [p.born, p.ctry]),
    `وين انولد ${an}؟`, `${name} was born in ${p.born}.`, `${an} انولد في ${N(p.born)}.`);
  // teams
  const many = firsts.length > 1, draftedThere = !!(p.d && sameFranchise(p.d[2], p.t[0]));
  if (many && !draftedThere) add('first-team', 0, `Which team did ${name} begin his NBA career with?`, p.t[0], otherTeams(p, rndFor('first-team'), 2).concat(others(p.t[0]).slice(0, 1)),
    `مع أي فريق بدأ ${an} مسيرته في NBA؟`, `${name} broke in with the ${p.t[0]}.`, `${an} بدأ مسيرته مع ${N(p.t[0])}.`);
  if (!many && !active) add('one-team', 0, `${name} spent his entire NBA career with which team?`, p.t[0], otherTeams(p, rndFor('one-team')),
    `${an} قضى مسيرته كلها في NBA مع أي فريق؟`, `${name} played every NBA season for the ${p.t[0]}.`, `${an} لعب كل مواسمه في NBA مع ${N(p.t[0])}.`);
  if (!many && active && !draftedThere) add('first-team', 0, `Which team did ${name} begin his NBA career with?`, p.t[0], otherTeams(p, rndFor('first-team')),
    `مع أي فريق بدأ ${an} مسيرته في NBA؟`, `${name} broke in with the ${p.t[0]}.`, `${an} بدأ مسيرته مع ${N(p.t[0])}.`);
  if (many && !active) {
    const last = p.t[p.t.length - 1];
    add('last-team', 1, `Which team did ${name} play for in his final NBA season?`, last, otherTeams(p, rndFor('last-team'), 2).concat(others(last).slice(0, 1)),
      `مع أي فريق لعب ${an} آخر موسم له في NBA؟`, `${name} finished his career with the ${last}.`, `${an} ختم مسيرته مع ${N(last)}.`);
    const distinct = firsts.filter((x, i) => !firsts.slice(0, i).some(y => sameFranchise(x, y)));
    if (distinct.length >= 3) { const never = otherTeams(p, rndFor('never'), 1)[0], played = pick(distinct, 3, rndFor('never-p'));
      if (never) add('never', 1, `Which of these teams did ${name} never play for?`, never, played,
        `أي فريق من هذول ما لعب له ${an} أبد؟`, `${name} played for the ${distinct.join(', ')}.`, `${an} لعب مع ${A ? A.list(distinct.map(N)).replace(' أو ', ' و') : distinct.join(', ')}.`); }
    if (!skip.has('count')) add('team-count', 2, `How many NBA teams did ${name} play for?`, String(distinct.length), counts(distinct.length, rndFor('team-count')).filter(x => +x > 0),
      `مع كم فريق لعب ${an} في NBA؟`, `${name} played for ${distinct.length} teams.`, `${an} لعب مع ${distinct.length} فرق.`);
  }
  for (const [i, [team, num]] of (p.n || []).entries())
    add(`number-${i}`, 1, `Which number did ${name} wear for the ${team}?`, num, pick(NUMBERS, 3, rndFor(`number-${i}`), [num]),
      `أي رقم لبس ${an} مع ${N(team)}؟`, `${name} wore No. ${num} for the ${team}.`, `${an} لبس رقم ${num} مع ${N(team)}.`);
  // titles
  const rings = p.r || [];
  if (!skip.has('rings') && !active) add('ring-count', 1, `How many NBA championships did ${name} win?`, rings.length ? String(rings.length) : 'None',
    counts(rings.length, rndFor('ring-count')).map(x => (x === '0' ? 'None' : x)),
    `كم بطولة NBA فاز فيها ${an}؟`, rings.length ? `${name} won ${rings.length} title${rings.length > 1 ? 's' : ''}.` : `${name} never won an NBA title.`,
    rings.length ? `${an} فاز بـ${A ? A.titles(rings.length) : rings.length}.` : `${an} ما فاز ببطولة NBA.`);
  if (rings.length) {
    const s = rings[0], team = championOf(s);
    add('first-ring', 1, `In which season did ${name} win his first NBA title?`, s, nearSeasons(s, rndFor('first-ring')),
      `في أي موسم فاز ${an} بأول بطولة NBA له؟`, `${name} won his first title in ${s} with the ${team}.`, `${an} فاز بأول بطولة في ${s} مع ${N(team)}.`);
    const ringTeams = [...new Set(rings.map(championOf))];
    if (team && (ringTeams.length > 1 || !sameFranchise(team, p.t[0])))
      add('ring-team', 1, `With which team did ${name} win his first NBA title?`, team, otherTeams(p, rndFor('ring-team'), 1, [team]).concat(others(team).slice(0, 2)),
        `مع أي فريق فاز ${an} بأول بطولة NBA له؟`, `${name} won his first title with the ${team} in ${s}.`, `${an} فاز بأول بطولة مع ${N(team)} في ${s}.`);
    // two of his Finals: who they beat, who coached them
    for (const rs of [rings[0], rings[rings.length - 1]].filter((x, i, a) => a.indexOf(x) === i)) {
      const row = BY_SEASON.get(rs); if (!row) continue;
      const [, champ, runner, fmvp, , coach] = row, y = startYear(rs), r2 = rndFor(`opp-${rs}`);
      add(`opp-${rs}`, 2, `Which team did ${name} and the ${champ} beat in the ${rs} Finals?`, runner, pick(teamsIn(y), 3, r2, [champ, runner]),
        `في نهائيات ${rs}، ${an} و${N(champ)} فازوا على أي فريق؟`, `The ${champ} beat the ${runner} in the ${rs} Finals.`, `${N(champ)} فاز على ${N(runner)} في نهائيات ${rs}.`);
      const coaches = SEASONS.filter(x => x[5] && x[5] !== coach && Math.abs(startYear(x[0]) - y) <= 12).map(x => x[5]);
      add(`coach-${rs}`, 2, `Who coached ${name} to the ${rs} title?`, coach, pick(coaches, 3, rndFor(`coach-${rs}`)),
        `مين كان مدرب ${an} لما فاز ببطولة ${rs}؟`, `${coach} coached the ${rs} ${champ}.`, `${N(coach)} كان مدرب ${N(champ)} في ${rs}.`);
      if (fmvp && fmvp !== name) {
        const others = SEASONS.filter(x => x[3] && x[3] !== fmvp && x[3] !== name && Math.abs(startYear(x[0]) - y) <= 10).map(x => x[3]);
        add(`fmvp-${rs}`, 2, `Who was Finals MVP when ${name} won the ${rs} title?`, fmvp, [name, ...pick(others, 2, rndFor(`fmvp-${rs}`))],
          `مين كان أفضل لاعب في نهائيات ${rs} لما فاز ${an} باللقب؟`, `${fmvp} was Finals MVP in ${rs}.`, `${N(fmvp)} كان أفضل لاعب في نهائيات ${rs}.`);
      }
    }
  }
  // awards (from the champions table)
  const awardQ = (k, en, ar, enCount, arCount, lvl) => {
    const list = a[k];
    if (!active && (list.length || k === 'mvp')) add(`${k}-count`, lvl, enCount, list.length ? String(list.length) : 'None', counts(list.length, rndFor(`${k}-count`)).map(x => (x === '0' ? 'None' : x)),
      arCount, list.length ? `${name}: ${list.join(', ')}.` : `${name} never won it.`, list.length ? `${an}: ${list.join('، ')}.` : `${an} ما فاز فيها.`);
    if (list.length && (active || list.length > 1)) add(`${k}-first`, lvl, en, list[0], nearSeasons(list[0], rndFor(`${k}-first`)),
      ar, `${name}: ${list.join(', ')}.`, `${an}: ${list.join('، ')}.`);
  };
  awardQ('mvp', `In which season did ${name} win his first MVP award?`, `في أي موسم فاز ${an} بأول جائزة MVP له؟`,
    `How many MVP awards did ${name} win?`, `كم مرة فاز ${an} بجائزة أفضل لاعب في الموسم (MVP)؟`, 1);
  awardQ('fmvp', `In which season did ${name} win his first Finals MVP?`, `في أي موسم فاز ${an} بأول جائزة أفضل لاعب في النهائيات؟`,
    `How many Finals MVP awards did ${name} win?`, `كم مرة فاز ${an} بجائزة أفضل لاعب في النهائيات؟`, 1);
  if (a.mvp.length === 1 && !active) add('mvp-season', 2, `In which season was ${name} the MVP?`, a.mvp[0], nearSeasons(a.mvp[0], rndFor('mvp-season')),
    `في أي موسم كان ${an} أفضل لاعب في الدوري (MVP)؟`, `${name} was MVP in ${a.mvp[0]}.`, `${an} كان MVP في ${a.mvp[0]}.`);
  if (a.roy.length) add('roy', 2, `In which season was ${name} named Rookie of the Year?`, a.roy[0], nearSeasons(a.roy[0], rndFor('roy')),
    `في أي موسم فاز ${an} بجائزة أفضل لاعب صاعد؟`, `${name} was Rookie of the Year in ${a.roy[0]}.`, `${an} كان أفضل لاعب صاعد في ${a.roy[0]}.`);
  if (a.scoring.length && !active) add('scoring-count', 2, `How many scoring titles did ${name} win?`, String(a.scoring.length), counts(a.scoring.length, rndFor('scoring-count')).map(x => (x === '0' ? 'None' : x)),
    `كم مرة كان ${an} هدّاف الدوري؟`, `${name} led the league in scoring in ${a.scoring.join(', ')}.`, `${an} كان هدّاف الدوري في ${a.scoring.join('، ')}.`);
  if (a.scoring.length && active) add('scoring-first', 2, `In which season did ${name} win his first scoring title?`, a.scoring[0], nearSeasons(a.scoring[0], rndFor('scoring-first')),
    `في أي موسم كان ${an} هدّاف الدوري لأول مرة؟`, `${name} first led the league in scoring in ${a.scoring[0]}.`, `${an} كان هدّاف الدوري لأول مرة في ${a.scoring[0]}.`);
  if (p.dp) add('dpoy', 2, `How many Defensive Player of the Year awards did ${name} win?`, String(p.dp), counts(p.dp, rndFor('dpoy')).map(x => (x === '0' ? 'None' : x)),
    `كم مرة فاز ${an} بجائزة أفضل مدافع في الدوري؟`, `${name} won it ${p.dp} time${p.dp > 1 ? 's' : ''}.`, `${an} فاز فيها ${p.dp === 1 ? 'مرة وحدة' : p.dp === 2 ? 'مرتين' : `${p.dp} مرات`}.`);
  // career length
  const debut = seasonLabel(p.y[0]);
  add('debut', 2, `In which season did ${name} make his NBA debut?`, debut, nearSeasons(debut, rndFor('debut')),
    `في أي موسم لعب ${an} أول موسم له في NBA؟`, `${name}'s first NBA season was ${debut}.`, `أول موسم لـ${an} في NBA كان ${debut}.`);
  if (!active) {
    const last = seasonLabel(p.y[1]);
    add('final-season', 2, `In which season did ${name} play his final NBA game?`, last, nearSeasons(last, rndFor('final-season')),
      `في أي موسم لعب ${an} آخر مباراة له في NBA؟`, `${name}'s last NBA season was ${last}.`, `آخر موسم لـ${an} في NBA كان ${last}.`);
    if (p.s) add('seasons', 2, `How many seasons did ${name} play in the NBA?`, String(p.s), near(p.s, rndFor('seasons'), 1, 2).map(String),
      `كم موسم لعب ${an} في NBA؟`, `${name} played ${p.s} NBA seasons.`, `${an} لعب ${A ? A.seasons(p.s) : p.s} في NBA.`);
  }
  // nickname
  if (p.k) {
    const others = PLAYERS.filter(x => x.k && x.name !== name).map(x => x.k[0]);
    add('nickname', 0, `Which nickname is ${name} known by?`, p.k[0], pick(others, 3, rndFor('nickname')),
      `وش لقب ${an}؟`, `${name} is known as "${p.k[0]}".`, `${an} لقبه «${p.k[1]}».`);
  }
  // his own questions
  for (const [i, [lvl, q, correct, wrongs, ar, labels]] of (p.x || []).entries())
    add(`x${i}`, lvl, q, correct, wrongs, ar, null, null, labels || null);
  return out;
}

// Arabic labels for answers every player's questions share.
const NICKS = () => Object.fromEntries(PLAYERS.filter(p => p.k).map(p => [p.k[0], p.k[1]]));
const BASE_LABELS = { None: 'ولا وحدة' };

// Bank records (the shape engine.js and tools/build.mjs use) for every player.
export function buildRecords(A = null) {
  const nick = NICKS(), recs = [];
  for (const p of PLAYERS) {
    const id = playerId(p), shift = SHIFT[p.level];
    for (const q of questionsFor(p, A)) {
      const answers = [q.correct, ...q.wrongs];
      const extra = { ...BASE_LABELS, ...(q.labels || {}) };
      for (const x of answers) if (nick[x]) extra[x] = nick[x];
      const known = Object.fromEntries(answers.filter(x => extra[x]).map(x => [x, extra[x]]));
      recs.push({
        question_id: `XO-${id}-${q.key}`, knowledge_point_id: `KP-XO-${id}-${q.key}`,
        question_text: q.q, question_type: 'multiple_choice', answers, correct_answer: q.correct,
        explanation: q.exp, difficulty: TIERS[Math.min(5, q.lvl + shift)], category: 'Crossover', subcategory: p.name,
        pool: 'crossover', game_modes_allowed: ['crossover'], status: 'active', active: true, temporal: 'static',
        season: null, players: [p.name], teams: [], quality_score: 90,
        source_name: 'NBA Trivia', source_url: null, source_date: null, usage_count: 0, duplicate_warnings: [],
        xo: { player: id, level: p.level, step: q.lvl },
        ar: A ? { q: q.ar, e: q.expAr || null, o: A.labels(answers, known) } : null
      });
    }
  }
  return recs;
}

// ── today's players ────────────────────────────────────────────────
// The day turns over at midnight in the Gulf (UTC+3), for the Daily too.
export const gulfDate = (now = Date.now()) => new Date(now + 3 * 3600e3).toISOString().slice(0, 10);
export const msToGulfMidnight = (now = Date.now()) => { const g = now + 3 * 3600e3; return 86400e3 - (g % 86400e3); };
// Everyone gets their own three: seeded by who they are (account or device) and the date.
export function playerOfDay(level, who, date = gulfDate()) {
  const list = PLAYERS.filter(p => p.level === level);
  return list[Math.floor(seededRandom(`${who}|${date}|${level}`)() * list.length)];
}
export const byId = id => PLAYERS.find(p => playerId(p) === id) || null;
