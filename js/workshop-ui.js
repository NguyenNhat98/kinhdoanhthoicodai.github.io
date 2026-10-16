/* ============================================================================
   GIAO DIỆN QUẦY (bàn làm món): khách, phiếu đơn, bàn thao tác từng quầy, khay giữ món,
   màn chuẩn bị (nhập hàng, hấp xôi, nâng cấp) và tổng kết ca. Đọc dữ liệu từ WS, gửi lệnh qua WS.cmd.
   ========================================================================== */
(function () {
  'use strict';
  const G = window.Game, C = window.CFG, R = window.R, WS = window.WS, Art = window.Art;
  const WUI = { shop: null, mode: 'prep', delivering: false, tab: 'work', ui: { sugar: 2, sugarType: 'thuong', ice: 50, spice: 3 } };
  window.WUI = WUI;
  const $ = (q, r) => (r || document).querySelector(q);
  const $$ = (q, r) => Array.from((r || document).querySelectorAll(q));
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const sfx = (t) => window.Audio2.sfx(t);
  const S = () => G.S;
  const sd = (id) => G.shopDef(id);
  const sum = (o) => Object.keys(o).reduce((a, k) => a + (o[k] || 0), 0);
  const MOOD = ['😐', '🙂', '🤩', '😠', '😐', '😤'];
  // Keep interactive nodes, decoded images and SVGs alive between frames.
  function syncHtml(host, html) {
    const template = document.createElement('template'); template.innerHTML = html;
    function patch(parent, source) {
      const wanted = Array.from(source.childNodes);
      wanted.forEach((next, i) => {
        let old = parent.childNodes[i];
        if (!old || old.nodeType !== next.nodeType || old.nodeName !== next.nodeName) {
          const copy = next.cloneNode(true); if (old) parent.replaceChild(copy, old); else parent.appendChild(copy); return;
        }
        if (next.nodeType === 3) { if (old.nodeValue !== next.nodeValue) old.nodeValue = next.nodeValue; return; }
        if (next.nodeType !== 1) return;
        // Sprite/bowl decorators own their icon, not the recipe's emoji placeholder.
        if (old.tagName === 'I' && old.querySelector('img,svg') && !next.querySelector('img,svg')) return;
        Array.from(old.attributes).forEach(a => {
          if (!next.hasAttribute(a.name) && !['data-desk-stage','hidden','data-bowl'].includes(a.name)) old.removeAttribute(a.name);
        });
        Array.from(next.attributes).forEach(a => {
          let value = a.value;
          if (a.name === 'class') value += ['pouring','arrive','happy','angry'].filter(c=>old.classList.contains(c) && !next.classList.contains(c)).map(c=>' '+c).join('');
          if (old.getAttribute(a.name) !== value) old.setAttribute(a.name, value);
        });
        patch(old, next);
      });
      while (parent.childNodes.length > wanted.length) parent.lastChild.remove();
    }
    patch(host, template.content);
  }

  const bannerOf = (id) => `assets/scenes/hd/${id}.jpg`;

  /* ======================== MỞ / ĐÓNG QUẦY ======================== */
  WUI.open = function (id) {
    const ws = WS.state();
    if (ws && ws.shop !== id) { WUI.askSwitch(id); return; }
    WUI.shop = id; WUI.delivering = false; WUI.tab = ws ? 'work' : 'prep';
    const el = $('#stall'); el.hidden = false; el.dataset.shop = id; el.classList.remove('out');
    document.body.classList.add('in-stall');
    if (ws) WS.setPause('resume', false), WS.setPause('away', false);
    WUI.render(); sfx('click'); G.buzz(10);
  };
  WUI.askSwitch = function (id) {
    const ws = WS.state();
    window.UI.modal(`<h3>Đang có ca ở ${esc(sd(ws.shop).short)}</h3><p>Chỉ một ca thủ công hoạt động. Bạn muốn làm gì?</p><div class="col2"><button class="btn gold" data-sw="back">Quay lại ca cũ</button><button class="btn danger" data-sw="end">Chốt ca cũ rồi mở quầy này</button><button class="btn ghost" data-close>Hủy</button></div>`);
    $('#modal').onclick = (e) => {
      const b = e.target.closest('[data-sw]'), cl = e.target.closest('[data-close]');
      if (cl || e.target === $('#modal')) { window.UI.closeModal(); return; }
      if (!b) return;
      window.UI.closeModal();
      if (b.dataset.sw === 'back') WUI.open(ws.shop);
      else { WS.finish(true); WUI.open(id); }
    };
  };
  WUI.close = function () {
    const ws = WS.state();
    if (ws) { WS.setPause('away', true); window.UI.toast('Ca tạm dừng. Quay lại quầy để tiếp tục.'); }
    const el = $('#stall'); el.hidden = true; el.innerHTML = ''; WUI.shop = null; document.body.classList.remove('in-stall');
    window.Audio2.setMode('calm');
  };
  WUI.isOpen = () => !!WUI.shop;

  /* ======================== KHUNG CHUNG ======================== */
  WUI.render = function () {
    const id = WUI.shop; if (!id) return;
    const el = $('#stall'), ws = WS.state(), def = sd(id);
    el.innerHTML = `<header class="st-top"><button class="st-back" data-w="back" aria-label="Ra chợ">‹ Ra chợ</button><div class="st-title"><b>${esc(def.name)}</b><small data-w-sub></small></div><div class="st-coins">${Art.coin(18)}<b data-w-coins>0</b></div></header>
      <div class="st-banner" style="background-image:url('${bannerOf(id)}')"><div class="st-pills"><span class="pill" data-w-clock></span><span class="pill rush" data-w-rush hidden></span></div><span class="st-lan l"></span><span class="st-lan r"></span><span class="counter-steam" aria-hidden="true"></span></div>
      ${window.LivingMarket.stallTools(id, ws)}
      ${ws && WUI.tab === 'work' ? workHtml(ws) : prepHtml(id)}`;
    WUI.update(0);
  };

  /* ---------------- làm việc ---------------- */
  function workHtml(ws) {
    return `<div class="st-queue" data-w-queue></div><div class="st-ticket" data-w-ticket></div>
      <div class="st-bench" data-w-bench></div><div class="st-actions" data-w-actions></div>`;
  }
  function renderQueue(ws) {
    const el = $('[data-w-queue]'); if (!el) return;
    const waiting = ws.orders.filter((o) => o.status === 'wait').slice(0, 3), gone = ws.orders.filter((o) => o.status !== 'wait');
    const cards = waiting.concat(gone).slice(0, 3);
    let h = '';
    cards.forEach((o) => {
      const frac = Math.max(0, Math.min(1, o.p / o.max)), low = frac < 0.2, st = o.status;
      const face = st === 'done' ? (o.mood >= 2 ? '🤩' : o.mood === 1 ? '😊' : o.mood === -2 ? '😠' : '🙂') : st === 'left' ? '💨' : (low ? '😤' : frac < 0.5 ? '😐' : '🙂');
      h += `<button class="cust ${ws.sel === o.id ? 'sel' : ''} ${st !== 'wait' ? 'gone ' + st : ''} ${WUI.delivering && st === 'wait' ? 'target' : ''}" data-w="pick" data-id="${o.id}" aria-pressed="${ws.sel === o.id}" aria-label="${esc(o.who.name)}${st === 'wait' ? ': xem đơn gọi món' : st === 'done' ? ': đã phục vụ' : ': đã rời quầy'}" ${st !== 'wait' ? 'disabled' : ''}>
        <span class="c-face">${window.LivingMarket.customer(o.id, ws.shop)}<i>${face}</i></span><span class="c-name">${esc(o.who.name)}${o.vip ? ' <em>VIP</em>' : ''}${o.who.regular ? ' <em class="reg">❤</em>' : ''}</span>
        <div class="pbar ${low ? 'low' : ''}"><i data-p="${o.id}" style="width:${ws.tutorial ? 100 : frac * 100}%"></i></div></button>`;
    });
    for (let i = cards.length; i < 3; i++) h += '<div class="cust empty"><span class="c-face">⋯</span><small>Chờ khách ghé</small></div>';
    syncHtml(el, h);
  }
  function renderTicket(ws) {
    const el = $('[data-w-ticket]'); if (!el) return;
    const o = ws.orders.find((x) => x.id === ws.sel && x.status === 'wait'), mod = R[ws.shop];
    const hint = mod.hint(ws, ws.product, o);
    const patience = o ? (ws.tutorial ? 100 : Math.max(0, Math.min(100, o.p / o.max * 100))) : 0;
    el.classList.toggle('has-order', !!o);
    syncHtml(el, o ? `<div class="order-portrait" aria-hidden="true">${window.LivingMarket.customer(o.id, ws.shop)}</div><div class="order-speech"><div class="tk-head"><b>${esc(o.who.name)}</b><em>${ws.tutorial ? 'Học việc · không phạt' : o.vip ? 'Khách VIP' : o.who.regular ? 'Khách quen ❤' : 'Gọi món'}</em></div><p class="tk-request">Cho mình ${mod.chips(o.spec).map(esc).join(', ')}.</p><div class="order-patience"><span>Kiên nhẫn</span><div class="pbar ${patience < 20 ? 'low' : ''}" role="progressbar" aria-label="Kiên nhẫn của ${esc(o.who.name)}" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.round(patience)}"><i data-p="${o.id}" style="width:${patience}%"></i></div></div></div><div class="tk-hint" data-w-hint>▸ ${esc(hint)}</div>`
      : `<div class="tk-head"><span>🎫 Chọn khách để xem lời gọi món</span></div><div class="tk-hint" data-w-hint>▸ ${esc(hint)}</div>`);
  }

  /* ---------------- hình sản phẩm (SVG) ---------------- */
  const mix = (a, b, t) => { const p = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16)); const A = p(a), B = p(b); return '#' + A.map((v, i) => Math.round(v + (B[i] - v) * t).toString(16).padStart(2, '0')).join(''); };
  const TEA_COL = { hong: '#b0541f', luc: '#a9b64a', olong: '#c58a2e', matcha: '#6f9a3a' }, MILK_COL = { tuoi: '#f6efe2', dac: '#f0dcb4', kem: '#fff8e6' };
  const TOP_COL = { tc_den: '#2a1b14', quylinh: '#5a3a24', pudding: '#f2c64a', hatsen: '#f4ead4' };
  function svgCup(p, spec, hold) {
    const T = R.trasua, cap = T.capOf(p.size || 'M'), H = 140, yb = 188;
    const top = T.topVol(p), ice = T.iceVol(p.ice || 0, p.size || 'M');
    const lvl = (v) => yb - (v / cap) * H;
    const liquid = p.teaVol + p.milkVol;
    const tcol = p.tea ? TEA_COL[p.tea] : '#c9a06f', frac = liquid > 0 ? p.milkVol / liquid : 0;
    const lcol = p.milk ? mix(tcol, MILK_COL[p.milk], Math.min(0.85, frac * 1.15)) : tcol;
    const x1 = (y) => 52 + (y - 40) * (12 / 148), x2 = (y) => 148 - (y - 40) * (12 / 148); // thành ly nghiêng
    let s = `<svg viewBox="0 0 200 220" class="prod-svg" aria-hidden="true"><defs><clipPath id="cupclip"><path d="M52 40 L148 40 L136 188 Q100 198 64 188 Z"/></clipPath></defs>`;
    s += `<ellipse cx="100" cy="206" rx="52" ry="7" fill="rgba(60,35,10,.22)"/>`;
    s += `<g clip-path="url(#cupclip)"><rect x="40" y="40" width="130" height="160" fill="rgba(235,245,252,.5)"/>`;
    if (liquid > 0) s += `<rect x="40" y="${lvl(top + liquid + ice * 0)}" width="130" height="${yb + 12 - lvl(top + liquid)}" fill="${lcol}" opacity=".93"/>`;
    // topping
    let tx = 0; Object.keys(p.tops).forEach((k) => { for (let i = 0; i < p.tops[k] * 3; i++) { const cx = 66 + ((tx * 17) % 68), cy = yb - 8 - Math.floor(tx / 4) * 9 + (tx % 2) * 3; s += `<circle cx="${cx}" cy="${cy}" r="${k === 'tc_den' ? 5 : 5.5}" fill="${TOP_COL[k]}" stroke="rgba(255,255,255,.4)" stroke-width="1"/>`; tx++; } });
    // đá
    const nIce = p.ice == null ? 0 : p.ice === 100 ? 6 : p.ice === 50 ? 3 : 0, sy = lvl(top + liquid + ice) + 4;
    for (let i = 0; i < nIce; i++) s += `<rect x="${64 + (i % 3) * 22 + (i > 2 ? 8 : 0)}" y="${sy + (i > 2 ? 14 : 0) - 8}" width="17" height="17" rx="3" fill="rgba(255,255,255,.7)" stroke="#cfe6f2" transform="rotate(${i * 13 - 20} ${70 + (i % 3) * 22} ${sy})"/>`;
    s += `<rect x="40" y="40" width="130" height="160" fill="none"/></g>`;
    // vạch mục tiêu
    if (spec && p.size) {
      const liqT = T.liquidTarget(p), ratio = T.ratio(spec.milk), teaT = liqT * ratio;
      const kind = hold && hold.kind === 'milk' || (p.teaVol >= teaT * 0.9 && spec.milk) ? 'milk' : 'tea';
      const goal = kind === 'tea' ? top + ice + teaT : top + ice + liqT, y = lvl(goal), tol = Math.max(3, (0.05 * (kind === 'tea' ? teaT : Math.max(8, liqT - teaT)) / cap) * H);
      s += `<g class="tgt"><rect x="${x1(y) - 2}" y="${y - tol}" width="${x2(y) - x1(y) + 4}" height="${tol * 2}" fill="rgba(80,200,90,.35)" stroke="#3a9a4a" stroke-dasharray="4 3"/><text x="${x2(y) + 6}" y="${y + 4}" class="tgt-t">Vừa đủ</text></g>`;
    }
    // thành ly
    s += `<path d="M52 40 L148 40 L136 188 Q100 198 64 188 Z" fill="none" stroke="#7a5a3e" stroke-width="3" stroke-linejoin="round"/><path d="M60 54 L69 170" stroke="#fff" stroke-width="4" stroke-linecap="round" opacity=".5"/>`;
    s += `<ellipse cx="100" cy="40" rx="48" ry="7" fill="rgba(255,255,255,.35)" stroke="#7a5a3e" stroke-width="2.5"/>`;
    if (p.stirred && !p.lid) s += `<path d="M82 ${lvl(top + liquid) + 2} q18 -7 36 0" stroke="rgba(255,255,255,.7)" stroke-width="2.5" fill="none"/>`;
    if (p.lid) s += `<path d="M50 36 Q100 6 150 36 Z" fill="rgba(255,255,255,.75)" stroke="#cdbda7" stroke-width="2"/><rect x="46" y="34" width="108" height="9" rx="4.5" fill="#fffdf8" stroke="#cdbda7" stroke-width="2"/>`;
    if (p.straw) s += `<line x1="104" y1="${p.lid ? 28 : 36}" x2="124" y2="-4" stroke="#ff7fa0" stroke-width="7" stroke-linecap="round"/><line x1="104" y1="170" x2="104" y2="${p.lid ? 30 : 38}" stroke="#ff7fa0" stroke-width="7" stroke-linecap="round" opacity=".9"/>`;
    return s + '</svg>';
  }
  function svgBowlTea(p) {
    const cap = R.trada.cap[p.size || 's'], big = p.size === 'l', W = big ? 150 : 124, cx = 100, top = 120;
    const lvlY = (v) => 170 - (v / cap) * 46;
    let s = `<svg viewBox="0 0 200 200" class="prod-svg" aria-hidden="true"><ellipse cx="100" cy="188" rx="${W / 2 + 6}" ry="7" fill="rgba(60,35,10,.22)"/>`;
    s += `<defs><clipPath id="bwl"><path d="M${cx - W / 2} ${top} H${cx + W / 2} Q${cx + W / 2 - 6} 182 ${cx} 184 Q${cx - W / 2 + 6} 182 ${cx - W / 2} ${top} Z"/></clipPath></defs><g clip-path="url(#bwl)"><rect x="20" y="${top}" width="160" height="70" fill="#f4efe2"/>`;
    if (p.vol > 0) s += `<rect x="20" y="${lvlY(p.vol + p.ice * 8)}" width="160" height="80" fill="#a9b64a" opacity=".92"/>`;
    for (let i = 0; i < p.ice; i++) s += `<rect x="${72 + i * 28}" y="${lvlY(p.vol + p.ice * 8) - 4}" width="20" height="20" rx="3" fill="rgba(255,255,255,.75)" stroke="#cfe6f2"/>`;
    if (p.honey) s += `<path d="M84 ${lvlY(p.vol) + 4} q16 8 32 0" stroke="#e8a830" stroke-width="5" fill="none" stroke-linecap="round"/>`;
    s += `</g><path d="M${cx - W / 2} ${top} H${cx + W / 2} Q${cx + W / 2 - 6} 182 ${cx} 184 Q${cx - W / 2 + 6} 182 ${cx - W / 2} ${top} Z" fill="none" stroke="#5a8a6a" stroke-width="4"/><ellipse cx="${cx}" cy="${top}" rx="${W / 2}" ry="9" fill="rgba(255,255,255,.3)" stroke="#5a8a6a" stroke-width="3"/>`;
    // vạch mục tiêu
    if (p.size) { const t = R.trada.target(p), y = lvlY(t + p.ice * 8); s += `<rect x="${cx - W / 2 + 2}" y="${y - 3}" width="${W - 4}" height="6" fill="rgba(80,200,90,.45)" stroke="#3a9a4a" stroke-dasharray="4 3"/><text x="${cx + W / 2 + 4}" y="${y + 4}" class="tgt-t">Vừa đủ</text>`; }
    return s + '</svg>';
  }
  const BREAD = { raw: '#f2dcb0', near: '#ead08c', gold: '#d99a3a', dark: '#9a5a26', burnt: '#2e231d' };
  function svgBread(p, ws) {
    const st = R.banhmi.state(ws, p), col = BREAD[st], big = p.size === 'l', L = big ? 150 : 124;
    let s = `<svg viewBox="0 0 200 200" class="prod-svg" aria-hidden="true"><ellipse cx="100" cy="176" rx="${L / 2 + 8}" ry="8" fill="rgba(60,35,10,.22)"/>`;
    const x0 = 100 - L / 2;
    s += `<path d="M${x0} 120 Q${x0 - 6} 78 ${x0 + 24} 74 H${x0 + L - 24} Q${x0 + L + 6} 78 ${x0 + L} 120 Q${x0 + L - 4} 150 ${x0 + L - 24} 152 H${x0 + 24} Q${x0 + 4} 150 ${x0} 120 Z" fill="${col}" stroke="#6a4426" stroke-width="3"/>`;
    for (let i = 0; i < 5; i++) s += `<path d="M${x0 + 22 + i * (L - 44) / 4} 82 q6 10 0 22" stroke="rgba(120,70,20,.4)" stroke-width="3" fill="none" stroke-linecap="round"/>`;
    if (p.cut) {
      s += `<path d="M${x0 + 12} 108 H${x0 + L - 12}" stroke="#4a2c14" stroke-width="4"/>`;
      let y = 106; const bar = (c, n, h) => { for (let i = 0; i < n; i++) { s += `<rect x="${x0 + 16}" y="${y - h}" width="${L - 32}" height="${h}" rx="3" fill="${c}"/>`; y -= h + 1; } };
      bar('#7a4a2a', p.pate, 5); for (let i = 0; i < p.xaxiu; i++) { s += `<rect x="${x0 + 14}" y="${y - 6}" width="${L - 28}" height="6" rx="3" fill="#b8302a"/>`; y -= 7; }
      if (p.trung) { s += `<ellipse cx="100" cy="${y - 4}" rx="${L / 2 - 20}" ry="5" fill="#f6dc6a"/>`; y -= 9; }
      for (let i = 0; i < p.dua; i++) { for (let k = 0; k < 6; k++) s += `<circle cx="${x0 + 26 + k * (L - 52) / 5}" cy="${y - 3}" r="3.2" fill="#f08a2a"/>`; y -= 7; }
      for (let i = 0; i < p.rau; i++) { for (let k = 0; k < 5; k++) s += `<path d="M${x0 + 28 + k * (L - 56) / 4} ${y} l3 -8 l3 8z" fill="#3e9a4a"/>`; y -= 7; }
      if (p.ot) for (let k = 0; k < p.ot * 3; k++) s += `<circle cx="${x0 + 30 + k * 14}" cy="${y - 2}" r="2.6" fill="#d8301f"/>`;
    }
    if (p.closed) s += `<path d="M${x0 + 6} 100 Q100 ${86} ${x0 + L - 6} 100" stroke="${col}" stroke-width="10" fill="none" opacity=".6"/>`;
    if (p.wrapped) s += `<path d="M${x0 - 4} 96 L${x0 + L + 4} 96 L${x0 + L - 8} 156 L${x0 + 8} 156Z" fill="rgba(250,244,226,.9)" stroke="#bfa070" stroke-width="2.5"/><path d="M${x0 + 20} 110 H${x0 + L - 20} M${x0 + 24} 126 H${x0 + L - 24}" stroke="#d4bf94" stroke-width="2"/>`;
    return s + '</svg>';
  }
  const XCOL = { gac: '#c8401f', nuong: '#f4efe2', dua: '#f2d46a', ngusac: '#f4efe2' }, XTCOL = { ga: '#e8c89a', dau: '#a8c850', hanh: '#8a5a1a', dua: '#fffaf0' };
  function svgXoi(p) {
    let s = `<svg viewBox="0 0 200 200" class="prod-svg" aria-hidden="true"><ellipse cx="100" cy="178" rx="80" ry="9" fill="rgba(60,35,10,.22)"/>`;
    if (p.container === 'dia') s += `<ellipse cx="100" cy="150" rx="84" ry="24" fill="#f6f2ea" stroke="#9a8a6a" stroke-width="3"/><ellipse cx="100" cy="148" rx="62" ry="15" fill="#ede6d6"/>`;
    else if (p.container === 'la') s += `<path d="M10 150 Q100 110 190 150 Q100 188 10 150Z" fill="#3e8f4a" stroke="#27632f" stroke-width="3"/><path d="M20 150 Q100 140 180 150" stroke="#27632f" stroke-width="2" fill="none"/>`;
    const sc = Math.min(6, p.scoops), h = 14 + sc * 11, w = 36 + sc * 6;
    if (p.base === 'ngusac' && p.colors.length) { p.colors.forEach((c, i) => { s += `<ellipse cx="${100 - 44 + i * 22}" cy="${140 - Math.min(p.colors.length, 3) * 3}" rx="16" ry="${14 + (p.colors.length === 5 ? 10 : 4)}" fill="${COLORS_C[c]}" stroke="rgba(0,0,0,.25)"/>`; }); }
    else if (p.base && sc > 0) s += `<path d="M${100 - w} 148 Q${100 - w + 4} ${148 - h} 100 ${146 - h} Q${100 + w - 4} ${148 - h} ${100 + w} 148 Q100 160 ${100 - w} 148Z" fill="${XCOL[p.base]}" stroke="rgba(0,0,0,.3)" stroke-width="2"/>`;
    let n = 0; Object.keys(p.tops).forEach((k) => { for (let i = 0; i < p.tops[k] * 4; i++) { s += `<circle cx="${70 + ((n * 23) % 62)}" cy="${150 - h + 6 + ((n * 11) % 18)}" r="${k === 'ga' ? 4.5 : 3.4}" fill="${XTCOL[k]}"/>`; n++; } });
    if (p.fold) s += `<path d="M14 150 Q100 ${150 - Math.max(30, h)} 186 150 Q100 182 14 150Z" fill="rgba(62,143,74,.88)" stroke="#27632f" stroke-width="3"/>`;
    if (p.tied) s += `<path d="M96 ${150 - Math.max(30, h) + 8} v36 M104 ${150 - Math.max(30, h) + 8} v36" stroke="#a8782a" stroke-width="4"/>`;
    if (p.spoon) s += `<path d="M150 150 l26 -38" stroke="#b0b0b8" stroke-width="5" stroke-linecap="round"/><ellipse cx="148" cy="152" rx="9" ry="5" fill="#b0b0b8"/>`;
    return s + '</svg>';
  }
  const COLORS_C = ['#c8301f', '#f2c230', '#3e8f4a', '#7a4aa8', '#f4efe2'];
  function svgMi(p) {
    const big = p.size === 'l', W = big ? 150 : 124, top = 112, cx = 100;
    const spCol = p.spice == null ? '#e8c46a' : ['#e8c46a', '#e8b050', '#e49a3a', '#e0822a', '#d8602a', '#c8402a', '#a82a22', '#7a1a1a'][Math.min(7, p.spice)];
    let s = `<svg viewBox="0 0 200 200" class="prod-svg" aria-hidden="true"><ellipse cx="100" cy="190" rx="${W / 2 + 6}" ry="8" fill="rgba(60,35,10,.22)"/>`;
    s += `<defs><clipPath id="mibowl"><path d="M${cx - W / 2} ${top} H${cx + W / 2} Q${cx + W / 2 - 6} 184 ${cx} 188 Q${cx - W / 2 + 6} 184 ${cx - W / 2} ${top}Z"/></clipPath></defs><g clip-path="url(#mibowl)"><rect x="20" y="${top}" width="160" height="80" fill="#f4efe2"/>`;
    if (p.ladle) s += `<rect x="20" y="${top + 24 - p.ladle * 7}" width="160" height="90" fill="${p.broth === 'thit' ? mix('#b0702a', spCol, 0.5) : mix('#c8a45a', spCol, 0.5)}" opacity=".95"/>`;
    s += '</g>';
    if (p.noodle === 'done' || p.noodle === 'cooking') for (let i = 0; i < 6; i++) s += `<path d="M${cx - W / 2 + 14} ${top - 2 + i * 3} q${W / 6} -14 ${W / 3} 0 t${W / 3} 0 t${W / 3} 0" stroke="${p.noodle === 'done' ? '#f1d98a' : '#e8e0c0'}" stroke-width="4" fill="none" stroke-linecap="round" opacity=".95" transform="translate(0 ${i % 2 ? 2 : -2})"/>`;
    let n = 0; Object.keys(p.tops).forEach((k) => { for (let i = 0; i < p.tops[k]; i++) { const x = 72 + n * 26; s += k === 'thit' ? `<rect x="${x}" y="${top - 14}" width="22" height="12" rx="4" fill="#a8322a"/>` : k === 'nam' ? `<ellipse cx="${x + 10}" cy="${top - 8}" rx="11" ry="8" fill="#b89a6a"/>` : k === 'rau' ? `<path d="M${x} ${top - 2} l9 -16 l9 16z" fill="#3e9a4a"/>` : `<circle cx="${x + 10}" cy="${top - 8}" r="9" fill="#fff8e6" stroke="#f0b030" stroke-width="3"/>`; n++; } });
    s += `<path d="M${cx - W / 2} ${top} H${cx + W / 2} Q${cx + W / 2 - 6} 184 ${cx} 188 Q${cx - W / 2 + 6} 184 ${cx - W / 2} ${top}Z" fill="none" stroke="#a8322a" stroke-width="4"/><ellipse cx="${cx}" cy="${top}" rx="${W / 2}" ry="9" fill="none" stroke="#a8322a" stroke-width="3"/>`;
    if (p.sticks) s += `<line x1="${cx + 30}" y1="${top - 6}" x2="${cx + 78}" y2="${top - 52}" stroke="#8a5a2a" stroke-width="4" stroke-linecap="round"/><line x1="${cx + 40}" y1="${top - 4}" x2="${cx + 90}" y2="${top - 44}" stroke="#8a5a2a" stroke-width="4" stroke-linecap="round"/>`;
    if (p.noodle === 'done' && p.ladle) s += `<g class="steam-svg"><path d="M80 ${top - 24} q8 -12 0 -24" stroke="#fff" stroke-width="4" fill="none" opacity=".6"/><path d="M104 ${top - 26} q8 -12 0 -24" stroke="#fff" stroke-width="4" fill="none" opacity=".6"/></g>`;
    return s + '</svg>';
  }
  function productHtml(ws) {
    const p = ws.product, o = ws.orders.find((x) => x.id === ws.sel && x.status === 'wait');
    if (!p) return `<div class="prod-empty"><span>${sd(ws.shop).icon}</span><small>Bàn trống<br>Lấy dụng cụ đựng để bắt đầu</small></div>`;
    const ctx = { trada: () => svgBowlTea(p), trasua: () => svgCup(p, o && o.spec, ws.hold), banhmi: () => svgBread(p, ws), xoi: () => svgXoi(p), mycay: () => svgMi(p) };
    return ctx[ws.shop]();
  }

  /* ---------------- bàn thao tác từng quầy ---------------- */
  const stk = (id) => G.stock(WUI.shop, id);
  const tray = (cmd, arg, icon, label, extra) => `<button class="tr" data-w="cmd" data-cmd="${cmd}" data-arg='${JSON.stringify(arg || {})}'><i>${icon}</i><span>${label}</span>${extra != null ? `<b>${extra}</b>` : ''}</button>`;
  const holdBtn = (kind, id, icon, label, extra) => `<button class="tr hold" data-hold="${kind}" data-id="${id}"><i>${icon}</i><span>${label}</span>${extra != null ? `<b>${extra}</b>` : ''}</button>`;
  const sec = (title, inner, cls) => `<div class="sec ${cls || ''}"><h5>${title}</h5><div class="grid">${inner}</div></div>`;
  const chip = (cls, data, label) => `<button class="ch ${cls}" ${data}>${label}</button>`;

  function benchTrada(ws) {
    const p = ws.product, dirty = ws.dirty.s + ws.dirty.l;
    return `<div class="b-left"><div class="prod" data-w-prod>${productHtml(ws)}</div><small class="gauge" data-w-gauge></small></div>
      <div class="b-right">${sec('Bát', tray('bowl', { size: 's' }, '🥣', 'Nhỏ', stk('bat_s')) + tray('bowl', { size: 'l' }, '🍲', 'Lớn', stk('bat_l')))}
      ${sec('Thêm', tray('ice', {}, '🧊', 'Đá', stk('da')) + tray('honey', {}, '🍯', 'Mật', stk('mat')))}
      ${sec('Rót trà', holdBtn('tea', 'tra', '🫖', 'Giữ để rót', stk('tra')), 'one')}
      ${sec('Dọn dẹp', `<button class="tr" data-w="wash"><i>🧼</i><span>Rửa bát</span><b>${dirty}</b></button>`, 'one')}</div>`;
  }
  function benchTrasua(ws) {
    const T = R.trasua, lv = G.S.shops.trasua.level, tops = Object.keys(T.TOPS).filter((k) => k !== 'hatsen' || lv >= 3), teas = Object.keys(T.TEAS).filter((k) => k !== 'matcha' || lv >= 3), milks = Object.keys(T.MILKS).filter((k) => k !== 'kem' || lv >= 5);
    const tIcon = { hong: '🍂', luc: '🍃', olong: '🌿', matcha: '🍵' }, tStock = { hong: 'tra_hong', luc: 'tra_luc', olong: 'tra_olong', matcha: 'tra_matcha' }, mStock = { tuoi: 'sua_tuoi', dac: 'sua_dac', kem: 'kem' };
    const u = WUI.ui, muong = G.eqLv('trasua', 'muong');
    return `<div class="b-left"><div class="prod" data-w-prod>${productHtml(ws)}</div><small class="gauge" data-w-gauge></small></div>
      <div class="b-right">${sec('Ly', tray('cup', { size: 'M' }, '🥤', 'M', stk('ly_M')) + tray('cup', { size: 'L' }, '🥤', 'L', stk('ly_L')))}
      ${sec('Topping' + (muong >= 2 && muong < 3 ? ` · múc ${ws.scoopN || 1}` : ''), tops.map((k) => tray('top', { id: k }, ({ tc_den: '⚫', quylinh: '🟫', pudding: '🍮', hatsen: '🤍' })[k], T.TOPS[k], stk(k))).join('') + (muong === 2 ? `<button class="tr" data-w="scoopn"><i>🥄</i><span>Múc ${ws.scoopN || 1}</span></button>` : ''), 'four')}
      ${sec('Trà (giữ vòi)', teas.map((k) => holdBtn('tea', k, tIcon[k], T.TEAS[k], stk(tStock[k]))).join(''), 'four')}
      ${sec('Sữa (giữ vòi)', milks.map((k) => holdBtn('milk', k, '🥛', T.MILKS[k], stk(mStock[k]))).join(''), 'three')}
      ${sec('Đường', [0, 1, 2, 3].map((l) => chip(u.sugar === l ? 'on' : '', `data-w="sugarlv" data-v="${l}"`, ['0%', '30%', '70%', '100%'][l])).join('') + chip(u.sugarType === 'den' ? 'on' : '', 'data-w="sugartype"', 'Đường đen') + `<button class="tr go" data-w="cmd" data-cmd="sugar" data-sugar="1"><i>💧</i><span>Bơm</span></button>`, 'wide')}
      ${sec('Đá', [0, 50, 100].map((l) => chip(u.ice === l ? 'on' : '', `data-w="icelv" data-v="${l}"`, l + '%')).join('') + `<button class="tr go" data-w="cmd" data-cmd="ice" data-ice="1"><i>🧊</i><span>Múc</span><b>${stk('da')}</b></button>`, 'wide')}
      ${sec('Hoàn thiện', tray('stir', {}, '🥄', 'Khuấy') + tray('seal', {}, '⚙️', 'Ép nắp', stk('nap')) + tray('straw', {}, '〰️', 'Ống hút', stk('hut')), 'three')}</div>`;
  }
  function benchBanhmi(ws) {
    const p = ws.product, B = R.banhmi, st = p && p.size ? B.state(ws, p) : null, z = B.zone(ws);
    const barPct = p ? Math.min(100, (p.bake / (z.dark + 2)) * 100) : 0;
    const zl = (z.gold[0] / (z.dark + 2)) * 100, zw = ((z.gold[1] - z.gold[0]) / (z.dark + 2)) * 100;
    const add = (id, icon, name) => tray('add', { id }, icon, name, `${p ? (p[id] || 0) : 0}/${stk(id)}`);
    return `<div class="b-left"><div class="prod" data-w-prod>${productHtml(ws)}</div><small class="gauge" data-w-gauge></small></div>
      <div class="b-right">${sec('Ổ bánh', tray('bread', { size: 's' }, '🥖', 'Nhỏ', stk('banh_s')) + tray('bread', { size: 'l' }, '🥖', 'Lớn', stk('banh_l')))}
      <div class="sec wide oven ${p && p.inOven ? 'hot' : ''}"><h5>Lò than</h5><div class="oven-bar"><i data-w-heat style="width:${barPct}%"></i><u class="zg" style="left:${zl}%;width:${zw}%"></u></div><div class="ov-lab"><span>Sống</span><span>Vàng giòn</span><span>Cháy</span></div>
        <div class="grid">${tray('oven', {}, '🔥', p && p.inOven ? 'Lấy ra' : 'Cho vào lò')}${tray('cut', {}, '🔪', 'Rạch bánh')}</div></div>
      ${sec('Phết & nhân', add('pate', '🫙', 'Pate') + add('xaxiu', '🥩', 'Xá xíu') + add('trung', '🍳', 'Trứng') + add('dua', '🥕', 'Dưa góp') + add('rau', '🌿', 'Rau mùi') + add('ot', '🌶️', 'Sốt ớt'), 'three')}
      ${sec('Khép & gói', tray('close', {}, '🥪', 'Khép bánh') + tray('wrap', {}, '📜', 'Gói giấy', stk('giay')))}</div>`;
  }
  function benchXoi(ws) {
    const p = ws.product, X = R.xoi, canScale = G.eqLv('xoi', 'can') >= 1;
    const need = (ws.orders.find((o) => o.id === ws.sel) || {}).spec;
    const bases = ['gac', 'nuong', 'dua'].concat(G.S.shops.xoi.level >= 5 ? ['ngusac'] : []);
    return `<div class="b-left"><div class="prod" data-w-prod>${productHtml(ws)}</div><small class="gauge" data-w-gauge>${p && p.base ? `Đã đơm ${p.scoops} muỗng${need && canScale ? ` / cần ${p.base === 'ngusac' ? '5 màu' : X.scoopsFor(need.size)}` : ''}` : ''}</small></div>
      <div class="b-right">${sec('Đựng', tray('container', { type: 'la' }, '🍃', 'Lá chuối', stk('la')) + tray('container', { type: 'dia' }, '🍽️', 'Đĩa', stk('dia')))}
      ${sec('Xửng xôi', bases.map((b) => tray('base', { id: b }, ({ gac: '🔴', nuong: '⚪', dua: '🟡', ngusac: '🌈' })[b], X.BASES[b].replace('Xôi ', ''), stk('p_' + b)).replace('class="tr"', `class="tr ${p && p.base === b ? 'on' : ''}"`)).join(''), bases.length === 4 ? 'four' : 'three')}
      ${sec('Đơm xôi', tray('scoop', {}, '🥄', 'Đơm +1') + tray('scrape', {}, '↩️', 'Gạt −1'), 'two')}
      ${p && p.base === 'ngusac' ? sec('Xếp 5 màu', X.COLORS.map((c, i) => `<button class="tr color ${p.colors.indexOf(i) >= 0 ? 'on' : ''}" data-w="cmd" data-cmd="color" data-arg='{"idx":${i}}' style="--c:${c[0]}"><i></i><span>${c[1]}</span></button>`).join(''), 'five') : ''}
      ${sec('Topping', ['ga', 'dau', 'hanh', 'dua'].map((k) => tray('top', { id: k }, ({ ga: '🍗', dau: '🫛', hanh: '🧅', dua: '🥥' })[k], X.TOPS[k], `${p ? (p.tops[k] || 0) : 0}/${stk(k)}`)).join(''), 'four')}
      ${sec('Gói', tray('fold', {}, '🍃', 'Gấp lá') + tray('tie', {}, '🪢', 'Buộc lạt', stk('lat')) + tray('spoon', {}, '🥄', 'Đặt thìa'), 'three')}</div>`;
  }
  function benchMycay(ws) {
    const M = R.mycay, p = ws.product, o = ws.orders.find((x) => x.id === ws.sel), tgt = o && G.eqLv('mycay', 'ot') >= 1 ? o.spec.spice : 0;
    const zone = M.zone(ws), cookPct = p && p.noodle === 'cooking' ? Math.min(100, (p.cook / (zone[1] + 4)) * 100) : (p && p.noodle === 'done' ? 100 : 0);
    const gauge = p && p.gauge ? p.gauge.pos : (p && p.spice != null ? p.spice - 0.5 : -1);
    const relaxed = G.S.settings.relaxed || (G.S.settings.assist && G.eqLv('mycay', 'ot') >= 3);
    return `<div class="b-left"><div class="prod" data-w-prod>${productHtml(ws)}</div><small class="gauge" data-w-gauge></small></div>
      <div class="b-right">${sec('Tô', tray('bowl', { size: 's' }, '🥣', 'Nhỏ', stk('to_s')) + tray('bowl', { size: 'l' }, '🍲', 'Lớn', stk('to_l')))}
      <div class="sec wide"><h5>Trụng mỳ</h5><div class="oven-bar"><i data-w-cook style="width:${cookPct}%"></i><u class="zg" style="left:${(zone[0] / (zone[1] + 4)) * 100}%;width:${((zone[1] - zone[0]) / (zone[1] + 4)) * 100}%"></u></div>
        <div class="grid">${tray('dip', {}, '🧺', 'Hạ rổ mỳ', stk('mi'))}${tray('lift', {}, '🍜', 'Nhấc rổ')}</div></div>
      ${sec('Nước dùng', tray('ladle', { id: 'rau' }, '🍄', 'Nấm', stk('nuoc_rau')) + tray('ladle', { id: 'thit' }, '🍖', 'Thịt', stk('nuoc_thit')))}
      ${sec('Topping', ['thit', 'nam', 'rau', 'trung'].map((k) => tray('top', { id: k }, ({ thit: '🥩', nam: '🍄', rau: '🥬', trung: '🥚' })[k], M.TOPS[k], `${p ? (p.tops[k] || 0) : 0}/${stk(k)}`)).join(''), 'four')}
      <div class="sec wide"><h5>Nêm cay (cấp 1–7)</h5><div class="cells" data-w-cells>${[1, 2, 3, 4, 5, 6, 7].map((i) => `<div class="cell ${tgt === i ? 'tg' : ''}" style="--c:${['#7fbf4a', '#a6c63a', '#d9c93a', '#f0a030', '#e8602a', '#c8301f', '#7a2ab8'][i - 1]}">${relaxed && p && p.noodle === 'done' && p.spice == null ? `<button data-w="cmd" data-cmd="set" data-arg='{"level":${i}}'>${i}</button>` : i}</div>`).join('')}<div class="needle" data-w-needle style="left:${gauge >= 0 ? (gauge / 7) * 100 : -10}%"></div></div>
        <div class="grid">${p && p.gauge ? tray('stop', {}, '✋', 'Dừng!') : tray('spice', {}, '🌶️', 'Nêm ớt', stk('ot'))}${tray('sticks', {}, '🥢', 'Đặt đũa', stk('dua_an'))}</div></div></div>`;
  }
  function renderBench(ws) {
    const el = $('[data-w-bench]'); if (!el) return;
    const keep = el.querySelector('.b-right') ? el.querySelector('.b-right').scrollTop : 0;
    syncHtml(el, { trada: benchTrada, trasua: benchTrasua, banhmi: benchBanhmi, xoi: benchXoi, mycay: benchMycay }[ws.shop](ws));
    const br = el.querySelector('.b-right'); if (br) br.scrollTop = keep;
    updateDisabled(ws);
  }
  function updateDisabled(ws) {
    const busy = !!ws.busy;
    $$('[data-w-bench] .tr, [data-w-actions] button').forEach((b) => { b.classList.toggle('busy', busy); });
  }
  function renderActions(ws) {
    const el = $('[data-w-actions]'); if (!el) return;
    const slots = G.shelfSlots(ws.shop);
    syncHtml(el, `<button class="ac" data-w="discard"><i>🗑️</i>Bỏ món</button>
      <button class="ac" data-desk="shelf"><i>🗄️</i>Khay ${slots ? `${ws.shelf.length}/${slots}` : '(chưa có)'}</button>
      <button class="ac stock" data-w="restock"><i>🧺</i>Nhập hàng</button>
      <button class="ac go ${WUI.delivering ? 'on' : ''}" data-w="deliver"><i>📦</i>${WUI.delivering ? 'Chọn khách…' : 'Giao'}</button>
      `);
  }
  WUI.renderAll = function () {
    const ws = WS.state(); if (!ws || WUI.tab !== 'work' || !WUI.shop) return;
    renderQueue(ws); renderTicket(ws); renderBench(ws); renderActions(ws);
  };

  /* ======================== CẬP NHẬT MỖI KHUNG ======================== */
  let lastSig = '';
  WUI.update = function () {
    if (!WUI.shop) return;
    const ws = WS.state(), id = WUI.shop;
    window.LivingMarket.updateStall(ws);
    const coins = $('[data-w-coins]'); if (coins) coins.textContent = G.fmt(S().coins);
    if (!ws || WUI.tab !== 'work') {
      const sub = $('[data-w-sub]'); if (sub) sub.textContent = ws ? 'Ca đang tạm dừng' : 'Chuẩn bị mở ca'; updatePrep(); return;
    }
    const sub = $('[data-w-sub]'), left = Math.max(0, Math.ceil(ws.total - ws.clock));
    if (sub) sub.textContent = ws.tutorial ? 'Ca hướng dẫn · không phạt' : (ws.paused ? 'Tạm dừng' : ws.accepting ? 'Đang mở cửa' : 'Đã đóng nhận khách');
    const clk = $('[data-w-clock]'); if (clk) clk.textContent = ws.accepting ? `⏱ ${Math.floor(left / 60)}:${String(left % 60).padStart(2, '0')}` : `🔔 Hoàn thành đơn: ${Math.max(0, Math.ceil(ws.graceLeft))}s`;
    const rs = $('[data-w-rush]'); if (rs) { const on = WS.rushOn(); rs.hidden = !(on || (ws.rush && ws.clock >= ws.rush.warn && ws.clock < ws.rush.start)); rs.textContent = on ? '🥁 Giờ đông khách ×1,5' : '🥁 Sắp đông khách…'; }
    // phiếu và hàng chờ chỉ dựng lại khi cấu trúc thay đổi
    const sig = ws.orders.map((o) => o.id + o.status + (ws.sel === o.id ? 's' : '')).join(',') + '|' + (ws.product ? JSON.stringify(ws.product, (k, v) => (['used','bake','cook','gauge','teaVol','milkVol','vol'].includes(k) ? undefined : v)) : '-') + '|' + (ws.busy ? ws.busy.key : '') + '|' + ws.shelf.length + '|' + WUI.delivering + '|' + ws.dirty.s + ws.dirty.l + '|' + JSON.stringify(WUI.ui);
    const holdSig = ws.hold ? ws.hold.kind + ws.hold.id : '';
    if (sig !== lastSig && !ws.hold) { lastSig = sig; WUI.renderAll(); }
    else if (ws.hold) { const pr = $('[data-w-prod]'); if (pr) syncHtml(pr, productHtml(ws)); }
    // thanh kiên nhẫn
    ws.orders.forEach((o) => { if (!ws.tutorial) { const f = Math.max(0, Math.min(1, o.p / o.max)); $$(`[data-p="${o.id}"]`).forEach(b=>{b.style.width = (f * 100) + '%'; b.parentElement.classList.toggle('low', f < 0.2); if(b.parentElement.hasAttribute('role'))b.parentElement.setAttribute('aria-valuenow',Math.round(f*100));}); } });
    // đồng hồ lò / trụng / kim cay (không dựng lại cả bàn)
    const p = ws.product;
    if (p) {
      const heat = $('[data-w-heat]'); if (heat && ws.shop === 'banhmi') { const z = R.banhmi.zone(ws); heat.style.width = Math.min(100, (p.bake / (z.dark + 2)) * 100) + '%'; heat.classList.toggle('gold', R.banhmi.state(ws, p) === 'gold'); const pr = $('[data-w-prod]'); if (pr && p.inOven) syncHtml(pr, productHtml(ws)); }
      const ck = $('[data-w-cook]'); if (ck && ws.shop === 'mycay') { const z = R.mycay.zone(ws); ck.style.width = (p.noodle === 'cooking' ? Math.min(100, (p.cook / (z[1] + 4)) * 100) : p.noodle === 'done' ? 100 : 0) + '%'; ck.classList.toggle('gold', p.noodle === 'cooking' && p.cook >= z[0] && p.cook <= z[1]); }
      const nd = $('[data-w-needle]'); if (nd && p.gauge) nd.style.left = (p.gauge.pos / 7) * 100 + '%';
      const g = $('[data-w-gauge]'); if (g) g.textContent = gaugeText(ws, p);
    }
    if (ws.busy) { const pr = $('[data-w-prod]'); if (pr && !pr.dataset.busy) pr.dataset.busy = 1; }
    const msgs = WS.drainMsgs(); msgs.forEach((m) => window.UI.toast(m.t, m.kind));
    const hint = $('[data-w-hint]'); if (hint) { const o = ws.orders.find((x) => x.id === ws.sel && x.status === 'wait'); hint.textContent = '▸ ' + R[ws.shop].hint(ws, ws.product, o); }
    // bám theo trạng thái bận
    const stl = $('#stall'); if (stl) stl.classList.toggle('is-busy', !!ws.busy); if (stl) stl.style.setProperty('--busy', ws.busy ? 1 - ws.busy.t / ws.busy.total : 0);
  };
  function gaugeText(ws, p) {
    if (ws.shop === 'trada' && p.size) return `Trà ${Math.round(p.vol)}/${Math.round(R.trada.target(p))}`;
    if (ws.shop === 'trasua' && p.size) { const T = R.trasua, o = ws.orders.find((x) => x.id === ws.sel); const liq = T.liquidTarget(p); if (!o) return `Tổng ${Math.round(T.total(p))}/${T.capOf(p.size)}`; const teaT = liq * T.ratio(o.spec.milk); return `Trà ${Math.round(p.teaVol)}/${Math.round(teaT)}${o.spec.milk ? ` · sữa ${Math.round(p.milkVol)}/${Math.round(liq - teaT)}` : ''}`; }
    if (ws.shop === 'banhmi' && p.size) { const st = R.banhmi.state(ws, p); return `${p.bake.toFixed(1)}s · ${({ raw: 'sống', near: 'gần chín', gold: 'VÀNG GIÒN', dark: 'sẫm', burnt: 'CHÁY' })[st]}`; }
    return '';
  }

  /* ======================== SỰ KIỆN CHUNG ======================== */
  function bind() {
    const root = document;
    root.addEventListener('click', (e) => {
      const st = e.target.closest('#stall'); if (!st) return;
      window.Audio2.unlock();
      const b = e.target.closest('[data-w]'); if (!b) return;
      const ws = WS.state(), w = b.dataset.w;
      if (w === 'back') { WUI.close(); return; }
      if (w === 'start') { const r = WS.start(WUI.shop); if (!r.ok) window.UI.toast(r.msg, 'err'); else { WUI.tab = 'work'; lastSig = ''; WUI.render(); sfx('gong'); G.buzz([30, 40, 60]); } return; }
      if (w === 'tab') { WUI.tab = b.dataset.tab; WUI.render(); return; }
      if (w === 'buy') { if (G.buyPack(WUI.shop, b.dataset.item)) { sfx('buy'); G.buzz(15); WUI.render(); if (WUI.tab === 'work') WUI.renderAll(); else updatePrep(); } else { sfx('error'); window.UI.toast('Chưa đủ xu để nhập hàng.', 'err'); } return; }
      if (w === 'eqbuy') { if (G.eqBuy(WUI.shop, b.dataset.eq)) { sfx('levelup'); G.buzz([20, 40, 20]); WUI.render(); } else { sfx('error'); window.UI.toast('Chưa đủ xu hoặc chưa đạt cấp quầy yêu cầu.', 'err'); } return; }
      if (w === 'cook') { const r = WS.cook(b.dataset.type); if (!r.ok) { sfx('error'); window.UI.toast(r.msg, 'err'); } else { sfx('sizzle'); G.buzz(20); WUI.render(); } return; }
      if (w === 'upgrade') { if (G.upgrade(WUI.shop)) WUI.render(); else { sfx('error'); window.UI.toast('Chưa đủ xu để nâng cấp quầy.', 'err'); } return; }
      if (w === 'hire') { if (G.hire(WUI.shop)) WUI.render(); else { sfx('error'); window.UI.toast('Chưa đủ xu để thuê tiểu nhị.', 'err'); } return; }
      if (w === 'end') { window.UI.modal(`<h3>Chốt ca sớm?</h3><p>Đơn đang chờ sẽ bị hủy, món trên bàn tính vào hao phí.</p><div class="row2"><button class="btn danger" data-endyes>Chốt ca</button><button class="btn ghost" data-close>Tiếp tục</button></div>`); return; }
      if (!ws) return;
      if (w === 'pick') {
        const id = +b.dataset.id;
        if (WUI.delivering) { doDeliver(id, WUI.shelfSrc); return; }
        WS.select(id); sfx('click'); G.buzz(8); lastSig = ''; return;
      }
      if (w === 'cmd') {
        let arg = b.dataset.arg ? JSON.parse(b.dataset.arg) : {};
        if (b.dataset.sugar) arg = { level: WUI.ui.sugar, type: WUI.ui.sugar > 0 ? WUI.ui.sugarType : 'thuong' };
        if (b.dataset.ice) arg = { level: WUI.ui.ice };
        const r = WS.cmd(b.dataset.cmd, arg);
        if (!r.ok) { sfx('error'); G.buzz(40); if (r.msg) window.UI.toast(r.msg, 'err'); b.classList.add('shake'); setTimeout(() => b.classList.remove('shake'), 300); }
        else { if (r.sfx) sfx(r.sfx); G.buzz(10); if (!r.busy) lastSig = ''; const o = $('#stall'); if (o) { const rc = b.getBoundingClientRect(); window.UI.vfx.sparkle(rc.left + rc.width / 2, rc.top + 6, 3, '#ffe27a'); } }
        return;
      }
      if (w === 'wash') { const r = WS.dirtyClean(); if (!r.ok) { if (r.msg) window.UI.toast(r.msg, 'err'); sfx('error'); } else sfx('pour'); return; }
      if (w === 'sugarlv') { WUI.ui.sugar = +b.dataset.v; lastSig = ''; sfx('tap'); return; }
      if (w === 'sugartype') { WUI.ui.sugarType = WUI.ui.sugarType === 'den' ? 'thuong' : 'den'; lastSig = ''; sfx('tap'); return; }
      if (w === 'icelv') { WUI.ui.ice = +b.dataset.v; lastSig = ''; sfx('tap'); return; }
      if (w === 'scoopn') { ws.scoopN = ws.scoopN === 2 ? 1 : 2; lastSig = ''; sfx('tap'); return; }
      if (w === 'discard') { const r = WS.discard(); if (!r.ok) window.UI.toast(r.msg || 'Không có món.', 'err'); else { sfx('trash'); G.buzz(40); lastSig = ''; } return; }
      if (w === 'shelve') { const r = WS.shelve(); if (!r.ok) { window.UI.toast(r.msg, 'err'); sfx('error'); } else { sfx('tap'); lastSig = ''; } return; }
      if (w === 'shelfpick') { const i = +b.dataset.i; WUI.delivering = true; WUI.shelfSrc = i; window.UI.toast('Chạm khách nhận món cất.'); lastSig = ''; return; }
      if (w === 'restock') { WUI.restock(); return; }
      if (w === 'deliver') {
        if (!ws.product) { window.UI.toast('Chưa có món trên bàn để giao.', 'err'); sfx('error'); return; }
        const o = ws.orders.find((x) => x.id === ws.sel && x.status === 'wait');
        // giao ngay cho người đã ghim; chạm lại để đổi người nhận (chọn khách khác)
        if (!WUI.delivering) {
          const why = R[ws.shop].canDeliver(ws, ws.product);
          if (why) { window.UI.toast(why, 'err'); sfx('error'); G.buzz(60); return; }
          const wait = ws.orders.filter((x) => x.status === 'wait');
          if (wait.length === 1) { doDeliver(wait[0].id, 'table'); return; }
          WUI.delivering = true; WUI.shelfSrc = 'table'; window.UI.toast('Chạm vào khách nhận món.'); lastSig = ''; return;
        }
        WUI.delivering = false; lastSig = ''; void o; return;
      }
    });
    root.addEventListener('click', (e) => { const y = e.target.closest('[data-endyes]'); if (y) { window.UI.closeModal(); WS.finish(true); } });

    /* giữ vòi rót: pointerdown bắt đầu · pointerup/cancel/leave/blur dừng */
    const down = (e) => {
      const b = e.target.closest('[data-hold]'); if (!b || !e.target.closest('#stall')) return;
      e.preventDefault(); window.Audio2.unlock();
      const ws = WS.state(); if (!ws) return;
      if (S().settings.tapPour && ws.hold && ws.hold.kind === b.dataset.hold && ws.hold.id === b.dataset.id) { WS.holdStop(); b.classList.remove('pouring'); return; }
      const r = WS.holdStart(b.dataset.hold, b.dataset.id);
      if (!r.ok) { sfx('error'); G.buzz(40); if (r.msg) window.UI.toast(r.msg, 'err'); return; }
      b.classList.add('pouring'); try { b.setPointerCapture(e.pointerId); } catch (er) { /* bỏ qua */ }
      G.buzz(12); WUI._hb = b; pourSfx();
    };
    const up = () => { const ws = WS.state(); if (!ws) return; if (S().settings.tapPour) return; if (ws.hold) { WS.holdStop(); } $$('.tr.hold.pouring').forEach((x) => x.classList.remove('pouring')); WUI._hb = null; lastSig = ''; };
    root.addEventListener('pointerdown', down);
    root.addEventListener('pointerup', up); root.addEventListener('pointercancel', up);
    root.addEventListener('lostpointercapture', up);
    window.addEventListener('blur', () => { WS.holdStop(); up(); });
    document.addEventListener('visibilitychange', () => { if (document.hidden) { WS.holdStop(); up(); if (WS.state()) WS.setPause('hidden', true); } else if (WS.state()) WS.setPause('hidden', false); });
    G.on('spill', () => { sfx('error'); G.buzz([60, 30, 60]); window.UI.toast('Tràn rồi! Rót vượt sức chứa.', 'err'); $$('.tr.hold.pouring').forEach((x) => x.classList.remove('pouring')); lastSig = ''; });
    G.on('autoStop', () => { sfx('tap'); $$('.tr.hold.pouring').forEach((x) => x.classList.remove('pouring')); lastSig = ''; });
    G.on('busyDone', () => { lastSig = ''; sfx('tap'); });
    G.on('delivered', onDelivered); G.on('left', ({ order }) => { window.UI.toast(`${order.who.name} hết kiên nhẫn, bỏ đi.`, 'err'); sfx('sad'); lastSig = ''; });
    G.on('order', () => { lastSig = ''; if (WUI.isOpen()) sfx('bell'); });
    G.on('burnt', () => { sfx('error'); G.buzz([80, 40, 80]); });
    G.on('washed', () => { lastSig = ''; sfx('coin'); });
    G.on('steamDone', ({ type, n }) => { window.UI.toast(`Mẻ ${R.xoi.BASES[type]} đã chín: +${n} phần`, 'ok'); sfx('coin'); if (WUI.isOpen()) { if (WS.state() && WUI.tab === 'work') WUI.renderAll(); else WUI.render(); } });
    G.on('rushWarn', () => { window.UI.banner('🥁 Sắp đông khách! Chuẩn bị tay nghề.'); });
    G.on('rush', () => { window.UI.banner('🥁 GIỜ ĐÔNG KHÁCH! Giá ×1,5 trong 30 giây', 'rush'); sfx('gong'); G.buzz([60, 40, 60, 40, 120]); window.Audio2.setMode('rush'); });
    G.on('rushEnd', () => { window.Audio2.setMode('calm'); window.UI.banner('🌿 Hết giờ đông khách'); });
    G.on('closing', () => { window.UI.banner('🔔 Hết giờ nhận khách. Hoàn thành các đơn đang làm!'); sfx('gong'); });
    G.on('shiftEnd', (sum) => { WUI.delivering = false; lastSig = ''; window.Audio2.setMode('calm'); showSummary(sum); });
  }
  let pourT = 0;
  function pourSfx() { clearInterval(pourT); pourT = setInterval(() => { const ws = WS.state(); if (!ws || !ws.hold) { clearInterval(pourT); return; } sfx('pour'); G.buzz(6); }, 420); }

  function doDeliver(orderId, src) {
    const r = WS.deliver(orderId, src === 'table' ? null : src);
    WUI.delivering = false; lastSig = '';
    if (!r.ok) { if (r.msg) window.UI.toast(r.msg, 'err'); sfx('error'); G.buzz(60); }
  }
  function onDelivered({ order, grade, pay, tip, streakBonus }) {
    lastSig = ''; WUI.delivering = false;
    const el = $('#stall'); const cx = window.innerWidth / 2, cy = 190;
    if (grade.reject) { sfx('fail'); G.buzz(220); window.UI.toast(`${order.who.name} từ chối món: ${grade.comments.slice(0, 2).join(', ') || 'chưa đạt'}.`, 'err'); return; }
    window.UI.vfx.spawnCoins(cx, cy + 20, grade.perfect ? 9 : 4); window.UI.float(cx, cy, '+' + G.fmt(pay), grade.perfect ? 'perfect' : '');
    if (grade.perfect) { sfx('cheer'); G.buzz([30, 50, 100]); window.UI.vfx.sparkle(cx, cy, 14); window.UI.float(cx, cy - 34, '✦ HOÀN HẢO ✦', 'perfect'); }
    else { sfx('coin'); G.buzz(25); window.UI.toast(`${order.who.name}: ${grade.comments.length ? grade.comments.slice(0, 2).join(' · ') : 'Ngon!'}`); }
    if (streakBonus) { window.UI.banner('🔥 Đơn thứ 5 chuẩn liên tiếp: thưởng GẤP ĐÔI!'); sfx('levelup'); }
    void el;
  }

  /* ======================== MÀN CHUẨN BỊ ======================== */
  function prepHtml(id) {
    const def = sd(id), st = S().shops[id], ch = G.chapterDef();
    const items = C.items[id];
    const un = !S().tut[id];
    let h = `<div class="st-prep"><div class="pp-tabs"><button class="on" data-w="tab" data-tab="prep">Chuẩn bị</button></div>`;
    h += `<div class="pp-start"><div><b>${un ? '📖 Ca hướng dẫn (2 phút)' : '▶ Ca bán · ' + S().settings.shiftLength / 60 + ' phút'}</b><small>${un ? 'Làm 3 đơn đầu, khách chờ vô hạn, sai không bị phạt.' : ['Thong thả','Tiêu chuẩn','Thử thách'][S().settings.difficulty] + ' · tối đa 3 khách chờ · hoàn thành đơn trước khi hết kiên nhẫn'}</small></div><button class="btn gold big" data-w="start">Mở cửa đón khách</button></div>`;
    h += window.LivingMarket.prepGuide(id);
    h += `<div class="pp-info">Cấp quầy <b>${st.level}</b> · Tiểu nhị <b>${st.staff}</b> (+${G.fmt(G.cps(id))}/s khi giao quản lý) <button class="btn ghost sm" data-w="upgrade">Nâng cấp ${G.fmt(G.upgradeCost(id))}</button> <button class="btn ghost sm" data-w="hire">Thuê ${G.fmt(G.hireCost(id))}</button></div>`;
    if (id === 'xoi') {
      const steam = S().steam || [];
      h += `<h4>🥘 Hấp mẻ xôi (trước ca)</h4><div class="pp-grid">${['gac', 'nuong', 'dua'].concat(G.S.shops.xoi.level >= 5 ? ['ngusac'] : []).map((t) => `<div class="pp-item"><span class="pi-i">${({ gac: '🔴', nuong: '⚪', dua: '🟡', ngusac: '🌈' })[t]}</span><div class="pi-t"><b>${R.xoi.BASES[t]}</b><small>Đã hấp: ${G.stock('xoi', 'p_' + t)} phần · nếp: ${G.stock('xoi', 'nep_' + t)}</small></div><button class="btn gold sm" data-w="cook" data-type="${t}">Hấp ${[10, 10, 15, 20][G.eqLv('xoi', 'xung')]}</button></div>`).join('')}</div>${steam.length ? `<div class="steam-now">${steam.map((s) => `🔥 Đang hấp ${R.xoi.BASES[s.type]}… ${Math.ceil(s.t)}s`).join(' · ')}</div>` : ''}`;
    }
    h += `<h4>🧺 Nhập hàng</h4><div class="pp-grid" data-pp-stock>${items.filter((it) => it.w > 0 || it.reuse).map((it) => stockRow(id, it)).join('')}</div>`;
    h += `<h4>🛠️ Nâng cấp dụng cụ</h4><div class="pp-eq">${G.eqList(id).map((e) => eqCard(id, e)).join('')}</div>`;
    if (ch) h += `<div class="pp-chap"><b>📜 Chương ${ch.id}: ${esc(ch.title)}</b><small>${esc(ch.goal)} · ${esc(ch.prog(S()))}</small></div>`;
    return h + '</div>';
  }
  function stockRow(id, it) {
    const cost = G.packCost(id, it.id), n = G.packSize(id, it.id), have = G.stock(id, it.id);
    return `<div class="pp-item"><span class="pi-i">${it.icon}</span><div class="pi-t"><b>${esc(it.name)}</b><small>Còn ${have}${it.batch ? ' mẻ' : ''}</small></div><button class="btn ghost sm" data-w="buy" data-item="${it.id}" ${S().coins >= cost ? '' : 'disabled'}>+${n} · ${G.fmt(cost)}</button></div>`;
  }
  function eqCard(id, e) {
    const lv = G.eqLv(id, e.id), max = lv >= 3, need = G.eqNeed(id, e.id), st = S().shops[id], can = !max && st.level >= need, cost = max ? 0 : G.eqCost(id, e.id);
    return `<div class="eq ${max ? 'max' : ''}"><span class="eq-i">${e.icon}</span><div class="eq-t"><b>${esc(e.name)} <em>cấp ${lv}/3</em></b><small>${max ? 'Đã tối đa' : `Cấp ${lv + 1}: ${esc(e.tiers[lv])}${can ? '' : ` · cần quầy cấp ${need}`}`}</small></div>${max ? '' : `<button class="btn gold sm" data-w="eqbuy" data-eq="${e.id}" ${can && S().coins >= cost ? '' : 'disabled'}>${G.fmt(cost)}</button>`}</div>`;
  }
  function updatePrep() { /* màn chuẩn bị dựng lại khi thao tác, không cần cập nhật theo khung */ }

  WUI.restock = function (sid) {
    const id = sid || WUI.shop;
    if (WS.state()) WS.setPause('modal', true);
    const m = window.UI.modal(`<h3>🧺 Nhập hàng nhanh</h3><div class="pp-grid mini" data-pp-stock>${C.items[id].filter((it) => (it.w > 0 || it.reuse)).map((it) => stockRow(id, it)).join('')}</div><button class="btn gold" data-close>Xong</button>`, () => { if (WS.state()) WS.setPause('modal', false); });
    $('#modal').addEventListener('click', (e) => { const b = e.target.closest('[data-w="buy"]'); if (!b) return; if (G.buyPack(id, b.dataset.item)) { sfx('buy'); const g = $('[data-pp-stock]', $('#modal')); g.innerHTML = C.items[id].filter((it) => (it.w > 0 || it.reuse)).map((it) => stockRow(id, it)).join(''); } else { sfx('error'); } });
    void m;
  };

  /* ======================== TỔNG KẾT CA ======================== */
  function showSummary(s) {
    const def = sd(s.shop);
    const stars = s.served ? Math.max(1, Math.min(5, Math.round((s.perfect / Math.max(1, s.served)) * 3 + 2))) : 1;
    window.UI.modal(`<h3>🏮 Tổng kết ca — ${esc(def.short)}</h3>
      <div class="sum-stars">${'★'.repeat(stars)}${'☆'.repeat(5 - stars)}</div>
      <div class="sum-grid"><div><small>Doanh thu</small><b>${Art.coin(16)} ${G.fmt(s.revenue)}</b></div><div><small>Chi phí nguyên liệu</small><b>−${G.fmt(s.cost)}</b></div><div><small>Hao phí (bỏ món)</small><b>−${G.fmt(s.waste)}</b></div><div><small>Lãi ròng</small><b class="${s.profit >= 0 ? 'pos' : 'neg'}">${s.profit >= 0 ? '+' : ''}${G.fmt(s.profit)}</b></div>
      <div><small>Đã giao</small><b>${s.served}</b></div><div><small>Hoàn hảo</small><b>${s.perfect}</b></div><div><small>Bị từ chối</small><b>${s.cancelled}</b></div><div><small>Khách bỏ đi</small><b>${s.left}</b></div></div>
      <p class="sum-tip">Tiền boa ${G.fmt(s.tips)} · Uy tín ${s.rep >= 0 ? '+' : ''}${s.rep}</p>
      ${s.comments.length ? `<div class="sum-cm"><b>Nhận xét của khách:</b>${s.comments.map((c) => `<span>• ${esc(c)}</span>`).join('')}</div>` : '<div class="sum-cm"><b>Nhận xét:</b><span>• Khách hài lòng với tay nghề của bạn.</span></div>'}
      ${s.tutorial ? '<p class="sum-tut">📖 Hoàn thành ca hướng dẫn! Ca tiếp theo dùng độ khó và thời lượng bạn chọn trong Cài đặt.</p>' : ''}
      <div class="row2"><button class="btn gold" data-sumok>Về chuẩn bị</button></div>`);
    $('#modal').onclick = (e) => { if (e.target.closest('[data-sumok]')) { window.UI.closeModal(); WUI.tab = 'prep'; if (WUI.shop) WUI.render(); } };
    sfx('levelup'); G.buzz([30, 40, 30]);
  }

  WUI.init = function () { bind(); };
})();
