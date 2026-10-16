/* ============================================================================
   MAIN: khởi động, màn mở đầu, vòng lặp (requestAnimationFrame), lưu tự động
   ========================================================================== */
(function () {
  'use strict';
  const G = window.Game, C = window.CFG;
  const $ = (q) => document.querySelector(q);

  function boot() {
    G.load();
    const vfx = new window.VFX($('#vfx'));
    window.UI.init(vfx);
    if (G.S.ws) { if (!window.WS.restore(G.S.ws)) G.S.ws = null; }
    window.debugGame = { G, UI: window.UI, WS: window.WS, WUI: window.WUI, R: window.R, MM: window.MM, Audio2: window.Audio2, vfx };
    startSplash();
    window.MM.refresh();
  }

  function startSplash() {
    const sp = $('#splash'), hasSave = !G.isNew, resumed = !!window.WS.state();
    $('#splashBtn').textContent = hasSave ? (resumed ? 'Tiếp Tục Ca Đang Dở' : 'Trở Về Chợ Cổ') : 'Bước Vào Chợ Cổ';
    $('#splashStory').innerHTML = hasSave
      ? `Chào mừng <b>${G.rankName()}</b> trở lại! Chợ làng cổ vẫn nhộn nhịp chờ bạn.${resumed ? '<br><small>Ca bán đang dở được giữ ở trạng thái tạm dừng.</small>' : ''}${G.migrated ? '<br><small>Đã chuyển tiến trình từ bản trước: giữ xu, nguyên bảo, cấp quầy, nhân viên và thành tựu.</small>' : ''}`
      : 'Một tia sét xé ngang trời… bạn mở mắt ra bên cổng một <b>chợ làng cổ</b>, trong tay chỉ có một ấm trà đất nung.<br>Hãy tự tay <b>rót trà, pha trà sữa, nướng bánh mì, đơm xôi, nấu mỳ cay</b> để trở thành <b>Đại Phú Hào</b> của cả khu chợ!';
    $('#splashBtn').onclick = () => {
      window.Audio2.unlock(); window.Audio2.sfx('gong'); G.buzz([40, 50, 80]);
      sp.classList.add('out'); setTimeout(() => { sp.hidden = true; }, 600);
      const off = G.offline();
      if (off && off.earn > 0) { window.UI.modal(`<h3>🌙 Trong lúc bạn vắng mặt…</h3><p>Tiểu nhị quản lý quầy <b>${Math.round(off.dt / 60)} phút</b> và kiếm được</p><p class="big">${window.Art.coin(24)} ${G.fmt(off.earn)}</p><button class="btn gold" data-close>Nhận xu</button>`); window.Audio2.sfx('coins'); }
      else window.UI.chapterIntro();
      G.dailyBonus(); G.save();
      if (resumed) window.WUI.open(window.WS.state().shop);
    };
  }

  /* vòng lặp: mỗi khung hình, dt tối đa 0,1 s */
  let last = performance.now(), frame = 0, saveT = 0, achT = 0;
  function loop(t) {
    const dt = Math.min(0.1, (t - last) / 1000); last = t; frame++;
    if (G.S) {
      G.tick(dt); window.WS.tick(dt); window.MM.tick(dt); window.LivingMarket.tick(dt);
      if (frame % 2 === 0) { window.WUI.update(); window.UI.refresh(); }
      achT += dt; if (achT >= 1) { achT = 0; G.checkAchievements(); }
      saveT += dt; if (saveT >= G.S.settings.autosave) { saveT = 0; G.save(); }
    }
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
  window.addEventListener('pagehide', () => G.S && G.save());
  document.addEventListener('visibilitychange', () => { if (document.hidden && G.S) G.save(); });
  document.addEventListener('contextmenu', (e) => e.preventDefault());
  window.addEventListener('DOMContentLoaded', boot);
})();
