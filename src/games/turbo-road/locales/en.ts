export const en = {
  meta: {
    name: 'Turbo Road',
    description: 'A sunny road-trip race — steer, dodge and collect!',
  },
  start: {
    title: 'Turbo Road',
    level: 'Level {{n}}',
    race: 'Race!',
    garage: 'Garage',
    mapLabel: 'Road trip',
  },
  controls: {
    label: 'Steering',
    drag: 'Finger',
    tilt: 'Tilt',
  },
  pause: {
    title: 'Paused',
    resume: 'Keep racing',
    exit: 'Exit race',
  },
  missions: {
    title: 'Missions',
    claim: 'Claim',
    types: {
      coins: 'Collect {{n}} coins',
      first: 'Win {{n}} races',
      races: 'Finish {{n}} races',
      boost: 'Hit {{n}} boost pads',
      clean: 'Finish {{n}} races with no crashes',
    },
  },
  cups: {
    meadow: 'Meadow Cup',
    beach: 'Beach Cup',
    desert: 'Desert Cup',
    snow: 'Snow Cup',
    earned: 'You won the {{name}}!',
  },
  countdown: {
    go: 'GO!',
  },
  hud: {
    level: 'Level {{n}}',
  },
  place: {
    p1: '1st',
    p2: '2nd',
    p3: '3rd',
  },
  win: {
    title: {
      p1: '1st Place!',
      p2: '2nd Place!',
      p3: '3rd Place!',
    },
    coins: '+{{n}} coins',
    next: 'Next race',
    garage: 'Garage',
  },
  garage: {
    title: 'My Garage',
    trim: 'Trim',
    selected: 'Selected',
    select: 'Select',
    unlock: 'Unlock',
    done: 'Done',
    trophies: 'Trophies',
    noTrophies: 'Race to win cups!',
    stats: {
      speed: 'Speed',
      grip: 'Grip',
    },
  },
  cars: {
    turbo: 'Turbo',
    zippy: 'Zippy',
    buggy: 'Buggy',
    taxi: 'Taxi',
    patrol: 'Patrol',
    truck: 'Big Truck',
    tractor: 'Tractor',
    moto: 'Moto',
  },
  trims: {
    coral: 'Coral',
    green: 'Green',
    blue: 'Blue',
    orange: 'Orange',
  },
  themes: {
    meadow: 'Meadow',
    beach: 'Beach',
    desert: 'Desert',
    snow: 'Snowy Hills',
  },
  a11y: {
    steer: 'Steer the car',
    coins: 'Coins',
    stars: 'Stars',
    pause: 'Pause the race',
  },
} as const;

// Structural type: forces ar.ts to have the SAME keys without locking values.
type T<X> = { [K in keyof X]: X[K] extends string ? string : T<X[K]> };
export type GameTranslations = T<typeof en>;
