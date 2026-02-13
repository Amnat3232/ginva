import matplotlib.pyplot as plt
import matplotlib.patches as patches
from matplotlib.patches import FancyBboxPatch, Rectangle, Circle
import numpy as np

fig, ax = plt.subplots(figsize=(12, 16))
ax.set_xlim(0, 12)
ax.set_ylim(0, 16)
ax.axis("off")

# Background
bg = Rectangle((0, 0), 12, 16, facecolor="#FAFBFC")
ax.add_patch(bg)

# ========== NAVIGATION BAR ==========
nav_bg = Rectangle((0, 15), 12, 1, facecolor="white", edgecolor="#E2E8F0", linewidth=1)
ax.add_patch(nav_bg)

# Logo
ax.text(0.8, 15.5, "G", fontsize=20, weight="bold", color="#D4AF37")
ax.text(1.3, 15.5, "INVA", fontsize=16, weight="bold", color="#0A1628")

# Nav items
nav_items = ["Borrow", "Support", "Help", "Dashboard"]
for i, item in enumerate(nav_items):
    ax.text(5 + i * 1.5, 15.5, item, fontsize=10, color="#64748B")

# Wallet button
wallet_btn = FancyBboxPatch(
    (9.5, 15.2), 2, 0.6, boxstyle="round,pad=0.1", facecolor="#0A1628", edgecolor="none"
)
ax.add_patch(wallet_btn)
ax.text(
    10.5,
    15.5,
    "Connect Wallet",
    fontsize=9,
    weight="bold",
    ha="center",
    va="center",
    color="white",
)

# ========== HERO SECTION ==========
# Main headline
ax.text(
    6,
    13.5,
    "Get Instant Cash.",
    fontsize=28,
    weight="bold",
    ha="center",
    color="#0A1628",
)
ax.text(
    6,
    12.8,
    "Keep Your Crypto Safe.",
    fontsize=28,
    weight="bold",
    ha="center",
    color="#0A1628",
)

# Subheadline
ax.text(
    6,
    12.0,
    "The fairest lending platform on Solana.",
    fontsize=12,
    ha="center",
    color="#64748B",
)
ax.text(
    6,
    11.6,
    "72-hour protection. No instant liquidations.",
    fontsize=12,
    ha="center",
    color="#64748B",
)

# CTA Buttons
cta1 = FancyBboxPatch(
    (3.5, 10.5),
    2.2,
    0.7,
    boxstyle="round,pad=0.1",
    facecolor="#D4AF37",
    edgecolor="none",
)
ax.add_patch(cta1)
ax.text(
    4.6,
    10.85,
    "Start Borrowing",
    fontsize=11,
    weight="bold",
    ha="center",
    va="center",
    color="white",
)

cta2 = FancyBboxPatch(
    (6.3, 10.5),
    2.2,
    0.7,
    boxstyle="round,pad=0.1",
    facecolor="white",
    edgecolor="#0A1628",
    linewidth=1.5,
)
ax.add_patch(cta2)
ax.text(
    7.4,
    10.85,
    "Become Supporter",
    fontsize=11,
    weight="bold",
    ha="center",
    va="center",
    color="#0A1628",
)

# Protection Badge
badge = FancyBboxPatch(
    (3.5, 9.3),
    5,
    0.8,
    boxstyle="round,pad=0.1",
    facecolor="#F0FDF4",
    edgecolor="#00D4AA",
    linewidth=2,
)
ax.add_patch(badge)
ax.text(
    6,
    9.85,
    "72-Hour Protection Guarantee",
    fontsize=11,
    weight="bold",
    ha="center",
    va="center",
    color="#065F46",
)
ax.text(
    6,
    9.5,
    "Your assets are safe, always.",
    fontsize=9,
    ha="center",
    va="center",
    color="#059669",
)

