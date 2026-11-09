module.exports = {
  preset: 'jest-expo',
  setupFiles: ['react-native-gesture-handler/jestSetup.js', '<rootDir>/jest.setup.js'],
  // scripts/ tests run under `node --test` (npm run test:voice); workers/ is plain Cloudflare code.
  testPathIgnorePatterns: ['/node_modules/', '<rootDir>/scripts/', '<rootDir>/workers/'],
  moduleNameMapper: {
    '\\.(glb|rgba)$': '<rootDir>/jest/fileStub.js',
    '^@/sdk$': '<rootDir>/src/sdk/index.ts',
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg|@react-native-async-storage/.*))',
  ],
};
