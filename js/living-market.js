(function () {
  'use strict';
  const G = window.Game, C = window.CFG, L = window.LivingMarket = { walkers: [], time: 0 };
  const $ = (s) => document.querySelector(s);
  const img = (id, cls = '') => `<img class="sprite ${cls}" src="assets/sprites/${id}.png" alt="" draggable="false">`;
  L.customer = (id) => img('trada-walker-' + (id % 10), 'customer-sprite');
  const steps = {
    trada: ['Chọn khách và cỡ bát', 'Thêm đá theo đơn', 'Giữ ấm, rót đến vạch', 'Thêm mật nếu có', 'Giao đúng khách', 'Rửa bát để tái sử dụng'],
    trasua: ['Chọn ly M hoặc L', 'Múc topping đúng số phần', 'Chọn đường và đá trước khi rót để tính đúng dung tích', 'Rót đúng nền trà', 'Rót sữa đến vạch', 'Khuấy, ép nắp, thêm ống hút', 'Giao ly đúng khách'],
    banhmi: ['Chọn cỡ ổ bánh', 'Nướng đến vùng vàng', 'Lấy ra trước khi cháy', 'Rạch bánh, phết pate', 'Thêm nhân và rau theo đơn', 'Rưới sốt, đóng bánh', 'Gói giấy rồi giao'],
    xoi: ['Nhập nếp và hấp mẻ trước ca', 'Chọn đĩa hoặc lá chuối', 'Đơm đúng loại và số muỗng', 'Xếp đủ năm màu nếu được yêu cầu', 'Thêm topping theo phiếu', 'Gấp lá, buộc lạt hoặc thêm thìa', 'Giao và chuẩn bị mẻ kế tiếp'],
    mycay: ['Chọn cỡ tô', 'Trụng mì, vớt đúng lúc', 'Múc nước dùng đúng loại', 'Thêm thịt, rau và topping', 'Canh kim, chốt đúng cấp cay', 'Giao đúng khách; theo dõi thời gian chờ']
  };
  L.prepGuide = (id) => `<details class="recipe-guide" open><summary>📖 Quy trình ${G.shopDef(id).short}</summary><ol>${steps[id].map(s => `<li>${s}</li>`).join('')}</ol><p>Phiếu đơn là yêu cầu chính xác. Thao tác sai tiêu hao nguyên liệu; xem chất lượng và tiền thưởng sau khi giao.</p></details>`;
  L.stallTools = (id, ws) => `<div class="stall-tools"><button data-live="guide">📖 Công thức</button><button data-live="report">📊 Sổ ca</button>${ws ? '<button data-fx="hint">💡 Gợi ý</button><button data-live="door">🚪 Ngưng đón</button><button data-live="pause">⏸ Tạm dừng</button>' : '<button data-live="stock-all">🧺 Bổ sung kho</button><button data-live="settings">⚙ Cài đặt ca</button>'}</div><div class="shift-dashboard" ${ws ? '' : 'hidden'}><span data-live-revenue></span><span data-live-quality></span><span data-live-stock></span></div>`;
  function consult(html) {
    const ws = window.WS.state(); if (ws) window.WS.setPause('consult', true);
    window.UI.modal(html, () => { if (window.WS.state() === ws) window.WS.setPause('consult', false); });
  }
  L.updateStall = (ws) => {
    if (!ws) return;
    const stall = $('#stall');
    if (stall) { stall.dataset.cooking = !!(ws.product && (ws.product.inOven || ws.product.noodle === 'cooking')); stall.dataset.paused = ws.paused; }
    const texts = { '[data-live-revenue]': `🪙 ${G.fmt(ws.stats.revenue)} · ${ws.stats.served} đơn`, '[data-live-quality]': `✦ ${ws.stats.perfect} hoàn hảo`, '[data-live-stock]': `🧺 ${C.items[ws.shop].filter(i => i.w > 0 && G.stock(ws.shop, i.id) < 3).length} vật tư sắp hết` };
    Object.entries(texts).forEach(([q, t]) => { const e = $(q); if (e && e.textContent !== t) e.textContent = t; });
    const door = $('[data-live="door"]'), pause = $('[data-live="pause"]');
    if (door) { door.textContent = !ws.accepting ? '🚪 Hết giờ' : ws.doorOpen === false ? '🚪 Đón khách' : '🚪 Ngưng đón'; door.disabled = !ws.accepting; }
    if (pause) pause.textContent = ws.pauseWhy.manual ? '▶ Tiếp tục' : '⏸ Tạm dừng';
  };
  const options = {
    crowd: ['Người đi chợ', [[0, 'Vắng'], [6, 'Vừa'], [10, 'Nhộn nhịp'], [16, 'Hội đông']]],
    daylight: ['Ánh sáng', [[0, 'Theo ngày game'], [1, 'Ban ngày'], [2, 'Hoàng hôn'], [3, 'Đêm đèn lồng']]],
    weather: ['Thời tiết', [[0, 'Trời trong'], [1, 'Hoa đào rơi'], [2, 'Mưa nhẹ']]],
    quality: ['Hiệu ứng', [[0, 'Tiết kiệm pin'], [1, 'Vừa'], [2, 'Đầy đủ']]],
    textSize: ['Cỡ chữ', [[1, 'Tiêu chuẩn'], [1.12, 'Lớn'], [1.24, 'Rất lớn']]],
    contrast: ['Tăng tương phản', [[false, 'Tắt'], [true, 'Bật']]],
    hints: ['Gợi ý thao tác trên phiếu', [[true, 'Bật'], [false, 'Tắt']]],
    autoSelect: ['Tự chọn đơn khi bàn trống', [[false, 'Tắt'], [true, 'Bật']]],
    difficulty: ['Độ khó ca mới', [[0, 'Thong thả'], [1, 'Tiêu chuẩn'], [2, 'Thử thách']]],
    shiftLength: ['Thời lượng ca mới', [[120, '2 phút'], [240, '4 phút'], [360, '6 phút']]],
    autosave: ['Tự lưu mỗi', [[5, '5 giây'], [10, '10 giây'], [30, '30 giây']]]
  };
  L.settingsHtml = () => `<h3>🏮 Chợ & hiển thị</h3>${Object.entries(options).map(([key, [label, vals]], i) => `${i === 6 ? '<h3>🍵 Điều hành ca bán</h3>' : ''}<div class="set-row col"><label for="pref-${key}">${label}</label><select id="pref-${key}" data-pref="${key}">${vals.map(([v, text]) => `<option value="${v}" ${G.S.settings[key] === v ? 'selected' : ''}>${text}</option>`).join('')}</select></div>`).join('')}<p class="muted">Độ khó và thời lượng áp dụng từ ca kế tiếp. Giảm chuyển động sẽ dừng người đi chợ và hiệu ứng trang trí. Tiến trình lưu trên thiết bị này.</p>`;
  L.applySettings = () => {
    if (!G.S) return;
    const s = G.S.settings, b = document.body;
    b.dataset.quality = s.quality; b.dataset.hints = s.hints; b.dataset.contrast = s.contrast;
    b.style.setProperty('--text-scale', s.textSize);
    b.classList.toggle('reduce-motion', s.reduce || matchMedia('(prefers-reduced-motion: reduce)').matches);
    if(b.classList.contains('reduce-motion')){window.MM.cancelMotion();L.stopConversation();}
    b.dataset.light = s.daylight || [1, 2, 3][(G.S.day - 1) % 3]; b.dataset.weather = s.weather;
    if ($('#walkers')) L.buildWalkers();
  };
  // Road centerlines in map coordinates, connected only at shared junctions.
  // No shortcut through the banyan, shop roofs, counters or the canal.
  const world=window.MarketWorld, routes=L.routes=world.routes;
  L.isWalkable=world.isWalkable;
  const junctions=new Map(), edges=[];
  function node(p){const key=p.join(',');if(!junctions.has(key))junctions.set(key,{x:p[0],y:p[1],links:[]});return junctions.get(key);}
  routes.forEach(path=>path.slice(1).forEach((p,i)=>{const a=node(path[i]),b=node(p);a.links.push(b);b.links.push(a);edges.push([a,b]);}));
  L.junctions=Array.from(junctions.values());
  const random=w=>{w.seed=(Math.imul(w.seed,1664525)+1013904223)>>>0;return w.seed/4294967296;};
  L.buildWalkers = () => {
    const host = $('#walkers'); if (!host) return;
    const n = Math.max(0,Math.min(24,Number(G.S.settings.crowd)||0));
    if(L.host===host&&L.walkers.length===n)return;
    L.stopConversation();L.host=host;L.walkers = []; host.innerHTML = '';L.chatDue=5;
    const fragment=document.createDocumentFragment();
    for (let i = 0; i < n; i++) {
      const edge=edges[Math.floor(i*edges.length/Math.max(1,n))],a=edge[i%2],b=edge[1-i%2],t=.15+(i*.381966% .65);
      const e = document.createElement('span'); e.className = 'pedestrian';e.setAttribute('aria-hidden','true');
      e.innerHTML = `<span class="walker-shadow"></span><span class="walker-body"><span class="market-person" style="--person-x:${i%4*100/3}%;--person-y:${Math.floor(i%16/4)*100/3}%"></span></span>`;fragment.appendChild(e);
      const length=Math.hypot(b.x-a.x,b.y-a.y),hx=(b.x-a.x)/length,hy=(b.y-a.y)/length;
      L.walkers.push({el:e,body:e.querySelector('.walker-body'),sh:e.querySelector('.walker-shadow'),from:a,to:b,x:a.x+(b.x-a.x)*t-hy*8,y:a.y+(b.y-a.y)*t+hx*8,hx,hy,speed:21+i%5*2,vm:0,wait:i*.09,stride:i*1.7,seed:8731+i*391,face:b.x>=a.x?1:-1,phase:i*2,name:['Tiểu Đào','Hồng Nương','A Minh','Lão Bá','Bác Năm','Linh Chi','Chú Tín','Bé Sen','Cô Liên','Anh Tư','Thanh Mai','Bác Phúc','Ngọc Lan','Hàn Sinh','Bà Tú','Chú Bình'][i%16],chatCooldown:0});
    }
    host.appendChild(fragment);
    L.walkers.forEach(w => position(w, false));
  };
  function position(w, moving) {
    const depth=.75+w.y/6500,step=Math.abs(Math.sin(w.stride)),full=G.S.settings.quality>0;
    const bob=moving&&full?-step*.9:0,lean=moving&&full?Math.sin(w.stride)*.7:0;
    w.el.style.transform = `translate3d(${w.x.toFixed(1)}px,${w.y.toFixed(1)}px,0) scale(${depth.toFixed(3)})`;
    const z=Math.round(w.y);if(z!==w.z){w.z=z;w.el.style.zIndex=z;}
    w.body.style.transform=`translateY(${bob.toFixed(2)}px) rotate(${lean.toFixed(2)}deg) scaleX(${-w.face})`;
    w.sh.style.transform=`scaleX(${(1-step*.08).toFixed(2)})`;
  }
  // Follow arc length on a rounded lane, rather than repeatedly chasing a point
  // offset from the next junction. Incoming/outgoing tangents join continuously.
  function prepareLane(w) {
    const ex=w.to.x-w.from.x,ey=w.to.y-w.from.y,length=Math.hypot(ex,ey);
    if(!length)return null;
    const ux=ex/length,uy=ey/length,end={x:w.to.x-uy*8,y:w.to.y+ux*8};
    const span=Math.hypot(end.x-w.x,end.y-w.y),steps=Math.max(8,Math.ceil(span/3));
    for(const smoothing of [Math.min(10,span*.2),0]){
      const p1={x:w.x+(w.hx??ux)*smoothing,y:w.y+(w.hy??uy)*smoothing};
      const p2={x:end.x-ux*smoothing,y:end.y-uy*smoothing};
      const points=[{x:w.x,y:w.y,d:0}];let valid=world.isWalkable(w.x,w.y);
      for(let i=1;i<=steps;i++){
        const t=i/steps,q=1-t,x=q*q*q*w.x+3*q*q*t*p1.x+3*q*t*t*p2.x+t*t*t*end.x,y=q*q*q*w.y+3*q*q*t*p1.y+3*q*t*t*p2.y+t*t*t*end.y;
        const previous=points[points.length-1];points.push({x,y,d:previous.d+Math.hypot(x-previous.x,y-previous.y)});
        if(!world.isWalkable(x,y))valid=false;
      }
      if(valid)return {from:w.from,to:w.to,points,length:points[points.length-1].d,distance:0,cursor:0};
    }
    return null;
  }
  L.tick = (dt) => {
    if (!G.S || document.hidden || window.WUI.isOpen() || window.UI.page !== 'market' || document.body.classList.contains('reduce-motion')) return;
    // Simulate every animation frame. A 16 ms frame used to be discarded by the
    // 1/60 threshold, turning normal displays into visibly uneven 30 fps motion.
    dt=Math.min(.1,Math.max(0,dt));L.time+=dt;
    L.renderClock=(L.renderClock||0)+dt;
    const draw=G.S.settings.quality>0||L.renderClock>=1/24;
    if(draw)L.renderClock=0;
    const buckets=new Map();
    L.walkers.forEach(w=>{const k=`${Math.floor(w.x/48)},${Math.floor(w.y/48)}`;if(!buckets.has(k))buckets.set(k,[]);buckets.get(k).push(w);});
    const camera=window.MM,view=camera.view();
    L.tickConversation(dt);
    L.walkers.forEach(w => {
      if (!w.el.isConnected) return;
      if(!w.lane||w.lane.from!==w.from||w.lane.to!==w.to)w.lane=prepareLane(w);
      if(!w.lane){w.vm=0;continueWalker(w);return;}
      const lane=w.lane,dx=w.to.x-w.x,dy=w.to.y-w.y,distance=lane.length-lane.distance;
      let clearance=1;
      const bx=Math.floor(w.x/48),by=Math.floor(w.y/48);
      for(let xx=bx-1;xx<=bx+1;xx++)for(let yy=by-1;yy<=by+1;yy++)(buckets.get(`${xx},${yy}`)||[]).forEach(other=>{
        if(other===w||other.to!==w.to)return;
        const ox=other.x-w.x,oy=other.y-w.y,dist=Math.hypot(ox,oy);
        if(dist<30&&ox*dx+oy*dy>0)clearance=Math.min(clearance,Math.max(.15,(dist-10)/20));
      });
      w.chatCooldown=Math.max(0,w.chatCooldown-dt);
      const resting=w.wait>0||w.chatting;w.wait=Math.max(0,w.wait-dt);
      const goal=resting?0:w.speed*clearance*(distance<25&&w.to.links.length===1?.6:1);
      const previousSpeed=w.vm;w.vm+=(goal-w.vm)*(1-Math.exp(-5*dt));
      const travel=resting?0:Math.min(distance,(previousSpeed+w.vm)*.5*dt);
      if(travel>0){
        const nextDistance=lane.distance+travel;
        while(lane.cursor<lane.points.length-2&&lane.points[lane.cursor+1].d<nextDistance)lane.cursor++;
        const a=lane.points[lane.cursor],b=lane.points[lane.cursor+1],t=(nextDistance-a.d)/Math.max(.00001,b.d-a.d);
        const nx=a.x+(b.x-a.x)*t,ny=a.y+(b.y-a.y)*t;
        if(world.isWalkable(nx,ny)){
          lane.distance=nextDistance;const step=Math.hypot(nx-w.x,ny-w.y);
          if(step>.00001){w.hx=(nx-w.x)/step;w.hy=(ny-w.y)/step;}
          w.x=nx;w.y=ny;w.stride+=travel*.22;
          if(Math.abs(w.hx)>.28)w.face=w.hx>0?1:-1;
        }else w.vm=0;
      }
      if(!resting&&lane.length-lane.distance<.00001){
        const old=w.from;w.from=w.to;const next=w.from.links.filter(n=>n!==old);w.to=next.length?next[Math.floor(random(w)*next.length)]:old;
        w.lane=null;
        if(w.from.links.length===1)w.wait=.7+random(w)*1.2;
      }
      continueWalker(w,travel>.0001);
    });
    function continueWalker(w,moving=false){
      const sx=w.x*camera.s+camera.x,sy=w.y*camera.s+camera.y;
      const visible=sx>-80&&sx<view.w+80&&sy>-10&&sy<view.h+90;
      if(w.visible!==visible){w.visible=visible;w.el.style.visibility=visible?'visible':'hidden';}
      if(visible&&(draw||!w.painted)){position(w,moving);w.painted=true;}
    }
    L.updateChats();
  };
  L.dialogues=[
    ['Trà sữa hôm nay thơm ghê!','Ta gọi thêm trân châu nhé?'],
    ['Bánh mì vừa ra lò kìa!','Mua hai ổ mang về thôi.'],
    ['Sen dưới kênh nở đẹp quá!','Đi chậm thôi, ngắm thêm một lát.'],
    ['Xôi ngũ sắc còn nóng đấy!','Ta ghé mua một phần nhé.'],
    ['Chợ hôm nay đông vui thật!','Quầy nào cũng thơm, khó chọn quá!'],
    ['Hôm nay ăn mì cay cấp mấy?','Cấp một thôi, còn phải dạo chợ!'],
    ['Tối nay đi hội làng chứ?','Có chứ, hẹn nhau ở cổng nhé!'],
    ['Mang giỏ đi chợ mà sắp đầy rồi!','Chừa chỗ cho bánh mì nữa nhé!']
  ];
  L.stopConversation=()=>{
    if(L.conversation)L.conversation.people.forEach(w=>{w.chatting=false;w.chatCooldown=24;});
    L.conversation=null;const host=$('.market-chats');if(host)host.replaceChildren();
  };
  L.startConversation=(a,b,index=0)=>{
    const host=$('.market-chats');
    if(!host||L.conversation||a===b||!a?.el.isConnected||!b?.el.isConnected||Math.hypot(a.x-b.x,a.y-b.y)>100||!world.isWalkable(a.x,a.y)||!world.isWalkable(b.x,b.y)||document.body.classList.contains('reduce-motion'))return false;
    const line=L.dialogues[index%L.dialogues.length],people=[a,b],bubbles=[];
    people.forEach((person,i)=>{
      person.chatting=true;person.vm=0;person.face=(i===0?b.x-a.x:a.x-b.x)>=0?1:-1;
      const bubble=document.createElement('div');bubble.className='market-chat';
      const name=document.createElement('b'),text=document.createElement('span');name.textContent=person.name;text.textContent=line[i];
      bubble.append(name,text);host.appendChild(bubble);bubbles.push(bubble);
    });
    L.conversation={people,bubbles,elapsed:0};L.chatCount=(L.chatCount||0)+1;L.updateChats();return true;
  };
  L.tickConversation=dt=>{
    if(L.conversation){
      L.conversation.elapsed+=dt;
      if(L.conversation.elapsed>=7){L.stopConversation();L.chatDue=6;}
      return;
    }
    L.chatDue-=dt;if(L.chatDue>0)return;
    const camera=window.MM,view=camera.view();
    const crowd=L.walkers.filter(w=>{const x=w.x*camera.s+camera.x,y=w.y*camera.s+camera.y;return w.visible&&!w.chatCooldown&&!w.chatting&&x>20&&x<view.w-20&&y>170&&y<view.h-90;});
    for(let i=0;i<crowd.length;i++)for(let j=i+1;j<crowd.length;j++){
      const a=crowd[i],b=crowd[j],distance=Math.hypot(a.x-b.x,a.y-b.y);
      if(distance>22&&distance<90&&L.startConversation(a,b,(L.chatCount||0)%L.dialogues.length))return;
    }
    L.chatDue=1.5;
  };
  L.updateChats=()=>{
    const talk=L.conversation;if(!talk)return;
    const camera=window.MM,view=camera.view();
    talk.people.forEach((person,i)=>{
      const bubble=talk.bubbles[i],x=person.x*camera.s+camera.x,y=person.y*camera.s+camera.y;
      const onScreen=x>10&&x<view.w-10&&y>130&&y<view.h-70;
      // One speaker at a time keeps both lines readable even on narrow screens.
      bubble.hidden=!onScreen||(i===0?talk.elapsed>=3.1:talk.elapsed<3.1);
      const width=Math.min(172,view.w-24),left=Math.max(12,Math.min(view.w-width-12,x-width/2));
      const top=Math.max(145,Math.min(view.h-150,y-80*camera.s-(i===1?10:0)));
      bubble.style.width=width+'px';bubble.style.transform=`translate3d(${left.toFixed(1)}px,${top.toFixed(1)}px,0)`;
      bubble.style.setProperty('--tail-x',Math.max(12,Math.min(width-12,x-left))+'px');
    });
  };
  const mount = window.MM.mount;
  window.MM.mount = function (host) {
    mount(host);
    const stage = $('#mapStage');
    stage.insertAdjacentHTML('beforeend', `<div class="market-atmosphere" aria-hidden="true">${C.shops.map(s => `<span class="stall-steam" style="left:${s.map[0]}px;top:${s.map[1]-40}px"></span>`).join('')}${Array.from({length:18},(_,i)=>`<i class="weather-particle" style="left:${i * 5.7}%;--delay:-${i * .7}s;--speed:${3 + i % 4}s"></i>`).join('')}</div>`);
    $('#map').insertAdjacentHTML('beforeend', `<div class="market-heading"><small>PHỐ CHỢ • LÀNG CỔ</small><b>Một ngày ở chợ</b><span data-market-day></span></div><div class="market-dock"><button data-live="stalls">🏪 Các quầy</button><button data-live="festival">🪁 Hội làng</button><button data-dev-open="decor">🏗️ Phát triển</button><button data-live="stock-market">🧺 Nhập hàng</button></div>`);
    L.applySettings();
    window.MM.refresh();
  };
  const refresh = window.MM.refresh;
  window.MM.refresh = function () {
    refresh();
    if ($('#walkers') && L.host !== $('#walkers')) L.buildWalkers();
    const day = $('[data-market-day]'); if (day) day.textContent = `Ngày ${G.S.day} · ${['','Nắng trong','Hoàng hôn','Đêm hoa đăng'][Number(document.body.dataset.light) || 1]}`;
  };
  document.addEventListener('change', e => {
    const el = e.target.closest('[data-pref]'); if (!el) return;
    const key = el.dataset.pref, v = el.value === 'true' ? true : el.value === 'false' ? false : Number(el.value);
    if (!options[key] || !options[key][1].some(([n]) => n === v)) return;
    G.S.settings[key] = v; L.applySettings(); G.save(); window.UI.toast('Đã lưu cài đặt', 'ok');
  });
  document.addEventListener('click', e => {
    const b = e.target.closest('[data-live]'); if (!b) return;
    const action = b.dataset.live, ws = window.WS.state(), id = window.WUI.shop;
    if (action === 'festival') window.UI.showPage('festival');
    else if (action === 'stalls') window.MM.findMenu();
    else if (action === 'stock-market') { window.MM.showCard('npc', 'nl4'); }
    else if (action === 'settings') { window.WUI.close(); window.UI.showPage('settings'); }
    else if (action === 'guide') consult(`<h3>📖 ${G.shopDef(id).short}</h3>${L.prepGuide(id)}<button class="btn gold" data-close>Tiếp tục</button>`);
    else if (action === 'pause' && ws) { window.WS.setPause('manual', !ws.pauseWhy.manual); L.updateStall(ws); G.save(); }
    else if (action === 'door' && ws && ws.accepting) { ws.doorOpen = ws.doorOpen === false; L.updateStall(ws); G.save(); window.UI.toast(ws.doorOpen ? 'Đang đón khách mới' : 'Tạm ngưng đón khách; đồng hồ và đơn hiện tại vẫn tiếp tục.'); }
    else if (action === 'report') {
      const st = G.S.shops[id];
      consult(`<h3>📊 Sổ quầy ${G.shopDef(id).short}</h3><p>Tổng đã giao: <b>${st.served}</b> đơn · cấp ${st.level} · ${st.staff} tiểu nhị</p>${ws ? `<p>Ca này: ${ws.stats.served} đơn · ${ws.stats.perfect} hoàn hảo</p><p>Doanh thu ${G.fmt(ws.stats.revenue)} · Giá vốn món ${G.fmt(ws.stats.cost)} · Hao phí ${G.fmt(ws.stats.waste)} xu</p>` : '<p>Chưa mở ca mới.</p>'}<h4>Vật tư sắp hết (&lt; 3 phần)</h4><p>${C.items[id].filter(i => (i.w > 0 || i.reuse) && G.stock(id,i.id) < 3).map(i => `${i.name}: ${G.stock(id,i.id)}`).join(' · ') || 'Kho còn đủ.'}</p><button class="btn gold" data-close>Đóng sổ</button>`);
    } else if (action === 'stock-all' && id && !ws) {
      const needs = C.items[id].filter(i => (i.w > 0 || i.reuse) && G.stock(id,i.id) < Math.max(3, G.packSize(id,i.id)));
      const cost = needs.reduce((n,i) => n + G.packCost(id,i.id),0);
      window.UI.modal(`<h3>🧺 Bổ sung kho</h3><p>Mua một gói cho mỗi vật tư còn dưới mức một gói:</p><p>${needs.map(i => `${i.name} +${G.packSize(id,i.id)}`).join(' · ') || 'Kho đang đủ, chưa cần bổ sung.'}</p><p>Tổng: <b>${G.fmt(cost)} xu</b></p><button class="btn gold" data-live="confirm-stock" data-shop="${id}" ${!needs.length || G.S.coins < cost ? 'disabled' : ''}>Mua các gói trên</button> <button class="btn ghost" data-close>Đóng</button>`);
      L.restockQuote = { id, items: needs.map(i=>i.id), cost };
    } else if (action === 'confirm-stock') {
      const q = L.restockQuote; L.restockQuote = null;
      if (!q || q.id !== b.dataset.shop || G.S.coins < q.cost || window.WS.state()) return;
      q.items.forEach(item => G.buyPack(q.id,item)); window.UI.closeModal(); window.WUI.render();
    }
  });
  // Upgrade the actual ingredient controls; leave product SVGs for continuous fill/cook states.
  L.decorate = () => {
    const id = window.WUI.shop; if (!id) return;
    const byItem = {
      trada: { da: 'trasua-ice-cubes' },
      trasua: { tc_den:'trasua-pearl-black', quylinh:'trasua-grass-jelly', pudding:'trasua-pudding', hatsen:'trasua-lotus', da:'trasua-ice-cubes', sua_tuoi:'trasua-milk', sua_dac:'trasua-condensed', kem:'trasua-cream', duong_den:'trasua-brown-sugar' },
      banhmi: { pate:'banhmi-pate', xaxiu:'banhmi-char-siu', trung:'banhmi-egg', dua:'banhmi-pickle', rau:'banhmi-coriander', ot:'banhmi-chili-sauce' },
      xoi: { ga:'xoi-chicken', dau:'xoi-mung-bean', hanh:'xoi-fried-onion', dua:'xoi-coconut' },
      mycay: { thit:'mycay-beef', nam:'mycay-shiitake', rau:'mycay-mustard', trung:'mycay-egg' }
    };
    document.querySelectorAll('#stall .tr[data-arg],#stall .pp-item').forEach(el => {
      let item; if (el.dataset.arg) { const a=JSON.parse(el.dataset.arg); item=a.id; }
      else item=el.querySelector('[data-item]')?.dataset.item;
      const sprite = byItem[id]?.[item], target = el.querySelector('i,.pi-i');
      if (sprite && target && !target.querySelector('img')) target.innerHTML = img(sprite);
    });
  };
  const render = window.WUI.render, renderAll = window.WUI.renderAll;
  window.WUI.render = function () { render(); L.decorate(); };
  window.WUI.renderAll = function () { renderAll(); L.decorate(); };
  document.addEventListener('DOMContentLoaded', L.applySettings);
})();
