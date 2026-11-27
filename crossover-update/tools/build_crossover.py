"""Author the HyperFrames workspace for the NBA Trivia 'Crossover' update video.

Inputs (under the project dir):
  artifacts/transcript_cut.json  - whisper word timings on the silence-cut timeline
  assets/video/talk_cut.mp4, assets/audio/talk_cut.wav
Writes hyperframes/index.html and artifacts/captions.json + .srt
"""
import json, re, shutil, sys
from pathlib import Path

P = Path(sys.argv[1])
HF = P / "hyperframes"
(HF / "assets").mkdir(parents=True, exist_ok=True)
for src, dst in [("assets/video/talk_cut.mp4", "talk.mp4"), ("assets/audio/talk_cut.wav", "talk.wav")]:
    shutil.copy(P / src, HF / "assets" / dst)

TOTAL = 99.33
T = json.load(open(P / "artifacts" / "transcript_cut.json"))

# Hand-corrected Gulf-Arabic captions, one per whisper segment (same order).
FIX = [
    "مساء الخير شباب، لأننا نطوّر اللعبة لأفضل مستوى ممكن",
    "فدخلنا على الإحصائيات مال اللعبة، وشفنا إن في مشاركين كثير شاركوا في اللعبة",
    "ولكن شفنا بعض الألعاب ما حد قاعد يستخدمها، أو نسبة استخدامها أقل",
    "فعشان نخلي كل شي في الأبليكيشن، أو كل شي في اللعبة، يكون شي مهم",
    "فقررت إني ألغي لعبة الـ20 سؤال، اللي هي العشرين سؤال",
    "وأستبدلها بشي اسمه كروس أوفر",
    "كروس أوفر راح يكون عبارة عن ثلاث مراحل",
    "مرحلة سهلة، مرحلة صعبة، مرحلة متوسطة",
    "المرحلة السهلة ما راح تكون سهلة أسئلتها، لكن راح يكونون اللاعبين الموجودين",
    "في هالمرحلة معروفين أكثر، مثل ليبرون جيمس، مايكل جوردن وغيرهم",
    "المرحلة الوسط راح يكونون اللاعبين نص نص، مو الكل يعرف عنهم، وناس وايد تعرف عنهم",
    "أمثال جا مورانت، برادلي بيل وغيرهم",
    "المرحلة الصعبة راح يكونون لاعبين مو كل من يعرفهم",
    "أمثال ريك باري، جوليوس إيرفنغ، موتومبو، وإلى آخره",
    "الأسئلة راح تكون عبارة عن اللاعب نفسه",
    "وكل يوم راح تحصل على لاعب جديد",
    "كل نهاية يوم راح تحصل على لاعب جديد",
    "فلأننا نطوّر اللعبة، قاعدين نشوف الإحصائيات أكثر وأكثر",
    "وشفنا إن أكثر لعبة الكل يستخدمها هي الستريك، ولحد الحين هي المين جيم",
    "فنحتاج آراءكم، عطونا آراءكم إذا في أي شي تبوني يكون موجود في اللعبة",
    "وفي لعبة جديدة، بس أحتاج نسوي عليها ريسيرتش زيادة",
    "وشلون طريقة البريزنتيشن إذا راح نخليها في الأبليكيشن",
    "قبل لا ننتقل إلى مرحلة تثبيت أو رفع اللعبة إلى الآب ستور وجوجل بلاي. شكراً",
]
assert len(FIX) == len(T), (len(FIX), len(T))
GOLD = {"كروس", "أوفر", "الستريك", "ليبرون", "جيمس", "مايكل", "جوردن", "مورانت", "برادلي", "بيل", "باري",
        "جوليوس", "إيرفنغ", "موتومبو", "سهلة", "صعبة", "متوسطة", "الـ20", "سؤال،", "آراءكم،", "آراءكم", "جديد"}

def chunk_words(words, n=5):
    out, cur = [], []
    for w in words:
        cur.append(w)
        if len(cur) >= n or (w[-1] in "،.," and len(cur) >= 2):
            out.append(cur); cur = []
    if cur:
        if out and len(cur) == 1: out[-1] += cur
        else: out.append(cur)
    return out

caps = []
for si, (seg, text) in enumerate(zip(T, FIX)):
    ww = seg["words"]
    M = len(ww)
    words = text.split()
    N = len(words)
    seg_end = TOTAL if si == len(T) - 1 else seg["end"]
    i = 0
    for ch in chunk_words(words):
        j = i + len(ch)
        a = ww[min(M - 1, round(i * M / N))]["s"]
        b = ww[min(M - 1, max(0, round(j * M / N) - 1))]["e"]
        if j == N: b = max(b, min(seg_end, b + 0.3))
        caps.append({"s": round(a, 3), "e": round(max(b, a + 0.6), 3), "words": ch})
        i = j
