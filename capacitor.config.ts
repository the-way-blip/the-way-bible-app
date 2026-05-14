import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "app.theway.bible",
  appName: "The Way",
  webDir: "dist",
  server: {
    // For development: uncomment and set to your local IP to live-reload
    // url: "http://192.168.1.X:5174",
    // cleartext: true,
  },
  ios: {
    contentInset: "automatic",
    backgroundColor: "#faf7f2",
    preferredContentMode: "mobile",
    scheme: "The Way",
  },
  plugins: {
    SplashScreen: {
      launchAutoHide: true,
      launchShowDuration: 1500,
      backgroundColor: "#faf7f2",
      showSpinner: false,
    },
    StatusBar: {
      style: "DARK",
      backgroundColor: "#faf7f2",
    },
  },
};

export default config;
