import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.wird.habits',
  appName: 'Wird',
  webDir: 'dist',
  backgroundColor: '#020617',
  ios: {
    contentInset: 'automatic',
    preferredContentMode: 'mobile',
    backgroundColor: '#020617',
  },
  server: {
    androidScheme: 'https',
    iosScheme: 'capacitor',
  }
};

export default config;
