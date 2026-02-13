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
    "MOBILE RESPONSIVE PREVIEW",
    fontsize=18,
    weight="bold",
    ha="center",
    color="#0A1628",
)
ax.text(
    7,
    9.1,
    "375px width viewport • Touch-friendly • Thumb zone optimized",
    fontsize=10,
    ha="center",
    color="#64748B",
)

# Phone frames
phones = [
    {"x": 1, "label": "Landing (Collapsed)"},
    {"x": 5.5, "label": "Borrow (Step 1)"},
    {"x": 10, "label": "Protection (Alert)"},
]

for phone in phones:
    # Phone frame
    frame = FancyBboxPatch(
        (phone["x"], 1),
        3.5,
        7.5,
        boxstyle="round,pad=0.1",
        facecolor="#0A1628",
        edgecolor="#1E293B",
        linewidth=3,
    )
    ax.add_patch(frame)

    # Screen
    screen = Rectangle(
        (phone["x"] + 0.2, 1.3), 3.1, 6.9, facecolor="white", edgecolor="none"
    )
    ax.add_patch(screen)

    # Notch
    notch = Rectangle(
        (phone["x"] + 1.2, 8.0), 1.1, 0.15, facecolor="#0A1628", edgecolor="none"
    )
    ax.add_patch(notch)

    # Home indicator
    home = Rectangle((phone["x"] + 1.4, 1.4), 0.7, 0.05, facecolor="#0A1628", alpha=0.3)
    ax.add_patch(home)

    # Content based on screen type
    if "Landing" in phone["label"]:
        # Logo
        ax.text(
            phone["x"] + 1.75,
            7.5,
            "G",
            fontsize=16,
            weight="bold",
            ha="center",
            color="#D4AF37",
        )
        ax.text(
            phone["x"] + 1.75,
            6.8,
            "Get Instant Cash",
            fontsize=9,
            weight="bold",
            ha="center",
            color="#0A1628",
        )
        ax.text(
            phone["x"] + 1.75,
            6.3,
            "Keep Crypto Safe",
            fontsize=9,
            weight="bold",
            ha="center",
            color="#0A1628",
        )

        # CTA
        cta = FancyBboxPatch(
            (phone["x"] + 0.5, 5.2),
            2.5,
            0.6,
            boxstyle="round,pad=0.05",
            facecolor="#D4AF37",
            edgecolor="none",
        )
        ax.add_patch(cta)
        ax.text(
            phone["x"] + 1.75,
            5.5,
            "Start Borrowing",
            fontsize=8,
            weight="bold",
            ha="center",
            va="center",
            color="white",
        )

        # Stats stacked
        ax.text(
            phone["x"] + 1.75,
            4.5,
            "$2.4M TVL",
            fontsize=8,
            ha="center",
            color="#0A1628",
        )
        ax.text(
            phone["x"] + 1.75,
            4.0,
            "0 Liquidations",
            fontsize=8,
            ha="center",
            color="#10B981",
        )

    elif "Borrow" in phone["label"]:
        # Header
        ax.text(
            phone["x"] + 1.75,
            7.5,
            "Select Collateral",
            fontsize=9,
            weight="bold",
            ha="center",
            color="#0A1628",
        )

        # Progress dots
        for i in range(3):
            color = "#0A1628" if i == 0 else "#CBD5E1"
            dot = Circle((phone["x"] + 0.8 + i * 0.8, 6.8), 0.08, facecolor=color)
            ax.add_patch(dot)

        # Asset cards (stacked)
        assets = [("SOL", "$142.50", True), ("BTC", "$67,240", False)]
        for i, (sym, price, sel) in enumerate(assets):
            y = 5.8 - i * 1.2
            bg_color = "#F0FDF4" if sel else "white"
            border = "#00D4AA" if sel else "#E2E8F0"
            card = FancyBboxPatch(
                (phone["x"] + 0.4, y - 0.4),
                2.7,
                0.9,
                boxstyle="round,pad=0.05",
                facecolor=bg_color,
                edgecolor=border,
                linewidth=1,
            )
            ax.add_patch(card)
            ax.text(
                phone["x"] + 0.7,
                y + 0.1,
                sym,
                fontsize=10,
                weight="bold",
                color="#0A1628",
            )
            ax.text(
                phone["x"] + 2.5,
                y + 0.1,
                price,
                fontsize=9,
                ha="right",
                color="#64748B",
            )

            if sel:
                check = Circle((phone["x"] + 2.8, y + 0.2), 0.1, facecolor="#00D4AA")
                ax.add_patch(check)

        # Amount input
        ax.text(phone["x"] + 0.5, 3.0, "Amount", fontsize=8, color="#64748B")
        input_bg = FancyBboxPatch(
            (phone["x"] + 0.4, 2.4),
            2.7,
            0.5,
            boxstyle="round,pad=0.05",
            facecolor="white",
            edgecolor="#CBD5E1",
            linewidth=1,
        )
        ax.add_patch(input_bg)
        ax.text(
            phone["x"] + 0.7, 2.65, "5.5", fontsize=12, weight="bold", color="#0A1628"
        )
        ax.text(phone["x"] + 2.8, 2.65, "SOL", fontsize=9, ha="right", color="#64748B")

    else:  # Protection
        # Alert header
        alert_bg = Rectangle((phone["x"] + 0.2, 6.5), 3.1, 1.5, facecolor="#FEF3C7")
        ax.add_patch(alert_bg)
        ax.text(
            phone["x"] + 1.75,
            7.6,
            "!",
            fontsize=14,
            ha="center",
            color="#F59E0B",
            weight="bold",
        )
        ax.text(
            phone["x"] + 1.75,
            7.1,
            "Protection Mode",
            fontsize=8,
            weight="bold",
            ha="center",
            color="#92400E",
        )
        ax.text(
            phone["x"] + 1.75,
            6.7,
            "68:42:15 left",
            fontsize=10,
            weight="bold",
            ha="center",
            color="#92400E",
        )

        # Status card
        card = FancyBboxPatch(
            (phone["x"] + 0.4, 4.8),
            2.7,
            1.3,
            boxstyle="round,pad=0.05",
            facecolor="#FEF3C7",
            edgecolor="#F59E0B",
            linewidth=1,
        )
        ax.add_patch(card)
        ax.text(
            phone["x"] + 1.75,
            5.7,
            "Hour 4 of 72",
            fontsize=9,
            weight="bold",
            ha="center",
            color="#92400E",
        )
        ax.text(
            phone["x"] + 1.75,
            5.3,
            "You have time",
            fontsize=8,
            ha="center",
            color="#B45309",
        )

        # Price info
        ax.text(phone["x"] + 0.5, 4.3, "Current: $89.50", fontsize=8, color="#0A1628")
        ax.text(
            phone["x"] + 0.5, 3.9, "Liquidation: $95.00", fontsize=8, color="#64748B"
        )

        # Action button
        btn = FancyBboxPatch(
            (phone["x"] + 0.4, 2.8),
            2.7,
            0.6,
            boxstyle="round,pad=0.05",
            facecolor="#10B981",
            edgecolor="none",
        )
        ax.add_patch(btn)
        ax.text(
            phone["x"] + 1.75,
            3.1,
            "Add Collateral",
            fontsize=9,
            weight="bold",
            ha="center",
            va="center",
            color="white",
        )

    # Label below phone
    ax.text(
        phone["x"] + 1.75,
        0.5,
        phone["label"],
        fontsize=9,
        weight="bold",
        ha="center",
        color="#0A1628",
    )

# Thumb zone indicator
ax.text(
    7,
    0.2,
    "[*] Thumb Zone: Primary actions placed in bottom 25% of screen",
    fontsize=9,
    ha="center",
    color="#64748B",
)

plt.tight_layout()
plt.savefig(
    "ginva_mobile_preview.png",
    dpi=150,
    bbox_inches="tight",
    facecolor="white",
    edgecolor="none",
)
plt.close()
print("✅ Mobile Responsive Preview สร้างเสร็จแล้ว!")
