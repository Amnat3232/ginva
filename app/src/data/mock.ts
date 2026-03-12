// GINVA Mock Data

// KEEPER REWARD TYPE
export interface KeeperReward {
  text: string;
  highlight: string;
}

// KEEPER INFO WITH REWARD AS OBJECT
export const KEEPER_INFO = [
  {
    cls: "k-a",
    badge: "a",
    label: "Keeper A",
    title: "Trigger Keeper",
    icon: "🟢",
    desc: "Monitors Health Factor. Initiates liquidation when HF < 100% or 72h after maturity.",
    reward: { text: "Reward:", highlight: "0.6%" },
    rewardSuffix: "of liquidated collateral value",
  },
  {
    cls: "k-b",
    badge: "b",
    label: "Keeper B",
    title: "Storefront Buyer",
    icon: "🔵",
    desc: "Buys liquidated assets with USDC via time-decay pricing. Earlier = bigger discount (up to 8%).",
    reward: { text: "Reward:", highlight: "up to 8%" },
    rewardSuffix: "discount on asset purchase",
  },
  {
    cls: "k-c",
    badge: "c",
    label: "Keeper C",
    title: "Distribute Keeper",
    icon: "🟣",
    desc: "Completes the sale and distributes proceeds: stakers 65.25%, team 24.75%, growth 10%.",
    reward: { text: "Reward:", highlight: "1.0 USDC" },
    rewardSuffix: "per distribution completed",
  },
];

// ─────────────────────────── TICKER DATA ───────────────────────────
export const TICKER_DATA = [
  { sym: "SOL", price: "182.40", change: "+3.2%" },
  { sym: "BTC", price: "84,210", change: "+1.8%", down: false },
  { sym: "ETH", price: "3,820", change: "-0.4%", down: true },
  { sym: "USDC", price: "1.00", change: "0.0%" },
  { sym: "GINVA APR", price: "8.00%", change: "Fixed" },
  { sym: "Total Locked", price: "$2.4M", change: "+12% 7d" },
  { sym: "Active Loans", price: "147", change: "+4" },
  { sym: "Pyth Oracle", price: "Live", change: "15s" },
];

// ─────────────────────────── LOANS DATA ───────────────────────────
export const LOANS = [
  {
    id: "LN-001",
    collateral: "2.5 SOL",
    value: "$456",
    borrowed: "$240",
    hf: 190,
    ltv: "40%",
    status: "active",
    maturity: "14d 6h",
  },
  {
    id: "LN-002",
    collateral: "0.012 BTC",
    value: "$1,010",
    borrowed: "$180",
    hf: 112,
    ltv: "18%",
    status: "active",
    maturity: "2d 3h",
  },
  {
    id: "LN-003",
    collateral: "0.15 ETH",
    value: "$573",
    borrowed: "$340",
    hf: 168,
    ltv: "59%",
    status: "active",
    maturity: "7d 12h",
  },
];

// ─────────────────────────── LIQUIDATIONS DATA ───────────────────────────
export const LIQUIDATIONS = [
  {
    id: "LQ-001",
    borrower: "7xK2...mR9P",
    asset: "3.1 SOL",
    value: "$564.2",
    hf: 97,
    discount: 8,
    elapsed: 4,
    status: "open",
  },
  {
    id: "LQ-002",
    borrower: "4hBw...nX3K",
    asset: "0.008 BTC",
    value: "$672.8",
    hf: 94,
    discount: 6,
    elapsed: 22,
    status: "open",
  },
  {
    id: "LQ-003",
    borrower: "9mQt...kJ5L",
    asset: "0.22 ETH",
    value: "$841.6",
    hf: 91,
    discount: 3,
    elapsed: 45,
    status: "pending_c",
  },
];

// ─────────────────────────── KEEPER EARNINGS DATA ───────────────────────────
export const KEEPER_EARNINGS = [
  {
    role: "A",
    date: "Today 14:32",
    asset: "2.8 SOL",
    reward: "+$3.38",
    tx: "5xkR...mL",
  },
  {
    role: "B",
    date: "Today 11:15",
    asset: "0.005 BTC",
    reward: "+$33.60",
    tx: "8hPq...nT",
  },
  {
    role: "C",
    date: "Yesterday",
    asset: "Distribution",
    reward: "+1.0 USDC",
    tx: "3vLm...kX",
  },
  {
    role: "A",
    date: "Yesterday",
    asset: "0.19 ETH",
    reward: "+$4.58",
    tx: "7wNs...jR",
  },
];

// ─────────────────────────── POOL DATA ───────────────────────────
export const POOL_DATA = {
  totalDeposited: "$2,412,840",
  myDeposit: "$12,500",
  myEarned: "$284.40",
  apy: "7.2",
  utilization: 68,
  depositAge: 22,
  shieldFee: false,
};

