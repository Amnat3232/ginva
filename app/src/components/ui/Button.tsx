import React from 'react';

/* ============================================
   BUTTON COMPONENT LIBRARY - GINVA
   "ปุ่มคือจุดตัดสินใจ (Decision Point)"
   ============================================ */

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'destructive' | 'outline';
type ButtonSize = 'sm' | 'md' | 'lg' | 'xl';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children: React.ReactNode;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  loading?: boolean;
  fullWidth?: boolean;
}

/* Base styles - ทุกปุ่มมี */
const buttonBase = `
  inline-flex items-center justify-center gap-2
  font-semibold rounded-lg transition-all duration-200
  focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2
  disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none
`;

/* Variant styles - ตามหน้าที่ */
const variantStyles: Record<ButtonVariant, string> = {
  /* PRIMARY - การกระทำหลัก (10% action) */
  primary: `
    bg-[#00e676] text-[#050c06] hover:bg-[#00ff85]
    focus-visible:ring-[#00e676] hover:shadow-[0_0_30px_rgba(0,230,118,0.2)]
    active:scale-[0.98]
  `,
  /* SECONDARY - การกระทำรอง (30% logic) */
  secondary: `
    bg-[#09160a] text-[#81c784] border border-[#1a3a1c]
    hover:bg-[#0d1c0e] hover:border-[#00b359] hover:text-[#00e676]
    focus-visible:ring-[#1a3a1c]
  `,
  /* GHOST - การกระทำที่ไม่เร่งด่วน (60% peace) */
  ghost: `
    bg-transparent text-[#4a6b4c] hover:bg-[#09160a] hover:text-[#81c784]
    focus-visible:ring-[#1a3a1c]
  `,
  /* DESTRUCTIVE - การกระทำเสี่ยง */
  destructive: `
    bg-[#ff5252] text-white hover:bg-[#ff6b6b]
    focus-visible:ring-[#ff5252]
  `,
  /* OUTLINE - ทางเลือก */
  outline: `
    bg-transparent text-[#00e676] border border-[#00e676]
    hover:bg-[rgba(0,230,118,0.08)]
    focus-visible:ring-[#00e676]
  `,
};

/* Size styles */
const sizeStyles: Record<ButtonSize, string> = {
  sm: 'px-4 py-2 text-sm',
  md: 'px-6 py-3 text-base',
  lg: 'px-8 py-4 text-lg',
  xl: 'px-10 py-5 text-xl',
};

export function Button({
  variant = 'primary',
  size = 'md',
  children,
  icon,
  iconPosition = 'left',
  loading = false,
  fullWidth = false,
  className = '',
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`
        ${buttonBase}
        ${variantStyles[variant]}
        ${sizeStyles[size]}
        ${fullWidth ? 'w-full' : ''}
        ${className}
      `}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <LoadingSpinner />
      ) : (
        <>
          {icon && iconPosition === 'left' && <span className="flex-shrink-0">{icon}</span>}
          {children}
          {icon && iconPosition === 'right' && <span className="flex-shrink-0">{icon}</span>}
        </>
      )}
    </button>
  );
}

/* Loading Spinner */
function LoadingSpinner() {
  return (
    <svg
      className="animate-spin h-5 w-5"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}

/* ============================================
   BUTTON GROUPS - Functional Grouping
   ============================================ */

interface ButtonGroupProps {
  children: React.ReactNode;
  direction?: 'horizontal' | 'vertical';
  gap?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function ButtonGroup({
  children,
  direction = 'horizontal',
  gap = 'md',
  className = '',
}: ButtonGroupProps) {
  const gapSizes = { sm: 'gap-2', md: 'gap-4', lg: 'gap-6' };
  const flexDir = direction === 'vertical' ? 'flex-col' : 'flex-row';

  return (
    <div className={`flex ${flexDir} ${gapSizes[gap]} ${className}`}>
      {children}
    </div>
  );
}

/* ============================================
   BUTTON WITH ICONS - Semantic Mapping
   ============================================ */

/* ปุ่มมี icon + text สำหรับ inclusive design */

/* Borrow button */
export function BorrowButton({ children = 'Borrow', ...props }: Partial<ButtonProps>) {
  return (
    <Button variant="primary" size="lg" icon={<BorrowIcon />} {...props}>
      {children}
    </Button>
  );
}

/* Repay button */
export function RepayButton({ children = 'Repay', ...props }: Partial<ButtonProps>) {
  return (
    <Button variant="primary" size="lg" icon={<RepayIcon />} {...props}>
      {children}
    </Button>
  );
}

/* Connect Wallet button */
export function ConnectWalletButton({ children = 'Connect Wallet', ...props }: Partial<ButtonProps>) {
  return (
    <Button variant="primary" size="lg" icon={<WalletIcon />} {...props}>
      {children}
    </Button>
  );
}

/* Learn More */
export function LearnMoreButton({ children = 'Learn More', ...props }: Partial<ButtonProps>) {
  return (
    <Button variant="ghost" size="md" icon={<ArrowIcon />} iconPosition="right" {...props}>
      {children}
    </Button>
  );
}

/* Icons */
function BorrowIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  );
}

function RepayIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 1 0-7h5a3.5 3.5 0 0 0 0 7H6" />
      <path d="M19 14v7M16 17l3 3 3-3" />
    </svg>
  );
}

function WalletIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 12V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h7" />
      <circle cx="17" cy="17" r="3" />
      <path d="M21 17v-2a2 2 0 0 0-2-2" />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M5 12h14M12 5l7 7-7 7" />
    </svg>
  );
}

/* ============================================
   BUTTON STATES - Interactive States
   ============================================ */

/* Disabled state - เทาจางๆ เพื่อป้องกันความผิดพลาด */
export function DisabledExample() {
  return (
    <Button variant="primary" disabled>
      Processing...
    </Button>
  );
}

/* Loading state */
export function LoadingExample() {
  return (
    <Button variant="primary" loading>
      Connecting...
    </Button>
  );
}