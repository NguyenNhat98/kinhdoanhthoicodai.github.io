/* ============================================================================
   CORE: trạng thái, kinh tế, kho, trang bị, chương, lưu game (có chuyển từ save v1), rung
   ========================================================================== */
(function () {
  'use strict';
  const C = window.CFG;
  const listeners = {};
  const Game = {
    S: null,
    on(e, f) { (listeners[e] = listeners[e] || []).push(f); },
    emit(e, d) { (listeners[e] || []).forEach((f) => { try { f(d); } catch (err) { console.error(e, err); } }); },
  };
  window.Game = Game;

  const rand = (a, b) => a + Math.random() * (b - a);
  const randInt = (a, b) => Math.floor(rand(a, b + 1));
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const now = () => Date.now();
  Object.assign(Game, { rand, randInt, pick, clamp });
  Game.shopDef = (id) => C.shops.find((s) => s.id === id);

  Game.fmt = function (n) {
    n = Number(n) || 0;
    const a = Math.abs(n);
    if (a < 1000) return a < 10 && Math.abs(n % 1) > 0.049 ? n.toFixed(1).replace('.', ',') : String(Math.round(n));
    const U = [[1e15, 'Triệu Tỷ'], [1e12, 'Nghìn Tỷ'], [1e9, 'Tỷ'], [1e6, 'Tr'], [1e3, 'K']];
    for (const [v, s] of U) if (a >= v) { const x = n / v; return (x >= 100 ? x.toFixed(0) : x >= 10 ? x.toFixed(1) : x.toFixed(2)).replace(/\.?0+$/, '').replace('.', ',') + ' ' + s; }
    return String(Math.floor(n));
  };

  /* ---------- trạng thái ---------- */
  function startStock(id) {
    const st = {};
    (C.items[id] || []).forEach((it) => { st[it.id] = it.start; });
    return st;
  }
  function fresh() {
    const shops = {}, stock = {}, eq = {};
    C.shops.forEach((s) => {
      shops[s.id] = { unlocked: s.unlock === 0, level: s.unlock === 0 ? 1 : 0, staff: 0, served: 0, perfectN: 0, streak: 0 };
      stock[s.id] = startStock(s.id); eq[s.id] = {};
    });
    return {
      v: 2, coins: 0, gold: 0, rep: 0, day: 1, shops, stock, eq,
      stats: { earned: 0, served: 0, perfect: 0, failed: 0, shifts: 0, streaks: 0, waste: 0 },
      ach: {}, chapter: 1, chapterSeen: 0, tut: {}, rel: {}, boostUntil: 0, flags: {},
      theme: 'thanhphong', settings: { music: 0.5, sfx: 0.8, haptic: 2, speech: true, tapPour: false, assist: false, relaxed: false, reduce: false },
      lastSeen: now(), started: now(), daily: 0, ws: null, steam: [],
    };
  }
  function normalize(raw) {
    const d = fresh();
    const s = Object.assign({}, d, raw || {});
    s.stats = Object.assign({}, d.stats, raw && raw.stats);
    s.settings = Object.assign({}, d.settings, raw && raw.settings);
    s.ach = Object.assign({}, raw && raw.ach);
    s.tut = Object.assign({}, raw && raw.tut); s.rel = Object.assign({}, raw && raw.rel); s.flags = Object.assign({}, raw && raw.flags);
    s.shops = {}; s.stock = {}; s.eq = {};
    C.shops.forEach((sh) => {
      s.shops[sh.id] = Object.assign({}, d.shops[sh.id], raw && raw.shops && raw.shops[sh.id]);
      s.stock[sh.id] = Object.assign({}, d.stock[sh.id], raw && raw.stock && raw.stock[sh.id]);
      s.eq[sh.id] = Object.assign({}, raw && raw.eq && raw.eq[sh.id]);
      // quầy đã mở nhưng chưa có kho (save cũ): tặng gói nguyên liệu khởi đầu
      if (s.shops[sh.id].unlocked && !(raw && raw.stock && raw.stock[sh.id])) s.stock[sh.id] = startStock(sh.id);
    });
    ['coins', 'gold', 'rep'].forEach((k) => { if (!Number.isFinite(s[k])) s[k] = 0; });
    if (!C.themes.some((t) => t.id === s.theme)) s.theme = 'thanhphong';
    return s;
  }
  Game.load = function () {
    let raw = null, migrated = false;
    try { raw = JSON.parse(localStorage.getItem(C.saveKey) || 'null'); } catch (e) { raw = null; }
    if (!raw) {
      // chuyển dữ liệu từ bản v1: giữ xu, vàng, uy tín, cấp quầy, nhân viên, thành tựu
      try {
        const old = JSON.parse(localStorage.getItem(C.oldSaveKey) || 'null');
        if (old && old.shops) {
          raw = { coins: old.coins, gold: old.gold, rep: old.rep, theme: old.theme, ach: old.ach, stats: { earned: old.stats && old.stats.earned, served: old.stats && old.stats.served, perfect: old.stats && old.stats.perfect },
            shops: {}, settings: old.settings };
          C.shops.forEach((s) => { const o = old.shops[s.id]; if (o) raw.shops[s.id] = { unlocked: o.unlocked, level: o.level, staff: o.staff, served: o.served || 0, perfectN: o.perfectN || 0 }; });
          migrated = true;
        }
      } catch (e) { raw = null; }
    }
    Game.S = normalize(raw);
    Game.isNew = !raw; Game.migrated = migrated;
    if (migrated) Game.save();
  };
  Game.save = function () {
    try {
      Game.S.lastSeen = now();
      Game.S.ws = window.WS ? window.WS.serialize() : null;
      localStorage.setItem(C.saveKey, JSON.stringify(Game.S));
      return true;
    } catch (e) { Game.emit('saveError'); return false; }
  };
  Game.exportCode = () => btoa(unescape(encodeURIComponent(JSON.stringify(Game.S))));
  Game.importCode = function (code) {
    try { const raw = JSON.parse(decodeURIComponent(escape(atob(code.trim())))); if (!raw || !raw.shops) return false; Game.S = normalize(raw); Game.save(); return true; } catch (e) { return false; }
  };
  Game.reset = function () { try { localStorage.removeItem(C.saveKey); localStorage.removeItem(C.oldSaveKey); } catch (e) { /* bỏ qua */ } Game.S = normalize(null); Game.save(); };

  /* ---------- công thức kinh tế ---------- */
  Game.lvlMult = (L) => (1 + 0.4 * (L - 1)) * Math.pow(2, Math.floor(L / 10));
  Game.repMult = () => 1 + Math.min(Game.S.rep, 300) * 0.005;
  Game.isBoost = () => now() < Game.S.boostUntil;
  Game.eventMult = () => (Game.isBoost() ? 2 : 1) * (window.WS && window.WS.rushOn() ? 1.5 : 1);
  Game.shopMult = (id) => Game.lvlMult(Math.max(1, Game.S.shops[id].level));
  Game.baseOrderPrice = (id) => Game.shopDef(id).price * C.orderMult;
  Game.cps = function (id) {
    const st = Game.S.shops[id], def = Game.shopDef(id);
    if (!st.unlocked || st.staff <= 0) return 0;
    if (window.WS && window.WS.activeShop() === id) return 0; // quầy đang chơi thủ công: không tính thu nhập quản lý
    return def.baseCPS * st.staff * Game.lvlMult(st.level) * Game.repMult() * (Game.isBoost() ? 2 : 1);
  };
  Game.totalCPS = () => C.shops.reduce((a, s) => a + Game.cps(s.id), 0);
  Game.upgradeCost = (id) => Math.ceil(Game.shopDef(id).upBase * Math.pow(C.costGrowth, Game.S.shops[id].level - 1));
  Game.hireCost = (id) => Math.ceil(Game.shopDef(id).staffBase * Math.pow(C.costGrowth, Game.S.shops[id].staff));
  Game.rankName = function () { let r = C.ranks[0][1]; for (const [v, n] of C.ranks) if (Game.S.stats.earned >= v) r = n; return r; };

  Game.addCoins = function (n) { n = Math.round(n * 100) / 100; Game.S.coins += n; if (n > 0) Game.S.stats.earned += n; };
  Game.addGold = function (n, why) { Game.S.gold += n; Game.emit('gold', { n, why }); };

  Game.buyShop = function (id) {
    const def = Game.shopDef(id), st = Game.S.shops[id];
    if (st.unlocked || Game.S.coins < def.unlock) return false;
    Game.S.coins -= def.unlock; st.unlocked = true; st.level = 1; Game.S.stock[id] = startStock(id);
    Game.emit('unlock', { id }); Game.save(); return true;
  };
  Game.upgrade = function (id) {
    const st = Game.S.shops[id], cost = Game.upgradeCost(id);
    if (!st.unlocked || Game.S.coins < cost) return false;
    Game.S.coins -= cost; st.level++;
    const milestone = st.level % 10 === 0; if (milestone) Game.addGold(1, 'milestone');
    Game.emit('levelup', { id, level: st.level, milestone }); Game.save(); return true;
  };
  Game.hire = function (id) {
    const st = Game.S.shops[id], cost = Game.hireCost(id);
    if (!st.unlocked || Game.S.coins < cost) return false;
    Game.S.coins -= cost; st.staff++; Game.emit('hire', { id, staff: st.staff }); Game.save(); return true;
  };

  /* ---------- trang bị ---------- */
  Game.eqList = (id) => C.equip.common.concat(C.equip[id] || []);
  Game.eqLv = (id, eq) => (Game.S.eq[id] && Game.S.eq[id][eq]) || 0;
  Game.eqCost = (id, eq) => { const e = Game.eqList(id).find((x) => x.id === eq); const t = Game.eqLv(id, eq) + 1; return Math.ceil(Game.shopDef(id).upBase * e.k * Math.pow(2.2, t - 1)); };
  Game.eqNeed = (id, eq) => [1, 3, 5][Game.eqLv(id, eq)] || 99; // cấp quầy tối thiểu
  Game.eqBuy = function (id, eq) {
    const lv = Game.eqLv(id, eq), st = Game.S.shops[id];
    if (lv >= 3 || !st.unlocked || st.level < Game.eqNeed(id, eq)) return false;
    const c = Game.eqCost(id, eq); if (Game.S.coins < c) return false;
    Game.S.coins -= c; Game.S.eq[id][eq] = lv + 1; Game.emit('equip', { id, eq, lv: lv + 1 }); Game.save(); return true;
  };
  Game.patienceBonus = (id) => [0, 3, 6, 10][Game.eqLv(id, 'mai')];
  Game.shelfSlots = (id) => Game.eqLv(id, 'khay');

  /* ---------- kho ---------- */
  Game.stock = (shop, item) => (Game.S.stock[shop] && Game.S.stock[shop][item]) || 0;
  Game.take = function (shop, item, n) {
    n = n == null ? 1 : n;
    if (Game.stock(shop, item) < n) return false;
    Game.S.stock[shop][item] -= n; return true;
  };
  Game.give = function (shop, item, n) { Game.S.stock[shop][item] = Game.stock(shop, item) + (n == null ? 1 : n); };
  Game.itemDef = (shop, item) => C.items[shop].find((i) => i.id === item);
  Game.packCost = function (shop, item) {
    const d = Game.itemDef(shop, item), sd = Game.shopDef(shop);
    return Math.max(1, Math.ceil(sd.itemCost * d.w * sd.pack * (item.indexOf('nep_') === 0 ? 1 : 1)));
  };
  Game.packSize = (shop, item) => { const d = Game.itemDef(shop, item); return d.batch ? 1 : Game.shopDef(shop).pack; };
  Game.buyPack = function (shop, item) {
    const d = Game.itemDef(shop, item), c = d.w === 0 ? 0 : Game.packCost(shop, item);
    if (Game.S.coins < c) return false;
    Game.S.coins -= c; Game.give(shop, item, Game.packSize(shop, item));
    // chi phí nguyên liệu tính ở lúc nhập hàng; thống kê cuối ca dùng giá vốn từng phần đã dùng
    Game.emit('stock', { shop, item }); Game.save(); return true;
  };
  Game.unitCost = (shop, item) => { const d = Game.itemDef(shop, item); return Game.shopDef(shop).itemCost * d.w; };

  /* ---------- chương, thành tựu, quà ngày ---------- */
  Game.chapterDef = () => C.chapters.find((c) => c.id === Game.S.chapter) || null;
  Game.checkChapter = function () {
    const S = Game.S, ch = Game.chapterDef();
    if (ch && ch.check(S)) {
      if (ch.reward.coins) Game.addCoins(ch.reward.coins); if (ch.reward.gold) Game.addGold(ch.reward.gold, 'chapter');
      S.chapter++; Game.emit('chapterDone', ch); Game.save();
    }
  };
  Game.checkAchievements = function () {
    const S = Game.S;
    C.achievements.forEach((a) => { if (!S.ach[a.id] && a.check(S)) { S.ach[a.id] = true; Game.addGold(a.gold, 'ach'); Game.emit('achievement', a); } });
    Game.checkChapter();
  };
  Game.dailyBonus = function () {
    const S = Game.S, day = Math.floor((now() - 6 * 3600e3) / 864e5);
    if (S.daily !== day) { S.daily = day; Game.addGold(2, 'daily'); return true; }
    return false;
  };
  Game.buyPerk = function (id) {
    const S = Game.S, p = C.perks.find((x) => x.id === id);
    if (!p || S.gold < p.cost) return false;
    if (id === 'patience' && !(window.WS && window.WS.state())) return 'noshift';
    S.gold -= p.cost;
    if (id === 'boost') S.boostUntil = Math.max(now(), S.boostUntil) + 600000;
    if (id === 'cash') Game.addCoins(Math.max(50, Game.totalCPS() * 600));
    if (id === 'patience') window.WS.boostPatience(1.2);
    Game.emit('perk', { id }); Game.save(); return true;
  };
  Game.offline = function () {
    const S = Game.S, dt = clamp((now() - S.lastSeen) / 1000, 0, C.offlineCapSec);
    if (dt < 60) return 0;
    const earn = C.shops.reduce((a, s) => a + (S.shops[s.id].unlocked && S.shops[s.id].staff > 0 ? s.baseCPS * S.shops[s.id].staff * Game.lvlMult(S.shops[s.id].level) * Game.repMult() : 0), 0) * dt * C.offlineRate;
    if (earn > 0) Game.addCoins(earn);
    return { earn, dt };
  };
  Game.tick = function (dt) { const c = Game.totalCPS(); if (c > 0) Game.addCoins(c * dt); };

  /* ---------- RUNG ---------- */
  const MUL = [0, 0.6, 1, 1.7], MINMS = [0, 12, 20, 34];
  const BRIDGES = ['Android', 'AndroidBridge', 'NativeBridge', 'JSInterface', 'AppBridge', 'Native'];
  function nativeVib(ms) {
    try {
      const cap = window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.Haptics;
      if (cap && cap.vibrate) { cap.vibrate({ duration: ms }); return true; }
      for (const o of BRIDGES) { const b = window[o]; if (b && typeof b.vibrate === 'function') { b.vibrate(ms); return true; } }
    } catch (e) { /* bỏ qua */ }
    return false;
  }
  Game.buzz = function (pattern) {
    const lv = Game.S ? Game.S.settings.haptic : 2;
    if (!lv) return false;
    const arr = (Array.isArray(pattern) ? pattern : [pattern || 10]).map((v, i) => (i % 2 === 0 ? Math.max(MINMS[lv], Math.round(v * MUL[lv])) : v));
    try { if (typeof navigator.vibrate === 'function' && navigator.vibrate(arr) !== false) return true; } catch (e) { /* thử cầu nối */ }
    let t = 0, sent = false;
    arr.forEach((v, i) => { if (i % 2 === 0) { sent = true; setTimeout(() => nativeVib(v), t); } t += v; });
    return sent;
  };
})();
