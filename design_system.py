import matplotlib.pyplot as plt
import matplotlib.patches as patches
from matplotlib.patches import FancyBboxPatch, Rectangle, Circle
import numpy as np

fig, ax = plt.subplots(figsize=(16, 12))
ax.set_xlim(0, 16)
ax.set_ylim(0, 12)
ax.axis("off")

# Title
ax.text(
    8,
    11.5,
    "GINVA DESIGN SYSTEM",
    fontsize=22,
    weight="bold",
    ha="center",
    color="#0A1628",
)
ax.text(
    8,
    10.9,
    "Complete Component & Token Library",
    fontsize=12,
    ha="center",
    color="#64748B",
)

# ========== COLORS ==========
ax.text(0.5, 10.3, "COLORS", fontsize=11, weight="bold", color="#0A1628")

colors = [
    ("Navy", "#0A1628", "Primary Dark"),
    ("Gold", "#D4AF37", "Primary CTA"),
    ("Cyan", "#00D4AA", "Success"),
    ("Slate", "#1E293B", "Secondary"),
    ("Silver", "#94A3B8", "Muted"),
    ("Amber", "#F59E0B", "Warning"),
    ("Green", "#10B981", "Safe"),
    ("Red", "#EF4444", "Danger"),
]

for i, (name, hex_val, desc) in enumerate(colors):
    x = 0.5 + (i % 4) * 3.8
    y = 9.8 - (i // 4) * 0.7

    color_box = FancyBboxPatch(
        (x, y - 0.25),
        0.8,
        0.5,
        boxstyle="round,pad=0.02",
        facecolor=hex_val,
        edgecolor="white",
        linewidth=1,
    )
    ax.add_patch(color_box)

    ax.text(x + 1, y + 0.05, name, fontsize=9, weight="bold", color="#0A1628")
    ax.text(x + 1, y - 0.2, hex_val, fontsize=7, color="#64748B", family="monospace")

# ========== TYPOGRAPHY ==========
ax.text(0.5, 8.3, "TYPOGRAPHY", fontsize=11, weight="bold", color="#0A1628")

type_fonts = [
    ("Space Grotesk", "Display / Logo", "48px", "#D4AF37"),
    ("Inter", "Headings / Body", "24px", "#0A1628"),
    ("JetBrains Mono", "Numbers / Data", "20px", "#00D4AA"),
]

for i, (font, usage, size, color) in enumerate(type_fonts):
    y = 7.8 - i * 0.6

    ax.text(0.5, y, font, fontsize=11, weight="bold", color="#0A1628")
    ax.text(3.5, y, usage, fontsize=9, color="#64748B")
    ax.text(8, y, size, fontsize=9, weight="bold", color=color)

# ========== BUTTONS ==========
ax.text(0.5, 5.8, "BUTTONS", fontsize=11, weight="bold", color="#0A1628")

# Primary
btn1 = FancyBboxPatch(
    (0.5, 5.0),
    2.5,
    0.6,
    boxstyle="round,pad=0.05",
    facecolor="#D4AF37",
    edgecolor="none",
)
ax.add_patch(btn1)
ax.text(
    1.75,
    5.3,
    "Primary",
    fontsize=10,
    weight="bold",
    ha="center",
    va="center",
    color="white",
)

# Secondary
btn2 = FancyBboxPatch(
    (3.5, 5.0),
    2.5,
    0.6,
    boxstyle="round,pad=0.05",
    facecolor="white",
    edgecolor="#0A1628",
    linewidth=1.5,
)
ax.add_patch(btn2)
ax.text(
    4.75,
    5.3,
    "Secondary",
    fontsize=10,
    weight="bold",
    ha="center",
    va="center",
    color="#0A1628",
)

# Success
btn3 = FancyBboxPatch(
    (6.5, 5.0),
    2.5,
    0.6,
    boxstyle="round,pad=0.05",
    facecolor="#10B981",
    edgecolor="none",
)
ax.add_patch(btn3)
ax.text(
    7.75,
    5.3,
    "Success",
    fontsize=10,
    weight="bold",
    ha="center",
    va="center",
    color="white",
)

# Danger
btn4 = FancyBboxPatch(
    (9.5, 5.0),
    2.5,
    0.6,
    boxstyle="round,pad=0.05",
    facecolor="#EF4444",
    edgecolor="none",
)
ax.add_patch(btn4)
ax.text(
    10.75,
    5.3,
    "Danger",
    fontsize=10,
    weight="bold",
    ha="center",
    va="center",
    color="white",
)

# Disabled
btn5 = FancyBboxPatch(
    (12.5, 5.0),
    2.5,
    0.6,
    boxstyle="round,pad=0.05",
    facecolor="#E2E8F0",
    edgecolor="none",
)
ax.add_patch(btn5)
ax.text(
    13.75,
    5.3,
    "Disabled",
    fontsize=10,
    weight="bold",
    ha="center",
    va="center",
    color="#94A3B8",
)

# ========== COMPONENTS ==========
ax.text(0.5, 4.3, "COMPONENTS", fontsize=11, weight="bold", color="#0A1628")

# Card
card = FancyBboxPatch(
    (0.5, 3.0),
    3,
    1.1,
    boxstyle="round,pad=0.05",
    facecolor="white",
    edgecolor="#E2E8F0",
    linewidth=1,
)
ax.add_patch(card)
ax.text(2, 3.75, "Card", fontsize=9, weight="bold", ha="center", color="#0A1628")
ax.text(2, 3.4, "Content here", fontsize=8, ha="center", color="#64748B")

# Input
input_f = FancyBboxPatch(
    (4, 3.3),
    3,
    0.6,
    boxstyle="round,pad=0.03",
    facecolor="white",
    edgecolor="#CBD5E1",
    linewidth=1,
)
ax.add_patch(input_f)
ax.text(4.3, 3.5, "Input field...", fontsize=9, color="#94A3B8")

# Badge
badge = FancyBboxPatch(
    (7.5, 3.5),
    1.5,
    0.4,
    boxstyle="round,pad=0.02",
    facecolor="#F0FDF4",
    edgecolor="#00D4AA",
    linewidth=1,
)
ax.add_patch(badge)
ax.text(8.25, 3.6, "Active", fontsize=8, weight="bold", ha="center", color="#059669")

# Progress bar
bar_bg = FancyBboxPatch(
    (9.5, 3.5),
    3,
    0.25,
    boxstyle="round,pad=0.02",
    facecolor="#E2E8F0",
    edgecolor="none",
)
ax.add_patch(bar_bg)
bar_fill = FancyBboxPatch(
    (9.5, 3.5),
    1.5,
    0.25,
    boxstyle="round,pad=0.02",
    facecolor="#10B981",
    edgecolor="none",
)
ax.add_patch(bar_fill)
ax.text(11, 3.9, "Progress", fontsize=8, color="#64748B")

# Toggle
toggle_bg = FancyBboxPatch(
    (13, 3.5),
    0.8,
    0.35,
    boxstyle="round,pad=0.02",
    facecolor="#10B981",
    edgecolor="none",
)
ax.add_patch(toggle_bg)
toggle_circle = Circle((13.6, 3.68), 0.12, facecolor="white")
ax.add_patch(toggle_circle)
ax.text(14, 3.9, "Toggle", fontsize=8, color="#64748B")

# Alert states
alerts = [
    ("Safe", "#DCFCE7", "#10B981"),
    ("Warning", "#FEF3C7", "#F59E0B"),
    ("Critical", "#FEE2E2", "#EF4444"),
    ("Info", "#E0F2FE", "#0EA5E9"),
]

for i, (label, bg, border) in enumerate(alerts):
    x = 0.5 + i * 3.9

    alert = FancyBboxPatch(
        (x, 2.1),
        3.3,
        0.5,
        boxstyle="round,pad=0.03",
        facecolor=bg,
        edgecolor=border,
        linewidth=1,
    )
    ax.add_patch(alert)
    ax.text(x + 1.65, 2.35, label, fontsize=9, weight="bold", ha="center", color=border)

# ========== SPACING ==========
ax.text(0.5, 1.5, "SPACING", fontsize=11, weight="bold", color="#0A1628")

ax.text(0.5, 1.0, "Base unit: 8px", fontsize=9, color="#64748B")
ax.text(3.5, 1.0, "Card padding: 24px", fontsize=9, color="#64748B")
ax.text(6.5, 1.0, "Section gap: 48px", fontsize=9, color="#64748B")
ax.text(10, 1.0, "Button padding: 16px 24px", fontsize=9, color="#64748B")

# ========== CORNER RADIUS ==========
ax.text(0.5, 0.4, "CORNER RADIUS", fontsize=11, weight="bold", color="#0A1628")
ax.text(
    4.5, 0.4, "Buttons: 8px | Cards: 12px | Inputs: 6px", fontsize=9, color="#64748B"
)

plt.tight_layout()
plt.savefig(
    "ginva_design_system.png",
    dpi=150,
    bbox_inches="tight",
    facecolor="white",
    edgecolor="none",
)
plt.close()
print("✅ Design System Documentation สร้างเสร็จแล้ว!")
