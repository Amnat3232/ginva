import matplotlib.pyplot as plt
import matplotlib.patches as patches
from matplotlib.patches import FancyBboxPatch, Rectangle, Circle, Wedge
import numpy as np

fig, ax = plt.subplots(figsize=(12, 16))
ax.set_xlim(0, 12)
ax.set_ylim(0, 16)
ax.axis("off")

# Background
bg = Rectangle((0, 0), 12, 16, facecolor="#FAFBFC")
ax.add_patch(bg)

# ========== ALERT HEADER ==========
alert_bg = Rectangle((0, 14.5), 12, 1.5, facecolor="#FEF3C7", edgecolor="none")
ax.add_patch(alert_bg)

# Pulsing dot
dot = Circle((1.2, 15.25), 0.15, facecolor="#F59E0B", edgecolor="none", alpha=0.8)
ax.add_patch(dot)

ax.text(2, 15.4, "Protection Mode Active", fontsize=16, weight="bold", color="#92400E")
ax.text(2, 15.0, "Your collateral needs attention", fontsize=11, color="#B45309")

ax.text(10, 15.25, "68:42:15", fontsize=20, weight="bold", ha="center", color="#92400E")
ax.text(10, 14.75, "remaining", fontsize=9, ha="center", color="#B45309")

# ========== MAIN CONTENT ==========
content_bg = Rectangle(
    (1, 2), 10, 12, facecolor="white", edgecolor="#E2E8F0", linewidth=1
)
ax.add_patch(content_bg)

# Status Header
ax.text(2, 13.3, "Loan #2847 Status", fontsize=14, weight="bold", color="#0A1628")

# Big Status Card
status_card = FancyBboxPatch(
    (2, 11),
    8,
    2,
    boxstyle="round,pad=0.1",
    facecolor="#FEF3C7",
    edgecolor="#F59E0B",
    linewidth=2,
)
ax.add_patch(status_card)

ax.text(3, 12.5, "Current Status:", fontsize=10, color="#92400E")
ax.text(3, 12.0, "PROTECTION WINDOW", fontsize=18, weight="bold", color="#92400E")
ax.text(3, 11.5, "Hour 4 of 72 • You have time to act", fontsize=10, color="#B45309")

# Countdown visualization
countdown_x = 8
countdown_y = 12

# Outer ring
outer = Circle(
    (countdown_x, countdown_y), 0.8, fill=False, edgecolor="#F59E0B", linewidth=3
)
ax.add_patch(outer)

# Progress arc (68 hours remaining of 72 = 94.4%)
wedge = Wedge(
    (countdown_x, countdown_y),
    0.8,
    90,
    90 + 340,
    facecolor="none",
    edgecolor="#10B981",
    linewidth=3,
)
ax.add_patch(wedge)

ax.text(
    countdown_x,
    countdown_y,
    "94%",
    fontsize=14,
    weight="bold",
    ha="center",
    va="center",
    color="#0A1628",
)

# ========== PRICE INFO ==========
price_card = FancyBboxPatch(
    (2, 8.5),
    8,
    2.2,
    boxstyle="round,pad=0.1",
    facecolor="#F8FAFC",
    edgecolor="#E2E8F0",
    linewidth=1,
)
ax.add_patch(price_card)

ax.text(2.5, 10.3, "Price Monitoring", fontsize=12, weight="bold", color="#0A1628")

# Price rows
prices = [
    ("Your Liquidation Price:", "$95.00/SOL", "#0A1628"),
    ("Current SOL Price:", "$89.50", "#EF4444"),
    ("Price Gap:", "-$5.50 (-5.8%)", "#EF4444"),
]

for i, (label, value, color) in enumerate(prices):
    y = 9.8 - i * 0.5
    ax.text(2.5, y, label, fontsize=10, color="#64748B")
    ax.text(8.5, y, value, fontsize=11, weight="bold", ha="right", color=color)

# Warning indicator
warn_bar = FancyBboxPatch(
    (2.5, 8.0), 7, 0.2, boxstyle="round,pad=0.05", facecolor="#FEE2E2", edgecolor="none"
)
ax.add_patch(warn_bar)
warn_fill = FancyBboxPatch(
    (2.5, 8.0),
    6,
    0.2,
    boxstyle="round,pad=0.05",
    facecolor="#EF4444",
    edgecolor="none",
    alpha=0.6,
)
ax.add_patch(warn_fill)
ax.text(
    6, 8.35, "Approaching liquidation zone", fontsize=9, ha="center", color="#991B1B"
)

