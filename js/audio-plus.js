/* ============================================================================
   ÂM THANH NÂNG CAO (tổng hợp bằng code, không cần file ngoài):
   - Âm nền hiện trường theo nơi: chợ đông, từng quầy (nước sôi, đá lạch cạch, lò than, hơi xôi, nồi mỳ…), Hội làng,
     cộng thêm dế đêm khi trời tối và mưa khi có mưa.
   - Phong cách nhạc nền: Tự động / Sáo trúc / Hội làng (trống) / Thư giãn / Đêm đèn lồng.
   - Bộ âm nút bấm: Mặc định / Mõ gỗ / Chuông nhỏ / Ống tre.
   Tất cả đọc từ G.S.settings: ambience, ambVol, bgm, uiPack.
   ========================================================================== */
(function () {
  'use strict';
  const A = window.Audio2, G = window.Game;
  if (!A) return;
  const S = () => (G.S && G.S.settings) || {};
  const opt = (k, d) => (S()[k] === undefined ? d : S()[k]);
  const rnd = (a, b) => a + Math.random() * (b - a);
  const ctxOk = () => A.ctx && A.ctx.state === 'running';

  /* ---------- tiện ích nốt ---------- */
  function tone(type, f, t, dur, vol, dest, f2) {
    const ctx = A.ctx, o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(f, t); if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + dur);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(Math.max(0.0002, vol), t + Math.min(0.012, dur / 3)); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(dest); o.start(t); o.stop(t + dur + 0.05); return o;
  }
  function burst(t, dur, vol, dest, type, freq, q) {
    const ctx = A.ctx, n = ctx.createBufferSource(); n.buffer = A.noise;
    const f = ctx.createBiquadFilter(); f.type = type; f.frequency.value = freq; f.Q.value = q || 1;
    const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(Math.max(0.0002, vol), t + 0.008); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    n.connect(f); f.connect(g); g.connect(dest); n.start(t, Math.random()); n.stop(t + dur + 0.05);
  }

  /* ======================================================================
     ÂM NỀN HIỆN TRƯỜNG
     ====================================================================== */
  const AMB = A.amb = { scene: null, layers: [], timer: null, bus: null, ev: null, extra: [], force: null };
  const SCENES = {
    market:  { beds: [['bandpass', 520, .7, .5], ['lowpass', 260, .5, .35]], events: 'market' },
    trada:   { beds: [['lowpass', 380, .8, .45], ['bandpass', 600, .6, .18]], events: 'trada' },
    trasua:  { beds: [['bandpass', 560, .7, .22], ['lowpass', 240, .5, .22]], events: 'trasua' },
    banhmi:  { beds: [['bandpass', 520, .7, .22], ['highpass', 3800, .5, .05]], events: 'banhmi' },
    xoi:     { beds: [['highpass', 5200, .4, .13], ['bandpass', 480, .6, .18]], events: 'xoi' },
    mycay:   { beds: [['lowpass', 520, .8, .45], ['bandpass', 600, .6, .15]], events: 'mycay' },
    festival:{ beds: [['bandpass', 640, .6, .3], ['lowpass', 220, .5, .18]], events: 'festival' }
  };
  function ensureBus() {
    if (AMB.bus || !A.ctx) return;
    AMB.bus = A.ctx.createGain(); AMB.bus.gain.value = 0; AMB.bus.connect(A.master);
    // một chút vang (delay) cho tiếng chuông xa
    AMB.delay = A.ctx.createDelay(1); AMB.delay.delayTime.value = .31; const fb = A.ctx.createGain(); fb.gain.value = .32; AMB.delay.connect(fb); fb.connect(AMB.delay); AMB.delay.connect(AMB.bus);
  }
  function bed(kind, freq, q, gain) {
    const ctx = A.ctx, n = ctx.createBufferSource(); n.buffer = A.noise; n.loop = true;
    const f = ctx.createBiquadFilter(); f.type = kind; f.frequency.value = freq; f.Q.value = q;
    const g = ctx.createGain(); g.gain.value = 0;
    // nhịp "thở" chậm cho tiếng ồn
    const lfo = ctx.createOscillator(), lg = ctx.createGain(); lfo.frequency.value = rnd(.08, .25); lg.gain.value = gain * .35; lfo.connect(lg); lg.connect(g.gain);
    n.connect(f); f.connect(g); g.connect(AMB.bus); n.start(0, Math.random()); lfo.start();
    g.gain.setTargetAtTime(gain, ctx.currentTime, .9);
    return { stop() { g.gain.setTargetAtTime(0, ctx.currentTime, .4); setTimeout(() => { try { n.stop(); lfo.stop(); } catch (e) { /* đã dừng */ } }, 1800); } };
  }
  const EVENTS = {
    voice(t) { const f = rnd(210, 520); tone('sine', f, t, rnd(.14, .3), .05, AMB.bus, f * rnd(.8, 1.3)); tone('sine', f * 2.1, t, .12, .02, AMB.bus); },
    clack(t) { burst(t, .05, .08, AMB.bus, 'bandpass', rnd(1500, 2400), 4); },
    gong(t) { tone('sine', 98, t, 3.2, .07, AMB.bus); tone('sine', 196, t, 2.4, .035, AMB.bus); },
    bell(t) { const f = pick([1318, 1568, 1760, 2093]); const o = tone('sine', f, t, 1.2, .035, AMB.bus); void o; tone('sine', f, t, 1.2, .02, AMB.delay); },
    blub(t) { const f = rnd(180, 320); tone('sine', f, t, .12, .07, AMB.bus, f * 2.2); },
    drip(t) { const f = rnd(1300, 2300); tone('sine', f, t, .08, .035, AMB.bus, f * .6); },
    clink(t) { const f = rnd(2300, 3300); tone('sine', f, t, .18, .04, AMB.bus); tone('sine', f * 1.5, t, .12, .02, AMB.bus); },
    shake(t) { for (let i = 0; i < 4; i++) burst(t + i * .07, .05, .06, AMB.bus, 'bandpass', 4200, 2); },
    crackle(t) { burst(t, .03, rnd(.05, .12), AMB.bus, 'highpass', 3200, .7); },
    chop(t) { tone('sine', 140, t, .09, .1, AMB.bus, 70); burst(t, .04, .05, AMB.bus, 'bandpass', 1200, 2); },
    sizzle(t) { burst(t, rnd(.35, .7), .09, AMB.bus, 'highpass', 4200, .6); },
    bamboo(t) { tone('sine', 700, t, .1, .06, AMB.bus, 520); tone('triangle', 1400, t, .06, .03, AMB.bus); },
    drum(t) { tone('sine', 140, t, .3, .13, AMB.bus, 55); },
    bird(t) { const f = rnd(2400, 3600); for (let i = 0; i < 3; i++) tone('sine', f * (1 + i * .12), t + i * .09, .07, .022, AMB.bus, f * 1.25); },
    cricket(t) { for (let i = 0; i < 4; i++) tone('sine', 4300, t + i * .06, .03, .012, AMB.bus); },
    cheer(t) { burst(t, rnd(.5, .9), .07, AMB.bus, 'bandpass', rnd(700, 1100), 1.1); }
  };
  const pick = (a) => a[Math.floor(Math.random() * a.length)];
  const TABLE = {
    market:   [['voice', .9], ['voice', .6], ['clack', .25], ['bell', .08], ['gong', .015], ['bird', .05]],
    trada:    [['blub', .8], ['drip', .5], ['voice', .35], ['clack', .12]],
    trasua:   [['clink', .55], ['shake', .22], ['voice', .35], ['drip', .2]],
    banhmi:   [['crackle', 2.4], ['chop', .35], ['voice', .35], ['sizzle', .12]],
    xoi:      [['bamboo', .3], ['voice', .35], ['blub', .15], ['drip', .12]],
    mycay:    [['blub', 1.1], ['sizzle', .45], ['voice', .35], ['clack', .1]],
    festival: [['drum', .55], ['cheer', .22], ['bird', .18], ['bell', .1], ['voice', .4]]
  };
  function night() { return Number(document.body.dataset.light) === 3; }
  function rainy() { return Number(document.body.dataset.weather) === 2 || S().bgfx === 'rain'; }
  function tickEvents() {
    if (!AMB.scene || !ctxOk()) return;
    const t0 = A.ctx.currentTime, dt = .2;
    (TABLE[AMB.scene] || []).forEach(([name, rate]) => { if (Math.random() < rate * dt) EVENTS[name](t0 + rnd(0, .18)); });
    if (night() && Math.random() < 3.5 * dt) EVENTS.cricket(t0 + rnd(0, .15));
  }
  function setScene(name) {
    if (AMB.scene === name) return;
    AMB.layers.forEach((l) => l.stop()); AMB.layers = []; AMB.extra.forEach((l) => l.stop()); AMB.extra = []; AMB.scene = name;
    if (!name) return; ensureBus(); const cfg = SCENES[name]; if (!cfg) return;
    cfg.beds.forEach(([k, f, q, g]) => AMB.layers.push(bed(k, f, q, g)));
    AMB.rain = false;
  }
  function currentScene() {
    if (AMB.force) return AMB.force;
    if (window.WUI && window.WUI.shop) return window.WUI.shop;
    if (window.UI && window.UI.page === 'festival') return 'festival';
    return 'market';
  }
  function update() {
    if (!A.ctx || !G.S) return;
    if (!ctxOk()) return;
    ensureBus();
    const on = opt('ambience', 1) > 0 && !document.hidden, vol = opt('ambVol', .5);
    const want = on ? (AMB.force || (opt('ambience', 1) === 2 ? 'market' : currentScene())) : null;
    setScene(want);
    AMB.bus.gain.setTargetAtTime(on ? .55 * vol : 0, A.ctx.currentTime, .4);
    // mưa
    if (on && rainy() && !AMB.rainL) AMB.rainL = bed('highpass', 1400, .5, .16);
    if ((!on || !rainy()) && AMB.rainL) { AMB.rainL.stop(); AMB.rainL = null; }
  }
  AMB.start = () => { if (AMB.timer) return; AMB.timer = setInterval(update, 700); AMB.ev = setInterval(tickEvents, 200); };
  AMB.preview = (name) => { AMB.force = name; update(); setTimeout(() => { if (AMB.force === name) { AMB.force = null; update(); } }, 6000); };
  document.addEventListener('visibilitychange', () => { if (document.hidden) setScene(null); else update(); });
  const unlock = A.unlock; A.unlock = function () { unlock.apply(this, arguments); AMB.start(); };
  if (A.ctx) AMB.start();

  /* ======================================================================
     PHONG CÁCH NHẠC NỀN
     ====================================================================== */
  const baseSetMode = A.setMode, baseSchedule = A.schedule;
  const forceMode = () => { const st = opt('bgm', 'auto'); return st === 'sao' ? 'calm' : st === 'hoi' ? 'rush' : null; };
  A.setMode = function (m) { return baseSetMode.call(this, forceMode() || m); };
  const PEN = [261.63, 293.66, 329.63, 392, 440, 523.25, 587.33, 659.25, 784];
  const C2 = { next: 0, step: 0, lastStyle: null, delay: null };
  function music2(style) {
    const ctx = A.ctx; if (!ctx || ctx.state !== 'running' || document.hidden) { if (ctx) C2.next = Math.max(C2.next, ctx.currentTime + .1); return; }
    if ((S().music || 0) <= 0) { C2.next = ctx.currentTime + .1; return; }
    if (!C2.delay) { C2.delay = ctx.createDelay(1); C2.delay.delayTime.value = .38; const fb = ctx.createGain(); fb.gain.value = .38; C2.delay.connect(fb); fb.connect(C2.delay); C2.delay.connect(A.musicBus); }
    if (C2.lastStyle !== style) { C2.lastStyle = style; C2.next = ctx.currentTime + .15; C2.step = 0; }
    const bpm = style === 'chill' ? 64 : 44, dur = 60 / bpm / 2, root = style === 'chill' ? 0 : -5, f = (i) => PEN[i] * Math.pow(2, root / 12);
    while (C2.next < ctx.currentTime + .35) {
      const t = C2.next, i = C2.step;
      if (style === 'chill') {
        if (i % 16 === 0) { const ch = [[0, 2, 4], [1, 3, 5], [2, 4, 6], [0, 3, 5]][(i / 16) % 4]; ch.forEach((n, k) => { tone('sine', f(n) / 2, t, dur * 14, .13, A.musicBus); tone('triangle', f(n), t + k * .02, dur * 10, .05, A.musicBus); }); }
        if (i % 2 === 0 && Math.random() < .62) { const n = Math.floor(rnd(2, 8)); tone('sine', f(n), t, dur * 6, .13, A.musicBus); tone('sine', f(n), t, dur * 6, .09, C2.delay); }
        if (i % 8 === 4) burst(t, .05, .03, A.musicBus, 'highpass', 6000, .6);
      } else { // đêm đèn lồng: trầm, thưa, vang xa
        if (i % 32 === 0) { tone('sine', f(0) / 2, t, dur * 30, .16, A.musicBus); tone('sine', f(3) / 2, t, dur * 30, .09, A.musicBus); }
        if (i % 6 === 0 && Math.random() < .7) { const n = Math.floor(rnd(3, 9)); tone('triangle', f(n) * 1.004, t, 1.6, .17, A.musicBus); tone('triangle', f(n), t, 1.6, .12, C2.delay); }
        if (i % 16 === 8) tone('sine', f(Math.floor(rnd(5, 9))) * 2, t, 1.2, .05, C2.delay);
      }
      C2.next += dur; C2.step++;
    }
  }
  A.schedule = function () {
    const st = opt('bgm', 'auto');
    if (st === 'chill' || st === 'dem') { if (A.ctx) A.nextT = A.ctx.currentTime + .2; return music2(st); }
    if (C2.lastStyle && (st !== C2.lastStyle)) { C2.lastStyle = null; if (A.ctx) A.nextT = A.ctx.currentTime + .15; A.step = 0; }
    const fm = forceMode(); if (fm && A.mode !== fm) baseSetMode.call(A, fm);
    return baseSchedule.apply(this, arguments);
  };

  /* ======================================================================
     BỘ ÂM NÚT BẤM
     ====================================================================== */
  const baseSfx = A.sfx;
  const PACKS = {
    wood: { click: (t) => { tone('triangle', 820, t, .09, .3, A.sfxBus, 410); burst(t, .03, .12, A.sfxBus, 'lowpass', 1800, .8); }, tap: (t) => { tone('triangle', 640, t, .08, .26, A.sfxBus, 360); } },
    bell: { click: (t) => { tone('sine', 1568, t, .35, .2, A.sfxBus); tone('sine', 2349, t + .01, .25, .08, A.sfxBus); }, tap: (t) => { tone('sine', 1175, t, .28, .17, A.sfxBus); } },
    bamboo: { click: (t) => { tone('sine', 760, t, .1, .26, A.sfxBus, 520); tone('triangle', 1500, t, .06, .1, A.sfxBus); }, tap: (t) => { tone('sine', 560, t, .09, .22, A.sfxBus, 420); } }
  };
  A.sfx = function (type) {
    const pk = PACKS[opt('uiPack', 'default')];
    if (pk && pk[type] && ctxOk() && (S().sfx || 0) > 0) { try { pk[type](A.ctx.currentTime); return; } catch (e) { /* dùng âm mặc định */ } }
    return baseSfx.apply(this, arguments);
  };
})();
