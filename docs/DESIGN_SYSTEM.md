# 🎨 GINVA Design System: "Trust Through Transparency"

> **"Distribute Revenue, Deliver Happiness, Provide Safety, Build Trust"**

---

## 1. Emotion and Tone (Brand Personality)

| Attribute       | Description                    | Usage in UI                            |
| :-------------- | :----------------------------- | :------------------------------------- |
| **Trustworthy** | Reliable, no deception         | Dark colors, clear fonts, good spacing |
| **Protective**  | Protecting users like a shield | Shield icons, gentle alerts            |
| **Transparent** | Open, no traps                 | Clear numbers, no hidden fees          |
| **Calm**        | Calm, not pressuring           | Cool tone colors reduce anxiety        |

---

## 🌈 Color Palette

### Primary Colors

```css
--ginva-navy: #0a1628; /* Primary - Trust */
--ginva-gold: #d4af37; /* Accent - Value & Prosperity */
--ginva-cyan: #00d4aa; /* Success - Protection */
```

### Secondary Colors

```css
--ginva-slate: #1e293b; /* Background secondary */
--ginva-silver: #94a3b8; /* Text secondary */
--ginva-red: #ef4444; /* Alert - use sparingly, gentle */
--ginva-amber: #f59e0b; /* Warning - 72hr countdown */
```

### Important Gradients

- **Protection Gradient:** `linear-gradient(135deg, #00D4AA 0%, #0A1628 100%)` — Used when showing protection
- **Gold Shine:** `linear-gradient(90deg, #D4AF37 0%, #F4E4BC 50%, #D4AF37 100%)` — For important CTAs

---

## 🔤 Typography

| Role         | Font           | Size    | Weight   |
| :----------- | :------------- | :------ | :------- |
| Display/Logo | Space Grotesk  | 48px+   | Bold     |
| Headings     | Inter          | 32px    | SemiBold |
| Body         | Inter          | 16px    | Regular  |
| Numbers/Data | JetBrains Mono | 14-24px | Medium   |

**Principle:** Numbers must be easy to read (use Mono) because it involves money!

---

## 🧩 Component Library

### 2.1 Navigation — "The Command Center"

```
┌─────────────────────────────────────────────────────────────┐
│  🏛️ GINVA        [Borrow] [Supporters] [Helpers] [Dashboard]  👤  │
│                                                             │
│  Selected tab has gold underline + small icon before         │
└─────────────────────────────────────────────────────────────┘
```

**Key Features:**

- Sticky header on mobile but hide when scrolling down, show when scrolling up
- Active state: gold underline + subtle glow
- Mobile: Hamburger menu as shield icon instead of 3 lines (branding!)

---

### 2.2 Hero Section — "Instant Trust"

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│     "Borrow instantly                                        │
│      without selling crypto"                                 │
│                                                             │
│     [🚀 Start Borrowing]  [💰 Become Supporter]            │
│                                                             │
│     ┌─────────────────────────────────────────┐              │
│     │  🛡️ 72-Hour Protection System         │              │
│     │  Your assets are always safe           │              │
│     └─────────────────────────────────────────┘              │
│                                                             │
│     [Live Stats: $2.4M TVL | 1,240 Active Loans | 0 Liquidated]
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**UX Psychology:**

- "0 Liquidations" creates instant trust
- Primary button: gold fill, secondary: outline
- No cluttered animations, focus on smooth fade-in

---

### 2.3 Borrow Flow — "The 4-Step Journey"

#### Step 1: Select Collateral (Deposit)

```
┌─────────────────────────────────────────────────────────────┐
│  Step 1 of 4: Select Collateral                             │
│                                                             │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐                      │
│  │   SOL   │  │   BTC   │  │   ETH   │                      │
│  │  ☑️     │  │   ○    │  │   ○    │                      │
│  │ $142.50 │  │ $67,240 │  │ $3,890 │                      │
│  └─────────┘  └─────────┘  └─────────┘                      │
│                                                             │
│  Amount: [████████████░░░░░░] 5.5 SOL                       │
│                                                             │
│  ┌─────────────────────────────────────────┐                  │
│  │  💡 You will receive: 330 USDC                            │
│  │     LTV: 42% (Safe Zone 🟢)                            │
│  │     Interest: 12% APR                                   │  │
│  └─────────────────────────────────────────┘                  │
│                                                             │
│           [Continue →]                                      │
└─────────────────────────────────────────────────────────────┘
```

