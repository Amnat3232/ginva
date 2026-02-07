/**
 * Ginva Terminology Mapping
 *
 * แปลงคำศัพท์จาก DeFi Generic → Pawn Shop Identity
 * ใช้เป็น reference สำหรับการ rebranding ทั้งระบบ
 */

// ═══════════════════════════════════════════════════════════
// 🏪 PAWN SHOP TERMINOLOGY
// ═══════════════════════════════════════════════════════════

export const PAWN_SHOP_TERMS = {
  // หน้าที่/บทบาท
  BORROWER: "Pawner", // ผู้จำนำ (แทน Borrower)
  LENDER: "The Broker", // โรงรับจำนำ/หลงจู๊ (แทน Lender)
  VAULT: "The Vault", // ห้องนิรภัยเก็บของ

  // เอกสาร/สัญญา
  LOAN_ACCOUNT: "Pawn Ticket", // ตั๋วจำนำ (แทน Loan Account)
  LOAN_AGREEMENT: "Pawn Agreement", // สัญญาจำนำ

  // การดำเนินการ
  BORROW: "Pawn", // จำนำ (แทน Borrow)
  DEPOSIT_COLLATERAL: "Pledge", // นำของมาจำนำ (ฝากหลักประกัน)
  REPAY: "Redeem", // ไถ่ถอน (แทน Repay)
  EXTEND_LOAN: "Extend Ticket", // ต่อดอก/ต่อตั๋ว (แทน Extend Loan)
  LIQUIDATE: "Forfeit", // ของหลุดจำนำ (แทน Liquidate)
  LIQUIDATED: "Forfeited", // ของหลุดแล้ว (แทน Liquidated)

  // ทรัพย์สิน
  COLLATERAL: "Pledged Asset", // ทรัพย์จำนำ (แทน Collateral)
  SEIZED_ASSETS: "Forfeited Assets", // ของหลุดที่ยึดมา

  // การเงิน
  PRINCIPAL: "Principal", // เงินต้น
  INTEREST: "Interest", // ดอกเบี้ย
  OUTSTANDING_DEBT: "Amount Due", // จำนวนเงินที่ต้องจ่าย

  // สถานะ
  ACTIVE: "Active", // ตั๋วยังใช้ได้
  REPAID: "Redeemed", // ไถ่ถอนแล้ว (แทน Repaid)
  HEALTHY: "Good Standing", // สถานะดี (แทน Healthy)

  // สถานที่
  STOREFRONT: "Storefront", // หน้าร้านขายของหลุด
  BARGAIN_BIN: "Bargain Bin", // ที่ขายของหลุดลดราคา
} as const;

// ═══════════════════════════════════════════════════════════
// 🎯 UI LABELS
// ═══════════════════════════════════════════════════════════

export const UI_LABELS = {
  // Navigation
  NAV_PAWN: "Pawn",
  NAV_REDEEM: "Redeem",
  NAV_TICKETS: "My Tickets",
  NAV_STOREFRONT: "Storefront",

  // Page Titles
  TITLE_PAWN: "Pawn Your Assets",
  TITLE_REDEEM: "Redeem Your Pledged Assets",
  TITLE_DASHBOARD: "Ginva Digital Pawn Shop",

  // Descriptions
  DESC_PAWN:
    "Get instant cash by pawning your digital assets. No credit checks, just your collateral.",
  DESC_REDEEM:
    "Redeem your pledged assets by paying the amount due before the ticket expires.",

  // Buttons
  BTN_PAWN_NOW: "Pawn Now",
  BTN_REDEEM_NOW: "Redeem Now",
  BTN_EXTEND_TICKET: "Extend Ticket (Pay Interest)",
  BTN_VIEW_TICKETS: "View My Tickets",

  // Card Labels
  LABEL_PLEDGED_ASSET: "Pledged Asset",
  LABEL_TICKET_VALUE: "Ticket Value",
  LABEL_AMOUNT_DUE: "Amount Due",
  LABEL_EXPIRES_AT: "Ticket Expires",
  LABEL_INTEREST_RATE: "Interest Rate",

  // Status Messages
  STATUS_NO_TICKETS: "No active pawn tickets. Start by pledging your assets.",
  STATUS_TICKET_ACTIVE: "Your pawn ticket is active and in good standing.",
  STATUS_TICKET_EXPIRED:
    "Your ticket has expired. You can still redeem within the grace period.",
  STATUS_ASSET_FORFEITED:
    "This asset has been forfeited and is now available in the storefront.",

  // Tooltips
  TOOLTIP_HEALTH_FACTOR:
    "The value of your pledged asset vs amount borrowed. Above 100% is safe.",
  TOOLTIP_TICKET_EXPIRY:
    "You must redeem or extend your ticket before this date.",
} as const;