# ========== TIMELINE VISUALIZATION ==========
ax.text(2, 7.3, "Protection Timeline", fontsize=12, weight="bold", color="#0A1628")
ax.text(2, 6.9, "What happens next if you take no action", fontsize=9, color="#64748B")

# Timeline
timeline_y = 6.2
ax.plot(
    [2, 9],
    [timeline_y, timeline_y],
    color="#E2E8F0",
    linewidth=4,
    solid_capstyle="round",
)

# Current position marker
current = Circle(
    (3, timeline_y), 0.15, facecolor="#F59E0B", edgecolor="white", linewidth=2
)
ax.add_patch(current)
ax.text(
    3, timeline_y + 0.4, "NOW", fontsize=8, weight="bold", ha="center", color="#92400E"
)
ax.text(3, timeline_y - 0.4, "Hour 4", fontsize=8, ha="center", color="#64748B")

# Future markers
markers = [(5, "24h", "Warning"), (7, "48h", "Urgent"), (9, "72h", "Support Phase")]

for x, time, label in markers:
    circle = Circle((x, timeline_y), 0.1, facecolor="#CBD5E1", edgecolor="none")
    ax.add_patch(circle)
    ax.text(x, timeline_y - 0.4, time, fontsize=8, ha="center", color="#64748B")
    ax.text(x, timeline_y + 0.4, label, fontsize=8, ha="center", color="#94A3B8")

# ========== ACTION CARDS ==========
ax.text(2, 5.0, "Recommended Actions", fontsize=12, weight="bold", color="#0A1628")

actions = [
    ("Add Collateral", "Deposit 0.5 SOL", "Protection cleared", "#10B981"),
    ("Partial Repay", "Repay 50 USDC", "LTV reduced to 35%", "#0A1628"),
    ("Do Nothing", "Continue monitoring", "Enter support phase", "#64748B"),
]

for i, (title, action, result, color) in enumerate(actions):
    y = 4.0 - i * 1.1

    # Action card
    card = FancyBboxPatch(
        (2, y - 0.4),
        8,
        0.9,
        boxstyle="round,pad=0.05",
        facecolor="white",
        edgecolor="#E2E8F0",
        linewidth=1,
    )
    ax.add_patch(card)

    # Radio button
    radio = Circle((2.4, y), 0.12, fill=False, edgecolor="#CBD5E1", linewidth=2)
    ax.add_patch(radio)

    # Content
    ax.text(2.8, y + 0.15, title, fontsize=11, weight="bold", color="#0A1628")
    ax.text(2.8, y - 0.15, action, fontsize=9, color="#64748B")

    # Result badge
    result_bg = FancyBboxPatch(
        (7, y - 0.15),
        2.5,
        0.4,
        boxstyle="round,pad=0.05",
        facecolor=color,
        alpha=0.1,
        edgecolor=color,
        linewidth=1,
    )
    ax.add_patch(result_bg)
    ax.text(8.25, y + 0.05, result, fontsize=8, ha="center", color=color, weight="bold")

# ========== HELPER INFO ==========
helper_card = FancyBboxPatch(
    (2, 0.5),
    8,
    1.2,
    boxstyle="round,pad=0.1",
    facecolor="#F0F9FF",
    edgecolor="#0EA5E9",
    linewidth=1,
)
ax.add_patch(helper_card)

ax.text(
    2.5, 1.4, "Helper Support Available", fontsize=10, weight="bold", color="#0369A1"
)
ax.text(
    2.5,
    1.0,
    "Helpers can assist after 72 hours. You may receive surplus if they help.",
    fontsize=9,
    color="#0EA5E9",
)
ax.text(
    8.5, 1.2, "Learn More →", fontsize=9, ha="right", color="#0EA5E9", weight="bold"
)

plt.tight_layout()
plt.savefig(
    "ginva_wireframe_protection.png",
    dpi=150,
    bbox_inches="tight",
    facecolor="#FAFBFC",
    edgecolor="none",
)
plt.close()
print("✅ Wireframe: Protection Mode สร้างเสร็จแล้ว!")
