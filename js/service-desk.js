(function () {
  'use strict';
  const G=window.Game, WS=window.WS, W=window.WUI, C=window.CFG;
  const D=window.ServiceDesk={stage:0,prepTab:'home',page:0,shop:null};
  const $=s=>document.querySelector(s), $$=s=>Array.from(document.querySelectorAll(s));
  const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const catalog=(window.SPRITES||[]).filter(a=>a.kind==='portrait');
  window.LivingMarket.customer=(id,shop)=>{
    const pool=catalog.filter(a=>a.id.startsWith(shop+'-')||shop==='trasua'&&a.id.startsWith('trasua2-'));
    const asset=pool.length?pool[Math.abs(id)%pool.length].id:'trada-walker-'+(Math.abs(id)%10);
    return `<img class="sprite customer-sprite" src="assets/sprites/${asset}.png" alt="" draggable="false" decoding="sync">`;
  };
  const upgrades=[
    {id:'precision',name:'Bộ dụng cụ chuẩn vị',k:1.8,icon:'🎯',tiers:['Vùng rót ±6%, nướng/trụng rộng +0,4s','Vùng rót ±7%, nướng/trụng rộng +0,8s','Vùng rót ±8%, nướng/trụng rộng +1,2s']},
    {id:'workflow',name:'Bàn phục vụ chuyên nghiệp',k:2.1,icon:'⚒️',tiers:['Thao tác có thời gian chờ nhanh hơn 12%','Thao tác có thời gian chờ nhanh hơn 24%','Thao tác có thời gian chờ nhanh hơn 36%']},
    {id:'hospitality',name:'Góc mời khách',k:1.6,icon:'🤝',tiers:['1 lần mời/ca, thêm 6s cho khách chờ','2 lần mời/ca, thêm 10s cho khách chờ','3 lần mời/ca, thêm 14s cho khách chờ']}
  ];
  upgrades.forEach(e=>{if(!C.equip.common.some(x=>x.id===e.id))C.equip.common.push(e);});
  const plans={
    trada:[['Bát & đá',[0,1]],['Rót & rửa',[2,3]]],
    trasua:[['Ly & topping',[0,1]],['Đường & đá',[4,5]],['Trà & sữa',[2,3]],['Hoàn thiện',[6]]],
    banhmi:[['Lò & bánh',[0,1]],['Thêm nhân',[2]],['Gói bánh',[3]]],
    xoi:[['Chọn xôi',[0,1]],['Đơm xôi',[2]],['Màu & nhân',[]],['Gói xôi',[]]],
    mycay:[['Trụng mì',[0,1]],['Nước & nhân',[2,3]],['Nêm & giao',[4]]]
  };
  const modes={classic:['Bán thường','Thực hành công thức, quản lý kho và khách.'],signature:['Chuỗi chuẩn vị','5 đơn hoàn hảo liên tiếp: thưởng một đơn cơ bản/ca.'],rush:['Ca nhộn nhịp','Khách đến nhanh hơn 20%, mỗi món được thêm 15% tiền.']};
  const policy=id=>{const key=G.S.flags.deskPolicies?.[id];return modes[key]?key:'classic';};
  const start=WS.start;
  WS.start=function(id){const r=start(id);if(r.ok){const s=WS.state();s.deskMode=s.tutorial?'classic':policy(id);s.deskRun=0;s.deskPrize=false;s.deskInvites=0;}return r;};
  const command=WS.cmd;
  WS.cmd=function(name,arg){const old=WS.state()?.busy,result=command(name,arg),s=WS.state();if(result.ok&&s?.busy&&s.busy!==old){const mult=1-.12*G.eqLv(s.shop,'workflow');s.busy.t*=mult;s.busy.total*=mult;}return result;};
  const tick=WS.tick;
  WS.tick=function(dt){const s=WS.state(),oid=s?.oid;tick(dt);if(s===WS.state()&&s&&s.oid!==oid&&s.deskMode==='rush')s.nextSpawn*=.8;};
  const eventMult=G.eventMult;
  G.eventMult=()=>eventMult()*(WS.state()?.deskMode==='rush'?1.15:1);
  ['banhmi','mycay'].forEach(id=>{const zone=window.R[id].zone;window.R[id].zone=function(s){const z=zone(s),bonus=.4*G.eqLv(id,'precision');if(Array.isArray(z))return[z[0],z[1]+bonus];return{gold:[z.gold[0],z.gold[1]+bonus],dark:z.dark+bonus};};});
  const band=window.R.util.band;
  window.R.util.band=ratio=>Math.abs(ratio-1)<=.05+.01*G.eqLv(WS.activeShop()||'trada','precision')?1:band(ratio);
  G.on('delivered',({grade})=>{
    const s=WS.state();if(!s||s.deskMode!=='signature'||s.deskPrize)return;
    s.deskRun=grade.perfect?(s.deskRun||0)+1:0;
    if(s.deskRun>=5){s.deskPrize=true;const reward=Math.round(G.baseOrderPrice(s.shop)*G.shopMult(s.shop));G.addCoins(reward);s.stats.revenue+=reward;G.save();window.UI.toast(`Chuỗi chuẩn vị: +${G.fmt(reward)} xu!`,'ok');}
  });
  function menu(html){const s=WS.state();if(s)WS.setPause('desk-menu',true);window.UI.modal(html,()=>{if(WS.state()===s&&s)WS.setPause('desk-menu',false);});}
  D.equipment=function(page=0){
    const id=W.shop;if(!id)return;const list=G.eqList(id),pages=Math.ceil(list.length/3);page=Math.max(0,Math.min(pages-1,page));
    menu(`<h3>⚒ Trang bị ${esc(G.shopDef(id).short)}</h3><p class="muted">Xu ${G.fmt(G.S.coins)} · quầy cấp ${G.S.shops[id].level}. Mua có hiệu lực ngay.</p><div class="desk-equipment">${list.slice(page*3,page*3+3).map(e=>{const lv=G.eqLv(id,e.id),cost=G.eqCost(id,e.id),need=G.eqNeed(id,e.id);return `<div class="desk-equip"><span>${e.icon}</span><div><b>${esc(e.name)} · ${lv}/3</b><small>${lv===3?'Đã tối đa':esc(e.tiers[lv])}</small><small>${lv===3?'':`Cần quầy cấp ${need}`}</small></div><button class="btn gold sm" data-desk="buy-equip" data-eq="${e.id}" data-page="${page}" ${lv>=3||G.S.coins<cost||G.S.shops[id].level<need?'disabled':''}>${lv===3?'✓':G.fmt(cost)}</button></div>`;}).join('')}</div><div class="desk-pager"><button data-desk="equipment" data-page="${page-1}" ${page===0?'disabled':''}>‹ Trước</button><span>${page+1}/${pages}</span><button data-desk="equipment" data-page="${page+1}" ${page===pages-1?'disabled':''}>Sau ›</button></div><button class="btn ghost" data-close>Quay lại quầy</button>`);
  };
  D.layout=function(){
    const st=$('#stall');if(!st||!W.shop)return;st.classList.add('service-desk');
    st.style.setProperty('--desk-scene',`url('../assets/scenes/hd/${W.shop}.jpg')`);
    if(D.shop!==W.shop){D.shop=W.shop;D.stage=0;D.prepTab='home';D.page=0;}
    const ws=WS.state();st.dataset.deskMode=ws?.deskMode||policy(W.shop);
    const tools=st.querySelector('.stall-tools');if(tools&&!tools.querySelector('[data-desk="equipment"]'))tools.insertAdjacentHTML('beforeend','<button data-desk="equipment" aria-label="Nâng cấp trang bị ngay trong ca">⚒ Trang bị</button>');
    const bench=st.querySelector('.st-bench');
    if(!bench){D.preparation();return;}
    let tabs=st.querySelector('.desk-tabs');if(!tabs){tabs=document.createElement('div');tabs.className='desk-tabs';tabs.setAttribute('role','tablist');bench.before(tabs);}
    const plan=plans[W.shop];D.stage=Math.min(D.stage,plan.length-1);
    const html=plan.map(([label],i)=>`<button role="tab" aria-selected="${D.stage===i}" data-desk="stage" data-stage="${i}" class="${D.stage===i?'on':''}"><b>${i+1}</b>${label}</button>`).join('');
    if(tabs.innerHTML!==html)tabs.innerHTML=html;
    const sections=Array.from(bench.querySelectorAll('.b-right>.sec'));
    sections.forEach((sec,i)=>{
      let stage=plan.findIndex(([,ids])=>ids.includes(i));
      if(W.shop==='xoi')stage=i<2?0:i===2?1:sec.querySelector('h5').textContent.includes('Gói')?3:2;
      sec.dataset.deskStage=stage;sec.hidden=stage!==D.stage;
    });
    const left=bench.querySelector('.b-left');
    if(left&&!left.querySelector('.desk-side'))left.insertAdjacentHTML('beforeend','<div class="desk-side"><button data-desk="invite">🤝 Mời khách</button><button data-desk="recipe">📜 Xem phiếu</button></div>');
    D.status();
  };
  D.status=function(){
    const s=WS.state();if(!s||!W.shop)return;
    const sub=$('[data-w-sub]');if(sub){const text=s.paused?'Tạm dừng':s.tutorial?'Học việc':s.deskMode==='signature'?`Chuỗi chuẩn ${s.deskRun||0}/5${s.deskPrize?' ✓':''}`:s.deskMode==='rush'?'Nhộn nhịp · thưởng +15%':'Đang đón khách';if(sub.textContent!==text)sub.textContent=text;}
    const invite=$('[data-desk="invite"]');if(invite){const lv=G.eqLv(s.shop,'hospitality'),left=Math.max(0,lv-(s.deskInvites||0));invite.disabled=!lv||!left||s.paused||!WS.waiting().length;invite.textContent=`🤝 Mời khách ${left}/${lv}`;}
  };
  D.preparation=function(){
    const prep=$('.st-prep');if(!prep)return;
    if(!prep.querySelector('.desk-prep-tabs'))prep.insertAdjacentHTML('afterbegin','<div class="desk-prep-tabs"><button data-desk="prep" data-tab="home">Mở cửa</button><button data-desk="prep" data-tab="stock">Kho hàng</button><button data-desk="prep" data-tab="equip">Nâng cấp</button></div>');
    if(!prep.querySelector('.desk-policy')){
      const box=document.createElement('div');box.className='desk-policy';box.innerHTML=`<label for="deskPolicy">Cách chơi ca kế tiếp</label><select id="deskPolicy" data-desk-policy>${Object.entries(modes).map(([key,[name]])=>`<option value="${key}" ${policy(W.shop)===key?'selected':''}>${name}</option>`).join('')}</select><p data-policy-info>${modes[policy(W.shop)][1]}</p><button data-live="guide">📖 Quy trình làm món</button>`;prep.querySelector('.pp-info')?.after(box);
    }
    const nodes=Array.from(prep.children),stock=prep.querySelector('[data-pp-stock]'),equip=prep.querySelector('.pp-eq');
    nodes.forEach(el=>{
      if(el.classList.contains('desk-prep-tabs')||el.classList.contains('desk-prep-pager'))return;
      el.hidden=D.prepTab==='home'?!el.matches('.pp-start,.pp-info,.desk-policy'):D.prepTab==='stock'?el!==stock:el!==equip;
    });
    $$('.desk-prep-tabs button').forEach(b=>b.classList.toggle('on',b.dataset.tab===D.prepTab));
    let pager=prep.querySelector('.desk-prep-pager');if(!pager){pager=document.createElement('div');pager.className='desk-prep-pager desk-pager';prep.appendChild(pager);}
    const rows=D.prepTab==='stock'?Array.from(stock?.children||[]):D.prepTab==='equip'?Array.from(equip?.children||[]):[];
    const size=D.prepTab==='stock'?6:3,pages=Math.max(1,Math.ceil(rows.length/size));D.page=Math.min(D.page,pages-1);
    rows.forEach((r,i)=>r.hidden=i<D.page*size||i>=(D.page+1)*size);
    pager.hidden=!rows.length;pager.innerHTML=`<button data-desk="prep-page" data-page="${D.page-1}" ${D.page===0?'disabled':''}>‹ Trước</button><span>${D.page+1}/${pages}</span><button data-desk="prep-page" data-page="${D.page+1}" ${D.page===pages-1?'disabled':''}>Sau ›</button>`;
    if(W.shop==='xoi'&&D.prepTab==='home'&&!prep.querySelector('[data-desk="steam"]'))prep.querySelector('.desk-policy')?.insertAdjacentHTML('beforeend','<button data-desk="steam">♨ Hấp mẻ xôi</button>');
  };
  const render=W.render,all=W.renderAll,update=W.update;
  W.render=function(){render.apply(this,arguments);D.layout();};
  W.renderAll=function(){all.apply(this,arguments);D.layout();};
  W.update=function(){update.apply(this,arguments);D.status();};
  document.addEventListener('click',e=>{
    if(!e.target.closest('#stall [data-fx="hint"]'))return;
    const hint=($('[data-w-hint]')?.textContent||'').toLowerCase();let best=null,length=0;
    $$('#stall .tr').forEach(b=>{const text=b.querySelector('span')?.textContent.toLowerCase();if(text&&text.length>length&&hint.includes(text)){best=b;length=text.length;}});
    if(best){const stage=best.closest('[data-desk-stage]')?.dataset.deskStage;if(stage!=null){D.stage=+stage;D.layout();}best.focus({preventScroll:true});best.classList.add('hint-glow');setTimeout(()=>best.classList.remove('hint-glow'),1800);}
    window.UI.toast(hint.replace('▸','').trim()||'Chọn khách để nhận đơn.');e.stopImmediatePropagation();
  },true);
  document.addEventListener('change',e=>{if(!e.target.matches('[data-desk-policy]'))return;const value=e.target.value;if(!modes[value])return;(G.S.flags.deskPolicies=G.S.flags.deskPolicies||{})[W.shop]=value;G.save();$('[data-policy-info]').textContent=modes[value][1];});
  document.addEventListener('click',e=>{
    const b=e.target.closest('[data-desk]');if(!b)return;const s=WS.state(),id=W.shop,action=b.dataset.desk;
    if(action==='stage'){if(s?.hold){WS.holdStop();$$('.pouring').forEach(el=>el.classList.remove('pouring'));}D.stage=+b.dataset.stage;D.layout();}
    else if(action==='equipment')D.equipment(+b.dataset.page||0);
    else if(action==='buy-equip'){if(G.eqBuy(id,b.dataset.eq)){window.Audio2.sfx('levelup');if(WS.state())W.renderAll();D.equipment(+b.dataset.page||0);}else window.UI.toast('Chưa đủ xu hoặc cấp quầy.','err');}
    else if(action==='prep'){D.prepTab=b.dataset.tab;D.page=0;D.preparation();}
    else if(action==='prep-page'){D.page=Math.max(0,+b.dataset.page);D.preparation();}
    else if(action==='recipe'&&s){const o=s.orders.find(o=>o.id===s.sel&&o.status==='wait');menu(`<h3>📜 Phiếu món</h3><p>${o?esc(window.R[id].chips(o.spec).join(' · ')):'Chạm một khách để chọn đơn.'}</p>${window.LivingMarket.prepGuide(id)}<button class="btn gold" data-close>Tiếp tục</button>`);}
    else if(action==='invite'&&s&&!s.paused){const lv=G.eqLv(id,'hospitality');if(!lv||(s.deskInvites||0)>=lv||!WS.waiting().length)return;s.deskInvites=(s.deskInvites||0)+1;const bonus=[0,6,10,14][lv];WS.waiting().forEach(o=>o.p=Math.min(o.max,o.p+bonus));G.save();window.UI.toast(`Đã mời khách nghỉ: +${bonus}s kiên nhẫn.`,'ok');}
    else if(action==='shelf'&&s)menu(`<h3>🗄 Khay ${s.shelf.length}/${G.shelfSlots(id)}</h3><button class="btn gold" data-desk="store">Cất món trên bàn</button>${s.shelf.map((p,i)=>`<button class="btn ghost" data-desk="shelf-deliver" data-index="${i}">Giao món trên khay #${i+1}</button>`).join('')}<button class="btn ghost" data-close>Đóng khay</button>`);
    else if(action==='store'){window.UI.closeModal();const r=WS.shelve();if(!r.ok)window.UI.toast(r.msg,'err');W.renderAll();}
    else if(action==='shelf-deliver'){window.UI.closeModal();W.delivering=true;W.shelfSrc=+b.dataset.index;W.renderAll();window.UI.toast('Chạm khách nhận món trên khay.');}
    else if(action==='steam')menu(`<h3>♨ Hấp mẻ xôi</h3>${['gac','nuong','dua'].concat(G.S.shops.xoi.level>=5?['ngusac']:[]).map(type=>`<button class="btn gold" data-desk="cook" data-type="${type}">${esc(window.R.xoi.BASES[type])} · ${G.stock('xoi','p_'+type)} phần chín</button>`).join('')}<p class="muted">Tối đa 2 mẻ cùng lúc; nếp trừ vào kho khi bắt đầu.</p><button class="btn ghost" data-close>Về chuẩn bị</button>`);
    else if(action==='cook'){const r=WS.cook(b.dataset.type);window.UI.toast(r.ok?'Đang hấp mẻ xôi…':r.msg,r.ok?'ok':'err');G.save();}
  });
})();
