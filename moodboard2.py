import matplotlib.pyplot as plt
import matplotlib.patches as patches
from matplotlib.patches import FancyBboxPatch, Rectangle
import numpy as np

fig, ax = plt.subplots(figsize=(14, 10))
ax.set_xlim(0, 14)
ax.set_ylim(0, 10)
ax.axis("off")

# Title
ax.text(
    7,
    9.5,
    "TYPOGRAPHY & COMPONENT STYLES",
    fontsize=18,
    weight="bold",
    ha="center",
    color="#0A1628",
)

# Typography Section
ax.text(1, 8.8, "FONT FAMILIES", fontsize=12, weight="bold", color="#0A1628")

# Font examples
fonts = [
    ("Space Grotesk", "Display / Logo", "48px Bold", "#D4AF37"),
    ("Inter", "Headings & Body", "32px SemiBold", "#0A1628"),
    ("JetBrains Mono", "Numbers & Data", "24px Medium", "#00D4AA"),
]

y_start = 8.2
for i, (font, usage, size, color) in enumerate(fonts):
    y = y_start - i * 0.8

    # Font name
    ax.text(1.2, y, font, fontsize=11, weight="bold", color="#0A1628")
    ax.text(4, y, usage, fontsize=9, color="#64748B")
    ax.text(8, y, size, fontsize=9, color=color, weight="bold")

# Component Styles Section
ax.text(1, 5.8, "COMPONENT STYLES", fontsize=12, weight="bold", color="#0A1628")

# Primary Button
btn1 = FancyBboxPatch(
    (1, 4.8), 3, 0.6, boxstyle="round,pad=0.1", facecolor="#D4AF37", edgecolor="none"
)
ax.add_patch(btn1)
ax.text(
    2.5,
    5.1,
    "PRIMARY BUTTON",
    fontsize=10,
    weight="bold",
    ha="center",
    va="center",
    color="white",
)
ax.text(1, 4.5, "Gold (#D4AF37), White text, Rounded", fontsize=8, color="#64748B")

# Secondary Button
btn2 = FancyBboxPatch(
    (5, 4.8),
    3,
    0.6,
    boxstyle="round,pad=0.1",
    facecolor="none",
    edgecolor="#0A1628",
    linewidth=1.5,
)
ax.add_patch(btn2)
ax.text(
    6.5,
    5.1,
    "SECONDARY",
    fontsize=10,
    weight="bold",
    ha="center",
    va="center",
    color="#0A1628",
)
ax.text(5, 4.5, "Outline, Dark text, Same radius", fontsize=8, color="#64748B")

# Protection Card
card = FancyBboxPatch(
    (9.5, 4.5),
    3.5,
    1.2,
    boxstyle="round,pad=0.05",
    facecolor="#F0FDF4",
    edgecolor="#00D4AA",
    linewidth=2,
)
ax.add_patch(card)
ax.text(
    11.25,
    5.4,
    "PROTECTION CARD",
    fontsize=9,
    weight="bold",
    ha="center",
    color="#0A1628",
)
ax.text(
    11.25, 5.0, "Green tint border, Light bg", fontsize=8, ha="center", color="#64748B"
)

# Alert States
ax.text(1, 3.8, "ALERT STATES", fontsize=12, weight="bold", color="#0A1628")

# Safe state
safe = FancyBboxPatch(
    (1, 3.0),
    2.5,
    0.5,
    boxstyle="round,pad=0.05",
    facecolor="#DCFCE7",
    edgecolor="#10B981",
    linewidth=1,
)
ax.add_patch(safe)
ax.text(
    2.25,
    3.25,
    "SAFE",
    fontsize=9,
    weight="bold",
    ha="center",
    va="center",
    color="#065F46",
)

# Warning state
warn = FancyBboxPatch(
    (4, 3.0),
    2.5,
    0.5,
    boxstyle="round,pad=0.05",
    facecolor="#FEF3C7",
    edgecolor="#F59E0B",
    linewidth=1,
)
ax.add_patch(warn)
ax.text(
    5.25,
    3.25,
    "WARNING",
    fontsize=9,
    weight="bold",
    ha="center",
    va="center",
    color="#92400E",
)

