"""Derives the live-world plates from the exact stop frames (run: python concierge/world-plates.py).

The untouched stop frame is always the handoff image. These "clean" plates only appear once an object
is live, so painted rings, stars and tiles never show twice underneath their moving 3D counterparts.
Coordinates mirror concierge/shared/world-calibration.ts.
"""
from pathlib import Path
import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont

SRC = Path('concierge/source-assets/cinema-stops')
OUT = Path('ai-concierge-preview/media/cinema-v1/world')
X_OUTLINE = [(262, 88), (358, 83), (425, 172), (503, 82), (598, 90), (460, 221), (565, 350), (492, 349), (422, 262), (350, 349), (277, 349), (392, 220)]
SYS_OUTLINE = [(340, 258), (379, 254), (428, 297), (470, 254), (522, 258), (453, 322), (511, 385), (468, 385), (426, 345), (392, 385), (352, 385), (405, 322)]
TILES = [(158, 62, 276, 186), (299, 62, 416, 186), (447, 62, 565, 186), (586, 62, 707, 188)]


def load(name):
    return Image.open(SRC / f'{name}.png').convert('RGB')


def polygon_mask(size, shapes, grow):
    mask = Image.new('L', size, 0)
    draw = ImageDraw.Draw(mask)
    for shape in shapes:
        (draw.rectangle if len(shape) == 4 and isinstance(shape[0], int) else draw.polygon)(shape, fill=255)
    return mask.filter(ImageFilter.MaxFilter(grow * 2 + 1)) if grow else mask


def blur_axis(a, sigma, axis):
    # FFT Gaussian along one axis with reflected padding (no SciPy dependency).
    pad = int(sigma * 3)
    widths = [(0, 0)] * a.ndim
    widths[axis] = (pad, pad)
    padded = np.pad(a, widths, mode='reflect')
    n = padded.shape[axis]
    freq = np.fft.rfftfreq(n)
    kernel = np.exp(-2 * (np.pi * freq * sigma) ** 2)
    shape = [1] * a.ndim
    shape[axis] = kernel.size
    out = np.fft.irfft(np.fft.rfft(padded, axis=axis) * kernel.reshape(shape), n=n, axis=axis)
    return np.take(out, range(pad, pad + a.shape[axis]), axis=axis)


def fill(image, mask, scales=((3, 22), (8, 44), (20, 90), (60, 180))):
    """Anisotropic normalized convolution: vertical light columns keep running behind the tiles."""
    a = np.asarray(image, float)
    hole = np.asarray(mask) > 127
    valid = (~hole).astype(float)
    out = a.copy()
    remaining = hole.copy()
    for sx, sy in scales:
        den = blur_axis(blur_axis(valid, sx, 1), sy, 0)
        num = blur_axis(blur_axis(a * valid[..., None], sx, 1), sy, 0)
        est = num / np.maximum(den, 1e-6)[..., None]
        ok = remaining & (den > .04)
        out[ok] = est[ok]
        remaining &= ~ok
    return composite(image, Image.fromarray(np.clip(out, 0, 255).astype(np.uint8)), mask)


