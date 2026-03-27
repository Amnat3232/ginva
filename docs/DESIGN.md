# GINVA Design System

## Overview

GINVA is a cryptocurrency-backed lending protocol on Solana with a sophisticated, futuristic dark theme. The design combines glassmorphism effects, neon accents, and smooth animations to create a premium DeFi experience.

## Brand Identity

### Mission

Revolutionize DeFi lending by combining AI-powered keepers with collateral-backed stability.

### Visual Language

- **Theme**: Dark, futuristic, premium
- **Mood**: Trustworthy, innovative, cutting-edge
- **Inspiration**: Cyberpunk meets traditional finance

---

## Color Palette

### Primary Colors

| Token                   | Hex       | Usage                                |
| ----------------------- | --------- | ------------------------------------ |
| `--color-primary`       | `#f59e0b` | Gold/Amber - CTAs, accents, branding |
| `--color-primary-hover` | `#d97706` | Button hovers, active states         |
| `--color-primary-light` | `#fbbf24` | Highlights, glows                    |
| `--color-primary-dark`  | `#b45309` | Deep accents                         |

### Secondary Colors

| Token               | Hex       | Usage                              |
| ------------------- | --------- | ---------------------------------- |
| `--color-secondary` | `#eab308` | Secondary accents                  |
| `--color-success`   | `#10b981` | Emerald - Positive states, success |
| `--color-danger`    | `#ef4444` | Red - Errors, warnings             |
| `--color-warning`   | `#f59e0b` | Warnings                           |

### Background Colors

| Token                   | Hex                      | Usage                 |
| ----------------------- | ------------------------ | --------------------- |
| `--color-bg-dark`       | `#0a0a0f`                | Main background       |
| `--color-bg-card`       | `rgba(255,255,255,0.05)` | Glass card background |
| `--color-bg-card-hover` | `rgba(255,255,255,0.08)` | Card hover state      |

### Text Colors

| Token                    | Hex                     | Usage                  |
| ------------------------ | ----------------------- | ---------------------- |
| `--color-text-primary`   | `#ffffff`               | Headings, primary text |
| `--color-text-secondary` | `rgba(255,255,255,0.7)` | Body text              |
| `--color-text-muted`     | `rgba(255,255,255,0.5)` | Captions, labels       |

### Border Colors

| Token                  | Hex                     | Usage           |
| ---------------------- | ----------------------- | --------------- |
| `--color-border`       | `rgba(255,255,255,0.1)` | Default borders |
| `--color-border-hover` | `rgba(255,255,255,0.2)` | Hover borders   |

---

## Typography

### Font Stack

```css
--font-display: "Orbitron", sans-serif; /* Headings, branding */
--font-body: "Inter", sans-serif; /* Body text */
--font-accent: "Rajdhani", sans-serif; /* Buttons, labels */
```

### Font Sizes

| Token         | Size | Usage            |
| ------------- | ---- | ---------------- |
| `--text-xs`   | 12px | Captions, badges |
| `--text-sm`   | 14px | Secondary text   |
| `--text-base` | 16px | Body text        |
| `--text-lg`   | 18px | Subheadings      |
| `--text-xl`   | 20px | Section titles   |
| `--text-2xl`  | 24px | Page titles      |
| `--text-3xl`  | 30px | Hero headings    |
| `--text-4xl`  | 36px | Hero subheadings |
| `--text-5xl`  | 48px | Landing hero     |

### Font Weights

| Weight   | Value | Usage             |
| -------- | ----- | ----------------- |
| Light    | 300   | Decorative        |
| Regular  | 400   | Body text         |
| Medium   | 500   | Labels            |
| Semibold | 600   | Buttons, emphasis |
| Bold     | 700   | Headings          |

---

## Spacing System

```css
--spacing-xs: 0.25rem; /* 4px */
--spacing-sm: 0.5rem; /* 8px */
--spacing-md: 1rem; /* 16px */
--spacing-lg: 1.5rem; /* 24px */
--spacing-xl: 2rem; /* 32px */
--spacing-2xl: 3rem; /* 48px */
--spacing-3xl: 4rem; /* 64px */
```

---

## Component Specifications

### 1. Glass Card

```css
.glass-card {
  background: var(--color-bg-card);
  backdrop-filter: blur(20px);
  border-radius: var(--radius-lg);
  border: 1px solid var(--color-border);
  box-shadow: var(--shadow-lg);
}

.glass-card:hover {
  border-color: var(--color-border-hover);
  box-shadow: var(--shadow-lg), 0 0 20px rgba(245, 158, 11, 0.1);
}
```

