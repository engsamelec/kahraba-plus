import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.kahrabaplus.app",
  appName: "Electrical Plus",
  webDir: "dist",
  backgroundColor: "#1e293b",
  plugins: {
    SplashScreen: {
      launchShowDuration: 1200,
      backgroundColor: "#1e293b",
      androidScaleType: "CENTER_CROP",
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true,
    },
    StatusBar: {
      style: "DARK",
      backgroundColor: "#1e293b",
    },
    Keyboard: {
      resize: "body",
    },
  },
  // For live-reload on a device during development, uncomment and set your LAN IP:
  // server: { url: "http://192.168.1.10:5173", cleartext: true },
};

export default config;
