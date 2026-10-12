/* Giao hàng online: đơn tới theo thời gian thực, nhận đơn -> shipper đi giao -> nhận tiền. Có nâng cấp riêng. */
(function () {
  'use strict';
  const G = window.Game, C = window.CFG, UI = window.UI, D = window.Delivery = {};
  const $ = (q) => document.querySelector(q);
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const UPG = {
    rider: { name: 'Thuê shipper', icon: '🧑‍🍳', max: 4, base: 700, grow: 3, desc: (l) => `${1 + l} → ${2 + l} shipper chạy cùng lúc` },
    bike: { name: 'Xe giao hàng', icon: '🛵', max: 4, base: 500, grow: 2.3, desc: (l) => `Giao nhanh hơn ${l * 15}% → ${(l + 1) * 15}%` },
    app: { name: 'Ứng dụng đặt món', icon: '📱', max: 4, base: 600, grow: 2.4, desc: (l) => `Đơn tới nhanh hơn ${l * 15}% → ${(l + 1) * 15}%, tiền công +${l * 5}% → +${(l + 1) * 5}%` },
    box: { name: 'Thùng giữ nhiệt', icon: '🧊', max: 4, base: 450, grow: 2.2, desc: (l) => `Khách thưởng thêm +${l * 8}% → +${(l + 1) * 8}%` }
  };
  const st = () => {
    const f = G.S.flags; if (!f.dv) f.dv = { orders: [], riders: [], lvl: {}, done: 0, earned: 0, next: 0, seq: 0 };
    const d = f.dv; d.lvl = d.lvl || {}; d.riders = d.riders || []; d.orders = d.orders || [];
    return d;
  };
  const lv = (k) => st().lvl[k] || 0;
  const riderCount = () => 1 + lv('rider');
  const cost = (k) => Math.ceil(UPG[k].base * Math.pow(UPG[k].grow, lv(k)));
  const unlockedShops = () => C.shops.filter((s) => G.S.shops[s.id] && G.S.shops[s.id].unlocked);
  const now = () => Date.now() / 1000;
  const shipTime = (shop) => Math.max(6, 22 * Math.pow(0.85, lv('bike')) * (1 - 0.0 ) * ([1, 0.92, 0.84, 0.76][G.eqLv(shop, 'ship')]));

  function spawn(d) {
    const shops = unlockedShops(); if (!shops.length || d.orders.filter((o) => o.state === 'new').length >= 6) return;
    const sh = shops[Math.floor(Math.random() * shops.length)], qty = 1 + Math.floor(Math.random() * 3);
    const who = C.customers[Math.floor(Math.random() * C.customers.length)];
    const unit = G.baseOrderPrice(sh.id) * G.shopMult(sh.id) * 1.35;
    const pay = Math.max(3, Math.round(unit * qty * (1 + lv('app') * 0.05) * [1, 1.1, 1.25, 1.45][G.eqLv(sh.id, 'ship')]));
    const o = { id: ++d.seq, shop: sh.id, qty, who: who.name, avatar: who.avatar, pay, mat: Math.max(1, Math.round(pay * 0.35)), expire: now() + 75, state: 'new', fast: 0 };
    d.orders.push(o);
    if (UI.page === 'delivery') D.render(); D.badge();
    UI.toast(`🛵 Đơn online mới: ${who.name} · ${qty} ${sh.short}`);
    window.Audio2.sfx('click');
  }
  function tick() {
    if (!G.S) return;
    const d = st(), t = now(); let changed = false;
    if (!d.next) d.next = t + 12;
    if (t >= d.next) { spawn(d); d.next = t + (30 + Math.random() * 25) * Math.pow(0.85, lv('app')); changed = true; }
    d.orders.forEach((o) => {
      if (o.state === 'new' && t > o.expire) { o.state = 'missed'; changed = true; }
      else if (o.state === 'going' && t >= o.due) {
        const tip = Math.round(o.pay * lv('box') * 0.08), got = o.pay + tip + (o.fast ? Math.round(o.pay * 0.1) : 0);
        o.state = 'done'; G.addCoins(got); d.done++; d.earned += got; G.S.rep += 0.2;
        UI.toast(`✅ Giao xong cho ${o.who}: +${got} xu${o.fast ? ' (nhanh tay +10%)' : ''}`, 'ok'); window.Audio2.sfx('coins'); changed = true;
      }
    });
    d.orders = d.orders.filter((o) => o.state === 'new' || o.state === 'going' || (o.state !== 'done' && o.state !== 'missed') || t - (o.due || o.expire) < 6);
    d.orders = d.orders.filter((o) => ['new', 'going'].includes(o.state) || t - (o.due || o.expire) < 6);
    if (changed) { G.save(); D.badge(); }
    if (UI.page === 'delivery') D.update();
  }
  D.badge = () => { const n = G.S ? st().orders.filter((o) => o.state === 'new').length : 0; const b = $('[data-live="delivery"] i.dv-b'); if (b) { b.textContent = n; b.hidden = !n; } };

  const busy = () => st().orders.filter((o) => o.state === 'going').length;
  D.accept = (id) => {
    const d = st(), o = d.orders.find((x) => x.id === id); if (!o || o.state !== 'new') return;
    if (busy() >= riderCount()) { UI.toast('Hết shipper rảnh, hãy đợi hoặc thuê thêm.', 'err'); window.Audio2.sfx('error'); return; }
    if (G.S.coins < o.mat) { UI.toast('Chưa đủ xu mua nguyên liệu cho đơn này.', 'err'); window.Audio2.sfx('error'); return; }
    G.S.coins -= o.mat; o.fast = now() - (o.expire - 75) < 25 ? 1 : 0;
    o.state = 'going'; o.due = now() + shipTime(o.shop); o.total = o.due - now();
    window.Audio2.sfx('buy'); G.buzz(15); G.save(); D.render(); D.badge();
  };
  D.buy = (k) => {
    const c = cost(k), d = st(); if (lv(k) >= UPG[k].max) return;
    if (G.S.coins < c) { UI.toast('Chưa đủ xu.', 'err'); window.Audio2.sfx('error'); return; }
    G.S.coins -= c; d.lvl[k] = lv(k) + 1; window.Audio2.sfx('levelup'); G.buzz([20, 40, 20]); G.save(); D.render();
  };
  function orderHtml(o) {
    const s = G.shopDef(o.shop), t = now();
    if (o.state === 'new') return `<div class="dv-o"><span class="dv-av">${o.avatar}</span><div class="dv-t"><b>${esc(o.who)}</b><small>${o.qty} phần ${esc(s.short)} · vốn ${o.mat} xu</small><div class="dv-bar"><i data-exp="${o.id}" style="width:${Math.max(0, (o.expire - t) / 75 * 100)}%"></i></div></div><button class="btn gold sm" data-dv="accept" data-id="${o.id}">Nhận<br>+${o.pay}</button></div>`;
    if (o.state === 'going') return `<div class="dv-o going"><span class="dv-av dv-ride">🛵</span><div class="dv-t"><b>Đang giao cho ${esc(o.who)}</b><small>${o.qty} ${esc(s.short)} · +${o.pay} xu${o.fast ? ' · nhanh tay' : ''}</small><div class="dv-bar go"><i data-go="${o.id}" style="width:${Math.min(100, (1 - (o.due - t) / o.total) * 100)}%"></i></div></div></div>`;
    return o.state === 'done' ? `<div class="dv-o ok"><span class="dv-av">✅</span><div class="dv-t"><b>Đã giao ${esc(o.who)}</b></div></div>` : `<div class="dv-o bad"><span class="dv-av">⌛</span><div class="dv-t"><b>Lỡ đơn ${esc(o.who)}</b></div></div>`;
  }
  D.render = () => {
    const v = $('#view'); if (!v || UI.page !== 'delivery') return;
    const d = st(), n = unlockedShops().length, list = d.orders.map(orderHtml).join('');
    v.innerHTML = `<section class="page dv-page"><h2>🛵 Giao Hàng Online</h2><p class="muted">Khách đặt món qua ứng dụng. Nhận đơn, shipper đi giao và bạn nhận tiền công cao hơn bán tại quầy. Nhận trong 25 giây đầu để được +10% “nhanh tay”.</p>
      <div class="dv-stats"><div><b>${riderCount() - busy()}/${riderCount()}</b><small>shipper rảnh</small></div><div><b>${d.done}</b><small>đơn đã giao</small></div><div><b>${G.fmt(d.earned)}</b><small>xu kiếm được</small></div></div>
      <h3>📦 Đơn hàng</h3><div class="dv-list">${list || `<p class="muted center">${n ? 'Đang chờ đơn mới… (30–55 giây một đơn)' : 'Hãy mở khóa một quầy để nhận đơn online.'}</p>`}</div>
      <h3>🛠️ Nâng cấp giao hàng</h3>${Object.entries(UPG).map(([k, u]) => { const l = lv(k), max = l >= u.max; return `<div class="eq ${max ? 'max' : ''}"><span class="eq-i">${u.icon}</span><div class="eq-t"><b>${u.name} <em>cấp ${l}/${u.max}</em></b><small>${max ? 'Đã tối đa' : u.desc(l)}</small></div>${max ? '' : `<button class="btn gold sm" data-dv="buy" data-k="${k}" ${G.S.coins >= cost(k) ? '' : 'disabled'}>${G.fmt(cost(k))}</button>`}</div>`; }).join('')}
      <p class="muted">Trang bị “Túi giao hàng” trong từng quầy cũng tăng tiền công và tốc độ đơn online của quầy đó.</p></section>`;
  };
  D.update = () => {
    const t = now(); const d = st();
    d.orders.forEach((o) => {
      const e = $(`[data-exp="${o.id}"]`); if (e) e.style.width = Math.max(0, (o.expire - t) / 75 * 100) + '%';
      const g = $(`[data-go="${o.id}"]`); if (g) g.style.width = Math.min(100, (1 - (o.due - t) / o.total) * 100) + '%';
    });
  };
  const show = UI.showPage;
  UI.showPage = function (p) {
    if (p !== 'delivery') return show.apply(this, arguments);
    UI.page = 'delivery'; document.querySelectorAll('#nav button').forEach((b) => b.classList.remove('on'));
    const v = $('#view'); v.classList.remove('is-map'); D.render(); v.scrollTop = 0;
  };
  document.addEventListener('click', (e) => {
    const b = e.target.closest('[data-dv]'); if (b) { if (b.dataset.dv === 'accept') D.accept(Number(b.dataset.id)); else D.buy(b.dataset.k); return; }
    if (e.target.closest('[data-live="delivery"]')) UI.showPage('delivery');
  });
  const mount = window.MM.mount;
  window.MM.mount = function (host) {
    mount.apply(this, arguments);
    const dock = $('.market-dock'); if (dock && !dock.querySelector('[data-live="delivery"]')) { dock.insertAdjacentHTML('beforeend', '<button data-live="delivery" style="position:relative">🛵 Giao hàng<i class="dv-b" hidden></i></button>'); D.badge(); }
  };
  setInterval(tick, 1000);
})();
