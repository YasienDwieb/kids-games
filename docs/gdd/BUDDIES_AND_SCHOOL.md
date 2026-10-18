# Buddies & School Subjects — plan

Status: **built — first version**. Buddies (Lulu + Zain, 2D + 3D, picker,
wardrobe switch, voice) and School Term 1 for KG1 and KG2 (Arabic, English,
Math; unit paths, Learn → Practise → I learned, chests, backpack badges,
Parents → School tab) are in the app. Not yet: tracing, the Sort / Order /
True-false engines, Term 2, Discover. Designs live on the "Kids Zone —
Buddies & School" design canvas.

Two features:

1. **Choose your buddy.** Two mascots: **Lulu the owl** (girl) and **Zain the
   lion cub** (boy). Every child picks the buddy they want; the buddy then
   cheers, explains, hints and wears outfits everywhere Lulu does today.
2. **School.** The **Egyptian KG curriculum** (Arabic, English, Math), organised
   by level, term and unit exactly like the Ministry books. Each lesson first
   **explains** the idea, then lets the child **practise** it as short games.

---

## Product guardrails (from what we already learned)

- **No task-list feel.** Daily quests were removed (PR #80) because they made
  the app feel like homework. School must not bring that back: **no streaks, no
  daily goals, no timers on learning, no "you missed a day".**
- Rewards come from **playing**, never from returning on schedule.
- Stars stay the one currency. Everything else (badges, stickers, outfits) is
  derived from stars and lesson completion, like levels are today.
- Short sessions: a lesson is **Learn + 3–5 practice rounds, about 3–5
  minutes**. On replay the Learn step can be skipped.
- Mistakes are soft: the shared hint ladder (`useHintLadder`) and the buddy's
  "Oops! Try again", never a fail screen.

---

## 1. Buddies

### What the child sees
- **First launch:** "Pick your buddy!" — Lulu and Zain side by side, each
  waving; tap one, the buddy hops and says hi, big "Let's go!" button.
- **Change any time:** a Lulu / Zain switch at the top of *Dress up* (the title
  uses the buddy's name). Outfits carry over between buddies.
- The chosen buddy appears on Home, in celebrations, level-up, School lessons
  (explains and hints), the break screen and the store screenshots.

### Framing
Lulu is the girl buddy and Zain is the boy buddy, but the picker shows
**characters, not "boys only / girls only" labels** — any child can pick either.

### Zain
- Golden lion cub (fur `#F7C04A`), fluffy tangerine mane (`#F08A2E`), cream
  muzzle and belly, tufted tail, royal-blue neckerchief (`#3F5FD6`).
- Same sticker art style and ink outline as Lulu; 4 poses generated
  (wave / cheer / point / encourage).
- Name works in both languages: **Zain / زين**. Arabic copy uses masculine
  forms for Zain's own lines and neutral forms for praise aimed at the child.

### Engineering (when we build)
| Piece | Change |
|---|---|
| Setting | `settings.buddy: 'lulu' \| 'zain'` (default `lulu` so existing users keep Lulu) |
| 2D art | `Mascot` takes buddy poses from a per-buddy table (wave / cheer / point / encourage); Zain's 4 PNGs are ready |
| 3D | Generalise `Lulu3D` → `Buddy3D` with a species config: body colours, mane ring instead of owl tufts, tufted tail, paws; hat/glasses anchors per species |
| Voice | Zain needs his own tap lines + "new sticker" line in EN/AR (same TTS pipeline as Lulu, a boy voice); praise lines are narrator and stay shared |
| i18n | `mascot.name` becomes `mascot.<buddy>.name`; "Dress up Lulu" uses the buddy name; Arabic lines per buddy for grammatical gender |
| Picker | New first-run screen (`useFirstRun('buddy')`) before Home |
| Tests | buddy setting default, every pose has art for every buddy, keys test |

---

## 2. School — Egyptian KG curriculum

### Source of truth
- Content follows the **Ministry of Education student books** in the
  e-library (<https://ellibrary.moe.gov.eg/Books/Books-Kindergarten/>),
  year **2026–2027**. Today it publishes Term 1 books for **KG1 (المستوى
  الأول)** and **KG2 (المستوى الثاني)** in **Arabic** and **English**.
- **Our team reviews every lesson** against those books before it ships
  (wording, letter order, vocabulary, pictures).
- Egypt first. Other curricula can come later as separate content packs; the
  data model keys units by `curriculum` so they never mix.

### Who it is for
KG1 and KG2 (ages 4–6), Term 1 and Term 2. The parent sets level and term in the
Parents corner; the child can still open easier units. Grades 1–3 come later.

### What School is for
School is for **learning and practice**: every lesson first **explains** the
idea (the buddy teaches it with pictures and sound), then the child **practises**
it with games. It is not a test and not a checklist.

### Lesson flow — the same 4 steps as the book
| Step | Book section | In the app |
|---|---|---|
| 1. Listen · أستمع | أستمع إلى القصة / أغنية | The unit's story or song (illustrated, read aloud), once per unit |
| 2. Learn · أتعلّم | الدرس + الحرف | The buddy explains: big letter/number, tap to hear it, 3 picture words, a tracing preview |
| 3. Practise · أتدرّب | الأنشطة | 3–5 rounds on our existing game engines |
| 4. I learned · تعلّمت | أنا تعلمت / شهادة الإنجاز | A certificate card with the "I learned" checklist, stars and a sticker |

### Subjects and units (Term 1, from the books)
| Subject | KG1 | KG2 |
|---|---|---|
| **Arabic** (lime) | التهيئة (readiness: visual + sound awareness, pre-writing) · **أنا وأسرتي**: هذا أنا (أ) · أمي وأبي (ب) · إخوتي وألعابي (م) · بيتي الجميل (ح) · جدي وجدتي (ج) · then د · **الطبيعة من حولي**: الزهور والألوان (خ) · أشجار خضراء (ت) · الشمس والقمر (ل) · البحر (س) · أنا أزرع (ن) | **غذائي** (fruit, vegetables, dairy, my meal, table manners) · **أدواتي وألعابي** (table, school and hygiene tools, toys) · **وسائل المواصلات** (car, bike, train, plane, ship) — each lesson with its letter |
| **English** (pink) | Meet and Greet (Tt, Ii) · I Can Find it at School (Ss, Aa, Nn) · My Body, My Care (Pp, Hh, Dd, Rr) · My Family Picnic (Ee, Cc, Kk, Mm) | My Week (Oo, Bb, Ff, Ll; days) · My Busy Day (Ww, Cc, Rr, Uu; time of day, routines) + Units 1–2 |
| **Math** (blue) | From the books' math strand: numbers 1–5 · circle, square, star, heart, triangle · red, blue, yellow, green, orange | Numbers 6–10 · days of the week · sequencing |
| **Discover** (later) | Body parts, nature, family — the books' content links | Food, tools, transport topics |

Exact letter-to-lesson mapping is taken from each book's contents page by the
content team; the table above is the first pass. Term 2 is added when the
Ministry publishes it.

### Structure
`Curriculum → Level → Term → Subject → Unit → Lesson → (Learn + Rounds)`

- A **unit** is a path: story stop → lesson stops → song → review → **treasure
  chest**, in the book's order. In Arabic the path runs right-to-left.
- A **lesson** = a Learn card + 3–5 practice rounds built on **existing game
  engines**, so most content is data, not new code:

| Engine (exists today) | Used for |
|---|---|
| listen-and-find (Letter Land, Numbers Land, Animal Safari) | letters, numbers, vocabulary |
| Count & Pop | counting, "how many" |
| Match Up | number↔quantity, word↔picture, letter↔picture |
| Shape Detective | shapes, colours, odd-one-out |
| Simple Pairs | memory review |
| Tracing (new screen, reuses drag input) | letter and number tracing |
| **New:** Sort into bins | healthy/unhealthy food, tools by place |
| **New:** Order it | days of the week, daily routine, number line |
| **New:** True or false | quick picture facts |

### Gamification (fun, not homework)
- **Stars per lesson (1–3)** from the hint ladder. Replaying a lesson can raise
  its stars — mastery, not grinding.
- **"I learned" certificate** per lesson (mirrors the book's شهادة الإنجاز),
  kept in the Backpack.
- **Path map per unit**: stops light up as you go; the buddy waits at the next
  stop. Locked stops are greyed, never hidden.
- **Unit treasure chest**: a sticker set for that unit and, on some units, a
  buddy outfit item.
- **Subject badges** (bronze / silver / gold) for stars across a subject.
- **No** streaks, daily goals, leaderboards or timers.

### Grown-ups
- Parents corner gets a **School** tab: level (KG1 / KG2) and term picker,
  per-subject progress (units done, stars, time this week), and "worth
  practising" from the lessons that needed the most hints. Calm style.

### Data model (sketch)
```ts
type Curriculum = 'eg-moe';                         // more packs later
type Level = 'kg1' | 'kg2';
type Term = 1 | 2;
type Subject = 'arabic' | 'english' | 'math' | 'discover';
type Learn = { focus: string; audioKey: string; words: { emoji: string; key: string }[]; trace?: string };
type Lesson = { id: string; titleKey: string; bookRef: string; learn: Learn; rounds: Round[] };
type Unit = { id: string; curriculum: Curriculum; level: Level; term: Term; subject: Subject; lessons: Lesson[]; treasure: Reward };
// progress: kg:school -> { [lessonId]: { stars: 0|1|2|3, learned: boolean } }
```
Content lives in `src/school/eg-moe/<level>/<term>/<subject>/<unit>.ts`;
`bookRef` points at the book page so reviewers can check it. Strings in
per-subject locale bundles (EN/AR), voice via the existing TTS pipeline.

---

## Phases

| Phase | Scope |
|---|---|
| **P0 — Buddies** | Buddy setting, Zain 2D art + 3D lion cub, picker, wardrobe switch, voice lines |
| **P1 — School shell** | School hub, unit path (RTL for Arabic), Learn card, lesson player on existing engines, certificate, stars + chest; **Arabic KG1 · أنا وأسرتي** as the first unit |
| **P2 — English + Math KG1** | English Units 1–4 and Math numbers 1–5 / shapes / colours; tracing screen |
| **P3 — KG2 + new engines** | Sort, Order, True/false; KG2 Arabic, English and Math units |
| **P4 — Backpack & parents** | Subject badges, certificates in the Backpack, Parents "School" tab |
| **P5 — Term 2 & Discover** | Term 2 books when published; Discover topics; later Grades 1–3 |

## Decisions so far
- Buddies: Lulu (girl) + Zain (boy).
- Curriculum: Egyptian MOE books first; others later.
- Review: our team, checked against the MOE e-library books.
- School's purpose: explain the lesson, then practise it; entry is the School
  tile on Home for now.

## Open questions
1. Include Islamic studies / values (Egyptian KG has religion and values
   content) in v1, or later?
2. Should School later get its own tab next to games, or stay a Home tile?
