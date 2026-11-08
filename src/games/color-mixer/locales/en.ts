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

  // Spoken prompt for a mystery colour (docs/VOICE.md).
  say: {
    paint: 'Paint it this color!',
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

  // Mixing zone (dragHint is spoken, not shown)
  mixingZone: {
    dragHint: 'Drag a color into the bowl!',
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

  // Challenge mode (in-game target panel)
  challenge: {
    makeThisColor: 'Make this color:',
  },

  // Discovery celebration modal
  discovery: {
    title: 'New color!',
  },

  // Color collection modal
  collection: {
    done: 'Done',
    deleteLabel: 'Delete',
  },
} as const;

type T<X> = { [K in keyof X]: X[K] extends string ? string : T<X[K]> };
export type GameTranslations = T<typeof en>;
