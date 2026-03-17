/**
 * GINVA Terminology Mapping
 *
 * แปลงคำศัพท์จาก DeFi Generic → User-Friendly Language
 * เน้นความเป็นมิตรและการปกป้องผู้ใช้
 */

// ═══════════════════════════════════════════════════════════
// 🛡️ USER-FRIENDLY TERMINOLOGY
// ═══════════════════════════════════════════════════════════

export const USER_FRIENDLY_TERMS = {
  // หน้าที่/บทบาท
  BORROWER: "User", // ผู้ใช้ (แทน Borrower)
  SUPPORTER: "Supporter", // ผู้สนับสนุน (แทน Lender/Staker)
  HELPER: "Helper", // ผู้ช่วยเหลือ (แทน Keeper)

  // ระบบปกป้อง
  PROTECTION_SYSTEM: "Protection System", // ระบบปกป้อง (แทน Liquidation)
  PROTECTION_PERIOD: "Protection Period", // ช่วงเวลาปกป้อง (แทน Liquidation Period)
  ASSET_MANAGEMENT: "Asset Management", // การจัดการสินทรัพย์ (แทน Seizure)

  // เอกสาร/สัญญา
  LOAN_ACCOUNT: "Loan", // เงินกู้ (แทน Loan Account)
  LOAN_TICKET: "Loan Ticket", // ตั๋วเงินกู้
  COLLATERAL_TICKET: "Collateral Ticket", // ตั๋วค้ำประกัน

  // การดำเนินการ
  BORROW: "Borrow", // กู้เงิน
  DEPOSIT_COLLATERAL: "Deposit", // ฝากหลักประกัน
  REPAY: "Repay", // คืนเงิน
  EXTEND_LOAN: "Extend", // ต่ออายุ
  PROTECT_ASSET: "Protect Asset", // ปกป้องสินทรัพย์ (แทน Liquidation prevention)

  // การช่วยเหลือ
  ASSIST: "Assist", // ช่วยเหลือ (แทน Liquidate)
  SUPPORT: "Support", // สนับสนุน
  COMPLETE: "Complete", // จัดการให้เสร็จสิ้น

  // ทรัพย์สิน
  COLLATERAL: "Collateral", // หลักประกัน
  PROTECTED_ASSET: "Protected Asset", // สินทรัพย์ที่ได้รับการปกป้อง
  SUPPORTED_ASSET: "Asset Under Support", // สินทรัพย์ที่กำลังได้รับการช่วยเหลือ

  // การเงิน
  PRINCIPAL: "Principal", // เงินต้น
  INTEREST: "Interest", // ดอกเบี้ย
  AMOUNT_DUE: "Amount Due", // จำนวนเงินที่ต้องจ่าย
  BORROW_AMOUNT: "Borrow Amount", // จำนวนเงินที่กู้

  // สถานะ
  ACTIVE: "Active", // ใช้งานอยู่
  REPAID: "Repaid", // คืนเงินแล้ว
  HEALTHY: "Healthy", // สถานะดี
  PROTECTED: "Protected", // ได้รับการปกป้อง
  COMPLETED: "Completed", // จัดการเสร็จสิ้น

  // สถานที่
  DASHBOARD: "Dashboard", // แดชบอร์ด
  SUPPORT_CENTER: "Support Center", // ศูนย์ช่วยเหลือ (แทน Pawn Shop/Storefront)
  MARKET: "Market", // ตลาด
} as const;

// ═══════════════════════════════════════════════════════════
// 🎯 UI LABELS (User-Friendly)
// ═══════════════════════════════════════════════════════════