**UX Details:**

- Visual LTV Gauge: Green/yellow/red based on risk
- Real-time calculation: Type and calculate instantly
- Card selection: Click entire card, not just radio button

---

#### Step 2: Confirm Terms (Transparency)

```
┌─────────────────────────────────────────────────────────────┐
│  Step 2 of 4: Review Your Protection                       │
│                                                             │
│  ┌─────────────────────────────────────────┐                  │
│  │  🛡️ Your 72-Hour Protection System     │                  │
│  │                                         │                  │
│  │  If SOL drops below $95.00:            │                  │
│  │  • Hours 0-72: You can add collateral  │                  │
│  │  • Hour 72+: System begins rescue       │                  │
│  │                                         │                  │
│  │  [View Timeline Visualization →]        │                  │
│  └─────────────────────────────────────────┘                  │
│                                                             │
│  ┌─────────────────────────────────────────┐                  │
│  │  📊 Loan Summary                       │                  │
│  │  Collateral: 5.5 SOL ($467.50)         │                  │
│  │  You receive: 330 USDC                 │                  │
│  │  Interest: 3.3 USDC/month             │                  │
│  │  Liquidation Price: $95.00/SOL         │                  │
│  └─────────────────────────────────────────┘                  │
│                                                             │
│  [← Back]        [Confirm and Borrow]                       │
└─────────────────────────────────────────────────────────────┘
```

**Important:** Must have Timeline Visualization showing the 72-hour period clearly!

---

#### Step 3: Wallet Connection

```
┌─────────────────────────────────────────────────────────────┐
│  Step 3 of 4: Connect Securely                             │
│                                                             │
│  [Phantom]  [Solflare]  [Backpack]  [Others...]              │
│                                                             │
│  🔒 GINVA cannot access your private keys                  │
│  🔒 All transactions require your approval                  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

#### Step 4: Success + Dashboard

```
┌─────────────────────────────────────────────────────────────┐
│  ✅ Success! 330 USDC sent to your wallet                  │
│                                                             │
│  [Go to Dashboard]  [Share on X]                          │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

### 2.4 Dashboard — "Your Financial Command Center"

```
┌─────────────────────────────────────────────────────────────┐
│  Welcome back, 0x7a2f...8e4d 👋                            │
│                                                             │
│  ┌─────────────────────┐  ┌─────────────────────────────┐   │
│  │  Active Loans       │  │  Account Health            │   │
│  │  ┌───────────────┐  │  │                             │   │
│  │  │ 5.5 SOL       │  │  │  [████████░░░░░░░░░░] 78%  │   │
│  │  │ Collateral    │  │  │  Safe Zone 🟢              │   │
│  │  │               │  │  │                             │   │
│  │  │ 330 USDC      │  │  │  Next interest:            │   │
│  │  │ Borrowed      │  │  │  In 2 days (Mar 15)       │   │
│  │  │               │  │  │  [Pay Now]                │   │
│  │  │ LTV: 42%     │  │  │                             │   │
│  │  │ [Manage →]   │  │  └─────────────────────────────┘   │
│  │  └───────────────┘  │                                    │
│  └─────────────────────┘                                    │
│                                                             │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │  ⚠️  Protection Alerts                                 │ │
│  │  No active alerts, your assets are safe 🛡️            │ │
│  │                                                         │ │
│  │  [If there were alerts:]                                │ │
│  │  🚨 SOL price dropping! 68 hours remaining             │ │
│  │  [Add Collateral] [Repay Partially] [Do Nothing]       │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Health Bar Logic:**

- 🟢 0-50% LTV: Safe (Green)
- 🟡 50-75% LTV: Caution (Yellow)
- 🟠 75-85% LTV: Warning (Orange)
- 🔴 85%+ LTV: Entering Protection (Red + countdown)

---

### 2.5 72-Hour Protection Interface (Most Important!)

This is GINVA's main selling point, must be designed perfectly:

```
┌─────────────────────────────────────────────────────────────┐
│  🛡️ Protection Mode Active                                 │
│                                                             │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │                                                         │ │
│  │    [=================>          ] 68:42:15 remaining  │ │
│  │         ████████░░░░░░░░░░░░░░░░                        │ │
│  │         Hour 4 of 72                                    │ │
│  │                                                         │ │
│  │    SOL Price: $89.50  |  Liquidation: $95.00          │ │
│  │    Gap: -$5.50 (-5.8%)                                │ │
│  │                                                         │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                             │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │  💡 Recommended Actions:                               │ │
│  │                                                         │ │
│  │  [1] Add 0.5 SOL collateral → Cancel protection       │ │
│  │  [2] Repay 50 USDC → LTV drops to 35%               │ │
│  │  [3] Do nothing → Enter rescue phase                  │ │
│  │                                                         │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                             │
│  [📞 Contact Support]  [📚 Learn More]                     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Visual Countdown:**

