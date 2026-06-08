export const en = {
  meta: {
    name: 'Color Mixer',
    description: 'Mix colors and discover new ones!',
  },

  // Game title shown in the header
  title: 'Color Mixer',

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
    clear: '🗑️ Clear',
    save: '💾 Save',
  },

  // Mixing zone empty state
  mixingZone: {
    dropHere: 'Drop colors here!',
  },

  // Palette section titles
  palette: {
    colorsTitle: 'Colors',
    savedTitle: 'Saved · tap or drag up',
  },

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
  discoveryHints: {
    orange: 'Mix two warm colors',
    green: 'Mix a warm and a cool color',
    purple: 'Mix two bold colors',
    brown: 'Mix all three primary colors',
    pink: 'Add white to a warm color',
    lightBlue: 'Add white to a cool color',
  },

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
    needHint: '💡 Need a hint?',
    backLabel: 'Back to challenges',
    meter: {
      perfect: 'Perfect!',
      soClose: 'So close!',
      gettingWarmer: 'Getting warmer…',
      keepMixing: 'Keep mixing!',
    },
    success: 'You did it!',
  },

  // Discovery celebration modal
  discovery: {
    title: 'New color!',
    yay: 'Yay!',
  },

  // Save color dialog
  namingDialog: {
    title: 'Save your color! 🎨',
    label: 'Name your color:',
    placeholder: 'e.g. Sunset',
    defaultName: 'My Color',
    cancel: 'Cancel',
    save: 'Save',
  },

  // Color collection modal
  collection: {
    title: 'My Colors',
    done: 'Done',
    famousShelf: 'Famous colors',
    found: 'found',
    creationsShelf: 'My creations',
    emptyCreations: 'Mix a color and tap Save!',
    lockedName: '???',
    deleteLabel: 'Delete',
  },
} as const;

type T<X> = { [K in keyof X]: X[K] extends string ? string : T<X[K]> };
export type GameTranslations = T<typeof en>;
