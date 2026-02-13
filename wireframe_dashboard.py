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
    "DASHBOARD WIREFRAME",
    fontsize=18,
    weight="bold",
    ha="center",
    color="#0A1628",
)
ax.text(
    7,
    9.1,
    "User portfolio overview after borrowing",
    fontsize=10,
    ha="center",
    color="#64748B",
)

# ========== SIDEBAR ==========
sidebar = Rectangle((0, 0), 2.2, 10, facecolor="#0A1628", edgecolor="none")
ax.add_patch(sidebar)

# Logo
ax.text(0.8, 9.3, "G", fontsize=18, weight="bold", color="#D4AF37")
ax.text(1.3, 9.3, "INVA", fontsize=14, weight="bold", color="white")

# Menu items
menu_items = [
    ("Dashboard", True),
    ("My Loans", False),
    ("Market", False),
    ("Support", False),
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

# Wallet info
ax.text(0.4, 3.5, "Wallet", fontsize=9, color="#64748B", weight="bold")
ax.text(0.4, 3.0, "0x7a2f...8e4d", fontsize=8, color="white")

# Disconnect
ax.text(0.4, 2.3, "Disconnect", fontsize=9, color="#EF4444")

# ========== MAIN CONTENT ==========

# Top bar
top_bar = Rectangle((2.2, 9.2), 11.8, 0.8, facecolor="white", edgecolor="#E2E8F0")
ax.add_patch(top_bar)
ax.text(3, 9.6, "My Dashboard", fontsize=14, weight="bold", color="#0A1628")
ax.text(12.5, 9.6, "Network: Solana", fontsize=9, color="#64748B", ha="right")

# Stats row
stats_y = 8.0
stats = [
    ("$3,240", "Total Value", "#0A1628"),
    ("$780", "Borrowed", "#D4AF37"),
    ("$2,460", "Collateral", "#00D4AA"),
    ("38%", "LTV", "#10B981"),
]

for i, (value, label, color) in enumerate(stats):
    x = 2.8 + i * 2.8

    card = FancyBboxPatch(
        (x - 1.1, stats_y - 0.9),
        2.2,
        1.4,
        boxstyle="round,pad=0.05",
        facecolor="white",
        edgecolor="#E2E8F0",
        linewidth=1,
    )
    ax.add_patch(card)

    ax.text(
        x, stats_y + 0.1, value, fontsize=16, weight="bold", ha="center", color=color
    )
    ax.text(x, stats_y - 0.4, label, fontsize=9, ha="center", color="#64748B")

# Active Loans Section
ax.text(3, 7.2, "Active Loans", fontsize=12, weight="bold", color="#0A1628")
ax.text(12, 7.2, "+ New Loan", fontsize=9, color="#D4AF37", ha="right", weight="bold")

# Loan card
loan_card = FancyBboxPatch(
    (3, 4.5),
    10,
    2.4,
    boxstyle="round,pad=0.1",
    facecolor="white",
    edgecolor="#E2E8F0",
    linewidth=1,
)
ax.add_patch(loan_card)

# Loan header
ax.text(3.5, 6.6, "Loan #2847", fontsize=11, weight="bold", color="#0A1628")

# Status badge
badge = FancyBboxPatch(
    (9.5, 6.2),
    1.8,
    0.4,
    boxstyle="round,pad=0.05",
    facecolor="#F0FDF4",
    edgecolor="#00D4AA",
    linewidth=1,
)
ax.add_patch(badge)
ax.text(10.4, 6.4, "Healthy", fontsize=8, weight="bold", ha="center", color="#059669")

# Loan details row 1
ax.text(3.5, 5.8, "Collateral:", fontsize=9, color="#64748B")
ax.text(5.5, 5.8, "5.5 SOL ($785)", fontsize=9, weight="bold", color="#0A1628")
ax.text(8, 5.8, "Borrowed:", fontsize=9, color="#64748B")
ax.text(10, 5.8, "330 USDC", fontsize=9, weight="bold", color="#D4AF37")

# Loan details row 2
ax.text(3.5, 5.2, "LTV:", fontsize=9, color="#64748B")
ax.text(5.5, 5.2, "42%", fontsize=9, weight="bold", color="#10B981")
ax.text(8, 5.2, "Liquidation:", fontsize=9, color="#64748B")
ax.text(10, 5.2, "$95.00", fontsize=9, weight="bold", color="#0A1628")

# LTV progress bar
ax.text(3.5, 4.6, "LTV Health:", fontsize=9, color="#64748B")
bar_bg = FancyBboxPatch(
    (5.5, 4.4),
    5,
    0.25,
    boxstyle="round,pad=0.02",
    facecolor="#E2E8F0",
    edgecolor="none",
)
ax.add_patch(bar_bg)
bar_fill = FancyBboxPatch(
    (5.5, 4.4),
    2.1,
    0.25,
    boxstyle="round,pad=0.02",
    facecolor="#10B981",
    edgecolor="none",
)
ax.add_patch(bar_fill)
ax.text(11, 4.55, "42%", fontsize=8, weight="bold", ha="right", color="#10B981")

# Action buttons
btn1 = FancyBboxPatch(
    (9, 4.6), 1.8, 0.4, boxstyle="round,pad=0.02", facecolor="#0A1628", edgecolor="none"
)
ax.add_patch(btn1)
ax.text(
    9.9,
    4.75,
    "Repay",
    fontsize=8,
    weight="bold",
    ha="center",
    va="center",
    color="white",
)

btn2 = FancyBboxPatch(
    (11, 4.6),
    1.8,
    0.4,
    boxstyle="round,pad=0.02",
    facecolor="white",
    edgecolor="#CBD5E1",
    linewidth=1,
)
ax.add_patch(btn2)
ax.text(
    11.9,
    4.75,
    "+Collateral",
    fontsize=8,
    weight="bold",
    ha="center",
    va="center",
    color="#64748B",
)

# Quick Actions Section
ax.text(3, 3.8, "Quick Actions", fontsize=12, weight="bold", color="#0A1628")

actions = [
    ("Add Collateral", "#00D4AA", "Boost LTV"),
    ("Repay Loan", "#D4AF37", "Reduce debt"),
    ("Withdraw", "#64748B", "Get back collateral"),
]

for i, (action, color, desc) in enumerate(actions):
    x = 3 + i * 3.5

    action_bg = FancyBboxPatch(
        (x, 3.0),
        3,
        0.6,
        boxstyle="round,pad=0.05",
        facecolor=color,
        alpha=0.1,
        edgecolor=color,
        linewidth=1,
    )
    ax.add_patch(action_bg)
    ax.text(x + 1.5, 3.4, action, fontsize=10, weight="bold", ha="center", color=color)
    ax.text(x + 1.5, 3.1, desc, fontsize=8, ha="center", color="#64748B")

plt.tight_layout()
plt.savefig(
    "ginva_wireframe_dashboard.png",
    dpi=150,
    bbox_inches="tight",
    facecolor="white",
    edgecolor="none",
)
plt.close()
print("✅ Wireframe: Dashboard สร้างเสร็จแล้ว!")
