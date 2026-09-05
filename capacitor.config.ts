import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.edupulseai.app',
  appName: 'EduPulseAI',
  webDir: 'dist',
  // Once your backend is deployed, set the server URL here for live-reload during dev:
  // server: {
  //   url: 'http://YOUR_LOCAL_IP:5173',
  //   cleartext: true,
  // },
  android: {
    allowMixedContent: true,
    backgroundColor: '#ffffff',
  },
  plugins: {
    CapacitorHttp: {
      enabled: true,
    },
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#7c3aed',
      androidSplashResourceName: 'splash',
      showSpinner: false,
    },
  },
}

export default config
