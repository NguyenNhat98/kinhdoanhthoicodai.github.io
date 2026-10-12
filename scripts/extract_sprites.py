"""Cắt sprite từ bảng gốc bằng phân đoạn tự động (không dùng mép cứng).
Mỗi hàng: tìm các khoảng trống dọc giữa các ô để tách, rồi xóa nền nối với biên và giữ thành phần liên thông chính.
Chạy: python -X utf8 -I scripts/extract_sprites.py [--report]"""
import json, sys, os
import numpy as np
from PIL import Image
from scipy import ndimage as ndi

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
SRC = os.path.join(ROOT, 'assets', 'source')
OUT = os.path.join(ROOT, 'assets', 'sprites')

def bg_mask(a, checker):
    r, g, b = [a[..., i].astype(int) for i in range(3)]
    hi = np.maximum(np.maximum(r, g), b); lo = np.minimum(np.minimum(r, g), b)
    if checker:
        return (lo >= 180) & (hi - lo <= 6)
    return ((lo >= 235) & (hi - lo <= 25)) | ((r >= 238) & (g >= 224) & (b >= 200) & (r >= g) & (g >= b) & (hi - lo <= 50))

def segments_from(ok, x0, minw, gap):
    segs, s, miss = [], None, 0
    for i, v in enumerate(list(ok) + [False] * (gap + 1)):
        if v:
            if s is None: s = i
            miss = 0; last = i
        elif s is not None:
            miss += 1
            if miss > gap:
                if last - s + 1 >= minw: segs.append((x0 + s, x0 + last + 1))
                s = None
    return segs

def segments(mask_fg, x0, x1, thr, minw):
    c = mask_fg[:, x0:x1].sum(axis=0)
    ok = c > thr
    segs, s = [], None
    for i, v in enumerate(ok):
        if v and s is None: s = i
        if (not v or i == len(ok) - 1) and s is not None:
            e = i if not v else i + 1
            if e - s >= minw: segs.append((x0 + s, x0 + e))
            s = None
    return segs

def cut(img, box, checker, loose=False):
    x, y, w, h = box
    a = np.array(img.crop((x, y, x + w, y + h)).convert('RGBA'))
    bg = bg_mask(a, checker)
    lab, n = ndi.label(bg)
    edge = set(np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))) - {0}
    rem = np.isin(lab, list(edge)) | (a[..., 3] == 0)
    fg = ~rem
    lab2, n2 = ndi.label(ndi.binary_dilation(fg, structure=np.ones((3, 3)), iterations=1 if loose else 2), structure=np.ones((3, 3)))  # nối các nét đứt nhỏ
    lab2 = np.where(fg, lab2, 0)
    if n2 == 0: return None
    sizes = ndi.sum(fg, lab2, range(1, n2 + 1)); main = 1 + int(np.argmax(sizes))
    # giữ thành phần chính + mọi mảnh rời nằm hẳn bên trong ô (chữ trên nhãn, hạt, hơi nóng);
    # mảnh chạm biên khung cắt là phần của ô bên cạnh nên bỏ
    border = set(np.unique(np.concatenate([lab2[0], lab2[-1], lab2[:, 0], lab2[:, -1]]))) - {0, main}
    lum = a[..., :3].mean(axis=2); ok = {main}
    for i in range(1, n2 + 1):
        if i == main or (i in border and not loose): continue
        if loose: continue
        m = lab2 == i; sz = int(sizes[i - 1])
        if sz >= 150 or (sz >= 6 and lum[m].mean() < 140): ok.add(i)   # chữ/chi tiết thật; bỏ đốm ô vuông nền caro
    keep = np.isin(lab2, list(ok))
    if checker:  # đốm xám nhỏ của nền ô vuông còn sót lại
        r_, g_, b_ = [a[..., i].astype(int) for i in range(3)]
        gray = keep & (np.minimum(np.minimum(r_, g_), b_) >= 150) & (np.maximum(np.maximum(r_, g_), b_) - np.minimum(np.minimum(r_, g_), b_) <= 12)
        gl, gn = ndi.label(gray, structure=np.ones((3, 3)))
        if gn:
            gs = ndi.sum(gray, gl, range(1, gn + 1)); small = np.isin(gl, [i + 1 for i in range(gn) if gs[i] < 45])
            keep &= ~small
    if loose:  # nhân vật: chỉ giữ dải cột liền lớn nhất, bỏ mảnh người bên cạnh lọt vào mép
        occ = keep.sum(axis=0) > 0; best, cs, bs = (0, 0), None, 0
        for i, v in enumerate(list(occ) + [False]):
            if v and cs is None: cs = i
            if not v and cs is not None:
                if i - cs > bs: bs, best = i - cs, (cs, i)
                cs = None
        keep[:, :best[0]] = False; keep[:, best[1]:] = False
    ys, xs = np.where(keep)
    a[..., 3] = np.where(keep, 255, 0)
    a = a[ys.min():ys.max() + 1, xs.min():xs.max() + 1]
    out = np.zeros((a.shape[0] + 4, a.shape[1] + 4, 4), np.uint8); out[2:-2, 2:-2] = a
    return Image.fromarray(out), (x + xs.min(), y + ys.min(), a.shape[1], a.shape[0])

