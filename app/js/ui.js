/* ui.js — menu scene, home, setup, question card, results, pause */
(function () {
  'use strict';
  const G = window.G, U = G.U, S = G.sfx, esc = U.esc;
  const root = () => document.getElementById('ui');
  const UI = G.UI = {};
  const DEF_NAMES = ['الذيابة', 'الصقور', 'النمور'];

  UI.clear = () => { root().innerHTML = ''; };
  UI.mount = html => { const d = document.createElement('div'); d.innerHTML = html.trim(); const el = d.firstElementChild; root().appendChild(el); return el; };
  UI.toast = text => {
    const old = root().querySelector('.toast'); if (old) old.remove();
    const el = UI.mount('<div class="toast">' + esc(text) + '</div>'); setTimeout(() => el.remove(), 1900);
  };

  /* ---------- animated menu backdrop ---------- */
  G.MenuScene = {
    t: 0, shapes: null,
    enter() {
      if (this.shapes) return;
      const cols = ['#FF2E63', '#31B7FF', '#FFD23F', '#1FE0A8', '#8B5CFF', '#FF8A3D'];
      this.shapes = Array.from({ length: 16 }, (_, i) => ({ x: U.rand(0, 1600), y: U.rand(0, 900), s: U.rand(26, 70), r: U.rand(6.28), vr: U.rand(-.4, .4), vy: U.rand(-22, -8), vx: U.rand(-8, 8), k: i % 4, c: cols[i % cols.length] }));
    },
    update(dt) {
      this.t += dt;
      for (const s of this.shapes) { s.y += s.vy * dt; s.x += s.vx * dt; s.r += s.vr * dt; if (s.y < -90) { s.y = 990; s.x = U.rand(0, 1600); } }
    },
    draw(c) {
      c.fillStyle = U.lin(c, 0, 0, 0, 900, ['#241A4A', '#150F2B']); c.fillRect(0, 0, 1600, 900);
      /* comic sunburst */
      c.save(); c.translate(800, 1050); c.rotate(this.t * .03);
      for (let i = 0; i < 24; i++) { c.rotate(Math.PI / 12); if (i % 2) continue; c.beginPath(); c.moveTo(0, 0); c.lineTo(-170, -1900); c.lineTo(170, -1900); c.closePath(); c.fillStyle = 'rgba(255,255,255,.028)'; c.fill(); }
      c.restore();
      /* halftone corners */
      c.fillStyle = 'rgba(255,46,99,.16)';
      for (let i = 0; i < 12; i++) for (let j = 0; j < 9; j++) { const r = 9 - (i + j) * .55; if (r > 1) { c.beginPath(); c.arc(30 + i * 30, 30 + j * 30, r, 0, 7); c.fill(); } }
      c.fillStyle = 'rgba(49,183,255,.14)';
      for (let i = 0; i < 12; i++) for (let j = 0; j < 9; j++) { const r = 9 - (i + j) * .55; if (r > 1) { c.beginPath(); c.arc(1570 - i * 30, 870 - j * 30, r, 0, 7); c.fill(); } }
      /* drifting outlined shapes */
      for (const s of this.shapes) {
        c.save(); c.translate(s.x, s.y); c.rotate(s.r); c.globalAlpha = .34; c.lineWidth = 6; c.strokeStyle = s.c; c.lineJoin = 'round';
        c.beginPath();
        if (s.k === 0) c.rect(-s.s, -s.s * .32, s.s * 2, s.s * .64);
        else if (s.k === 1) c.arc(0, 0, s.s * .6, 0, 7);
        else if (s.k === 2) { c.moveTo(-s.s * .7, 0); c.lineTo(s.s * .7, 0); c.moveTo(0, -s.s * .7); c.lineTo(0, s.s * .7); }
        else { c.moveTo(-s.s, 0); c.lineTo(-s.s * .5, -s.s * .4); c.lineTo(0, 0); c.lineTo(s.s * .5, -s.s * .4); c.lineTo(s.s, 0); }
        c.stroke(); c.restore();
      }
    }
  };

  /* ---------- home ---------- */
  const K = '#120E1C';
  const ART = {
    tower: `<g stroke="${K}" stroke-width="7" stroke-linejoin="round"><rect x="58" y="112" width="104" height="28" rx="7" fill="#FFD23F"/><rect x="58" y="82" width="104" height="28" rx="7" fill="#fff" transform="rotate(-3 110 96)"/><rect x="96" y="52" width="104" height="28" rx="7" fill="#FFD23F" transform="rotate(5 148 66)"/><rect x="56" y="20" width="104" height="28" rx="7" fill="#fff" transform="rotate(-7 108 34)"/></g><g stroke="#fff" stroke-width="5" stroke-linecap="round"><path d="M206 44l14-8M210 62h16M206 80l14 8"/></g>`,
    tug: `<path d="M8 86Q110 58 212 86" fill="none" stroke="${K}" stroke-width="18" stroke-linecap="round"/><path d="M8 86Q110 58 212 86" fill="none" stroke="#F2C27B" stroke-width="9" stroke-linecap="round" stroke-dasharray="14 9"/><g stroke="${K}" stroke-width="7" stroke-linejoin="round"><rect x="26" y="62" width="44" height="40" rx="14" fill="#F2B38A" transform="rotate(-10 48 82)"/><rect x="150" y="62" width="44" height="40" rx="14" fill="#D9925F" transform="rotate(10 172 82)"/><path d="M110 70v42l-14-10-12 14V70z" fill="#fff"/></g><g stroke="#fff" stroke-width="5" stroke-linecap="round"><path d="M96 36l-8-14M110 32V14M124 36l8-14"/></g>`,
    bomb: `<g stroke="${K}" stroke-width="7" stroke-linejoin="round"><circle cx="100" cy="92" r="46" fill="#2B2540"/><rect x="84" y="34" width="32" height="20" rx="5" fill="#8B5CFF"/><path d="M100 34Q104 10 132 14" fill="none"/><path d="M146 4l5 12 12-4-7 11 10 8-13 1 1 13-9-10-10 8 3-13-12-5 12-4z" fill="#FFD23F"/></g><path d="M74 78a30 30 0 0 1 22-18" fill="none" stroke="#fff" stroke-width="6" stroke-linecap="round" opacity=".6"/>`,
    cats: `<g stroke="${K}" stroke-width="7" stroke-linejoin="round"><rect x="24" y="22" width="52" height="46" rx="10" fill="#FFD23F"/><rect x="84" y="22" width="52" height="46" rx="10" fill="#fff"/><rect x="144" y="22" width="52" height="46" rx="10" fill="#1FE0A8"/><rect x="24" y="78" width="52" height="46" rx="10" fill="#fff"/><rect x="84" y="78" width="52" height="46" rx="10" fill="#FF2E63"/><rect x="144" y="78" width="52" height="46" rx="10" fill="#fff"/></g>`,
    mandoos: `<g stroke="${K}" stroke-width="7" stroke-linejoin="round"><path d="M34 70Q34 26 110 26T186 70z" fill="#B5682E"/><rect x="34" y="70" width="152" height="62" rx="8" fill="#8A4A1E"/><rect x="94" y="58" width="32" height="36" rx="7" fill="#FFD23F"/><path d="M34 70h152" /></g><circle cx="110" cy="76" r="5" fill="${K}"/>`,
    plat: `<g stroke="${K}" stroke-width="7" stroke-linejoin="round"><rect x="14" y="108" width="56" height="24" rx="7" fill="#fff"/><rect x="84" y="84" width="56" height="24" rx="7" fill="#FFD23F"/><rect x="154" y="58" width="56" height="24" rx="7" fill="#FF2E63"/><circle cx="118" cy="46" r="18" fill="#fff"/></g><path d="M52 92Q78 30 104 40" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round" stroke-dasharray="4 10"/>`
  };
  const GAMES = [
    { id: 'tower', name: 'البرج', desc: 'اسحب بلوك… وادعي ما يطيح', c: '#FF2E63', ready: true },
    { id: 'tug', name: 'شد الحبل', desc: 'جاوب صح واسحبهم للهاوية', c: '#31B7FF', ready: true },
    { id: 'bomb', name: 'القنبلة', desc: 'تخلّص منها قبل ما تنفجر', c: '#FFD23F' },
    { id: 'cats', name: 'الفئات', desc: 'فئات ونقاط وتحدّي فرق', c: '#8B5CFF' },
    { id: 'mandoos', name: 'المندوس', desc: 'افتح صندوق… وخاطر', c: '#FF8A3D' },
    { id: 'plat', name: 'المنصات', desc: 'انقز وشوف جوابك صح ولا لا', c: '#1FE0A8' }
  ];
  const svg = id => `<svg viewBox="0 0 220 150" aria-hidden="true">${ART[id]}</svg>`;

  UI.home = () => {
    if (G.scene !== G.MenuScene) G.setScene(G.MenuScene);
    UI.clear();
    const el = UI.mount(`<div class="screen home">
      <header class="hhead">
        <div class="logo"><span class="l1">ألعاب</span><span class="l2">الجمعة</span><span class="stamp">نسخة تجريبية</span></div>
        <div class="hbtns">
          <button class="btn dark sm" data-a="sound">${G.audio.muted ? 'الصوت: طافي' : 'الصوت: شغّال'}</button>
          <button class="btn dark sm" data-a="full">ملء الشاشة</button>
        </div>
      </header>
      <div class="games">${GAMES.map((g, i) => `
        <button class="gcard ${g.ready ? '' : 'locked'}" data-game="${g.id}" style="--c:${g.c};--r:${[-1.6, 1.2, -1, 1.4, -1.2, 1.6][i]}deg;--d:${i * 70}ms">
          <span class="gart">${svg(g.id)}</span>
          <span class="gname">${g.name}</span><span class="gdesc">${g.desc}</span>
          ${g.ready ? '<span class="gtag">جاهزة</span>' : '<span class="soon">قريباً</span>'}
        </button>`).join('')}</div>
      <footer class="hfoot">جوال واحد بيد المقدّم · اعرض الشاشة على التلفزيون من مركز التحكم ← انعكاس الشاشة</footer>
    </div>`);
    el.addEventListener('click', e => {
      const b = e.target.closest('[data-a]'), g = e.target.closest('[data-game]');
      if (b) {
        S.click();
        if (b.dataset.a === 'sound') { G.audio.setMuted(!G.audio.muted); b.textContent = G.audio.muted ? 'الصوت: طافي' : 'الصوت: شغّال'; }
        else { const fr = document.documentElement; try { (document.fullscreenElement ? document.exitFullscreen() : (fr.requestFullscreen || fr.webkitRequestFullscreen).call(fr)).catch(() => UI.toast('أضف الصفحة للشاشة الرئيسية عشان تفتح بملء الشاشة')); } catch (err) { UI.toast('أضف الصفحة للشاشة الرئيسية عشان تفتح بملء الشاشة'); } }
      } else if (g) {
        const game = GAMES.find(x => x.id === g.dataset.game);
        if (!game.ready) { S.bad(); g.classList.remove('nope'); void g.offsetWidth; g.classList.add('nope'); UI.toast('«' + game.name + '» في المرحلة الجاية'); return; }
        S.pop(); UI.setup(game.id);
      }
    });
  };

  /* ---------- setup ---------- */
  UI.setup = gameId => {
    if (G.scene !== G.MenuScene) G.setScene(G.MenuScene);
    UI.clear();
    const isTower = gameId === 'tower', mod = isTower ? G.Tower : G.Tug;
    const cfg = G.store.get('cfg:' + gameId, {});
    const st = { n: isTower ? (cfg.n || 2) : 2, names: G.store.get('names', DEF_NAMES.slice()), style: cfg.style && mod.styles[cfg.style] ? cfg.style : Object.keys(mod.styles)[0] };
    const ALL = G.Q.categories; st.cats = (G.store.get('cats', null) || ALL).filter(c => ALL.indexOf(c) >= 0); if (!st.cats.length) st.cats = ALL.slice();
    const el = UI.mount(`<div class="screen setup">
      <header class="shead">
        <button class="btn dark sm" data-a="back">رجوع</button>
        <div class="stitle"><h1>${isTower ? 'البرج' : 'شد الحبل'}</h1>
          <p>${isTower ? 'كل فريق يسحب بلوك ويجاوب سؤاله. كل ما نزلت تحت زادت النقاط وزاد الخطر. واللي يطيّح البرج يخسر كل نقاطه.' : 'اختاروا قوة الشدّة وجاوبوا. الجواب الصح يسحب الحبل لكم، والغلط يعطيه لخصمكم. واللي ينسحب للهاوية يخسر.'}</p></div>
      </header>
      <div class="sgrid">
        <section class="panel">
          <div class="phead"><h2>الفرق</h2>${isTower ? `<div class="seg"><button data-n="2">فريقين</button><button data-n="3">3 فرق</button></div>` : ''}</div>
          <div class="tnames"></div>
          <div class="phead"><h2 class="h2s">فئات الأسئلة</h2><button class="callbtn" data-a="allcats">الكل</button></div>
          <div class="cats">${ALL.map(c => `<button class="cchip" data-cat="${esc(c)}">${esc(c)}</button>`).join('')}</div>
        </section>
        <section class="panel grow">
          <div class="phead"><h2>${isTower ? 'شكل البرج' : 'الخلفية'}</h2></div>
          <div class="styles ${isTower ? 'c3' : ''}">${Object.keys(mod.styles).map(id => `<button class="stile" data-style="${id}"><canvas width="336" height="189"></canvas><span>${mod.styles[id].name}</span>${mod.styles[id].tag ? `<em>${mod.styles[id].tag}</em>` : ''}</button>`).join('')}</div>
        </section>
      </div>
      <div class="sgo"><button class="btn go" data-a="go">يلا نبدأ</button></div>
    </div>`);
    const paintNames = () => {
      el.querySelector('.tnames').innerHTML = Array.from({ length: st.n }, (_, i) => `<label style="--c:${G.TEAM_COLORS[i]}"><i></i><input id="team-name-${i}" data-i="${i}" maxlength="14" autocomplete="off" value="${esc(st.names[i] || DEF_NAMES[i])}"></label>`).join('');
      el.querySelectorAll('.seg button').forEach(b => b.classList.toggle('on', +b.dataset.n === st.n));
    };
    const paintSel = () => el.querySelectorAll('.stile').forEach(b => b.classList.toggle('on', b.dataset.style === st.style));
    const paintCats = () => el.querySelectorAll('.cchip').forEach(b => b.classList.toggle('on', st.cats.indexOf(b.dataset.cat) >= 0));
    paintNames(); paintSel(); paintCats();
    el.querySelectorAll('.stile').forEach(b => { const cv = b.querySelector('canvas'); try { mod.preview(cv.getContext('2d'), b.dataset.style, cv.width, cv.height); } catch (e) { /* preview is cosmetic */ } });
    el.addEventListener('input', e => { if (e.target.dataset.i) { st.names[+e.target.dataset.i] = e.target.value; G.store.set('names', st.names); } });
    el.addEventListener('click', e => {
      const n = e.target.closest('[data-n]'), s = e.target.closest('[data-style]'), a = e.target.closest('[data-a]');
      const cat = e.target.closest('[data-cat]');
      if (cat) {
        S.click(); const c = cat.dataset.cat, i = st.cats.indexOf(c);
        if (i < 0) st.cats.push(c); else if (st.cats.length > 1) st.cats.splice(i, 1); else UI.toast('لازم فئة وحدة على الأقل');
        G.store.set('cats', st.cats); paintCats();
      }
      else if (a && a.dataset.a === 'allcats') { S.click(); st.cats = st.cats.length === ALL.length ? [ALL[0]] : ALL.slice(); G.store.set('cats', st.cats); paintCats(); }
      else if (n) { S.click(); st.n = +n.dataset.n; paintNames(); }
      else if (s) { S.pop(); st.style = s.dataset.style; paintSel(); }
      else if (a && a.dataset.a === 'back') { S.click(); UI.home(); }
      else if (a && a.dataset.a === 'go') {
        S.good(); G.store.set('cfg:' + gameId, { n: st.n, style: st.style });
        try { if (navigator.wakeLock) navigator.wakeLock.request('screen').catch(() => { }); } catch (err) { /* optional */ }
        const teams = Array.from({ length: st.n }, (_, i) => ({ name: (st.names[i] || '').trim() || DEF_NAMES[i], color: G.TEAM_COLORS[i] }));
        G.Q.cats = st.cats.length === ALL.length ? null : st.cats.slice();
        UI.clear(); mod.start({ teams, style: st.style });
      }
    });
  };

  /* ---------- in-game pieces ---------- */
  UI.teamCard = (t, i, cls) => `<div class="tcard ${cls || ''}" data-team="${i}" style="--c:${t.color}"><i class="sw"></i><span class="nm">${esc(t.name)}</span><span class="sc">${t.score | 0}</span></div>`;
  UI.setScore = (card, to) => {
    const sc = card.querySelector('.sc'), from = +sc.textContent || 0; if (from === to) return;
    const t0 = performance.now(); card.classList.remove('bump'); void card.offsetWidth; card.classList.add('bump');
    const step = now => { const p = Math.min(1, (now - t0) / 600); sc.textContent = Math.round(from + (to - from) * U.ease.outCubic(p)); if (p < 1) requestAnimationFrame(step); };
    requestAnimationFrame(step);
  };

  UI.pauseBtn = handlers => {
    const b = UI.mount('<button class="menubtn" aria-label="القائمة"><i></i><i></i><i></i></button>');
    b.addEventListener('click', () => {
      S.click(); G.paused = true;
      const ov = UI.mount(`<div class="ov pause"><div class="pcard"><h2>وقفة</h2>
        <button class="btn mint" data-a="go">كمّل</button><button class="btn" data-a="again">من جديد</button>
        <button class="btn dark" data-a="home">القائمة الرئيسية</button>
        <button class="btn dark sm" data-a="sound">${G.audio.muted ? 'الصوت: طافي' : 'الصوت: شغّال'}</button></div></div>`);
      ov.addEventListener('click', e => {
        const a = e.target.closest('[data-a]'); if (!a) return; S.click();
        if (a.dataset.a === 'sound') { G.audio.setMuted(!G.audio.muted); a.textContent = G.audio.muted ? 'الصوت: طافي' : 'الصوت: شغّال'; return; }
        G.paused = false; ov.remove();
        if (a.dataset.a === 'again') handlers.again(); else if (a.dataset.a === 'home') UI.home();
      });
    });
    return b;
  };

  /* ---------- question card ---------- */
  const ZC = { 200: '#1FE0A8', 400: '#FFD23F', 600: '#FF2E63' };
  const QTIME = { 200: 35, 400: 40, 600: 45 };
  UI.ask = o => new Promise(res => {
    const q = G.Q.next(o.level), total = QTIME[o.level];
    const el = UI.mount(`<div class="ov qov"><div class="qcard" style="--zc:${ZC[o.level]};--c:${o.color}">
      <div class="pts">${o.level}</div><div class="cat">${esc(q.c)}</div>
      <div class="qwho">سؤال <b>${esc(o.team)}</b>${o.note ? ' · ' + esc(o.note) : ''}</div>
      <div class="qtext">${esc(q.q)}</div>
      <div class="qans" hidden><small>الجواب</small>${esc(q.a)}</div>
      <div class="tbar"><i></i><span>${total}</span></div>
      <div class="qbtns"><button class="btn" data-a="reveal">اكشف الجواب</button></div>
    </div></div>`);
    const bar = el.querySelector('.tbar i'), num = el.querySelector('.tbar span'), t0 = performance.now();
    let lastS = total, done = false, revealed = false;
    S.whoosh();
    const iv = setInterval(() => {
      const left = Math.max(0, total - (performance.now() - t0) / 1000), s = Math.ceil(left);
      bar.style.transform = 'scaleX(' + (left / total) + ')'; num.textContent = s;
      if (s <= 5) el.querySelector('.tbar').classList.add('low');
      if (s !== lastS) { lastS = s; if (s <= 5 && s > 0) S.tick(); }
      if (left <= 0) reveal(true);
    }, 100);
    function reveal(timeout) {
      if (revealed) return; revealed = true; clearInterval(iv); S.pop();
      el.querySelector('.qans').hidden = false; el.querySelector('.tbar').hidden = true;
      if (timeout) el.querySelector('.qwho').innerHTML = '<b>خلص الوقت!</b>';
      el.querySelector('.qbtns').innerHTML = '<button class="btn mint" data-a="yes">جاوبوا صح</button><button class="btn hot" data-a="no">جاوبوا غلط</button>';
    }
    el.addEventListener('click', e => {
      const a = e.target.closest('[data-a]'); if (!a || done) return;
      if (a.dataset.a === 'reveal') return reveal(false);
      done = true; const ok = a.dataset.a === 'yes'; el.classList.add('out');
      setTimeout(() => { el.remove(); res(ok); }, 260);
    });
  });

  /* ---------- results ---------- */
  UI.results = o => {
    const el = UI.mount(`<div class="ov resov"><div class="rcard" style="--c:${o.color || '#FFD23F'}">
      <div class="rkick">${esc(o.kicker || '')}</div><h1>${esc(o.title)}</h1>${o.sub ? `<p>${esc(o.sub)}</p>` : ''}
      <div class="rrows">${(o.rows || []).map(r => `<div class="rrow" style="--c:${r.color}"><i></i><span>${esc(r.name)}</span>${r.tag ? `<em>${esc(r.tag)}</em>` : ''}<b>${r.score == null ? '' : r.score}</b></div>`).join('')}</div>
      <div class="rbtns"><button class="btn" data-a="again">لعبة ثانية</button><button class="btn dark" data-a="home">القائمة الرئيسية</button></div>
    </div></div>`);
    el.addEventListener('click', e => { const a = e.target.closest('[data-a]'); if (!a) return; S.click(); el.remove(); if (a.dataset.a === 'again') o.onAgain(); else UI.home(); });
  };
})();
