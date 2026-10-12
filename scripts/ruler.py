import sys, os
from PIL import Image, ImageDraw, ImageFont
R = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'assets', 'source')
f, x0, y0, x1, y1, z, out = sys.argv[1], *map(int, sys.argv[2:7]), sys.argv[7]
im = Image.open(os.path.join(R, f)).convert('RGB').crop((x0, y0, x1, y1)); im = im.resize((im.width * z, im.height * z), Image.LANCZOS)
pad = 20; can = Image.new('RGB', (im.width, im.height + pad), 'white'); can.paste(im, (0, pad)); d = ImageDraw.Draw(can)
font = ImageFont.truetype('arial.ttf', 13)
for x in range(((x0 + 9) // 10) * 10, x1, 10):
    X = (x - x0) * z
    if x % 50 == 0:
        d.line([X, pad - 12, X, can.height], fill=(255, 0, 0), width=1); d.text((X + 2, 0), str(x), fill=(200, 0, 0), font=font)
    else: d.line([X, pad - 5, X, pad], fill=(255, 0, 0))
can.save(out)