// ─────────────────────────── LANDING PAGE STATS ───────────────────────────
export const LANDING_STATS = [
  { label: "Fixed APR", value: "8%", sub: "Immutable · No hidden fees" },
  { label: "Total Locked", value: "$2.4M", sub: "+12% this week" },
  { label: "Active Loans", value: "147", sub: "Across 3 assets" },
  { label: "Grace Period", value: "72h", sub: "After maturity" },
  { label: "Max LTV", value: "60%", sub: "Conservative · Safe" },
];

// ─────────────────────────── FEATURES DATA ───────────────────────────
export const LANDING_FEATURES = [
  {
    icon: "🔒",
    name: "Fixed Rate Forever",
    desc: "8% APR hardcoded into the smart contract. No admin can change it. You'll know your cost from day one.",
  },
  {
    icon: "🛡️",
    name: "Dual Protection",
    desc: "72-hour grace period after maturity. Immediate liquidation only when Health Factor drops below 100%.",
  },
  {
    icon: "🌿",
    name: "Transparent by Design",
    desc: "All parameters are immutable and on-chain. Verify every number yourself through Solana Explorer.",
  },
  {
    icon: "⚡",
    name: "Instant Liquidity",
    desc: "Deposit collateral and receive USDC in the same transaction. No waiting, no manual approvals.",
  },
  {
    icon: "🤖",
    name: "AI Keeper Network",
    desc: "Three-role keeper system ensures liquidations run fairly. Powered by the AI Agent Keeper Program.",
  },
  {
    icon: "🔮",
    name: "Pyth Oracle",
    desc: "Real-time price feeds from Pyth Network with 15-second staleness threshold. Accurate and reliable.",
  },
];

// ─────────────────────────── HOW IT WORKS STEPS ───────────────────────────
export const LANDING_STEPS = [
  {
    icon: "📥",
    title: "Deposit Collateral",
    desc: "Deposit SOL, BTC, or ETH. Choose your LTV: Safe 20%, Standard 40%, or Max 60%.",
  },
  {
    icon: "💵",
    title: "Receive USDC",
    desc: "Get USDC instantly at your chosen LTV. Fixed 8% APR calculated by second — no surprises.",
  },
  {
    icon: "🔓",
    title: "Repay & Reclaim",
    desc: "Repay principal + interest anytime. No penalties. Your collateral is returned immediately.",
  },
];

// ─────────────────────────── BORROWER DASHBOARD METRICS ───────────────────────────
export const BORROWER_METRICS = [
  { label: "Total Borrowed", value: "$760", sub: "Across 3 loans" },
  { label: "Collateral Value", value: "$2,039", sub: "SOL + BTC + ETH" },
  { label: "Interest Accrued", value: "$12.48", sub: "8% APR · 14 days" },
  { label: "Next Maturity", value: "2d 3h", sub: "LN-002" },
];

// ─────────────────────────── COLLATERAL ASSETS ───────────────────────────
export const COLLATERAL_ASSETS = ["SOL", "BTC", "ETH"] as const;

// ─────────────────────────── LTV OPTIONS ───────────────────────────
export const LTV_OPTIONS = [
  ["20", "Safe"],
  ["40", "Standard"],
  ["60", "Max"],
] as const;

// ─────────────────────────── KEEPER ROLES ───────────────────────────
export const KEEPER_ROLES = [
  {
    id: "A",
    label: "Trigger Keeper",
    color: "var(--green)",
    desc: "Detect & trigger · 0.6% reward",
  },
  {
    id: "B",
    label: "Storefront Buyer",
    color: "#40c4ff",
    desc: "Buy liquidated assets · up to 8% discount",
  },
  {
    id: "C",
    label: "Distribute Keeper",
    color: "#ce93d8",
    desc: "Distribute proceeds · 1.0 USDC fixed",
  },
] as const;

// ─────────────────────────── SUPPORTER DATA ───────────────────────────
export const SUPPORTER_POOL_STATS = [
  {
    label: "Pool TVL",
    value: POOL_DATA.totalDeposited,
    sub: "Total Value Locked",
  },
  {
    label: "Pool APY",
    value: `${POOL_DATA.apy}%`,
    sub: "From 8% borrower APR",
  },
  {
    label: "Utilization",
    value: `${POOL_DATA.utilization}%`,
    sub: `${100 - POOL_DATA.utilization}% available`,
  },
  {
    label: "My Deposit",
    value: POOL_DATA.myDeposit,
    sub: `${POOL_DATA.depositAge} days deposited`,
  },
  { label: "My Earnings", value: POOL_DATA.myEarned, sub: "USDC earned total" },
];
