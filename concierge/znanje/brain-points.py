"""Builds media/znanje/brain-points.bin: a 3D point cloud of the brain reconstructed from three
orthographic views (side facing left, top with the front up, front). Each view contributes surface
points; the other two views give the missing depth. Run: python3 concierge/znanje/brain-points.py"""
import numpy as np
from PIL import Image, ImageFilter
rng = np.random.default_rng(7)
src = 'concierge/znanje/source/'
def load(name):
    im = Image.open(src + name).convert('L')
    lum = np.asarray(im, dtype=np.float32) / 255
    mask = np.asarray(im.filter(ImageFilter.GaussianBlur(9)), dtype=np.float32) > 14
    ys, xs = np.nonzero(mask)
    return lum, mask, (xs.min(), xs.max(), ys.min(), ys.max())
S, Sm, sb = load('brain-side.webp'); T, Tm, tb = load('brain-top.webp'); F, Fm, fb = load('brain-front.webp')
HALF_Z, TOP_Y = 0.95, 0.66
# side: z from columns (front = left), y from rows
s_scale = (sb[1] - sb[0]) / (2 * HALF_Z); s_cx = (sb[0] + sb[1]) / 2
# top: drop the brain stem (narrow rows at the bottom) before measuring length
widths = Tm.sum(axis=1); rows = np.nonzero(widths > widths.max() * 0.22)[0]
t_scale = (rows.max() - rows.min()) / (2 * HALF_Z); t_cz = (rows.max() + rows.min()) / 2; t_cx = (tb[0] + tb[1]) / 2
half_x = (tb[1] - tb[0]) / 2 / t_scale
f_scale = (fb[1] - fb[0]) / (2 * half_x); f_cx = (fb[0] + fb[1]) / 2
def inside(mask, px, py):
    px = np.round(px).astype(int); py = np.round(py).astype(int)
    ok = (px >= 0) & (px < mask.shape[1]) & (py >= 0) & (py < mask.shape[0])
    out = np.zeros(px.shape, bool); out[ok] = mask[py[ok], px[ok]]; return out
in_side = lambda z, y: inside(Sm, s_cx - z * s_scale, sb[2] + (TOP_Y - y) * s_scale)
in_top = lambda x, z: inside(Tm, t_cx + x * t_scale, t_cz - z * t_scale)
in_front = lambda x, y: inside(Fm, f_cx + x * f_scale, fb[2] + (TOP_Y - y) * f_scale)
def sample(lum, mask, n):
    w = (lum ** 2.3) * mask; w = w.ravel() / w.sum()
    idx = rng.choice(w.size, n, p=w); return idx % lum.shape[1], idx // lum.shape[1], lum.ravel()[idx]
steps = np.linspace(1.2, 0, 240)
def outermost(test):  # largest extent along the hidden axis that both other views accept
    for v in steps:
        if test(v): return v
    return None
pts = []
def add(x, y, z, b): pts.append((x, y, z, b))
px, py, b = sample(S, Sm, 6200)
for u, v, l in zip(px, py, b):
    z = (s_cx - u) / s_scale; y = TOP_Y - (v - sb[2]) / s_scale
    x = outermost(lambda x: in_top(np.array(x), np.array(z)) and in_front(np.array(x), np.array(y)))
    x = x if x is not None else abs(rng.normal(0, 0.05))   # stem and cerebellum edge
    add(x * rng.choice([-1, 1]) * rng.uniform(0.94, 1), y, z, l)
px, py, b = sample(T, Tm, 4200)
for u, v, l in zip(px, py, b):
    x = (u - t_cx) / t_scale; z = (t_cz - v) / t_scale
    y = outermost(lambda y: in_side(np.array(z), np.array(y)) and in_front(np.array(x), np.array(y)))
    if y is not None: add(x, y * rng.uniform(0.96, 1), z, l)
px, py, b = sample(F, Fm, 3600)
for i, (u, v, l) in enumerate(zip(px, py, b)):
    x = (u - f_cx) / f_scale; y = TOP_Y - (v - fb[2]) / f_scale
    sign = 1 if i % 3 else -1   # a third of them wrap the back of the head
    z = outermost(lambda z: in_side(np.array(sign * z), np.array(y)) and in_top(np.array(x), np.array(sign * z)))
    if z is not None: add(x, y, sign * z * rng.uniform(0.96, 1), l)
P = np.array(pts, dtype=np.float32); rng.shuffle(P)
P[:, 1] -= 0.02
print(len(P), 'points', 'x', P[:, 0].min(), P[:, 0].max(), 'y', P[:, 1].min(), P[:, 1].max(), 'z', P[:, 2].min(), P[:, 2].max())
out = np.empty((len(P), 4), dtype='<i2'); out[:, :3] = np.round(P[:, :3] * 20000); out[:, 3] = np.round(P[:, 3] * 32767)
out.tofile('media/znanje/brain-points.bin')
# preview of the three projections for a visual check
import sys
if len(sys.argv) > 1:
    img = np.zeros((500, 1500), np.float32)
    for k, (a, c, flip) in enumerate([(2, 1, -1), (0, 2, 1), (0, 1, 1)]):
        u = (250 + flip * P[:, a] * 220 + k * 500).astype(int); v = (250 - P[:, c] * 220).astype(int)
        np.add.at(img, (v.clip(0, 499), u.clip(0, 1499)), 0.5)
    Image.fromarray((img.clip(0, 1) * 255).astype(np.uint8)).save(sys.argv[1])