**Dimensions:**

- Border radius: 20px (--radius-lg)
- Padding: 20px (default)
- Border: 1px solid rgba(255,255,255,0.1)

### 2. Primary Button

```css
.btn-primary {
  background: linear-gradient(
    135deg,
    var(--color-primary) 0%,
    var(--color-primary-dark) 100%
  );
  color: white;
  border: none;
  border-radius: var(--radius-md);
  padding: 14px 32px;
  font-weight: 600;
  font-size: 15px;
  text-transform: uppercase;
  letter-spacing: 1px;
  box-shadow: var(--shadow-glow-gold), inset 0 1px 0 rgba(255, 255, 255, 0.2);
}
```

**States:**

- Default: Gold gradient with glow
- Hover: Elevated with enhanced glow, translateY(-2px)
- Active: Pressed state
- Disabled: Reduced opacity

### 3. Outline Button

```css
.btn-outline {
  background: transparent;
  color: var(--color-primary);
  border: 2px solid var(--color-primary);
  border-radius: var(--radius-md);
  padding: 12px 30px;
  font-weight: 600;
}
```

### 4. Navbar

**Style:** Glassmorphism with blur

- Background: rgba(10, 10, 15, 0.8) to rgba(10, 10, 15, 0.95) on scroll
- Backdrop filter: blur(20px)
- Border bottom: 1px solid rgba(245, 158, 11, 0.2)
- Height: Auto (shrinks on scroll)

**Nav Items:**

- Font: Rajdhani (--font-accent)
- Weight: 500
- Color: rgba(255, 255, 255, 0.7)
- Hover: Gold accent color with background highlight

**Special Nav Links:**

