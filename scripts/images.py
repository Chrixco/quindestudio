#!/usr/bin/env python3
"""Responsive images for quindestudio.com.

Put a full-size image in assets/img/ (webp, jpg or png) and run:

    python3 scripts/images.py

1. A jpg or png becomes a webp master with the same name (at most 2400 px wide).
   The original is left where it is; delete it once you're happy with the webp.
2. Every master gets smaller copies, name-480.webp, name-800.webp, name-1200.webp
   and name-1600.webp, skipping widths at or above the master's own width.
   Copies are only rebuilt when the master is newer.
3. Every <img> in the site's HTML that shows a master from /assets/img/ gets a
   srcset listing its copies, and a sizes attribute if it has none, so each device
   downloads the smallest file that is still sharp.

Run with --check to list what would change without writing anything.
Needs Pillow (python3 -m pip install Pillow).
"""
import re
import sys
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
IMG = ROOT / 'assets' / 'img'
WIDTHS = (480, 800, 1200, 1600)
MAX_MASTER = 2400
QUALITY = 80
COPY = re.compile(r'-(\d+)\.webp$')

# How wide each kind of image is drawn, by class, matching site.css.
# Images with neither a known class nor their own sizes get DEFAULT_SIZES.
SIZES = {
    'slide-art': '(max-width: 52rem) 100vw, 44rem',
    'work-art': '(max-width: 40rem) 100vw, (max-width: 52rem) 50vw, 36rem',
}
DEFAULT_SIZES = '(max-width: 52rem) 100vw, 44rem'

check = '--check' in sys.argv
changes = []


def note(msg):
    changes.append(msg)
    print(('would ' if check else '') + msg)


def masters():
    for p in sorted(IMG.iterdir()):
        if p.suffix.lower() in ('.jpg', '.jpeg', '.png'):
            webp = p.with_suffix('.webp')
            if not webp.exists() or webp.stat().st_mtime < p.stat().st_mtime:
                note(f'convert {p.name} -> {webp.name}')
                if not check:
                    with Image.open(p) as im:
                        im = im.convert('RGBA' if im.mode in ('RGBA', 'LA', 'P') else 'RGB')
                        if im.width > MAX_MASTER:
                            im = im.resize((MAX_MASTER, round(im.height * MAX_MASTER / im.width)), Image.LANCZOS)
                        im.save(webp, 'WEBP', quality=QUALITY, method=6)
    return [p for p in sorted(IMG.glob('*.webp')) if not COPY.search(p.name)]


def make_copies(master):
    """Build the smaller copies of one master. Returns [(url, width)], smallest first, master last."""
    with Image.open(master) as im:
        width, height = im.size
        out = []
        for w in WIDTHS:
            if w >= width * 0.9:  # a copy almost as wide as the master saves next to nothing
                break
            copy = master.with_name(f'{master.stem}-{w}.webp')
            if not copy.exists() or copy.stat().st_mtime < master.stat().st_mtime:
                note(f'make {copy.name}')
                if not check:
                    im.convert('RGBA' if im.mode in ('RGBA', 'LA', 'P') else 'RGB') \
                      .resize((w, round(height * w / width)), Image.LANCZOS) \
                      .save(copy, 'WEBP', quality=QUALITY, method=6)
            out.append((f'/assets/img/{copy.name}', w))
    # Remove copies this master no longer needs, e.g. after WIDTHS changed.
    keep = {u.rsplit('/', 1)[1] for u, _ in out}
    for old in master.parent.glob(f'{master.stem}-*.webp'):
        m = COPY.search(old.name)
        if m and old.name[:m.start()] == master.stem and old.name not in keep:
            note(f'remove {old.name}')
            if not check:
                old.unlink()
    out.append((f'/assets/img/{master.name}', width))
    return out


def attr(tag, name):
    m = re.search(r'\s' + name + r'="([^"]*)"', tag)
    return m.group(1) if m else None


def set_attr(tag, name, value):
    if attr(tag, name) is not None:
        return re.sub(r'(\s' + name + r'=")[^"]*(")', lambda m: m.group(1) + value + m.group(2), tag)
    return re.sub(r'\s*(/?>)$', lambda m: f' {name}="{value}"' + m.group(1), tag)


def rewrite_html(sets):
    for page in sorted(ROOT.rglob('*.html')):
        if '.git' in page.parts:
            continue
        html = page.read_text()

        def fix(m):
            tag = m.group(0)
            src = attr(tag, 'src') or ''
            path, _, query = src.partition('?')
            if path not in sets or len(sets[path]) < 2:
                return tag
            q = f'?{query}' if query else ''
            new = set_attr(tag, 'srcset', ', '.join(f'{u}{q} {w}w' for u, w in sets[path]))
            if attr(new, 'sizes') is None:
                cls = (attr(new, 'class') or '').split()
                new = set_attr(new, 'sizes', next((SIZES[c] for c in cls if c in SIZES), DEFAULT_SIZES))
            return new

        out = re.sub(r'<img\s[^>]*>', fix, html)
        if out != html:
            note(f'update {page.relative_to(ROOT)}')
            if not check:
                page.write_text(out)


sets = {f'/assets/img/{m.name}': make_copies(m) for m in masters()}
rewrite_html(sets)
if not changes:
    print('Everything is up to date.')
elif not check:
    print('Done. Bump ?v= on site.css only if you changed styles; the HTML now lists the new files.')