# keep captions from overlapping; extend short gaps so text doesn't flicker
for k in range(len(caps) - 1):
    nxt = caps[k + 1]["s"]
    if caps[k]["e"] > nxt or nxt - caps[k]["e"] < 0.35:
        caps[k]["e"] = nxt
caps[-1]["e"] = TOTAL - 0.05

def srt_t(x):
    h, r = divmod(x, 3600); m, s = divmod(r, 60)
    return f"{int(h):02d}:{int(m):02d}:{int(s):02d},{int(round((s - int(s)) * 1000)):03d}"
with open(P / "artifacts" / "captions.srt", "w") as f:
    for k, c in enumerate(caps, 1):
        f.write(f"{k}\n{srt_t(c['s'])} --> {srt_t(c['e'])}\n{' '.join(c['words'])}\n\n")
json.dump(caps, open(P / "artifacts" / "captions.json", "w"), ensure_ascii=False, indent=1)

# word-time lookup for graphics cues (on the cut timeline)
ALL = [w for s in T for w in s["words"]]
def at(token, after=0.0):
    for w in ALL:
        if w["s"] >= after and token in w["w"]:
            return round(w["s"], 2)
    raise KeyError(token)

# ---------------- graphics cards ----------------
CARDS = []  # (id, start, end, html, extra_js)
def card(cid, s, e, inner, js=""):
    CARDS.append((cid, s, e, inner, js))

card("c-intro", 0.0, 4.0, """
  <div class="kick">تحديث جديد</div>
  <div class="hero"><span class="en">NBA TRIVIA</span></div>
  <div class="sub">نطوّر اللعبة لأفضل مستوى ممكن</div>""")

t_part = at("مشاركين"); t_low = at("بعض")
card("c-stats", 4.1, 19.1, f"""
  <div class="kick">راجعنا إحصائيات اللعبة</div>
  <div id="st1" class="line ok"><span class="dot"></span>مشاركة كبيرة من اللاعبين</div>
  <div id="st2" class="line warn"><span class="dot"></span>بعض الألعاب استخدامها قليل</div>
  <div id="st3" class="line"><span class="dot gold"></span>الهدف: كل شي في اللعبة يكون مهم</div>""",
  f"""tl.from('#st1',{{opacity:0,x:-60,duration:.4}},{t_part});
  tl.from('#st2',{{opacity:0,x:-60,duration:.4}},{t_low});
  tl.from('#st3',{{opacity:0,x:-60,duration:.4}},{at('فعلشان')});""")

t_cancel = 19.6; t_cross = at("كروس")
card("c-swap", 19.2, 27.4, f"""
  <div class="kick">التغيير الأول</div>
  <div class="swap">
    <div id="sw-old" class="pill old"><span>20 سؤال</span><i id="sw-x" class="strike"></i></div>
    <div id="sw-arrow" class="arrow">←</div>
    <div id="sw-new" class="pill new"><span class="en">CROSSOVER</span></div>
  </div>
  <div id="sw-sub" class="sub">لعبة الـ20 سؤال تنلغي.. وتجي مكانها كروس أوفر</div>""",
  f"""tl.fromTo('#sw-x',{{scaleX:0}},{{scaleX:1,duration:.35,ease:'power2.out'}},{t_cancel + 0.4});
  tl.to('#sw-old',{{opacity:.45,duration:.3}},{t_cancel + 0.75});
  tl.from('#sw-arrow',{{opacity:0,x:40,duration:.3}},{t_cross - 0.5});
  tl.from('#sw-new',{{opacity:0,scale:.5,duration:.45,ease:'back.out(2)'}},{t_cross - 0.2});
  tl.from('#sw-sub',{{opacity:0,y:20,duration:.4}},{t_cross + 0.3});""")

t3 = at("ثلاث"); t_e = at("سهلة", 30); t_h = at("صعبة", 30); t_m = at("متوسطة", 30)
card("c-levels", 27.5, 33.3, f"""
  <div class="hero sm"><span class="en">CROSSOVER</span></div>
  <div class="kick">٣ مراحل</div>
  <div class="row3">
    <div id="lv-e" class="lvl e">سهلة</div><div id="lv-m" class="lvl m">متوسطة</div><div id="lv-h" class="lvl h">صعبة</div>
  </div>""",
  f"""tl.from('#lv-e',{{opacity:0,y:40,scale:.7,duration:.35,ease:'back.out(2)'}},{t_e});
  tl.from('#lv-h',{{opacity:0,y:40,scale:.7,duration:.35,ease:'back.out(2)'}},{t_h});
  tl.from('#lv-m',{{opacity:0,y:40,scale:.7,duration:.35,ease:'back.out(2)'}},{t_m});""")

