import matplotlib.pyplot as plt
import matplotlib.patches as patches
from matplotlib.patches import FancyBboxPatch, Rectangle
import numpy as np

fig, ax = plt.subplots(figsize=(16, 10))
ax.set_xlim(0, 16)
ax.set_ylim(0, 10)
ax.axis("off")

bg = Rectangle((0, 0), 16, 10, facecolor="#FAFBFC")
ax.add_patch(bg)

ax.text(
    8,
    9.5,
    "A/B TEST: CTA BUTTON COLORS",
    fontsize=20,
    weight="bold",
    ha="center",
    color="#0A1628",
)
ax.text(
    8,
    9.0,
    "Testing which button color drives more conversions",
    fontsize=12,
    ha="center",
    color="#64748B",
)

# Version A - Gold
version_a = FancyBboxPatch(
    (1, 4.5),
    6,
    4.5,
    boxstyle="round,pad=0.1",
    facecolor="white",
    edgecolor="#D4AF37",
    linewidth=3,
)
ax.add_patch(version_a)

ax.text(4, 8.5, "VERSION A", fontsize=14, weight="bold", ha="center", color="#D4AF37")
ax.text(4, 8.0, "Gold Button", fontsize=11, ha="center", color="#64748B")

# Hero text
ax.text(
    4,
    7.2,
    "Get Instant Cash.",
    fontsize=18,
    weight="bold",
    ha="center",
    color="#0A1628",
)
ax.text(
    4,
    6.7,
    "Keep Your Crypto Safe.",
    fontsize=18,
    weight="bold",
    ha="center",
    color="#0A1628",
)

# Gold button
gold_btn = FancyBboxPatch(
    (2.5, 5.5), 3, 0.8, boxstyle="round,pad=0.05", facecolor="#D4AF37", edgecolor="none"
)
ax.add_patch(gold_btn)
ax.text(
    4,
    5.9,
    "Start Borrowing",
    fontsize=13,
    weight="bold",
    ha="center",
    va="center",
    color="white",
)

ax.text(
    4,
    4.9,
    "Color: #D4AF37",
    fontsize=10,
    ha="center",
    color="#64748B",
    family="monospace",
)

# Version B - Green
version_b = FancyBboxPatch(
    (9, 4.5),
    6,
    4.5,
    boxstyle="round,pad=0.1",
    facecolor="white",
    edgecolor="#10B981",
    linewidth=3,
)
ax.add_patch(version_b)

ax.text(12, 8.5, "VERSION B", fontsize=14, weight="bold", ha="center", color="#10B981")
ax.text(12, 8.0, "Green Button", fontsize=11, ha="center", color="#64748B")

# Hero text
ax.text(
    12,
    7.2,
    "Get Instant Cash.",
    fontsize=18,
    weight="bold",
    ha="center",
    color="#0A1628",
)
ax.text(
    12,
    6.7,
    "Keep Your Crypto Safe.",
    fontsize=18,
    weight="bold",
    ha="center",
    color="#0A1628",
)

# Green button
green_btn = FancyBboxPatch(
    (10.5, 5.5),
    3,
    0.8,
    boxstyle="round,pad=0.05",
    facecolor="#10B981",
    edgecolor="none",
)
ax.add_patch(green_btn)
ax.text(
    12,
    5.9,
    "Start Borrowing",
    fontsize=13,
    weight="bold",
    ha="center",
    va="center",
    color="white",
)

ax.text(
    12,
    4.9,
    "Color: #10B981",
    fontsize=10,
    ha="center",
    color="#64748B",
    family="monospace",
)

# Comparison notes
ax.text(8, 3.5, "HYPOTHESIS", fontsize=12, weight="bold", ha="center", color="#0A1628")

notes = [
    ('Gold: Premium, luxury feel - fits "valuable" proposition', "#D4AF37"),
    ('Green: Trust, safety, money - fits "protection" proposition', "#10B981"),
]

for i, (note, color) in enumerate(notes):
    x = 3 + i * 10
    ax.text(x, 3.0, note, fontsize=9, ha="center", color=color)

# Test setup
setup_box = FancyBboxPatch(
    (3, 0.8),
    10,
    1.8,
    boxstyle="round,pad=0.1",
    facecolor="#F8FAFC",
    edgecolor="#E2E8F0",
    linewidth=1,
)
ax.add_patch(setup_box)

ax.text(8, 2.3, "TEST SETUP", fontsize=11, weight="bold", ha="center", color="#0A1628")
ax.text(8, 1.9, "Traffic Split: 50% / 50%", fontsize=9, ha="center", color="#64748B")
ax.text(
    8,
    1.5,
    "Metrics: Click-through rate, Conversion rate, Time to first action",
    fontsize=9,
    ha="center",
    color="#64748B",
)
ax.text(
    8,
    1.1,
    "Duration: 1-2 weeks or until statistical significance (n=1000+)",
    fontsize=9,
    ha="center",
    color="#64748B",
)

plt.tight_layout()
plt.savefig(
    "ginva_ab_test_cta.png",
    dpi=150,
    bbox_inches="tight",
    facecolor="white",
    edgecolor="none",
)
plt.close()
print("A/B Test Mockup created!")
