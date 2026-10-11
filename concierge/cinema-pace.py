# Measures how much each cinema frame changes from the previous one (mean absolute luma difference, 0–255,
# on the 864 px ladder) and stores it in the manifest as `motion` (motion[0] = 0). The scroll timeline uses it
# to give visually dense frames (the ORB forming, the ORB bursting into the X, the X growing its network)
# more scroll distance than near-static frames. Re-run whenever the frame ladder changes:
#   python concierge/cinema-pace.py
import json
from pathlib import Path

import numpy as np
from PIL import Image

base = Path(__file__).resolve().parent.parent / 'ai-concierge-preview' / 'media' / 'cinema-v1'
manifest_path = base / 'manifest.json'
manifest = json.loads(manifest_path.read_text('utf8'))
for clip in manifest['clips']:
    previous = None
    motion = []
    for frame in range(clip['frames']):
        luma = np.asarray(Image.open(base / f"clip-{clip['id']}" / '864' / f'{frame:04d}.webp').convert('L'), dtype=np.float32)
        motion.append(0.0 if previous is None else round(float(np.abs(luma - previous).mean()), 2))
        previous = luma
    clip['motion'] = motion
    print(f"clip {clip['id']}: {clip['frames']} frames, total change {sum(motion):.1f}, peak {max(motion):.2f}")
manifest_path.write_text(json.dumps(manifest, separators=(',', ':')), 'utf8')
