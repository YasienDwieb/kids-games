# Buddies — plan

Status: **built — first version**. Lulu the owl (girl) and Zain the lion cub
(boy): 2D poses and rigged 3D models in the same semi-realistic style, a
first-launch picker on Home, a switch in the wardrobe, and Zain's own voice
lines. Every child picks the buddy they want; the buddy then cheers, explains,
hints and wears outfits everywhere.

School subjects were planned alongside the buddies and are parked for now
(their work stays on the `feat/buddies-and-school-subjects` branch).

---

## Buddies

### What the child sees
- **First launch:** "Pick your buddy!" — Lulu and Zain side by side, each
  waving; tap one, the buddy hops and says hi, big "Let's go!" button.
- **Change any time:** a Lulu / Zain switch at the top of *Dress up* (the title
  uses the buddy's name). Outfits carry over between buddies.
- The chosen buddy appears on Home, in celebrations, level-up, hints, the break
  screen and the store screenshots.

### Framing
Lulu is the girl buddy and Zain is the boy buddy, but the picker shows
**characters, not "boys only / girls only" labels** — any child can pick either.

### Zain
- Golden lion cub (fur `#F7C04A`), fluffy tangerine mane (`#F08A2E`), cream
  muzzle and belly, tufted tail, royal-blue neckerchief (`#3F5FD6`).
- Same semi-realistic style as Lulu (soft fur, big friendly eyes); 4 poses
  (wave / cheer / point / encourage) and a rigged 3D model.
- Name works in both languages: **Zain / زين**. Arabic copy uses masculine
  forms for Zain's own lines and neutral forms for praise aimed at the child.

### Engineering
| Piece | Change |
|---|---|
| Setting | `settings.buddy: 'lulu' \| 'zain'` (default `lulu` so existing users keep Lulu) |
| 2D art | `Mascot` takes buddy poses from a per-buddy table (wave / cheer / point / encourage); Zain's 4 PNGs are ready |
| 3D | `Lulu3D` (alias `Buddy3D`) draws each buddy's rigged model and moves its bones per mood; hat/glasses anchors per buddy (`BUDDY_FIT`) |
| Voice | Zain needs his own tap lines + "new sticker" line in EN/AR (same TTS pipeline as Lulu, a boy voice); praise lines are narrator and stay shared |
| i18n | `mascot.name` becomes `mascot.<buddy>.name`; "Dress up Lulu" uses the buddy name; Arabic lines per buddy for grammatical gender |
| Picker | New first-run screen (`useFirstRun('buddy')`) before Home |
| Tests | buddy setting default, every pose has art for every buddy, keys test |