# ========== LIVE STATS ==========
stats_bg = Rectangle(
    (1, 7.8),
    10,
    1.2,
    facecolor="white",
    edgecolor="#E2E8F0",
    linewidth=1,
    joinstyle="round",
)
ax.add_patch(stats_bg)

stats = [
    ("$2.4M", "Total Value Locked"),
    ("1,240", "Active Loans"),
    ("0", "Force Liquidations"),
    ("12%", "Avg APY"),
]

for i, (value, label) in enumerate(stats):
    x = 2 + i * 2.5
    ax.text(x, 8.6, value, fontsize=16, weight="bold", ha="center", color="#0A1628")
    ax.text(x, 8.2, label, fontsize=9, ha="center", color="#64748B")
    if i < 3:
        ax.plot([x + 1.2, x + 1.2], [8.0, 8.8], color="#E2E8F0", linewidth=1)

# ========== HOW IT WORKS ==========
ax.text(
    6, 6.8, "How GINVA Works", fontsize=18, weight="bold", ha="center", color="#0A1628"
)

steps = [
    ("1", "Deposit Collateral", "SOL, BTC, ETH"),
    ("2", "Borrow Instantly", "Up to 60% LTV"),
    ("3", "Stay Protected", "72hr safety net"),
    ("4", "Repay Anytime", "No penalties"),
]

for i, (num, title, desc) in enumerate(steps):
    x = 1.5 + i * 2.8

    # Step number circle
    circle = Circle((x, 5.8), 0.25, facecolor="#0A1628", edgecolor="none")
    ax.add_patch(circle)
    ax.text(
        x, 5.8, num, fontsize=10, weight="bold", ha="center", va="center", color="white"
    )

    # Title
    ax.text(x, 5.2, title, fontsize=10, weight="bold", ha="center", color="#0A1628")
    ax.text(x, 4.9, desc, fontsize=8, ha="center", color="#64748B")

    # Arrow (except last)
    if i < 3:
        ax.annotate(
            "",
            xy=(x + 1.8, 5.8),
            xytext=(x + 0.4, 5.8),
            arrowprops=dict(arrowstyle="->", color="#D4AF37", lw=2),
        )

# ========== TRUST INDICATORS ==========
trust_bg = Rectangle((0, 2.5), 12, 2, facecolor="#F8FAFC", edgecolor="none")
ax.add_patch(trust_bg)

ax.text(
    6,
    4.2,
    "Why Borrowers Trust GINVA",
    fontsize=16,
    weight="bold",
    ha="center",
    color="#0A1628",
)

trust_points = [
    ("No Hidden Liquidations", "72 hours to protect your assets"),
    ("Transparent Pricing", "See exactly what you'll pay"),
    ("Keep Your Crypto", "Benefit when prices go up"),
]

for i, (title, desc) in enumerate(trust_points):
    x = 2 + i * 3.5

    # Icon placeholder
    icon_bg = Circle(
        (x, 3.5), 0.3, facecolor="#00D4AA", alpha=0.2, edgecolor="#00D4AA", linewidth=2
    )
    ax.add_patch(icon_bg)
    ax.text(
        x,
        3.5,
        "✓",
        fontsize=14,
        weight="bold",
        ha="center",
        va="center",
        color="#00D4AA",
    )

    ax.text(x, 2.9, title, fontsize=10, weight="bold", ha="center", color="#0A1628")
    ax.text(x, 2.6, desc, fontsize=8, ha="center", color="#64748B")

# ========== FOOTER ==========
ax.text(
    6, 1.2, "GINVA Protocol | Built on Solana", fontsize=9, ha="center", color="#94A3B8"
)
ax.text(
    6, 0.8, "Documentation | Security | Terms", fontsize=9, ha="center", color="#94A3B8"
)

plt.tight_layout()
plt.savefig(
    "ginva_wireframe_landing.png",
    dpi=150,
    bbox_inches="tight",
    facecolor="#FAFBFC",
    edgecolor="none",
)
plt.close()
print("✅ Wireframe: Landing Page สร้างเสร็จแล้ว!")
