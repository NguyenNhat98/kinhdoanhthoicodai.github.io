/* ============================================================================
   PHÁT TRIỂN: nơi tiêu tiền đa dạng, mọi thứ đều có tác dụng thật lên ca bán.
   Tab "Phát triển" gồm 4 mục:
   1) Trang bị  – danh sách nâng cấp theo từng quầy (C0–C3), thêm 5 hạng mục cơ sở vật chất mới.
   2) Trang trí – đồ trang trí cho từng quầy và cho cả Chợ làng (mua bằng xu, vài món cao cấp bằng nguyên bảo).
   3) Nhân viên – 9 vị trí có tên, lương theo ngày, điều kiện mở, cho nghỉ / thuê lại, xem chi tiết.
   4) Dịch vụ   – chi tiêu theo ca (tờ rơi, gánh hát, mời trà, đại tiệc) và quyên góp xây đình để tăng uy tín.
   Hiệu quả cộng dồn vào: giá món, tiền thưởng, kiên nhẫn khách, tần suất khách, tốc độ thao tác, uy tín, tự nhập hàng.
   ========================================================================== */
(function () {
  'use strict';
  const G = window.Game, C = window.CFG, WS = window.WS, UI = window.UI, Art = window.Art;
  const $ = (q, r) => (r || document).querySelector(q);
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const D = window.Dev = { tab: 'equip', shop: 'trada', open: {} };
  const shopDef = (id) => G.shopDef(id);
  const flags = () => G.S.flags;
  const sub = (k) => { const f = flags(); if (!f[k]) f[k] = {}; return f[k]; };

  /* ======================== 1. TRANG BỊ MỚI (cơ sở vật chất) ======================== */
  const NEWEQ = [
    { id: 'ban', name: 'Bàn ghế cho khách ngồi', k: 1.3, icon: '🪑', tiers: ['Khách chờ thoải mái: +2 giây kiên nhẫn', '+4 giây kiên nhẫn', '+7 giây kiên nhẫn, khách ngồi lâu hơn'] },
    { id: 'led', name: 'Biển hiệu đèn LED', k: 1.2, icon: '💡', tiers: ['Thu hút thêm 6% khách', 'Thu hút thêm 12% khách', 'Thu hút thêm 18% khách'] },
    { id: 'mascot', name: 'Mascot quán', k: 1.4, icon: '🐻', tiers: ['Thêm 5% khách', 'Thêm 10% khách', 'Thêm 15% khách'] },
    { id: 'qc', name: 'Quảng cáo mạng xã hội', k: 1.6, icon: '📱', tiers: ['Khách +5%, uy tín +1 mỗi ca', 'Khách +10%, uy tín +1 mỗi ca', 'Khách +16%, uy tín +2 mỗi ca'] },
    { id: 'nhan', name: 'Bộ nhận diện thương hiệu', k: 1.8, icon: '🏷️', tiers: ['Giá món +2%, tiền thưởng +5%', 'Giá món +4%, tiền thưởng +10%', 'Giá món +6%, tiền thưởng +15%'] }
  ];
  NEWEQ.forEach((e) => { if (!C.equip.common.some((x) => x.id === e.id)) C.equip.common.push(e); });
  const EQFX = {
    ban: (l) => ({ pat: [0, 2, 4, 7][l] }), led: (l) => ({ spawn: [0, .06, .12, .18][l] }), mascot: (l) => ({ spawn: [0, .05, .10, .15][l] }),
    qc: (l) => ({ spawn: [0, .05, .10, .16][l], rep: [0, 1, 1, 2][l] }), nhan: (l) => ({ price: [0, .02, .04, .06][l], tip: [0, .05, .10, .15][l] })
  };

  /* ======================== 2. TRANG TRÍ ======================== */
  const SLOTS = [
    { id: 'bang', mult: 4, lv: 1, icon: '🪧', fx: { tip: .08 }, desc: 'Tiền thưởng +8%' },
    { id: 'hoa', mult: 6, lv: 2, icon: '🪴', fx: { pat: 3 }, desc: 'Khách chờ lâu hơn +3 giây' },
    { id: 'den', mult: 9, lv: 3, icon: '🏮', fx: { spawn: .06 }, desc: 'Thu hút thêm 6% khách' },
    { id: 'ban', mult: 12, lv: 4, icon: '🪑', fx: { pat: 4, spawn: .03 }, desc: 'Kiên nhẫn +4 giây, khách +3%' },
    { id: 'tranh', mult: 16, lv: 5, icon: '🖼️', fx: { price: .03 }, desc: 'Giá món +3%' },
    { id: 'than', mult: 24, lv: 7, icon: '🧧', fx: { rep: 1, tip: .05 }, desc: 'Uy tín +1 mỗi ca, thưởng +5%' }
  ];
  const DNAME = {
    trada: ['Chuông gió gốc đa', 'Chậu trúc xanh', 'Đèn lồng treo cành đa', 'Bộ phản gỗ ngồi uống trà', 'Tranh thủy mặc ấm trà', 'Bàn thờ Thổ Địa'],
    trasua: ['Bảng gỗ viết tay thực đơn', 'Giàn hoa đào treo', 'Dây đèn pha lê', 'Ghế mây quây bàn tròn', 'Tranh thiếu nữ pha trà', 'Mèo thần tài vẫy tay'],
    banhmi: ['Biển gỗ khắc “Giòn tan”', 'Giỏ hoa cúc cạnh lò', 'Đèn dầu pha lê treo mái', 'Bộ bàn đá ghế đẩu', 'Tranh phố cổ', 'Ông địa mỉm cười'],
    xoi: ['Biển lá chuối cách điệu', 'Lẵng hoa sen', 'Đèn lồng ngũ sắc', 'Bàn tre chân thấp', 'Tranh ngũ sắc lễ hội', 'Tượng cô tiên xôi'],
    mycay: ['Biển lửa hồng sơn mài', 'Bình ớt khô treo vách', 'Đèn lồng đỏ xếp tầng', 'Bàn gỗ lim khắc rồng', 'Bức thư pháp “Cay”', 'Tượng Hỏa Thần']
  };
  const MARKET = [
    { id: 'm_cong', name: 'Cổng chào Chợ Cổ', icon: '⛩️', cost: 8000, fx: { spawn: .05 }, desc: 'Khách vào mọi quầy +5%' },
    { id: 'm_gieng', name: 'Giếng làng', icon: '⛲', cost: 20000, fx: { pat: 2 }, desc: 'Kiên nhẫn khách +2 giây ở mọi quầy' },
    { id: 'm_san', name: 'Sân khấu hát xẩm', icon: '🎭', cost: 55000, fx: { tip: .05 }, desc: 'Tiền thưởng +5% ở mọi quầy' },
    { id: 'm_hoa', name: 'Hàng rào hoa đào', icon: '🌸', cost: 140000, fx: { rep: 1 }, desc: 'Uy tín +1 mỗi ca' },
    { id: 'm_den', name: 'Đèn lồng dọc phố', icon: '🏮', cost: 400000, fx: { spawn: .04, tip: .03 }, desc: 'Khách +4%, thưởng +3%' },
    { id: 'm_dinh', name: 'Tượng Thành Hoàng', icon: '🗿', cost: 1200000, fx: { price: .03 }, desc: 'Giá món +3% ở mọi quầy' },
    { id: 'g_rong', name: 'Rồng vàng cuốn cột', icon: '🐉', gold: 8, fx: { price: .05, spawn: .05 }, desc: 'Cao cấp: giá món +5%, khách +5%' },
    { id: 'g_phuong', name: 'Phượng hoàng ngọc bích', icon: '🦚', gold: 15, fx: { tip: .12, rep: 2 }, desc: 'Cao cấp: thưởng +12%, uy tín +2 mỗi ca' },
    { id: 'g_kim', name: 'Bảo tháp kim quang', icon: '🏯', gold: 30, fx: { price: .08, spawn: .08, pat: 3 }, desc: 'Cao cấp: giá +8%, khách +8%, kiên nhẫn +3s' }
  ];
  const decorList = (scope) => scope === 'market' ? MARKET : SLOTS.map((s, i) => ({ id: scope + '_' + s.id, name: DNAME[scope][i], icon: s.icon, cost: Math.ceil(shopDef(scope).upBase * s.mult), lv: s.lv, fx: s.fx, desc: s.desc }));
  const decorOwned = (id) => !!(flags().decor && flags().decor[id]);

  /* ======================== 3. NHÂN VIÊN ======================== */
  const ROLES = [
    { id: 'phu', title: 'Thử việc chính thức', fee: 1, sal: .06, lv: 1, day: 1, fx: { speed: .10 }, desc: 'Phụ việc chân tay: mọi thao tác có thời gian chờ nhanh hơn 10%. Người mới nên bắt đầu từ đây, lương thấp.' },
    { id: 'thungan', title: 'Thu ngân', fee: 1.5, sal: .08, lv: 2, day: 2, fx: { pat: 6, tip: .10 }, desc: 'Niềm nở với khách xếp hàng: khách chờ thêm 6 giây và boa nhiều hơn 10%.' },
    { id: 'tapsu', title: 'Quản lý tập sự', fee: 2.5, sal: .12, lv: 3, day: 4, fx: { price: .04, tip: .10 }, conflict: 'quangia', desc: 'Giúp chủ quán bán khéo hơn: giá món +4%, tiền thưởng +10%. Không thể thuê cùng Quản gia.' },
    { id: 'dicho', title: 'Nhân viên đi chợ', fee: 2, sal: .10, lv: 3, day: 3, auto: true, desc: 'Khi một nguyên liệu hết giữa ca, tự chạy đi chợ mua một gói ngay (tốn thêm 15% phí chạy). Không còn cảnh đứng nhìn kho trống.' },
    { id: 'online', title: 'Nhân viên đơn online', fee: 3, sal: .14, lv: 4, day: 6, fx: { spawn: .08, tip: .06 }, needEq: ['ship', 1, 'Cần túi giao hàng'], desc: 'Chuyên chăm đơn đặt qua ứng dụng: khách +8%, thưởng +6%. Chỉ làm được khi quầy đã có Túi giao hàng.' },
    { id: 'mkt', title: 'Chuyên viên marketing', fee: 4, sal: .18, lv: 5, day: 10, fx: { spawn: .20, rep: 1 }, desc: 'Quay video quảng bá, chạy tờ rơi: khách +20% và uy tín +1 mỗi ca.' },
    { id: 'baove', title: 'Bảo vệ', fee: 3, sal: .16, lv: 5, day: 8, fx: { pat: 8, rep: 1 }, desc: 'Giữ trật tự hàng chờ: khách bớt cáu, chờ thêm 8 giây, uy tín +1 mỗi ca.' },
    { id: 'quangia', title: 'Quản gia', fee: 6, sal: .28, lv: 7, day: 14, fx: { price: .08, pat: 10, tip: .20 }, conflict: 'tapsu', desc: 'Cánh tay phải đắc lực: giá +8%, kiên nhẫn +10 giây, thưởng +20%. Không thể thuê cùng Quản lý tập sự.' },
    { id: 'dem', title: 'Sinh viên làm đêm', fee: 1.2, sal: .05, lv: 2, day: 5, fx: { speed: .06, spawn: .04 }, desc: 'Ca tối giá rẻ: thao tác nhanh hơn 6%, thu hút thêm 4% khách. Hay nhầm size nhưng rất chăm.' }
  ];
  const NAMES = ['Lâm Phước', 'Lý Gia Huy', 'Hoàng Minh', 'Đinh Nhân', 'Mai Thảo', 'Ngô Quân', 'Tạ Hương', 'Vũ Bình', 'Phan Lộc', 'Trịnh Đào', 'Bùi An', 'Lê Hạnh', 'Đỗ Khôi', 'Cao Linh', 'Dương Huy', 'Hà Thu', 'Võ Tín', 'Đặng Như', 'Chu Bảo', 'Kiều Oanh', 'Nguyễn Sơn', 'Thái Vy', 'Đoàn Kiệt', 'Lương Mai', 'Âu Thành', 'Tô Ngọc', 'Quách Đạt', 'Lại Xuân', 'Hồ Phát', 'Mạc Lan', 'Phùng Nam', 'Khổng Yến', 'Văn Hòa', 'Ung Trâm', 'Từ Long', 'Doãn Thy', 'Ông Tâm', 'Sầm Quyên', 'Giang Hải', 'La Diệu', 'Triệu Vũ', 'Lục Kim', 'Thạch Duy', 'Bạch Liên', 'Nông Phú'];
  const SHOPIDX = { trada: 0, trasua: 1, banhmi: 2, xoi: 3, mycay: 4 };
  const person = (shop, ri) => NAMES[(ri * 5 + SHOPIDX[shop]) % NAMES.length];
  const portrait = (shop, ri) => {
    const pool = (window.SPRITES || []).filter((a) => a.kind === 'portrait' && (a.id.indexOf(shop + '-') === 0 || (shop === 'trasua' && a.id.indexOf('trasua2-') === 0)));
    if (pool.length) return `assets/sprites/${pool[(ri + SHOPIDX[shop]) % pool.length].id}.png`;
    return `assets/sprites/trada-walker-${(ri * 2 + SHOPIDX[shop]) % 10}.png`;
  };
  const staffOf = (shop) => sub('staff')[shop] || (sub('staff')[shop] = {});
  const fee = (shop, r) => Math.ceil(shopDef(shop).staffBase * r.fee);
  const salary = (shop, r) => Math.max(1, Math.ceil(shopDef(shop).staffBase * r.sal * 0.8));
  const payroll = (shop) => ROLES.reduce((a, r) => a + (staffOf(shop)[r.id] === 1 ? salary(shop, r) : 0), 0);
  function roleBlock(shop, r) {
    const st = G.S.shops[shop], mine = staffOf(shop);
    if (!st.unlocked) return 'Quầy chưa mở';
    if (st.level < r.lv) return `Cần quầy cấp ${r.lv}`;
    if (G.S.day < r.day) return `Mở ở ngày ${r.day}`;
    if (r.needEq && G.eqLv(shop, r.needEq[0]) < r.needEq[1]) return r.needEq[2];
    if (r.conflict && mine[r.conflict]) return `Không thuê cùng ${ROLES.find((x) => x.id === r.conflict).title}`;
    return '';
  }

  /* ======================== 4. DỊCH VỤ THEO CA ======================== */
  const SERVICES = [
    { id: 'flyer', name: 'Phát tờ rơi', icon: '📣', mult: 3, shifts: 1, fx: { spawn: .30 }, desc: 'Ca kế tiếp: khách đến nhiều hơn 30%' },
    { id: 'opera', name: 'Mời gánh hát', icon: '🎭', mult: 5, shifts: 1, fx: { tip: .50 }, desc: 'Ca kế tiếp: tiền thưởng +50%' },
    { id: 'tea', name: 'Mời khách ly trà', icon: '🍵', mult: 2.5, shifts: 1, fx: { pat: 8 }, desc: 'Ca kế tiếp: khách chờ thêm 8 giây' },
    { id: 'feast', name: 'Đại tiệc khai trương', icon: '🎉', mult: 10, shifts: 3, fx: { price: .10, spawn: .10 }, desc: '3 ca liền: giá món +10%, khách +10%' }
  ];
  const svcCost = (shop, s) => Math.ceil(shopDef(shop).upBase * s.mult);
  const svcLeft = (shop, id) => ((flags().svc || {})[shop] || {})[id] || 0;
  const donateCost = () => Math.ceil(300 * Math.pow(1.35, Math.floor(G.S.flags.donated || 0)));

  /* ======================== TỔNG HỢP HIỆU QUẢ ======================== */
  function fx(shop) {
    const o = { price: 0, tip: 0, pat: 0, spawn: 0, speed: 0, rep: 0 }, add = (f) => { if (f) Object.keys(f).forEach((k) => { o[k] += f[k]; }); };
    if (!G.S || !shop || !G.S.shops[shop]) return o;
    Object.keys(EQFX).forEach((id) => add(EQFX[id](G.eqLv(shop, id))));
    [].concat(decorList('market'), decorList(shop)).forEach((d) => { if (decorOwned(d.id)) add(d.fx); });
    ROLES.forEach((r) => { if (staffOf(shop)[r.id] === 1) add(r.fx); });
    const sv = (flags().svc || {})[shop] || {}; SERVICES.forEach((s) => { if (sv[s.id] > 0) add(s.fx); });
    return o;
  }
  D.fx = fx; D.payroll = payroll;
  const eqPrice = G.eqPrice, eqTip = G.eqTip, pb = G.patienceBonus;
  G.eqPrice = (id) => eqPrice(id) * (1 + fx(id).price);
  G.eqTip = (id) => eqTip(id) * (1 + fx(id).tip);
  G.patienceBonus = (id) => pb(id) + fx(id).pat;

  const cmd = WS.cmd;
  WS.cmd = function (name, arg) {
    const old = WS.state() && WS.state().busy, r = cmd.apply(this, arguments), s = WS.state();
    if (r && r.ok && s && s.busy && s.busy !== old) { const m = 1 - Math.min(.5, fx(s.shop).speed); s.busy.t *= m; s.busy.total *= m; }
    return r;
  };
  const tick = WS.tick;
  WS.tick = function (dt) {
    const s = WS.state(), oid = s && s.oid; tick.apply(this, arguments);
    if (!s || s !== WS.state()) return;
    if (s.oid !== oid) { const sp = fx(s.shop).spawn; if (sp > 0) s.nextSpawn /= (1 + sp); }
    if (!s.paused && staffOf(s.shop).dicho === 1) { s._dv = (s._dv || 0) + dt; if (s._dv >= 2) { s._dv = 0; autoShop(s); } }
  };
  function autoShop(s) {
    const items = C.items[s.shop].filter((i) => i.w > 0 && !i.batch && !i.reuse);
    for (const it of items) {
      if (G.stock(s.shop, it.id) > 0) continue;
      const cost = Math.ceil(G.packCost(s.shop, it.id) * 0.15);
      if (G.S.coins < G.packCost(s.shop, it.id) + cost) continue;
      if (G.buyPack(s.shop, it.id)) { G.S.coins -= cost; UI.toast(`🛒 Nhân viên đi chợ mua thêm ${it.name}`, 'ok'); window.Audio2.sfx('buy'); break; }
    }
  }
  G.on('shiftEnd', (sum) => {
    const shop = sum && sum.shop; if (!shop) return;
    const f = fx(shop); if (f.rep) G.S.rep += f.rep;
    // lương: trả theo ngày làm việc; thiếu tiền thì nhân viên tạm nghỉ
    const mine = staffOf(shop); let paid = 0, left = [];
    ROLES.forEach((r) => { if (mine[r.id] !== 1) return; const w = salary(shop, r); if (G.S.coins >= w) { G.S.coins -= w; paid += w; } else { mine[r.id] = 2; left.push(r.title); } });
    const sv = (flags().svc || {})[shop]; if (sv) Object.keys(sv).forEach((k) => { if (sv[k] > 0) sv[k]--; });
    if (paid) UI.toast(`💰 Đã trả lương nhân viên: −${G.fmt(paid)}`, 'ok');
    if (left.length) UI.toast(`⚠️ Thiếu tiền trả lương: ${left.join(', ')} nghỉ việc, vào Phát triển để thuê lại.`, 'err');
    G.save();
  });

  /* ======================== GIAO DIỆN ======================== */
  const coin = (n) => `${Art.coin(13)} ${G.fmt(n)}`;
  const SHOPCHIP = () => C.shops.map((s) => `<button class="dv-chip ${D.shop === s.id ? 'on' : ''}" data-dx="shop" data-id="${s.id}" ${G.S.shops[s.id].unlocked ? '' : 'disabled'}><i>${s.icon}</i>${esc(s.short)}</button>`).join('');
  function summary(shop) {
    const f = fx(shop), pc = (v) => (v ? '+' + Math.round(v * 100) + '%' : '—');
    return `<div class="dv-sum"><span title="Giá món">💰 ${pc(f.price)}</span><span title="Tiền thưởng">🎁 ${pc(f.tip)}</span><span title="Lượng khách">👥 ${pc(f.spawn)}</span><span title="Tốc độ thao tác">⚡ ${pc(f.speed)}</span><span title="Kiên nhẫn">⏳ ${f.pat ? '+' + f.pat + 's' : '—'}</span><span title="Uy tín mỗi ca">⭐ ${f.rep ? '+' + f.rep + '/ca' : '—'}</span></div>`;
  }
  function equipTab() {
    const id = D.shop, st = G.S.shops[id];
    const cards = G.eqList(id).map((e) => {
      const lv = G.eqLv(id, e.id), max = lv >= 3, need = G.eqNeed(id, e.id), cost = max ? 0 : G.eqCost(id, e.id), can = !max && st.level >= need, afford = G.S.coins >= cost;
      const now = lv ? e.tiers[lv - 1] : 'Chưa sở hữu', next = max ? '' : e.tiers[lv];
      return `<article class="dv-card ${max ? 'max' : ''}"><div class="dv-ic">${e.icon}</div><div class="dv-bd"><h4>${esc(e.name)} <em>C${lv}</em></h4><p class="dv-now">${esc(now)}</p>${max ? '' : `<p class="dv-next">▸ Bậc ${lv + 1}: ${esc(next)}</p>`}<div class="dv-bar">${[1, 2, 3].map((i) => `<i class="${i <= lv ? 'on' : ''}"></i>`).join('')}</div></div>
        <div class="dv-act">${max ? '<span class="dv-done">Đã tối đa</span>' : `<button class="btn gold sm" data-dx="eq" data-eq="${e.id}" ${can && afford ? '' : 'disabled'}>${can ? `Lên C${lv + 1}<small>${coin(cost)}</small>` : `Cần quầy cấp ${need}`}</button>`}</div></article>`;
    }).join('');
    return `<p class="dv-hint">Quầy <b>${esc(shopDef(id).short)}</b> cấp ${st.level}. Trang bị bậc 1/2/3 mở ở quầy cấp 1/3/5.</p>${summary(id)}<div class="dv-list">${cards}</div>`;
  }
  function decorCard(d, shop) {
    const own = decorOwned(d.id), st = shop ? G.S.shops[shop] : null, lvOk = !d.lv || (st && st.level >= d.lv), isGold = d.gold != null;
    const price = isGold ? `${Art.gold(13)} ${d.gold}` : coin(d.cost), afford = isGold ? G.S.gold >= d.gold : G.S.coins >= d.cost;
    return `<article class="dv-card ${own ? 'max' : ''}"><div class="dv-ic big">${d.icon}</div><div class="dv-bd"><h4>${esc(d.name)} ${isGold ? '<em class="gold">Cao cấp</em>' : ''}</h4><p class="dv-now">✨ ${esc(d.desc)}</p>${d.lv && !lvOk ? `<p class="dv-next">Cần quầy cấp ${d.lv}</p>` : ''}</div>
      <div class="dv-act">${own ? '<span class="dv-done">✔ Đã đặt</span>' : `<button class="btn gold sm" data-dx="decor" data-id="${d.id}" data-scope="${shop || 'market'}" ${lvOk && afford ? '' : 'disabled'}>Mua<small>${price}</small></button>`}</div></article>`;
  }
  function decorTab() {
    const scope = D.dscope || 'market';
    const chips = `<button class="dv-chip ${scope === 'market' ? 'on' : ''}" data-dx="dscope" data-id="market"><i>🏘️</i>Chợ làng</button>` + C.shops.map((s) => `<button class="dv-chip ${scope === s.id ? 'on' : ''}" data-dx="dscope" data-id="${s.id}" ${G.S.shops[s.id].unlocked ? '' : 'disabled'}><i>${s.icon}</i>${esc(s.short)}</button>`).join('');
    const list = decorList(scope), owned = list.filter((d) => decorOwned(d.id)).length;
    return `<h3 class="dv-h">🏡 Trang Trí & Nâng Cấp ${scope === 'market' ? 'Chợ Làng' : esc(shopDef(scope).short)}</h3><div class="dv-chips">${chips}</div><p class="dv-hint">Đã đặt <b>${owned}/${list.length}</b> món. Đồ trang trí hiện trên ảnh quầy và có tác dụng thật.</p>${scope === 'market' ? summaryMarket() : summary(scope)}<div class="dv-list">${list.map((d) => decorCard(d, scope === 'market' ? null : scope)).join('')}</div>`;
  }
  function summaryMarket() { return `<div class="dv-sum"><span>Chợ làng áp dụng cho <b>mọi quầy</b></span></div>`; }
  function staffTab() {
    const id = D.shop, mine = staffOf(id), def = shopDef(id);
    const hired = ROLES.filter((r) => mine[r.id] === 1), pool = ROLES.filter((r) => mine[r.id] !== 1);
    const card = (r) => {
      const ri = ROLES.indexOf(r), state = mine[r.id], block = state === 1 ? '' : roleBlock(id, r), key = id + r.id, open = D.open[key];
      const btn = state === 1 ? `<button class="btn ghost sm" data-dx="fire" data-role="${r.id}">Cho nghỉ</button>` : block ? `<span class="dv-block">${esc(block)}</span>` : `<button class="btn gold sm" data-dx="hire" data-role="${r.id}" ${G.S.coins >= fee(id, r) ? '' : 'disabled'}>${state === 2 ? 'Thuê lại' : 'Thuê'}<small>${coin(fee(id, r))}</small></button>`;
      const fxs = []; if (r.fx) Object.keys(r.fx).forEach((k) => { const v = r.fx[k]; fxs.push({ price: `Giá món +${Math.round(v * 100)}%`, tip: `Tiền thưởng +${Math.round(v * 100)}%`, pat: `Kiên nhẫn +${v}s`, spawn: `Khách +${Math.round(v * 100)}%`, speed: `Thao tác nhanh ${Math.round(v * 100)}%`, rep: `Uy tín +${v}/ca` }[k]); }); if (r.auto) fxs.push('Tự nhập hàng khi hết');
      return `<article class="dv-staff ${state === 1 ? 'on' : ''}"><div class="sf-top"><img src="${portrait(id, ri)}" alt=""><div class="sf-name"><b>${esc(person(id, ri))}</b><small>(${esc(r.title)})</small><div class="sf-st"><i class="${state === 1 ? 'ok' : ''}"></i>${state === 1 ? 'Đang làm' : state === 2 ? 'Đã nghỉ' : 'Chưa tuyển'}</div><div class="sf-pay">Lương ${G.fmt(salary(id, r))}/ngày</div></div><div class="sf-btn">${btn}</div></div>
        <button class="sf-more" data-dx="more" data-key="${key}">Xem chi tiết ${open ? '▴' : '▾'}</button>${open ? `<div class="sf-detail"><p>${esc(r.desc)}</p><ul>${fxs.map((t) => `<li>✨ ${esc(t)}</li>`).join('')}</ul><small>Phí thuê ${G.fmt(fee(id, r))} · Lương ${G.fmt(salary(id, r))}/ngày · Mở: quầy cấp ${r.lv}, ngày ${r.day}</small></div>` : ''}</article>`;
    };
    return `<p class="dv-hint">Quầy <b>${esc(def.short)}</b>. Lương trả sau mỗi ca (1 ca = 1 ngày). Tổng lương/ngày: <b>${coin(payroll(id))}</b>. Thiếu tiền lương nhân viên sẽ nghỉ việc.</p>${summary(id)}
      <h4 class="dv-sec">👥 Nhân viên của quầy (${hired.length})</h4>${hired.length ? hired.map(card).join('') : '<p class="dv-empty">Chưa có ai. Hãy tuyển nhân viên đầu tiên bên dưới.</p>'}
      <h4 class="dv-sec">➕ Tuyển thêm nhân viên mới (${pool.length})</h4>${pool.map(card).join('')}`;
  }
  function servicesTab() {
    const id = D.shop, sv = (flags().svc || {})[id] || {};
    const cards = SERVICES.map((s) => { const cost = svcCost(id, s), left = sv[s.id] || 0; return `<article class="dv-card"><div class="dv-ic big">${s.icon}</div><div class="dv-bd"><h4>${esc(s.name)} ${left ? `<em class="gold">Còn ${left} ca</em>` : ''}</h4><p class="dv-now">✨ ${esc(s.desc)}</p></div><div class="dv-act"><button class="btn gold sm" data-dx="svc" data-id="${s.id}" ${G.S.coins >= cost ? '' : 'disabled'}>${left ? 'Gia hạn' : 'Mua'}<small>${coin(cost)}</small></button></div></article>`; }).join('');
    return `<p class="dv-hint">Dịch vụ áp dụng cho quầy <b>${esc(shopDef(id).short)}</b>, tính theo ca bán.</p><div class="dv-list">${cards}
      <article class="dv-card"><div class="dv-ic big">🛕</div><div class="dv-bd"><h4>Quyên góp xây đình <em>${Math.floor(G.S.flags.donated || 0)} lần</em></h4><p class="dv-now">✨ Uy tín +3 vĩnh viễn (mỗi điểm uy tín tăng 0,5% giá món, tối đa 300). Giá tăng dần mỗi lần.</p></div><div class="dv-act"><button class="btn gold sm" data-dx="donate" ${G.S.coins >= donateCost() ? '' : 'disabled'}>Quyên góp<small>${coin(donateCost())}</small></button></div></article></div>`;
  }
  D.html = function () {
    const tabs = [['equip', '🛠️', 'Trang bị'], ['decor', '🏡', 'Trang trí'], ['staff', '👥', 'Nhân viên'], ['svc', '📣', 'Dịch vụ']];
    if (!G.S.shops[D.shop].unlocked) D.shop = 'trada';
    const needShop = D.tab !== 'decor';
    return `<section class="page dv-page"><div class="dv-head"><div><h2>🏗️ Phát Triển</h2><small>Dùng xu để nâng cấp, trang trí, tuyển người</small></div><div class="dv-money">${Art.coin(18)} <b>${G.fmt(G.S.coins)}</b><span>${Art.gold(14)} ${G.S.gold}</span></div></div>
      <div class="dv-tabs">${tabs.map(([k, i, l]) => `<button class="${D.tab === k ? 'on' : ''}" data-dx="tab" data-id="${k}"><i>${i}</i>${l}</button>`).join('')}</div>
      ${needShop ? `<div class="dv-chips">${SHOPCHIP()}</div>` : ''}
      <div class="dv-body">${D.tab === 'equip' ? equipTab() : D.tab === 'decor' ? decorTab() : D.tab === 'staff' ? staffTab() : servicesTab()}</div></section>`;
  };
  function rerender() { const v = $('#view'); if (!v || UI.page !== 'dev') return; const y = v.scrollTop; v.innerHTML = D.html(); v.scrollTop = y; }
  D.rerender = rerender;
  const showPage = UI.showPage;
  UI.showPage = function (p) { if (p === 'dev') { UI.page = 'dev'; document.querySelectorAll('#nav button').forEach((b) => b.classList.toggle('on', b.dataset.page === 'dev')); const v = $('#view'); v.classList.remove('is-map'); v.innerHTML = D.html(); v.scrollTop = 0; return; } return showPage.apply(this, arguments); };

  const fail = (m) => { window.Audio2.sfx('error'); UI.toast(m, 'err'); };
  const ok = (m, s) => { window.Audio2.sfx(s || 'buy'); G.buzz(15); if (m) UI.toast(m, 'ok'); G.save(); rerender(); UI.refresh && UI.refresh(); };
  document.addEventListener('click', (e) => {
    const b = e.target.closest('[data-dx]'); if (!b || UI.page !== 'dev') return;
    const a = b.dataset.dx, id = b.dataset.id;
    if (a === 'tab') { D.tab = id; rerender(); window.Audio2.sfx('click'); }
    else if (a === 'shop') { D.shop = id; rerender(); window.Audio2.sfx('click'); }
    else if (a === 'dscope') { D.dscope = id; rerender(); window.Audio2.sfx('click'); }
    else if (a === 'more') { D.open[b.dataset.key] = !D.open[b.dataset.key]; rerender(); }
    else if (a === 'eq') { if (G.eqBuy(D.shop, b.dataset.eq)) ok('Đã nâng cấp!', 'levelup'); else fail('Chưa đủ xu hoặc cấp quầy.'); }
    else if (a === 'decor') {
      const list = decorList(b.dataset.scope), d = list.find((x) => x.id === id); if (!d || decorOwned(id)) return;
      if (d.gold != null) { if (G.S.gold < d.gold) return fail('Chưa đủ nguyên bảo.'); G.S.gold -= d.gold; } else { if (G.S.coins < d.cost) return fail('Chưa đủ xu.'); G.S.coins -= d.cost; }
      (flags().decor = flags().decor || {})[id] = 1; ok(`Đã đặt “${d.name}”`, 'levelup'); UI.vfx && UI.vfx.burst(window.innerWidth / 2, window.innerHeight * .4);
    } else if (a === 'hire') {
      const r = ROLES.find((x) => x.id === b.dataset.role), sh = D.shop; if (!r || roleBlock(sh, r)) return fail('Chưa đủ điều kiện.');
      if (G.S.coins < fee(sh, r)) return fail('Chưa đủ xu.'); G.S.coins -= fee(sh, r); staffOf(sh)[r.id] = 1; ok(`${person(sh, ROLES.indexOf(r))} đã nhận việc!`, 'cheer');
    } else if (a === 'fire') { const r = ROLES.find((x) => x.id === b.dataset.role); staffOf(D.shop)[r.id] = 2; ok(`${person(D.shop, ROLES.indexOf(r))} được cho nghỉ.`, 'click'); }
    else if (a === 'svc') { const s = SERVICES.find((x) => x.id === id), cost = svcCost(D.shop, s); if (G.S.coins < cost) return fail('Chưa đủ xu.'); G.S.coins -= cost; const m = (flags().svc = flags().svc || {}); (m[D.shop] = m[D.shop] || {})[s.id] = (m[D.shop][s.id] || 0) + s.shifts; ok(`Đã mua “${s.name}”`); }
    else if (a === 'donate') { const c = donateCost(); if (G.S.coins < c) return fail('Chưa đủ xu.'); G.S.coins -= c; G.S.rep += 3; flags().donated = (flags().donated || 0) + 1; ok('Cảm ơn tấm lòng! Uy tín +3', 'cheer'); }
  });

  /* ======================== HIỂN THỊ TRÊN QUẦY ======================== */
  function stallDecor() {
    const st = $('#stall'), id = st && st.dataset.shop; if (!id || !$('.st-banner', st)) return;
    const old = $('.dv-deco', st); if (old) old.remove();
    const items = [].concat(decorList('market'), decorList(id)).filter((d) => decorOwned(d.id)).map((d) => d.icon), staff = ROLES.map((r, i) => [r, i]).filter(([r]) => staffOf(id)[r.id] === 1);
    if (!items.length && !staff.length) return;
    const h = `<div class="dv-deco" aria-hidden="true"><span class="dd-items">${items.slice(0, 8).map((i, k) => `<b style="--k:${k}">${i}</b>`).join('')}</span><span class="dd-staff">${staff.slice(0, 5).map(([r, i]) => `<img src="${portrait(id, i)}" alt="" title="${esc(person(id, i))}">`).join('')}</span></div>`;
    $('.st-banner', st).insertAdjacentHTML('beforeend', h);
  }
  const wr = window.WUI.render; window.WUI.render = function () {
    wr.apply(this, arguments); stallDecor();
    const tabs = $('#stall .desk-prep-tabs'); if (tabs && !tabs.querySelector('[data-dev-open]')) tabs.insertAdjacentHTML('beforeend', '<button data-dev-open="staff">🏗️ Phát triển</button>');
  };
  const wrp = window.WUI.renderAll; window.WUI.renderAll = function () { wrp.apply(this, arguments); };
  document.addEventListener('click', (e) => { const b = e.target.closest('[data-dev-open]'); if (!b) return; if (window.WUI.isOpen()) window.WUI.close(); D.tab = b.dataset.devOpen || 'equip'; if (window.WUI.shop) D.shop = window.WUI.shop; UI.showPage('dev'); });
})();