# Mép tay đã đo lại trên ảnh gốc (chỗ các ô chạm nhau): khóa = id sprite đầu hàng -> (danh sách mép, số px mở rộng đáy)
OVERRIDES = {
    'trada-walker-0': ([1037, 1086, 1137, 1187, 1238, 1288, 1338, 1389, 1439, 1489, 1535], 0),
    'banhmi-grilled-meat': ([819, 892, 967, 1040, 1112, 1184, 1255, 1325, 1395, 1460, 1531], 0),
    'banhmi-cucumber': ([817, 914, 1005, 1094, 1183, 1266, 1346, 1427, 1521], 0),
    'mycay-noodle-egg': ([764, 882, 998, 1110, 1221, 1326, 1433], 0),
    'mycay-beef': ([770, 848, 917, 987, 1057, 1129, 1205, 1275, 1363, 1442], 0),
    'mycay-mustard': ([784, 885, 973, 1066, 1157, 1239, 1319, 1420], 0),
    'trasua2-pearl-black': ([982, 1073, 1168, 1274, 1374, 1453, 1524], 4),
    'trasua2-pudding': ([975, 1060, 1172, 1274, 1366, 1438, 1522], 8),
    'xoi-purple': (None, 8),
    'xoi-quail-egg': (None, 6),
}

# hàng không có bảng nhãn: không giữ chữ rời
NO_INNER = {'banhmi-chili-sauce', 'banhmi-bread-meat'}

def main():
    man = json.load(open(os.path.join(OUT, 'manifest.json'), encoding='utf-8-sig'))
    rows = {}
    for e in man:
        x, y, w, h = e['rect']; rows.setdefault((e['sheet'], y, h), []).append(e)
    imgs = {}; bad = 0
    for (sheet, y, h), es in rows.items():
        if sheet not in imgs: imgs[sheet] = Image.open(os.path.join(SRC, sheet)).convert('RGB')
        img = imgs[sheet]; checker = 'Trà Đá' in sheet or 'Mì Cay' in sheet
        es.sort(key=lambda e: e['rect'][0])
        edges, extra = OVERRIDES.get(es[0]['id'], (None, 0))
        if edges is None: edges = [es[0]['rect'][0]] + [e['rect'][0] + e['rect'][2] for e in es]
        assert len(edges) == len(es) + 1, es[0]['id']
        for k, e in enumerate(es):
            r = cut(img, (edges[k], y, edges[k + 1] - edges[k], h + extra), checker, 'walker' in e['id'] or es[0]['id'] in NO_INNER)
            if r is None: print('EMPTY', e['id']); bad += 1; continue
            im, rect = r; im.save(os.path.join(OUT, os.path.basename(e['url'])))
            e['rect'] = [int(v) for v in rect]
    json.dump(man, open(os.path.join(OUT, 'manifest.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=2)
    open(os.path.join(OUT, 'manifest.js'), 'w', encoding='utf-8').write('window.SPRITES = ' + json.dumps(man, ensure_ascii=False, separators=(',', ':')) + ';')
    print('done', len(man), 'empty', bad)

if __name__ == '__main__': main()
