// Button Component
import { ReactNode } from "react";

interface ButtonProps {
  children: ReactNode;
  variant?: "primary" | "outline" | "danger" | "ghost";
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  type?: "button" | "submit" | "reset";
}

export function Button({
  children,
  variant = "primary",
  onClick,
  disabled = false,
  className = "",
  type = "button",
}: ButtonProps) {
  const baseClass = "btn";

  const variantClasses: Record<string, string> = {
    primary: "btn-primary",
    outline: "btn-outline",
    danger: "btn-danger",
    ghost: "btn-ghost",
  };

  return (
    <button
      type={type}
      className={`${baseClass} ${variantClasses[variant]} ${className}`}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
}

export default Button;
