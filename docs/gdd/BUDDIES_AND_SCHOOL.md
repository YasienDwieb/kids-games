# Buddies & School Subjects — plan

Status: **design / planning**. Nothing here is built yet. Designs live on the
"Kids Zone — Buddies & School" design canvas.

Two features:

1. **Choose your buddy.** A second mascot, **Noor the bunny**, joins Lulu the
   owl. Every child picks the buddy they want; the buddy then cheers, hints and
   wears outfits everywhere Lulu does today.
2. **School.** Real school subjects (Math, Arabic, English, Science), organised
   by grade and unit, played as short game lessons, with gamification that keeps
   the app's "play for fun" feel.

---

## Product guardrails (from what we already learned)

- **No task-list feel.** Daily quests were removed (PR #80) because they made
  the app feel like homework. School must not bring that back: **no streaks, no
  daily goals, no timers on learning, no "you missed a day".**
- Rewards come from **playing**, never from returning on schedule.
- Stars stay the one currency. Everything else (badges, stickers, outfits) is
  derived from stars and lesson completion, like levels are today.
- Short sessions: a lesson is **3–5 rounds, about 2–3 minutes**.
- Mistakes are soft: the shared hint ladder (`useHintLadder`) and the buddy's
  "Oops! Try again", never a fail screen.

---

## 1. Buddies

### What the child sees
- **First launch:** "Pick your buddy!" — Lulu and Noor side by side, each
  waving; tap one, she hops and says hi, big "Let's go!" button.
- **Change any time:** a "Buddy" switch at the top of *Dress up Lulu* (renamed
  *Dress up* + buddy name). Outfits carry over between buddies.
- The chosen buddy appears on Home, in celebrations, level-up, hints, the
  break screen and the store screenshots.

### Framing
The picker is **by character, not by gender** — no "boys / girls" labels.
Any child can pick either buddy. (Lulu is already written as "she" in the code;
Noor is a girl too. If we later want a boy buddy, the system takes a third.)

### Noor
- Peach-pink bunny, cream face and belly, long floppy ears, teal bow.
- Same sticker art style and ink outline as Lulu.
- Name works in both languages: **Noor / نور**.

### Engineering (when we build)
| Piece | Change |
|---|---|
| Setting | `settings.buddy: 'lulu' \| 'noor'` (default `lulu` so existing users keep Lulu) |
| 2D art | `Mascot` takes buddy poses from a per-buddy table (wave / cheer / point / encourage); Noor needs 4 PNGs |
| 3D | Generalise `Lulu3D` → `Buddy3D` with a species config: body colours, ears (bunny ears instead of owl tufts), tail; hat/glasses anchors per species |
| Voice | Noor needs her own tap lines + "new sticker" line in EN/AR (same TTS pipeline as Lulu); praise lines are narrator and stay shared |
| i18n | `mascot.name` becomes `mascot.<buddy>.name`; "Dress up Lulu" uses the buddy name |
| Picker | New first-run screen (`useFirstRun('buddy')`) before Home |
| Tests | buddy setting default, every pose has art for every buddy, keys test |

---

## 2. School subjects

### Who it is for
KG1 → Grade 3 (ages 4–9). Grade is set by the parent (Parents corner); the
child can still open lower grades.

### Subjects (v1)
| Subject | Colour | Example units (KG2) |
|---|---|---|
| Math | splash blue | Counting to 20 · Shapes · Bigger & smaller · Adding to 10 |
| Arabic | lime green | Letters ا–ي · Letter sounds · First words |
| English | bubblegum pink | Letters A–Z · Phonics · Sight words |
| Science | tangerine | Animals & homes · My body · Weather · Plants |

Later (needs a decision): Islamic studies, Social studies.

### Structure
`Subject → Grade → Unit → Lesson → Rounds`

- A **unit** is a path of 5–7 lesson stops ending in a **treasure chest**.
- A **lesson** is 3–5 rounds built on **existing game engines**, so most
  content is data, not new code:

| Engine (exists today) | Used for |
|---|---|
| listen-and-find (Letter Land, Numbers Land, Animal Safari) | letters, numbers, vocabulary, animals |
| Count & Pop | counting, adding, "how many" |
| Match Up | pairs: number↔quantity, word↔picture, animal↔home |
| Shape Detective | shapes, patterns, odd-one-out |
| Simple Pairs | memory review |
| **New:** Sort into bins | living/non-living, big/small, odd/even |
| **New:** Order it | sequences, number line, life cycles |
| **New:** True or false | quick science facts with pictures |

### Gamification (fun, not homework)
- **Stars per lesson (1–3)** from the hint ladder. Replaying a lesson can raise
  its stars — mastery, not grinding.
- **Path map per unit**: stops light up as you go; the buddy walks to the next
  stop. Locked stops are greyed, never hidden.
- **Unit treasure chest** at the end: a sticker set for that unit and, on some
  units, a buddy outfit item.
- **Subject badges** (bronze / silver / gold) for collecting stars across a
  subject's units — shown in the **Backpack**.
- **Buddy reactions**: cheers, "Oops! Try again", points at the hint.
- **No** streaks, daily goals, leaderboards or timers.

### Grown-ups
- Parents corner gets a **School** tab: grade picker, per-subject progress
  (units done, stars), skills that need practice. Calm style, no motion.

### Data model (sketch)
```ts
type Subject = 'math' | 'arabic' | 'english' | 'science';
type Lesson = { id: string; titleKey: string; rounds: Round[] };   // rounds reuse engine configs
type Unit = { id: string; subject: Subject; grade: Grade; lessons: Lesson[]; treasure: Reward };
// progress: kg:school -> { [lessonId]: { stars: 0|1|2|3 } }
```
Content lives in `src/school/<subject>/<grade>/<unit>.ts`, strings in per-subject
locale bundles (EN/AR), voice via the existing TTS pipeline.

---

## Phases

| Phase | Scope |
|---|---|
| **P0 — Buddies** | Buddy setting, Noor 2D art + 3D bunny, picker, wardrobe switch, voice lines |
| **P1 — School shell** | School hub, subject page with unit path, lesson player on existing engines, stars + chest; **Math KG2 unit 1** |
| **P2 — Language** | Arabic + English letter units (reuse Letter Land content) |
| **P3 — Science + new engines** | Sort, Order, True/false; first Science unit |
| **P4 — Backpack & parents** | Subject badges, Backpack screen, Parents "School" tab |
| **P5 — Grades** | KG1, Grade 1–3 content per subject |

## Open questions
1. Which curriculum to align to (Egyptian, Gulf/Saudi, UAE, or generic)?
2. Include Islamic studies / Social studies in v1?
3. Who reviews Arabic and subject content (a teacher)?
4. Should School be a Home tile, or its own tab next to games?
5. Any other buddy wanted now (e.g. a boy character)?
