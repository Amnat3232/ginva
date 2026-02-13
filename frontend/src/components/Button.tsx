import React from "react";

interface ButtonProps {
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "outline";
  size?: "sm" | "md" | "lg";
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
}

export default function Button({
  children,
  variant = "primary",
  size = "md",
  onClick,
  disabled = false,
  className = "",
}: ButtonProps) {
  const baseStyles =
    "rounded-lg font-semibold transition-all duration-300 flex items-center justify-center";

  const variants = {
    primary:
      "btn-gold text-ginva-navy hover:shadow-lg hover:shadow-ginva-gold/20",
    secondary:
      "bg-ginva-cyan text-ginva-navy hover:bg-ginva-cyan/90 hover:shadow-lg hover:shadow-ginva-cyan/20",
    outline:
      "border-2 border-ginva-gold text-ginva-gold hover:bg-ginva-gold hover:text-ginva-navy",
  };

  const sizes = {
    sm: "px-4 py-2 text-sm",
    md: "px-6 py-3 text-base",
    lg: "px-8 py-4 text-lg",
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${baseStyles} ${variants[variant]} ${
        sizes[size]
      } ${className} ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
    >
      {children}
    </button>
  );
}
