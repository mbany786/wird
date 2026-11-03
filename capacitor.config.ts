import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.wird.habits',
  appName: 'Wird',
  webDir: 'dist',
  // Matches --slate-950 (dark theme, src/index.css) — the app's default theme. This is what
  // WKWebView/the Android WebView paint natively behind the page during elastic overscroll, so
  // it should track the app's own background rather than an arbitrary hardcoded color. It can't
  // react to the in-app light/dark toggle (that's a JS/CSS runtime switch, this is native config
  // baked in at build time), so light-mode users will still see a dark flash on overscroll.
  backgroundColor: '#111316',
  ios: {
    contentInset: 'automatic',
    preferredContentMode: 'mobile',
    backgroundColor: '#111316',
  },
  android: {
    backgroundColor: '#111316',
    allowMixedContent: false,
    captureInput: true,
    webContentsDebuggingEnabled: true,
  },
  server: {
    androidScheme: 'https',
    iosScheme: 'capacitor',
  }
};

export default config;
