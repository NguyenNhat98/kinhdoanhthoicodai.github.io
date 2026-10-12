/* Hiệu ứng thao tác ở màn quầy: gợn sóng, nảy, tia sáng, chữ nổi, nút gợi ý bước tiếp theo */
(function () {
  'use strict';
  const $ = (q) => document.querySelector(q);
  const reduce = () => document.body.classList.contains('reduce-motion') || document.body.dataset.quality === '0';
  document.addEventListener('pointerdown', (e) => {
    const b = e.target.closest('#stall .tr, #stall .ac, #stall .ch'); if (!b || reduce()) return;
    const r = b.getBoundingClientRect(), d = Math.max(r.width, r.height);
    const rp = document.createElement('i'); rp.className = 'ripple';
    rp.style.cssText = `width:${d}px;height:${d}px;left:${e.clientX - r.left - d / 2}px;top:${e.clientY - r.top - d / 2}px`;
    b.appendChild(rp); setTimeout(() => rp.remove(), 520);
    b.classList.remove('pop'); void b.offsetWidth; b.classList.add('pop');
    if (document.body.dataset.quality === '2') for (let i = 0; i < 5; i++) {
      const sp = document.createElement('span'), a = Math.random() * 6.28, m = 18 + Math.random() * 20;
      sp.className = 'tap-spark'; sp.style.cssText = `left:${e.clientX}px;top:${e.clientY}px;--dx:${Math.cos(a) * m}px;--dy:${Math.sin(a) * m}px`;
      document.body.appendChild(sp); setTimeout(() => sp.remove(), 620);
    }
  }, true);
  document.addEventListener('click', (e) => {
    const h = e.target.closest('[data-fx="hint"]'); if (!h) return;
    const hint = (($('[data-w-hint]') || {}).textContent || '').toLowerCase();
    document.querySelectorAll('.hint-glow').forEach((x) => x.classList.remove('hint-glow'));
    let best = null, len = 0;
    document.querySelectorAll('#stall .tr, #stall .ac').forEach((b) => {
      const t = ((b.querySelector('span') || b).textContent || '').toLowerCase().replace(/[0-9\/·+−]/g, '').trim();
      if (t.length > 1 && hint.indexOf(t) >= 0 && t.length > len) { best = b; len = t.length; }
    });
    if (hint.indexOf('giao') >= 0 && !best) best = document.querySelector('#stall .ac.go');
    if (best) { best.classList.add('hint-glow'); best.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); setTimeout(() => best.classList.remove('hint-glow'), 3300); }
    window.UI.toast(hint ? hint.replace('▸', '').trim() : 'Chọn một khách để bắt đầu.');
  });
})();

/* Biểu tượng bát/tô vẽ bằng SVG (emoji 🥣/🍲 hiển thị sai: bát có thìa, nồi súp) */
(function () {
  'use strict';
  const bowl = (big, shop) => {
    const body = shop === 'trada' ? ['#f6ead0', '#c9a45c', '#8a5a2a'] : ['#e9c9a0', '#b9733a', '#7a3f1a'];
    const w = big ? 30 : 22, h = big ? 15 : 11, x = 18 - w / 2, y = big ? 14 : 17;
    const steam = shop === 'trada' ? '' : `<path d="M13 9q-2-3 0-5M19 9q-2-3 0-5M25 9q-2-3 0-5" stroke="#fff" stroke-opacity=".8" stroke-width="1.5" fill="none" stroke-linecap="round"/>`;
    return `<svg viewBox="0 0 36 32" width="30" height="27" aria-hidden="true">${steam}<ellipse cx="18" cy="${y}" rx="${w / 2}" ry="3.2" fill="${body[0]}" stroke="${body[2]}" stroke-width="1.2"/><path d="M${x} ${y}Q${x + 1} ${y + h} 18 ${y + h}Q${x + w - 1} ${y + h} ${x + w} ${y}Z" fill="${body[1]}" stroke="${body[2]}" stroke-width="1.2" stroke-linejoin="round"/><path d="M${x + 4} ${y + 2}Q${x + 5} ${y + h - 3} 18 ${y + h - 2}" stroke="#fff" stroke-opacity=".45" stroke-width="1.4" fill="none"/><rect x="${18 - w / 4}" y="${y + h}" width="${w / 2}" height="2.2" rx="1" fill="${body[2]}"/></svg>`;
  };
  const decorate = () => {
    const st = document.querySelector('#stall'); if (!st || !st.dataset.shop) return;
    st.querySelectorAll('.tr[data-cmd="bowl"]').forEach((b) => {
      const i = b.querySelector('i'); if (!i || i.dataset.bowl) return;
      let arg = {}; try { arg = JSON.parse(b.dataset.arg || '{}'); } catch (_) { /* bỏ qua */ }
      i.innerHTML = bowl(arg.size === 'l', st.dataset.shop); i.dataset.bowl = 1;
    });
  };
  const W = window.WUI;
  if (W) { const r = W.render, ra = W.renderAll; W.render = function () { r.apply(this, arguments); decorate(); }; W.renderAll = function () { ra.apply(this, arguments); decorate(); }; }
})();