def peel(image, mask, soften=3):
    """Onion-peel fill: each side's colour grows inward and meets in the middle, so a rotating X
    uncovers the dark room beside its arms instead of an averaged grey ghost."""
    a = np.asarray(image, float)
    hole = np.asarray(mask) > 127
    known = ~hole
    out = a * known[..., None]
    while not known.all():
        acc = np.zeros_like(out)
        cnt = np.zeros(known.shape)
        for dy, dx in [(-1, 0), (1, 0), (0, -1), (0, 1), (-1, -1), (-1, 1), (1, -1), (1, 1)]:
            k = np.roll(known, (dy, dx), (0, 1))
            acc += np.roll(out, (dy, dx), (0, 1)) * k[..., None]
            cnt += k
        grow = ~known & (cnt > 0)
        out[grow] = acc[grow] / cnt[grow][..., None]
        known = known | grow
    patch = Image.fromarray(np.clip(out, 0, 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(soften))
    return composite(image, patch, mask)


def composite(base, patch, mask, feather=2.5):
    soft = mask.filter(ImageFilter.GaussianBlur(feather))
    return Image.composite(patch, base, soft)


def orb_clean(img):
    w, h = img.size
    yy, xx = np.mgrid[0:h, 0:w]
    d = np.hypot(xx - 427, yy - 242)
    inner = Image.fromarray(((d < 139) * 255).astype(np.uint8))
    # Stars and the painted front arc give way to the glass body; the live star field replaces them.
    # A low rank (not the median) keeps the glass as dark as the film between the stars.
    body = img.filter(ImageFilter.RankFilter(15, 55)).filter(ImageFilter.GaussianBlur(4))
    out = composite(img, body, inner, 3)
    # Thin ring strokes and specks outside the rim are removed; broad beams and haze survive a 9px median.
    halo = Image.fromarray((((d >= 151) & (d < 300) & (yy < 338)) * 255).astype(np.uint8))
    return composite(out, out.filter(ImageFilter.MedianFilter(9)), halo, 4)


def save(img, name):
    OUT.mkdir(parents=True, exist_ok=True)
    img.save(OUT / f'{name}-864.webp', quality=88, method=6)
    img.resize((640, 368), Image.LANCZOS).save(OUT / f'{name}-640.webp', quality=88, method=6)


def board(frames):
    font = ImageFont.load_default()
    tw, th = 432, 248
    sheet = Image.new('RGB', (tw * 3 + 40, th * 2 + 150), (3, 3, 3))
    d = ImageDraw.Draw(sheet)
    d.text((10, 8), 'DIGITAL X - THREE CHECKPOINT REFERENCE BOARD (source 864x496, 24 fps)', fill=(241, 247, 252), font=font)
    for i, (title, stop, cont, note) in enumerate(frames):
        x = 10 + i * (tw + 10)
        sheet.paste(load(stop).resize((tw, th)), (x, 30))
        sheet.paste(load(cont).resize((tw, th)), (x, 30 + th + 40))
        d.text((x, 30 + th + 6), f'{title} STOP - {note[0]}', fill=(171, 190, 226), font=font)
        d.text((x, 30 + th * 2 + 46), f'CONTINUE - {note[1]}', fill=(171, 190, 226), font=font)
        d.text((x, 30 + th * 2 + 62), note[2], fill=(120, 132, 150), font=font)
    sheet.save(SRC / '00_DIGITAL_X_THREE_CHECKPOINT_REFERENCE_BOARD.png')


if __name__ == '__main__':
    orb = orb_clean(load('01_ORB_STOP_FRAME'))
    save(orb, 'orb-clean')
    # The floating orb is its own film-mapped layer; underneath it the room continues without the sphere.
    w, h = orb.size
    yy, xx = np.mgrid[0:h, 0:w]
    save(peel(orb, Image.fromarray((((np.hypot(xx - 427, yy - 242) < 156) & (yy < 346)) * 255).astype(np.uint8)), 12), 'orb-hole')
    x = load('02_X_STOP_FRAME')
    save(peel(x, polygon_mask(x.size, [X_OUTLINE], 6)), 'x-clean')
    s = load('03_ENGINE_STOP_FRAME')
    s = fill(s, polygon_mask(s.size, TILES, 6))
    save(peel(s, polygon_mask(s.size, [SYS_OUTLINE], 5)), 'system-clean')
    board([
        ('01 ORB', '01_ORB_STOP_FRAME', '01_ORB_CONTINUE_FRAME', ('klip1 f240 @10.000s (pre f239)', 'klip2 f0 @0.000s', 'sphere c(427,242) r145, FOV 32')),
        ('02 X', '02_X_STOP_FRAME', '02_X_CONTINUE_FRAME', ('klip2 f192 @8.000s (pre f191)', 'klip3 f0 @0.000s', 'X pivot (430,222); release zoom 1.04')),
        ('03 ENGINE', '03_ENGINE_STOP_FRAME', '03_ENGINE_STOP_FRAME', ('klip3 f192 @8.000s (pre f191)', 'convergence holds this frame', 'tiles y62-188; floor rings c(430,410)')),
    ])
    print('World plates written to', OUT)
