#!/usr/bin/env python3
"""Generate website assets without modifying the supplied originals (requires Pillow)."""
import hashlib
import json
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
DEST = ROOT / 'src/assets/optimized'
DEST.mkdir(parents=True, exist_ok=True)

SPECS = {
    'inventory': {
        'source': 'src/assets/screenshots/inventory.PNG',
        'alt': 'Pantory Inventory in Light Mode with search, All and Expiring filters, product photos, quantities, Home and Fridge labels, and Inventory, History, and Settings tabs.',
        'sizes': '(max-width: 340px) calc(100vw - 55px), (max-width: 600px) 280px, 320px',
    },
    'inventory-detail': {
        'source': 'src/assets/screenshots/inventory.PNG',
        # Original pixel coordinates: three complete rows, including quantity controls and locations.
        'crop': [60, 1002, 1230, 1842],
        'alt': 'Detail of Inventory rows for sourdough, Coca-Cola Zero, and macaroni, with quantities 2, 1, and 5 and Home or Fridge location labels.',
        'sizes': '(max-width: 340px) calc(100vw - 71px), (max-width: 600px) 280px, 300px',
    },
    'expiring': {
        'source': 'src/assets/screenshots/expiring.PNG',
        'alt': 'Pantory Inventory in Dark Mode with Expiring selected, showing an item marked Today and sourdough marked Tomorrow, along with quantities and locations.',
        'sizes': '(max-width: 340px) calc(100vw - 71px), (max-width: 600px) 280px, 290px',
    },
    'scanning': {
        'source': 'src/assets/screenshots/barcode-scanner.PNG',
        'alt': 'Pantory barcode scanner sheet over Inventory, showing a camera preview of a food package barcode, the instruction to point the camera at a barcode, and Enter manually and Close buttons.',
        'sizes': '(max-width: 340px) calc(100vw - 71px), (max-width: 600px) 280px, 290px',
    },
}

def original_metadata(path):
    with Image.open(path) as image:
        return {
            'src': path.relative_to(ROOT / 'src').as_posix(),
            'width': image.width,
            'height': image.height,
            'bytes': path.stat().st_size,
            'sha256': hashlib.sha256(path.read_bytes()).hexdigest(),
        }

def save_variant(image, name, width, lossless=False):
    height = round(image.height * width / image.width)
    resized = image.resize((width, height), Image.Resampling.LANCZOS)
    path = DEST / f'{name}-{width}.webp'
    resized.save(path, 'WEBP', quality=90, method=6, lossless=lossless)
    return {
        'src': path.relative_to(ROOT / 'src').as_posix(),
        'width': width,
        'height': height,
        'bytes': path.stat().st_size,
    }

screenshots = {}
for name, spec in SPECS.items():
    source = ROOT / spec['source']
    with Image.open(source) as original:
        image = original.crop(spec['crop']) if 'crop' in spec else original.copy()
        variants = [save_variant(image, name, width) for width in (320, 640, 960)]
    default = variants[1]
    screenshots[name] = {
        **default,
        'alt': spec['alt'],
        'sizes': spec['sizes'],
        'variants': variants,
        'original': original_metadata(source),
        **({'crop': spec['crop']} if 'crop' in spec else {}),
    }
    print(f"{name}: {screenshots[name]['original']['bytes']:,} original bytes → " +
          ', '.join(f"{v['width']}×{v['height']}: {v['bytes']:,} bytes" for v in variants))

icon_source = ROOT / 'src/assets/images/pantory-icon.png'
with Image.open(icon_source) as original:
    icon_variants = [save_variant(original, 'pantory-icon', width, lossless=True) for width in (96, 192, 288)]
    for width in (32, 180):
        original.resize((width, width), Image.Resampling.LANCZOS).save(DEST / f'pantory-icon-{width}.png', optimize=True)
    original.save(DEST / 'favicon.ico', sizes=[(16, 16), (32, 32), (48, 48)])

artwork = {
    'icon': {
        **icon_variants[1],
        'alt': 'Pantory app icon',
        'variants': icon_variants,
        'original': original_metadata(icon_source),
    }
}
for name, data in [('screenshots', screenshots), ('artwork', artwork)]:
    (ROOT / f'src/_data/{name}.json').write_text(json.dumps(data, indent=2) + '\n')
print(f"Icon: {artwork['icon']['original']['bytes']:,} original bytes → " +
      ', '.join(f"{v['width']}×{v['height']}: {v['bytes']:,} bytes" for v in icon_variants))
