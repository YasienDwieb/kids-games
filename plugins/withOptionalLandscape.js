/**
 * The app locks to landscape (`orientation` in app.json), which makes Android
 * treat a landscape screen as required hardware; Play then hides the app from
 * devices that don't report one (Play Games on PC, Android XR, some desktops).
 * Declaring the feature optional keeps the lock but drops that filter.
 */
const { withAndroidManifest } = require('expo/config-plugins');

const FEATURE = 'android.hardware.screen.landscape';

module.exports = function withOptionalLandscape(config) {
  return withAndroidManifest(config, (cfg) => {
    const manifest = cfg.modResults.manifest;
    const features = (manifest['uses-feature'] ??= []);
    const existing = features.find((f) => f.$['android:name'] === FEATURE);
    if (existing) existing.$['android:required'] = 'false';
    else features.push({ $: { 'android:name': FEATURE, 'android:required': 'false' } });
    return cfg;
  });
};
