/* ============================================================================
   CÔNG THỨC & QUY TẮC TỪNG QUẦY (không vẽ gì ở đây: chỉ dữ liệu + luật chế biến)
   Mỗi quầy: makeOrder · newProduct · cmds (lệnh người chơi) · tick (hold/nướng/trụng) ·
             finishBusy · canDeliver · grade · hint
   ========================================================================== */
(function () {
  'use strict';
  const G = window.Game;
  const R = {};
  window.R = R;
  const rnd = G.rand, ri = G.randInt, pick = G.pick;
  const sum = (o) => Object.keys(o).reduce((a, k) => a + (o[k] || 0), 0);

  /* ---------- tiện ích dùng chung ---------- */
  const U = R.util = {
    // điểm sai lệch số phần: max(0, 1 − tổng|chênh| / max(1, tổng yêu cầu + 1)); không yêu cầu và không thêm → 1
    diffScore(req, have, keys) {
      let diff = 0, tot = 0;
      keys.forEach((k) => { diff += Math.abs((have[k] || 0) - (req[k] || 0)); tot += (req[k] || 0); });
      if (diff === 0) return 1;
      return Math.max(0, 1 - diff / Math.max(1, tot + 1));
    },
    // lượng rót: 95–105% → 1; 85–115% → 0,8; còn lại 0,4
    band(ratio) { const d = Math.abs(ratio - 1); return d <= 0.05 ? 1 : d <= 0.15 ? 0.8 : 0.4; },
    weights(parts, w) { let q = 0; Object.keys(w).forEach((k) => { q += w[k] * (parts[k] == null ? 1 : parts[k]); }); return Math.max(0, Math.min(1, q)); },
    arr: (o, names) => Object.keys(o).filter((k) => o[k] > 0).map((k) => `${o[k]}× ${names[k] || k}`),
  };
  const fail = (msg) => ({ ok: false, msg });
  const ok = (extra) => Object.assign({ ok: true }, extra || {});
  // dùng nguyên liệu: trừ kho, cộng giá vốn của món (để tính hao phí khi bỏ món)
  const use = (ws, p, item, n) => {
    n = n == null ? 1 : n;
    if (!G.take(ws.shop, item, n)) { const d = G.itemDef(ws.shop, item); return { ok: false, msg: `Hết ${d.name}! Mở “Nhập hàng” để bổ sung.` }; }
    p.cost = (p.cost || 0) + G.unitCost(ws.shop, item) * n;
    (p.used = p.used || []).push([item, n]);
    return null;
  };
  R.use = use;
  const eq = (ws, id) => G.eqLv(ws.shop, id);

  /* =========================================================================
     1) TRÀ ĐÁ — bát · đá · rót · mật · giao · dọn bát
     ========================================================================= */
  const TD = R.trada = {
    names: { s: 'Bát nhỏ', l: 'Bát lớn' },
    cap: { s: 60, l: 90 },
    makeOrder(ws, reg) {
      const easy = ws.tutorial;
      const spec = { size: ws.tutorial && ws.oid < 2 ? 's' : (Math.random() < 0.35 ? 'l' : 's'), ice: easy ? 1 : pick([0, 1, 1, 2]), honey: easy ? false : Math.random() < 0.3 };
      if (reg && reg.id === 'laoba') { spec.size = 's'; spec.ice = 1; spec.honey = false; }
      return spec;
    },
    chips(s) { return [s.size === 'l' ? 'Bát lớn' : 'Bát nhỏ', ['không đá', 'ít đá', 'nhiều đá'][s.ice], s.honey ? 'có mật' : 'không mật']; },
    newProduct() { return { size: null, ice: 0, vol: 0, honey: false, spilled: false, cost: 0, used: [], forOrder: null }; },
    target(p) { const cap = TD.cap[p.size]; return Math.max(5, 0.9 * cap - p.ice * 8); },
    cmds: {
      bowl(ws, p, a) {
        if (p.size) { if (p.vol > 0 || p.ice > 0 || p.honey) return fail('Đã có trà trong bát, hãy giao hoặc bỏ món.'); G.give(ws.shop, 'bat_' + p.size, 1); p.size = null; p.cost = 0; p.used = []; }
        if (ws.dirty.s + ws.dirty.l > 3 && !G.stock(ws.shop, 'bat_' + a.size)) return fail('Bát bẩn chất đống, hãy rửa bớt!');
        const e = use(ws, p, 'bat_' + a.size, 1); if (e) return e;
        p.cost = 0; p.size = a.size; p.forOrder = ws.sel || null;
        return ok({ busy: [0.7, 0.5, 0.35, 0.2][eq(ws, 'gia')], key: 'bowl', sfx: 'tap' });
      },
      ice(ws, p) {
        if (!p.size) return fail('Hãy lấy bát trước.'); if (p.ice >= 2) return fail('Đã đủ đá.');
        if (p.vol > 0 && p.ice === 0 && false) return fail('');
        const e = use(ws, p, 'da', 1); if (e) return e; p.ice++; return ok({ sfx: 'ice' });
      },
      honey(ws, p) {
        if (!p.size) return fail('Hãy lấy bát trước.'); if (p.honey) return fail('Đã thêm mật rồi.');
        const e = use(ws, p, 'mat', 1); if (e) return e; p.honey = true; return ok({ sfx: 'pump' });
      },
    },
    holdKinds: { tea: { rate: 24, item: 'tra', need: 'size', label: 'trà' } },
    pourRate(ws) { return 24 * (eq(ws, 'am') >= 2 ? 1.1 : 1); },
    tick(ws, p, dt) { /* rót xử lý chung ở engine */ },
    finishBusy() {},
    canDeliver(ws, p) { if (!p.size) return 'Chưa có bát.'; if (p.vol <= 1) return 'Hãy rót trà trước khi giao.'; return null; },
    grade(spec, p) {
      const t = TD.target(p), pour = U.band(p.vol / t);
      const loai = p.size === spec.size ? 1 : 0.5;
      const iceS = 1 - Math.abs(p.ice - spec.ice) * 0.5, honeyS = p.honey === spec.honey ? 1 : 0.4;
      const parts = { loai, pour, da: (iceS + honeyS) / 2, xuly: p.spilled ? 0.5 : 1 };
      const q = U.weights(parts, { loai: 0.35, pour: 0.35, da: 0.2, xuly: 0.1 });
      const c = [];
      if (loai < 1) c.push('Sai cỡ bát'); if (pour < 1) c.push(p.vol / t < 1 ? 'Rót hơi thiếu' : 'Rót hơi đầy'); if (iceS < 1) c.push('Lượng đá chưa đúng'); if (honeyS < 1) c.push(spec.honey ? 'Quên mật' : 'Không cần mật'); if (p.spilled) c.push('Rót tràn');
      return { quality: q, perfect: q >= 0.95 && !p.spilled, reject: q < 0.5, parts, comments: c };
    },
    hint(ws, p, o) {
      if (!o) return 'Chạm một khách để nhận đơn.';
      if (!p || !p.size) return `Lấy ${o.spec.size === 'l' ? 'bát lớn' : 'bát nhỏ'}.`;
      if (p.ice < o.spec.ice) return 'Thêm đá (chạm muỗng đá).';
      if (p.vol <= 1) return 'Giữ ấm trà để rót tới vạch “Vừa đủ”.';
      if (o.spec.honey && !p.honey) return 'Khách muốn thêm mật.';
      return 'Xong! Chạm “Giao” rồi chọn khách.';
    },
  };

  /* =========================================================================
     2) TRÀ SỮA — ly · topping · trà · sữa · đường · đá · khuấy · ép nắp · ống hút
     ========================================================================= */
  const TEAS = { hong: 'Hồng trà', luc: 'Lục trà', olong: 'Ô long', matcha: 'Matcha' };
  const MILKS = { tuoi: 'Sữa tươi', dac: 'Sữa đặc', kem: 'Kem cheese' };
  const TOPS = { tc_den: 'Trân châu đen', quylinh: 'Quy linh', pudding: 'Pudding', hatsen: 'Hạt sen' };
  const SUG = ['0% đường', '30% đường', '70% đường', '100% đường'];
  const TSR = [
    { id: 'tstc', name: 'Trà sữa trân châu', tea: 'hong', milk: 'tuoi', tops: { tc_den: 1 }, size: 'M', sugar: 2, ice: 50, lv: 1 },
    { id: 'lucpd', name: 'Lục trà pudding', tea: 'luc', milk: 'tuoi', tops: { pudding: 1 }, size: 'M', sugar: 1, ice: 50, lv: 1 },
    { id: 'olql', name: 'Ô long quy linh', tea: 'olong', milk: 'dac', tops: { quylinh: 1 }, size: 'M', sugar: 1, ice: 0, lv: 1 },
    { id: 'duongden', name: 'Trà sữa đường đen', tea: 'hong', milk: 'tuoi', sugarType: 'den', tops: { tc_den: 2 }, size: 'L', sugar: 2, ice: 50, lv: 3 },
    { id: 'matchasen', name: 'Matcha hạt sen', tea: 'matcha', milk: 'tuoi', tops: { hatsen: 1 }, size: 'M', sugar: 1, ice: 50, lv: 3 },
    { id: 'olcheese', name: 'Ô long kem cheese', tea: 'olong', milk: 'kem', tops: {}, size: 'L', sugar: 1, ice: 50, lv: 5 },
  ];
  const TS = R.trasua = {
    TEAS, MILKS, TOPS, SUG, recipes: TSR,
    capOf: (s) => (s === 'L' ? 140 : 100),
    iceVol: (ice, size) => (ice / 100) * 20 * (size === 'L' ? 1.4 : 1),
    topVol: (p) => sum(p.tops) * 8,
    liquidTarget(p) { const cap = TS.capOf(p.size); return Math.max(10, 0.95 * cap - TS.topVol(p) - TS.iceVol(p.ice || 0, p.size)); },
    ratio(milk) { return milk ? 0.7 : 1; },
    makeOrder(ws, reg) {
      const lv = G.S.shops.trasua.level, avail = TSR.filter((r) => r.lv <= lv);
      const r = ws.tutorial ? TSR[0] : pick(avail);
      const spec = { recipe: r.id, name: r.name, tea: r.tea, milk: r.milk, tops: Object.assign({}, r.tops), size: r.size, sugar: r.sugar, sugarType: r.sugarType || 'thuong', ice: r.ice, surcharge: 0 };
      if (!ws.tutorial) {
        if (r.size === 'M' && lv >= 2 && Math.random() < 0.3) spec.size = 'L';
        if (Math.random() < 0.4) spec.sugar = G.clamp(spec.sugar + pick([-1, 1]), 0, 3);
        if (Math.random() < 0.4) spec.ice = pick([0, 50, 100]);
        if (reg && reg.id === 'linhchi') { const tk = Object.keys(TOPS).filter((k) => (k !== 'hatsen' || lv >= 3)); spec.tops = {}; spec.tops[pick(tk)] = 1; spec.name = 'Món Linh Chi chọn theo mùa'; }
      }
      spec.surcharge = (spec.size === 'L' ? 0.25 : 0) + sum(spec.tops) * 0.04;
      return spec;
    },
    chips(s) {
      return [TEAS[s.tea], s.milk ? MILKS[s.milk] : 'không sữa', s.size === 'L' ? 'Ly L' : 'Ly M', ...U.arr(s.tops, TOPS), SUG[s.sugar] + (s.sugarType === 'den' ? ' (đường đen)' : ''), s.ice + '% đá', 'mang đi'];
    },
    newProduct() { return { size: null, tea: null, teaVol: 0, milk: null, milkVol: 0, tops: {}, sugar: null, sugarType: 'thuong', ice: null, stirred: false, lid: false, straw: false, spilled: false, cost: 0, used: [], forOrder: null }; },
    total(p) { return p.teaVol + p.milkVol + TS.topVol(p) + TS.iceVol(p.ice || 0, p.size); },
    holdKinds: { tea: { label: 'trà', rate: 30 }, milk: { label: 'sữa', rate: 24 } },
    pourRate(ws, kind) { return (kind === 'milk' ? 24 : 30) * (kind === 'tea' && eq(ws, 'voi') >= 2 ? 1.1 : 1); },
    locked: (p) => (p.lid ? 'Đã đóng nắp, không thêm được nữa.' : null),
    cmds: {
      cup(ws, p, a) {
        if (p.size) { if (p.teaVol || p.milkVol || sum(p.tops) || p.sugar != null || p.ice != null) return fail('Đã có nguyên liệu trong ly. Hãy giao hoặc bỏ món.'); G.give(ws.shop, 'ly_' + p.size, 1); p.size = null; p.cost = 0; p.used = []; }
        const e = use(ws, p, 'ly_' + a.size, 1); if (e) return e;
        p.cost = G.unitCost(ws.shop, 'ly_' + a.size); p.size = a.size; p.forOrder = ws.sel || null;
        return ok({ sfx: 'tap', busy: 0.35, key: 'cup' });
      },
      top(ws, p, a) {
        if (!p.size) return fail('Hãy lấy ly trước.'); const L = TS.locked(p); if (L) return fail(L);
        const o = ws.orders.find((x) => x.id === ws.sel);
        const lv = eq(ws, 'muong');
        let n = lv >= 3 && o ? Math.max(1, (o.spec.tops[a.id] || 1) - (p.tops[a.id] || 0)) : (lv >= 2 ? Math.max(1, Math.min(2, ws.scoopN || 1)) : 1);
        if (sum(p.tops) + n > 4) return fail('Ly quá nhiều topping.');
        if (TS.total(p) + n * 8 > TS.capOf(p.size)) return fail('Hết chỗ chứa trong ly.');
        const e = use(ws, p, a.id, n); if (e) return e;
        p.tops[a.id] = (p.tops[a.id] || 0) + n; return ok({ sfx: 'scoop', busy: 0.3, key: 'top' });
      },
      sugar(ws, p, a) {
        if (!p.size) return fail('Hãy lấy ly trước.'); const L = TS.locked(p); if (L) return fail(L);
        if (p.sugar != null) return fail('Đã bơm đường, không đổi được nữa.');
        if (a.level > 0) { const e = use(ws, p, a.type === 'den' ? 'duong_den' : 'duong', 1); if (e) return e; }
        p.sugar = a.level; p.sugarType = a.level > 0 ? (a.type || 'thuong') : 'thuong'; return ok({ sfx: 'pump', busy: 0.4, key: 'sugar' });
      },
      ice(ws, p, a) {
        if (!p.size) return fail('Hãy lấy ly trước.'); const L = TS.locked(p); if (L) return fail(L);
        if (p.ice != null) return fail('Đã thêm đá rồi.');
        if (TS.total(p) + TS.iceVol(a.level, p.size) > TS.capOf(p.size) + 0.01) return fail('Thêm đá sẽ tràn ly, hãy rót ít lại.');
        if (a.level > 0) { const e = use(ws, p, 'da', a.level === 100 ? 2 : 1); if (e) return e; }
        p.ice = a.level; return ok({ sfx: 'ice', busy: 0.4, key: 'ice' });
      },
      stir(ws, p) {
        if (!p.size || p.teaVol <= 0) return fail('Chưa có trà để khuấy.'); if (p.lid) return fail('Đã đóng nắp.'); if (p.stirred) return fail('Đã khuấy đủ rồi.');
        return ok({ sfx: 'stir', busy: [1.2, 1.2, 0.9, 0.6][eq(ws, 'khuay')], key: 'stir' });
      },
      seal(ws, p) {
        if (!p.size || p.teaVol <= 0) return fail('Cần có trà trong ly trước khi đóng nắp.'); if (p.lid) return fail('Đã đóng nắp.'); if (ws.hold) return fail('Đang rót, hãy dừng lại.');
        const e = use(ws, p, 'nap', 1); if (e) return e;
        return ok({ sfx: 'seal', busy: [1.6, 1.6, 1.2, 0.8][eq(ws, 'ep')], key: 'seal' });
      },
      straw(ws, p) {
        if (!p.lid) return fail('Hãy đóng nắp trước, rồi cắm ống hút.'); if (p.straw) return fail('Đã có ống hút.');
        const e = use(ws, p, 'hut', 1); if (e) return e; p.straw = true; return ok({ sfx: 'tap' });
      },
    },
    tick() {},
    finishBusy(ws, p, key) { if (!p) return; if (key === 'stir') p.stirred = true; if (key === 'seal') p.lid = true; },
    canDeliver(ws, p) { if (!p.size) return 'Chưa có ly.'; if (p.teaVol <= 0) return 'Ly chưa có trà.'; if (!p.lid) return 'Hãy đóng nắp trước (đơn mang đi).'; if (!p.straw) return 'Hãy cắm ống hút trước khi giao.'; return null; },
    grade(spec, p) {
      const liq = TS.liquidTarget(p), ratio = TS.ratio(spec.milk);
      const teaT = liq * ratio, milkT = liq - teaT;
      const pourTea = U.band(p.teaVol / teaT), pourMilk = milkT <= 0 ? (p.milkVol <= 2 ? 1 : 0.4) : U.band(p.milkVol / milkT);
      const wrongTea = p.tea !== spec.tea;
      const sugD = Math.abs((p.sugar == null ? 0 : p.sugar) - spec.sugar), sugS = (1 - sugD / 3) * (spec.sugar > 0 && p.sugar > 0 && p.sugarType !== spec.sugarType ? 0.5 : 1);
      const iceS = 1 - Math.abs((p.ice == null ? 0 : p.ice) - spec.ice) / 100;
      const milkS = (p.milk || null) === (spec.milk || null) ? 1 : 0;
      const parts = { nen: wrongTea ? 0 : 1, ly: p.size === spec.size ? 1 : 0.4, top: U.diffScore(spec.tops, p.tops, Object.keys(Object.assign({}, spec.tops, p.tops))), vi: (sugS + iceS + milkS) / 3, rot: (pourTea + pourMilk) / 2, xuly: (p.stirred ? 0.6 : 0.2) + (p.spilled ? 0 : 0.4) };
      let q = U.weights(parts, { nen: 0.25, ly: 0.1, top: 0.2, vi: 0.2, rot: 0.15, xuly: 0.1 });
      const c = [];
      if (wrongTea) { q = Math.min(q, 0.49); c.push('Sai nền trà'); }
      if (parts.ly < 1) c.push('Sai cỡ ly'); if (parts.top < 1) c.push('Topping chưa đúng'); if (sugS < 1) c.push('Độ ngọt chưa đúng'); if (iceS < 1) c.push('Lượng đá chưa đúng'); if (milkS < 1) c.push('Sai loại sữa');
      if (pourTea < 1 || pourMilk < 1) c.push('Lượng rót chưa chuẩn'); if (!p.stirred) c.push('Chưa khuấy đều'); if (p.spilled) c.push('Rót tràn');
      return { quality: q, perfect: q >= 0.95 && !p.spilled && !wrongTea, reject: q < 0.5, parts, comments: c };
    },
    hint(ws, p, o) {
      if (!o) return 'Chạm một khách để ghim đơn.';
      const s = o.spec;
      if (!p || !p.size) return `Lấy ly ${s.size}.`;
      const miss = Object.keys(s.tops).find((k) => (p.tops[k] || 0) < s.tops[k]);
      if (miss) return `Múc ${TOPS[miss]}.`;
      if (p.sugar == null) return `Chọn đường ${SUG[s.sugar]} rồi bấm Bơm.`;
      if (p.ice == null) return `Chọn đá ${s.ice}% rồi bấm Múc.`;
      if (!p.tea) return `Chọn bình ${TEAS[s.tea]} rồi giữ vòi để rót.`;
      if (s.milk && !p.milk) return `Thêm ${MILKS[s.milk]} (giữ vòi sữa).`;
      if (!p.stirred) return 'Chạm “Khuấy”.';
      if (!p.lid) return 'Đưa ly vào máy: chạm “Ép nắp”.';
      if (!p.straw) return 'Lấy ống hút.';
      return 'Xong! Chạm “Giao” rồi chọn khách.';
    },
  };

  /* =========================================================================
     3) BÁNH MÌ — chọn ổ · nướng · rạch · pate · nhân · rau/sốt · khép · gói
     ========================================================================= */
  const BM_NAMES = { pate: 'Pate', xaxiu: 'Xá xíu', trung: 'Trứng', dua: 'Dưa góp', rau: 'Rau mùi', ot: 'Sốt ớt' };
  const BM = R.banhmi = {
    names: BM_NAMES,
    zone(ws) { const bonus = eq(ws, 'lo') >= 2 ? 1 : 0; return { gold: [4, 6 + bonus], dark: 8 + bonus }; },
    state(ws, p) { const z = BM.zone(ws), b = p.bake; return b < 3 ? 'raw' : b < z.gold[0] ? 'near' : b <= z.gold[1] ? 'gold' : b <= z.dark ? 'dark' : 'burnt'; },
    makeOrder(ws, reg) {
      const easy = ws.tutorial && ws.oid < 3;
      const s = { size: easy ? 's' : (Math.random() < 0.3 ? 'l' : 's'), pate: 1, xaxiu: easy ? 1 : ri(1, 2), trung: easy ? 0 : (Math.random() < 0.3 ? 1 : 0), dua: easy ? 0 : (Math.random() < 0.7 ? 1 : 0), rau: easy ? 0 : (Math.random() < 0.6 ? 1 : 0), ot: easy ? 0 : (Math.random() < 0.3 ? 1 : 0), surcharge: 0 };
      if (reg && reg.id === 'tin') s.rau = 0;
      if (reg && reg.id === 'hanmac') s.ot = 0;
      s.surcharge = (s.size === 'l' ? 0.25 : 0) + s.xaxiu * 0.06 + s.trung * 0.04;
      return s;
    },
    chips(s) { return [s.size === 'l' ? 'Ổ lớn' : 'Ổ nhỏ', 'vàng giòn', ...U.arr({ pate: s.pate, xaxiu: s.xaxiu, trung: s.trung, dua: s.dua, rau: s.rau }, BM_NAMES), s.ot ? 'có sốt ớt' : 'không cay', 'gói giấy mang đi']; },
    newProduct() { return { size: null, bake: 0, inOven: false, cut: false, pate: 0, xaxiu: 0, trung: 0, dua: 0, rau: 0, ot: 0, closed: false, wrapped: false, lockedGold: false, cost: 0, used: [], forOrder: null }; },
    cmds: {
      bread(ws, p, a) {
        if (p.size) { if (p.bake > 0 || p.cut || p.pate) return fail('Bánh đã qua chế biến, hãy giao hoặc bỏ món.'); G.give(ws.shop, 'banh_' + p.size, 1); p.size = null; p.cost = 0; p.used = []; }
        const e = use(ws, p, 'banh_' + a.size, 1); if (e) return e;
        p.size = a.size; p.forOrder = ws.sel || null; return ok({ sfx: 'tap', busy: 0.3, key: 'bread' });
      },
      oven(ws, p) {
        if (!p.size) return fail('Hãy lấy ổ bánh trước.'); if (p.cut) return fail('Bánh đã rạch, không nướng lại được.');
        if (BM.state(ws, p) === 'burnt') return fail('Bánh cháy rồi, hãy bỏ món.');
        p.inOven = !p.inOven; return ok({ sfx: p.inOven ? 'sizzle' : 'tap' });
      },
      cut(ws, p) {
        if (!p.size) return fail('Hãy lấy ổ bánh trước.'); if (p.inOven) return fail('Hãy lấy bánh ra khỏi lò trước.'); if (p.cut) return fail('Đã rạch rồi.');
        if (BM.state(ws, p) === 'burnt') return fail('Bánh cháy rồi, hãy bỏ món.');
        return ok({ sfx: 'cut', busy: [0.8, 0.8, 0.6, 0.4][eq(ws, 'dao')], key: 'cut' });
      },
      add(ws, p, a) {
        if (!p.cut) return fail('Hãy rạch bánh trước.'); if (p.closed) return fail('Đã khép bánh.');
        const k = a.id;
        if ((k === 'xaxiu' || k === 'trung') && p.pate === 0) return fail('Phết pate trước rồi mới thêm nhân.');
        const max = { pate: 3, xaxiu: 3, trung: 2, dua: 2, rau: 2, ot: 2 }[k]; if ((p[k] || 0) >= max) return fail('Đã đủ nhiều rồi.');
        const e = use(ws, p, k, 1); if (e) return e; p[k] = (p[k] || 0) + 1; return ok({ sfx: k === 'pate' || k === 'ot' ? 'spread' : 'scoop' });
      },
      close(ws, p) { if (!p.cut) return fail('Hãy rạch bánh trước.'); if (p.closed) return fail('Đã khép rồi.'); p.closed = true; return ok({ sfx: 'tap' }); },
      wrap(ws, p) {
        if (!p.closed) return fail('Hãy khép bánh trước khi gói.'); if (p.wrapped) return fail('Đã gói rồi.');
        const e = use(ws, p, 'giay', 1); if (e) return e;
        return ok({ sfx: 'wrap', busy: [1.5, 1.5, 1.1, 0.8][eq(ws, 'goi')], key: 'wrap' });
      },
    },
    tick(ws, p, dt) {
      if (!p || !p.inOven) return;
      p.bake += dt;
      const z = BM.zone(ws);
      if (eq(ws, 'lo') >= 3 && p.bake >= z.gold[1] - 0.2 && !p.lockedGold) { p.lockedGold = true; p.inOven = false; p.bake = Math.min(p.bake, z.gold[1] - 0.3); ws.msgs.push({ t: 'Lò giữ ấm: bánh đã vàng giòn, tự lấy ra.', kind: 'ok' }); }
      if (p.bake > z.dark && !p.warned) { p.warned = true; ws.msgs.push({ t: 'Bánh cháy rồi!', kind: 'err' }); G.emit('burnt'); }
    },
    finishBusy(ws, p, key) { if (!p) return; if (key === 'cut') p.cut = true; if (key === 'wrap') p.wrapped = true; },
    canDeliver(ws, p) { if (!p.size) return 'Chưa có bánh.'; if (BM.state(ws, p) === 'burnt') return 'Bánh cháy không giao được.'; if (!p.cut) return 'Bánh chưa rạch và thêm nhân.'; if (!p.wrapped) return 'Hãy khép bánh và gói giấy (đơn mang đi).'; return null; },
    grade(spec, p, ws) {
      const st = BM.state(ws, p);
      const chin = { gold: 1, dark: 0.7, near: 0.7, raw: 0.3, burnt: 0 }[st];
      const parts = { chin, nhan: U.diffScore(spec, p, ['pate', 'xaxiu', 'trung']), co: p.size === spec.size ? 1 : 0.4, sot: U.diffScore(spec, p, ['dua', 'rau', 'ot']), xuly: (p.closed ? 0.5 : 0) + (p.wrapped ? 0.5 : 0) };
      const q = U.weights(parts, { chin: 0.3, nhan: 0.35, co: 0.1, sot: 0.15, xuly: 0.1 });
      const c = [];
      if (chin < 1) c.push(st === 'raw' ? 'Bánh còn hơi sống' : st === 'dark' ? 'Bánh hơi sẫm' : 'Bánh chưa vàng giòn'); if (parts.nhan < 1) c.push('Nhân chưa đúng lượng'); if (parts.co < 1) c.push('Sai cỡ bánh'); if (parts.sot < 1) c.push('Rau, sốt chưa đúng');
      return { quality: q, perfect: q >= 0.95, reject: q < 0.5, parts, comments: c };
    },
    hint(ws, p, o) {
      if (!o) return 'Chạm một khách để ghim đơn.';
      const s = o.spec;
      if (!p || !p.size) return `Lấy ổ ${s.size === 'l' ? 'lớn' : 'nhỏ'}.`;
      const st = BM.state(ws, p);
      if (!p.cut) { if (p.inOven) return st === 'gold' ? '✨ VÀNG GIÒN, lấy bánh ra ngay!' : 'Đang nướng… chờ bánh vàng giòn.'; if (st === 'raw' || st === 'near') return 'Cho bánh vào lò than.'; return 'Chạm “Rạch bánh”.'; }
      if (p.pate < s.pate) return 'Phết pate.';
      const miss = ['xaxiu', 'trung', 'dua', 'rau', 'ot'].find((k) => (p[k] || 0) < s[k]);
      if (miss) return `Thêm ${BM_NAMES[miss]}.`;
      if (!p.closed) return 'Chạm “Khép bánh”.';
      if (!p.wrapped) return 'Gói giấy.';
      return 'Xong! Chạm “Giao” rồi chọn khách.';
    },
  };

  /* =========================================================================
     4) XÔI — hấp mẻ trước ca · lá/đĩa · đơm · topping · (ngũ sắc) · gói · giao
     ========================================================================= */
  const XB = { gac: 'Xôi gấc', nuong: 'Xôi nương', dua: 'Xôi dừa', ngusac: 'Xôi ngũ sắc' };
  const XT = { ga: 'Gà xé', dau: 'Đậu xanh', hanh: 'Hành phi', dua: 'Dừa nạo' };
  const COLORS = [['#c8301f', 'đỏ gấc'], ['#f2c230', 'vàng nghệ'], ['#3e8f4a', 'xanh lá dứa'], ['#7a4aa8', 'tím cẩm'], ['#f4efe2', 'trắng nếp']];
  const XO = R.xoi = {
    BASES: XB, TOPS: XT, COLORS,
    batchSize(ws) { return [10, 10, 15, 20][G.eqLv('xoi', 'xung')]; },
    scoopsFor(size) { return size === 'l' ? 3 : 2; },
    makeOrder(ws, reg) {
      const lv = G.S.shops.xoi.level, easy = ws.tutorial && ws.oid < 3;
      const base = easy ? 'nuong' : (lv >= 5 && Math.random() < 0.22 ? 'ngusac' : pick(['gac', 'nuong', 'dua']));
      const tops = {}; const keys = ['ga', 'dau', 'hanh', 'dua'].sort(() => Math.random() - 0.5).slice(0, easy ? 1 : ri(1, 2));
      keys.forEach((k) => { tops[k] = easy ? 1 : ri(1, 2); });
      const s = { base, size: easy ? 's' : (Math.random() < 0.35 ? 'l' : 's'), tops, wrap: Math.random() < 0.7 ? 'la' : 'dia', surcharge: 0 };
      s.surcharge = (s.size === 'l' ? 0.25 : 0) + sum(tops) * 0.05 + (base === 'ngusac' ? 0.5 : 0);
      return s;
    },
    chips(s) { return [XB[s.base], s.size === 'l' ? 'Phần lớn (3 muỗng)' : 'Phần nhỏ (2 muỗng)', ...U.arr(s.tops, XT), s.wrap === 'la' ? 'gói lá, buộc lạt' : 'đĩa, tại quán']; },
    newProduct() { return { container: null, base: null, scoops: 0, tops: {}, colors: [], fold: false, tied: false, spoon: false, cost: 0, used: [], forOrder: null }; },
    cmds: {
      container(ws, p, a) {
        if (p.container) { if (p.base || p.scoops || sum(p.tops)) return fail('Đã có xôi trong đồ đựng. Hãy giao hoặc bỏ món.'); G.give(ws.shop, p.container === 'la' ? 'la' : 'dia', 1); p.container = null; p.cost = 0; p.used = []; }
        const e = use(ws, p, a.type === 'la' ? 'la' : 'dia', 1); if (e) return e;
        p.container = a.type; p.forOrder = ws.sel || null; return ok({ sfx: 'tap', busy: 0.3, key: 'cont' });
      },
      base(ws, p, a) {
        if (!p.container) return fail('Hãy chọn lá hoặc đĩa trước.'); if (p.base && p.base !== a.id && p.scoops > 0) return fail('Đã đơm xôi khác, hãy gạt ra trước.');
        if (G.stock('xoi', 'p_' + a.id) <= 0) return fail(`Chưa có mẻ ${XB[a.id]} đã hấp. Hãy hấp mẻ ở “Chuẩn bị”.`);
        p.base = a.id; return ok({ sfx: 'tap' });
      },
      scoop(ws, p) {
        if (!p.base) return fail('Hãy chọn loại xôi trước.'); if (p.fold) return fail('Đã gói.'); if (p.base === 'ngusac') return fail('Xôi ngũ sắc cần xếp 5 màu.');
        if (p.scoops >= 6) return fail('Xôi đã đầy.');
        if (!G.take('xoi', 'p_' + p.base, 1)) return fail('Hết xôi trong xửng, hãy hấp thêm mẻ.');
        p.cost = (p.cost || 0) + G.unitCost('xoi', 'nep_' + p.base) / XO.batchSize(ws); p.scoops++; return ok({ sfx: 'scoop' });
      },
      scrape(ws, p) { if (p.scoops <= 0) return fail('Chưa có xôi để gạt.'); if (p.fold) return fail('Đã gói.'); p.scoops--; ws.wasteCost = (ws.wasteCost || 0) + 1; return ok({ sfx: 'tap' }); },
      color(ws, p, a) {
        if (p.base !== 'ngusac') return fail('Chỉ xôi ngũ sắc mới cần xếp màu.'); if (p.fold) return fail('Đã gói.');
        if (p.colors.length >= 5) return fail('Đủ 5 màu rồi.');
        if (eq(ws, 'khuon') >= 2 && p.colors.length < 5 && a.idx !== p.colors.length) return fail('Khuôn giữ vị trí: hãy xếp theo thứ tự màu.');
        if (p.colors.indexOf(a.idx) >= 0) return fail('Màu này đã xếp.');
        if (p.colors.length === 0 && !G.take('xoi', 'p_ngusac', 1)) return fail('Chưa có mẻ xôi ngũ sắc đã hấp.');
        p.colors.push(a.idx); if (p.colors.length === 5) p.scoops = 3; return ok({ sfx: 'scoop' });
      },
      top(ws, p, a) {
        if (!p.container) return fail('Hãy chọn lá hoặc đĩa trước.'); if (p.scoops <= 0) return fail('Hãy đơm xôi trước khi thêm topping.'); if (p.fold) return fail('Đã gói.');
        if ((p.tops[a.id] || 0) >= 4) return fail('Đã đủ nhiều.');
        const e = use(ws, p, a.id, 1); if (e) return e; p.tops[a.id] = (p.tops[a.id] || 0) + 1; return ok({ sfx: 'sprinkle' });
      },
      fold(ws, p) { if (p.scoops <= 0) return fail('Chưa có xôi để gói.'); if (p.fold) return fail('Đã gấp lá rồi.'); if (p.container !== 'la') return fail('Đặt thìa cho đĩa tại quán.'); return ok({ sfx: 'wrap', busy: 1.2, key: 'fold' }); },
      tie(ws, p) { if (!p.fold) return fail('Hãy gấp lá trước.'); if (p.tied) return fail('Đã buộc lạt.'); const e = use(ws, p, 'lat', 1); if (e) return e; p.tied = true; return ok({ sfx: 'tap' }); },
      spoon(ws, p) { if (p.container !== 'dia') return fail('Đơn gói lá không cần thìa.'); if (p.scoops <= 0) return fail('Chưa có xôi.'); if (p.spoon) return fail('Đã đặt thìa.'); p.spoon = true; return ok({ sfx: 'tap' }); },
    },
    tick() {},
    finishBusy(ws, p, key) { if (p && key === 'fold') p.fold = true; },
    canDeliver(ws, p) { if (!p.container) return 'Chưa có lá hoặc đĩa.'; if (p.scoops <= 0) return 'Chưa đơm xôi.'; if (p.container === 'la' && !p.tied) return 'Hãy gấp lá và buộc lạt trước khi giao.'; if (p.container === 'dia' && !p.spoon) return 'Hãy đặt thìa lên đĩa.'; return null; },
    grade(spec, p, ws) {
      const need = spec.base === 'ngusac' ? 5 : XO.scoopsFor(spec.size);
      const loai = p.base === spec.base ? 1 : 0;
      const luong = spec.base === 'ngusac' ? (p.colors.length === 5 ? 1 : 0.3) : Math.max(0, 1 - Math.abs(p.scoops - need) / need);
      const parts = { loai, luong, top: U.diffScore(spec.tops, p.tops, ['ga', 'dau', 'hanh', 'dua']), goi: (p.container === spec.wrap ? 0.5 : 0.2) + ((p.container === 'la' ? p.tied : p.spoon) ? 0.5 : 0) };
      let q = U.weights(parts, { loai: 0.3, luong: 0.25, top: 0.3, goi: 0.15 });
      const c = [];
      if (loai < 1) { q = Math.min(q, 0.49); c.push('Sai loại xôi'); }
      if (luong < 1) c.push(p.scoops < need ? 'Xôi hơi ít' : 'Xôi hơi nhiều'); if (parts.top < 1) c.push('Topping chưa đúng số phần'); if (p.container !== spec.wrap) c.push(spec.wrap === 'la' ? 'Khách muốn gói lá mang đi' : 'Khách muốn ăn tại quán');
      return { quality: q, perfect: q >= 0.95, reject: q < 0.5, parts, comments: c };
    },
    hint(ws, p, o) {
      if (!o) return 'Chạm một khách để ghim đơn.';
      const s = o.spec;
      if (!p || !p.container) return s.wrap === 'la' ? 'Lấy lá chuối.' : 'Lấy đĩa.';
      if (!p.base) return `Mở xửng ${XB[s.base]}.`;
      if (s.base === 'ngusac' && p.colors.length < 5) return 'Xếp đủ 5 màu theo khuôn.';
      if (s.base !== 'ngusac' && p.scoops < XO.scoopsFor(s.size)) return `Đơm xôi (${p.scoops}/${XO.scoopsFor(s.size)} muỗng).`;
      const miss = Object.keys(s.tops).find((k) => (p.tops[k] || 0) < s.tops[k]);
      if (miss) return `Thêm ${XT[miss]}.`;
      if (p.container === 'la' && !p.fold) return 'Gấp lá.'; if (p.container === 'la' && !p.tied) return 'Buộc lạt.'; if (p.container === 'dia' && !p.spoon) return 'Đặt thìa.';
      return 'Xong! Chạm “Giao” rồi chọn khách.';
    },
  };

  /* =========================================================================
     5) MỲ CAY — tô · trụng mỳ · nước dùng · topping · nêm cay 1–7 · đũa
     ========================================================================= */
  const MC_TOPS = { thit: 'Thịt', nam: 'Nấm', rau: 'Rau', trung: 'Trứng' };
  const MC_BROTH = { rau: 'nước nấm', thit: 'nước thịt' };
  const MC = R.mycay = {
    TOPS: MC_TOPS, BROTH: MC_BROTH,
    zone(ws) { return [3, 5 + (eq(ws, 'bep') >= 2 ? 1 : 0)]; },
    needleSpeed(ws) { return 2.2 * (eq(ws, 'ot') >= 2 ? 0.85 : 1); },
    makeOrder(ws, reg) {
      const easy = ws.tutorial && ws.oid < 3;
      const spice = easy ? ri(1, 2) : ri(1, 7);
      const tops = {}; ['thit', 'nam', 'rau', 'trung'].sort(() => Math.random() - 0.5).slice(0, easy ? 1 : ri(1, 3)).forEach((k) => { tops[k] = 1; });
      const s = { size: easy ? 's' : (Math.random() < 0.3 ? 'l' : 's'), broth: Math.random() < 0.5 ? 'rau' : 'thit', tops, spice, surcharge: 0 };
      if (reg && reg.id === 'hiepkhach') { s.spice = 7; s.size = 'l'; }
      s.surcharge = (s.size === 'l' ? 0.2 : 0) + sum(tops) * 0.05;
      return s;
    },
    chips(s) { return [s.size === 'l' ? 'Tô lớn' : 'Tô nhỏ', 'mỳ vừa chín', MC_BROTH[s.broth], ...U.arr(s.tops, MC_TOPS), `cay cấp ${s.spice}`]; },
    newProduct() { return { size: null, noodle: 'none', cook: 0, noodleQ: 0, ladle: 0, broth: null, tops: {}, spice: null, gauge: null, sticks: false, cost: 0, used: [], forOrder: null }; },
    cmds: {
      bowl(ws, p, a) {
        if (p.size) { if (p.noodle !== 'none' || p.ladle || sum(p.tops)) return fail('Đã có nguyên liệu trong tô. Hãy giao hoặc bỏ món.'); G.give(ws.shop, 'to_' + p.size, 1); p.size = null; p.cost = 0; p.used = []; }
        const e = use(ws, p, 'to_' + a.size, 1); if (e) return e;
        p.size = a.size; p.forOrder = ws.sel || null; return ok({ sfx: 'tap', busy: 0.3, key: 'bowl' });
      },
      dip(ws, p) {
        if (!p.size) return fail('Hãy lấy tô trước.'); if (p.noodle !== 'none') return fail('Đã trụng mỳ rồi.');
        const e = use(ws, p, 'mi', 1); if (e) return e; p.noodle = 'cooking'; p.cook = 0; return ok({ sfx: 'boil' });
      },
      lift(ws, p) {
        if (p.noodle !== 'cooking') return fail('Chưa hạ rổ mỳ.');
        const z = MC.zone(ws), t = p.cook;
        p.noodleQ = t >= z[0] && t <= z[1] ? 1 : (t >= z[0] - 1 && t < z[0]) || (t > z[1] && t <= z[1] + 1.5) ? 0.6 : t > z[1] + 3 ? 0.2 : 0.3;
        p.noodle = 'done'; return ok({ sfx: 'tap' });
      },
      ladle(ws, p, a) {
        if (p.noodle !== 'done') return fail('Hãy trụng mỳ xong rồi mới múc nước dùng.'); if (p.ladle >= 3) return fail('Nước dùng đã đầy.');
        if (p.broth && p.broth !== a.id) return fail('Một tô chỉ dùng một loại nước dùng.');
        const e = use(ws, p, 'nuoc_' + a.id, 1); if (e) return e; p.broth = a.id; p.ladle++; return ok({ sfx: 'pour' });
      },
      top(ws, p, a) {
        if (p.noodle !== 'done') return fail('Hãy trụng mỳ trước khi thêm topping.'); if ((p.tops[a.id] || 0) >= 2) return fail('Đã đủ nhiều.');
        const e = use(ws, p, a.id, 1); if (e) return e; p.tops[a.id] = (p.tops[a.id] || 0) + 1; return ok({ sfx: 'sprinkle' });
      },
      spice(ws, p) {
        if (p.noodle !== 'done') return fail('Hãy trụng mỳ trước khi nêm cay.'); if (p.spice != null) return fail('Đã nêm cay rồi.'); if (p.gauge) return fail('Đang canh kim, chạm “Dừng”.');
        const e = use(ws, p, 'ot', 1); if (e) return e;
        p.gauge = { pos: 0.1, dir: 1 }; return ok({ sfx: 'pump' });
      },
      stop(ws, p) { if (!p.gauge) return fail('Chưa bắt đầu nêm cay.'); p.spice = G.clamp(Math.ceil(p.gauge.pos), 1, 7); p.gauge = null; return ok({ sfx: 'tap' }); },
      set(ws, p, a) {
        if (!(G.S.settings.relaxed || (G.S.settings.assist && eq(ws, 'ot') >= 3))) return fail('Bật “Hỗ trợ” trong Cài đặt và nâng Muỗng ớt cấp 3 để chọn trực tiếp.');
        if (p.noodle !== 'done') return fail('Hãy trụng mỳ trước khi nêm cay.'); if (p.spice != null) return fail('Đã nêm cay rồi.');
        const e = use(ws, p, 'ot', 1); if (e) return e; p.spice = a.level; return ok({ sfx: 'pump' });
      },
      sticks(ws, p) { if (!p.size) return fail('Chưa có tô.'); if (p.sticks) return fail('Đã đặt đũa.'); const e = use(ws, p, 'dua_an', 1); if (e) return e; p.sticks = true; return ok({ sfx: 'tap' }); },
    },
    tick(ws, p, dt) {
      if (!p) return;
      if (p.noodle === 'cooking') {
        p.cook += dt; const z = MC.zone(ws);
        if (eq(ws, 'bep') >= 3 && p.cook >= z[1] - 0.3) { MC.cmds.lift(ws, p); ws.msgs.push({ t: 'Chuông báo: mỳ đã chín, tự nhấc rổ.', kind: 'ok' }); }
        else if (p.cook > z[1] + 4) { MC.cmds.lift(ws, p); ws.msgs.push({ t: 'Mỳ nhão rồi!', kind: 'err' }); }
      }
      if (p.gauge) { const sp = MC.needleSpeed(ws); p.gauge.pos += p.gauge.dir * sp * dt; if (p.gauge.pos >= 7) { p.gauge.pos = 7; p.gauge.dir = -1; } else if (p.gauge.pos <= 0.05) { p.gauge.pos = 0.05; p.gauge.dir = 1; } }
    },
    finishBusy() {},
    canDeliver(ws, p) { if (!p.size) return 'Chưa có tô.'; if (p.noodle !== 'done') return 'Mỳ chưa trụng xong.'; if (p.ladle < 1) return 'Chưa có nước dùng.'; if (p.spice == null) return 'Chưa nêm cay.'; if (!p.sticks) return 'Hãy đặt đũa.'; return null; },
    grade(spec, p) {
      const dSp = p.spice - spec.spice;
      const cay = dSp === 0 ? 1 : dSp === -1 ? 0.6 : dSp === 1 ? 0.5 : dSp < 0 ? 0.2 : 0;
      const parts = { mi: p.noodleQ, nuoc: (p.broth === spec.broth ? 1 : 0.4) * (p.ladle >= 3 ? 1 : p.ladle === 2 ? 0.8 : 0.6), top: U.diffScore(spec.tops, p.tops, ['thit', 'nam', 'rau', 'trung']), cay, luong: (p.size === spec.size ? 0.7 : 0.3) + (p.sticks ? 0.3 : 0) };
      const q = U.weights(parts, { mi: 0.25, nuoc: 0.2, top: 0.2, cay: 0.25, luong: 0.1 });
      const c = [];
      if (p.noodleQ < 1) c.push(p.noodleQ < 0.5 ? 'Mỳ nhão hoặc còn sống' : 'Mỳ chưa chín tới'); if (parts.nuoc < 1) c.push(p.broth !== spec.broth ? 'Sai nước dùng' : 'Nước dùng chưa đầy'); if (parts.top < 1) c.push('Topping chưa đúng');
      if (dSp < 0) c.push('Hơi nhạt so với cấp ' + spec.spice); if (dSp === 1) c.push('Hơi cay, khách xin nước'); if (dSp >= 2) c.push('Quá cay!');
      return { quality: q, perfect: q >= 0.95 && dSp === 0, reject: q < 0.5 || dSp >= 2, repLoss: dSp >= 2 ? 2 : 1, parts, comments: c };
    },
    hint(ws, p, o) {
      if (!o) return 'Chạm một khách để ghim đơn.';
      const s = o.spec;
      if (!p || !p.size) return `Lấy tô ${s.size === 'l' ? 'lớn' : 'nhỏ'}.`;
      if (p.noodle === 'none') return 'Hạ rổ mỳ vào nồi nước sôi.';
      if (p.noodle === 'cooking') return p.cook >= MC.zone(ws)[0] ? '✨ Mỳ chín, nhấc rổ ngay!' : 'Đang trụng… chờ mỳ chín.';
      if (p.ladle < 3) return `Múc ${MC_BROTH[s.broth]} (${p.ladle}/3 vá).`;
      const miss = Object.keys(s.tops).find((k) => (p.tops[k] || 0) < s.tops[k]);
      if (miss) return `Thêm ${MC_TOPS[miss]}.`;
      if (p.spice == null) return p.gauge ? `Chạm “Dừng” ở cấp ${s.spice}.` : `Nêm ớt: cần cấp ${s.spice}.`;
      if (!p.sticks) return 'Đặt đũa.';
      return 'Xong! Chạm “Giao” rồi chọn khách.';
    },
  };
})();
