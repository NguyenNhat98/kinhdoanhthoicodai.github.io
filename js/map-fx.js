/* ============================================================================
   HIỆU ỨNG MÀN HÌNH CHÍNH (bản đồ chợ): bóng mây trôi, tia nắng, đàn chim, bướm, khói bếp, đom đóm ban đêm,
   đèn trời, pháo hoa thỉnh thoảng, sao băng, gợn sáng khi chạm.
   Mỗi hiệu ứng bật/tắt riêng trong Cài đặt → Hiệu ứng → “Hiệu ứng màn hình chính”.
   Tọa độ theo ảnh nền 1672×941 (cùng hệ với bản đồ) nên di chuyển/thu phóng theo bản đồ.
   ========================================================================== */
(function () {
  'use strict';
  const G = window.Game, MM = window.MM, UI = window.UI;
  const $ = (q, r) => (r || document).querySelector(q);
  const rnd = (a, b) => a + Math.random() * (b - a);
  const MF = window.MapFX = { timers: [] };
  const on = (k) => document.body.dataset[k] !== 'false';
  const low = () => document.body.classList.contains('reduce-motion') || document.body.dataset.quality === '0';
  const dens = () => [.5, 1, 1.6][(parseInt(document.body.dataset.fxDensity, 10) || 2) - 1] || 1;
  const night = () => Number(document.body.dataset.light) === 3, dusk = () => Number(document.body.dataset.light) === 2;
  const W = () => (MM.W || 1672), Hh = () => (MM.H || 941);

  const BIRD = '<svg viewBox="0 0 40 20" width="34" height="17"><path class="wl" d="M2 14q9-14 18-2 9-12 18 2-9-4-18 2-9-6-18-2z" fill="#3a3a4a" stroke="#14141e" stroke-width="1.4" stroke-linejoin="round"/></svg>';
  const BFLY = (c1, c2) => `<svg viewBox="0 0 30 24" width="22" height="18"><g class="bw"><path d="M15 12C8 2 1 4 3 11c1 5 7 6 12 1z" fill="${c1}" stroke="#5a2a4a" stroke-width="1"/><path d="M15 12c7-10 14-8 12-1-1 5-7 6-12 1z" fill="${c1}" stroke="#5a2a4a" stroke-width="1"/><path d="M15 12c-6 2-10 8-6 11 3 1 6-4 6-11zM15 12c6 2 10 8 6 11-3 1-6-4-6-11z" fill="${c2}" stroke="#5a2a4a" stroke-width="1"/></g><path d="M15 6v14" stroke="#3a1a2a" stroke-width="2" stroke-linecap="round"/></svg>`;
  const LAN = '<svg viewBox="0 0 30 40" width="26" height="34"><path d="M15 2q-10 6-10 18 0 12 10 18 10-6 10-18 0-12-10-18z" fill="#ff9a3d" stroke="#c8501a" stroke-width="1.6"/><path d="M15 2v36M7 18h16" stroke="#ffd080" stroke-width="1" opacity=".7"/><ellipse cx="15" cy="30" rx="6" ry="4" fill="#fff2a0" opacity=".9"/></svg>';

  function build() {
    const st = MM.stage || $('#mapStage'); if (!st || $('#mfx', st)) return;
    const layer = document.createElement('div'); layer.id = 'mfx'; layer.setAttribute('aria-hidden', 'true');
    const d = dens(), parts = [];
    if (on('mfxCloud')) for (let i = 0; i < Math.round(3 * d); i++) parts.push(`<i class="mfx-shadow" style="top:${rnd(5, 80)}%;--w:${rnd(380, 700)}px;--h:${rnd(130, 260)}px;--d:${rnd(55, 95)}s;--dl:${-rnd(0, 90)}s"></i>`);
    if (on('mfxSun') && !night()) parts.push('<i class="mfx-shaft a"></i><i class="mfx-shaft b"></i><i class="mfx-sunglow"></i>');
    if (on('mfxBird')) for (let i = 0; i < Math.round(5 * d); i++) parts.push(`<i class="mfx-bird" style="top:${rnd(4, 40)}%;--d:${rnd(22, 38)}s;--dl:${-rnd(0, 30)}s;--s:${rnd(.7, 1.2)};--dy:${rnd(-60, 60)}px">${BIRD}</i>`);
    if (on('mfxButterfly') && !night()) for (let i = 0; i < Math.round(5 * d); i++) parts.push(`<i class="mfx-bfly" style="left:${rnd(5, 92)}%;top:${rnd(35, 90)}%;--d:${rnd(7, 13)}s;--dl:${-rnd(0, 10)}s;--x1:${rnd(-120, 120)}px;--y1:${rnd(-80, 60)}px;--x2:${rnd(-140, 140)}px;--y2:${rnd(-90, 70)}px">${BFLY(['#ffb0d8', '#ffd54a', '#9ad8ff', '#c8a0ff', '#ff9a6a'][i % 5], '#fff3e0')}</i>`);
    if (on('mfxSmoke')) [[150, 200], [455, 190], [735, 175], [975, 190], [1205, 185], [330, 420], [860, 440]].forEach(([x, y], k) => { for (let j = 0; j < 3; j++) parts.push(`<i class="mfx-puff" style="left:${x + rnd(-8, 8)}px;top:${y}px;--d:${rnd(4, 6.5)}s;--dl:${-rnd(0, 6) - j * 1.6}s;--dx:${rnd(14, 46)}px"></i>`); });
    if (on('mfxFirefly') && (night() || dusk())) for (let i = 0; i < Math.round((night() ? 26 : 12) * d); i++) parts.push(`<i class="mfx-ff" style="left:${rnd(2, 98)}%;top:${rnd(25, 95)}%;--d:${rnd(5, 11)}s;--dl:${-rnd(0, 10)}s;--x:${rnd(-70, 70)}px;--y:${rnd(-60, 60)}px"></i>`);
    if (on('mfxLantern') && (night() || dusk())) for (let i = 0; i < Math.round(6 * d); i++) parts.push(`<i class="mfx-lan" style="left:${rnd(4, 96)}%;--d:${rnd(22, 38)}s;--dl:${-rnd(0, 36)}s;--sw:${rnd(20, 60)}px;--s:${rnd(.7, 1.15)}">${LAN}</i>`);
    layer.innerHTML = parts.join('');
    // đặt trên nền, dưới nhân vật/pin
    const after = $('.map-glow', st) || st.firstElementChild; if (after && after.nextSibling) st.insertBefore(layer, after.nextSibling); else st.appendChild(layer);
  }

  /* ---- pháo hoa + sao băng định kỳ ---- */
  function fireworkLoop() {
    clearTimeout(MF.fw); MF.fw = setTimeout(() => {
      if (UI.page === 'market' && !document.hidden && on('mfxFirework') && !low() && UI.vfx && (night() || dusk() || G.S.flags.festive)) {
        const n = 1 + Math.floor(Math.random() * 3);
        for (let i = 0; i < n; i++) setTimeout(() => { UI.vfx.fireworks(rnd(innerWidth * .15, innerWidth * .85), rnd(innerHeight * .12, innerHeight * .4)); window.Audio2.sfx('pop'); }, i * 380);
      }
      fireworkLoop();
    }, rnd(11000, 21000));
  }
  function shootLoop() {
    clearTimeout(MF.sh); MF.sh = setTimeout(() => {
      if (UI.page === 'market' && !document.hidden && on('mfxShoot') && !low() && night()) {
        const m = document.createElement('i'); m.className = 'mfx-shoot'; m.style.cssText = `left:${rnd(20, 80)}vw;top:${rnd(14, 34)}vh`; document.body.appendChild(m); setTimeout(() => m.remove(), 1500);
      }
      shootLoop();
    }, rnd(9000, 20000));
  }
  fireworkLoop(); shootLoop();

  /* ---- gợn sáng khi chạm bản đồ ---- */
  document.addEventListener('pointerdown', (e) => {
    if (UI.page !== 'market' || !on('mfxRipple') || low()) return; const m = e.target.closest('#map'); if (!m) return;
    const r = document.createElement('i'); r.className = 'mfx-ripple'; r.style.cssText = `left:${e.clientX}px;top:${e.clientY}px`; document.body.appendChild(r); setTimeout(() => r.remove(), 800);
    if (Math.random() < .5) { const s = document.createElement('i'); s.className = 'mfx-spark'; s.textContent = ['✨', '🌸', '⭐'][Math.floor(Math.random() * 3)]; s.style.cssText = `left:${e.clientX}px;top:${e.clientY}px`; document.body.appendChild(s); setTimeout(() => s.remove(), 900); }
  }, true);

  MF.demo = function () {
    if (!UI.vfx) return; for (let i = 0; i < 3; i++) setTimeout(() => UI.vfx.fireworks(rnd(innerWidth * .2, innerWidth * .8), rnd(innerHeight * .15, innerHeight * .4)), i * 350);
    const m = document.createElement('i'); m.className = 'mfx-shoot'; m.style.cssText = 'left:60vw;top:18vh'; document.body.appendChild(m); setTimeout(() => m.remove(), 1500); window.Audio2.sfx('levelup');
  };

  /* ---- gắn vào bản đồ ---- */
  const mount = MM.mount; MM.mount = function () { mount.apply(this, arguments); build(); };
  const refresh = MM.refresh; let lastKey = '';
  MM.refresh = function () {
    refresh.apply(this, arguments);
    const k = [document.body.dataset.light, document.body.dataset.fxDensity, ['Cloud', 'Sun', 'Bird', 'Butterfly', 'Smoke', 'Firefly', 'Lantern'].map((n) => document.body.dataset['mfx' + n]).join('')].join('|');
    if (k !== lastKey) { lastKey = k; const old = $('#mfx'); if (old) old.remove(); build(); }
  };
})();
