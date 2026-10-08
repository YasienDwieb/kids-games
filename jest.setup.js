jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

jest.mock('expo-audio', () => ({
  setAudioModeAsync: jest.fn().mockResolvedValue(undefined),
  createAudioPlayer: jest.fn(() => ({
    play: jest.fn(),
    pause: jest.fn(),
    seekTo: jest.fn(),
    remove: jest.fn(),
    setPlaybackRate: jest.fn(),
    loop: false,
    volume: 1,
  })),
}));

jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn().mockResolvedValue(undefined),
  ImpactFeedbackStyle: { Light: 'Light', Medium: 'Medium', Heavy: 'Heavy' },
}));

// worklets 0.10+ installs its native module on import; use the shipped mocks.
jest.mock('react-native-worklets', () => require('react-native-worklets/src/mock'));
jest.mock('react-native-reanimated', () => require('react-native-reanimated/mock'));

// The 3D road (react-three-fiber + three, ESM + a native GL view) never renders
// under Jest — stub the renderer so games that import it still load.
jest.mock('@react-three/fiber/native', () => ({
  Canvas: () => null,
  useFrame: () => {},
}));