- Keeper: Gold (#f59e0b)
- Agent: Purple (#a855f7)
- Admin: Red (#ef4444)

### 5. Wallet Button

**Connected State:**

- Background: rgba(245, 158, 11, 0.15)
- Border: 1px solid rgba(245, 158, 11, 0.3)
- Text: Public key truncated (first 4...last 4 chars)
- Disconnect: Red theme

**Disconnected State:**

- Background: Gold gradient
- Box shadow: Gold glow
- Text: "CONNECT WALLET"

---

## Animations

### Keyframes

```css
/* Floating element */
@keyframes float {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
}

/* Pulsing glow */
@keyframes pulse-glow {
  0%,
  100% {
    opacity: 0.5;
    transform: scale(1);
  }
  50% {
    opacity: 0.8;
    transform: scale(1.1);
  }
}

/* Shimmer effect */
@keyframes shimmer {
  0% {
    left: -100%;
  }
  100% {
    left: 100%;
  }
}

/* Gradient shift */
@keyframes gradient-shift {
  0% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0% 50%;
  }
}
```

### Animation Classes

| Class            | Effect                          |
| ---------------- | ------------------------------- |
| `.animate-float` | Continuous floating motion (3s) |
| `.animate-glow`  | Pulsing glow (4s)               |
| `.shimmer`       | Loading shimmer effect          |
| `.gradient-text` | Animated gradient text          |

### GSAP Animations (Hero)

```javascript
// Title animation
tl.from(".hero-title", {
  y: 100,
  opacity: 0,
  duration: 1,
  delay: 0.2,
});

// Subtitle animation
tl.from(
  ".hero-subtitle",
  {
    y: 30,
    opacity: 0,
    duration: 0.8,
  },
  "-=0.5"
);

// Buttons animation
tl.from(
  ".hero-buttons",
  {
    y: 20,
    opacity: 0,
    duration: 0.6,
  },
  "-=0.4"
);

// Stats animation
tl.from(
  ".hero-stats",
  {
    y: 30,
    opacity: 0,
    duration: 0.8,
  },
  "-=0.3"
);
```

---

## Layout Patterns

### Responsive Breakpoints

```css
--breakpoint-sm: 640px;
--breakpoint-md: 768px;
--breakpoint-lg: 1024px;
--breakpoint-xl: 1280px;
--breakpoint-2xl: 1536px;
```

### Container

- Max width: 1320px (Bootstrap fluid)
- Padding: 16px (mobile), 24px (desktop)

### Grid

- Bootstrap 5 column system
- Gap: 16px (default), 24px (lg)
- Card grid: auto-fit with minmax(300px, 1fr)

### Section Padding

- Mobile: 60px vertical
- Desktop: 80px+ vertical

---

## Page-Specific Patterns

### Landing Page (Hero Section)

1. Full viewport height (minHeight: 100vh)
2. Particle background effect
3. Radial gradient glow (top-right)
4. Centered content with max-width: 900px
5. Stats grid: 3 columns on desktop, 1 on mobile

### Dashboard Page

1. Header: Page title + wallet address
2. Portfolio card: Total balance with action buttons
3. Stats grid: 4 columns (xs: 2, lg: 4)
4. Footer: Version info + refresh button

### Navigation Structure

```
Dashboard (/)
├── Landing Page (/)
├── Earn (/earn)
├── Borrow (/pawn)
├── Redeem (/redeem)
├── Tickets (/my-tickets)
├── Store (/storefront)
├── Keeper (/keeper)
├── Agent (/agent)
└── Admin (/admin)
```

---

## Visual Effects

### Glow Effects

```css
/* Gold glow */
--shadow-glow-gold: 0 0 30px rgba(245, 158, 11, 0.4);

/* Yellow glow */
--shadow-glow-yellow: 0 0 30px rgba(251, 191, 36, 0.4);
```

### Gradient Backgrounds

```css
/* Hero background */
background: linear-gradient(180deg, #0a0a0f 0%, #0f172a 100%);

/* Gold text gradient */
background: linear-gradient(135deg, #ffffff 0%, #f59e0b 50%, #eab308 100%);
-webkit-background-clip: text;
-webkit-text-fill-color: transparent;
```

### Hover Transitions

- Duration: var(--transition-normal) = 0.3s
- Transform: translateY(-2px)
- Box shadow: Enhanced glow

---

## Accessibility

### Focus States

```css
input:focus,
textarea:focus,
select:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(6, 182, 212, 0.1);
}
```

### Color Contrast

- Primary text: #ffffff (passes AAA)
- Secondary text: rgba(255,255,255,0.7) (passes AA)
- Muted text: rgba(255,255,255,0.5) (passes AA for large text)

### Scrollbar Styling

- Width: 8px
- Track: var(--color-bg-dark)
- Thumb: var(--color-primary)
- Hover: var(--color-primary-light)

---

## Icons

### Library

- React Icons (FiZap, FiShield, FiUser, etc.)

### Usage in Nav

| Icon     | Location    |
| -------- | ----------- |
| FiZap    | Keeper page |
| FiUser   | Agent page  |
| FiShield | Admin page  |

---

## Implementation Guidelines

### 1. Use CSS Variables

Always reference CSS variables instead of hardcoded values:

```css
/* ❌ Bad */
color: #f59e0b;

/* ✅ Good */
color: var(--color-primary);
```

### 2. Consistent Border Radius

Use defined radius tokens:

```css
/* ❌ Bad */
border-radius: 15px;

/* ✅ Good */
border-radius: var(--radius-lg);
```

### 3. Glass Card Usage

```tsx
import { GlassCard } from "../components/ui/GlassCard";

<GlassCard>Content here</GlassCard>;
```

### 4. Button Usage

```tsx
import Button from "../components/Button";

// Primary action
<Button>Action</Button>

// Secondary action
<Button variant="outline">Action</Button>
```

### 5. Animations

For complex animations, use GSAP:

```tsx
import gsap from "gsap";

useEffect(() => {
  gsap.from(".element", {
    opacity: 0,
    y: 20,
    duration: 0.8,
  });
}, []);
```

---

## File Structure

```
app/src/
├── components/
│   ├── ui/
│   │   ├── GlassCard.tsx
│   │   ├── Loading.tsx
│   │   ├── Notification.tsx
│   │   └── ErrorBoundary.tsx
│   ├── Button.tsx
│   ├── Navbar.tsx
│   ├── ParticleBackground.tsx
│   └── AnimatedCounter.tsx
├── pages/
│   ├── Dashboard.tsx
│   ├── Earn.tsx
│   ├── Pawn.tsx
│   ├── Keeper.tsx
│   ├── Agent.tsx
│   └── ...
├── sections/
│   ├── Hero.tsx
│   ├── Features.tsx
│   ├── Borrow.tsx
│   └── ...
├── styles/
│   ├── theme.css        # Design tokens
│   ├── globals.css      # Base styles
│   └── custom.css       # Page-specific
└── context/
    └── WalletContext.tsx
```

---

## Design Assets

### Logo

- Location: `/app/public/images/logos/ginva-logo-v3.jpg`
- Height: 28px (navbar)

### Images

- Wireframes: `/docs/images/`
- Logos: `/app/public/images/logos/`

---

## Version

- Version: 2.0.0
- Last Updated: 2026-03-12
- Maintainer: GINVA Team
