import { ReactNode } from "react";
import { FiLoader } from "react-icons/fi";

export type ButtonVariant = "primary" | "secondary" | "accent" | "success" | "danger" | "ghost";
export type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps {
  children: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
  onClick?: () => void;
  style?: React.CSSProperties;
  icon?: ReactNode;
  iconPosition?: "left" | "right";
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  type?: "button" | "submit" | "reset";
}

const Button = ({
  children,
  variant = "primary",
  size = "md",
  className = "",
  onClick,
  style,
  icon,
  iconPosition = "left",
  loading = false,
  disabled = false,
  fullWidth = false,
  type = "button",
}: ButtonProps) => {
  const sizeStyles: Record<ButtonSize, React.CSSProperties> = {
    sm: { padding: "8px 16px", fontSize: "13px" },
    md: { padding: "12px 24px", fontSize: "15px" },
    lg: { padding: "16px 32px", fontSize: "17px" },
  };

  const variants = {
    primary: {
      background: "linear-gradient(135deg, #F59E0B 0%, #D97706 100%)",
      color: "#0F172A",
      boxShadow: "0 4px 20px rgba(245, 158, 11, 0.3)",
      border: "none",
    },
    secondary: {
      background: "transparent",
      color: "#F59E0B",
      border: "2px solid #F59E0B",
      boxShadow: "0 0 15px rgba(245, 158, 11, 0.2)",
    },
    accent: {
      background: "linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)",
      color: "#FFFFFF",
      boxShadow: "0 4px 20px rgba(59, 130, 246, 0.3)",
      border: "none",
    },
    success: {
      background: "linear-gradient(135deg, #10B981 0%, #059669 100%)",
      color: "#FFFFFF",
      boxShadow: "0 4px 20px rgba(16, 185, 129, 0.3)",
      border: "none",
    },
    danger: {
      background: "linear-gradient(135deg, #EF4444 0%, #DC2626 100%)",
      color: "#FFFFFF",
      boxShadow: "0 4px 20px rgba(239, 68, 68, 0.3)",
      border: "none",
    },
    ghost: {
      background: "transparent",
      color: "#F8FAFC",
      border: "none",
      boxShadow: "none",
    },
  };

  const baseStyles: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    borderRadius: "12px",
    fontWeight: 600,
    fontFamily: "'IBM Plex Sans', sans-serif",
    cursor: disabled || loading ? "not-allowed" : "pointer",
    transition: "all 0.2s ease",
    textTransform: "none" as const,
    letterSpacing: "0px",
    opacity: disabled || loading ? 0.6 : 1,
    width: fullWidth ? "100%" : "auto",
    ...sizeStyles[size],
    ...variants[variant],
    ...style,
  };

  return (
    <button
      className={`btn btn-${variant} btn-${size} ${className}`}
      style={baseStyles}
      onClick={disabled || loading ? undefined : onClick}
      disabled={disabled || loading}
      type={type}
    >
      <style>{`
        .btn:hover:not(:disabled) {
          transform: translateY(-2px);
          filter: brightness(1.1);
        }
        .btn:active:not(:disabled) {
          transform: translateY(0);
        }
        .btn-primary:hover:not(:disabled) {
          box-shadow: 0 6px 30px rgba(245, 158, 11, 0.5);
        }
        .btn-secondary:hover:not(:disabled) {
          background: rgba(245, 158, 11, 0.1) !important;
          box-shadow: 0 0 25px rgba(245, 158, 11, 0.4);
        }
        .btn-accent:hover:not(:disabled) {
          box-shadow: 0 6px 30px rgba(59, 130, 246, 0.5);
        }
        .btn-success:hover:not(:disabled) {
          box-shadow: 0 6px 30px rgba(16, 185, 129, 0.5);
        }
        .btn-danger:hover:not(:disabled) {
          box-shadow: 0 6px 30px rgba(239, 68, 68, 0.5);
        }
        .btn-ghost:hover:not(:disabled) {
          background: rgba(248, 250, 252, 0.1) !important;
        }
        @media (prefers-reduced-motion: reduce) {
          .btn {
            transition: none !important;
            transform: none !important;
          }
        }
      `}</style>
      {loading && <FiLoader className="spin" style={{ animation: "spin 1s linear infinite" }} />}
      {!loading && icon && iconPosition === "left" && <span style={{ display: "flex" }}>{icon}</span>}
      {children}
      {!loading && icon && iconPosition === "right" && <span style={{ display: "flex" }}>{icon}</span>}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </button>
  );
};

export default Button;