def level_card(cid, s, e, cls, title, desc, players, cues):
    chips = "".join(f'<div id="{cid}-p{i}" class="chip"><b>{ar}</b><span class="en">{en}</span></div>'
                    for i, (ar, en) in enumerate(players))
    js = "\n  ".join(f"tl.from('#{cid}-p{i}',{{opacity:0,y:30,duration:.35,ease:'power3.out'}},{t});"
                     for i, t in enumerate(cues))
    card(cid, s, e, f"""
  <div class="tag {cls}">{title}</div>
  <div class="sub big">{desc}</div>
  <div class="chips">{chips}</div>""", js)

level_card("c-easy", 33.3, 44.6, "e", "المرحلة السهلة", "لاعبين معروفين أكثر",
           [("ليبرون جيمس", "LeBron James"), ("مايكل جوردن", "Michael Jordan")],
           [at("لبرون") - 0.1, at("مايكل") - 0.1])
level_card("c-med", 44.7, 52.9, "m", "المرحلة المتوسطة", "لاعبين «نص نص»",
           [("جا مورانت", "Ja Morant"), ("برادلي بيل", "Bradley Beal")],
           [at("جام") - 0.1, at("برايدلي") - 0.1])
level_card("c-hard", 53.0, 62.3, "h", "المرحلة الصعبة", "مو كل من يعرفهم",
           [("ريك باري", "Rick Barry"), ("جوليوس إيرفنغ", "Julius Erving"), ("ديكيمبي موتومبو", "Dikembe Mutombo")],
           [at("ريك") - 0.1, at("جوليوس") - 0.1, at("موتومبو") - 0.1])

t_new = at("جديد")
card("c-daily", 62.4, 69.7, f"""
  <div class="kick">طريقة اللعب</div>
  <div class="sub big">الأسئلة عن اللاعب نفسه</div>
  <div id="dy" class="daily"><span class="num">1</span><span class="txt">لاعب جديد<small>كل يوم · يتجدد نهاية اليوم</small></span></div>""",
  f"tl.from('#dy',{{opacity:0,scale:.8,duration:.45,ease:'back.out(2)'}},{t_new - 0.6});")

t_streak = at("الستريك"); t_main = at("المين")
card("c-streak", 69.8, 82.8, f"""
  <div class="kick">الأكثر لعباً حسب الإحصائيات</div>
  <div id="sk" class="hero"><span class="en">STREAK</span></div>
  <div id="sk-main" class="tag gold">اللعبة الرئيسية</div>""",
  f"""tl.from('#sk',{{opacity:0,scale:.6,duration:.5,ease:'back.out(2)'}},{t_streak - 0.1});
  tl.from('#sk-main',{{opacity:0,y:30,duration:.4}},{t_main - 0.1});""")

card("c-ask", 82.9, 86.9, """
  <div class="hero sm">شاركونا آراءكم</div>
  <div class="sub big">وش تبون يكون موجود في اللعبة؟</div>""")

card("c-research", 87.0, 93.8, f"""
  <div class="kick">قيد التطوير</div>
  <div class="sub big">لعبة جديدة تحت البحث</div>
  <div id="rs2" class="line"><span class="dot gold"></span>وطريقة عرضها في التطبيق</div>""",
  f"tl.from('#rs2',{{opacity:0,x:-60,duration:.4}},{at('البرزنتيشن') - 0.3});")

t_store = at("ستور")
card("c-launch", 93.9, TOTAL - 0.1, f"""
  <div class="kick">الخطوة الجاية</div>
  <div class="sub big">إطلاق اللعبة على</div>
  <div class="stores"><div id="st-a" class="store en">App Store</div><div id="st-g" class="store en">Google Play</div></div>""",
  f"""tl.from('#st-a',{{opacity:0,y:30,duration:.4}},{t_store - 0.5});
  tl.from('#st-g',{{opacity:0,y:30,duration:.4}},{at('والجوجل') - 0.2});""")

cards_html = "\n".join(f'  <div id="{cid}" class="card" dir="rtl">{inner}\n  </div>' for cid, s, e, inner, js in CARDS)
cards_js = "\n".join(
    f"  tl.fromTo('#{cid}',{{opacity:0,y:-40}},{{opacity:1,y:0,duration:.45,ease:'power3.out'}},{s});\n"
    f"  tl.to('#{cid}',{{opacity:0,y:-30,duration:.35,ease:'power2.in'}},{round(e - 0.35, 3)});\n  {js}"
    for cid, s, e, inner, js in CARDS)

