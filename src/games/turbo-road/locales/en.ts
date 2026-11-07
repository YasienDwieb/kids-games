export const en = {
  meta: {
    name: 'Turbo Road',
    shortName: 'Racing',
    description: 'A sunny road trip — steer, dodge and collect!',
  },
  // Spoken prompt (docs/VOICE.md).
  say: {
    drive: 'Vroom! Let\'s race to the finish!',
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
  themes: {
    meadow: 'Meadow',
    beach: 'Beach',
    desert: 'Desert',
    snow: 'Snowy Hills',
  },
  // Places, for screen readers; the screen shows medals.
  place: {
    p1: '1st place',
    p2: '2nd place',
    p3: '3rd place',
  },
  a11y: {
    steer: 'Steer the car',
    pause: 'Pause',
    resume: 'Keep driving',
    exit: 'Back to the map',
    drive: 'Drive',
    cars: 'Choose a car',
    locked: 'Not yet',
  },
} as const;

// Structural type: forces ar.ts to have the SAME keys without locking values.
type T<X> = { [K in keyof X]: X[K] extends string ? string : T<X[K]> };
export type GameTranslations = T<typeof en>;
