import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.studyio.app',
  appName: 'study.io',
  webDir: 'public',
  appendUserAgent: 'StudyIoNativeApp',
  server: {
    url: 'https://studyio-web.vercel.app',
    cleartext: true
  }
};

export default config;