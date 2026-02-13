import matplotlib.pyplot as plt
import matplotlib.patches as patches
from matplotlib.patches import FancyBboxPatch, Rectangle, Circle, FancyArrowPatch
import numpy as np

fig, ax = plt.subplots(figsize=(16, 12))
ax.set_xlim(0, 16)
ax.set_ylim(0, 12)
ax.axis("off")

# Background
bg = Rectangle((0, 0), 16, 12, facecolor="#FAFBFC")
ax.add_patch(bg)

# Title
ax.text(
    8,
    11.5,
    "GINVA USER FLOW DIAGRAM",
    fontsize=20,
    weight="bold",
    ha="center",
    color="#0A1628",
)
ax.text(
    8,
    11.0,
    "Complete User Journey from Landing to Protection",
    fontsize=11,
    ha="center",
    color="#64748B",
)

# ========== LANDING SECTION ==========
landing = FancyBboxPatch(
    (0.5, 8.5),
    3,
    2,
    boxstyle="round,pad=0.1",
    facecolor="#0A1628",
    edgecolor="#D4AF37",
    linewidth=3,
)
ax.add_patch(landing)
ax.text(2, 10.0, "LANDING", fontsize=12, weight="bold", ha="center", color="#D4AF37")
ax.text(2, 9.5, "PAGE", fontsize=12, weight="bold", ha="center", color="#D4AF37")
ax.text(2, 8.9, "Hero, Stats, CTA", fontsize=9, ha="center", color="white")

# Arrow down from Landing
ax.annotate(
    "",
    xy=(2, 8.5),
    xytext=(2, 8.1),
    arrowprops=dict(arrowstyle="->", color="#D4AF37", lw=2),
)

# ========== BORROW FLOW ==========
borrow_header = ax.text(
    2, 7.8, "BORROW FLOW", fontsize=10, weight="bold", ha="center", color="#0A1628"
)

# Step 1
step1 = FancyBboxPatch(
    (0.5, 5.8),
    1.5,
    1.5,
    boxstyle="round,pad=0.08",
    facecolor="white",
    edgecolor="#00D4AA",
    linewidth=2,
)
ax.add_patch(step1)
ax.text(1.25, 6.8, "Step 1", fontsize=9, weight="bold", ha="center", color="#00D4AA")
ax.text(1.25, 6.4, "Select\nCollateral", fontsize=8, ha="center", color="#0A1628")

# Arrow 1->2
ax.annotate(
    "",
    xy=(2.2, 6.25),
    xytext=(1.7, 6.25),
    arrowprops=dict(arrowstyle="->", color="#CBD5E1", lw=2),
)
ax.text(1.95, 6.4, "1", fontsize=8, ha="center", color="#94A3B8")

# Step 2
step2 = FancyBboxPatch(
    (2.5, 5.8),
    1.5,
    1.5,
    boxstyle="round,pad=0.08",
    facecolor="white",
    edgecolor="#00D4AA",
    linewidth=2,
)
ax.add_patch(step2)
ax.text(3.25, 6.8, "Step 2", fontsize=9, weight="bold", ha="center", color="#00D4AA")
ax.text(3.25, 6.4, "Set\nAmount", fontsize=8, ha="center", color="#0A1628")

# Arrow 2->3
ax.annotate(
    "",
    xy=(4.2, 6.25),
    xytext=(3.7, 6.25),
    arrowprops=dict(arrowstyle="->", color="#CBD5E1", lw=2),
)
ax.text(3.95, 6.4, "2", fontsize=8, ha="center", color="#94A3B8")

# Step 3
step3 = FancyBboxPatch(
    (4.5, 5.8),
    1.5,
    1.5,
    boxstyle="round,pad=0.08",
    facecolor="white",
    edgecolor="#00D4AA",
    linewidth=2,
)
ax.add_patch(step3)
ax.text(5.25, 6.8, "Step 3", fontsize=9, weight="bold", ha="center", color="#00D4AA")
ax.text(5.25, 6.4, "Review &\nConfirm", fontsize=8, ha="center", color="#0A1628")

# Arrow from Borrow to Dashboard
ax.annotate(
    "",
    xy=(5.5, 5.8),
    xytext=(5.5, 5.4),
    arrowprops=dict(arrowstyle="->", color="#D4AF37", lw=2),
)

# ========== DASHBOARD ==========
dashboard = FancyBboxPatch(
    (4, 3.5),
    3.5,
    1.8,
    boxstyle="round,pad=0.1",
    facecolor="#0A1628",
    edgecolor="#1E293B",
    linewidth=2,
)
ax.add_patch(dashboard)
ax.text(
    5.75, 4.8, "DASHBOARD", fontsize=11, weight="bold", ha="center", color="#D4AF37"
)
ax.text(5.75, 4.3, "Portfolio Overview", fontsize=9, ha="center", color="white")
ax.text(5.75, 3.9, "LTV: 42% | Loan: #2847", fontsize=8, ha="center", color="#94A3B8")

# ========== ARROWS FROM DASHBOARD ==========
# Left arrow to My Loans
ax.annotate(
    "",
    xy=(4, 4.4),
    xytext=(3.5, 4.4),
    arrowprops=dict(arrowstyle="->", color="#CBD5E1", lw=2),
)
ax.text(3.2, 4.55, "My Loans", fontsize=8, ha="right", color="#64748B")

