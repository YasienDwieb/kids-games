const { addDefaultRTLAndroid, addDefaultRTLIos } = require('../withDefaultRTL');

const MAIN_APPLICATION = `class MainApplication : Application(), ReactApplication {
  override fun onCreate() {
    super.onCreate()
    loadReactNative(this)
  }
}`;

const APP_DELEGATE = `class AppDelegate: ExpoAppDelegate {
  public override func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
  ) -> Bool {
    let delegate = ReactNativeDelegate()
    return super.application(application, didFinishLaunchingWithOptions: launchOptions)
  }
}`;

describe('withDefaultRTL', () => {
  it('Android: sets RTL before React Native loads, only when the flag was never written', () => {
    const out = addDefaultRTLAndroid(MAIN_APPLICATION);
    expect(out).toContain('.contains("RCTI18nUtil_forceRTL")');
    expect(out).toContain('I18nUtil.instance.forceRTL(this, true)');
    expect(out.indexOf('forceRTL(this, true)')).toBeLessThan(out.indexOf('loadReactNative'));
  });

  it('Android: stops expo-localization resetting it on the first launch', () => {
    const out = addDefaultRTLAndroid(MAIN_APPLICATION);
    expect(out).toContain(
      'getSharedPreferences("expo.modules.localization", MODE_PRIVATE).edit().putBoolean("forcesRTLSetByConfig", false).apply()',
    );
  });

  it('iOS: registers RTL as a default before React Native starts', () => {
    const out = addDefaultRTLIos(APP_DELEGATE);
    expect(out).toContain(
      'UserDefaults.standard.register(defaults: ["RCTI18nUtil_forceRTL": true, "ExpoLocalization_forcesRTLSetByConfig": false])',
    );
    expect(out.indexOf('register(defaults')).toBeLessThan(out.indexOf('ReactNativeDelegate()'));
  });

  it('is idempotent', () => {
    const android = addDefaultRTLAndroid(MAIN_APPLICATION);
    expect(addDefaultRTLAndroid(android)).toBe(android);
    const ios = addDefaultRTLIos(APP_DELEGATE);
    expect(addDefaultRTLIos(ios)).toBe(ios);
  });
});
