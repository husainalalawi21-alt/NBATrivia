# Where the question data comes from

The bank is built from two sources, merged by `tools/merge.mjs`:

| | balldontlie (balldontlie.io) | NBA Database (Kaggle, Wyatt Walsh, CC BY-SA 4.0) |
|---|---|---|
| Covers | 1946-47 to today, updated every week | 1946-47 to June 2023, frozen |
| Games | 74,376 (every season) | 64,034 |
| Box scores (threes, assists, rebounds…) | none on the free plan | every game it has |
| Players | 7,513 (name, college, country, draft) | 4,171 bios, full draft history |

```bash
NODE_USE_ENV_PROXY=1 node tools/fetch.mjs          # balldontlie → tools/.cache/
NODE_USE_ENV_PROXY=1 node tools/fetch-kaggle.mjs   # Kaggle CSVs → tools/.cache/kaggle/
node tools/merge.mjs                               # both → tools/.cache/merged/ (+ report.json)
NODE_USE_ENV_PROXY=1 node tools/build.mjs --load   # questions + games → Supabase
```

## What each source was missing

**balldontlie had gaps Kaggle filled**
- **1,382 early games with no score** (mostly before 1980). After the merge only 33 are left, and neither source has those.
  39 seasons became complete, so their standings and playoff series now produce questions.
- **150 wrong scores.** Kaggle's are used. These change real answers.
  The 1963-64 Celtics were 59-21, not 56-24.
  Portland won the 2019 West semifinal, but balldontlie stored the four-overtime Game 4 as a 129-129 tie.
  122 are 1946–1964 games with a wrong or partial score (e.g. 18–24 for a 66–68 game).
  26 are overtime games stored at their end-of-regulation tie, and 2 are later typos.
- **52 postponed games under the wrong date.** balldontlie keeps the date a game was first scheduled; Kaggle has the date it
  was played (2020-21 and 2021-22 COVID postponements, up to 116 days apart). The played date is used and the
  original kept as `scheduled_date`.
- **No box scores.** Kaggle adds team threes, assists, rebounds, steals, blocks and turnovers for every game to 2023.
- **Players:** Kaggle filled 2,929 drafting teams, 62 draft positions, 22 countries and 20 colleges.

**Kaggle had gaps balldontlie filled**
- Everything after June 2023: the 2023-24, 2024-25 and 2025-26 seasons, plus every new week.
- Whole regular seasons missing: 1960-61, 1961-62, 1966-67, 1970-71, 1975-76, 1976-77, 2012-13.
- Whole playoffs missing: 1958, 1959, 1961, 1965, 1969, 1994, 1996, 2000, 2002, 2006.
- Play-in games, and 3,386 players with no Kaggle bio.

## How the merge decides
- **Games:** a game is the same game when the teams match (home and away may be swapped) on the same date ±1 day.
  Otherwise it's the same season, same two teams and the same final score (the postponed games).
  - A score the other source lacks is filled in.
  - When both have a score and they differ, Kaggle wins; every case is listed in `report.json`.
  - A tie is never treated as a final score.
- **Players:** matched on name plus draft year; a field one source lacks is filled from the other.
  23 same-name players that can't be told apart are left as they are.

## Still missing
- 33 games with no score in either source: 1959 playoffs (2), 1960-61 (3), 1961-62 (7), 1965 playoffs (1),
  1969 playoffs (1), 1970-71 (7), 1994 playoffs (12). Seasons with a gap don't produce standings or series questions.
- Neither source marks neutral-site games, which were common before the 1970s. They're listed under one team as home
  (the 1963-64 Celtics show 40 home games; they played 30). Home-record questions start in 1971-72 and are only asked
  when a team's home and road games balance.
- No box scores after June 2023 or for the seasons Kaggle lacks.
  The three-point and assist questions stop at 2022-23 until a source with box scores is added.
