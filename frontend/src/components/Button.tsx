import React from "react";

interface ButtonProps {
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "cta" | "outline" | "danger" | "glass";
  size?: "sm" | "md" | "lg";
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  type?: "button" | "submit" | "reset";
  ariaLabel?: string;
}

export default function Button({
  children,
  variant = "primary",
  size = "md",
  onClick,
  disabled = false,
  className = "",
  type = "button",
  ariaLabel,
}: ButtonProps) {
  const baseStyles =
    "rounded-lg font-semibold transition-all duration-300 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer";

  const variants = {
    primary:
      "bg-primary text-background hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/20 focus:ring-primary",
    secondary:
      "bg-secondary text-background hover:bg-secondary/90 hover:shadow-lg hover:shadow-secondary/20 focus:ring-secondary",
    cta: "bg-cta text-white hover:bg-cta/90 hover:shadow-lg hover:shadow-cta/30 focus:ring-cta",
    outline:
      "border-2 border-primary text-primary hover:bg-primary hover:text-background focus:ring-primary",
    danger: "bg-red-500 text-white hover:bg-red-600 focus:ring-red-500",
    glass:
      "bg-white/10 text-text border border-white/20 hover:bg-white/20 hover:border-white/30 backdrop-blur-sm focus:ring-white/30",
  };

  const sizes = {
    sm: "px-4 py-2 text-sm min-h-[44px]",
    md: "px-6 py-3 text-base min-h-[44px]",
    lg: "px-8 py-4 text-lg min-h-[48px]",
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
    >
      {children}
    </button>
  );
}
