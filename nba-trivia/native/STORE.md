# 24 Seconds or Less — App Store release

The iPhone app is the web game (`nba-trivia/`) inside a native shell (Capacitor).
`npm run sync` copies the game into `www/` and the Xcode project; the GitHub
workflow `.github/workflows/ios.yml` builds, signs and uploads it.

## One-time setup (Apple + GitHub)

1. **Register the app's ID** — developer.apple.com → Certificates, IDs & Profiles →
   Identifiers → + → App IDs → App. Bundle ID (explicit): `com.twentyfourseconds.app`.
2. **Create the app in App Store Connect** — appstoreconnect.apple.com → Apps → + → New App:
   platform iOS, name **24 Seconds or Less**, primary language English (U.S.),
   bundle ID `com.twentyfourseconds.app`, SKU `24seconds-ios`, full access.
3. **Create an API key** — App Store Connect → Users and Access → Integrations →
   App Store Connect API → Team Keys → + → name "GitHub build", access **Admin**.
   Download the `.p8` file (it can be downloaded only once). Note the Key ID and the Issuer ID.
4. **Add four GitHub secrets** — github.com → the repository → Settings → Secrets and
   variables → Actions → New repository secret:
   - `APPLE_TEAM_ID` — developer.apple.com → Account → Membership details → Team ID
   - `ASC_KEY_ID` — the key's ID
   - `ASC_ISSUER_ID` — the Issuer ID
   - `ASC_KEY_P8` — open the `.p8` file in a text editor and paste all of it, including the BEGIN/END lines
5. **Build** — repository → Actions → "iPhone app" → Run workflow. About 10–15 minutes;
   the build then appears in App Store Connect → TestFlight after Apple processes it.

## Listing

| Field | English | Arabic |
|---|---|---|
| Name (30) | 24 Seconds or Less | ٢٤ ثانية أو أقل |
| Subtitle (30) | Basketball Trivia Challenge | تحدي معلومات كرة السلة |
| Category | Games → Trivia (secondary: Sports) | |
| Keywords (100) | basketball,trivia,quiz,hoops,streak,daily,crossover,legends,draft,finals,mvp,game | كرة السلة,سلة,مسابقات,اسئلة,تحدي,دوري,أساطير,ستريك |
| Promotional text | New: Crossover — three new players for you every day. Can you go 10 for 10? | جديد: كروس أوفر — ثلاث لاعبين جدد لك كل يوم. تقدر تجاوب العشرة كلها؟ |
| Support URL | https://nba-trivia-20-0.netlify.app/support.html | (same, #ar) |
| Privacy URL | https://nba-trivia-20-0.netlify.app/privacy.html | (same, #ar) |
| Copyright | 2026 (your name as on the developer account) | |
| Price | Free | |

No "NBA" in the name, subtitle or keywords: Apple rejects other companies' trademarks there.

### Description (English)

How long can you last? 24 Seconds or Less is basketball trivia for real fans — more than 19,000 questions from the 1940s to last week's games, in English or Arabic.

STREAK — Five Easy questions, then Medium, Hard, Hardest, Hall of Fame… all the way to GOAT Level. One miss ends it.

CROSSOVER — Three new players for you every day: a household name, a big star and a deep cut for the historians. Answer ten questions about each career in a row.

DAILY CHALLENGE — Ten questions on a new theme every day.

24 SECONDS OR LESS — Beat the shot clock: right answers add time, wrong ones take it away.

YOUR TEAM — The seasons, games and records of your favorite franchise.

WHO AM I? — Guess the player from his career clues.

BATTLES — Send a friend the same questions and see who really knows ball.

Every right answer earns points by its level, from 100 for Easy to 2,500 for GOAT Level. Climb the daily, weekly and all-time leaderboards, or compete only with fans of your team. New questions every week.

Play as a guest, or create a free account to save your progress and get ranked. No ads.

24 Seconds or Less is an independent trivia game. It is not affiliated with or endorsed by the NBA or its teams.

### الوصف (عربي)

كم سؤال تصمد؟ «٢٤ ثانية أو أقل» لعبة مسابقات كرة سلة للمتابعين الحقيقيين — أكثر من ١٩ ألف سؤال من الأربعينات لين مباريات الأسبوع اللي فات، بالعربي أو بالإنجليزي.

الستريك — خمسة أسئلة سهلة، بعدها متوسط وصعب والأصعب وقاعة المشاهير… لين مستوى GOAT. وغلطة وحدة تنهيها.

كروس أوفر — ثلاث لاعبين جدد لك كل يوم: نجم يعرفه الكل، ونجم كبير، واسم للمؤرخين الحقيقيين. جاوب عشر أسئلة عن مسيرة كل واحد ورا بعض.

تحدي اليوم — عشر أسئلة بموضوع جديد كل يوم.

٢٤ ثانية أو أقل — سابق ساعة التسديد: الجواب الصح يزيد وقتك والغلط ينقصه.

فريقك — مواسم فريقك المفضل ومبارياته وأرقامه.

مين أنا؟ — خمّن اللاعب من مسيرته.

التحديات — أرسل لربعك نفس الأسئلة وشوف مين يفهم في السلة صدق.

كل جواب صح يعطيك نقاط حسب مستواه، من ١٠٠ للسهل لين ٢٥٠٠ لمستوى GOAT. اطلع في ترتيب اليوم والأسبوع وكل الأوقات، أو نافس جماهير فريقك بس. أسئلة جديدة كل أسبوع.

العب كضيف، أو سوّ حساب مجاني عشان تحفظ تقدمك وتدخل الترتيب. بدون إعلانات.

«٢٤ ثانية أو أقل» لعبة مسابقات مستقلة، وغير تابعة لـNBA أو فرقها ولا معتمدة منهم.

## App Privacy (App Store Connect → App Privacy)

Data used to track you: **No**. Data linked to you (all for **App Functionality**):

| Type | Collected | Linked to the user | Purpose |
|---|---|---|---|
| Contact Info → Email Address | Yes (accounts only) | Yes | App Functionality |
| Identifiers → User ID (account ID, username) | Yes | Yes | App Functionality |
| Usage Data → Product Interaction (games, answers, scores) | Yes | Yes | App Functionality, Analytics |
| Usage Data → Product Interaction (guest game counts) | Yes | No | Analytics |

Not collected: location, contacts, photos, health, financial info, browsing history, diagnostics, advertising data.

## Age rating

No violence, gambling, mature or medical content, no unrestricted web access, no chat. Players
see each other's usernames on leaderboards. Expected rating: **4+** (answer the questionnaire as above).

## Notes for App Review

> The game works without an account (guest mode). Signing up (Profile → Sign up) unlocks
> leaderboard ranking and battles; Profile → Delete account deletes the account and all its data.
> 24 Seconds or Less is an independent trivia game not affiliated with or endorsed by the NBA.