export const UI_LABELS = {
  // Navigation
  NAV_DASHBOARD: "Dashboard",
  NAV_BORROW: "Borrow",
  NAV_REPAY: "Repay",
  NAV_MY_LOANS: "My Loans",
  NAV_EARN: "Earn",
  NAV_SUPPORT: "Support",

  // Page Titles
  TITLE_DASHBOARD: "Your Dashboard",
  TITLE_BORROW: "Borrow USDC",
  TITLE_REPAY: "Repay Your Loan",
  TITLE_MY_LOANS: "My Loans",
  TITLE_EARN: "Earn Rewards",

  // Descriptions
  DESC_BORROW:
    "Get instant USDC by using your crypto as collateral. No credit checks, just your assets.",
  DESC_REPAY:
    "Repay your loan to get your collateral back. Flexible repayment with no penalties.",
  DESC_EARN:
    "Support the platform and earn rewards. Stake USDC to help borrowers and earn yield.",

  // Buttons
  BTN_BORROW_NOW: "Borrow Now",
  BTN_REPAY_NOW: "Repay Now",
  BTN_EXTEND_LOAN: "Extend Loan",
  BTN_VIEW_LOANS: "View My Loans",
  BTN_DEPOSIT: "Deposit Collateral",
  BTN_STAKE: "Stake USDC",

  // Card Labels
  LABEL_COLLATERAL: "Collateral",
  LABEL_LOAN_VALUE: "Loan Value",
  LABEL_AMOUNT_DUE: "Amount Due",
  LABEL_DUE_DATE: "Due Date",
  LABEL_INTEREST_RATE: "Interest Rate",
  LABEL_HEALTH_STATUS: "Health Status",

  // Status Messages
  STATUS_NO_LOANS:
    "No active loans. Start by borrowing USDC with your crypto as collateral.",
  STATUS_LOAN_ACTIVE: "Your loan is active and in good standing.",
  STATUS_LOAN_HEALTHY: "Your loan is healthy. Keep it up!",
  STATUS_PROTECTION_MATURITY:
    "Maturity Grace Period: You have 72 hours to act if your loan expires.",
  STATUS_PROTECTION_PRICE:
    "Monitor your Health Factor. If it drops below 100%, immediate liquidation may occur.",
  STATUS_ASSET_PROTECTED: "Your asset is protected and safe.",

  // Tooltips
  TOOLTIP_HEALTH_STATUS:
    "Shows the health of your loan. Above 100% is safe. Below 100% triggers Immediate Price Protection - no grace period.",
  TOOLTIP_DUE_DATE: "The date by which you should repay or extend your loan.",
  TOOLTIP_PROTECTION:
    "Two protection layers: (1) Maturity Grace Period - 72 hours after loan expires, (2) Immediate Price Protection - if Health Factor drops below 100%.",
  TOOLTIP_LTV_SAFE: "Low risk: Borrow up to 20% of collateral value",
  TOOLTIP_LTV_STANDARD: "Balanced: Borrow up to 40% of collateral value",
  TOOLTIP_LTV_MAX:
    "High risk: Borrow up to 60% of collateral value - monitor closely!",
} as const;

// ═══════════════════════════════════════════════════════════
// 🎨 NARRATIVE COPY (Friendly & Protective)
// ═══════════════════════════════════════════════════════════