// ═══════════════════════════════════════════════════════════
// 🎨 NARRATIVE COPY
// ═══════════════════════════════════════════════════════════

export const NARRATIVE = {
  HERO_HEADLINE: "Ginva: The First Digital Pawn Shop on Solana",
  HERO_SUBHEADLINE:
    "Turn your digital assets into instant cash with Smart Pawn Tickets. Transparent, fair, and always open.",

  VALUE_PROP_1: "No Credit Checks",
  VALUE_DESC_1:
    "We don't care who you are. We care about the value of your pledged assets.",

  VALUE_PROP_2: "Fixed Duration",
  VALUE_DESC_2:
    "Your ticket has a clear 30-day term. No floating interest rates to worry about.",

  VALUE_PROP_3: "Redeem Anytime",
  VALUE_DESC_3:
    "Get your assets back whenever you want before the ticket expires.",

  VALUE_PROP_4: "Easy Forfeit",
  VALUE_DESC_4:
    "Don't want your asset back? Just let it forfeit. No debt collectors, no hassles.",

  HOW_IT_WORKS: "How Ginva Works",
  STEP_1_TITLE: "1. Pledge Your Asset",
  STEP_1_DESC:
    "Deposit your SOL or supported tokens as collateral. Get instant USDC based on asset value.",
  STEP_2_TITLE: "2. Receive Your Ticket",
  STEP_2_DESC:
    "Your Smart Pawn Ticket represents your right to redeem. It's transferable and tradeable.",
  STEP_3_TITLE: "3. Redeem or Extend",
  STEP_3_DESC:
    "Pay the amount due to get your asset back, or extend your ticket by paying interest.",
  STEP_4_TITLE: "4. Forfeit (Optional)",
  STEP_4_DESC:
    "Can't redeem? No problem. Your asset goes to the storefront. No debt, no stress.",
} as const;

// ═══════════════════════════════════════════════════════════
// 🔗 LEGACY → NEW MAPPING (สำหรับการ migrate)
// ═══════════════════════════════════════════════════════════

export const LEGACY_TO_PAWN_MAPPING: Record<string, string> = {
  // Core terms
  Borrow: "Pawn",
  Borrower: "Pawner",
  Lender: "Broker",
  Loan: "Pawn Ticket",
  Loans: "Pawn Tickets",
  Repay: "Redeem",
  Collateral: "Pledged Asset",
  Liquidation: "Forfeit",
  Liquidated: "Forfeited",
  "Extend Loan": "Extend Ticket",
  "Health Factor": "Asset Coverage",
  "Outstanding Debt": "Amount Due",
  "Active Loan": "Active Ticket",
  Repaid: "Redeemed",
};

// ═══════════════════════════════════════════════════════════
// 📊 STATUS MAPPING สำหรับ Smart Contract
// ═══════════════════════════════════════════════════════════

export const PAWN_STATUS_LABELS: Record<number, string> = {
  0: "Active", // ตั๋วใช้งานได้
  1: "Redeemed", // ไถ่ถอนแล้ว
  2: "Forfeited", // หลุดจำนำ
};

export default PAWN_SHOP_TERMS;
