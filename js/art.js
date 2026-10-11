/* ART: icon vector (xu cổ, kim nguyên bảo, bảng uy tín) */
(function () {
  'use strict';
  const Art = {};
  window.Art = Art;
  Art.coin = (s = 20) => `<svg class="ic" width="${s}" height="${s}" viewBox="0 0 24 24" aria-hidden="true"><defs><radialGradient id="cg" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="#fff3a0"/><stop offset=".6" stop-color="#ffd54a"/><stop offset="1" stop-color="#c8901a"/></radialGradient></defs><circle cx="12" cy="12" r="10.5" fill="url(#cg)" stroke="#9a6a10" stroke-width="1.6"/><circle cx="12" cy="12" r="8" fill="none" stroke="#b9801a" stroke-width=".8" opacity=".7"/><rect x="9" y="9" width="6" height="6" fill="#3a2a10"/></svg>`;
  Art.gold = (s = 20) => `<svg class="ic" width="${s}" height="${s}" viewBox="0 0 24 24" aria-hidden="true"><defs><linearGradient id="gg" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#fff0a0"/><stop offset=".5" stop-color="#ffcf3a"/><stop offset="1" stop-color="#b8840e"/></linearGradient></defs><path d="M3 15 Q3 11 8 11 H16 Q21 11 21 15 L19 19 H5Z" fill="url(#gg)" stroke="#8a5e08" stroke-width="1.4" stroke-linejoin="round"/><path d="M7 11 Q7 6 12 6 Q17 6 17 11" fill="url(#gg)" stroke="#8a5e08" stroke-width="1.4"/><path d="M8 15h8" stroke="#8a5e08" stroke-width=".9" opacity=".6"/></svg>`;
  Art.rep = (s = 20) => `<svg class="ic" width="${s}" height="${s}" viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="2" width="14" height="17" rx="2" fill="#b8322a" stroke="#ffd54a" stroke-width="1.6"/><path d="M12 5.5l1.6 3.3 3.6.5-2.6 2.5.6 3.6-3.2-1.7-3.2 1.7.6-3.6L6.8 9.3l3.6-.5z" fill="#ffd54a"/><path d="M9 19v3M15 19v3" stroke="#8a5e08" stroke-width="1.6"/></svg>`;
})();
