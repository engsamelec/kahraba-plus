#!/usr/bin/env python3
"""Generate Kahraba Plus app icons & splash screens (navy bg + amber bolt)."""
import os

from PIL import Image, ImageDraw

NAVY = (30, 41, 59, 255)      # #1e293b
AMBER = (245, 158, 11, 255)   # #f59e0b

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PUBLIC_ICONS = os.path.join(ROOT, "frontend", "public", "icons")
ASSETS = os.path.join(ROOT, "frontend", "assets")
os.makedirs(PUBLIC_ICONS, exist_ok=True)
os.makedirs(ASSETS, exist_ok=True)

# Lightning bolt as fractions of the bolt bounding box (0..1)
BOLT = [
    (0.58, 0.04), (0.24, 0.56), (0.46, 0.56),
    (0.40, 0.96), (0.80, 0.40), (0.54, 0.40),
]


def draw_bolt(draw, cx, cy, size):
    """Draw an amber bolt centered at (cx, cy) fitting in a `size` box."""
    pts = [(cx - size / 2 + x * size, cy - size / 2 + y * size) for x, y in BOLT]
    draw.polygon(pts, fill=AMBER)


def rounded_bg(s, radius_frac=0.22, bg=NAVY):
    img = Image.new("RGBA", (s, s), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    r = int(s * radius_frac)
    d.rounded_rectangle([0, 0, s - 1, s - 1], radius=r, fill=bg)
    return img


def icon(s, maskable=False, rounded=True):
    if maskable:
        img = Image.new("RGBA", (s, s), NAVY)  # full bleed
        bolt = s * 0.50                          # within central safe zone
    else:
        img = rounded_bg(s) if rounded else Image.new("RGBA", (s, s), NAVY)
        bolt = s * 0.62
    d = ImageDraw.Draw(img)
    draw_bolt(d, s / 2, s / 2, bolt)
    return img


def splash(w=2732, h=2732):
    img = Image.new("RGBA", (w, h), NAVY)
    d = ImageDraw.Draw(img)
    draw_bolt(d, w / 2, h / 2, min(w, h) * 0.16)
    return img


# --- PWA / web icons ---
icon(192).save(os.path.join(PUBLIC_ICONS, "icon-192.png"))
icon(512).save(os.path.join(PUBLIC_ICONS, "icon-512.png"))
icon(512, maskable=True).save(os.path.join(PUBLIC_ICONS, "icon-maskable-512.png"))
icon(180).save(os.path.join(PUBLIC_ICONS, "apple-touch-icon.png"))

# --- @capacitor/assets sources (native icon + splash generation) ---
icon(1024, rounded=False).save(os.path.join(ASSETS, "icon-only.png"))
# foreground: transparent bg + bolt in central safe zone (for adaptive icons)
fg = Image.new("RGBA", (1024, 1024), (0, 0, 0, 0))
draw_bolt(ImageDraw.Draw(fg), 512, 512, 1024 * 0.45)
fg.save(os.path.join(ASSETS, "icon-foreground.png"))
Image.new("RGBA", (1024, 1024), NAVY).save(os.path.join(ASSETS, "icon-background.png"))
splash().save(os.path.join(ASSETS, "splash.png"))
splash().save(os.path.join(ASSETS, "splash-dark.png"))

print("Generated icons in:", PUBLIC_ICONS)
print("Generated capacitor assets in:", ASSETS)
for f in sorted(os.listdir(PUBLIC_ICONS)):
    print("  icons/", f)
for f in sorted(os.listdir(ASSETS)):
    print("  assets/", f)
