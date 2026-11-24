#!/usr/bin/env python3
"""Optional: build an upload zip into dist/ (GitHub Pages needs no build, it serves the repo as is).

  python3 tools/build.py              -> dist/magic-attic-standalone.zip (index.html at the zip root, no ads)
  python3 tools/build.py poki         -> dist/magic-attic-poki.zip       (any portal name portal.js knows, see src/portal.js)

The portal is baked in as window.PORTAL before main.js loads. The default ('none') needs no SDK and grants
booster rewards for free.
"""
import sys, zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / 'dist'
OUT.mkdir(exist_ok=True)
MARK = '<script type="module" src="src/main.js"></script>'
portal = sys.argv[1] if len(sys.argv) > 1 else 'none'
name = 'standalone' if portal == 'none' else portal

html = (ROOT / 'index.html').read_text()
assert MARK in html
srcs = sorted((ROOT / 'src').glob('*.js'))
zpath = OUT / f'magic-attic-{name}.zip'
with zipfile.ZipFile(zpath, 'w', zipfile.ZIP_DEFLATED, compresslevel=9) as z:
    z.writestr('index.html', html.replace(MARK, f"<script>window.PORTAL='{portal}';</script>\n{MARK}"))
    for p in srcs:
        z.writestr(f'src/{p.name}', p.read_text())
print(f'{zpath.name}: {zpath.stat().st_size / 1024:.1f} KB, {len(srcs) + 1} files')

