import React from 'react';

/* ============================================
   CARD COMPONENT LIBRARY - GINVA
   "การ์ดทำหน้าที่จัดกลุ่มข้อมูลที่เกี่ยวข้อง"
   ============================================ */

type CardVariant = 'default' | 'glass' | 'highlight' | 'danger' | 'success' | 'warning';
type CardSize = 'sm' | 'md' | 'lg';

interface CardProps {
  children: React.ReactNode;
  variant?: CardVariant;
  size?: CardSize;
  className?: string;
  onClick?: () => void;
  hoverable?: boolean;
}

/* Glassmorphism - โปร่งแสง + blur บน Dark Theme */
const glassmorphism = `
  backdrop-blur-xl
  bg-[rgba(9,22,10,0.4)]
  border border-[rgba(26,58,28,0.3)]
`;

/* Variant styles - ตามหน้าที่ */
const variantStyles: Record<CardVariant, string> = {
  default: 'bg-[#09160a] border-[#1a3a1c]',
  glass: glassmorphism,
  highlight: 'bg-[#09160a] border-[#00e676] shadow-[0_0_30px_rgba(0,230,118,0.08)]',
  danger: 'bg-[rgba(255,82,82,0.08)] border-[rgba(255,82,82,0.2)]',
  success: 'bg-[rgba(0,230,118,0.08)] border-[rgba(0,230,118,0.15)]',
  warning: 'bg-[rgba(255,215,64,0.06)] border-[rgba(255,215,64,0.1)]',
};

/* Size styles */
const sizeStyles: Record<CardSize, string> = {
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
};

export function Card({
  children,
  variant = 'default',
  size = 'md',
  className = '',
  onClick,
  hoverable = false,
}: CardProps) {
  return (
    <div
      className={`
        rounded-xl
        ${variantStyles[variant]}
        ${sizeStyles[size]}
        ${hoverable ? 'cursor-pointer transition-all duration-300 hover:border-[rgba(0,230,118,0.2)] hover:shadow-[0_8px_32px_rgba(0,0,0,0.4)]' : ''}
        ${onClick ? 'cursor-pointer' : ''}
        ${className}
      `}
      onClick={onClick}
    >
      {children}
    </div>
  );
}

/* ============================================
   CARD SUB-COMPONENTS
   ============================================ */

/* Card Header - สำหรับหัวข้อ */
interface CardHeaderProps {
  children: React.ReactNode;
  description?: string;
  icon?: React.ReactNode;
}

export function CardHeader({ children, description, icon }: CardHeaderProps) {
  return (
    <div className="mb-6">
      <div className="flex items-center gap-3 mb-2">
        {icon && <span className="flex-shrink-0 text-[#00e676]">{icon}</span>}
        <h3 className="text-lg font-semibold text-[#e8f5e9]">{children}</h3>
      </div>
      {description && (
        <p className="text-sm text-[#81c784] ml-9">{description}</p>
      )}
    </div>
  );
}

/* Card Content - เนื้อหาหลัก */
interface CardContentProps {
  children: React.ReactNode;
  className?: string;
}

export function CardContent({ children, className = '' }: CardContentProps) {
  return <div className={`space-y-4 ${className}`}>{children}</div>;
}

/* Card Footer - ส่วนล่าง (ปุ่ม, links) */
interface CardFooterProps {
  children: React.ReactNode;
  className?: string;
}

export function CardFooter({ children, className = '' }: CardFooterProps) {
  return (
    <div className={`mt-6 pt-4 border-t border-[#1a3a1c] ${className}`}>
      {children}
    </div>
  );
}

/* ============================================
   SPECIAL CARDS - Functional Grouping
   ============================================ */

/* Portfolio Card - สรุปสถานะพอร์ตโฟลิโอ */
interface PortfolioCardProps {
  totalCollateral: string;
  totalBorrowed: string;
  healthFactor: number;
  status: 'healthy' | 'warning' | 'critical' | 'emergency';
  onAction?: () => void;
}

