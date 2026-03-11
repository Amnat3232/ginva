import { ReactNode, useRef } from "react";
import gsap from "gsap";

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  hoverEffect?: boolean;
}

const GlassCard = ({
  children,
  className = "",
  hoverEffect = true,
}: GlassCardProps) => {
  const cardRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!hoverEffect || !cardRef.current) return;

    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotateX = (y - centerY) / 10;
    const rotateY = (centerX - x) / 10;

    gsap.to(cardRef.current, {
      rotationX: rotateX,
      rotationY: rotateY,
      duration: 0.5,
      ease: "power2.out",
    });
  };

  const handleMouseLeave = () => {
    if (!hoverEffect || !cardRef.current) return;

    gsap.to(cardRef.current, {
      rotationX: 0,
      rotationY: 0,
      duration: 0.5,
      ease: "elastic.out(1, 0.5)",
    });
  };

  return (
    <div
      ref={cardRef}
      className={className}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        background: "rgba(255, 255, 255, 0.05)",
        backdropFilter: "blur(20px)",
        borderRadius: "20px",
        border: "1px solid rgba(255, 255, 255, 0.1)",
        boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)",
        padding: "30px",
        transformStyle: "preserve-3d",
        transition:
          "box-shadow 0.3s ease, border-color 0.3s ease, background 0.3s ease",
        cursor: hoverEffect ? "pointer" : "default",
      }}
      onMouseEnter={(e) => {
        if (!hoverEffect) return;
        e.currentTarget.style.boxShadow = "0 8px 40px rgba(245, 158, 11, 0.2)";
        e.currentTarget.style.borderColor = "rgba(245, 158, 11, 0.3)";
        e.currentTarget.style.background = "rgba(245, 158, 11, 0.05)";
      }}
    >
      {children}
    </div>
  );
};

export default GlassCard;
