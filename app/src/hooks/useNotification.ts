import { useCallback } from "react";

export const useNotification = () => {
  const notify = useCallback(
    (type: "success" | "error" | "warning" | "info", message: string) => {
      console.log(`[${type.toUpperCase()}] ${message}`);

      // Browser notifications
      if ("Notification" in window && Notification.permission === "granted") {
        new Notification(type.toUpperCase(), {
          body: message,
          icon: "/favicon.svg",
        });
      }
    },
    []
  );

  const requestPermission = useCallback(async () => {
    if ("Notification" in window && Notification.permission === "default") {
      await Notification.requestPermission();
    }
  }, []);

  return { notify, requestPermission };
};
