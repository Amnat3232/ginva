import React from "react";

interface ButtonProps {
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "outline" | "danger";
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
    "rounded-lg font-semibold transition-all duration-300 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-ginva-navy disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer";

  const variants = {
    primary:
      "bg-gradient-to-r from-ginva-gold to-yellow-500 text-ginva-navy hover:shadow-lg hover:shadow-ginva-gold/20 focus:ring-ginva-gold",
    secondary:
      "bg-ginva-cyan text-ginva-navy hover:bg-ginva-cyan/90 hover:shadow-lg hover:shadow-ginva-cyan/20 focus:ring-ginva-cyan",
    outline:
      "border-2 border-ginva-gold text-ginva-gold hover:bg-ginva-gold hover:text-ginva-navy focus:ring-ginva-gold",
    danger: "bg-ginva-red text-white hover:bg-red-600 focus:ring-ginva-red",
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
