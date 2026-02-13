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
    "SETTINGS WIREFRAME",
    fontsize=18,
    weight="bold",
    ha="center",
    color="#0A1628",
)
ax.text(
    7,
    9.1,
    "User preferences and account settings",
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
    ("Market", False),
    ("Support", False),
    ("Settings", True),
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

# Profile Section
ax.text(2.8, 8.6, "Profile", fontsize=12, weight="bold", color="#0A1628")

# Wallet info card
wallet_card = FancyBboxPatch(
    (2.8, 7.5),
    5.5,
    1.0,
    boxstyle="round,pad=0.1",
    facecolor="white",
    edgecolor="#E2E8F0",
    linewidth=1,
)
ax.add_patch(wallet_card)

# Avatar
circle = Circle(
    (3.5, 8.0), 0.3, facecolor="#D4AF37", alpha=0.2, edgecolor="#D4AF37", linewidth=2
)
ax.add_patch(circle)
ax.text(
    3.5,
    8.0,
    "0x",
    fontsize=10,
    weight="bold",
    ha="center",
    va="center",
    color="#D4AF37",
)

ax.text(4.0, 8.15, "0x7a2f...8e4d", fontsize=11, weight="bold", color="#0A1628")
ax.text(4.0, 7.8, "Solana Mainnet", fontsize=9, color="#64748B")

copy_btn = FancyBboxPatch(
    (7, 7.7),
    1.2,
    0.4,
    boxstyle="round,pad=0.02",
    facecolor="#F1F5F9",
    edgecolor="#CBD5E1",
    linewidth=1,
)
ax.add_patch(copy_btn)
ax.text(7.6, 7.9, "Copy", fontsize=8, ha="center", va="center", color="#64748B")

# Preferences Section
ax.text(2.8, 6.8, "Preferences", fontsize=12, weight="bold", color="#0A1628")

preferences = [
    ("Email Notifications", True, "Receive alerts about your loans"),
    ("Price Alerts", True, "Get notified of price changes"),
    ("Weekly Summary", False, "Weekly portfolio report"),
    ("Dark Mode", False, "Use dark theme"),
]

for i, (label, enabled, desc) in enumerate(preferences):
    y = 6.0 - i * 0.65

    pref_card = FancyBboxPatch(
        (2.8, y - 0.2),
        11,
        0.55,
        boxstyle="round,pad=0.02",
        facecolor="white",
        edgecolor="#E2E8F0",
        linewidth=1,
    )
    ax.add_patch(pref_card)

    ax.text(3.0, y + 0.1, label, fontsize=10, weight="bold", color="#0A1628")
    ax.text(3.0, y - 0.2, desc, fontsize=8, color="#64748B")

    # Toggle switch
    toggle_x = 12.5
    toggle_bg = FancyBboxPatch(
        (toggle_x, y - 0.1),
        0.8,
        0.35,
        boxstyle="round,pad=0.02",
        facecolor="#10B981" if enabled else "#E2E8F0",
        edgecolor="none",
    )
    ax.add_patch(toggle_bg)
    toggle_circle_x = toggle_x + 0.35 if enabled else toggle_x + 0.45
    toggle_circle = Circle((toggle_circle_x, y + 0.07), 0.12, facecolor="white")
    ax.add_patch(toggle_circle)

# Security Section
ax.text(2.8, 2.8, "Security", fontsize=12, weight="bold", color="#0A1628")

security_items = [
    ("Disconnect Wallet", "#EF4444", "Remove wallet from this device"),
    ("Revoke Approvals", "#F59E0B", "Manage token approvals"),
]

for i, (label, color, desc) in enumerate(security_items):
    y = 2.2 - i * 0.7

    sec_card = FancyBboxPatch(
        (2.8, y - 0.15),
        11,
        0.55,
        boxstyle="round,pad=0.02",
        facecolor="white",
        edgecolor="#E2E8F0",
        linewidth=1,
    )
    ax.add_patch(sec_card)

    ax.text(3.0, y + 0.15, label, fontsize=10, weight="bold", color=color)
    ax.text(3.0, y - 0.15, desc, fontsize=8, color="#64748B")
    ax.text(
        12.5, y + 0.15, ">", fontsize=12, ha="right", color="#CBD5E1", weight="bold"
    )

# App Info
ax.text(7, 1.0, "GINVA v1.0.0", fontsize=8, ha="center", color="#94A3B8")
ax.text(
    7,
    0.7,
    "Terms of Service | Privacy Policy",
    fontsize=8,
    ha="center",
    color="#94A3B8",
)

plt.tight_layout()
plt.savefig(
    "ginva_wireframe_settings.png",
    dpi=150,
    bbox_inches="tight",
    facecolor="white",
    edgecolor="none",
)
plt.close()
print("✅ Wireframe: Settings สร้างเสร็จแล้ว!")
