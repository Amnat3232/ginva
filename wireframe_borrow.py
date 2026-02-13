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

# ========== NAVIGATION (Simplified) ==========
nav_bg = Rectangle((0, 15), 12, 1, facecolor="white", edgecolor="#E2E8F0", linewidth=1)
ax.add_patch(nav_bg)
ax.text(0.8, 15.5, "G", fontsize=20, weight="bold", color="#D4AF37")
ax.text(1.3, 15.5, "INVA", fontsize=16, weight="bold", color="#0A1628")
ax.text(10.5, 15.5, "0x7a2f...8e4d", fontsize=10, ha="center", color="#64748B")

# ========== PROGRESS BAR ==========
ax.text(
    6,
    14.3,
    "Step 1 of 3: Select Collateral",
    fontsize=14,
    weight="bold",
    ha="center",
    color="#0A1628",
)

# Progress steps
for i in range(3):
    x = 4 + i * 2
    if i == 0:
        circle = Circle((x, 13.6), 0.2, facecolor="#0A1628", edgecolor="none")
        ax.add_patch(circle)
        ax.text(
            x,
            13.6,
            str(i + 1),
            fontsize=9,
            weight="bold",
            ha="center",
            va="center",
            color="white",
        )
    else:
        circle = Circle(
            (x, 13.6), 0.2, facecolor="white", edgecolor="#CBD5E1", linewidth=2
        )
        ax.add_patch(circle)
        ax.text(
            x, 13.6, str(i + 1), fontsize=9, ha="center", va="center", color="#94A3B8"
        )

    if i < 2:
        ax.plot([x + 0.2, x + 1.8], [13.6, 13.6], color="#CBD5E1", linewidth=2)

# Labels
ax.text(4, 13.2, "Collateral", fontsize=8, ha="center", color="#0A1628")
ax.text(6, 13.2, "Review", fontsize=8, ha="center", color="#94A3B8")
ax.text(8, 13.2, "Confirm", fontsize=8, ha="center", color="#94A3B8")

# ========== MAIN CONTENT AREA ==========
content_bg = Rectangle(
    (1, 2), 10, 10.5, facecolor="white", edgecolor="#E2E8F0", linewidth=1
)
ax.add_patch(content_bg)

ax.text(2, 11.8, "Choose Your Collateral", fontsize=16, weight="bold", color="#0A1628")
ax.text(
    2,
    11.4,
    "Select an asset to use as collateral for your loan",
    fontsize=10,
    color="#64748B",
)

# Asset Cards
assets = [
    ("SOL", "$142.50", "+2.4%", True),
    ("BTC", "$67,240", "-0.8%", False),
    ("ETH", "$3,890", "+1.2%", False),
]

for i, (symbol, price, change, selected) in enumerate(assets):
    x = 2 + i * 2.8
    y = 9.5

    # Card background
    if selected:
        card = FancyBboxPatch(
            (x - 1, y - 0.8),
            2.4,
            1.6,
            boxstyle="round,pad=0.1",
            facecolor="#F0FDF4",
            edgecolor="#00D4AA",
            linewidth=2,
        )
        ax.add_patch(card)
        # Checkmark
        check = Circle((x + 0.8, y + 0.5), 0.15, facecolor="#00D4AA", edgecolor="none")
        ax.add_patch(check)
        ax.text(
            x + 0.8,
            y + 0.5,
            "✓",
            fontsize=8,
            weight="bold",
            ha="center",
            va="center",
            color="white",
        )
    else:
        card = FancyBboxPatch(
            (x - 1, y - 0.8),
            2.4,
            1.6,
            boxstyle="round,pad=0.1",
            facecolor="white",
            edgecolor="#E2E8F0",
            linewidth=1,
        )
        ax.add_patch(card)

    # Asset icon placeholder
    icon_bg = Circle((x - 0.4, y + 0.2), 0.25, facecolor="#0A1628", alpha=0.1)
    ax.add_patch(icon_bg)
    ax.text(
        x - 0.4,
        y + 0.2,
        symbol[0],
        fontsize=10,
        weight="bold",
        ha="center",
        va="center",
        color="#0A1628",
    )

    ax.text(x + 0.3, y + 0.2, symbol, fontsize=12, weight="bold", color="#0A1628")
    ax.text(x - 0.4, y - 0.3, price, fontsize=10, color="#0A1628")

    # Price change
    change_color = "#10B981" if "+" in change else "#EF4444"
    ax.text(x + 0.5, y - 0.3, change, fontsize=9, color=change_color)

