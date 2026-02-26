import React from "react";

interface SkeletonProps {
  className?: string;
  variant?: "text" | "circular" | "rectangular";
  width?: string | number;
  height?: string | number;
  animate?: boolean;
}

export default function Skeleton({
  className = "",
  variant = "rectangular",
  width,
  height,
  animate = true,
}: SkeletonProps) {
  const baseStyles = "bg-ginva-slate/50";

  const variantStyles = {
    text: "rounded",
    circular: "rounded-full",
    rectangular: "rounded-lg",
  };

  const animateStyles = animate ? "animate-pulse" : "";

  const style: React.CSSProperties = {
    width: width || "100%",
    height: height || (variant === "text" ? "1em" : "100%"),
  };

  return (
    <div
      className={`${baseStyles} ${variantStyles[variant]} ${animateStyles} ${className}`}
      style={style}
      aria-label="Loading..."
      role="status"
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
}

export function SkeletonCard() {
  return (
    <div className="bg-ginva-slate rounded-xl p-6 border border-ginva-slate/50">
      <Skeleton variant="text" width="40%" height={20} className="mb-4" />
      <Skeleton variant="text" width="60%" height={32} className="mb-2" />
      <Skeleton variant="text" width="30%" height={16} />
    </div>
  );
}

export function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center space-x-4">
          <Skeleton variant="circular" width={40} height={40} />
          <div className="flex-1 space-y-2">
            <Skeleton variant="text" width="30%" height={16} />
            <Skeleton variant="text" width="20%" height={14} />
          </div>
        </div>
      ))}
    </div>
  );
}

export function SkeletonChart() {
  return (
    <div className="bg-ginva-slate rounded-xl p-6 border border-ginva-slate/50">
      <div className="flex justify-between items-center mb-6">
        <Skeleton variant="text" width={120} height={24} />
        <Skeleton variant="text" width={80} height={32} />
      </div>
      <div className="flex items-end justify-between h-48 gap-2">
        {Array.from({ length: 7 }).map((_, i) => (
          <Skeleton
            key={i}
            variant="rectangular"
            width="12%"
            height={`${30 + Math.random() * 60}%`}
          />
        ))}
      </div>
    </div>
  );
}

export function SkeletonStats() {
  return (
    <div className="grid md:grid-cols-3 gap-6">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="bg-ginva-slate rounded-xl p-6">
          <Skeleton variant="text" width="40%" height={16} className="mb-2" />
          <Skeleton variant="text" width="60%" height={40} className="mb-2" />
          <Skeleton variant="text" width="30%" height={14} />
        </div>
      ))}
    </div>
  );
}