# Right arrow to Market
ax.annotate(
    "",
    xy=(7.5, 4.4),
    xytext=(8, 4.4),
    arrowprops=dict(arrowstyle="->", color="#CBD5E1", lw=2),
)
ax.text(8.3, 4.55, "Market", fontsize=8, ha="left", color="#64748B")

# Down arrow to Protection
ax.annotate(
    "",
    xy=(5.75, 3.5),
    xytext=(5.75, 3.1),
    arrowprops=dict(arrowstyle="->", color="#F59E0B", lw=2),
)

# ========== PROTECTION MODE (CRISIS) ==========
protection = FancyBboxPatch(
    (4, 1.2),
    3.5,
    1.8,
    boxstyle="round,pad=0.1",
    facecolor="#FEF3C7",
    edgecolor="#F59E0B",
    linewidth=3,
)
ax.add_patch(protection)
ax.text(
    5.75, 2.6, "PROTECTION", fontsize=11, weight="bold", ha="center", color="#92400E"
)
ax.text(5.75, 2.2, "MODE", fontsize=11, weight="bold", ha="center", color="#92400E")
ax.text(5.75, 1.7, "72-Hour Window", fontsize=9, ha="center", color="#B45309")
ax.text(5.75, 1.4, "Add Collateral / Repay", fontsize=8, ha="center", color="#92400E")

# ========== RIGHT SIDE - ALTERNATIVE PATHS ==========
# Sidebar area
sidebar_bg = Rectangle(
    (9.5, 1.5), 6, 9.5, facecolor="#F8FAFC", edgecolor="#E2E8F0", linewidth=1
)
ax.add_patch(sidebar_bg)

ax.text(
    12.5,
    10.5,
    "ALTERNATIVE FLOWS",
    fontsize=12,
    weight="bold",
    ha="center",
    color="#0A1628",
)

# Support path
support = FancyBboxPatch(
    (10, 8.5),
    5,
    1.3,
    boxstyle="round,pad=0.08",
    facecolor="white",
    edgecolor="#0EA5E9",
    linewidth=2,
)
ax.add_patch(support)
ax.text(12.5, 9.4, "SUPPORT", fontsize=10, weight="bold", ha="center", color="#0369A1")
ax.text(12.5, 8.9, "FAQ, Contact, Docs", fontsize=9, ha="center", color="#64748B")

# Settings path
settings = FancyBboxPatch(
    (10, 6.5),
    5,
    1.3,
    boxstyle="round,pad=0.08",
    facecolor="white",
    edgecolor="#6366F1",
    linewidth=2,
)
ax.add_patch(settings)
ax.text(12.5, 7.4, "SETTINGS", fontsize=10, weight="bold", ha="center", color="#4338CA")
ax.text(12.5, 6.9, "Preferences, Security", fontsize=9, ha="center", color="#64748B")

# Help path (after 72hr)
help_box = FancyBboxPatch(
    (10, 4.5),
    5,
    1.3,
    boxstyle="round,pad=0.08",
    facecolor="#EEF2FF",
    edgecolor="#6366F1",
    linewidth=2,
)
ax.add_patch(help_box)
ax.text(
    12.5,
    5.4,
    "HELPER SUPPORT",
    fontsize=10,
    weight="bold",
    ha="center",
    color="#4338CA",
)
ax.text(
    12.5, 4.9, "After 72hr - Optional help", fontsize=9, ha="center", color="#64748B"
)

# Connect Wallet path
wallet = FancyBboxPatch(
    (10, 2.5),
    5,
    1.3,
    boxstyle="round,pad=0.08",
    facecolor="#F0FDF4",
    edgecolor="#10B981",
    linewidth=2,
)
ax.add_patch(wallet)
ax.text(
    12.5,
    3.4,
    "CONNECT WALLET",
    fontsize=10,
    weight="bold",
    ha="center",
    color="#059669",
)
ax.text(12.5, 2.9, "Any screen - Header", fontsize=9, ha="center", color="#64748B")

# ========== CONNECTING ARROWS ==========
# Landing to Connect Wallet
ax.annotate(
    "",
    xy=(9.5, 9.5),
    xytext=(3.5, 9.5),
    arrowprops=dict(arrowstyle="->", color="#10B981", lw=1.5, linestyle="dashed"),
)
ax.text(6, 9.7, "Connect Wallet", fontsize=8, ha="center", color="#10B981")

# Dashboard to Support/Settings
ax.annotate(
    "",
    xy=(10, 4.4),
    xytext=(7.5, 4.4),
    arrowprops=dict(arrowstyle="->", color="#CBD5E1", lw=1.5),
)
ax.annotate(
    "",
    xy=(10, 6.4),
    xytext=(7.5, 4.4),
    arrowprops=dict(arrowstyle="->", color="#CBD5E1", lw=1.5),
)

# Protection to Helper
ax.annotate(
    "",
    xy=(10, 2.5),
    xytext=(8.5, 1.2),
    arrowprops=dict(arrowstyle="->", color="#6366F1", lw=1.5),
)

plt.tight_layout()
plt.savefig(
    "ginva_flow_diagram.png",
    dpi=150,
    bbox_inches="tight",
    facecolor="white",
    edgecolor="none",
)
plt.close()
print("Flow Diagram created!")
