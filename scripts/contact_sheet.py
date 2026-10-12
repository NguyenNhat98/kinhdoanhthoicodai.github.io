import json, os, sys
from PIL import Image, ImageDraw
R = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
m = json.load(open(os.path.join(R, 'assets/sprites/manifest.json'), encoding='utf-8'))
cols, cw, ch = 10, 140, 120; rows = (len(m) + cols - 1) // cols
sheet = Image.new('RGB', (cols * cw, rows * ch), (200, 200, 200)); d = ImageDraw.Draw(sheet)
for i, e in enumerate(m):
    x, y = (i % cols) * cw, (i // cols) * ch; d.rectangle([x, y, x + 138, y + 118], fill=(255, 255, 255))
    im = Image.open(os.path.join(R, e['url'])).convert('RGBA'); s = min(120 / im.width, 90 / im.height)
    im = im.resize((max(1, int(im.width * s)), max(1, int(im.height * s))), Image.LANCZOS); sheet.paste(im, (x + 10, y + 2), im)
    d.text((x + 2, y + 94), f"{i} {e['id']}"[:24], fill=(0, 0, 0))
out = sys.argv[1]; sheet.save(out)
h = rows * ch // 3 + 1
for k in range(3): sheet.crop((0, k * h, cols * cw, min(rows * ch, (k + 1) * h))).save(out.replace('.png', f'_{k}.png'))
