import {
  useState,
  useCallback,
  createContext,
  useContext,
  ReactNode,
} from "react";
import { Toast, ToastContainer, ToastContainerProps } from "react-bootstrap";

type NotificationType = "success" | "error" | "warning" | "info";

interface ToastItem {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  duration: number;
  timestamp: number;
  show: boolean;
}

interface NotificationContextType {
  notify: (
    type: NotificationType,
    title: string,
    message: string,
    duration?: number
  ) => void;
  success: (title: string, message: string) => void;
  error: (title: string, message: string) => void;
  warning: (title: string, message: string) => void;
  info: (title: string, message: string) => void;
}

const NotificationContext = createContext<NotificationContextType | null>(null);

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotification must be used within NotificationProvider");
  }
  return context;
};

interface NotificationProviderProps {
  children: ReactNode;
  position?: ToastContainerProps["position"];
}

export const NotificationProvider = ({
  children,
  position = "top-end",
}: NotificationProviderProps) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const addToast = useCallback(
    (
      type: NotificationType,
      title: string,
      message: string,
      duration = 5000
    ) => {
      const id = `toast-${Date.now()}-${Math.random()
        .toString(36)
        .substr(2, 9)}`;
      const newToast: ToastItem = {
        id,
        type,
        title,
        message,
        duration,
        timestamp: Date.now(),
        show: true,
      };

      setToasts((prev) => [...prev, newToast]);

      if (duration > 0) {
        setTimeout(() => {
          setToasts((prev) =>
            prev.map((t) => (t.id === id ? { ...t, show: false } : t))
          );
        }, duration);
      }
    },
    []
  );

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const handleClose = useCallback(
    (id: string) => {
      setToasts((prev) =>
        prev.map((t) => (t.id === id ? { ...t, show: false } : t))
      );
      setTimeout(() => removeToast(id), 300);
    },
    [removeToast]
  );

  const value: NotificationContextType = {
    notify: addToast,
    success: (title, message) => addToast("success", title, message),
    error: (title, message) => addToast("error", title, message, 8000),
    warning: (title, message) => addToast("warning", title, message, 6000),
    info: (title, message) => addToast("info", title, message),
  };

  const getVariant = (type: NotificationType): string => {
    switch (type) {
      case "success":
        return "success";
      case "error":
        return "danger";
      case "warning":
        return "warning";
      case "info":
        return "info";
      default:
        return "info";
    }
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
      <ToastContainer position={position} className="p-3">
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            show={toast.show}
            onClose={() => handleClose(toast.id)}
            bg={getVariant(toast.type)}
            delay={toast.duration}
            autohide
          >
            <Toast.Header>
              <strong className="me-auto">
                {toast.type === "success" && "✓ "}
                {toast.type === "error" && "✕ "}
                {toast.type === "warning" && "⚠ "}
                {toast.type === "info" && "ℹ "}
                {toast.title}
              </strong>
            </Toast.Header>
            <Toast.Body className={toast.type === "error" ? "text-white" : ""}>
              {toast.message}
            </Toast.Body>
          </Toast>
        ))}
      </ToastContainer>
    </NotificationContext.Provider>
  );
};

// Export the Notification component (empty wrapper for usage with provider)
export const Notification = () => null;

export default NotificationProvider;
