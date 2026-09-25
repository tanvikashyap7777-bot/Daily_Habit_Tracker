import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.dailyhabittrackertanvi.app',
  appName: 'Daily Habit Tracker',
  webDir: 'dist',
  plugins: {
    LocalNotifications: {
      smallIcon: 'ic_stat_icon',
      iconColor: '#2563eb',
    },
  },
};

export default config;
