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
    "MY LOANS WIREFRAME",
    fontsize=18,
    weight="bold",
    ha="center",
    color="#0A1628",
)
ax.text(
    7, 9.1, "User loan portfolio and history", fontsize=10, ha="center", color="#64748B"
)

# ========== SIDEBAR ==========
sidebar = Rectangle((0, 0), 2.2, 10, facecolor="#0A1628", edgecolor="none")
ax.add_patch(sidebar)

ax.text(0.8, 9.3, "G", fontsize=18, weight="bold", color="#D4AF37")
ax.text(1.3, 9.3, "INVA", fontsize=14, weight="bold", color="white")

menu_items = [
    ("Dashboard", False),
    ("My Loans", True),
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

# ========== MAIN CONTENT ==========

# Header
ax.text(2.8, 8.8, "My Loans", fontsize=14, weight="bold", color="#0A1628")

# Filter tabs
tabs = [
    ("All (3)", True),
    ("Active (1)", False),
    ("Repaid (2)", False),
    ("Liquidated (0)", False),
]
tab_x = 2.8
for i, (label, active) in enumerate(tabs):
    color = "#D4AF37" if active else "#64748B"
    underline_color = "#D4AF37" if active else "none"

    ax.text(
        tab_x,
        8.3,
        label,
        fontsize=10,
        weight="bold" if active else "normal",
        color=color,
    )

    if active:
        underline = FancyBboxPatch(
            (tab_x, 8.0),
            len(label) * 0.08,
            0.05,
            boxstyle="round,pad=0.01",
            facecolor=color,
            edgecolor="none",
        )
        ax.add_patch(underline)

    tab_x += len(label) * 0.15 + 0.5

# + New Loan button
new_btn = FancyBboxPatch(
    (11.5, 8.4),
    2,
    0.5,
    boxstyle="round,pad=0.05",
    facecolor="#D4AF37",
    edgecolor="none",
)
ax.add_patch(new_btn)
ax.text(
    12.5,
    8.65,
    "+ New Loan",
    fontsize=10,
    weight="bold",
    ha="center",
    va="center",
    color="white",
)

# ========== ACTIVE LOAN SECTION ==========
ax.text(2.8, 7.5, "Active Loan", fontsize=11, weight="bold", color="#0A1628")

# Active loan card
loan_card = FancyBboxPatch(
    (2.8, 5.8),
    10.5,
    1.6,
    boxstyle="round,pad=0.1",
    facecolor="white",
    edgecolor="#00D4AA",
    linewidth=2,
)
ax.add_patch(loan_card)

# Loan ID and status
ax.text(3.2, 7.2, "Loan #2847", fontsize=11, weight="bold", color="#0A1628")
badge = FancyBboxPatch(
    (10.5, 7.0),
    1.5,
    0.35,
    boxstyle="round,pad=0.02",
    facecolor="#F0FDF4",
    edgecolor="#00D4AA",
    linewidth=1,
)
ax.add_patch(badge)
ax.text(
    11.25,
    7.2,
    "Healthy",
    fontsize=8,
    weight="bold",
    ha="center",
    va="center",
    color="#059669",
)

# Loan details
details = [
    ("Collateral", "5.5 SOL ($785)", "#0A1628"),
    ("Borrowed", "330 USDC", "#D4AF37"),
    ("LTV", "42%", "#10B981"),
    ("Created", "Jan 15, 2026", "#64748B"),
]

for i, (label, value, color) in enumerate(details):
    x = 3.2 + i * 2.6
    ax.text(x, 6.6, label, fontsize=8, color="#64748B")
    ax.text(x, 6.3, value, fontsize=10, weight="bold", color=color)

# Progress bar
ax.text(3.2, 5.8, "LTV Health", fontsize=8, color="#64748B")
bar_bg = FancyBboxPatch(
    (5, 5.55), 5, 0.2, boxstyle="round,pad=0.02", facecolor="#E2E8F0", edgecolor="none"
)
ax.add_patch(bar_bg)
bar_fill = FancyBboxPatch(
    (5, 5.55),
    2.1,
    0.2,
    boxstyle="round,pad=0.02",
    facecolor="#10B981",
    edgecolor="none",
)
ax.add_patch(bar_fill)

# ========== REPAID LOANS SECTION ==========
ax.text(2.8, 5.2, "Repaid Loans", fontsize=11, weight="bold", color="#0A1628")

# Repaid loan 1
repaid1 = FancyBboxPatch(
    (2.8, 3.8),
    10.5,
    1.1,
    boxstyle="round,pad=0.08",
    facecolor="#F8FAFC",
    edgecolor="#E2E8F0",
    linewidth=1,
)
ax.add_patch(repaid1)

ax.text(3.2, 4.7, "Loan #1923", fontsize=10, weight="bold", color="#0A1628")
rep_badge = FancyBboxPatch(
    (10.5, 4.55),
    1.5,
    0.3,
    boxstyle="round,pad=0.02",
    facecolor="#EEF2FF",
    edgecolor="#6366F1",
    linewidth=1,
)
ax.add_patch(badge)
ax.text(
    11.25,
    4.7,
    "Repaid",
    fontsize=8,
    weight="bold",
    ha="center",
    va="center",
    color="#6366F1",
)

ax.text(3.2, 4.2, "2.5 SOL → 400 USDC", fontsize=9, color="#64748B")
ax.text(8, 4.2, "Dec 20, 2025", fontsize=8, ha="right", color="#94A3B8")

# Repaid loan 2
repaid2 = FancyBboxPatch(
    (2.8, 2.5),
    10.5,
    1.1,
    boxstyle="round,pad=0.08",
    facecolor="#F8FAFC",
    edgecolor="#E2E8F0",
    linewidth=1,
)
ax.add_patch(repaid2)

ax.text(3.2, 3.4, "Loan #1456", fontsize=10, weight="bold", color="#0A1628")
rep_badge2 = FancyBboxPatch(
    (10.5, 3.25),
    1.5,
    0.3,
    boxstyle="round,pad=0.02",
    facecolor="#EEF2FF",
    edgecolor="#6366F1",
    linewidth=1,
)
ax.add_patch(rep_badge2)
ax.text(
    11.25,
    3.4,
    "Repaid",
    fontsize=8,
    weight="bold",
    ha="center",
    va="center",
    color="#6366F1",
)

ax.text(3.2, 2.9, "1.0 SOL → 160 USDC", fontsize=9, color="#64748B")
ax.text(8, 2.9, "Nov 8, 2025", fontsize=8, ha="right", color="#94A3B8")

plt.tight_layout()
plt.savefig(
    "ginva_wireframe_myloans.png",
    dpi=150,
    bbox_inches="tight",
    facecolor="white",
    edgecolor="none",
)
plt.close()
print("✅ Wireframe: My Loans สร้างเสร็จแล้ว!")
