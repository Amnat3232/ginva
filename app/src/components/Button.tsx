import { ReactNode, useRef, useEffect } from "react";
import gsap from "gsap";

interface ButtonProps {
  children: ReactNode;
  variant?: "cyan" | "outline" | "blue";
  magnetic?: boolean;
  className?: string;
  onClick?: () => void;
  style?: React.CSSProperties;
}

const Button = ({
  children,
  variant = "cyan",
  magnetic = false,
  className = "",
  onClick,
  style,
}: ButtonProps) => {
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!magnetic || !buttonRef.current) return;

    const button = buttonRef.current;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = button.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;

      gsap.to(button, {
        x: x * 0.3,
        y: y * 0.3,
        duration: 0.3,
        ease: "power2.out",
      });
    };

    const handleMouseLeave = () => {
      gsap.to(button, {
        x: 0,
        y: 0,
        duration: 0.5,
        ease: "elastic.out(1, 0.5)",
      });
    };

    button.addEventListener("mousemove", handleMouseMove);
    button.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      button.removeEventListener("mousemove", handleMouseMove);
      button.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [magnetic]);

  const baseStyles = {
    padding: "14px 32px",
    borderRadius: "12px",
    fontWeight: 600,
    fontSize: "15px",
    fontFamily: "'Rajdhani', sans-serif",
    cursor: "pointer",
    transition: "all 0.3s ease",
    border: "none",
    position: "relative" as const,
    overflow: "hidden" as const,
    textTransform: "uppercase" as const,
    letterSpacing: "1px",
  };

  const variants = {
    cyan: {
      background:
        "linear-gradient(135deg, #f59e0b 0%, #d97706 50%, #b45309 100%)",
      color: "white",
      boxShadow:
        "0 0 30px rgba(245, 158, 11, 0.4), inset 0 1px 0 rgba(255,255,255,0.2)",
    },
    outline: {
      background: "transparent",
      color: "#f59e0b",
      border: "2px solid #f59e0b",
      boxShadow: "0 0 20px rgba(245, 158, 11, 0.2)",
    },
    blue: {
      background:
        "linear-gradient(135deg, #eab308 0%, #ca8a04 50%, #a16207 100%)",
      color: "white",
      boxShadow:
        "0 0 30px rgba(234, 179, 8, 0.4), inset 0 1px 0 rgba(255,255,255,0.2)",
    },
  };

  const shimmerStyle = {
    position: "absolute" as const,
    top: 0,
    left: "-100%",
    width: "100%",
    height: "100%",
    background:
      "linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)",
    animation: "shimmer 2s infinite",
  };

  return (
    <button
      ref={buttonRef}
      className={className}
      style={{ ...baseStyles, ...variants[variant], ...style }}
      onClick={onClick}
    >
      <style>{`
        @keyframes shimmer {
          100% { left: 100%; }
        }
      `}</style>
      <span style={{ position: "relative", zIndex: 1 }}>{children}</span>
      {variant === "cyan" && <span style={shimmerStyle} />}
    </button>
  );
};

export default Button;
