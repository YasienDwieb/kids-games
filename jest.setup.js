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
  createPortal: () => null,
}));

// three and its loaders ship as ESM; the 3D road's model helpers only touch
// them at runtime, so tests get inert stand-ins.
// Every three export is an empty class, so module-level scratch objects
// (`new Quaternion()`) construct fine.
jest.mock('three', () => new Proxy({}, { get: (_, key) => (key === '__esModule' ? false : class {}) }));
jest.mock('three/addons/loaders/GLTFLoader.js', () => ({ GLTFLoader: class {} }));
jest.mock('three/addons/utils/SkeletonUtils.js', () => ({ clone: (o) => o }));
