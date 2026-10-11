"""Derives the X stage layers from the approved X environment (run: python concierge/x-stage-assets.py).

The untouched environment stays the base plate. The light map keeps only the X's own highlights (edges,
crossing flare, inner triangle and its reflection) so the "talking" glow is the monolith lighting itself up,
pixel-aligned with the plate. Coordinates are source pixels (1536x1024) and mirror concierge/x-stage.mjs.
"""
from pathlib import Path
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

SRC = Path('ai-concierge-preview/media/concierge-environment.webp')
OUT = Path('media/x-stage')
W, H = 1536, 1024
X_POLY = [(524, 377), (650, 377), (767.5, 505), (885, 377), (1010, 377), (882, 518), (1022, 667), (872, 666),
          (767.5, 557), (662, 666), (512, 667), (652, 518)]
WATER_Y = 682  # plinth waterline; the reflection mirrors the X around it


def mask():
    """Soft region: the X (slightly dilated), its plinth rim and its reflection. Side walls stay unlit."""
    m = Image.new('L', (W, H), 0)
    d = ImageDraw.Draw(m)
    d.polygon(X_POLY, fill=255)
    d.ellipse((418, 660, 1118, 700), fill=210)
    reflection = [(x, 2 * WATER_Y - y) for x, y in X_POLY]
    d.polygon(reflection, fill=150)
    m = m.filter(ImageFilter.MaxFilter(31)).filter(ImageFilter.GaussianBlur(26))
    fade = np.clip((1000 - np.arange(H)) / 260, 0, 1)[:, None]  # reflection dies out towards the bottom edge
    return np.asarray(m, dtype=np.float32) / 255 * np.where(np.arange(H)[:, None] > WATER_Y, fade, 1)


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    plate = Image.open(SRC).convert('RGB')
    assert plate.size == (W, H), plate.size
    for width in (768, 1152, 1536):
        img = plate if width == W else plate.resize((width, width * H // W), Image.LANCZOS)
        img.save(OUT / f'environment-{width}.webp', quality=80, method=6)
        img.save(OUT / f'environment-{width}.avif', quality=58, speed=4)

    rgb = np.asarray(plate, dtype=np.float32) / 255
    lum = rgb @ np.array([0.2126, 0.7152, 0.0722], dtype=np.float32)
    highlight = np.clip((lum - 0.34) / 0.66, 0, 1) ** 1.35
    light = rgb * (highlight * mask())[..., None]
    # Neutral white-grey, like the plate's own light: pull warm tints towards silver.
    grey = light.mean(axis=2, keepdims=True)
    light = np.clip((light * 0.35 + grey * 0.65) * 1.25, 0, 1)
    light_img = Image.fromarray((light * 255).astype(np.uint8))
    light_img.save(OUT / 'light-1536.webp', quality=78, method=6)

    small = light_img.resize((768, 512), Image.LANCZOS)
    bloom = np.asarray(small.filter(ImageFilter.GaussianBlur(22)), dtype=np.float32) / 255 * 2.6
    wide = np.asarray(small.filter(ImageFilter.GaussianBlur(70)), dtype=np.float32) / 255 * 3.2
    yy, xx = np.mgrid[0:512, 0:768].astype(np.float32)
    halo = np.exp(-(((xx - 384) / 250) ** 2 + ((yy - 258) / 150) ** 2))[..., None] * 0.22
    bloom_img = Image.fromarray((np.clip(bloom + wide + halo, 0, 1) * 255).astype(np.uint8))
    bloom_img.save(OUT / 'bloom-768.webp', quality=70, method=6)

    # Social card 1200x630, centred on the X.
    og = plate.crop((96, 146, 1440, 852)).resize((1200, 630), Image.LANCZOS)
    og.save(OUT / 'og-ai-asistent.jpg', quality=84, optimize=True, progressive=True)
    for f in sorted(OUT.iterdir()):
        print(f'{f.name}: {f.stat().st_size // 1024} KB')


if __name__ == '__main__':
    main()
