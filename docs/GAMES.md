# Games

| Game | Ages | Theme | Description |
|------|------|-------|-------------|
| **Simple Pairs** | 2–5 | Memory | Match pairs of cards across Easy→Expert levels |
| **Color Mixer** | 4–8 | Color theory | Mix red, yellow and blue like real paint — tint and shade with white and black, take on color-matching challenges, and save your own |
| **Mouse Maze** | 3–8 | Logic | Swipe to guide the mouse to the cheese, collecting stars; levels resume on return |
| **Balloon Archer** | 5–8 | Aim & arcade | Aim your bow and pop the balloons across levels, with limited arrows |
| **Shape Detective** | 3–10 | Patterns & logic | Spot the next shape, find the odd one out, and sort shapes into groups |
| **Turbo Road** | 4–12 | Racing | Steer, dodge, and collect along sunny roads (2D, or the optional 3D road); win cups and unlock cars in the garage |
| **Count & Pop** | 3–7 | Counting | Count the objects and pop the right number |
| **Match Up** | 3–7 | Matching | Draw a line from each thing to its match (animals→food, helpers→tools, and more) |
| **Letter Land** | 3–7 | Literacy & phonics | Listen and find the letter — with spoken prompts and word-picture heroes |
| **Numbers Land** | 3–7 | Numbers | Listen and find the number, with spoken prompts |
| **Animal Safari** | 3–7 | First words | Listen and find the animal — by name or by the sound it makes |
| **Candy Catch** | 3–7 | Reflex & arcade | Slide the basket to catch the treats and dodge the yucky ones |

## Adding a new game

See [src/games/HOW_TO_ADD_GAME.md](../src/games/HOW_TO_ADD_GAME.md) and the `kids-games-dev` skill for the full guide.

**TL;DR:**

1. Copy `src/games/_template` to `src/games/your-game`
2. Update `config.ts` (metadata + `accent`) and call `registerGame()` from `@/sdk`
3. Build your game in `index.tsx`, importing only from `@/sdk`
4. Add a side-effect import in `src/games/index.ts`

The game automatically appears on the home screen.
