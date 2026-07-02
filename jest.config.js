module.exports = {
  preset: 'jest-expo',
  setupFiles: ['<rootDir>/jest.setup.js'],
  moduleNameMapper: {
    '^@/sdk$': '<rootDir>/src/sdk/index.ts',
    '^@/(.*)$': '<rootDir>/src/$1',
    // jest-expo's asset transformer covers wav/mp3 but not .ogg (used by the
    // animal-safari CC0 animal clips); stub .ogg requires so manifest.ts loads.
    '\\.ogg$': '<rootDir>/__mocks__/assetMock.js',
  },
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg|@react-native-async-storage/.*))',
  ],
};