- First hour: Green (gentle)
- Hours 24-48: Yellow
- Hours 48-72: Orange
- Final hour: Slow blink light red (not alarming)

---

### 2.6 Supporter Dashboard

```
┌─────────────────────────────────────────────────────────────┐
│  💰 Supporter Center                                        │
│                                                             │
│  Your Stake: 5,000 USDC                                    │
│  Earned: 234.50 USDC (+12.4% APY)                         │
│  Auto-compound: ON 🔄                                      │
│                                                             │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │  Revenue Share (Last 30 Days)                          │ │
│  │                                                         │ │
│  │  Your Share (65.25%):     ████████████████████  $152.80 │
│  │  Operations (24.75%):     ████████              $58.00  │
│  │  Capital Pool (10%):     ███                   $23.70  │
│  │                                                         │ │
│  │  Total Protocol Revenue: $234.50                        │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                             │
│  [Add Stake] [Withdraw] [Claim Rewards]                    │
│                                                             │
│  ⚡ No lock-up period, withdraw anytime                    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

### 2.7 Helper Interface

```
┌─────────────────────────────────────────────────────────────┐
│  🤖 Helper Center                                           │
│                                                             │
│  Available Opportunities:                                    │
│                                                             │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │  🔍 Monitoring Role                                     │ │
│  │  3 loans need monitoring                               │ │
│  │  Reward: 0.6% of collateral value                     │ │
│  │  [View List]                                           │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                             │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │  🤝 Support Role                                       │ │
│  │  1 asset in Golden Window (8% discount!)               │ │
│  │  Asset: 10 SOL at $892.00 (Market: $970.00)          │ │
│  │  Time remaining: 04:32                                 │ │
│  │  [Act Now]                                             │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                             │
│  Your earnings today: 3.4 USDC                              │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 📱 Mobile-First Considerations

| Common DeFi Issue | GINVA's Solution                                     |
| :---------------- | :--------------------------------------------------- |
| Too many numbers  | Use Accordion to hide details, show only important   |
| Unclear gas fees  | Show "Total You'll Receive" with everything deducted |
| Fear of wrong tap | Swipe to Confirm for big transactions                |
| Don't know status | Progress Bar sticky at top always                    |

---

## 🎬 Micro-interactions (Creating Impressions)

| Action                      | Animation                  | Meaning                 |
| :-------------------------- | :------------------------- | :---------------------- |
| Press Borrow button         | Small shield orbits button | Protection begins       |
| Protection time running out | Borders flash light orange | Urgent but not alarming |
| Payment successful          | Numbers count up and fade  | Success                 |
| LTV changes                 | Gauge rotates smoothly     | Real-time feedback      |

---

## 🧪 A/B Testing Ideas

1. **"72-Hour" vs "3-Day"** — Which is easier to understand?
2. **Protection Timeline** — Linear vs circular, which is easier to use?
3. **CTA Color** — Gold vs green, which converts better?

---

## 🛠️ Recommended Technical Stack

```
Frontend:
├── Framework: Next.js 14 (App Router)
├── Styling: Tailwind CSS + Framer Motion (animation)
├── State: Zustand (simple)
├── Wallet: Solana Wallet Adapter
├── Charts: Recharts (for LTV history)
└── Icons: Lucide React (clean, modern)

Design Tool:
├── Figma (create component library)
└── Prototype: Test 72-hour countdown flow completely
```

---

> **"Distribute Revenue, Deliver Happiness, Provide Safety, Build Trust"**
>
> _GINVA Design System - Designed with transparency, built with trust_
