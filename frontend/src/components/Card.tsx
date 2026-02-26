import React from "react";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  onClick?: () => void;
}

export default function Card({
  children,
  className = "",
  hover = true,
  onClick,
}: CardProps) {
  const Component = onClick ? "button" : "div";

  return (
    <Component
      onClick={onClick}
      className={`bg-ginva-slate rounded-xl p-6 border border-ginva-slate/50 ${
        hover && onClick
          ? "card-hover cursor-pointer hover:bg-ginva-slate/80 hover:border-ginva-slate transition-all duration-200"
          : ""
      } ${onClick ? "text-left w-full" : ""} ${className}`}
    >
      {children}
    </Component>
  );
}
