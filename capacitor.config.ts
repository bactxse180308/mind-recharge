import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.reminer.mindrecharge",
  appName: "Mind Recharge",
  webDir: "dist",
  bundledWebRuntime: false,
  server: {
    androidScheme: "http",
    cleartext: true,
  },
  android: {
    allowMixedContent: true,
  },
};

export default config;
