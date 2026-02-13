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

sidebar = Rectangle((0, 0), 2.5, 10, facecolor="#1E293B", edgecolor="#334155")
ax.add_patch(sidebar)

ax.text(1, 9.3, "G", fontsize=20, weight="bold", color="#D4AF37")
ax.text(1.6, 9.3, "INVA", fontsize=14, weight="bold", color="white")

menu_items = [
    ("Dashboard", True, "#D4AF37"),
    ("My Loans", False, "#64748B"),
    ("Market", False, "#64748B"),
    ("Support", False, "#64748B"),
    ("Settings", False, "#64748B"),
]

for i, (item, active, color) in enumerate(menu_items):
    y = 8.3 - i * 0.9
    if active:
        highlight = Rectangle((0, y - 0.2), 2.5, 0.5, facecolor="#0A1628")
        ax.add_patch(highlight)
    ax.text(
        0.4, y, item, fontsize=11, color=color, weight="bold" if active else "normal"
    )

ax.text(0.4, 3.0, "0x7a2f...8e4d", fontsize=8, color="#64748B")
ax.text(0.4, 2.5, "Disconnect", fontsize=9, color="#EF4444")

top_bar = Rectangle((2.5, 9), 13.5, 1, facecolor="#1E293B", edgecolor="#334155")
ax.add_patch(top_bar)
ax.text(3.5, 9.5, "My Dashboard", fontsize=16, weight="bold", color="white")

stats = [
    ("$3,240", "Total Value", "#D4AF37"),
    ("$780", "Borrowed", "#00D4AA"),
    ("$2,460", "Collateral", "#10B981"),
    ("38%", "LTV", "#F59E0B"),
]

for i, (value, label, color) in enumerate(stats):
    x = 3.8 + i * 3.2
    card = FancyBboxPatch(
        (x - 1.2, 7.5),
        2.4,
        1.3,
        boxstyle="round,pad=0.05",
        facecolor="#1E293B",
        edgecolor="#334155",
        linewidth=1,
    )
    ax.add_patch(card)
    ax.text(x, 8.4, value, fontsize=18, weight="bold", ha="center", color=color)
    ax.text(x, 7.9, label, fontsize=9, ha="center", color="#64748B")

loan_card = FancyBboxPatch(
    (3.5, 4.5),
    9,
    2.8,
    boxstyle="round,pad=0.1",
    facecolor="#1E293B",
    edgecolor="#334155",
    linewidth=1,
)
ax.add_patch(loan_card)

ax.text(4, 7.0, "Loan #2847", fontsize=14, weight="bold", color="white")
badge = FancyBboxPatch(
    (10.5, 6.55),
    1.5,
    0.4,
    boxstyle="round,pad=0.02",
    facecolor="#064E3B",
    edgecolor="#10B981",
    linewidth=1,
)
ax.add_patch(badge)
ax.text(11.25, 6.75, "Healthy", fontsize=9, weight="bold", ha="center", color="#10B981")

details = [
    ("Collateral", "5.5 SOL ($785)", "#94A3B8"),
    ("Borrowed", "330 USDC", "#D4AF37"),
    ("LTV", "38%", "#F59E0B"),
    ("Liquidation", "$95.00", "#94A3B8"),
]

for i, (label, value, color) in enumerate(details):
    x = 4.2 + i * 2.2
    ax.text(x, 6.1, label, fontsize=9, color="#64748B")
    ax.text(x, 5.7, value, fontsize=11, weight="bold", color=color)

ax.text(4.2, 5.0, "LTV Health", fontsize=9, color="#64748B")
bar_bg = FancyBboxPatch(
    (6.5, 4.75),
    4.5,
    0.25,
    boxstyle="round,pad=0.02",
    facecolor="#334155",
    edgecolor="none",
)
ax.add_patch(bar_bg)
bar_fill = FancyBboxPatch(
    (6.5, 4.75),
    1.7,
    0.25,
    boxstyle="round,pad=0.02",
    facecolor="#F59E0B",
    edgecolor="none",
)
ax.add_patch(bar_fill)
ax.text(11.5, 4.85, "38%", fontsize=9, weight="bold", ha="right", color="#F59E0B")

btn1 = FancyBboxPatch(
    (10.5, 4.6),
    1.8,
    0.4,
    boxstyle="round,pad=0.02",
    facecolor="#D4AF37",
    edgecolor="none",
)
ax.add_patch(btn1)
ax.text(
    11.4,
    4.8,
    "Repay",
    fontsize=9,
    weight="bold",
    ha="center",
    va="center",
    color="#0A1628",
)

quick_actions = [
    ("Add Collateral", "#00D4AA"),
    ("Withdraw", "#64748B"),
    ("View History", "#64748B"),
]

for i, (action, color) in enumerate(quick_actions):
    x = 4 + i * 3.5
    action_btn = FancyBboxPatch(
        (x, 3.5),
        2.8,
        0.6,
        boxstyle="round,pad=0.05",
        facecolor="none",
        edgecolor=color,
        linewidth=1,
    )
    ax.add_patch(action_btn)
    ax.text(x + 1.4, 4.0, action, fontsize=10, weight="bold", ha="center", color=color)

ax.text(
    8,
    2.8,
    "72-Hour Protection",
    fontsize=11,
    weight="bold",
    ha="center",
    color="#00D4AA",
)
ax.text(
    8,
    2.4,
    "Your loan is protected until price drops below liquidation",
    fontsize=9,
    ha="center",
    color="#64748B",
)

plt.tight_layout()
plt.savefig(
    "ginva_mockup_dashboard.png",
    dpi=150,
    bbox_inches="tight",
    facecolor="#0A1628",
    edgecolor="none",
)
plt.close()
print("Mockup: Dashboard (Dark Theme) created!")