export function PortfolioCard({
  totalCollateral,
  totalBorrowed,
  healthFactor,
  status,
  onAction,
}: PortfolioCardProps) {
  const statusConfig = {
    healthy: { color: '#00e676', label: 'Healthy', variant: 'success' as CardVariant },
    warning: { color: '#ffd740', label: 'Warning', variant: 'warning' as CardVariant },
    critical: { color: '#ff5252', label: 'Critical', variant: 'danger' as CardVariant },
    emergency: { color: '#ff5252', label: 'Emergency', variant: 'danger' as CardVariant },
  };

  const config = statusConfig[status];

  return (
    <Card variant="glass" size="lg" hoverable>
      <div className="flex justify-between items-start mb-6">
        <div>
          <h3 className="text-xl font-semibold text-[#e8f5e9]">Your Portfolio</h3>
          <p className="text-sm text-[#4a6b4c]">Current position status</p>
        </div>
        <span
          className="px-3 py-1 rounded-full text-sm font-semibold"
          style={{ backgroundColor: `${config.color}20`, color: config.color }}
        >
          {config.label}
        </span>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-6 mb-6">
        <div>
          <p className="text-sm text-[#4a6b4c] mb-1">Collateral</p>
          <p className="text-2xl font-mono text-[#e8f5e9]">{totalCollateral}</p>
        </div>
        <div>
          <p className="text-sm text-[#4a6b4c] mb-1">Borrowed</p>
          <p className="text-2xl font-mono text-[#e8f5e9]">{totalBorrowed}</p>
        </div>
      </div>

      {/* Health Factor - ข้อมูลสำคัญที่สุด */}
      <div className="bg-[#050c06] rounded-lg p-4 mb-6">
        <div className="flex justify-between items-center">
          <span className="text-sm text-[#4a6b4c]">Health Factor</span>
          <span
            className="text-3xl font-bold font-mono"
            style={{ color: config.color }}
          >
            {healthFactor.toFixed(2)}
          </span>
        </div>
      </div>

      {onAction && (
        <button
          onClick={onAction}
          className="w-full py-3 bg-[#00e676] text-[#050c06] font-semibold rounded-lg hover:bg-[#00ff85] transition-colors"
        >
          Manage Position
        </button>
      )}
    </Card>
  );
}

/* Grace Period Card - การ์ดพิเศษสำหรับ 72h */
interface GracePeriodCardProps {
  hoursRemaining: number;
  onAction?: () => void;
}

export function GracePeriodCard({ hoursRemaining, onAction }: GracePeriodCardProps) {
  const isUrgent = hoursRemaining <= 24;
  const isWarning = hoursRemaining <= 48;

  return (
    <Card
      variant={isUrgent ? 'danger' : isWarning ? 'warning' : 'default'}
      size="md"
      className="relative overflow-hidden"
    >
      {/* Background accent */}
      <div
        className="absolute inset-0 opacity-5"
        style={{
          background: isUrgent
            ? 'linear-gradient(135deg, #ff5252 0%, transparent 50%)'
            : 'linear-gradient(135deg, #00e676 0%, transparent 50%)',
        }}
      />

      <div className="relative">
        <div className="flex items-center gap-3 mb-4">
          <ClockIcon />
          <h3 className="text-lg font-semibold text-[#e8f5e9]">Grace Period Active</h3>
        </div>

        <div className="text-center py-4">
          <p className="text-sm text-[#4a6b4c] mb-2">Time Remaining</p>
          <p
            className="text-4xl font-bold font-mono"
            style={{ color: isUrgent ? '#ff5252' : isWarning ? '#ffd740' : '#00e676' }}
          >
            {hoursRemaining}h
          </p>
        </div>

        <p className="text-sm text-[#81c784] text-center mb-4">
          Add collateral or repay to restore your health factor
        </p>

        {onAction && (
          <button
            onClick={onAction}
            className={`
              w-full py-3 font-semibold rounded-lg transition-colors
              ${isUrgent
                ? 'bg-[#ff5252] text-white hover:bg-[#ff6b6b]'
                : 'bg-[#00e676] text-[#050c06] hover:bg-[#00ff85]'
              }
            `}
          >
            {isUrgent ? 'Act Now' : 'Add Collateral'}
          </button>
        )}
      </div>
    </Card>
  );
}

/* Action Card - การ์ดสำหรับหน้า action (borrow/repay) */
interface ActionCardProps {
  title: string;
  description: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}

export function ActionCard({ title, description, children, action }: ActionCardProps) {
  return (
    <Card variant="glass" size="lg" className="max-w-lg mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-semibold text-[#e8f5e9] mb-2">{title}</h2>
        <p className="text-[#81c784]">{description}</p>
      </div>

      <div className="space-y-6">
        {children}
      </div>

      {action && (
        <div className="mt-8">
          {action}
        </div>
      )}
    </Card>
  );
}

/* Stats Card - การ์ดสำหรับตัวเลขสถิติ */
interface StatsCardProps {
  label: string;
  value: string;
  subValue?: string;
  trend?: 'up' | 'down' | 'neutral';
  icon?: React.ReactNode;
}

export function StatsCard({ label, value, subValue, trend, icon }: StatsCardProps) {
  const trendColors = {
    up: '#00e676',
    down: '#ff5252',
    neutral: '#4a6b4c',
  };

  return (
    <Card variant="default" size="md" hoverable>
      <div className="flex justify-between items-start mb-4">
        <span className="text-sm text-[#4a6b4c]">{label}</span>
        {icon && <span className="text-[#00e676]">{icon}</span>}
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-3xl font-bold font-mono text-[#e8f5e9]">{value}</span>
        {subValue && (
          <span className="text-sm" style={{ color: trendColors[trend || 'neutral'] }}>
            {subValue}
          </span>
        )}
      </div>
    </Card>
  );
}

/* Helper Components */
function ClockIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#00e676" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 6v6l4 2" />
    </svg>
  );
}