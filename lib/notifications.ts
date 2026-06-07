/**
 * Utility for handling browser notifications with safety checks for mobile
 */

export const requestNotificationPermission = async () => {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return false;
  }

  try {
    if (Notification.permission === "granted") {
      return true;
    }

    if (Notification.permission !== "denied") {
      const permission = await Notification.requestPermission();
      return permission === "granted";
    }
  } catch (error) {
    console.error("Error requesting notification permission:", error);
  }

  return false;
};

export const registerServiceWorker = async () => {
  if (typeof window !== "undefined" && "serviceWorker" in navigator) {
    try {
      const registration = await navigator.serviceWorker.register("/sw.js");
      console.warn("Service Worker registered with scope:", registration.scope);
      return registration;
    } catch (error) {
      console.error("Service Worker registration failed:", error);
    }
  }
  return null;
};

export const sendNotification = (title: string, options?: NotificationOptions) => {
  if (typeof window === "undefined" || !("Notification" in window) || Notification.permission !== "granted") {
    return;
  }

  interface ExtendedNotificationOptions extends NotificationOptions {
    vibrate?: number[];
  }

  try {
    // 1. Coba gunakan Service Worker (Wajib untuk mobile/PWA agar muncul)
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.ready.then((registration) => {
        const notificationOptions: ExtendedNotificationOptions = {
          icon: "/icon-192.png",
          badge: "/icon-192.png",
          vibrate: [100, 50, 100],
          ...options,
        };
        registration.showNotification(title, notificationOptions);
      }).catch(() => {
        // Fallback ke standard jika SW gagal
        new Notification(title, options);
      });
    } else {
      new Notification(title, options);
    }
  } catch (error) {
    console.error("Critical error in sendNotification:", error);
  }
};
