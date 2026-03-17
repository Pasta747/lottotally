from PIL import Image, ImageOps
from pathlib import Path

OUT = Path('/root/PastaOS/CMO_Gary/brand-assets-prepared')
OUT.mkdir(parents=True, exist_ok=True)


def contain_on_canvas(src_path, out_path, fg_mode='keep', bg='#FFFFFF', size=400, pad=0.18, tint=None):
    src = Image.open(src_path).convert('RGBA')
    # Crop to non-white/non-transparent bounds
    bgref = Image.new('RGBA', src.size, (255,255,255,255))
    diff = ImageChops.difference(src, bgref)
    bbox = diff.getbbox() or (0,0,*src.size)
    src = src.crop(bbox)
    max_dim = int(size * (1 - 2*pad))
    src.thumbnail((max_dim, max_dim), Image.LANCZOS)

    if tint is not None:
        # Convert dark pixels to target tint, preserve alpha by using grayscale inverse as alpha mask
        gray = ImageOps.grayscale(src)
        alpha = src.getchannel('A') if 'A' in src.getbands() else gray.point(lambda p: 255)
        colored = Image.new('RGBA', src.size, tint)
        # Build a mask from non-white intensity (darker pixels = stronger)
        mask = ImageOps.invert(gray).point(lambda p: 255 if p > 12 else 0)
        colored.putalpha(mask)
        src = colored
        if alpha:
            src.putalpha(ImageChops.multiply(src.getchannel('A'), alpha))

    canvas = Image.new('RGBA', (size, size), bg)
    x = (size - src.width)//2
    y = (size - src.height)//2
    canvas.alpha_composite(src, (x, y))
    canvas.save(out_path)

from PIL import ImageChops

# Pinger: white mark on dark circle-like square avatar background
contain_on_canvas(
    '/root/PastaOS/products/pinger/brand/pinger-logo-final.png',
    OUT / 'pinger-x-profile-400.png',
    bg='#111111',
    size=400,
    pad=0.19,
    tint=(255,255,255,255),
)

# Alternate Pinger white background version
contain_on_canvas(
    '/root/PastaOS/products/pinger/brand/pinger-logo-final.png',
    OUT / 'pinger-x-profile-400-light.png',
    bg='#FFFFFF',
    size=400,
    pad=0.17,
    tint=None,
)

# Canopy: use stronger concept 003, recolor to white on brand green bg
contain_on_canvas(
    '/root/PastaOS/products/canopy-filter/brand/concepts/003-minimal-elegant-logo-mark-for-canopy-fil.png',
    OUT / 'canopy-x-profile-400.png',
    bg='#355F44',
    size=400,
    pad=0.2,
    tint=(255,255,255,255),
)

# Alternate Canopy white background version
contain_on_canvas(
    '/root/PastaOS/products/canopy-filter/brand/concepts/003-minimal-elegant-logo-mark-for-canopy-fil.png',
    OUT / 'canopy-x-profile-400-light.png',
    bg='#FFFFFF',
    size=400,
    pad=0.18,
    tint=None,
)

print('Wrote:')
for p in sorted(OUT.glob('*.png')):
    print(p)