export const NARRATIVE = {
  HERO_HEADLINE: "Get Instant Cash. Keep Your Crypto Safe.",
  HERO_SUBHEADLINE:
    "Borrow USDC using your crypto as collateral. Our Dual Protection System gives you both time-based and price-based protection.",

  VALUE_PROP_1: "Instant Approval",
  VALUE_DESC_1:
    "No credit checks, no paperwork. Get USDC in seconds using your crypto as collateral.",

  VALUE_PROP_2: "Dual Protection System",
  VALUE_DESC_2:
    "Two layers of protection: (1) 72 hours after loan expires, (2) Active price monitoring to protect your assets.",

  VALUE_PROP_3: "Flexible Repayment",
  VALUE_DESC_3:
    "Repay anytime with no penalties. Extend your loan by paying interest. You're in control.",

  VALUE_PROP_4: "Keep Your Benefits",
  VALUE_DESC_4:
    "Your crypto stays locked, not sold. When prices go up, you still benefit from the appreciation.",

  HOW_IT_WORKS: "How It Works",
  STEP_1_TITLE: "1. Deposit Collateral",
  STEP_1_DESC:
    "Lock your SOL, BTC, or ETH as collateral. Your assets stay safe in our secure vault.",
  STEP_2_TITLE: "2. Receive USDC Instantly",
  STEP_2_DESC:
    "Get USDC based on your collateral value. Use it for anything you need.",
  STEP_3_TITLE: "3. Dual Protection",
  STEP_3_DESC:
    "Layer 1: 72 hours after expiry. Layer 2: Immediate protection if Health Factor drops below 100%.",
  STEP_4_TITLE: "4. Repay & Reclaim",
  STEP_4_DESC:
    "Pay back what you borrowed plus interest to get your crypto back. Simple and fair.",

  PROTECTION_EXPLANATION: "How Our Protection Works",
  PROTECTION_TITLE: "Dual Protection System",
  PROTECTION_SUBTITLE: "Two layers of security for your assets",
  PROTECTION_LAYER_1_TITLE: "Layer 1: Maturity Grace Period",
  PROTECTION_LAYER_1_DESC:
    "If your loan expires, you have 72 hours to repay or extend. No immediate action taken.",
  PROTECTION_LAYER_2_TITLE: "Layer 2: Immediate Price Protection",
  PROTECTION_LAYER_2_DESC:
    "If your Health Factor drops below 100%, the system acts immediately to protect investor funds.",
  PROTECTION_STEP_1: "Monitor Your Health",
  PROTECTION_STEP_1_DESC:
    "Keep your Health Factor above 100% by monitoring your collateral value regularly.",
  PROTECTION_STEP_2: "Time to Act (Maturity)",
  PROTECTION_STEP_2_DESC:
    "After loan expires, you have 72 hours to add collateral, repay partially, or repay in full.",
  PROTECTION_STEP_3: "Immediate Action (Price)",
  PROTECTION_STEP_3_DESC:
    "If Health Factor hits 100%, immediate liquidation occurs - no grace period.",
  PROTECTION_STEP_4: "Fair Process",
  PROTECTION_STEP_4_DESC:
    "If assisted, helpers use fair time-based pricing. Surplus value is returned to you.",

  // Risk warnings
  RISK_WARNING: "Important Risk Notice",
  RISK_DESC:
    "Monitor your Health Factor closely. If it drops below 100%, your collateral may be liquidated immediately with no grace period.",

  // Health factor colors
  HEALTH_SAFE: "Safe",
  HEALTH_MEDIUM: "Medium Risk",
  HEALTH_HIGH: "High Risk",
  HEALTH_CRITICAL: "Critical - At Risk of Immediate Liquidation",
} as const;

// ═══════════════════════════════════════════════════════════
// 🔗 SCARY → FRIENDLY MAPPING
// ═══════════════════════════════════════════════════════════

export const SCARY_TO_FRIENDLY_MAPPING: Record<string, string> = {
  // Core terms - AVOID THESE
  Liquidation: "Protection System",
  Liquidate: "Assist",
  Liquidated: "Assisted",
  Liquidator: "Helper",
  Hunter: "Helper",
  Keeper: "Helper",
  Seizure: "Asset Management",
  Seized: "Managed",
  "Forced Sale": "Support Process",
  Forfeit: "Receive Support",
  Forfeited: "Supported",
  "Distressed Asset": "Asset Under Support",
  "Pawn Shop": "Support Center",
  Pawn: "Borrow",
  Pawner: "User",
  Broker: "Platform",

  // Better alternatives
  Borrow: "Borrow",
  Borrower: "User",
  Lender: "Supporter",
  Staker: "Supporter",
  Loan: "Loan",
  Repay: "Repay",
  Collateral: "Collateral",
  "Health Factor": "Health Status",
  "Outstanding Debt": "Amount Due",
  "Active Loan": "Active Loan",
  Repaid: "Repaid",
};

// ═══════════════════════════════════════════════════════════
// 📊 STATUS LABELS (Friendly)
// ═══════════════════════════════════════════════════════════

export const FRIENDLY_STATUS_LABELS: Record<number, string> = {
  0: "Active", // เงินกู้ใช้งานอยู่
  1: "Repaid", // คืนเงินแล้ว
  2: "Assisted", // ได้รับการช่วยเหลือ
};

// ═══════════════════════════════════════════════════════════
// 🚫 WORDS TO NEVER USE
// ═══════════════════════════════════════════════════════════

export const BANNED_WORDS = [
  "Liquidation",
  "Liquidate",
  "Hunter",
  "Seizure",
  "Seize",
  "Forced",
  "Forfeit",
  "Distressed",
  "Pawn Shop",
  "Vulture",
  "Predatory",
  "Hostile",
  "Attack",
] as const;

export default USER_FRIENDLY_TERMS;
