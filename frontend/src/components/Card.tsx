import React from "react";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  onClick?: () => void;
  variant?: "default" | "glass" | "solid";
}

export default function Card({
  children,
  className = "",
  hover = true,
  onClick,
  variant = "glass",
}: CardProps) {
  const Component = onClick ? "button" : "div";

  const variants = {
    default: "bg-ginva-slate rounded-xl border border-ginva-slate/50",
    glass:
      "bg-white/5 backdrop-blur-[10px] rounded-xl border border-white/20 shadow-lg shadow-black/5",
    solid: "bg-background rounded-xl border border-slate-700",
  };

  const hoverStyles =
    hover && onClick
      ? "cursor-pointer hover:bg-white/10 hover:border-white/30 transition-all duration-200 ease-out"
      : "";

  return (
    <Component
      onClick={onClick}
      className={`${variants[variant]} ${hoverStyles} ${onClick ? "text-left w-full" : ""} ${className}`}
    >
      {children}
    </Component>
  );
}
