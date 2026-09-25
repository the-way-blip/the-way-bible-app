import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "app.theway.bible",
  appName: "The Way",
  webDir: "ios-web", // dist minus /data (the app loads the live site; see scripts/build-ios-web.sh)
  server: {
    url: "https://thewaybible.app",
    cleartext: false,
  },
  ios: {
    contentInset: "never",
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