# Critical state
crit = FancyBboxPatch(
    (7, 3.0),
    2.5,
    0.5,
    boxstyle="round,pad=0.05",
    facecolor="#FEE2E2",
    edgecolor="#EF4444",
    linewidth=1,
)
ax.add_patch(crit)
ax.text(
    8.25,
    3.25,
    "CRITICAL",
    fontsize=9,
    weight="bold",
    ha="center",
    va="center",
    color="#991B1B",
)

# Protection Active
prot = FancyBboxPatch(
    (10, 3.0),
    3,
    0.5,
    boxstyle="round,pad=0.05",
    facecolor="#0A1628",
    edgecolor="#00D4AA",
    linewidth=2,
)
ax.add_patch(prot)
ax.text(
    11.5,
    3.25,
    "72HR ACTIVE",
    fontsize=9,
    weight="bold",
    ha="center",
    va="center",
    color="#00D4AA",
)

# Icons Style
ax.text(1, 2.3, "ICON STYLE", fontsize=12, weight="bold", color="#0A1628")
ax.text(1, 1.9, "Line icons, 2px stroke, Rounded caps", fontsize=9, color="#64748B")
ax.text(1, 1.6, "Size: 24px (standard), 32px (featured)", fontsize=9, color="#64748B")

# Draw example icons (simplified)
# Shield icon
shield_x, shield_y = 1.5, 0.8
shield = patches.PathPatch(
    patches.Path(
        [
            (shield_x, shield_y + 0.3),
            (shield_x - 0.2, shield_y + 0.1),
            (shield_x - 0.2, shield_y - 0.1),
            (shield_x, shield_y - 0.3),
            (shield_x + 0.2, shield_y - 0.1),
            (shield_x + 0.2, shield_y + 0.1),
            (shield_x, shield_y + 0.3),
        ],
        [patches.Path.MOVETO] + [patches.Path.LINETO] * 5 + [patches.Path.CLOSEPOLY],
    ),
    facecolor="none",
    edgecolor="#0A1628",
    linewidth=2,
    capstyle="round",
)
ax.add_patch(shield)
ax.text(shield_x, shield_y - 0.5, "Shield", fontsize=8, ha="center", color="#64748B")

# Clock icon
clock_x, clock_y = 3.5, 0.8
circle = plt.Circle(
    (clock_x, clock_y), 0.25, fill=False, edgecolor="#0A1628", linewidth=2
)
ax.add_patch(circle)
ax.plot([clock_x, clock_x], [clock_y, clock_y + 0.15], color="#0A1628", linewidth=2)
ax.plot([clock_x, clock_x + 0.1], [clock_y, clock_y], color="#0A1628", linewidth=2)
ax.text(clock_x, clock_y - 0.5, "Clock", fontsize=8, ha="center", color="#64748B")

# Check icon
check_x, check_y = 5.5, 0.8
ax.plot(
    [check_x - 0.15, check_x - 0.05, check_x + 0.2],
    [check_y, check_y - 0.1, check_y + 0.15],
    color="#00D4AA",
    linewidth=2.5,
)
ax.text(check_x, check_y - 0.5, "Check", fontsize=8, ha="center", color="#64748B")

# Spacing Guidelines
ax.text(8, 2.3, "SPACING SYSTEM", fontsize=12, weight="bold", color="#0A1628")
ax.text(8, 1.9, "Base unit: 8px", fontsize=9, color="#64748B")
ax.text(8, 1.6, "Card padding: 24px (3 units)", fontsize=9, color="#64748B")
ax.text(8, 1.3, "Section gap: 48px (6 units)", fontsize=9, color="#64748B")
ax.text(8, 1.0, "Button padding: 16px 24px", fontsize=9, color="#64748B")

plt.tight_layout()
plt.savefig(
    "ginva_moodboard_typography.png",
    dpi=150,
    bbox_inches="tight",
    facecolor="white",
    edgecolor="none",
)
plt.close()
print("✅ Mood Board: Typography & Components สร้างเสร็จแล้ว!")
