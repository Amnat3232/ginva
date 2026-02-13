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
    "MARKET OVERVIEW WIREFRAME",
    fontsize=18,
    weight="bold",
    ha="center",
    color="#0A1628",
)
ax.text(
    7,
    9.1,
    "Asset prices and lending market data",
    fontsize=10,
    ha="center",
    color="#64748B",
)

# ========== SIDEBAR ==========
sidebar = Rectangle((0, 0), 2.2, 10, facecolor="#0A1628", edgecolor="none")
ax.add_patch(sidebar)

ax.text(0.8, 9.3, "G", fontsize=18, weight="bold", color="#D4AF37")
ax.text(1.3, 9.3, "INVA", fontsize=14, weight="bold", color="white")

menu_items = [
    ("Dashboard", False),
    ("My Loans", False),
    ("Market", True),
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

# Market Stats Header
ax.text(2.5, 8.8, "Market Overview", fontsize=14, weight="bold", color="#0A1628")
ax.text(12.5, 8.8, "Live", fontsize=9, color="#10B981", ha="right", weight="bold")

# Live stats bar
stats_bg = Rectangle((2.5, 8.0), 11, 0.6, facecolor="#F8FAFC", edgecolor="#E2E8F0")
ax.add_patch(stats_bg)

market_stats = [
    ("$48.2M", "Total Value Locked"),
    ("$12.4M", "Total Borrowed"),
    ("$35.8M", "Available Liquidity"),
    ("1,847", "Active Loans"),
]

for i, (value, label) in enumerate(market_stats):
    x = 3.2 + i * 2.7
    ax.text(x, 8.45, value, fontsize=11, weight="bold", ha="center", color="#0A1628")
    ax.text(x, 8.15, label, fontsize=7, ha="center", color="#64748B")

# Asset Table Header
ax.text(2.5, 7.4, "Assets", fontsize=12, weight="bold", color="#0A1628")

# Table header
table_header = FancyBboxPatch(
    (2.5, 6.8),
    11,
    0.5,
    boxstyle="round,pad=0.02",
    facecolor="#F1F5F9",
    edgecolor="none",
)
ax.add_patch(table_header)

headers = [
    ("Asset", 2.8),
    ("Price", 4.5),
    ("Collateral Factor", 6.5),
    ("Supply", 8.5),
    ("Borrow APY", 10.5),
]
for label, x in headers:
    ax.text(x, 7.0, label, fontsize=9, weight="bold", color="#64748B")

# Asset rows
assets = [
    ("SOL", "$142.50", "80%", "$12.4M", "5.2%", True),
    ("BTC", "$67,240", "70%", "$8.2M", "3.8%", False),
    ("ETH", "$3,890", "75%", "$6.8M", "4.1%", False),
    ("USDC", "$1.00", "90%", "$8.5M", "6.5%", False),
    ("USDT", "$1.00", "90%", "$2.1M", "6.3%", False),
]

for i, (asset, price, factor, supply, apy, selected) in enumerate(assets):
    y = 6.2 - i * 0.7

    bg_color = "#F0FDF4" if selected else "white"
    edge = "#00D4AA" if selected else "#E2E8F0"

    row = FancyBboxPatch(
        (2.5, y - 0.3),
        11,
        0.6,
        boxstyle="round,pad=0.02",
        facecolor=bg_color,
        edgecolor=edge,
        linewidth=1,
    )
    ax.add_patch(row)

    # Asset icon
    circle = Circle((3.1, y + 0.05), 0.15, facecolor="#0A1628", alpha=0.1)
    ax.add_patch(circle)
    ax.text(
        3.1,
        y + 0.05,
        asset[0],
        fontsize=8,
        weight="bold",
        ha="center",
        va="center",
        color="#0A1628",
    )

    ax.text(3.5, y + 0.05, asset, fontsize=9, weight="bold", color="#0A1628")
    ax.text(5.0, y + 0.05, price, fontsize=9, color="#0A1628")
    ax.text(6.8, y + 0.05, factor, fontsize=9, color="#10B981")
    ax.text(8.8, y + 0.05, supply, fontsize=9, color="#64748B")
    ax.text(10.8, y + 0.05, apy, fontsize=9, weight="bold", color="#D4AF37")

# LTV Info Card
info_card = FancyBboxPatch(
    (2.5, 1.5),
    5,
    1.8,
    boxstyle="round,pad=0.1",
    facecolor="#F0F9FF",
    edgecolor="#0EA5E9",
    linewidth=1,
)
ax.add_patch(info_card)

ax.text(
    3, 2.9, "Collateral Factors Explained", fontsize=10, weight="bold", color="#0369A1"
)
ax.text(3, 2.5, "Each asset has a max", fontsize=8, color="#0EA5E9")
ax.text(3, 2.2, "loan-to-value ratio.", fontsize=8, color="#0EA5E9")
ax.text(3, 1.8, "SOL 80% = $100 SOL", fontsize=8, color="#64748B")
ax.text(3, 1.5, "can borrow $80", fontsize=8, color="#64748B")

# Tips Card
tips_card = FancyBboxPatch(
    (8, 1.5),
    5,
    1.8,
    boxstyle="round,pad=0.1",
    facecolor="#FFFBEB",
    edgecolor="#F59E0B",
    linewidth=1,
)
ax.add_patch(tips_card)

ax.text(8.5, 2.9, "Borrowing Tips", fontsize=10, weight="bold", color="#92400E")
ax.text(8.5, 2.5, "• Keep LTV below 50%", fontsize=8, color="#B45309")
ax.text(8.5, 2.2, "• Add collateral early", fontsize=8, color="#B45309")
ax.text(8.5, 1.9, "• Monitor price changes", fontsize=8, color="#B45309")
ax.text(8.5, 1.6, "• 72hr protection helps!", fontsize=8, color="#B45309")

plt.tight_layout()
plt.savefig(
    "ginva_wireframe_market.png",
    dpi=150,
    bbox_inches="tight",
    facecolor="white",
    edgecolor="none",
)
plt.close()
print("✅ Wireframe: Market Overview สร้างเสร็จแล้ว!")
