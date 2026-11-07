export const en = {
  meta: {
    name: 'Color Mixer',
    shortName: 'Colors',
    description: 'Mix colors and discover new ones!',
  },

  // Game title shown in the header
  title: 'Color Mixer',
  defaultSavedName: 'My Color',

  // Mode tab labels
  mode: {
    freeplay: 'Free Play',
    challenges: 'Challenges',
  },

  // Header / toolbar
  header: {
    myColors: 'My Colors',
  },

  // Action buttons
  actions: {
    undo: '↩️ Undo',
    done: 'Done!',
    clear: '🗑️ Clear',
    save: '💾 Save',
  },

  // Mixing zone (dragHint is spoken, not shown)
  mixingZone: {
    dragHint: 'Drag a color into the bowl!',
  },

  // Palette section titles

  // Color names (primary + discoverable)
  colors: {
    red: 'Red',
    yellow: 'Yellow',
    blue: 'Blue',
    orange: 'Orange',
    green: 'Green',
    purple: 'Purple',
    brown: 'Brown',
    white: 'White',
    black: 'Black',
    pink: 'Pink',
    lightBlue: 'Light Blue',
  },

  // Discovery hints (shown on locked slots in the collection)

  // Challenge definitions (hint text by challenge id)
  challengeHints: {
    c1: 'Mix a hot color with a sunny color',
    c2: 'Mix the sky with sunshine',
    c3: 'Mix fire with water',
    c4: 'Make red lighter',
    c5: 'Make blue lighter',
    c6: 'Mix ALL the primary colors',
  },

  // Challenge picker screen
  picker: {
    title: 'Challenges',
    complete: 'complete',
    endless: 'More mystery colors',
    endlessSolved: '{{n}} solved',
    allDone: 'All challenges complete!',
    backButton: '‹ Mix',
    difficulty: {
      easy: 'Beginner',
      medium: 'Intermediate',
      hard: 'Advanced',
    },
  },

  // Challenge card
  card: {
    mysteryColor: 'Mystery Color',
  },

  // Challenge mode (in-game target panel)
  challenge: {
    makeThisColor: 'Make this color:',
    needHint: 'Need a hint?',
    backLabel: 'Back to challenges',
    meter: {
      perfect: 'Perfect!',
      soClose: 'So close!',
      gettingWarmer: 'Getting warmer…',
      keepMixing: 'Keep mixing!',
    },
    success: 'You did it!',
    next: 'Next challenge',
  },

  // Discovery celebration modal
  discovery: {
    title: 'New color!',
  },

  // Save color dialog

  // Color collection modal
  collection: {
    done: 'Done',
    deleteLabel: 'Delete',
  },
} as const;

type T<X> = { [K in keyof X]: X[K] extends string ? string : T<X[K]> };
export type GameTranslations = T<typeof en>;
