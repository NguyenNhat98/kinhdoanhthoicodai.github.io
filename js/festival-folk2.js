/* Hội làng (phần 5): 6 trò dân gian mới — Đánh đáo, Đánh quay, Câu cá, Giã bánh dày, Thả đỉa ba ba, Rước đèn ông sao.
   Có SVG riêng (GameArt / GameIcons), hiệu ứng mượt (transform, canvas), đủ hướng dẫn + nhóm trên sảnh. */
(function () {
  'use strict';
  const F = window.Festival, G = window.Game, FX = F.FX, H = F.H, GA = window.GameArt, GI = window.GameIcons;
  const $ = (q, r) => (r || document).querySelector(q);
  const { hud, setScore, comboTxt, shell, loop, track, clamp, rnd } = H;
  const reduce = () => document.body.classList.contains('reduce-motion');
  const sfx = (t) => window.Audio2.sfx(t);
  const grad = (id, a, b) => `<linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient>`;
  const SV = (body) => `<svg class="ga" viewBox="0 0 64 64" aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg">${body}</svg>`;

  /* ======================== SVG MỚI ======================== */
  const ART = {
    coin: `<defs>${grad('fc1', '#ffe27a', '#c8901a')}</defs><circle cx="32" cy="32" r="26" fill="url(#fc1)" stroke="#8a5a0a" stroke-width="3"/><circle cx="32" cy="32" r="21" fill="none" stroke="#fff3a0" stroke-width="1.6" opacity=".8"/><rect x="24" y="24" width="16" height="16" rx="2" fill="#5a3a10" stroke="#8a5a0a" stroke-width="2"/><path d="M12 22q4-8 12-10" stroke="#fff" stroke-width="2.4" fill="none" stroke-linecap="round" opacity=".7"/>`,
    top: `<defs>${grad('ft1', '#ff6a4a', '#b8201a')}${grad('ft2', '#ffe27a', '#e09a00')}</defs><path d="M32 60L26 44h12z" fill="#6a4a2a" stroke="#3a2418" stroke-width="2" stroke-linejoin="round"/><path d="M10 28q22-16 44 0-4 16-22 18Q14 44 10 28z" fill="url(#ft1)" stroke="#7a1a10" stroke-width="2.4" stroke-linejoin="round"/><path d="M14 31q18 8 36 0" stroke="url(#ft2)" stroke-width="4" fill="none" stroke-linecap="round"/><ellipse cx="32" cy="22" rx="16" ry="6" fill="#ff8a6a" stroke="#7a1a10" stroke-width="2"/><path d="M32 16V6" stroke="#6a4a2a" stroke-width="4" stroke-linecap="round"/><circle cx="32" cy="6" r="3.4" fill="#ffd54a" stroke="#a87a1a" stroke-width="1.4"/>`,
    fish: `<defs>${grad('ff1', '#ffb86a', '#e8601a')}</defs><path d="M6 32q12-18 30-10l16-8-4 18 4 18-16-8q-18 8-30-10z" fill="url(#ff1)" stroke="#8a3a0a" stroke-width="2.2" stroke-linejoin="round"/><circle cx="16" cy="28" r="3.2" fill="#fff" stroke="#2a1a08" stroke-width="1.2"/><circle cx="16.8" cy="28" r="1.4" fill="#2a1a08"/><path d="M26 22q4 10 0 20M34 24q3 8 0 16" stroke="#fff" stroke-width="1.8" opacity=".5" fill="none"/>`,
    fishbig: `<defs>${grad('ff2', '#8ad0ff', '#2a7ad8')}</defs><path d="M3 32q14-22 36-12l20-10-5 22 5 22-20-10q-22 10-36-12z" fill="url(#ff2)" stroke="#144a8a" stroke-width="2.4" stroke-linejoin="round"/><circle cx="14" cy="28" r="3.6" fill="#fff" stroke="#14264a" stroke-width="1.2"/><circle cx="15" cy="28" r="1.6" fill="#14264a"/><path d="M26 18q6 14 0 28M36 20q4 12 0 24" stroke="#fff" stroke-width="2" opacity=".5" fill="none"/><path d="M6 36q4 3 8 2" stroke="#144a8a" stroke-width="2" fill="none" stroke-linecap="round"/>`,
    carp: `<defs>${grad('ff3', '#ffd54a', '#e08a00')}</defs><path d="M4 32q14-20 32-10l22-10-6 20 6 20-22-10q-18 10-32-10z" fill="url(#ff3)" stroke="#8a5a00" stroke-width="2.4" stroke-linejoin="round"/><circle cx="14" cy="28" r="3.4" fill="#fff" stroke="#2a1a08" stroke-width="1.2"/><circle cx="14.8" cy="28" r="1.5" fill="#2a1a08"/><path d="M22 20q4 12 0 24M30 18q4 14 0 28M38 20q3 12 0 24" stroke="#fff3a0" stroke-width="2" opacity=".7" fill="none"/><path d="M6 34l-3 3M6 30l-3-3" stroke="#8a5a00" stroke-width="2" stroke-linecap="round"/>`,
    turtle: `<defs>${grad('fu1', '#7ad08a', '#2a8a4a')}</defs><ellipse cx="32" cy="38" rx="24" ry="18" fill="url(#fu1)" stroke="#146a2a" stroke-width="2.4"/><path d="M14 36h36M32 20v36M20 26l24 24M44 26L20 50" stroke="#146a2a" stroke-width="1.8" opacity=".5" fill="none"/><circle cx="54" cy="30" r="8" fill="#9ae0a0" stroke="#146a2a" stroke-width="2.2"/><circle cx="57" cy="28" r="1.8" fill="#2a1a08"/><path d="M52 34q3 2 5 0" stroke="#146a2a" stroke-width="1.6" fill="none"/><path d="M14 50l-6 8M44 52l4 8M20 54l-2 8M32 56v6" stroke="#2a8a4a" stroke-width="4.4" stroke-linecap="round"/><path d="M8 38l-5 3" stroke="#2a8a4a" stroke-width="3.4" stroke-linecap="round"/>`,
    pestle: `<defs>${grad('fp1', '#d0a060', '#8a5a2a')}</defs><path d="M26 4h12l2 34H24z" fill="url(#fp1)" stroke="#5a3a14" stroke-width="2.2" stroke-linejoin="round"/><ellipse cx="32" cy="4" rx="8" ry="3" fill="#b88a4a" stroke="#5a3a14" stroke-width="1.8"/><path d="M20 38h24q4 0 4 5t-4 5H20q-4 0-4-5t4-5z" fill="url(#fp1)" stroke="#5a3a14" stroke-width="2.2"/>`,
    mortar: `<defs>${grad('fm1', '#b8b0a0', '#6a6458')}</defs><path d="M6 24h52l-6 30q-1 6-8 6H20q-7 0-8-6z" fill="url(#fm1)" stroke="#3a3830" stroke-width="2.4" stroke-linejoin="round"/><ellipse cx="32" cy="24" rx="26" ry="8" fill="#8a8478" stroke="#3a3830" stroke-width="2.4"/><ellipse cx="32" cy="23" rx="20" ry="5.5" fill="#fff" stroke="#c8c0a8" stroke-width="1.6"/><path d="M14 40q18 8 36 0" stroke="#fff" stroke-width="2" opacity=".3" fill="none"/>`,
    daydough: `<ellipse cx="32" cy="40" rx="24" ry="14" fill="#fffaf0" stroke="#d8cfb8" stroke-width="2.4"/><ellipse cx="32" cy="36" rx="18" ry="9" fill="#fff" stroke="#e8e0cc" stroke-width="1.6"/><path d="M20 32q12-6 24 0" stroke="#e8e0cc" stroke-width="1.6" fill="none"/>`,
    starlantern: `<defs>${grad('fs1', '#ff6a4a', '#d8201a')}</defs><path d="M32 3l5 12 13-2-8 11 9 10-13 0-3 12-3-12-13 0 9-10-8-11 13 2z" fill="url(#fs1)" stroke="#8a1a10" stroke-width="2.2" stroke-linejoin="round"/><circle cx="32" cy="26" r="8" fill="#ffe27a" stroke="#c88a00" stroke-width="1.8"/><circle cx="32" cy="26" r="4" fill="#fff8d0"/><path d="M32 42v8M28 44l-3 8M36 44l3 8" stroke="#ffd54a" stroke-width="2.6" stroke-linecap="round"/><path d="M32 50v12" stroke="#8a5a2a" stroke-width="3.4" stroke-linecap="round"/>`,
    puddle: `<ellipse cx="32" cy="38" rx="28" ry="14" fill="#6aa8d8" stroke="#2a6aa8" stroke-width="2.4"/><ellipse cx="32" cy="36" rx="20" ry="8" fill="#9ad0f0" opacity=".8"/><path d="M18 36q6-4 12 0M34 40q6-3 12 0" stroke="#fff" stroke-width="2" fill="none" opacity=".8" stroke-linecap="round"/>`,
    rock: `<path d="M8 50l6-22 14-10 16 4 12 16-4 16z" fill="#a8a29a" stroke="#5a554c" stroke-width="2.4" stroke-linejoin="round"/><path d="M16 34l10-8 12 2M20 44l14-2" stroke="#fff" stroke-width="2" opacity=".5" stroke-linecap="round"/>`,
    rod: `<path d="M6 60L50 6" stroke="#8a5a2a" stroke-width="4.4" stroke-linecap="round"/><path d="M50 6q10 4 8 20" stroke="#fff" stroke-width="1.4" fill="none"/><circle cx="14" cy="52" r="5" fill="#c8c0b0" stroke="#5a554c" stroke-width="2"/>`,
    bobber: `<circle cx="32" cy="34" r="12" fill="#fff" stroke="#8a1a10" stroke-width="2.2"/><path d="M20 34a12 12 0 0 1 24 0z" fill="#e0301f"/><path d="M32 22V8" stroke="#6a4a2a" stroke-width="3" stroke-linecap="round"/>`
  };
  Object.keys(ART).forEach((k) => { GA.art[k] = SV(ART[k]); GA.img(k); });
  Object.keys(ART).forEach((k) => { if (!GI[k]) GI[k] = (s) => `<svg class="gi" viewBox="0 0 64 64" width="${s || 56}" height="${s || 56}" aria-hidden="true">${ART[k]}</svg>`; });
  /* icon sảnh riêng cho 6 trò */
  const ICO = {
    danhdao: `<defs>${grad('id1', '#d8b070', '#a07838')}</defs><ellipse cx="32" cy="46" rx="26" ry="12" fill="url(#id1)" stroke="#6a4a1a" stroke-width="2.4"/><ellipse cx="44" cy="44" rx="9" ry="4.4" fill="#2a1a08" stroke="#6a4a1a" stroke-width="1.8"/><circle cx="20" cy="22" r="11" fill="#ffd54a" stroke="#8a5a0a" stroke-width="2.4"/><rect x="15.5" y="17.5" width="9" height="9" rx="1.4" fill="#5a3a10"/><path d="M26 28q12 4 16 12" stroke="#fff" stroke-width="2.4" fill="none" stroke-dasharray="3 4" stroke-linecap="round"/>`,
    conquay: ART.top,
    cauca: `<path d="M4 54q8-5 14 0t14 0 14 0 14 0" stroke="#4aa2c8" stroke-width="3" fill="none" stroke-linecap="round"/>${ART.rod}<path d="M54 10q4 24-12 36" stroke="#fff" stroke-width="1.6" fill="none"/><g transform="translate(26 36) scale(.55)">${ART.carp}</g>`,
    giaday: `<g transform="translate(0 6)">${ART.mortar}</g><g transform="translate(12 -18) rotate(14 32 32)">${ART.pestle}</g>`,
    thadia: `<g transform="translate(-4 14) scale(.9)">${ART.turtle}</g><g transform="translate(26 -2) scale(.8)">${GA.art.boy2.replace(/<\/?svg[^>]*>/g, '')}</g>`,
    ruocden: ART.starlantern
  };
  Object.keys(ICO).forEach((k) => { GI[k] = (s) => `<svg class="gi" viewBox="0 0 64 64" width="${s || 56}" height="${s || 56}" aria-hidden="true">${ICO[k]}</svg>`; });
  GI.keys = Object.keys(GI).filter((k) => typeof GI[k] === 'function' && k !== 'keys');

  const pickRound = (a) => a[Math.floor(Math.random() * a.length)];
  const art = (n, cls) => `<span class="ga-host ${cls || ''}">${GA.art[n] || ''}</span>`;

  /* ======================================================================
     1. ĐÁNH ĐÁO — canh lực ném đồng xu vào lỗ
     ====================================================================== */
  F.EXTRA.danhdao = ['🪙', 'Đánh đáo', 'Canh lực ném đồng xu vào lỗ · 8 lần ném', 'Xu + nguyên liệu']; F.extra.danhdao = 1;
  F.GUIDES.danhdao = ['🪙 Đánh đáo', ['Kim lực chạy qua lại. Bấm “Ném!” để đồng xu bay đến đúng vị trí bạn canh.', 'Lỗ đáo ở xa hay gần tùy lần ném. Vào lỗ +6 điểm, sát lỗ +3, gần lỗ +1.', 'Có 8 lần ném. Vào lỗ liên tiếp tăng hệ số. Lỗ nhỏ dần ở các lượt sau.']];
  F.custom.danhdao = (r, host) => {
    Object.assign(r, { score: 0, combo: 0, best: 0, throws: 0, hole: 60, size: 9, state: 'aim', pw: 0, coins: [], landed: 0 });
    shell(host, 'danhdao', `<h3>🪙 Đánh đáo</h3>${hud(70, '<span id="ddN">Lần 1/8</span>')}<div class="dao-field" id="df2"><div class="dao-ground"></div><div class="dao-hole" id="dh"><i></i></div><div class="dao-kid">${art('boy3')}</div><div class="dao-coin" id="dc">${art('coin')}</div></div><div class="dao-meter"><i class="zone" id="dz"></i><b id="dp"></b></div><button class="btn gold big grab-btn" data-dao>🪙 Ném!</button>`);
    const df = $('#df2'), dh = $('#dh'), dc = $('#dc'), dp = $('#dp'), dz = $('#dz');
    const newHole = () => { r.hole = rnd(34, 86); r.size = Math.max(5.2, 10.5 - r.throws * .55); dh.style.bottom = r.hole + '%'; dh.style.setProperty('--w', (r.size * 3.4) + '%'); dh.style.transform = `translateX(-50%) scale(${.55 + (r.hole / 100) * .5})`; dz.style.left = clamp(r.hole - r.size, 0, 100) + '%'; dz.style.width = Math.min(100, r.size * 2) + '%'; };
    newHole(); let fly = null;
    const launch = () => {
      if (r.state !== 'aim' || r.done) return; r.state = 'fly'; r.throws++; const target = clamp(r.pw, 6, 94), t0 = r.t;
      fly = { t: 0, dur: .65, target, hit: null }; sfx('whoosh'); G.buzz(8);
    };
    r.toss = launch;
    r.end = () => F.finish(r, clamp(Math.round(r.score * .75), 0, 30), `Đánh đáo ${r.throws} lần, vào lỗ ${r.landed} lần (combo cao nhất ${r.best}).`);
    loop(r, (dt) => {
      if (r.state === 'aim') { r.pw = 50 + 50 * Math.sin(r.t * (2.1 + r.throws * .13)); dp.style.left = r.pw + '%'; dc.style.transform = 'translate(-50%, 0) scale(1)'; dc.style.bottom = '6%'; dc.style.opacity = 1; }
      else if (r.state === 'fly') {
        fly.t += dt; const p = clamp(fly.t / fly.dur, 0, 1), y = 6 + (fly.target - 6) * p, arc = Math.sin(p * Math.PI) * 24;
        dc.style.bottom = (y + arc) + '%'; dc.style.transform = `translate(-50%, 0) scale(${1 - p * .45}) rotate(${p * 720}deg)`;
        if (p >= 1) {
          const d = Math.abs(fly.target - r.hole); let pts = 0, txt = 'Trượt'; r.state = 'rest';
          if (d < r.size * .6) { pts = 6; txt = 'VÀO LỖ!'; r.landed++; r.combo++; sfx('levelup'); FX.confetti(14); } else if (d < r.size * 1.3) { pts = 3; txt = 'Sát lỗ'; r.combo = 0; sfx('coin'); } else if (d < r.size * 2.4) { pts = 1; txt = 'Gần lỗ'; r.combo = 0; sfx('tap'); } else { r.combo = 0; sfx('error'); }
          r.best = Math.max(r.best, r.combo); pts *= FX.mult(r); r.score += pts; setScore(r); comboTxt(r);
          const b = dc.getBoundingClientRect(); FX.fly(b.left + b.width / 2, b.top, pts ? `${txt} +${pts}` : txt, pts >= 6 ? 'big' : pts ? 'gold' : 'bad'); if (pts >= 6) FX.boom(b.left + b.width / 2, b.top, ['✨', '⭐', '🎊'], 8);
          dc.style.transform = `translate(-50%, 0) scale(${.55})`; if (pts >= 6) dc.style.opacity = 0;
          const n = $('#ddN'); if (n) n.textContent = `Lần ${Math.min(8, r.throws + 1)}/8`;
          if (r.throws >= 8) { r.timer = setTimeout(() => { r.over = true; }, 900); r.state = 'done'; }
          else r.timer = setTimeout(() => { newHole(); r.state = 'aim'; }, 900);
        }
      }
    }, 70);
  };
  document.addEventListener('pointerdown', (e) => { const r = F.run; if (r && !r.done && r.type === 'danhdao' && (e.target.closest('[data-dao]') || e.target.closest('#df2'))) { e.preventDefault(); r.toss(); } });

  /* ======================================================================
     2. ĐÁNH QUAY — quất roi đúng nhịp để con quay không ngã
     ====================================================================== */
  F.EXTRA.conquay = ['🌀', 'Đánh quay', 'Quất roi đúng nhịp, giữ con quay không ngã · 35 giây', 'Xu + nguyên liệu']; F.extra.conquay = 1;
  F.GUIDES.conquay = ['🌀 Đánh quay', ['Con quay quay chậm dần. Khi vòng sáng thu nhỏ chạm vòng vàng, bấm “Quất!”.', 'Quất đúng nhịp: Hoàn hảo +35 lực quay, Tốt +20. Quất lệch làm quay loạng choạng.', 'Quay càng nhanh điểm càng cao. Ngã 3 lần là hết ván. Quay ổn định lâu được thưởng combo.']];
  F.custom.conquay = (r, host) => {
    Object.assign(r, { score: 0, combo: 0, best: 0, spin: 60, lives: 3, ring: 0, ringT: 1.4, cool: 0, ang: 0, wob: 0, stable: 0, acc: 0, falling: 0 });
    shell(host, 'conquay', `<h3>🌀 Đánh quay</h3>${hud(35, '<span id="cqL">❤️❤️❤️</span>')}<div class="top-field" id="tf"><div class="top-floor"></div><div class="top-shadow" id="ts"></div><div class="top-body" id="tb">${art('top')}</div><div class="whip-ring" id="wr"><i></i><b></b></div><div class="top-spd"><i id="tsp"></i></div></div><button class="btn gold big grab-btn" data-whip>🪢 Quất!</button>`);
    const tb = $('#tb'), wr = $('#wr'), sp = $('#tsp'), tf = $('#tf'), ts = $('#ts'), lives = () => { const l = $('#cqL'); if (l) l.textContent = '❤️'.repeat(r.lives) + '🖤'.repeat(3 - r.lives); };
    r.whip = () => {
      if (r.done || r.cool > 0 || r.falling > 0) return; r.cool = .22; const d = Math.abs(r.ring - 1), b = tb.getBoundingClientRect();
      if (d < .1) { r.spin = Math.min(100, r.spin + 35); r.combo++; FX.fly(b.left + b.width / 2, b.top, 'HOÀN HẢO!', 'gold'); sfx('coin'); FX.boom(b.left + b.width / 2, b.top + b.height / 2, ['✨', '⭐'], 6); r.wob = 0; }
      else if (d < .3) { r.spin = Math.min(100, r.spin + 20); r.combo++; FX.fly(b.left + b.width / 2, b.top, 'Tốt', ''); sfx('tap'); r.wob = Math.max(0, r.wob - .3); }
      else { r.spin = Math.max(0, r.spin - 10); r.combo = 0; r.wob = 1; FX.fly(b.left + b.width / 2, b.top, 'Lệch!', 'bad'); sfx('error'); G.buzz(30); }
      r.best = Math.max(r.best, r.combo); comboTxt(r); tf.classList.remove('whipped'); void tf.offsetWidth; tf.classList.add('whipped'); r.ringT = rnd(1.0, 1.7); r.ring = 0;
    };
    r.end = () => F.finish(r, clamp(Math.round(r.score * .55), 0, 30), `Điểm quay ${Math.round(r.score)}, combo cao nhất ${r.best}, ngã ${3 - r.lives} lần.`);
    loop(r, (dt) => {
      r.cool -= dt;
      if (r.falling > 0) { r.falling -= dt; tb.style.transform = `translate(-50%, 0) rotate(${70 + r.falling * 20}deg) scale(.9)`; if (r.falling <= 0) { r.spin = 55; r.wob = 0; r.ring = 0; } return; }
      r.spin = Math.max(0, r.spin - (6 + r.t * .16) * dt); r.ring += dt / r.ringT; if (r.ring > 1.45) { r.ring = 0; r.ringT = rnd(1.0, 1.7); r.combo = 0; comboTxt(r); r.wob = Math.min(1, r.wob + .3); r.spin = Math.max(0, r.spin - 6); }
      r.wob = Math.max(0, r.wob - dt * .18);
      r.acc += r.spin * dt * .055 * (1 + Math.min(2, Math.floor(r.combo / 4)) * .5); if (r.acc >= 1) { r.score += Math.floor(r.acc); r.acc %= 1; setScore(r); }
      r.ang += r.spin * 12 * dt; const lean = (1 - r.spin / 100) * 20 + r.wob * 16, wob = Math.sin(r.t * (6 + (100 - r.spin) * .1)) * lean;
      tb.style.transform = `translate(-50%, 0) rotate(${wob}deg) scaleX(${.9 + .1 * Math.cos(r.ang * Math.PI / 90)})`; ts.style.transform = `translateX(-50%) scale(${.7 + r.spin / 220})`;
      wr.style.setProperty('--s', (1 + (1 - Math.min(1, r.ring)) * 1.6).toFixed(3)); wr.style.opacity = r.ring <= 1.3 ? 1 : 0;
      sp.style.width = r.spin + '%'; sp.className = r.spin < 25 ? 'low' : r.spin > 70 ? 'hi' : '';
      if (!reduce() && r.spin > 55 && Math.random() < dt * 8) { const s = document.createElement('i'); s.className = 'top-spark'; s.style.cssText = `left:${50 + rnd(-10, 10)}%;--dx:${rnd(-40, 40)}px`; tf.appendChild(s); setTimeout(() => s.remove(), 700); }
      if (r.spin <= 3) { r.lives--; lives(); r.combo = 0; comboTxt(r); r.falling = 1; FX.at(tb, 'Quay ngã!', 'bad'); FX.shake(tf); sfx('fail'); G.buzz(50); if (r.lives <= 0) r.over = true; }
    }, 35);
  };
  document.addEventListener('pointerdown', (e) => { const r = F.run; if (r && !r.done && r.type === 'conquay' && (e.target.closest('[data-whip]') || e.target.closest('#tf'))) { e.preventDefault(); r.whip(); } });

  /* ======================================================================
     3. CÂU CÁ — chờ cá cắn, giật cần, cuốn dây giữ lực căng
     ====================================================================== */
  F.EXTRA.cauca = ['🎣', 'Câu cá', 'Giật cần đúng lúc, cuốn dây giữ lực căng · 40 giây', 'Xu + nguyên liệu']; F.extra.cauca = 1;
  F.GUIDES.cauca = ['🎣 Câu cá', ['Chờ phao nhấp nhô và hiện “!” rồi bấm “Giật cần!” thật nhanh để mắc cá.', 'Sau đó GIỮ nút “Cuốn dây” để kéo cá vào: giữ lâu lực căng tăng, thả ra lực căng giảm. Giữ kim lực căng trong vùng xanh.', 'Căng quá dây đứt, chùng quá cá thoát. Cá càng to điểm càng cao: cá nhỏ 2, cá chép 5, cá lớn 9.']];
  F.custom.cauca = (r, host) => {
    Object.assign(r, { score: 0, combo: 0, best: 0, state: 'wait', wait: rnd(1, 2.2), bite: 0, prog: 0, tens: 40, fish: null, hold: false, caught: 0, lost: 0, pull: 0 });
    shell(host, 'cauca', `<h3>🎣 Câu cá</h3>${hud(40, '<span id="ccN">Cá 0</span>')}<div class="fish-field" id="ff"><div class="fish-sky"></div><div class="fish-water" id="fw"></div><div class="fish-rod">${GA.art.rod}</div><div class="fish-bob" id="fb">${GA.art.bobber}</div><b class="fish-alert" id="fa">!</b><div class="fish-catch" id="fc"></div></div>
      <div class="reel-ui"><div class="reel-ten"><i class="rz"></i><b id="rt"></b><small>Lực căng</small></div><div class="reel-prog"><i id="rp"></i><small>Cá vào bờ</small></div></div><div class="foot-row"><button class="btn gold big foot" data-hook>⚡ Giật cần!</button><button class="btn gold big foot" data-reel>🎣 Cuốn dây</button></div>`);
    const fb = $('#fb'), fa = $('#fa'), rt = $('#rt'), rp = $('#rp'), fw = $('#fw'), ff = $('#ff'), fc = $('#fc'); r.pull = 0;
    // đàn cá bơi lờ đờ làm nền
    for (let i = 0; i < 5; i++) { const s = document.createElement('i'); s.className = 'bg-fish'; s.innerHTML = GA.art[['fish', 'carp', 'fishbig'][i % 3]]; s.style.cssText = `top:${20 + i * 14}%;--d:${rnd(9, 15)}s;--dl:${-rnd(0, 12)}s;--s:${rnd(.7, 1.1)}`; fw.appendChild(s); }
    const setBob = (cls) => { fb.className = 'fish-bob ' + cls; };
    r.hook = () => {
      if (r.done) return;
      if (r.state === 'bite') { r.state = 'reel'; r.prog = 28; r.tens = 45; r.pull = 0; fa.classList.remove('on'); setBob('hooked'); sfx('levelup'); G.buzz(30); FX.at(fb, 'Mắc cá!', 'gold'); const k = Math.random(); r.fish = k < .55 ? { n: 'fish', pts: 2, str: 1 } : k < .86 ? { n: 'carp', pts: 5, str: 1.35 } : { n: 'fishbig', pts: 9, str: 1.8 }; }
      else if (r.state === 'wait') { r.wait += 1.2; FX.at(fb, 'Vội quá!', 'bad'); sfx('error'); setBob('shake'); setTimeout(() => setBob(''), 400); r.combo = 0; comboTxt(r); }
    };
    r.end = () => F.finish(r, clamp(Math.round(r.score * 1.2), 0, 30), `Câu được ${r.caught} con, để thoát/đứt dây ${r.lost} lần.`);
    loop(r, (dt) => {
      if (r.state === 'wait') { r.wait -= dt; if (r.wait <= 0) { r.state = 'bite'; r.bite = .85; fa.classList.add('on'); setBob('dip'); sfx('pop'); G.buzz(20); } }
      else if (r.state === 'bite') { r.bite -= dt; if (r.bite <= 0) { r.state = 'wait'; r.wait = rnd(1, 2.4); fa.classList.remove('on'); setBob(''); FX.at(fb, 'Cá chạy mất', 'bad'); r.combo = 0; comboTxt(r); } }
      else if (r.state === 'reel') {
        const f = r.fish; r.pull -= dt; if (r.pull <= 0) { r.pull = rnd(.5, 1.1); r.surge = .45; }
        r.surge = Math.max(0, (r.surge || 0) - dt);
        r.tens += ((r.hold ? 34 : -32) + (r.surge > 0 ? 26 * f.str : 0)) * dt; r.tens = clamp(r.tens, 0, 110);
        const good = r.tens > 28 && r.tens < 78; r.prog += (r.hold ? (good ? 34 : 10) : -(1.4 + f.str * 1.1)) * dt; r.prog = clamp(r.prog, 0, 100);
        rt.style.left = r.tens / 1.1 + '%'; rp.style.width = r.prog + '%'; rt.className = good ? 'ok' : 'bad'; fb.style.transform = `translate(calc(-50% + ${Math.sin(r.t * 18) * (r.surge > 0 ? 8 : 2)}px), ${Math.sin(r.t * 7) * 3}px)`;
        if (r.tens >= 108) { r.state = 'wait'; r.wait = rnd(1.2, 2.4); r.lost++; r.combo = 0; comboTxt(r); setBob(''); fb.style.transform = ''; FX.at(fb, 'Đứt dây!', 'bad'); FX.shake(ff); sfx('fail'); G.buzz(60); }
        else if (r.prog <= 0) { r.state = 'wait'; r.wait = rnd(1.2, 2.4); r.lost++; r.combo = 0; comboTxt(r); setBob(''); fb.style.transform = ''; FX.at(fb, 'Cá thoát!', 'bad'); sfx('error'); }
        else if (r.prog >= 100) { r.state = 'wait'; r.wait = rnd(1.2, 2.2); r.caught++; r.combo++; r.best = Math.max(r.best, r.combo); const pts = f.pts * FX.mult(r); r.score += pts; setScore(r); comboTxt(r); setBob(''); fb.style.transform = ''; const b = fb.getBoundingClientRect(); FX.fly(b.left + b.width / 2, b.top, `+${pts}`, 'gold'); FX.boom(b.left + b.width / 2, b.top, ['💦', '✨', '⭐'], 8); sfx('cheer'); fc.innerHTML = GA.art[f.n]; fc.classList.remove('show'); void fc.offsetWidth; fc.classList.add('show'); const n = $('#ccN'); if (n) n.textContent = 'Cá ' + r.caught; if (f.pts >= 9) FX.confetti(26); }
      }
    }, 40);
  };
  document.addEventListener('pointerdown', (e) => { const r = F.run; if (!r || r.done || r.type !== 'cauca') return; if (e.target.closest('[data-hook]')) { e.preventDefault(); r.hook(); } else if (e.target.closest('[data-reel]')) { e.preventDefault(); r.hold = true; e.target.closest('[data-reel]').classList.add('on'); } });
  ['pointerup', 'pointercancel'].forEach((ev) => document.addEventListener(ev, () => { const r = F.run; if (r && r.type === 'cauca') { r.hold = false; const b = $('[data-reel]'); if (b) b.classList.remove('on'); } }, true));

  /* ======================================================================
     4. GIÃ BÁNH DÀY — giã và đảo bánh đúng nhịp
     ====================================================================== */
  F.EXTRA.giaday = ['🥮', 'Giã bánh dày', 'Giã & đảo bánh luân phiên đúng nhịp · 32 giây', 'Xu + nguyên liệu']; F.extra.giaday = 1;
  F.GUIDES.giaday = ['🥮 Giã bánh dày', ['Vòng nhịp thu nhỏ báo giờ ra tay. Chữ trên màn hình cho biết cần “GIÃ” hay “ĐẢO”.', 'Bấm đúng nút (Giã bằng chày, Đảo bằng tay) khi vòng chạm tâm. Hoàn hảo +3, Tốt +1; sai nút hoặc lệch nhịp làm bánh bị lốm đốm.', 'Bánh mịn đủ 100% là xong một mẻ và bắt đầu mẻ mới, càng nhiều mẻ điểm càng cao.']];
  F.custom.giaday = (r, host) => {
    Object.assign(r, { score: 0, combo: 0, best: 0, bpm: 84, beat: 0, expect: 'hit', prog: 0, batches: 0, perfect: 0, bad: 0, lastRow: -9, cooldown: 0 });
    shell(host, 'giaday', `<h3>🥮 Giã bánh dày</h3>${hud(32, '<span id="gdB">Mẻ 0</span>')}<div class="day-stage" id="dg"><div class="day-kid l">${art('boy')}</div><div class="day-kid r">${art('girl')}</div><div class="day-mortar"><div class="day-dough" id="dd">${GA.art.daydough}</div><div class="day-pestle" id="dpest">${GA.art.pestle}</div>${GA.art.mortar}</div><div class="day-ring"><i id="dring"></i><b id="dcmd">GIÃ!</b></div><div class="cook-bar"><i id="dbar"></i><span id="dbt">Bánh mịn 0%</span></div></div><div class="foot-row"><button class="btn gold big foot" data-day="hit">🔨 Giã!</button><button class="btn gold big foot" data-day="turn">🖐️ Đảo!</button></div>`);
    const per = 60 / r.bpm, ring = $('#dring'), cmd = $('#dcmd'), bar = $('#dbar'), bt = $('#dbt'), pest = $('#dpest'), dough = $('#dd'), dg = $('#dg');
    const say = (t, c) => { cmd.textContent = t; cmd.className = c || ''; r.fbUntil = r.t + .4; };
    r.press = (kind, btn) => {
      if (r.done) return; btn.classList.remove('pop'); void btn.offsetWidth; btn.classList.add('pop');
      if (kind === 'hit') { pest.classList.remove('slam'); void pest.offsetWidth; pest.classList.add('slam'); sfx('drum'); } else { dough.classList.remove('flip'); void dough.offsetWidth; dough.classList.add('flip'); sfx('tap'); }
      if (r.t - r.lastRow < .16) return; r.lastRow = r.t;
      const ph = (r.beat % per) / per, off = Math.min(ph, 1 - ph) * per, b = dg.getBoundingClientRect();
      if (kind !== r.expectPrev) { r.bad++; r.combo = 0; r.prog = Math.max(0, r.prog - 6); say('Sai nút!', 'bad'); comboTxt(r); FX.shake(dg); sfx('error'); return; }
      if (off < .085) { r.perfect++; r.combo++; r.score += 3 * FX.mult(r); r.prog += 7.5; say('HOÀN HẢO!', 'p'); FX.boom(b.left + b.width / 2, b.top + b.height * .45, ['✨', '💥'], 5); sfx('coin'); }
      else if (off < .18) { r.combo++; r.score += 1 * FX.mult(r); r.prog += 4.5; say('Tốt', 'g'); }
      else { r.bad++; r.combo = 0; r.prog = Math.max(0, r.prog - 4); say('Lệch nhịp', 'bad'); comboTxt(r); return; }
      r.best = Math.max(r.best, r.combo); setScore(r); comboTxt(r);
      if (r.prog >= 100) { r.prog = 0; r.batches++; r.score += 6; setScore(r); const n = $('#gdB'); if (n) n.textContent = 'Mẻ ' + r.batches; FX.fly(b.left + b.width / 2, b.top + 40, `Xong mẻ ${r.batches}! +6`, 'big'); FX.confetti(18); sfx('levelup'); }
    };
    r.end = () => F.finish(r, clamp(Math.round(r.score * .42), 0, 30), `Xong ${r.batches} mẻ bánh, ${r.perfect} lần chuẩn nhịp.`);
    loop(r, (dt) => {
      r.beat += dt; const idx = Math.floor(r.beat / per), ph = (r.beat % per) / per;
      const nearIdx = ph > .5 ? idx + 1 : idx, kind = nearIdx % 2 === 0 ? 'hit' : 'turn'; r.expectPrev = kind;
      if (r.t > (r.fbUntil || 0)) { const txt = kind === 'hit' ? 'GIÃ!' : 'ĐẢO!'; if (cmd.textContent !== txt || cmd.className !== 'next') { cmd.textContent = txt; cmd.className = 'next'; } }
      ring.style.transform = `scale(${(2.5 - ph * 1.6).toFixed(3)})`; ring.style.opacity = (.25 + ph * .75).toFixed(2); ring.className = (idx + 1) % 2 === 0 ? 'hit' : 'turn';
      if (ph < dt / per) sfx('tick');
      bar.style.width = r.prog + '%'; bt.textContent = 'Bánh mịn ' + Math.round(r.prog) + '%';
    }, 32);
  };
  document.addEventListener('pointerdown', (e) => { const r = F.run, b = e.target.closest('[data-day]'); if (r && !r.done && r.type === 'giaday' && b) { e.preventDefault(); r.press(b.dataset.day, b); } });

  /* ======================================================================
     5. THẢ ĐỈA BA BA — chạy né ba ba, nhặt xu (canvas)
     ====================================================================== */
  F.EXTRA.thadia = ['🐢', 'Thả đỉa ba ba', 'Kéo bạn nhỏ chạy né ba ba, nhặt đồng xu · 30 giây', 'Xu + nguyên liệu']; F.extra.thadia = 1;
  F.GUIDES.thadia = ['🐢 Thả đỉa ba ba', ['Kéo ngón tay để bạn nhỏ chạy trên sân. Ba ba (con rùa đỉa) đuổi theo bạn.', 'Nhặt đồng xu +1. Sống sót càng lâu ba ba càng nhanh, sau 12 giây có thêm một con.', 'Bị ba ba chạm mất 1 mạng (3 mạng). Cây đa và chum nước là vật cản, ba ba cũng phải vòng qua.']];
  F.custom.thadia = (r, host) => {
    Object.assign(r, { score: 0, combo: 0, best: 0, lives: 3, coins: 0, hurt: 0 });
    shell(host, 'thadia', `<h3>🐢 Thả đỉa ba ba</h3>${hud(30, '<span id="tdL">❤️❤️❤️</span>')}<canvas class="dragon-cv" id="tcv"></canvas><p class="muted" style="margin:4px 0 0;text-align:center">Kéo ngón tay để chạy</p>`);
    const cv = $('#tcv'), fg = cv.closest('.folk-game'), W = Math.min((fg ? fg.clientWidth : 360) - 24, 520) || 320, Hh = fg && fg.closest('.fg-stage') ? Math.max(300, fg.clientHeight - cv.offsetTop - 64) : 340, dpr = Math.min(2, window.devicePixelRatio || 1);
    cv.style.width = W + 'px'; cv.style.height = Hh + 'px'; cv.width = W * dpr; cv.height = Hh * dpr; const ctx = cv.getContext('2d'); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const me = { x: W / 2, y: Hh * .75 }, tgt = { x: me.x, y: me.y }, enemies = [{ x: W * .15, y: Hh * .15, a: 0 }], coins = [], obs = [{ x: W * .3, y: Hh * .45, r: 22, t: 'tree' }, { x: W * .72, y: Hh * .35, r: 18, t: 'jar' }, { x: W * .55, y: Hh * .7, r: 16, t: 'jar' }];
    const lives = () => { const l = $('#tdL'); if (l) l.textContent = '❤️'.repeat(r.lives) + '🖤'.repeat(3 - r.lives); };
    const spawnCoin = () => { if (coins.length >= 5) return; for (let k = 0; k < 8; k++) { const c = { x: rnd(24, W - 24), y: rnd(24, Hh - 24), p: rnd(0, 6) }; if (obs.every((o) => Math.hypot(o.x - c.x, o.y - c.y) > o.r + 20)) { coins.push(c); return; } } };
    for (let i = 0; i < 4; i++) spawnCoin();
    const move = (e) => { const b = cv.getBoundingClientRect(); tgt.x = clamp((e.clientX - b.left) / b.width * W, 14, W - 14); tgt.y = clamp((e.clientY - b.top) / b.height * Hh, 14, Hh - 14); };
    track(cv, 'pointerdown', (e) => { move(e); cv.setPointerCapture && cv.setPointerCapture(e.pointerId); r.drag = true; e.preventDefault(); });
    track(cv, 'pointermove', (e) => { if (r.drag) move(e); }); track(cv, 'pointerup', () => { r.drag = false; });
    const push = (p, rad) => obs.forEach((o) => { const dx = p.x - o.x, dy = p.y - o.y, d = Math.hypot(dx, dy), m = o.r + rad; if (d < m && d > 0) { p.x = o.x + dx / d * m; p.y = o.y + dy / d * m; } });
    r.end = () => F.finish(r, clamp(Math.round(r.coins * 1.5 + r.lives * 3), 0, 30), `Nhặt ${r.coins} đồng xu, còn ${r.lives} mạng.`);
    let coinT = 0, face = 1;
    loop(r, (dt) => {
      const dx = tgt.x - me.x, dy = tgt.y - me.y, d = Math.hypot(dx, dy), sp = Math.min(d, 150 * dt); if (d > 2) { me.x += dx / d * sp; me.y += dy / d * sp; if (Math.abs(dx) > 3) face = dx > 0 ? 1 : -1; } push(me, 12);
      if (r.t > 12 && enemies.length < 2) enemies.push({ x: W * .85, y: Hh * .15, a: 0 });
      const spd = 52 + r.t * 1.5; r.hurt = Math.max(0, r.hurt - dt);
      enemies.forEach((e) => { const ex = me.x - e.x, ey = me.y - e.y, ed = Math.hypot(ex, ey) || 1; e.x += ex / ed * spd * dt; e.y += ey / ed * spd * dt; e.a = Math.atan2(ey, ex); push(e, 14);
        if (ed < 24 && r.hurt <= 0) { r.lives--; lives(); r.hurt = 1.6; r.combo = 0; comboTxt(r); const b = cv.getBoundingClientRect(); FX.fly(b.left + me.x / W * b.width, b.top + me.y / Hh * b.height, 'Bị bắt!', 'bad'); FX.shake(cv); sfx('error'); G.buzz(50); enemies.forEach((x, i) => { x.x = i ? W * .85 : W * .15; x.y = Hh * .1; }); if (r.lives <= 0) r.over = true; } });
      coinT -= dt; if (coinT <= 0) { spawnCoin(); coinT = rnd(.6, 1.4); }
      for (let i = coins.length - 1; i >= 0; i--) { const c = coins[i]; if (Math.hypot(c.x - me.x, c.y - me.y) < 20) { coins.splice(i, 1); r.coins++; r.score++; r.combo++; r.best = Math.max(r.best, r.combo); setScore(r); comboTxt(r); const b = cv.getBoundingClientRect(); FX.fly(b.left + c.x / W * b.width, b.top + c.y / Hh * b.height, '+1', 'gold'); sfx('coin'); } }
      // vẽ
      const g = ctx.createLinearGradient(0, 0, 0, Hh); g.addColorStop(0, '#bfe0a0'); g.addColorStop(1, '#8cc468'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, Hh);
      ctx.fillStyle = 'rgba(70,120,40,.18)'; for (let i = 0; i < 22; i++) { ctx.beginPath(); ctx.arc((i * 97) % W, (i * 53) % Hh, 10 + (i % 3) * 6, 0, 6.3); ctx.fill(); }
      ctx.strokeStyle = 'rgba(160,120,60,.35)'; ctx.lineWidth = 26; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(0, Hh * .55); ctx.bezierCurveTo(W * .3, Hh * .4, W * .6, Hh * .7, W, Hh * .5); ctx.stroke();
      obs.forEach((o) => { ctx.save(); ctx.fillStyle = 'rgba(0,0,0,.18)'; ctx.beginPath(); ctx.ellipse(o.x, o.y + o.r * .7, o.r, o.r * .35, 0, 0, 6.3); ctx.fill(); ctx.font = (o.r * 2.2) + 'px serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(o.t === 'tree' ? '🌳' : '🏺', o.x, o.y); ctx.restore(); });
      coins.forEach((c) => { c.p += dt * 5; GA.draw(ctx, 'coin', c.x, c.y + Math.sin(c.p) * 2.5, 22 + Math.sin(c.p) * 2); });
      enemies.forEach((e) => { ctx.save(); ctx.translate(e.x, e.y); ctx.scale(Math.cos(e.a) < 0 ? -1 : 1, 1); const bob = Math.sin(r.t * 10) * 1.5; ctx.translate(0, bob); GA.draw(ctx, 'turtle', 0, 0, 44); ctx.restore(); });
      ctx.save(); if (r.hurt > 0 && Math.floor(r.t * 14) % 2) ctx.globalAlpha = .4; ctx.translate(me.x, me.y); ctx.scale(face, 1); GA.draw(ctx, 'boy2', 0, Math.sin(r.t * 14) * 1.6, 48); ctx.restore();
    }, 30);
  };

  /* ======================================================================
     6. RƯỚC ĐÈN ÔNG SAO — chạy 3 làn, nhặt kẹo, né vũng nước (canvas)
     ====================================================================== */
  F.EXTRA.ruocden = ['⭐', 'Rước đèn ông sao', 'Vuốt chuyển làn, nhặt kẹo, né vũng nước · 30 giây', 'Xu + nguyên liệu']; F.extra.ruocden = 1;
  F.GUIDES.ruocden = ['⭐ Rước đèn ông sao', ['Chạm nửa TRÁI/PHẢI hoặc vuốt ngang để đổi làn, bạn nhỏ cầm đèn ông sao chạy trên đường làng.', 'Nhặt kẹo 🍬 (+1) và đồng xu (+3). Nhặt liên tiếp tăng hệ số.', 'Né vũng nước và hòn đá: va vào làm đèn mờ đi 25%. Đèn tắt hẳn là hết ván.']];
  F.custom.ruocden = (r, host) => {
    Object.assign(r, { score: 0, combo: 0, best: 0, lane: 1, light: 100, items: [], next: .5, dist: 0, hit: 0 });
    shell(host, 'ruocden', `<h3>⭐ Rước đèn ông sao</h3>${hud(30, '<span id="rdL">💡 100%</span>')}<canvas class="dragon-cv" id="rcv"></canvas><p class="muted" style="margin:4px 0 0;text-align:center">Chạm trái/phải hoặc vuốt ngang để đổi làn</p>`);
    const cv = $('#rcv'), fg = cv.closest('.folk-game'), W = Math.min((fg ? fg.clientWidth : 360) - 24, 520) || 320, Hh = fg && fg.closest('.fg-stage') ? Math.max(300, fg.clientHeight - cv.offsetTop - 64) : 340, dpr = Math.min(2, window.devicePixelRatio || 1);
    cv.style.width = W + 'px'; cv.style.height = Hh + 'px'; cv.width = W * dpr; cv.height = Hh * dpr; const ctx = cv.getContext('2d'); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const laneX = (l, depth) => W / 2 + (l - 1) * (W * .26) * (.45 + depth * .55), yAt = (depth) => Hh * (.12 + depth * .74);
    let px = laneX(1, 1), sx = null;
    const go = (d) => { const n = clamp(r.lane + d, 0, 2); if (n !== r.lane) { r.lane = n; sfx('tap'); } };
    track(cv, 'pointerdown', (e) => { const b = cv.getBoundingClientRect(); sx = e.clientX; r.px0 = (e.clientX - b.left) / b.width; e.preventDefault(); });
    track(cv, 'pointerup', (e) => { if (sx == null) return; const dx = e.clientX - sx; if (Math.abs(dx) > 28) go(dx > 0 ? 1 : -1); else go(r.px0 > .5 ? 1 : -1); sx = null; });
    const lightHud = () => { const l = $('#rdL'); if (l) l.textContent = `💡 ${Math.max(0, Math.round(r.light))}%`; };
    r.end = () => F.finish(r, clamp(Math.round(r.score * .8 + (r.light > 0 ? 3 : 0)), 0, 30), r.light > 0 ? `Rước đèn trọn vẹn, còn ${Math.round(r.light)}% ánh sáng.` : 'Đèn đã tắt giữa đường.');
    loop(r, (dt) => {
      const spd = .42 + r.t * .012; r.dist += spd * dt; r.next -= dt;
      if (r.next <= 0) { const k = Math.random(), lane = Math.floor(rnd(0, 3)); r.items.push({ lane, d: 0, kind: k < .5 ? 'candy' : k < .65 ? 'coin' : k < .85 ? 'puddle' : 'rock' }); if (Math.random() < .3) r.items.push({ lane: (lane + 1 + Math.floor(rnd(0, 2))) % 3, d: 0, kind: Math.random() < .5 ? 'candy' : 'puddle' }); r.next = rnd(.45, .85) / (1 + r.t * .015); }
      px += (laneX(r.lane, 1) - px) * Math.min(1, dt * 12); r.hit = Math.max(0, r.hit - dt);
      r.items = r.items.filter((it) => {
        it.d += spd * dt; if (it.d >= .86 && it.d <= 1.02 && it.lane === r.lane && !it.got) {
          it.got = true; const b = cv.getBoundingClientRect(), bx = b.left + laneX(it.lane, 1) / W * b.width, by = b.top + yAt(.9) / Hh * b.height;
          if (it.kind === 'candy' || it.kind === 'coin') { r.combo++; r.best = Math.max(r.best, r.combo); const pts = (it.kind === 'coin' ? 3 : 1) * FX.mult(r); r.score += pts; setScore(r); comboTxt(r); FX.fly(bx, by - 30, '+' + pts, 'gold'); sfx('coin'); }
          else { r.light -= 25; r.hit = .5; r.combo = 0; comboTxt(r); lightHud(); FX.fly(bx, by - 30, it.kind === 'puddle' ? 'Ướt đèn!' : 'Vấp!', 'bad'); FX.shake(cv); sfx('error'); G.buzz(40); if (r.light <= 0) { r.over = true; } }
          return false;
        }
        return it.d < 1.08;
      });
      // vẽ
      const g = ctx.createLinearGradient(0, 0, 0, Hh); g.addColorStop(0, '#1c1d4a'); g.addColorStop(.45, '#5a3a6a'); g.addColorStop(1, '#c8804a'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, Hh);
      ctx.fillStyle = '#fff'; for (let i = 0; i < 24; i++) { ctx.globalAlpha = .35 + .5 * Math.abs(Math.sin(r.t * 2 + i)); ctx.fillRect((i * 83) % W, (i * 37) % (Hh * .4), 2, 2); } ctx.globalAlpha = 1;
      ctx.fillStyle = '#6a4a2a'; ctx.beginPath(); ctx.moveTo(W * .36, yAt(0)); ctx.lineTo(W * .64, yAt(0)); ctx.lineTo(W * .98, Hh); ctx.lineTo(W * .02, Hh); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = 'rgba(255,230,160,.35)'; ctx.lineWidth = 3; for (let l = 0; l < 2; l++) { const off = (l + .5 - 1) * .5; ctx.beginPath(); for (let k = 0; k <= 8; k++) { const dd = k / 8, y = yAt(dd), x = W / 2 + (l === 0 ? -1 : 1) * (W * .13) * (.45 + dd * .55) * 1.0; ctx.setLineDash([12, 16]); ctx.lineDashOffset = -(r.dist * 300) % 28; if (k === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y); } ctx.stroke(); void off; } ctx.setLineDash([]);
      // hai bên đường: đèn lồng trang trí
      for (let k = 0; k < 5; k++) { const dd = ((k / 5) + r.dist * .9) % 1, y = yAt(dd), s = 10 + dd * 26; ctx.save(); ctx.globalAlpha = .95; GA.draw(ctx, 'lantern', W * .07 + (1 - dd) * W * .24, y - s, s * 1.6); GA.draw(ctx, 'lantern', W * .93 - (1 - dd) * W * .24, y - s, s * 1.6); ctx.restore(); }
      r.items.slice().sort((a, b) => a.d - b.d).forEach((it) => { const dd = it.d, x = laneX(it.lane, dd), y = yAt(dd), s = 14 + dd * 38, name = it.kind === 'candy' ? 'candy' : it.kind === 'coin' ? 'coin' : it.kind; if (!it.got) GA.draw(ctx, name, x, y - s * .3, s * (it.kind === 'puddle' ? 1.5 : 1)); });
      // người cầm đèn + ánh sáng
      const lx = px, ly = yAt(.9), lum = Math.max(0, r.light) / 100;
      const rg = ctx.createRadialGradient(lx, ly - 40, 4, lx, ly - 40, 90 * (.4 + lum * .8)); rg.addColorStop(0, `rgba(255,220,120,${.55 * lum})`); rg.addColorStop(1, 'rgba(255,220,120,0)'); ctx.fillStyle = rg; ctx.beginPath(); ctx.arc(lx, ly - 40, 100, 0, 6.3); ctx.fill();
      ctx.save(); if (r.hit > 0 && Math.floor(r.t * 18) % 2) ctx.globalAlpha = .45; GA.draw(ctx, 'girl3', lx, ly + Math.sin(r.t * 14) * 2, 54); ctx.globalAlpha = .5 + .5 * lum; GA.draw(ctx, 'starlantern', lx + 22, ly - 36 + Math.sin(r.t * 5) * 3, 44, Math.sin(r.t * 5) * .15); ctx.restore();
    }, 30);
  };

  /* ---------- nhóm trên sảnh + cờ MỚI + đếm ngược ---------- */
  const add = (title, ids) => F.GROUPS.forEach((g) => { if (g[1] === title) ids.forEach((id) => g[2].push(id)); });
  add('Vận động & phản xạ', ['thadia', 'ruocden']); add('Nhịp điệu & khéo tay', ['danhdao', 'conquay', 'giaday']); add('Phiêu lưu bầu trời', ['cauca']);
  ['danhdao', 'conquay', 'cauca', 'giaday', 'thadia', 'ruocden'].forEach((id) => { F.NEW[id] = 1; F.TIMED[id] = 1; });
  void pickRound;
})();
