import matplotlib.pyplot as plt
import matplotlib.patches as patches
from matplotlib.patches import FancyBboxPatch, Rectangle
import numpy as np

fig, ax = plt.subplots(figsize=(16, 12))
ax.set_xlim(0, 16)
ax.set_ylim(0, 12)
ax.axis("off")

# Title
ax.text(
    8,
    11.5,
    "GINVA UX/UI DESIGN SYSTEM",
    fontsize=24,
    weight="bold",
    ha="center",
    color="#0A1628",
)
ax.text(
    8, 11.0, "Complete Wireframe Package", fontsize=14, ha="center", color="#64748B"
)

# Layout grid showing 3 main screens
screens = [
    {
        "title": "1. LANDING PAGE",
        "purpose": "First impression & conversion",
        "key_elements": [
            "• Hero: Value proposition",
            "• Live stats (0 liquidations)",
            "• 4-step process",
            "• Trust indicators",
        ],
        "color": "#D4AF37",
        "x": 1.5,
        "y": 6,
    },
    {
        "title": "2. BORROW FLOW",
        "purpose": "Smooth onboarding",
        "key_elements": [
            "• 3-step progress",
            "• Asset selection cards",
            "• Real-time LTV gauge",
            "• Loan summary",
        ],
        "color": "#00D4AA",
        "x": 6,
        "y": 6,
    },
    {
        "title": "3. PROTECTION MODE",
        "purpose": "Crisis management",
        "key_elements": [
            "• Countdown timer",
            "• Price monitoring",
            "• Timeline visualization",
            "• Action recommendations",
        ],
        "color": "#F59E0B",
        "x": 10.5,
        "y": 6,
    },
]

for screen in screens:
    # Screen card
    card = FancyBboxPatch(
        (screen["x"], screen["y"]),
        4,
        4.5,
        boxstyle="round,pad=0.1",
        facecolor="white",
        edgecolor=screen["color"],
        linewidth=3,
    )
    ax.add_patch(card)

    # Header bar
    header = Rectangle(
        (screen["x"], screen["y"] + 3.8),
        4,
        0.7,
        facecolor=screen["color"],
        alpha=0.1,
        edgecolor="none",
    )
    ax.add_patch(header)

    # Title
    ax.text(
        screen["x"] + 2,
        screen["y"] + 4.1,
        screen["title"],
        fontsize=12,
        weight="bold",
        ha="center",
        color=screen["color"],
    )

    # Purpose
    ax.text(
        screen["x"] + 2,
        screen["y"] + 3.4,
        screen["purpose"],
        fontsize=10,
        ha="center",
        color="#0A1628",
        weight="bold",
    )

    # Elements list
    for i, element in enumerate(screen["key_elements"]):
        ax.text(
            screen["x"] + 0.3,
            screen["y"] + 2.8 - i * 0.5,
            element,
            fontsize=9,
            color="#64748B",
        )

# Design Principles
principles_bg = FancyBboxPatch(
    (1.5, 1),
    13,
    4.5,
    boxstyle="round,pad=0.1",
    facecolor="#F8FAFC",
    edgecolor="#E2E8F0",
    linewidth=1,
)
ax.add_patch(principles_bg)

ax.text(
    8,
    5.2,
    "CORE DESIGN PRINCIPLES",
    fontsize=14,
    weight="bold",
    ha="center",
    color="#0A1628",
)

principles = [
    ("TRANSPARENCY", "Show all numbers upfront. No hidden fees.", "#00D4AA"),
    ("PROTECTION", "Visual safety cues. Calm colors in crisis.", "#D4AF37"),
    ("CLARITY", "One action per screen. Clear hierarchy.", "#0A1628"),
    ("TRUST", "Social proof. Real-time stats. No FUD.", "#10B981"),
]

for i, (title, desc, color) in enumerate(principles):
    x = 2.5 + (i % 2) * 6
    y = 4.0 if i < 2 else 2.2

    # Icon circle
    circle = plt.Circle(
        (x, y + 0.6), 0.2, facecolor=color, alpha=0.2, edgecolor=color, linewidth=2
    )
    ax.add_patch(circle)
    ax.text(
        x,
        y + 0.6,
        str(i + 1),
        fontsize=10,
        weight="bold",
        ha="center",
        va="center",
        color=color,
    )

    ax.text(x + 0.5, y + 0.7, title, fontsize=11, weight="bold", color="#0A1628")
    ax.text(x + 0.5, y + 0.3, desc, fontsize=9, color="#64748B")

# Footer
ax.text(
    8,
    0.5,
    "Ready for Figma implementation • Mobile-first • Dark mode ready",
    fontsize=10,
    ha="center",
    color="#94A3B8",
)

plt.tight_layout()
plt.savefig(
    "ginva_design_summary.png",
    dpi=150,
    bbox_inches="tight",
    facecolor="white",
    edgecolor="none",
)
plt.close()
print("✅ Design Summary สร้างเสร็จแล้ว!")
print("\n" + "=" * 60)
print("📦 GINVA UX/UI PACKAGE ทั้งหมดเสร็จสมบูรณ์!")
print("=" * 60)