cap_html = "\n".join(
    f'    <div id="cap{k}" class="cap" dir="rtl">' +
    " ".join(f'<span class="{"g" if w.strip("،.,") in GOLD or w in GOLD else ""}">{w}</span>' for w in c["words"]) +
    "</div>" for k, c in enumerate(caps))
cap_js = "\n".join(
    f"  tl.set('#cap{k}',{{opacity:1}},{c['s']}); tl.fromTo('#cap{k}',{{y:14}},{{y:0,duration:.15}},{c['s']}); tl.set('#cap{k}',{{opacity:0}},{c['e']});"
    for k, c in enumerate(caps))

index = f"""<!doctype html>
<html lang="ar">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=1080, height=1920" />
<title>NBA Trivia: Crossover Update</title>
<script src="assets/gsap.min.js"></script>
<style>
  @font-face {{ font-family:'Cairo'; font-weight:700; src:url(assets/fonts/cairo-arabic-700-normal.woff2) format('woff2'); unicode-range:U+0600-06FF,U+0750-077F,U+0870-088E,U+0890-0891,U+0897-08E1,U+08E3-08FF,U+200C-200E,U+2010-2011,U+204F,U+2E41,U+FB50-FDFF,U+FE70-FE74,U+FE76-FEFC; }}
  @font-face {{ font-family:'Cairo'; font-weight:900; src:url(assets/fonts/cairo-arabic-900-normal.woff2) format('woff2'); unicode-range:U+0600-06FF,U+0750-077F,U+0870-088E,U+0890-0891,U+0897-08E1,U+08E3-08FF,U+200C-200E,U+2010-2011,U+204F,U+2E41,U+FB50-FDFF,U+FE70-FE74,U+FE76-FEFC; }}
  @font-face {{ font-family:'Cairo'; font-weight:700; src:url(assets/fonts/cairo-latin-700-normal.woff2) format('woff2'); unicode-range:U+0000-00FF,U+2000-206F,U+2190-21FF; }}
  @font-face {{ font-family:'Cairo'; font-weight:900; src:url(assets/fonts/cairo-latin-900-normal.woff2) format('woff2'); unicode-range:U+0000-00FF,U+2000-206F,U+2190-21FF; }}
  body {{ margin:0; background:#000; }}
  #root {{ position:relative; width:1080px; height:1920px; overflow:hidden; font-family:'Cairo',sans-serif; color:#F5F3EE; }}
  #talk {{ position:absolute; inset:0; width:1080px; height:1920px; object-fit:cover; }}
  #topshade {{ position:absolute; left:0; right:0; top:0; height:760px; background:linear-gradient(180deg, rgba(0,0,0,.55), rgba(0,0,0,0)); }}
  #botshade {{ position:absolute; left:0; right:0; bottom:0; height:620px; background:linear-gradient(0deg, rgba(0,0,0,.7), rgba(0,0,0,0)); }}
  #bug {{ position:absolute; left:48px; top:56px; display:flex; align-items:center; gap:14px; font-weight:900; font-size:30px; letter-spacing:4px; }}
  #bug .ball {{ display:block; width:30px; height:30px; border-radius:15px; background:#F28C28; box-shadow: inset -6px -6px 0 rgba(0,0,0,.25); }}
  #bug .r {{ color:#E03A3E; }}
  #track {{ position:absolute; left:48px; right:48px; top:112px; height:6px; border-radius:3px; background:rgba(255,255,255,.14); overflow:hidden; }}
  #prog {{ display:block; width:100%; height:100%; background:linear-gradient(90deg,#1D6BFF,#F2B33D,#E03A3E); transform-origin:left center; }}
  .card {{ position:absolute; left:60px; right:60px; top:150px; min-height:300px; max-height:470px; box-sizing:border-box; padding:34px 40px;
    display:flex; flex-direction:column; align-items:center; justify-content:center; gap:18px; text-align:center; opacity:0;
    background:rgba(12,14,22,.84); border:2px solid rgba(255,255,255,.12); border-radius:32px; box-shadow:0 30px 80px rgba(0,0,0,.55); }}
  .en {{ direction:ltr; unicode-bidi:isolate; }}
  .kick {{ font-weight:700; font-size:34px; color:#F2B33D; }}
  .hero {{ font-weight:900; font-size:120px; line-height:1.05; letter-spacing:2px; }}
  .hero.sm {{ font-size:84px; }}
  .sub {{ font-weight:700; font-size:38px; opacity:.92; }}
  .sub.big {{ font-weight:900; font-size:52px; opacity:1; }}
  .line {{ display:flex; align-items:center; gap:18px; font-weight:700; font-size:42px; width:100%; justify-content:flex-start; }}
  .dot {{ display:block; width:22px; height:22px; border-radius:11px; background:#fff; flex:none; }}
  .ok .dot {{ background:#2FD27A; }} .warn .dot {{ background:#E03A3E; }} .dot.gold {{ background:#F2B33D; }}
  .swap {{ display:flex; align-items:center; gap:28px; direction:rtl; }}
  .pill {{ position:relative; font-weight:900; font-size:60px; padding:14px 34px; border-radius:22px; }}
  .pill.old {{ background:#2A2E3A; color:#C9CCD6; }}
  .pill.new {{ background:#1D6BFF; color:#fff; }}
  .strike {{ position:absolute; left:-6px; right:-6px; top:50%; height:10px; margin-top:-5px; background:#E03A3E; border-radius:5px; transform-origin:right center; display:block; }}
  .arrow {{ font-weight:900; font-size:72px; color:#F2B33D; }}
  .row3 {{ display:flex; gap:22px; }}
  .lvl {{ font-weight:900; font-size:56px; padding:16px 36px; border-radius:20px; color:#0B0D14; }}
  .lvl.e, .tag.e {{ background:#2FD27A; }} .lvl.m, .tag.m {{ background:#F2B33D; }} .lvl.h, .tag.h {{ background:#E03A3E; color:#fff; }}
  .tag {{ font-weight:900; font-size:46px; padding:8px 34px; border-radius:16px; color:#0B0D14; }}
  .tag.gold {{ background:#F2B33D; }}
  .chips {{ display:flex; flex-wrap:wrap; justify-content:center; gap:16px; }}
  .chip {{ display:flex; flex-direction:column; align-items:center; background:rgba(255,255,255,.08); border:2px solid rgba(255,255,255,.16);
    border-radius:20px; padding:10px 26px; }}
  .chip b {{ font-weight:900; font-size:44px; line-height:1.2; }}
  .chip .en {{ font-weight:700; font-size:24px; opacity:.7; letter-spacing:1px; }}
  .daily {{ display:flex; align-items:center; gap:26px; direction:rtl; }}
  .daily .num {{ display:flex; align-items:center; justify-content:center; width:130px; height:130px; border-radius:26px; background:#1D6BFF;
    font-weight:900; font-size:84px; }}
  .daily .txt {{ display:flex; flex-direction:column; font-weight:900; font-size:64px; line-height:1.1; text-align:right; }}
  .daily small {{ font-weight:700; font-size:30px; color:#F2B33D; }}
  .stores {{ display:flex; gap:22px; }}
  .store {{ font-weight:900; font-size:52px; background:#fff; color:#0B0D14; padding:12px 34px; border-radius:20px; }}
  #caps {{ position:absolute; left:60px; right:60px; top:1430px; height:300px; }}
  .cap {{ position:absolute; inset:0; display:flex; flex-wrap:wrap; align-content:center; justify-content:center; gap:0 18px; opacity:0;
    font-weight:900; font-size:66px; line-height:1.35; text-align:center; color:#fff;
    text-shadow:0 4px 0 #000, 0 0 24px rgba(0,0,0,.95), 0 0 6px #000; }}
  .cap span {{ display:inline-block; }}
  .cap .g {{ color:#F2B33D; }}
</style>
</head>
<body>
<div id="root" data-composition-id="root" data-width="1080" data-height="1920" data-duration="{TOTAL}">
  <video id="talk" class="clip" src="assets/talk.mp4" data-start="0" data-duration="{TOTAL}" data-track-index="0" muted playsinline></video>
  <div id="topshade"></div>
  <div id="botshade"></div>
  <div id="bug"><span class="ball"></span><span>NBA <span class="r">TRIVIA</span></span></div>
  <div id="track"><span id="prog"></span></div>
{cards_html}
  <div id="caps">
{cap_html}
  </div>
  <audio id="voice" src="assets/talk.wav" data-start="0" data-duration="{TOTAL}" data-track-index="10" data-volume="1"></audio>
</div>
<script>
  window.__timelines = window.__timelines || {{}};
  const tl = gsap.timeline({{ paused: true }});
  tl.fromTo('#prog', {{ scaleX:0 }}, {{ scaleX:1, duration:{TOTAL}, ease:'none' }}, 0);
{cards_js}
{cap_js}
  window.__timelines["root"] = tl;
</script>
</body>
</html>
"""
(HF / "index.html").write_text(index)
print("cards", len(CARDS), "captions", len(caps))
