import { ReactNode, CSSProperties } from "react";
import "./GlassCard.css";

interface GlassCardProps {
  children: ReactNode;
  variant?: "default" | "hover" | "interactive";
  glow?: boolean;
  gradient?: boolean;
  padding?: "none" | "sm" | "md" | "lg";
  className?: string;
  style?: CSSProperties;
  onClick?: () => void;
}

export const GlassCard = ({
  children,
  variant = "default",
  glow = false,
  gradient = false,
  padding = "md",
  className = "",
  style,
  onClick,
}: GlassCardProps) => {
  const classes = [
    "ginva-glass",
    `ginva-glass--padding-${padding}`,
    `ginva-glass--${variant}`,
    glow && "ginva-glass--glow",
    gradient && "ginva-glass--gradient",
    onClick && "ginva-glass--clickable",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      className={classes}
      style={style}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      {children}
    </div>
  );
};

// Card Sections
export const GlassCardHeader = ({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) => <div className={`ginva-glass__header ${className}`}>{children}</div>;

export const GlassCardBody = ({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) => <div className={`ginva-glass__body ${className}`}>{children}</div>;

export const GlassCardFooter = ({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) => <div className={`ginva-glass__footer ${className}`}>{children}</div>;

// Status Badge
interface StatusBadgeProps {
  status: "active" | "liquidating" | "liquidated" | "repaid" | "none";
  children?: ReactNode;
}

export const StatusBadge = ({ status, children }: StatusBadgeProps) => {
  const statusConfig = {
    active: { label: "Active", color: "var(--color-success)" },
    liquidating: { label: "Liquidating", color: "var(--color-warning)" },
    liquidated: { label: "Liquidated", color: "var(--color-error)" },
    repaid: { label: "Repaid", color: "var(--color-info)" },
    none: { label: "No Loan", color: "var(--color-text-muted)" },
  };

  const config = statusConfig[status];

  return (
    <span
      className="ginva-status-badge"
      style={
        {
          "--badge-color": config.color,
        } as CSSProperties
      }
    >
      <span className="ginva-status-badge__dot" />
      {children || config.label}
    </span>
  );
};

export default GlassCard;
