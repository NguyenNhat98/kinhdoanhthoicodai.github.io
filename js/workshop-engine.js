/* ============================================================================
   ENGINE QUẦY: ca bán, đơn có định danh, sản phẩm trên bàn, trạm bận, khay giữ món,
   chấm chất lượng, thanh toán MỘT lần, tổng kết ca, lưu/khôi phục snapshot ca.
   Mọi thời gian chạy theo đồng hồ ca (tạm dừng được); không dùng setTimeout cho luật chơi.
   ========================================================================== */
(function () {
  'use strict';
  const G = window.Game, C = window.CFG, R = window.R;
  const WS = { ws: null };
  window.WS = WS;
  const S = () => G.S;
  const rand = G.rand, pick = G.pick;

  WS.state = () => WS.ws;
  WS.activeShop = () => (WS.ws ? WS.ws.shop : null);
  WS.rushOn = () => !!(WS.ws && WS.ws.rush && WS.ws.clock >= WS.ws.rush.start && WS.ws.clock < WS.ws.rush.end && !WS.ws.paused);
  WS.boostPatience = (m) => { if (WS.ws) WS.ws.patMul = Math.max(WS.ws.patMul, m); };

  /* ---------- bắt đầu / kết thúc ca ---------- */
  WS.start = function (shop) {
    if (WS.ws) return { ok: false, msg: 'Đang có một ca khác chưa chốt.' };
    const st = S().shops[shop]; if (!st.unlocked) return { ok: false, msg: 'Quầy chưa mở khóa.' };
    const tutorial = !S().tut[shop];
    const def = G.shopDef(shop);
    const ws = {
      shop, tutorial, clock: 0, total: tutorial ? C.tutorialShiftSec : S().settings.shiftLength, accepting: true, graceLeft: C.graceSec, paused: false, pauseWhy: {},
      orders: [], oid: 0, sel: null, product: null, shelf: [], hold: null, busy: null, nextSpawn: 1.5, patMul: 1, ended: false, msgs: [],
      dirty: { s: 0, l: 0 }, scoopN: 1, served: 0, tutTarget: 3,
      stats: { revenue: 0, cost: 0, waste: 0, tips: 0, served: 0, perfect: 0, cancelled: 0, left: 0, rep: 0 }, reasons: {}, hearts: {},
      rush: null, rushNoted: 0, difficulty: S().settings.difficulty, doorOpen: true,
    };
    // giờ cao điểm: tối đa một lần mỗi ca, sau hướng dẫn, và khi quầy đã có trang bị
    const hasEq = Object.keys(S().eq[shop] || {}).some((k) => S().eq[shop][k] > 0);
    if (!tutorial && hasEq) { const s0 = rand(90, 140); ws.rush = { warn: s0 - 5, start: s0, end: s0 + 30 }; }
    WS.ws = ws; G.emit('shiftStart', { shop });
    G.save(); return { ok: true };
  };
  WS.setPause = function (why, on) {
    const ws = WS.ws; if (!ws) return;
    if (on) ws.pauseWhy[why] = 1; else delete ws.pauseWhy[why];
    ws.paused = Object.keys(ws.pauseWhy).length > 0;
    if (ws.paused) ws.hold = null;
  };

  function summarize(ws, early) {
    const s = ws.stats, reasons = Object.keys(ws.reasons).sort((a, b) => ws.reasons[b] - ws.reasons[a]).slice(0, 3);
    return { shop: ws.shop, tutorial: ws.tutorial, revenue: Math.round(s.revenue), cost: Math.round(s.cost), waste: Math.round(s.waste), tips: Math.round(s.tips), profit: Math.round(s.revenue - s.cost - s.waste), served: s.served, perfect: s.perfect, cancelled: s.cancelled, left: s.left, rep: Math.round(s.rep * 10) / 10, comments: reasons, early: !!early };
  }
  WS.finish = function (early) {
    const ws = WS.ws; if (!ws) return null;
    // món còn trên bàn / khay: ghi hao phí
    const rest = [ws.product].concat(ws.shelf).filter(Boolean);
    rest.forEach((p) => { ws.stats.waste += p.cost || 0; S().stats.waste += p.cost || 0; });
    ws.orders.forEach((o) => { if (o.status === 'wait') ws.stats.left++; });
    const sum = summarize(ws, early);
    ws.ended = true;
    S().stats.shifts++; S().day++;
    if (ws.tutorial) S().tut[ws.shop] = true;
    WS.ws = null;
    G.emit('shiftEnd', sum); G.checkAchievements(); G.save();
    return sum;
  };
  WS.endNow = function () { return WS.finish(true); };

  /* ---------- đơn ---------- */
  function patience(ws) {
    const def = G.shopDef(ws.shop);
    if (ws.tutorial) return 9999;
    return (rand(def.patience[0], def.patience[1]) + Math.min(20, G.patienceBonus(ws.shop))) * ws.patMul * [1.5, 1, 0.8][ws.difficulty == null ? 1 : ws.difficulty];
  }
  function newOrder(ws) {
    const def = G.shopDef(ws.shop), reg = pickRegular(ws);
    const vip = !ws.tutorial && Math.random() < 0.08;
    const who = reg ? { name: reg.name, avatar: reg.avatar, regular: reg.id } : vip ? Object.assign({ vip: true }, pick(C.vipCustomers)) : Object.assign({}, pick(C.customers.filter((c) => !ws.orders.some((o) => o.who.name === c.name))));
    const spec = R[ws.shop].makeOrder(ws, reg);
    const p = patience(ws) * (vip ? 0.9 : 1);
    const o = { id: ++ws.oid, who, vip, spec, p, max: p, status: 'wait', mood: 0, paid: false };
    ws.orders.push(o); if (S().settings.autoSelect && !ws.sel) WS.select(o.id); G.emit('order', { order: o }); return o;
  }
  function pickRegular(ws) {
    if (ws.tutorial || Math.random() > 0.3) return null;
    const lst = C.regulars.filter((r) => r.shop === ws.shop && !ws.orders.some((o) => o.who.regular === r.id));
    return lst.length ? pick(lst) : null;
  }
  WS.waiting = () => (WS.ws ? WS.ws.orders.filter((o) => o.status === 'wait') : []);
  WS.select = function (id) {
    const ws = WS.ws; if (!ws) return;
    const o = ws.orders.find((x) => x.id === id && x.status === 'wait'); if (!o) return;
    ws.sel = id; o.progress = true; if (ws.product && !ws.product.forOrder) ws.product.forOrder = id; G.emit('select', { id });
  };

  /* ---------- lệnh người chơi ---------- */
  WS.cmd = function (name, arg) {
    const ws = WS.ws; if (!ws || ws.paused || ws.ended) return { ok: false, msg: 'Ca đang tạm dừng.' };
    const mod = R[ws.shop], fn = mod.cmds[name]; if (!fn) return { ok: false, msg: 'Lệnh không hợp lệ.' };
    if (ws.busy) return { ok: false, msg: 'Đang bận: ' + ws.busy.label + '…', busy: true };
    let p = ws.product;
    const startCmds = { cup: 1, bowl: 1, bread: 1, container: 1 };
    if (!p) { if (!startCmds[name]) return { ok: false, msg: 'Hãy lấy dụng cụ đựng (ly, bát, ổ, lá, tô) trước.' }; p = mod.newProduct(); ws.product = p; }
    if (ws.hold) ws.hold = null;
    const res = fn(ws, p, arg || {});
    if (!res.ok) { if (!startCmds[name] || !p.size && !p.container) { /* sản phẩm rỗng vừa tạo bị hủy */ } if (isEmptyProduct(ws, p)) ws.product = null; G.emit('cmdFail', res); return res; }
    if (res.busy) ws.busy = { t: res.busy, total: res.busy, key: res.key, label: ({ cup: 'lấy ly', bowl: 'lấy dụng cụ', bread: 'lấy bánh', cont: 'lấy lá', stir: 'khuấy', seal: 'ép nắp', cut: 'rạch bánh', wrap: 'gói', fold: 'gấp lá', top: 'múc', sugar: 'bơm', ice: 'múc đá' })[res.key] || 'làm việc' };
    G.emit('cmd', { name, arg, res }); return res;
  };
  function isEmptyProduct(ws, p) { return p && !p.size && !p.container; }

  /* rót giữ vòi (hold) */
  WS.holdStart = function (kind, id) {
    const ws = WS.ws; if (!ws || ws.paused) return { ok: false, msg: 'Ca đang tạm dừng.' };
    if (ws.busy) return { ok: false, msg: 'Đang bận: ' + ws.busy.label + '…' };
    const p = ws.product; if (!p || !(p.size)) return { ok: false, msg: ws.shop === 'trasua' ? 'Hãy lấy ly trước.' : 'Hãy lấy bát trước.' };
    if (ws.shop === 'trada') {
      if (!p.pourDone) { const e = R.use(ws, p, 'tra', 1); if (e) return e; p.pourDone = true; }
    } else if (ws.shop === 'trasua') {
      if (p.lid) return { ok: false, msg: 'Đã đóng nắp.' };
      if (kind === 'tea') { if (p.tea && p.tea !== id) return { ok: false, msg: 'Một nền trà mỗi ly. Sai nền thì bỏ món pha lại.' }; if (!p.tea) { const e = R.use(ws, p, 'tra_' + id, 1); if (e) return e; p.tea = id; } }
      else { if (!p.teaVol) return { ok: false, msg: 'Hãy rót trà trước, rồi mới thêm sữa.' }; if (p.milk && p.milk !== id) return { ok: false, msg: 'Chỉ một loại sữa cho mỗi ly.' }; if (!p.milk) { const e = R.use(ws, p, id === 'tuoi' ? 'sua_tuoi' : id === 'dac' ? 'sua_dac' : 'kem', 1); if (e) return e; p.milk = id; } }
    } else return { ok: false, msg: 'Quầy này không rót bằng vòi.' };
    ws.hold = { kind, id }; return { ok: true };
  };
  WS.holdStop = function () { const ws = WS.ws; if (ws && ws.hold) { ws.hold = null; G.emit('holdStop'); } };

  /* bỏ món: ghi hao phí, không trả nguyên liệu (trừ đồ đựng sạch) */
  WS.discard = function (from) {
    const ws = WS.ws; if (!ws) return { ok: false, msg: '' };
    if (from != null && from !== 'table') { const p = ws.shelf.splice(from, 1)[0]; if (p) { ws.stats.waste += p.cost || 0; S().stats.waste += p.cost || 0; } return { ok: true }; }
    const p = ws.product; if (!p) return { ok: false, msg: 'Không có món nào trên bàn.' };
    ws.hold = null; ws.busy = null;
    ws.stats.waste += p.cost || 0; S().stats.waste += p.cost || 0; ws.product = null; G.emit('discard', { cost: p.cost });
    return { ok: true };
  };
  WS.shelve = function () {
    const ws = WS.ws; if (!ws) return { ok: false, msg: '' };
    const slots = G.shelfSlots(ws.shop); if (slots <= 0) return { ok: false, msg: 'Chưa có khay giữ món. Nâng cấp “Khay giữ món” để dùng.' };
    if (ws.shelf.length >= slots) return { ok: false, msg: 'Khay giữ món đã đầy.' };
    const p = ws.product; if (!p) return { ok: false, msg: 'Không có món nào trên bàn.' };
    const why = R[ws.shop].canDeliver(ws, p); if (why) return { ok: false, msg: 'Chỉ cất món đã hoàn thiện. ' + why };
    ws.shelf.push(p); ws.product = null; G.emit('shelve'); return { ok: true };
  };
  WS.unshelve = function (i) {
    const ws = WS.ws; if (!ws || ws.product) return { ok: false, msg: 'Bàn đang có món, hãy giao hoặc cất trước.' };
    ws.product = ws.shelf.splice(i, 1)[0]; return { ok: true };
  };
  WS.dirtyClean = function () {
    const ws = WS.ws; if (!ws || ws.shop !== 'trada') return { ok: false, msg: '' };
    if (ws.busy) return { ok: false, msg: 'Đang bận: ' + ws.busy.label + '…' };
    const sz = ws.dirty.l > 0 ? 'l' : ws.dirty.s > 0 ? 's' : null; if (!sz) return { ok: false, msg: 'Không có bát cần rửa.' };
    ws.busy = { t: [0.8, 0.6, 0.45, 0.3][G.eqLv('trada', 'chau')], total: 0.6, key: 'wash:' + sz, label: 'rửa bát' };
    return { ok: true };
  };

  /* ---------- giao món & thanh toán (một lần) ---------- */
  WS.deliver = function (orderId, src) {
    const ws = WS.ws; if (!ws || ws.paused) return { ok: false, msg: 'Ca đang tạm dừng.' };
    const o = ws.orders.find((x) => x.id === orderId && x.status === 'wait'); if (!o) return { ok: false, msg: 'Khách này không còn chờ.' };
    if (o.paid) return { ok: false, msg: '' };
    const useShelf = src != null && src !== 'table';
    const p = useShelf ? ws.shelf[src] : ws.product; if (!p) return { ok: false, msg: 'Chưa có món để giao.' };
    if (ws.busy && !useShelf) return { ok: false, msg: 'Đang bận: ' + ws.busy.label + '…' };
    const mod = R[ws.shop];
    if (p.forOrder && p.forOrder !== o.id) { const other = ws.orders.find((x) => x.id === p.forOrder && x.status === 'wait'); if (other) return { ok: false, msg: `Món này dành cho ${other.who.name}.`, wrongTarget: true }; }
    const why = mod.canDeliver(ws, p); if (why) return { ok: false, msg: why };
    o.paid = true; ws.hold = null;
    const g = mod.grade(o.spec, p, ws);
    const q = g.quality, S_ = S(), sh = S_.shops[ws.shop];
    ws.stats.cost += p.cost || 0;
    let pay = 0, tip = 0, streakBonus = false;
    if (g.reject) {
      ws.stats.cancelled++; ws.stats.rep -= (g.repLoss || 1); if (!ws.tutorial) S_.rep = Math.max(0, S_.rep - (g.repLoss || 1)); S_.stats.failed++; sh.streak = 0;
    } else {
      let mult = G.baseOrderPrice(ws.shop) * (1 + (o.spec.surcharge || 0)) * G.shopMult(ws.shop) * G.repMult() * G.eventMult() * q * (o.vip ? 2 : 1);
      const rapid = o.p / o.max >= 0.5 && !ws.tutorial ? 1.1 : 1; mult *= rapid;
      if (g.perfect) { tip = mult * 0.5; mult *= 1.5; }
      if (ws.shop === 'trasua') { if (g.perfect) { sh.streak++; if (sh.streak >= 5) { mult *= 2; sh.streak = 0; streakBonus = true; S_.stats.streaks++; } } else sh.streak = 0; }
      pay = Math.round(mult); G.addCoins(pay);
      ws.stats.revenue += pay; ws.stats.tips += Math.round(tip); ws.stats.served++; ws.served++; sh.served++; S_.stats.served++;
      if (g.perfect) { ws.stats.perfect++; sh.perfectN++; S_.stats.perfect++; }
      const dRep = g.perfect ? (o.vip ? 3 : 1) : q >= 0.8 ? 0.3 : 0; if (!ws.tutorial) S_.rep += dRep; ws.stats.rep += dRep;
      if (o.who.regular && q >= 0.8 && !ws.hearts[o.who.regular]) { ws.hearts[o.who.regular] = 1; S_.rel[o.who.regular] = Math.min(5, (S_.rel[o.who.regular] || 0) + 1); }
    }
    g.comments.forEach((c) => { ws.reasons[c] = (ws.reasons[c] || 0) + 1; });
    o.status = 'done'; o.mood = g.reject ? -2 : g.perfect ? 2 : q >= 0.8 ? 1 : 0;
    if (useShelf) ws.shelf.splice(src, 1); else ws.product = null;
    if (ws.shop === 'trada') { ws.dirty[p.size]++; }
    if (ws.shop === 'xoi' && p.container === 'dia') G.give('xoi', 'dia', 1);
    ws.sel = ws.orders.find((x) => x.status === 'wait') ? ws.orders.find((x) => x.status === 'wait').id : null;
    G.emit('delivered', { order: o, grade: g, pay, tip, streakBonus });
    G.checkAchievements();
    return { ok: true, grade: g, pay };
  };

  /* ---------- vòng lặp ca ---------- */
  WS.tick = function (dt) {
    const ws = WS.ws;
    stepSteam(dt);
    if (!ws || ws.paused || ws.ended) return;
    ws.clock += dt;
    const mod = R[ws.shop];
    // rót giữ vòi
    if (ws.hold && ws.product) holdTick(ws, dt);
    // đồng hồ trạm
    if (ws.product) mod.tick(ws, ws.product, dt);
    if (ws.busy) {
      ws.busy.t -= dt;
      if (ws.busy.t <= 0) {
        const b = ws.busy; ws.busy = null;
        if (b.key && b.key.indexOf('wash:') === 0) { const sz = b.key.slice(5); if (ws.dirty[sz] > 0) { ws.dirty[sz]--; G.give('trada', 'bat_' + sz, 1); } G.emit('washed'); }
        else mod.finishBusy(ws, ws.product, b.key);
        G.emit('busyDone', { key: b.key });
      }
    }
    // hết kiên nhẫn
    ws.orders.forEach((o) => {
      if (o.status !== 'wait') return;
      if (!ws.tutorial) o.p -= dt;
      if (o.p <= 0) { o.status = 'left'; o.mood = -2; ws.stats.left++; if (!ws.tutorial) { S().rep = Math.max(0, S().rep - 0.5); ws.stats.rep -= 0.5; } ws.reasons['Khách chờ quá lâu'] = (ws.reasons['Khách chờ quá lâu'] || 0) + 1; if (ws.product && ws.product.forOrder === o.id) ws.product.forOrder = null; if (ws.sel === o.id) ws.sel = null; G.emit('left', { order: o }); }
    });
    ws.orders = ws.orders.filter((o) => o.status === 'wait' || ws.clock - (o.endClock || (o.endClock = ws.clock)) < 1.6);
    // sinh khách
    const def = G.shopDef(ws.shop);
    const waiting = ws.orders.filter((o) => o.status === 'wait').length;
    const cap = 3;
    if (ws.accepting && ws.doorOpen !== false) {
      ws.nextSpawn -= dt;
      if (ws.nextSpawn <= 0) {
        if (waiting < cap && !(ws.tutorial && ws.oid >= ws.tutTarget)) { newOrder(ws); ws.nextSpawn = rand(def.spawn[0], def.spawn[1]) * (WS.rushOn() ? 0.75 : 1) * [1.3, 1, 0.85][ws.difficulty == null ? 1 : ws.difficulty]; if (ws.tutorial) ws.nextSpawn = 9; }
        else ws.nextSpawn = 2; // hàng đầy: khách đi chợ tiếp, không sinh đơn để phạt
      }
    }
    // giờ cao điểm
    if (ws.rush) {
      if (ws.clock >= ws.rush.warn && !ws.rushNoted) { ws.rushNoted = 1; G.emit('rushWarn'); }
      if (ws.clock >= ws.rush.start && ws.rushNoted === 1) { ws.rushNoted = 2; G.emit('rush'); }
      if (ws.clock >= ws.rush.end && ws.rushNoted === 2) { ws.rushNoted = 3; G.emit('rushEnd'); }
    }
    // kết thúc nhận khách
    if (ws.accepting && ws.clock >= ws.total) { ws.accepting = false; G.emit('closing'); }
    if (!ws.accepting) {
      ws.graceLeft -= dt;
      ws.orders.forEach((o) => { if (o.status === 'wait' && !o.progress && ws.graceLeft <= 0) { o.status = 'left'; ws.stats.left++; } });
      const anyWait = ws.orders.some((o) => o.status === 'wait');
      if (!anyWait || ws.graceLeft <= -5) WS.finish(false);
    } else if (ws.tutorial && ws.oid >= ws.tutTarget && !ws.orders.some((o) => o.status === 'wait')) { ws.accepting = false; ws.graceLeft = 0; }
  };

  function holdTick(ws, dt) {
    const p = ws.product, h = ws.hold, mod = R[ws.shop];
    if (!p || p.lid) { ws.hold = null; return; }
    if (ws.shop === 'trada') {
      const cap = R.trada.cap[p.size], rate = mod.pourRate(ws);
      p.vol += rate * dt;
      const t = R.trada.target(p);
      if (p.vol > cap) { p.vol = cap; p.spilled = true; ws.hold = null; G.emit('spill'); }
      else if (G.S.settings.assist && G.eqLv('trada', 'am') >= 3 && p.vol >= t) { p.vol = t; ws.hold = null; G.emit('autoStop'); }
    } else if (ws.shop === 'trasua') {
      const T = R.trasua, cap = T.capOf(p.size), rate = mod.pourRate(ws, h.kind), add = rate * dt;
      const o = ws.orders.find((x) => x.id === ws.sel);
      if (h.kind === 'tea') p.teaVol += add; else p.milkVol += add;
      const over = T.total(p) - cap;
      if (over > 0) { if (h.kind === 'tea') p.teaVol -= over; else p.milkVol -= over; p.spilled = true; ws.hold = null; G.emit('spill'); return; }
      if (G.S.settings.assist && G.eqLv('trasua', 'voi') >= 3 && o) {
        const liq = T.liquidTarget(p), ratio = T.ratio(o.spec.milk), teaT = liq * ratio;
        if (h.kind === 'tea' && p.teaVol >= teaT) { p.teaVol = teaT; ws.hold = null; G.emit('autoStop'); }
        if (h.kind === 'milk' && p.milkVol >= liq - teaT) { p.milkVol = liq - teaT; ws.hold = null; G.emit('autoStop'); }
      }
    }
  }

  /* ---------- mẻ xôi hấp (chạy cả ngoài ca) ---------- */
  WS.cook = function (type) {
    const S_ = S(); S_.steam = S_.steam || [];
    if (S_.steam.length >= 2) return { ok: false, msg: 'Chỉ hấp tối đa 2 mẻ cùng lúc.' };
    if (!G.take('xoi', 'nep_' + type, 1)) return { ok: false, msg: 'Hết nếp, hãy nhập thêm.' };
    S_.steam.push({ type, t: WS.ws ? 8 : 3, total: WS.ws ? 8 : 3 }); G.emit('steam'); return { ok: true };
  };
  function stepSteam(dt) {
    const a = G.S && G.S.steam; if (!a || !a.length) return;
    for (let i = a.length - 1; i >= 0; i--) {
      a[i].t -= dt;
      if (a[i].t <= 0) { const n = [10, 10, 15, 20][G.eqLv('xoi', 'xung')]; G.give('xoi', 'p_' + a[i].type, n); G.emit('steamDone', { type: a[i].type, n }); a.splice(i, 1); }
    }
  }

  /* ---------- lưu / khôi phục snapshot ca ---------- */
  WS.serialize = function () { return WS.ws ? JSON.parse(JSON.stringify(WS.ws)) : null; };
  WS.restore = function (snap) {
    if (!snap || typeof snap !== 'object' || !snap.shop || !G.S.shops[snap.shop]) return false;
    snap.pauseWhy = { resume: 1 }; snap.paused = true; snap.hold = null; WS.ws = snap; return true;
  };
  WS.drainMsgs = function () { const ws = WS.ws; if (!ws || !ws.msgs.length) return []; const m = ws.msgs; ws.msgs = []; return m; };
})();
