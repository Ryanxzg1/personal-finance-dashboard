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

export const sendNotification = (title: string, options?: NotificationOptions) => {
  if (typeof window === "undefined" || !("Notification" in window) || Notification.permission !== "granted") {
    return;
  }

  try {
    // 1. Coba gunakan Service Worker jika tersedia (Lebih stabil di mobile/PWA)
    if ("serviceWorker" in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.ready.then((registration) => {
        registration.showNotification(title, {
          icon: "/icon-192x192.png",
          ...options,
        });
      }).catch(err => {
        console.warn("ServiceWorker notification failed, falling back...", err);
        // Fallback ke standard Notification
        new Notification(title, options);
      });
    } else {
      // 2. Fallback ke standard Notification (Desktop)
      // Dibungkus try-catch karena di mobile ini sering throw "Illegal constructor"
      try {
        new Notification(title, options);
      } catch (e) {
        console.warn("Standard Notification constructor failed (common on mobile).");
      }
    }
  } catch (error) {
    // Pastikan error tidak membuat aplikasi crash/redirect
    console.error("Critical error in sendNotification:", error);
  }
};
