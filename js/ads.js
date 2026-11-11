/* ===== Quảng cáo (Unity LevelPlay): quảng cáo thưởng + quảng cáo xen kẽ =====
   Chỉ hoạt động trong bản APK (Capacitor + plugin LevelPlay, xem apk/native). Trên web / file:// mọi hàm đều "không khả dụng"
   nên game chạy bình thường và không hiện nút quảng cáo. Thêm ?adsmock=1 vào địa chỉ để giả lập quảng cáo khi thử trên trình duyệt.
   ID quảng cáo nằm trong apk/ads-config.json (build-apk.ps1 ghi ra js/ads-config.js → window.DT_ADS_CONFIG).

   Chỗ đặt quảng cáo:
   · Thưởng:  Tổng kết ca (nhân đôi lãi) · Sự cố trong ca (mất điện/cháy/trộm/ngộ độc: khắc phục ngay) ·
              Quà lúc vắng mặt (×2) · Nghiên cứu (rút ngắn 1 ca, xem dev.js)
   · Xen kẽ:  Sau Tổng kết ca (mỗi 2 ca) · Sau khi rời một trò Hội làng (mỗi 3 lần) */
(function () {
  'use strict';
  const G = window.Game, WS = window.WS, UI = window.UI, E = window.Events;
  const $ = (q, r) => (r || document).querySelector(q);

  const GAP_MS = 3 * 60e3;            // tối thiểu giữa 2 lần quảng cáo xen kẽ
  const AFTER_REWARDED_MS = 2 * 60e3; // vừa xem quảng cáo thưởng thì chưa chèn xen kẽ
  const NEW_PLAYER_MS = 5 * 60e3;     // người chơi mới: 5 phút đầu kể từ lần mở game đầu tiên không có xen kẽ
  const EVERY = { shift: 2, game: 3 };
  const RESCUE_MS = 12000;            // nút "Khắc phục" tự tắt sau 12 giây

  const cap = window.Capacitor, L = cap && cap.Plugins && cap.Plugins.LevelPlay;
  const native = !!(L && cap.isNativePlatform && cap.isNativePlatform());
  const mock = /[?&]adsmock=1/.test(location.search);
  const Ads = window.Ads = { enabled: native || mock };

  let rewardedOk = mock, interOk = mock, busy = false, done = null, lastInter = 0, lastReward = 0;
  const counts = {};

  /* thời điểm mở game lần đầu (để chừa thời gian làm quen) */
  let firstRun = Date.now();
  try { const k = 'dt_ads_first', v = +localStorage.getItem(k); if (v) firstRun = v; else localStorage.setItem(k, String(firstRun)); } catch (e) { /* bỏ qua */ }

  function ready() { rewardedOk = true; window.dispatchEvent(new Event('ads:ready')); }

  if (native) {
    const cfg = window.DT_ADS_CONFIG || {};
    L.addListener('rewardedLoaded', ready);
    L.addListener('rewardedDone', (e) => { const cb = done; done = null; rewardedOk = false; if (cb) cb(!!(e && e.earned)); });   // chỉ trả thưởng khi xem đủ
    L.addListener('interstitialLoaded', () => { interOk = true; });
    L.init({ appKey: cfg.appKey, rewardedId: cfg.rewardedId, interstitialId: cfg.interstitialId }).catch(() => { /* không có mạng / chưa duyệt: game vẫn chạy */ });
  }

  /* quảng cáo giả để thử trên trình duyệt */
  function mockAd(label, ms, cb) {
    const o = document.createElement('div'); o.className = 'ad-mock';
    o.innerHTML = `<div><b>📺 ${label}</b><span>Quảng cáo giả lập…</span></div>`; document.body.appendChild(o);
    setTimeout(() => { o.remove(); cb(); }, ms);
  }

  Ads.rewardedReady = () => Ads.enabled && rewardedOk && !busy;

  /* Hiện quảng cáo thưởng. onReward chỉ chạy khi người chơi xem đủ; onFail khi chưa có quảng cáo hoặc bỏ giữa chừng. */
  Ads.showRewarded = function (onReward, onFail) {
    if (!Ads.rewardedReady()) { if (onFail) onFail(); return; }
    busy = true;
    if (WS && WS.setPause) WS.setPause('ad', true);   // ca đang chạy thì tạm dừng trong lúc xem
    const fin = (earned) => {
      busy = false; if (WS && WS.setPause) WS.setPause('ad', false);
      if (earned) { lastReward = Date.now(); if (onReward) onReward(); } else if (onFail) onFail();
    };
    if (mock) { rewardedOk = false; mockAd('Quảng cáo thưởng', 1800, () => { rewardedOk = true; fin(true); }); return; }
    done = fin;
    L.showRewarded().catch(() => { const cb = done; done = null; rewardedOk = false; if (cb) cb(false); });
  };

  /* Thỉnh thoảng hiện quảng cáo xen kẽ ở chỗ nghỉ tự nhiên; có giới hạn tần suất. kind: 'shift' | 'game' */
  Ads.maybeInterstitial = function (kind) {
    if (!Ads.enabled || !interOk || busy) return false;
    if (WS && WS.state && WS.state()) return false;   // không chèn khi đang trong ca
    counts[kind] = (counts[kind] || 0) + 1;
    if (counts[kind] % (EVERY[kind] || 2)) return false;
    const t = Date.now();
    if (t - firstRun < NEW_PLAYER_MS || t - lastInter < GAP_MS || t - lastReward < AFTER_REWARDED_MS) return false;
    lastInter = t; interOk = false;
    if (mock) { mockAd('Quảng cáo xen kẽ', 1500, () => { interOk = true; }); return true; }
    L.showInterstitial().catch(() => { /* bỏ qua */ });
    return true;
  };

  /* Chèn nút xem quảng cáo thưởng vào trước phần tử `beforeSel` trong `root`; nút chỉ hiện khi quảng cáo đã sẵn sàng. */
  Ads.inject = function (root, beforeSel, label, onReward) {
    const anchor = Ads.enabled && root && $(beforeSel, root); if (!anchor) return null;
    const b = document.createElement('button'); b.type = 'button'; b.className = 'btn ad-btn'; b.innerHTML = label; b.hidden = !Ads.rewardedReady();
    anchor.parentNode.insertBefore(b, anchor);
    const show = () => { if (!b.isConnected) { window.removeEventListener('ads:ready', show); return; } if (!b.dataset.used) b.hidden = false; };
    window.addEventListener('ads:ready', show);
    b.onclick = () => {
      b.disabled = true;
      Ads.showRewarded(() => { b.dataset.used = 1; b.remove(); onReward(); },
        () => { b.disabled = false; UI.toast('Cần xem hết quảng cáo để nhận thưởng', ''); });
    };
    return b;
  };

  if (!Ads.enabled) return;

  /* ---------- 1. Tổng kết ca: nhân đôi lãi + quảng cáo xen kẽ ---------- */
  G.on('shiftEnd', (sum) => {
    let tries = 0;
    const deco = () => {
      const m = $('#modal'), ok = m && $('[data-sumok]', m);
      if (!ok) { if (++tries < 8) setTimeout(deco, 80); return; }
      if (sum && sum.profit > 0) {
        Ads.inject(m, '.row2', `📺 Xem quảng cáo: nhân đôi lãi (+${G.fmt(sum.profit)} xu)`, () => {
          G.addCoins(sum.profit); G.save(); UI.refresh && UI.refresh();
          window.Audio2.sfx('coins'); UI.toast(`📺 Nhân đôi lãi ròng: +${G.fmt(sum.profit)} xu`, 'ok');
          if (UI.vfx) UI.vfx.spawnCoins(innerWidth / 2, innerHeight * .4, 12);
        });
      }
      ok.addEventListener('click', () => setTimeout(() => Ads.maybeInterstitial('shift'), 500));
    };
    setTimeout(deco, 80);
  });

  /* ---------- 2. Sự cố trong ca: xem quảng cáo để khắc phục ---------- */
  const BAD = { blackout: 1, fire: 1, theft: 1, poison: 1 };
  let rescueEl = null, rescueTimer = 0;
  function closeRescue() { clearTimeout(rescueTimer); if (rescueEl) { rescueEl.remove(); rescueEl = null; } }

  function offerRescue(s, type, snap) {
    const st = G.S, lostCoins = Math.max(0, Math.round(snap.coins - st.coins)), lostRep = Math.max(0, snap.rep - st.rep);
    let lostStock = 0; const now = st.stock[s.shop] || {};
    Object.keys(snap.stock).forEach((id) => { lostStock += Math.max(0, snap.stock[id] - (now[id] || 0)); });
    let label;
    if (type === 'blackout') label = '📺 Xem quảng cáo: có điện ngay';
    else if (type === 'fire' && lostStock > 0) label = `📺 Xem quảng cáo: cứu lại ${lostStock} phần nguyên liệu`;
    else if (type === 'theft' && lostCoins > 0) label = `📺 Xem quảng cáo: lấy lại ${G.fmt(lostCoins)} xu`;
    else if (type === 'poison' && (lostCoins > 0 || lostRep > 0)) label = `📺 Xem quảng cáo: hoàn ${G.fmt(lostCoins)} xu${lostRep ? ', giữ uy tín' : ''}`;
    if (!label || !Ads.rewardedReady()) return;
    closeRescue();
    const b = rescueEl = document.createElement('button'); b.type = 'button'; b.id = 'adRescue'; b.className = 'btn ad-btn ad-rescue'; b.innerHTML = label;
    document.body.appendChild(b);
    rescueTimer = setTimeout(closeRescue, RESCUE_MS);
    b.onclick = () => {
      clearTimeout(rescueTimer); b.disabled = true;
      Ads.showRewarded(() => {
        closeRescue();
        if (WS.state() !== s) return;   // ca đã kết thúc
        if (type === 'blackout' && s._dark) s._dark.left = 0.01;
        if (lostCoins) st.coins += lostCoins;
        if (lostRep) st.rep += lostRep;
        if (lostStock) { const cur = st.stock[s.shop]; Object.keys(snap.stock).forEach((id) => { cur[id] = Math.max(cur[id] || 0, snap.stock[id]); }); }
        G.save(); UI.refresh && UI.refresh(); window.Audio2.sfx('levelup');
        UI.toast('📺 Đã khắc phục sự cố!', 'ok');
      }, () => { b.disabled = false; rescueTimer = setTimeout(closeRescue, 4000); UI.toast('Cần xem hết quảng cáo để khắc phục', ''); });
    };
  }

  if (E && E.trigger) {
    const trig = E.trigger;
    E.trigger = function (s, type) {
      const snap = BAD[type] && s && G.S ? { coins: G.S.coins, rep: G.S.rep, stock: JSON.parse(JSON.stringify(G.S.stock[s.shop] || {})) } : null;
      const r = trig.apply(this, arguments);
      if (snap) { try { offerRescue(s, type, snap); } catch (err) { console.error(err); } }
      return r;
    };
  }
  G.on('shiftEnd', closeRescue);

  /* ---------- 3. Rời một trò Hội làng: quảng cáo xen kẽ ---------- */
  document.addEventListener('click', (e) => { if (e.target.closest('[data-faction="leave"]')) setTimeout(() => Ads.maybeInterstitial('game'), 400); });
})();
