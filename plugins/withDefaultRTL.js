/**
 * The app's default language is Arabic, but a fresh install starts LTR (unless
 * the device itself is in an RTL language): React Native reads the layout
 * direction natively, once, before any JS runs. Boot then called forceRTL and
 * reloaded the app on its very first launch (a reload that also left the native
 * splash stuck on screen; App.tsx now hides the splash itself).
 *
 * This makes a fresh install start in RTL natively, so the first launch already
 * matches Arabic and needs no reload at all. Once the app writes the flag itself
 * (a language switch), that choice wins.
 *   - Android: SharedPreferences, set in MainApplication.onCreate if unset.
 *   - iOS: NSUserDefaults registration domain (a default, never persisted), set
 *     at the top of didFinishLaunching.
 *
 * expo-localization applies its own default once, on the very first launch
 * (forceRTL(false), before React loads), unless its `forcesRTLSetByConfig` flag
 * says that was already done. A fresh install never has that flag, so it would
 * undo ours; we set the flag to false alongside, so it leaves the direction to
 * us. Existing installs already have both flags and are left alone.
 */
const { withMainApplication, withAppDelegate } = require('expo/config-plugins');

const MARKER = '// kids-games: default RTL on fresh install';
const KEY = 'RCTI18nUtil_forceRTL';
const ANDROID_PREFS = 'com.facebook.react.modules.i18nmanager.I18nUtil';
// expo-localization's "default already applied" flag (LocalizationModule.resolveRTL).
const LOCALIZATION_PREFS = 'expo.modules.localization';
const LOCALIZATION_FLAG = 'forcesRTLSetByConfig';
const LOCALIZATION_FLAG_IOS = 'ExpoLocalization_forcesRTLSetByConfig';

function insertAfter(src, anchor, lines, file) {
  if (src.includes(MARKER)) return src;
  if (!src.includes(anchor)) {
    throw new Error(`withDefaultRTL: could not find "${anchor}" in ${file}`);
  }
  return src.replace(anchor, [anchor, ...lines].join('\n'));
}

function addDefaultRTLAndroid(src) {
  return insertAfter(
    src,
    'super.onCreate()',
    [
      `    ${MARKER}`,
      `    if (!getSharedPreferences("${ANDROID_PREFS}", MODE_PRIVATE).contains("${KEY}")) {`,
      '      com.facebook.react.modules.i18nmanager.I18nUtil.instance.forceRTL(this, true)',
      `      getSharedPreferences("${LOCALIZATION_PREFS}", MODE_PRIVATE).edit().putBoolean("${LOCALIZATION_FLAG}", false).apply()`,
      '    }',
    ],
    'MainApplication',
  );
}

function addDefaultRTLIos(src) {
  return insertAfter(
    src,
    ') -> Bool {',
    [
      `    ${MARKER}`,
      `    UserDefaults.standard.register(defaults: ["${KEY}": true, "${LOCALIZATION_FLAG_IOS}": false])`,
    ],
    'AppDelegate',
  );
}

function withDefaultRTL(config) {
  config = withMainApplication(config, (cfg) => {
    if (cfg.modResults.language !== 'kt') {
      throw new Error('withDefaultRTL: expected a Kotlin MainApplication');
    }
    cfg.modResults.contents = addDefaultRTLAndroid(cfg.modResults.contents);
    return cfg;
  });
  return withAppDelegate(config, (cfg) => {
    if (cfg.modResults.language !== 'swift') {
      throw new Error('withDefaultRTL: expected a Swift AppDelegate');
    }
    cfg.modResults.contents = addDefaultRTLIos(cfg.modResults.contents);
    return cfg;
  });
}

module.exports = withDefaultRTL;
module.exports.addDefaultRTLAndroid = addDefaultRTLAndroid;
module.exports.addDefaultRTLIos = addDefaultRTLIos;