# Amount Input Section
ax.text(2, 7.8, "Amount to Deposit", fontsize=12, weight="bold", color="#0A1628")

# Input field
input_bg = FancyBboxPatch(
    (2, 6.8),
    6,
    0.8,
    boxstyle="round,pad=0.05",
    facecolor="white",
    edgecolor="#CBD5E1",
    linewidth=1,
)
ax.add_patch(input_bg)
ax.text(2.3, 7.2, "5.5", fontsize=16, weight="bold", color="#0A1628")
ax.text(6.5, 7.2, "SOL", fontsize=11, color="#64748B")
ax.text(7.5, 7.2, "MAX", fontsize=9, weight="bold", color="#D4AF37")

# Slider representation
ax.plot([2, 7.5], [6.5, 6.5], color="#E2E8F0", linewidth=4, solid_capstyle="round")
ax.plot([2, 5], [6.5, 6.5], color="#D4AF37", linewidth=4, solid_capstyle="round")
handle = Circle((5, 6.5), 0.15, facecolor="white", edgecolor="#D4AF37", linewidth=2)
ax.add_patch(handle)

# Loan Summary Card
summary_bg = FancyBboxPatch(
    (2, 3.5),
    8,
    2.8,
    boxstyle="round,pad=0.1",
    facecolor="#F8FAFC",
    edgecolor="#E2E8F0",
    linewidth=1,
)
ax.add_patch(summary_bg)

ax.text(3, 5.9, "Loan Summary", fontsize=12, weight="bold", color="#0A1628")

# Summary rows
summary_data = [
    ("Collateral Value:", "$467.50"),
    ("You'll Receive:", "330 USDC"),
    ("LTV Ratio:", "42% (Safe)"),
    ("Interest Rate:", "12% APR"),
    ("Liquidation Price:", "$95.00/SOL"),
]

for i, (label, value) in enumerate(summary_data):
    y = 5.4 - i * 0.4
    ax.text(3, y, label, fontsize=10, color="#64748B")

    # Color coding for values
    if "Safe" in value:
        color = "#10B981"
    elif "Receive" in label:
        color = "#D4AF37"
    else:
        color = "#0A1628"

    ax.text(8.5, y, value, fontsize=10, weight="bold", ha="right", color=color)

# LTV Gauge
ax.text(3, 3.0, "LTV Health", fontsize=10, color="#64748B")
gauge_bg = FancyBboxPatch(
    (3, 2.6), 6, 0.3, boxstyle="round,pad=0.05", facecolor="#E2E8F0", edgecolor="none"
)
ax.add_patch(gauge_bg)
gauge_fill = FancyBboxPatch(
    (3, 2.6), 2.5, 0.3, boxstyle="round,pad=0.05", facecolor="#10B981", edgecolor="none"
)
ax.add_patch(gauge_fill)
ax.text(8.5, 2.75, "42%", fontsize=9, weight="bold", ha="right", color="#10B981")

# Action Buttons
back_btn = FancyBboxPatch(
    (2, 0.8),
    2,
    0.7,
    boxstyle="round,pad=0.1",
    facecolor="white",
    edgecolor="#CBD5E1",
    linewidth=1,
)
ax.add_patch(back_btn)
ax.text(
    3,
    1.15,
    "← Back",
    fontsize=10,
    weight="bold",
    ha="center",
    va="center",
    color="#64748B",
)

continue_btn = FancyBboxPatch(
    (7, 0.8), 3, 0.7, boxstyle="round,pad=0.1", facecolor="#D4AF37", edgecolor="none"
)
ax.add_patch(continue_btn)
ax.text(
    8.5,
    1.15,
    "Continue →",
    fontsize=11,
    weight="bold",
    ha="center",
    va="center",
    color="white",
)

plt.tight_layout()
plt.savefig(
    "ginva_wireframe_borrow.png",
    dpi=150,
    bbox_inches="tight",
    facecolor="#FAFBFC",
    edgecolor="none",
)
plt.close()
print("✅ Wireframe: Borrow Flow สร้างเสร็จแล้ว!")
