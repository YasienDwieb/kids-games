// Learn more https://docs.expo.dev/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Bundle .ogg audio (Metro's default assetExts omits it). Used by the real
// CC0 animal sound clips in src/sdk/assets/audio/animals/ (Animal Safari).
if (!config.resolver.assetExts.includes('ogg')) {
  config.resolver.assetExts.push('ogg');
}

module.exports = config;
