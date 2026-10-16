/* ============================================================================
   BẢN ĐỒ CHỢ CỔ: ảnh nền dọc, camera kéo/quán tính/hai ngón, bản đồ nhỏ,
   điểm chạm quầy/NPC/nhập hàng và thẻ thông tin theo tiến trình.
   ========================================================================== */
(function () {
  'use strict';
  const G = window.Game, C = window.CFG;
  const MM = { x: 0, y: 0, s: 0.8, min: 0.3, max: 2, W: window.MarketWorld.width, H: window.MarketWorld.height, drag: null, pts: new Map(), sel: null, vx: 0, vy: 0, motion: null };
  window.MM = MM;
  const $ = (q, r) => (r || document).querySelector(q);
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const sfx = (t) => window.Audio2.sfx(t);

  MM.mount = function (host) {
    if (MM.events) MM.events.abort();
    if (MM.observer) MM.observer.disconnect();
    MM.events = new AbortController(); MM.pts.clear(); MM.drag = null; MM.motion = null; MM.vx = MM.vy = 0;MM.suppressClick=false;
    host.innerHTML = `<div class="map" id="map" tabindex="0" aria-label="Bản đồ chợ làng. Kéo để khám phá, dùng hai ngón hoặc nút cộng trừ để thu phóng. Phím mũi tên để di chuyển.">
      <div class="map-stage" id="mapStage" style="width:${MM.W}px;height:${MM.H}px">
        <img class="map-img" src="assets/market.jpg" alt="Chợ làng cổ" draggable="false">
        <div class="map-glow"></div><div class="map-walkers" id="walkers"></div>
        <div class="map-hs" id="hs"></div>
      </div>
      <div class="map-vig"></div>
      <div class="map-chap" id="mapChap"></div>
      <div class="map-ctl"><button data-m="zi" aria-label="Phóng to">＋</button><button data-m="zo" aria-label="Thu nhỏ">－</button><button data-m="home" aria-label="Về quán đang chọn">⌖</button><button data-m="overview" aria-label="Xem toàn cảnh chợ">▧</button></div>
      <button class="map-mini" data-m="minimap" aria-label="Bản đồ nhỏ: chạm để đến một vị trí, Enter để xem toàn cảnh"><img src="assets/market.jpg" alt="" draggable="false"><span class="mini-window"></span><small>CHỢ LÀNG</small></button>
      <div class="map-help">Kéo để dạo chợ · Chạm biển để vào quầy</div>
      <div class="market-chats" aria-hidden="true"></div>
      <div class="map-card" id="mapCard" hidden></div></div>`;
    MM.stage = $('#mapStage'); MM.el = $('#map');
    MM._view = null; buildHotspots(); buildWalkers(); bind(); MM.fit(true); MM.refresh();
    MM.observer = new ResizeObserver(() => MM.fit(false)); MM.observer.observe(MM.el);
  };

  /* ---------- camera ---------- */
  MM.view = () => MM._view || (MM._view = { w: MM.el.clientWidth, h: MM.el.clientHeight });
  MM.clampCam = function () {
    const v = MM.view(), W = MM.W * MM.s, H = MM.H * MM.s;
    MM.x = W <= v.w ? (v.w - W) / 2 : Math.max(v.w - W, Math.min(0, MM.x));
    MM.y = H <= v.h ? (v.h - H) / 2 : Math.max(v.h - H, Math.min(0, MM.y));
  };
  MM.apply = function () {
    MM.clampCam();
    MM.stage.style.transform = `translate3d(${MM.x.toFixed(2)}px,${MM.y.toFixed(2)}px,0) scale(${MM.s.toFixed(4)})`;
    MM.stage.style.setProperty('--inv', (1 / MM.s).toFixed(4));
    MM.el.dataset.zoom = MM.s < .5 ? 'overview' : MM.s < .85 ? 'district' : 'street';
    const v = MM.view(), mini = $('.mini-window', MM.el);
    if (mini) {
      const left = Math.max(0, -MM.x / MM.s), top = Math.max(0, -MM.y / MM.s);
      mini.style.cssText = `left:${left/MM.W*100}%;top:${top/MM.H*100}%;width:${Math.min(MM.W-left,v.w/MM.s)/MM.W*100}%;height:${Math.min(MM.H-top,v.h/MM.s)/MM.H*100}%`;
    }
    if(window.LivingMarket?.updateChats)window.LivingMarket.updateChats();
  };
  MM.fit = function (initial) {
    const old = MM._view, center = old ? [(old.w/2-MM.x)/MM.s,(old.h/2-MM.y)/MM.s] : null;
    MM._view = { w: MM.el.clientWidth, h: MM.el.clientHeight };
    const v = MM.view(); if (!v.w || !v.h) return;
    // Leave vertical travel even at the smallest zoom: the street is a place to
    // explore, rather than a small image locked in the middle of the viewport.
    MM.min = Math.max(v.w / MM.W, (v.h + 120) / MM.H);
    MM.max = Math.max(2, Math.max(v.w/MM.W,v.h/MM.H)*1.8);
    if (initial) { MM.s = Math.min(MM.max,Math.max(v.w/MM.W,v.h/MM.H)*1.35); MM.focus(...G.shopDef(MM.sel && MM.sel.id || 'trada').map, false); }
    else { MM.cancelMotion(); MM.s = Math.max(MM.min,Math.min(MM.max,MM.s)); if(center){MM.x=v.w/2-center[0]*MM.s;MM.y=v.h/2-center[1]*MM.s;} MM.apply(); }
  };
  MM.cancelMotion = () => { MM.motion = null; MM.vx = MM.vy = 0; };
  MM.focus = function (px, py, anim) {
    MM.cancelMotion();
    const v = MM.view(), tx = v.w / 2 - px * MM.s, ty = v.h * 0.42 - py * MM.s;
    if (!anim || document.body.classList.contains('reduce-motion')) { MM.x = tx; MM.y = ty; MM.apply(); return; }
    MM.motion = { x0: MM.x, y0: MM.y, tx, ty, elapsed: 0 };
  };
  MM.zoom = function (f, cx, cy) {
    MM.cancelMotion();
    const v = MM.view(); cx = cx == null ? v.w / 2 : cx; cy = cy == null ? v.h / 2 : cy;
    const ns = Math.max(MM.min, Math.min(MM.max, MM.s * f)), k = ns / MM.s;
    MM.x = cx - (cx - MM.x) * k; MM.y = cy - (cy - MM.y) * k; MM.s = ns; MM.apply();
  };
  MM.overview = function () { MM.cancelMotion(); MM.s = MM.min; const v=MM.view(); MM.x=(v.w-MM.W*MM.s)/2;MM.y=(v.h-MM.H*MM.s)/2;MM.apply(); };
  MM.tick = function (dt) {
    if (!MM.el?.isConnected || document.hidden || window.UI.page!=='market' || window.WUI.isOpen()) { MM.cancelMotion(); return; }
    if (MM.motion) {
      const m=MM.motion;m.elapsed+=dt;const t=Math.min(1,m.elapsed/.42),e=1-(1-t)**3;
      MM.x=m.x0+(m.tx-m.x0)*e;MM.y=m.y0+(m.ty-m.y0)*e;MM.apply();if(t===1)MM.motion=null;
    } else if (!MM.drag && (Math.abs(MM.vx)>2 || Math.abs(MM.vy)>2)) {
      const decay=Math.exp(-7*dt),x=MM.x,y=MM.y;
      MM.x+=MM.vx*(1-decay)/7;MM.y+=MM.vy*(1-decay)/7;MM.vx*=decay;MM.vy*=decay;MM.apply();
      if(MM.x===x)MM.vx=0;if(MM.y===y)MM.vy=0;
    }
  };

  /* ---------- điểm chạm ---------- */
  function buildHotspots() {
    let h = '';
    C.shops.forEach((s) => { h += `<button class="hs shop" data-hs="shop" data-id="${s.id}" style="left:${s.map[0]}px;top:${s.map[1]}px"><span class="hs-pin"><i>${s.icon}</i></span><span class="hs-name">${esc(s.short)}</span><b class="hs-q" hidden></b></button>`; });
    C.npcs.forEach((n) => { h += `<button class="hs npc ${n.kind}" data-hs="npc" data-id="${n.id}" style="left:${n.at[0]}px;top:${n.at[1]}px"><span class="hs-pin"><i>${n.avatar}</i></span><span class="hs-name">${esc(n.kind === 'supply' ? 'Nhập hàng' : n.name)}</span></button>`; });
    $('#hs').innerHTML = h;
  }
  function buildWalkers() {
    if(window.LivingMarket)window.LivingMarket.buildWalkers();
  }
  MM.refresh = function () {
    $$('.hs.shop').forEach((b) => {
      const id = b.dataset.id, st = G.S.shops[id], ws = window.WS && window.WS.state();
      b.classList.toggle('locked', !st.unlocked); b.classList.toggle('live', !!(ws && ws.shop === id));
      const q = $('.hs-q', b); const n = ws && ws.shop === id ? ws.orders.filter((o) => o.status === 'wait').length : 0; q.hidden = !n; q.textContent = n;
      b.querySelector('.hs-pin i').textContent = st.unlocked ? G.shopDef(id).icon : '🔒';
    });
    const un = C.shops.filter((s) => G.S.shops[s.id].unlocked).length;
    if (MM.lastUn !== un) { MM.lastUn = un; buildWalkers(); }
    const ch = G.chapterDef(), el = $('#mapChap'); const ws0 = window.WS && window.WS.state();
    let html = ch ? `<b>📜 Chương ${ch.id}</b> <span>${esc(ch.title)}</span><small>${esc(ch.goal)} · ${esc(ch.prog(G.S))}</small>` : '<b>🏮 Chợ lên đèn</b><small>Bạn đã hoàn thành mọi chương. Tiếp tục kinh doanh dài hạn!</small>';
    if (ws0) html += `<button class="resume" data-m="resume">▶ Tiếp tục ca ở ${esc(G.shopDef(ws0.shop).short)}</button>`;
    if (el && el._h !== html) { el._h = html; el.innerHTML = html; }
  };
  const $$ = (q, r) => Array.from((r || document).querySelectorAll(q));

  /* ---------- thẻ thông tin ---------- */
  MM.showCard = function (kind, id) {
    const card = $('#mapCard'); card.hidden = false;
    if (kind === 'shop') {
      const d = G.shopDef(id), st = G.S.shops[id], ws = window.WS.state(); MM.sel = { id };
      if (!st.unlocked) {
        card.innerHTML = `<button class="x" data-m="close">✕</button><div class="mc-h"><span class="mc-i">🔒</span><div><b>${esc(d.name)}</b><small>Chưa khai trương · ${esc(d.short)}</small></div></div><p>${esc(d.desc)}</p>
          <div class="mc-b"><button class="btn gold" data-m="buy" data-id="${id}" ${G.S.coins >= d.unlock ? '' : 'disabled'}>Mở quầy ${G.fmt(d.unlock)} ${window.Art.coin(14)}</button></div><small class="mc-need">${G.S.coins >= d.unlock ? 'Mua xong, thợ dựng biển, đèn bật sáng.' : `Cần thêm ${G.fmt(d.unlock - G.S.coins)} xu`}</small>`;
      } else {
        const q = ws && ws.shop === id ? ws.orders.filter((o) => o.status === 'wait').length : 0;
        card.innerHTML = `<button class="x" data-m="close">✕</button><div class="mc-h"><span class="mc-i">${d.icon}</span><div><b>${esc(d.name)}</b><small>Cấp ${st.level} · ${st.staff ? 'Tiểu nhị ' + st.staff : 'Chưa thuê tiểu nhị'}${q ? ' · ' + q + ' khách chờ' : ''}</small></div></div><p>${esc(d.desc)}</p>
          <div class="mc-b"><button class="btn gold" data-m="enter" data-id="${id}">${ws && ws.shop === id ? '▶ Tiếp tục ca' : 'Vào quầy'}</button><button class="btn ghost" data-m="up" data-id="${id}">Nâng cấp ${G.fmt(G.upgradeCost(id))}</button></div>`;
      }
    } else {
      const n = C.npcs.find((x) => x.id === id);
      if (n.kind === 'supply') {
        const open = C.shops.filter((s) => G.S.shops[s.id].unlocked);
        card.innerHTML = `<button class="x" data-m="close">✕</button><div class="mc-h"><span class="mc-i">🧺</span><div><b>Nhập hàng</b><small>${esc(n.role)}</small></div></div><p>Chọn quầy để nhập nguyên liệu và vật tư.</p><div class="mc-b wrap">${open.map((s) => `<button class="btn ghost" data-m="stock" data-id="${s.id}">${s.icon} ${esc(s.short)}</button>`).join('')}</div>`;
      } else if (n.kind === 'gate') {
        card.innerHTML = `<button class="x" data-m="close">✕</button><div class="mc-h"><span class="mc-i">🏮</span><div><b>Cổng Chợ Làng Cổ</b><small>Bảng sự kiện</small></div></div><p>Mỗi ca bán có thể gặp <b>giờ đông khách</b>. Quầy có trang bị mới đủ năng lực phục vụ. Hoàn thành các chương để chợ lên đèn.</p>`;
      } else card.innerHTML = `<button class="x" data-m="close">✕</button><div class="mc-h"><span class="mc-i">${n.avatar}</span><div><b>${esc(n.name)}</b><small>${esc(n.role)}</small></div></div><p>${esc(MM.npcLine(n))}</p><small class="mc-need">Quan hệ: ${'❤'.repeat(G.S.rel[n.id] || 0)}${'♡'.repeat(5 - (G.S.rel[n.id] || 0))}</small>`;
    }
    $$('.hs.shop',MM.el).forEach(b=>{const selected=kind==='shop'&&b.dataset.id===id;b.classList.toggle('selected',selected);b.setAttribute('aria-pressed',selected);});
    sfx('click'); window.Game.buzz(8);
  };
  MM.npcLine = function (n) {
    const ch = G.chapterDef(), id = ch ? ch.id : 7;
    const L = {
      batu: ['“Có tay nghề thì chẳng lo đói. Thử rót cho lão bá một bát xem nào.”', '“Trà sữa à? Món lạ của người phương xa. Ta nếm thử nhé.”', '“Bánh mì nóng thì phải kẹp lúc còn giòn.”', '“Hội làng sắp tới, giúp ta mẻ xôi ngũ sắc nhé.”', '“Mỳ cay bảy tầng? Ta già rồi, cấp 1 thôi.”', '“Cây đa phủ đèn thế này, ta vui lắm.”', '“Chợ này nhờ cháu mà sống lại.”'],
      tholo: ['“Ta làm khung ép nắp bằng gỗ và đồng. Có xu thì nâng cấp nhé.”', '“Máy ép càng nâng, cần hạ càng nhanh.”', '“Lò than cần chỉnh lại cho giữ ấm.”', '“Xửng hấp lớn hơn thì mẻ xôi nhiều hơn.”', '“Bếp mỳ cay cần chuông báo, ta làm cho cháu.”', '“Cầu đá sửa xong rồi đấy.”', '“Đồ nghề của cháu giờ ngang thợ cả.”'],
      hanmac: ['“Ta chưa dùng bữa sáng. Ít đường, đừng cay nhé.”', '“Trà hôm qua hơi ngọt. Hôm nay cho ta ít đường nhé.”', '“Bánh mì này vỏ giòn, ta sẽ viết thư pháp tặng quán.”', '“Xôi gấc đẹp lắm, ta vẽ lại.”', '“Cay cấp 3 là vừa với thư sinh.”', '“Đêm hoa đăng, ta viết câu đối nhé.”', '“Chọn chữ nào cho biển quán, tùy chưởng quầy.”'],
      duocsu: ['“Gian thảo mộc chưa khai trương. Hãy đợi nhé.”', '“Trà thảo mộc sẽ có sau.”', '“Khi năm quầy đủ đầy, ta mở gian.”', '“Hương thảo mộc cần mùa mưa.”', '“Ta chờ cháu ở cuối chương.”', '“Sắp rồi.”', '“Cảm ơn cháu đã tin ta.”'],
    };
    return (L[n.id] || ['…'])[Math.min(id, 7) - 1] || L[n.id][0];
  };

  /* ---------- sự kiện ---------- */
  function bind() {
    const el = MM.el;
    el.addEventListener('pointerdown', (e) => {
      if (e.button>0 || e.target.closest('.map-card,.map-ctl,.map-chap .resume,.market-dock,.map-mini')) return;
      MM.cancelMotion();
      MM.pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if(MM.pts.size===1){MM.suppressClick=false;MM.drag = { x: MM.x, y: MM.y, sx: e.clientX, sy: e.clientY, moved: false, pinch: null, lastX:e.clientX,lastY:e.clientY,time:e.timeStamp };}
      if (MM.pts.size === 2) {
        const [a,b]=Array.from(MM.pts.values()),r=el.getBoundingClientRect(),cx=(a.x+b.x)/2-r.left,cy=(a.y+b.y)/2-r.top;
        MM.drag.pinch={d:Math.max(1,Math.hypot(a.x-b.x,a.y-b.y)),s:MM.s,wx:(cx-MM.x)/MM.s,wy:(cy-MM.y)/MM.s};MM.drag.moved=true;
        MM.pts.forEach((_,id)=>{try{el.setPointerCapture(id);}catch(_){}});
      }
    });
    el.addEventListener('pointermove', (e) => {
      if (!MM.pts.has(e.pointerId) || !MM.drag) return;
      MM.pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (MM.pts.size === 2 && MM.drag.pinch) {
        const [a, b] = Array.from(MM.pts.values()), d = Math.hypot(a.x - b.x, a.y - b.y), r = el.getBoundingClientRect();
        const pinch=MM.drag.pinch;
        MM.s=Math.max(MM.min,Math.min(MM.max,pinch.s*d/pinch.d));
        MM.x=(a.x+b.x)/2-r.left-pinch.wx*MM.s;MM.y=(a.y+b.y)/2-r.top-pinch.wy*MM.s;
        MM.apply();return;
      }
      const dx = e.clientX - MM.drag.sx, dy = e.clientY - MM.drag.sy;
      if (!MM.drag.moved && Math.abs(dx) + Math.abs(dy) > 8) { MM.drag.moved = true; try { el.setPointerCapture(e.pointerId); } catch (er) { /* bỏ qua */ } }
      if (MM.drag.moved) {
        const drag=MM.drag,seconds=Math.max(.008,(e.timeStamp-drag.time)/1000);
        MM.vx=MM.vx*.35+(e.clientX-drag.lastX)/seconds*.65;MM.vy=MM.vy*.35+(e.clientY-drag.lastY)/seconds*.65;
        MM.x=drag.x+dx;MM.y=drag.y+dy;MM.apply();
        drag.lastX=e.clientX;drag.lastY=e.clientY;drag.time=e.timeStamp;
      }
    });
    const end = (e) => {
      if(!MM.pts.has(e.pointerId))return;
      const drag=MM.drag;MM.pts.delete(e.pointerId);
      if(drag?.moved)MM.suppressClick=true;
      if(MM.pts.size===1){const p=Array.from(MM.pts.values())[0];MM.drag={x:MM.x,y:MM.y,sx:p.x,sy:p.y,lastX:p.x,lastY:p.y,time:e.timeStamp,moved:true,pinch:null};MM.vx=MM.vy=0;}
      else if(!MM.pts.size){
        if(e.type==='pointercancel'||!drag?.moved||e.timeStamp-drag.time>90||document.body.classList.contains('reduce-motion'))MM.vx=MM.vy=0;
        MM.vx=Math.max(-1400,Math.min(1400,MM.vx));MM.vy=Math.max(-1400,Math.min(1400,MM.vy));MM.drag=null;
      }
      try{if(el.hasPointerCapture(e.pointerId))el.releasePointerCapture(e.pointerId);}catch(_){}
    };
    el.addEventListener('pointerup', end); el.addEventListener('pointercancel', end);
    window.addEventListener('pointerup',end,{signal:MM.events.signal});
    window.addEventListener('pointercancel',end,{signal:MM.events.signal});
    el.addEventListener('lostpointercapture',e=>{if(MM.pts.has(e.pointerId))end(e);});
    el.addEventListener('wheel', (e) => { if(e.target.closest('.map-card'))return;e.preventDefault(); const r = el.getBoundingClientRect(); MM.zoom(Math.exp(-Math.max(-100,Math.min(100,e.deltaY*(e.deltaMode===1?16:1)))*.002), e.clientX - r.left, e.clientY - r.top); }, { passive: false });
    el.addEventListener('keydown',e=>{
      if(e.target!==el)return;
      const keys={ArrowLeft:[80,0],ArrowRight:[-80,0],ArrowUp:[0,80],ArrowDown:[0,-80]};
      if(keys[e.key]){e.preventDefault();MM.cancelMotion();MM.x+=keys[e.key][0];MM.y+=keys[e.key][1];MM.apply();}
      else if(e.key==='+'||e.key==='='){e.preventDefault();MM.zoom(1.2);}
      else if(e.key==='-'){e.preventDefault();MM.zoom(1/1.2);}
      else if(e.key==='Home'){e.preventDefault();MM.overview();}
      else if(e.key==='Escape')$('#mapCard').hidden=true;
    });
    el.addEventListener('click', (e) => {
      window.Audio2.unlock();
      const hs = e.target.closest('.hs'), m = e.target.closest('[data-m]');
      if (hs) { if (e.detail!==0 && MM.suppressClick) { MM.suppressClick=false; return; } MM.showCard(hs.dataset.hs, hs.dataset.id); return; }
      if (!m) return;
      const a = m.dataset.m, id = m.dataset.id;
      if (a === 'zi') MM.zoom(1.25); else if (a === 'zo') MM.zoom(0.8);
      else if (a === 'overview') MM.overview();
      else if (a === 'minimap') { if(!e.detail)MM.overview();else{const r=m.getBoundingClientRect(),x=(e.clientX-r.left-m.clientLeft)/m.clientWidth,y=(e.clientY-r.top-m.clientTop)/m.clientHeight;MM.focus(Math.max(0,Math.min(1,x))*MM.W,Math.max(0,Math.min(1,y))*MM.H,true);} }
      else if (a === 'home') { const sid = (MM.sel && MM.sel.id) || 'trada'; MM.focus(...G.shopDef(sid).map, true); }
      else if (a === 'find') MM.findMenu();
      else if (a === 'close') $('#mapCard').hidden = true;
      else if (a === 'buy') { if (G.buyShop(id)) { sfx('levelup'); G.buzz([30, 40, 60]); MM.showCard('shop', id); } else sfx('error'); }
      else if (a === 'enter') { $('#mapCard').hidden = true; window.WUI.open(id); }
      else if (a === 'up') { if (G.upgrade(id)) MM.showCard('shop', id); else { sfx('error'); window.UI.toast('Chưa đủ xu để nâng cấp.', 'err'); } }
      else if (a === 'stock') { $('#mapCard').hidden = true; window.WUI.restock(id); }
      else if (a === 'resume') { const ws = window.WS.state(); if (ws) window.WUI.open(ws.shop); }
      else if (a === 'go') { $('#mapCard').hidden = true; MM.focus(...G.shopDef(id).map, true); MM.showCard('shop', id); }
    });
    window.addEventListener('blur',()=>{MM.pts.clear();MM.drag=null;MM.cancelMotion();},{signal:MM.events.signal});
    document.addEventListener('visibilitychange',()=>{if(document.hidden){MM.pts.clear();MM.drag=null;MM.cancelMotion();}},{signal:MM.events.signal});
  }
  MM.findMenu = function () {
    const card = $('#mapCard'); card.hidden = false;
    card.innerHTML = `<button class="x" data-m="close">✕</button><div class="mc-h"><span class="mc-i">🔎</span><div><b>Tìm quầy</b><small>Chạm để di chuyển camera</small></div></div><div class="mc-b wrap">${C.shops.map((s) => `<button class="btn ghost" data-m="go" data-id="${s.id}">${G.S.shops[s.id].unlocked ? s.icon : '🔒'} ${esc(s.short)}</button>`).join('')}</div>`;
  };
})();
