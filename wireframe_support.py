import matplotlib.pyplot as plt
import matplotlib.patches as patches
from matplotlib.patches import FancyBboxPatch, Rectangle, Circle
import numpy as np

fig, ax = plt.subplots(figsize=(14, 10))
ax.set_xlim(0, 14)
ax.set_ylim(0, 10)
ax.axis("off")

# Title
ax.text(
    7,
    9.5,
    "HELP & SUPPORT WIREFRAME",
    fontsize=18,
    weight="bold",
    ha="center",
    color="#0A1628",
)
ax.text(7, 9.1, "User assistance and FAQ", fontsize=10, ha="center", color="#64748B")

# ========== SIDEBAR ==========
sidebar = Rectangle((0, 0), 2.2, 10, facecolor="#0A1628", edgecolor="none")
ax.add_patch(sidebar)

ax.text(0.8, 9.3, "G", fontsize=18, weight="bold", color="#D4AF37")
ax.text(1.3, 9.3, "INVA", fontsize=14, weight="bold", color="white")

menu_items = [
    ("Dashboard", False),
    ("My Loans", False),
    ("Market", False),
    ("Support", True),
    ("Settings", False),
]

for i, (item, active) in enumerate(menu_items):
    y = 8.0 - i * 0.9
    color = "#D4AF37" if active else "#64748B"
    bg_color = "#1E293B" if active else "none"

    if active:
        bg = Rectangle((0, y - 0.2), 2.2, 0.5, facecolor=bg_color)
        ax.add_patch(bg)

    ax.text(
        0.4, y, item, fontsize=10, color=color, weight="bold" if active else "normal"
    )

# ========== MAIN CONTENT ==========

# Search bar
search_bg = FancyBboxPatch(
    (2.8, 8.2),
    8.5,
    0.6,
    boxstyle="round,pad=0.05",
    facecolor="white",
    edgecolor="#CBD5E1",
    linewidth=1,
)
ax.add_patch(search_bg)
ax.text(3.1, 8.4, "Search for help...", fontsize=10, color="#94A3B8")
ax.text(10.5, 8.4, "Q", fontsize=10, weight="bold", ha="right", color="#64748B")

# Quick Help Cards
ax.text(2.8, 7.6, "Quick Help", fontsize=12, weight="bold", color="#0A1628")

quick_help = [
    ("How 72hr Protection Works", "#00D4AA", "Learn about our safety feature"),
    ("How to Borrow", "#D4AF37", "Step-by-step guide"),
    ("What is LTV?", "#0A1628", "Understanding collateral ratio"),
    ("Emergency Support", "#EF4444", "Contact team directly"),
]

for i, (title, color, desc) in enumerate(quick_help):
    x = 2.8 + (i % 2) * 5.7
    y = 6.8 - (i // 2) * 1.1

    card = FancyBboxPatch(
        (x, y - 0.3),
        5.2,
        0.9,
        boxstyle="round,pad=0.05",
        facecolor="white",
        edgecolor=color,
        linewidth=1,
    )
    ax.add_patch(card)

    ax.text(x + 0.3, y + 0.25, title, fontsize=10, weight="bold", color="#0A1628")
    ax.text(x + 0.3, y - 0.15, desc, fontsize=8, color="#64748B")
    ax.text(x + 4.5, y + 0.25, ">", fontsize=12, ha="right", color=color, weight="bold")

# FAQ Section
ax.text(
    2.8, 5.2, "Frequently Asked Questions", fontsize=12, weight="bold", color="#0A1628"
)

faqs = [
    (
        "What happens if my loan enters protection mode?",
        "You will have 72 hours to add collateral or repay. No instant liquidation...",
    ),
    (
        "Can I withdraw my collateral anytime?",
        "Yes, as long as your LTV remains below the threshold after withdrawal.",
    ),
    (
        "How is the liquidation price calculated?",
        "Based on your collateral amount and the maximum LTV of 60%.",
    ),
]

for i, (question, answer) in enumerate(faqs):
    y = 4.5 - i * 1.0

    # FAQ item
    item = FancyBboxPatch(
        (2.8, y - 0.3),
        8.5,
        0.8,
        boxstyle="round,pad=0.05",
        facecolor="white",
        edgecolor="#E2E8F0",
        linewidth=1,
    )
    ax.add_patch(item)

    # Question with expand icon
    ax.text(3.0, y + 0.15, question, fontsize=9, weight="bold", color="#0A1628")
    ax.text(
        10.5, y + 0.15, "+", fontsize=14, ha="right", color="#64748B", weight="bold"
    )

# Contact Support
ax.text(2.8, 1.2, "Still need help?", fontsize=11, weight="bold", color="#0A1628")

contact_btn = FancyBboxPatch(
    (2.8, 0.5),
    3.5,
    0.5,
    boxstyle="round,pad=0.05",
    facecolor="#0A1628",
    edgecolor="none",
)
ax.add_patch(contact_btn)
ax.text(
    4.55,
    0.75,
    "Contact Support",
    fontsize=10,
    weight="bold",
    ha="center",
    va="center",
    color="white",
)

discord_btn = FancyBboxPatch(
    (6.5, 0.5),
    3.5,
    0.5,
    boxstyle="round,pad=0.05",
    facecolor="#5865F2",
    edgecolor="none",
)
ax.add_patch(discord_btn)
ax.text(
    8.25,
    0.75,
    "Join Discord",
    fontsize=10,
    weight="bold",
    ha="center",
    va="center",
    color="white",
)

plt.tight_layout()
plt.savefig(
    "ginva_wireframe_support.png",
    dpi=150,
    bbox_inches="tight",
    facecolor="white",
    edgecolor="none",
)
plt.close()
print("✅ Wireframe: Support สร้างเสร็จแล้ว!")
