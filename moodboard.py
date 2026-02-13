import matplotlib.pyplot as plt
import matplotlib.patches as patches
from matplotlib.patches import FancyBboxPatch
import numpy as np

# Set up the figure
fig, ax = plt.subplots(figsize=(14, 10))
ax.set_xlim(0, 14)
ax.set_ylim(0, 10)
ax.axis("off")

# Title
ax.text(
    7,
    9.5,
    "🎨 GINVA MOOD BOARD: Protection + Transparency",
    fontsize=20,
    weight="bold",
    ha="center",
    color="#0A1628",
)
ax.text(
    7, 9.1, "Color Palette & Visual Language", fontsize=12, ha="center", color="#64748B"
)

# Color definitions
colors = {
    "GINVA Navy": "#0A1628",
    "GINVA Gold": "#D4AF37",
    "GINVA Cyan": "#00D4AA",
    "GINVA Slate": "#1E293B",
    "GINVA Silver": "#94A3B8",
    "Alert Amber": "#F59E0B",
    "Safe Green": "#10B981",
}

# Draw color swatches
y_pos = 7.5
for i, (name, color) in enumerate(colors.items()):
    x_pos = 1 + (i % 4) * 3.2
    if i == 4:
        y_pos = 4.5

    # Color box
    rect = FancyBboxPatch(
        (x_pos, y_pos),
        2.5,
        1.8,
        boxstyle="round,pad=0.05",
        facecolor=color,
        edgecolor="white",
        linewidth=2,
    )
    ax.add_patch(rect)

    # Color name
    ax.text(
        x_pos + 1.25,
        y_pos - 0.3,
        name,
        fontsize=9,
        ha="center",
        weight="bold",
        color="#0A1628",
    )
    ax.text(
        x_pos + 1.25,
        y_pos - 0.6,
        color,
        fontsize=8,
        ha="center",
        color="#64748B",
        family="monospace",
    )

# Visual keywords section
ax.text(1, 3.2, "🔑 VISUAL KEYWORDS", fontsize=14, weight="bold", color="#0A1628")

keywords = [
    ("🛡️", "Shield", "Protection, Safety, Guardian"),
    ("🔍", "Magnifier", "Transparency, Clarity, Inspection"),
    ("⏰", "Clock", "Time-based, 72hr, Patience"),
    ("💎", "Diamond", "Value, Clarity, Unbreakable"),
    ("🌊", "Wave", "Flow, Smooth, No friction"),
    ("🏛️", "Pillar", "Stability, Institution, Trust"),
]

for i, (emoji, title, desc) in enumerate(keywords):
    x = 1 + (i % 3) * 4.3
    y = 2.2 if i < 3 else 0.8

    ax.text(x, y + 0.5, emoji, fontsize=24, ha="center")
    ax.text(x, y, title, fontsize=11, weight="bold", ha="center", color="#0A1628")
    ax.text(x, y - 0.3, desc, fontsize=8, ha="center", color="#64748B")

# Inspiration notes
ax.text(10, 3.2, "✨ INSPIRATION", fontsize=14, weight="bold", color="#0A1628")
inspirations = [
    "Apple: Clean, confident",
    "Swiss Design: Grid, precision",
    "Fintech: Trust through data",
    "Nature: Coral reef (protection)",
]

for i, text in enumerate(inspirations):
    ax.text(10, 2.5 - i * 0.4, f"• {text}", fontsize=9, color="#475569")

plt.tight_layout()
plt.savefig(
    "ginva_moodboard_colors.png",
    dpi=150,
    bbox_inches="tight",
    facecolor="white",
    edgecolor="none",
)
plt.close()
print("✅ Mood Board: Color Palette สร้างเสร็จแล้ว!")
