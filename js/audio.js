/* ============================================================================
   ÂM THANH (Web Audio API, tổng hợp hoàn toàn bằng code — không cần file ngoài)
   - BGM thường: đàn tranh + sáo trúc, 75 BPM, thang âm ngũ cung
   - BGM giờ cao điểm: trống trận + đàn nhị, 120 BPM
   - SFX: xu, rót nước, xèo xèo, xuýt xoa cay, hô "Hảo hán!", chiêng, thăng cấp...
   ========================================================================== */
(function () {
  'use strict';
  const A = {
    ctx: null, master: null, musicBus: null, sfxBus: null, noise: null,
    mode: 'calm', timer: null, step: 0, nextT: 0, rootShift: 0, started: false,
  };
  window.Audio2 = A;
  const S = () => window.Game.S.settings;

  // D major pentatonic (Hz): D4 E4 F#4 A4 B4 D5 E5 F#5 A5
  const PENTA = [293.66, 329.63, 369.99, 440, 493.88, 587.33, 659.25, 739.99, 880];
  const semis = (f, s) => f * Math.pow(2, s / 12);

  A.init = function () {
    if (A.ctx) return;
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    A.ctx = new Ctx();
    A.master = A.ctx.createGain(); A.master.connect(A.ctx.destination);
    A.musicBus = A.ctx.createGain(); A.musicBus.connect(A.master);
    A.sfxBus = A.ctx.createGain(); A.sfxBus.connect(A.master);
    // nhiễu trắng dùng cho xèo xèo / nước / trống
    const len = A.ctx.sampleRate * 1.5, buf = A.ctx.createBuffer(1, len, A.ctx.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    A.noise = buf;
    A.applyVolumes();
  };
  A.unlock = function () {
    A.init();
    if (A.ctx && A.ctx.state === 'suspended') A.ctx.resume().catch(() => {});
    if (!A.started && A.ctx) { A.started = true; A.startMusic(); }
  };
  A.applyVolumes = function () {
    if (!A.ctx) return;
    A.musicBus.gain.value = 0.38 * S().music;
    A.sfxBus.gain.value = 0.55 * S().sfx;
  };

  /* ---------- nốt cơ bản ---------- */
  function env(g, t, a, peak, d) { g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(Math.max(0.0002, peak), t + a); g.gain.exponentialRampToValueAtTime(0.0001, t + a + d); }
  function osc(type, f, t, dur, peak, dest, a = 0.01, glide) {
    const o = A.ctx.createOscillator(), g = A.ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(f, t);
    if (glide) o.frequency.exponentialRampToValueAtTime(glide, t + dur);
    env(g, t, a, peak, dur);
    o.connect(g).connect(dest); o.start(t); o.stop(t + a + dur + 0.05);
    return o;
  }
  function noiseHit(t, dur, peak, dest, type, freq, q) {
    const n = A.ctx.createBufferSource(); n.buffer = A.noise;
    const f = A.ctx.createBiquadFilter(); f.type = type || 'bandpass'; f.frequency.value = freq || 1000; f.Q.value = q || 1;
    const g = A.ctx.createGain(); env(g, t, 0.01, peak, dur);
    n.connect(f).connect(g).connect(dest); n.start(t, Math.random()); n.stop(t + dur + 0.05);
    return f;
  }
  // đàn tranh: tiếng gảy dây (tam giác + lệch cao độ nhẹ)
  function tranh(f, t, v = 0.5) { osc('triangle', f * 1.004, t, 1.1, v, A.musicBus, 0.004); osc('sine', f * 2, t, 0.5, v * 0.25, A.musicBus, 0.004); }
  // sáo trúc: sine + rung (vibrato)
  function flute(f, t, dur, v = 0.35) {
    const o = A.ctx.createOscillator(), g = A.ctx.createGain(), lfo = A.ctx.createOscillator(), lg = A.ctx.createGain();
    o.type = 'sine'; o.frequency.value = f; lfo.frequency.value = 5.2; lg.gain.value = f * 0.012;
    lfo.connect(lg).connect(o.frequency);
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(v, t + 0.12); g.gain.linearRampToValueAtTime(v * 0.7, t + dur * 0.7); g.gain.linearRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(A.musicBus); o.start(t); lfo.start(t); o.stop(t + dur + 0.05); lfo.stop(t + dur + 0.05);
  }
  // đàn nhị: sawtooth qua lowpass, rung mạnh
  function erhu(f, t, dur, v = 0.28) {
    const o = A.ctx.createOscillator(), g = A.ctx.createGain(), lp = A.ctx.createBiquadFilter(), lfo = A.ctx.createOscillator(), lg = A.ctx.createGain();
    o.type = 'sawtooth'; o.frequency.value = f; lp.type = 'lowpass'; lp.frequency.value = 1700; lp.Q.value = 2;
    lfo.frequency.value = 6.5; lg.gain.value = f * 0.02; lfo.connect(lg).connect(o.frequency);
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(v, t + 0.05); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(lp).connect(g).connect(A.musicBus); o.start(t); lfo.start(t); o.stop(t + dur + 0.05); lfo.stop(t + dur + 0.05);
  }
  function drum(t, big) {
    const o = A.ctx.createOscillator(), g = A.ctx.createGain();
    o.type = 'sine'; o.frequency.setValueAtTime(big ? 130 : 180, t); o.frequency.exponentialRampToValueAtTime(big ? 45 : 70, t + 0.22);
    env(g, t, 0.005, big ? 0.9 : 0.55, 0.28); o.connect(g).connect(A.musicBus); o.start(t); o.stop(t + 0.35);
    noiseHit(t, 0.08, big ? 0.25 : 0.18, A.musicBus, 'lowpass', 900, 0.7);
  }

  /* ---------- BGM sequencer ---------- */
  // 16 bước; số = chỉ số trong PENTA, -1 = nghỉ
  const CALM_MEL  = [5, -1, 4, -1, 3, -1, 2, 3, 4, -1, -1, -1, 2, -1, 1, -1, 0, -1, 1, 2, 3, -1, -1, -1, 2, -1, 1, -1, 0, -1, -1, -1];
  const CALM_FLUTE = [[0, 7, 5], [8, 7, 6], [16, 8, 5], [24, 6, 6]]; // [bước, nốt, độ dài bước]
  const RUSH_MEL  = [5, -1, 6, 5, 4, -1, 3, 4, 5, -1, 5, 6, 7, -1, 6, 5, 4, -1, 3, 2, 3, 4, 5, -1, 4, 3, 2, -1, 3, -1, 5, -1];
  A.setTheme = function (id) { A.rootShift = { thanhphong: 0, daituong: -2, giangnam: 2, thuymac: -5, dahoi: -3 }[id] || 0; };
  A.setMode = function (m) { if (A.mode !== m) { A.mode = m; A.step = 0; if (A.ctx) A.nextT = A.ctx.currentTime + 0.1; } };
  A.startMusic = function () {
    if (!A.ctx || A.timer) return;
    A.nextT = A.ctx.currentTime + 0.2; A.step = 0;
    A.timer = setInterval(A.schedule, 80);
  };
  A.schedule = function () {
    if (!A.ctx || A.ctx.state !== 'running' || document.hidden) { if (A.ctx) A.nextT = Math.max(A.nextT, A.ctx.currentTime + 0.1); return; }
    if (S().music <= 0) { A.nextT = A.ctx.currentTime + 0.1; return; }
    const rush = A.mode === 'rush';
    const bpm = rush ? 120 : 75, dur = 60 / bpm / 2; // một bước = nốt móc đơn
    while (A.nextT < A.ctx.currentTime + 0.35) {
      const i = A.step % 32, t = A.nextT, sh = A.rootShift;
      const mel = rush ? RUSH_MEL : CALM_MEL, n = mel[i];
      if (n >= 0) {
        const f = semis(PENTA[n], sh);
        if (rush) erhu(f, t, dur * 1.8, 0.24); else tranh(f, t, 0.5);
      }
      if (!rush) {
        CALM_FLUTE.forEach(([b, k, l]) => { if (i === b) flute(semis(PENTA[k] * 0.5 * 2, sh), t, dur * l * 1.1, 0.26); });
        if (i % 8 === 0) osc('sine', semis(PENTA[i % 16 === 0 ? 0 : 3] / 2, sh), t, dur * 7, 0.32, A.musicBus, 0.05); // nền trầm
      } else {
        if (i % 4 === 0) drum(t, i % 8 === 0);
        if (i % 8 === 4) noiseHit(t, 0.12, 0.22, A.musicBus, 'highpass', 2200, 0.8);
        if (i % 2 === 1) osc('square', semis(PENTA[0] / 2, sh), t, 0.05, 0.07, A.musicBus, 0.003);
      }
      A.nextT += dur; A.step++;
    }
  };

  /* ---------- SFX ---------- */
  const lastSpeech = { t: 0 };
  A.sfx = function (type) {
    if (!A.ctx || A.ctx.state !== 'running' || S().sfx <= 0) return;
    const t = A.ctx.currentTime, d = A.sfxBus, p = 0.9 + Math.random() * 0.2; // pitch ngẫu nhiên 0.9–1.1
    switch (type) {
      case 'coin': osc('sine', 987.77 * p, t, 0.28, 0.35, d, 0.004, 1318.51 * p); osc('triangle', 1975 * p, t + 0.05, 0.22, 0.12, d, 0.004); noiseHit(t, 0.05, 0.08, d, 'highpass', 5000, 1); break;
      case 'coins': for (let k = 0; k < 4; k++) { const tt = t + k * 0.055; osc('sine', (880 + k * 140) * p, tt, 0.2, 0.25, d, 0.004, (1200 + k * 160) * p); } break;
      case 'pour': { const f = noiseHit(t, 0.5, 0.3, d, 'bandpass', 700, 4); f.frequency.setValueAtTime(500, t); f.frequency.exponentialRampToValueAtTime(1500 * p, t + 0.45); break; }
      case 'sizzle': noiseHit(t, 0.55, 0.32, d, 'highpass', 3200, 0.6); noiseHit(t + 0.05, 0.4, 0.2, d, 'bandpass', 5200, 0.9); break;
      case 'spicy': osc('sawtooth', 320, t, 0.45, 0.22, d, 0.01, 90); noiseHit(t, 0.5, 0.3, d, 'bandpass', 1400, 1.2); break;
      case 'click': osc('square', 760 * p, t, 0.05, 0.12, d, 0.002, 380); break;
      case 'tap': osc('sine', 520 * p, t, 0.07, 0.18, d, 0.003, 300); break;
      case 'error': osc('sawtooth', 180, t, 0.25, 0.22, d, 0.005, 110); osc('sawtooth', 150, t + 0.12, 0.3, 0.2, d, 0.005, 90); break;
      case 'fail': osc('triangle', 392, t, 0.25, 0.25, d); osc('triangle', 311, t + 0.2, 0.4, 0.25, d); break;
      case 'buy': osc('sine', 660, t, 0.18, 0.28, d, 0.004); osc('sine', 880, t + 0.09, 0.25, 0.28, d, 0.004); osc('triangle', 1320, t + 0.18, 0.3, 0.18, d, 0.004); break;
      case 'levelup': [0, 2, 4, 5, 7].forEach((n, k) => { osc('triangle', PENTA[n] * 2, t + k * 0.09, 0.4, 0.3, d, 0.005); tranh(PENTA[n] * 2, t + k * 0.09, 0.3); }); noiseHit(t + 0.4, 0.5, 0.2, d, 'highpass', 4000, 0.7); break;
      case 'gong': osc('sine', 110, t, 2.4, 0.5, d, 0.01); osc('sine', 221, t, 1.8, 0.28, d, 0.01); osc('sine', 331, t, 1.4, 0.16, d, 0.01); noiseHit(t, 0.4, 0.12, d, 'bandpass', 600, 1.5); break;
      case 'cheer': [0, 2, 4, 5].forEach((n, k) => osc('triangle', PENTA[n] * 2, t + k * 0.07, 0.35, 0.22, d, 0.005)); A.speak('Hảo hán!'); break;
      case 'fire': noiseHit(t, 0.6, 0.35, d, 'lowpass', 900, 0.8); osc('sawtooth', 200, t, 0.5, 0.12, d, 0.02, 70); break;
      case 'scoop': noiseHit(t, 0.12, 0.25, d, 'bandpass', 2400, 1); osc('sine', 420 * p, t + 0.06, 0.1, 0.18, d, 0.003, 260); break;
      case 'pump': osc('sine', 300 * p, t, 0.14, 0.25, d, 0.004, 520); noiseHit(t + 0.05, 0.14, 0.12, d, 'lowpass', 1200, 1); break;
      case 'ice': for (let k = 0; k < 3; k++) osc('triangle', (1800 + k * 300) * p, t + k * 0.05, 0.1, 0.18, d, 0.002, 1200); break;
      case 'stir': for (let k = 0; k < 5; k++) noiseHit(t + k * 0.12, 0.1, 0.12, d, 'bandpass', 1500 + k * 120, 2); break;
      case 'seal': osc('sawtooth', 120, t, 0.18, 0.3, d, 0.005, 70); osc('square', 900, t + 0.35, 0.08, 0.3, d, 0.002, 600); break;
      case 'spread': noiseHit(t, 0.2, 0.16, d, 'bandpass', 900, 1); break;
      case 'cut': noiseHit(t, 0.12, 0.3, d, 'highpass', 2500, 1); osc('square', 700, t, 0.05, 0.12, d, 0.002, 300); break;
      case 'wrap': for (let k = 0; k < 3; k++) noiseHit(t + k * 0.1, 0.09, 0.14, d, 'highpass', 3500, 0.7); break;
      case 'sprinkle': for (let k = 0; k < 4; k++) osc('sine', (900 + Math.random() * 500) * p, t + k * 0.04, 0.06, 0.1, d, 0.002); break;
      case 'boil': noiseHit(t, 0.7, 0.2, d, 'lowpass', 700, 0.8); break;
      case 'trash': osc('sawtooth', 160, t, 0.18, 0.25, d, 0.004, 80); break;
      default: break;
    }
  };
  // giọng hô cổ trang bằng speechSynthesis (nếu thiết bị hỗ trợ tiếng Việt)
  A.speak = function (text) {
    try {
      if (!S().speech || S().sfx <= 0 || !window.speechSynthesis) return;
      const n = performance.now(); if (n - lastSpeech.t < 6000) return; lastSpeech.t = n;
      const u = new SpeechSynthesisUtterance(text); u.lang = 'vi-VN'; u.rate = 1.05; u.pitch = 0.8; u.volume = Math.min(1, S().sfx);
      window.speechSynthesis.cancel(); window.speechSynthesis.speak(u);
    } catch (e) { /* không hỗ trợ */ }
  };
  document.addEventListener('visibilitychange', () => { if (A.ctx) { if (document.hidden) A.ctx.suspend().catch(() => {}); else A.ctx.resume().catch(() => {}); } });
})();
