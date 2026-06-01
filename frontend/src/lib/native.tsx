import { Capacitor } from "@capacitor/core";

/**
 * Initialize native-only behavior. Safe to call on web — it checks the
 * platform first and dynamically imports plugins so the web bundle stays lean.
 *
 * `navigateBack` lets the Android hardware back button drive React Router.
 */
export async function initNative(navigateBack: () => boolean) {
  if (!Capacitor.isNativePlatform()) return;

  try {
    const { StatusBar, Style } = await import("@capacitor/status-bar");
    await StatusBar.setStyle({ style: Style.Dark });
    if (Capacitor.getPlatform() === "android") {
      await StatusBar.setBackgroundColor({ color: "#1e293b" });
    }
  } catch {
    /* status bar not available */
  }

  try {
    const { SplashScreen } = await import("@capacitor/splash-screen");
    await SplashScreen.hide();
  } catch {
    /* splash not available */
  }

  try {
    const { App } = await import("@capacitor/app");
    App.addListener("backButton", ({ canGoBack }) => {
      // navigateBack returns false when we're already at a root screen.
      const handled = navigateBack();
      if (!handled && !canGoBack) {
        App.exitApp();
      }
    });
  } catch {
    /* app plugin not available */
  }
}

export const isNative = Capacitor.isNativePlatform();
export const platform = Capacitor.getPlatform();
