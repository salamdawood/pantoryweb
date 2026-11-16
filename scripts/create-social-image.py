#!/usr/bin/env python3
"""Create the social card locally from the authentic icon. Requires Pillow only for regeneration."""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
FONT_PATHS = [Path('/System/Library/Fonts/Supplemental/Arial Bold.ttf'),
              Path('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf')]
font_path = next((path for path in FONT_PATHS if path.exists()), None)
if not font_path:
    raise SystemExit('Provide an installed bold sans-serif font in FONT_PATHS.')
canvas = Image.new('RGB', (1200, 630), '#ECF2EA')
with Image.open(ROOT / 'src/assets/images/pantory-icon.png') as original:
    icon = original.convert('RGBA').resize((256, 256), Image.Resampling.LANCZOS)
canvas.paste(icon, (80, 187), icon)
draw = ImageDraw.Draw(canvas)
draw.text((400, 148), 'Pantory', font=ImageFont.truetype(str(font_path), 82), fill='#243E31')
draw.multiline_text((400, 280), 'Know what you have.\nUse it before it expires.',
                    font=ImageFont.truetype(str(font_path), 54), fill='#243E31', spacing=20)
output = ROOT / 'src/assets/optimized/pantory-social.png'
canvas.save(output, optimize=True)
print(f'{output}: 1200×630, {output.stat().st_size:,} bytes')
