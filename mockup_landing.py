import matplotlib.pyplot as plt
import matplotlib.patches as patches
from matplotlib.patches import FancyBboxPatch, Rectangle, Circle
import numpy as np

fig, ax = plt.subplots(figsize=(16, 10))
ax.set_xlim(0, 16)
ax.set_ylim(0, 10)
ax.axis("off")

bg = Rectangle((0, 0), 16, 10, facecolor="#0A1628")
ax.add_patch(bg)

for i in range(0, 17, 1):
    ax.plot([i, i], [0, 10], color="white", alpha=0.02, linewidth=0.5)
for i in range(0, 11, 1):
    ax.plot([0, 16], [i, i], color="white", alpha=0.02, linewidth=0.5)

nav_bg = Rectangle((0, 9), 16, 1, facecolor="#0A1628", edgecolor="#1E293B")
ax.add_patch(nav_bg)

ax.text(0.8, 9.5, "G", fontsize=24, weight="bold", color="#D4AF37")
ax.text(1.4, 9.5, "INVA", fontsize=18, weight="bold", color="white")

nav_items = [("Borrow", True), ("Market", False), ("Docs", False), ("About", False)]
for i, (item, active) in enumerate(nav_items):
    color = "#D4AF37" if active else "#94A3B8"
    ax.text(
        5 + i * 1.5,
        9.5,
        item,
        fontsize=12,
        color=color,
        weight="bold" if active else "normal",
    )

connect_btn = FancyBboxPatch(
    (12.5, 9.25),
    2.5,
    0.6,
    boxstyle="round,pad=0.05",
    facecolor="#D4AF37",
    edgecolor="none",
)
ax.add_patch(connect_btn)
ax.text(
    13.75,
    9.55,
    "Connect Wallet",
    fontsize=11,
    weight="bold",
    ha="center",
    va="center",
    color="#0A1628",
)

ax.text(
    8, 8.0, "Get Instant Cash.", fontsize=36, weight="bold", ha="center", color="white"
)
ax.text(
    8,
    7.3,
    "Keep Your Crypto Safe.",
    fontsize=36,
    weight="bold",
    ha="center",
    color="white",
)
ax.text(
    8, 7.65, "━━━━━━━━━━━━━━━━━━", fontsize=20, ha="center", color="#D4AF37", alpha=0.3
)

ax.text(
    8,
    6.4,
    "The fairest lending platform on Solana.",
    fontsize=14,
    ha="center",
    color="#94A3B8",
)
ax.text(
    8,
    5.9,
    "72-hour protection guarantee. No instant liquidations.",
    fontsize=14,
    ha="center",
    color="#00D4AA",
    weight="bold",
)

cta1 = FancyBboxPatch(
    (5.5, 4.8),
    2.5,
    0.8,
    boxstyle="round,pad=0.05",
    facecolor="#D4AF37",
    edgecolor="none",
)
ax.add_patch(cta1)
ax.text(
    6.75,
    5.25,
    "Start Borrowing",
    fontsize=13,
    weight="bold",
    ha="center",
    va="center",
    color="#0A1628",
)

cta2 = FancyBboxPatch(
    (8.5, 4.8),
    2.5,
    0.8,
    boxstyle="round,pad=0.05",
    facecolor="none",
    edgecolor="white",
    linewidth=2,
)
ax.add_patch(cta2)
ax.text(
    9.75,
    5.25,
    "Learn More",
    fontsize=13,
    weight="bold",
    ha="center",
    va="center",
    color="white",
)

badge = FancyBboxPatch(
    (5.5, 3.5),
    5,
    0.9,
    boxstyle="round,pad=0.05",
    facecolor="#00D4AA",
    alpha=0.15,
    edgecolor="#00D4AA",
    linewidth=2,
)
ax.add_patch(badge)
ax.text(
    8,
    4.05,
    "72-Hour Protection Guarantee",
    fontsize=13,
    weight="bold",
    ha="center",
    va="center",
    color="#00D4AA",
)

stats_bg = Rectangle(
    (1, 2.3), 14, 1, facecolor="#1E293B", alpha=0.5, edgecolor="#334155", linewidth=1
)
ax.add_patch(stats_bg)

stats = [
    ("$48.2M", "Total Value Locked", "#D4AF37"),
    ("1,847", "Active Loans", "#00D4AA"),
    ("0", "Force Liquidations", "#10B981"),
    ("12%", "Avg APY", "white"),
]

for i, (value, label, color) in enumerate(stats):
    x = 2.5 + i * 3.2
    ax.text(x, 3.0, value, fontsize=22, weight="bold", ha="center", color=color)
    ax.text(x, 2.55, label, fontsize=10, ha="center", color="#94A3B8")

features = [
    ("No Instant Liquidations", "72 hours to protect your assets"),
    ("Keep Your Crypto", "Benefit from price increases"),
    ("Instant Borrowing", "Get cash in seconds"),
]

for i, (title, desc) in enumerate(features):
    x = 2.5 + i * 4.5
    ax.text(x, 1.5, title, fontsize=11, weight="bold", ha="center", color="white")
    ax.text(x, 1.1, desc, fontsize=9, ha="center", color="#64748B")

plt.tight_layout()
plt.savefig(
    "ginva_mockup_landing.png",
    dpi=150,
    bbox_inches="tight",
    facecolor="#0A1628",
    edgecolor="none",
)
plt.close()
print("Mockup: Landing Page (Dark Theme) created!")
