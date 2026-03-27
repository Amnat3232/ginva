import { ReactNode, Suspense as ReactSuspense } from "react";
import { Spinner, Card } from "react-bootstrap";

interface SuspenseProps {
  children: ReactNode;
  fallback?: ReactNode;
  loadingMessage?: string;
}

interface LoadingProps {
  message?: string;
  text?: string;
  centered?: boolean;
}

export const Loading = ({ message, text, centered = true }: LoadingProps) => {
  const displayMessage = message || text || "Loading...";
  return (
    <div
      className={`d-flex flex-column align-items-center justify-content-center ${
        centered ? "py-5" : "p-3"
      }`}
      role="status"
      aria-live="polite"
    >
      <Spinner
        animation="border"
        variant="primary"
        size="sm"
        className="me-2"
      />
      <span className="text-muted mt-2">{displayMessage}</span>
    </div>
  );
};

export const LoadingCard = ({
  title = "Loading...",
  message,
}: {
  title?: string;
  message?: string;
}) => {
  return (
    <Card className="mb-3">
      <Card.Header className="d-flex justify-content-between align-items-center">
        <span>{title}</span>
        <Spinner animation="border" size="sm" variant="primary" />
      </Card.Header>
      <Card.Body>
        {message ? (
          <p className="text-muted mb-0">{message}</p>
        ) : (
          <Loading centered={false} />
        )}
      </Card.Body>
    </Card>
  );
};

export const PageLoading = ({
  message = "Loading page...",
}: {
  message?: string;
}) => {
  return (
    <div
      className="d-flex flex-column align-items-center justify-content-center vh-100"
      role="status"
    >
      <div className="text-center">
        <Spinner
          animation="grow"
          variant="primary"
          style={{ width: "3rem", height: "3rem" }}
        />
        <h4 className="mt-4 text-white">{message}</h4>
      </div>
    </div>
  );
};

// Wrapper for React Suspense
export const Suspense = ({ children, fallback }: SuspenseProps) => {
  return (
    <ReactSuspense fallback={fallback || <Loading />}>{children}</ReactSuspense>
  );
};

// Skeleton loading component
interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  variant?: "text" | "circular" | "rectangular";
  animation?: "wave" | "glow" | "none";
  className?: string;
}

export const Skeleton = ({
  width,
  height,
  variant = "rectangular",
  animation = "wave",
  className = "",
}: SkeletonProps) => {
  const style: React.CSSProperties = {
    width: width || "100%",
    height: height || "1rem",
    borderRadius:
      variant === "circular"
        ? "50%"
        : variant === "text"
        ? "0.25rem"
        : "0.5rem",
  };

  const animationClass =
    animation === "wave"
      ? "skeleton-wave"
      : animation === "glow"
      ? "skeleton-glow"
      : "";

  return (
    <div
      className={`skeleton ${animationClass} ${className}`}
      style={style}
      role="presentation"
    />
  );
};

export default Loading;
