import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.overrool.courts',
  appName: 'Overrool',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
  plugins: {
    SecureStoragePlugin: {
      // default: local keychain only; iOS Keychain Sharing not required for single-app keys
    },
  },
  android: {
    allowMixedContent: false,
  },
  ios: {
    contentInset: 'always',
  },
};

export default config;