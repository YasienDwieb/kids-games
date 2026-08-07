module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    // Reanimated v4 compiles `'worklet'`-tagged functions so they can run on the
    // UI thread. Must stay last in the plugin list.
    plugins: ['react-native-worklets/plugin'],
  };
};
