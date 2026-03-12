// Badge Component
import { ReactNode } from "react";

interface BadgeProps {
  children: ReactNode;
  variant?: "active" | "warning" | "danger" | "info" | "blue" | "purple";
  className?: string;
}

export function Badge({
  children,
  variant = "active",
  className = "",
}: BadgeProps) {
  const variantClasses: Record<string, string> = {
    active: "badge-active",
    warning: "badge-warning",
    danger: "badge-danger",
    info: "badge-info",
    blue: "badge-blue",
    purple: "badge-purple",
  };

  return (
    <span className={`badge ${variantClasses[variant]} ${className}`}>
      {children}
    </span>
  );
}

export default Badge;
