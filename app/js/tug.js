/* tug.js — شد الحبل: pick a pull strength, answer, drag the other team into the pit. */
(function () {
  'use strict';
  const G = window.G, U = G.U, E = U.ease, S = G.sfx, INK = G.INK;
  const GY = 650, RY = GY - 150, HY = GY + 130, EL = 640, ER = 960, KP = 1.35;
  const POW = [
    { n: 'شدّة خفيفة', l: 200, amt: 15, p: 2, c: '#1FE0A8' },
    { n: 'شدّة قوية', l: 400, amt: 25, p: 3, c: '#FFD23F' },
    { n: 'شدّة وحشية', l: 600, amt: 40, p: 4, c: '#FF2E63' }
  ];
  const SKINS = ['#F2B38A', '#D9925F', '#A66A3F'];

  /* ---------- background painters ---------- */
  const sky = (c, cols) => { c.fillStyle = U.lin(c, 0, 0, 0, GY + 40, cols); c.fillRect(0, 0, 1600, 900); };
  const ridge = (c, y, amp, f, col, ph) => { c.beginPath(); c.moveTo(0, 900); for (let x = 0; x <= 1600; x += 20) c.lineTo(x, y + Math.sin(x * f + ph) * amp + Math.sin(x * f * 2.3 + ph * 2) * amp * .35); c.lineTo(1600, 900); c.closePath(); c.fillStyle = col; c.fill(); };
  const cloud = (c, x, y, s) => { c.fillStyle = 'rgba(255,255,255,.85)'; c.beginPath(); c.arc(x, y, 34 * s, 0, 7); c.arc(x + 40 * s, y - 14 * s, 44 * s, 0, 7); c.arc(x + 90 * s, y, 36 * s, 0, 7); c.fill(); c.fillRect(x, y, 90 * s, 34 * s); };

  const BGS = {
    desert: {
      name: 'الصحراء', hz: 'sand', cliff: ['#D98E48', '#A05A26'], top: '#F4CD8C',
      far(c) {
        sky(c, ['#2B6F8F', '#F2B36B', '#FFDCA6']); c.fillStyle = '#FFF0C2'; c.beginPath(); c.arc(1260, 170, 74, 0, 7); c.fill();
        ridge(c, 470, 40, .004, '#E3A65E', 1); ridge(c, 545, 30, .006, '#CC8842', 3);
        for (const x of [230, 1390]) { c.fillStyle = '#2E6B52'; c.strokeStyle = INK; c.lineWidth = 5; U.rr(c, x, 470, 34, 180, 17); c.fill(); c.stroke(); U.rr(c, x - 40, 510, 26, 70, 13); c.fill(); c.stroke(); U.rr(c, x + 48, 490, 26, 80, 13); c.fill(); c.stroke(); }
      }
    },
    river: {
      name: 'النهر', hz: 'water', cliff: ['#8A5A30', '#5A3619'], top: '#6BCB4F',
      far(c) {
        sky(c, ['#49B6EE', '#CFF3E6']); cloud(c, 220, 150, 1.1); cloud(c, 980, 110, .9); cloud(c, 1340, 220, .7);
        ridge(c, 480, 50, .004, '#58B868', 0); ridge(c, 560, 28, .007, '#33924F', 2);
        const r = U.srand(4); for (let i = 0; i < 12; i++) { const x = 40 + i * 135 + r() * 50, s = .7 + r() * .6; c.fillStyle = '#1F6B3C'; for (let k = 0; k < 3; k++) { c.beginPath(); c.moveTo(x, 430 + k * 34 * s); c.lineTo(x + 40 * s, 520 + k * 34 * s); c.lineTo(x - 40 * s, 520 + k * 34 * s); c.fill(); } }
      }
    },
    lava: {
      name: 'الحمم', hz: 'lava', cliff: ['#4E3846', '#261924'], top: '#705264',
      far(c) {
        sky(c, ['#1A0812', '#5E1A14', '#C24A1C']);
        c.fillStyle = '#2A1420'; c.beginPath(); c.moveTo(250, 660); c.lineTo(640, 200); c.lineTo(760, 200); c.lineTo(1150, 660); c.fill();
        c.save(); c.shadowColor = '#FF8A3D'; c.shadowBlur = 60; c.fillStyle = '#FFB02E'; c.beginPath(); c.ellipse(700, 204, 62, 14, 0, 0, 7); c.fill(); c.restore();
        c.strokeStyle = '#FF7A2E'; c.lineWidth = 12; c.lineCap = 'round'; c.beginPath(); c.moveTo(690, 214); c.quadraticCurveTo(650, 380, 720, 470); c.quadraticCurveTo(770, 560, 700, 660); c.stroke();
        ridge(c, 580, 26, .009, '#1B0F18', 2);
      },
      fx(c, t) { for (let i = 0; i < 16; i++) { const ph = (t * .22 + i / 16) % 1; c.fillStyle = 'rgba(255,' + (140 + (i % 3) * 40) + ',60,' + (1 - ph) + ')'; c.fillRect((i * 137.5) % 1600 + Math.sin(t + i) * 24, GY + 40 - ph * 560, 6, 6); } }
    },
    peaks: {
      name: 'بين الجبال', hz: 'chasm', cliff: ['#8E99AD', '#525B73'], top: '#F4F8FF',
      far(c) {
        sky(c, ['#3F97EC', '#DCEFFF']);
        const m = (x, w, h, col) => { c.fillStyle = col; c.beginPath(); c.moveTo(x - w, 700); c.lineTo(x, 700 - h); c.lineTo(x + w, 700); c.fill(); c.fillStyle = '#fff'; c.beginPath(); c.moveTo(x, 700 - h); c.lineTo(x - w * .22, 700 - h * .78); c.lineTo(x - w * .08, 700 - h * .82); c.lineTo(x + w * .06, 700 - h * .74); c.lineTo(x + w * .22, 700 - h * .78); c.fill(); };
        m(300, 380, 470, '#7D8FB5'); m(1250, 420, 520, '#7D8FB5'); m(760, 460, 400, '#5F7098'); m(1560, 300, 330, '#5F7098'); m(40, 280, 300, '#5F7098');
        cloud(c, 520, 170, .9); cloud(c, 1040, 250, .7);
      },
      fx(c, t) { c.fillStyle = 'rgba(255,255,255,.8)'; for (let i = 0; i < 34; i++) { const y = (i * 61 + t * (40 + i % 5 * 12)) % 900; c.beginPath(); c.arc((i * 211.3) % 1600 + Math.sin(t + i) * 22, y, 2 + i % 3, 0, 7); c.fill(); } }
    },
    ship: {
      name: 'عرض البحر', hz: 'sea', cliff: ['#9A6634', '#63401E'], top: '#CFA066',
      far(c) {
        sky(c, ['#22326E', '#C85A6E', '#FFB36B']); c.fillStyle = '#FFE08A'; c.beginPath(); c.arc(800, 540, 110, Math.PI, 0); c.fill();
        c.fillStyle = U.lin(c, 0, 540, 0, 900, ['#2F6FB0', '#123E78']); c.fillRect(0, 540, 1600, 360);
        c.fillStyle = 'rgba(255,224,138,.5)'; const r = U.srand(8); for (let i = 0; i < 9; i++) c.fillRect(720 + r() * 120, 548 + i * 11, 40 + r() * 70, 4);
        for (const x of [300, 1300]) {
          c.strokeStyle = INK; c.lineWidth = 6; c.fillStyle = '#6A4320'; c.fillRect(x - 9, 150, 18, 500); c.strokeRect(x - 9, 150, 18, 500);
          const d = x < 800 ? 1 : -1; c.beginPath(); c.moveTo(x + d * 14, 190); c.quadraticCurveTo(x + d * 250, 300, x + d * 14, 500); c.closePath(); c.fillStyle = '#FFF3DA'; c.fill(); c.stroke();
          c.beginPath(); c.moveTo(x, 150); c.lineTo(x - d * 70, 170); c.lineTo(x, 192); c.closePath(); c.fillStyle = '#FF2E63'; c.fill(); c.stroke();
        }
      }
    },
    stadium: {
      name: 'الملعب', hz: 'mud', cliff: ['#2B7A3F', '#184A26'], top: '#46C962',
      far(c) {
        sky(c, ['#0A1030', '#1B2A5E', '#24346E']);
        for (const x of [180, 620, 980, 1420]) { c.fillStyle = 'rgba(255,255,255,.07)'; c.beginPath(); c.moveTo(x - 16, 96); c.lineTo(x + 16, 96); c.lineTo(x + 260, 640); c.lineTo(x - 260, 640); c.fill(); c.fillStyle = '#2A2F4A'; c.fillRect(x - 5, 96, 10, 200); c.fillStyle = '#FFF3DA'; U.rr(c, x - 46, 60, 92, 40, 8); c.fill(); c.strokeStyle = INK; c.lineWidth = 5; c.stroke(); }
        c.fillStyle = '#161C40'; c.beginPath(); c.moveTo(0, 290); c.quadraticCurveTo(800, 220, 1600, 290); c.lineTo(1600, 580); c.lineTo(0, 580); c.fill();
        const r = U.srand(12), cols = ['#FF2E63', '#31B7FF', '#FFD23F', '#FFF3DA', '#1FE0A8', '#8B5CFF'];
        for (let y = 300; y < 570; y += 18) for (let x = 6 + (y % 36 ? 9 : 0); x < 1600; x += 18) { if (r() < .82) { c.fillStyle = cols[(r() * 6) | 0]; c.globalAlpha = .55; c.beginPath(); c.arc(x, y - Math.cos((x - 800) / 800) * 46 + 30, 6, 0, 7); c.fill(); } }
        c.globalAlpha = 1; c.fillStyle = INK; c.fillRect(0, 572, 1600, 8);
        for (let i = 0; i < 8; i++) { c.fillStyle = ['#FF2E63', '#FFD23F', '#31B7FF', '#1FE0A8'][i % 4]; c.fillRect(i * 200, 580, 200, 34); } c.fillStyle = INK; c.fillRect(0, 612, 1600, 6);
        c.fillStyle = '#2FA04A'; c.fillRect(0, 618, 1600, 40);
      },
      fx(c, t) { for (let i = 0; i < 7; i++) { const tt = t * 1.6 + i * .613, ph = tt % 1; if (ph > .14) continue; const r = U.srand(((tt | 0) * 31 + i) | 0); c.fillStyle = 'rgba(255,255,255,' + (1 - ph / .14) + ')'; const x = r() * 1600, y = 300 + r() * 250; c.beginPath(); c.arc(x, y, 9, 0, 7); c.fill(); c.fillRect(x - 22, y - 2, 44, 4); c.fillRect(x - 2, y - 22, 4, 44); } }
    },
    space: {
      name: 'الفضاء', hz: 'void', cliff: ['#77739E', '#3B385A'], top: '#A7A2D2',
      far(c) {
        c.fillStyle = U.lin(c, 0, 0, 0, 900, ['#07061A', '#1B1140']); c.fillRect(0, 0, 1600, 900);
        for (const [x, y, rr, col] of [[400, 300, 420, 'rgba(139,92,255,.22)'], [1200, 620, 480, 'rgba(255,46,99,.14)']]) { const g = c.createRadialGradient(x, y, 0, x, y, rr); g.addColorStop(0, col); g.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = g; c.fillRect(0, 0, 1600, 900); }
        const r = U.srand(21); for (let i = 0; i < 220; i++) { c.fillStyle = 'rgba(255,255,255,' + (.25 + r() * .7) + ')'; const s = 1.5 + r() * 2.5; c.fillRect(r() * 1600, r() * 900, s, s); }
        c.fillStyle = '#FF8A3D'; c.beginPath(); c.arc(1270, 220, 112, 0, 7); c.fill(); c.fillStyle = 'rgba(0,0,0,.25)'; c.beginPath(); c.arc(1300, 245, 112, 0, 7); c.save(); c.clip(); c.beginPath(); c.arc(1270, 220, 112, 0, 7); c.fill(); c.restore();
        c.strokeStyle = '#FFD23F'; c.lineWidth = 10; c.beginPath(); c.ellipse(1270, 220, 190, 40, -.3, 0, 7); c.stroke();
      }
    }
  };
  Object.keys(BGS).forEach(id => { BGS[id].id = id; });

  function cliffs(c, B) {
    for (const s of [-1, 1]) {
      c.save(); if (s === 1) { c.translate(1600, 0); c.scale(-1, 1); }
      c.beginPath(); c.moveTo(-60, GY + 10); c.lineTo(EL, GY + 10); c.lineTo(EL - 26, GY + 78); c.lineTo(EL - 8, GY + 160); c.lineTo(EL - 44, 920); c.lineTo(-60, 920); c.closePath();
      c.fillStyle = U.lin(c, 0, GY, 0, 900, B.cliff); c.fill(); c.lineWidth = 6; c.strokeStyle = INK; c.lineJoin = 'round'; c.stroke();
      c.strokeStyle = 'rgba(0,0,0,.2)'; c.lineWidth = 5; c.lineCap = 'round';
      for (let i = 0; i < 4; i++) { c.beginPath(); c.moveTo(40 + i * 150, GY + 70 + (i % 2) * 44); c.lineTo(150 + i * 150, GY + 60 + (i % 2) * 44); c.stroke(); }
      U.rr(c, -70, GY - 8, EL + 82, 34, 14); c.fillStyle = B.top; c.fill(); c.lineWidth = 6; c.strokeStyle = INK; c.stroke();
      c.fillStyle = 'rgba(255,255,255,.3)'; U.rr(c, -60, GY - 3, EL + 62, 7, 3); c.fill();
      c.restore();
    }
  }
  function liquid(c, t, cols, foam, amp, glow) {
    const wave = (x, o) => HY + o + Math.sin(x * .035 + t * 2.2) * amp + Math.sin(x * .08 - t * 3.1) * amp * .4;
    c.save(); if (glow) { c.shadowColor = glow; c.shadowBlur = 50; }
    c.beginPath(); c.moveTo(560, 920); for (let x = 560; x <= 1040; x += 16) c.lineTo(x, wave(x, 0)); c.lineTo(1040, 920); c.closePath();
    c.fillStyle = U.lin(c, 0, HY, 0, 900, cols); c.fill(); c.restore(); c.lineWidth = 6; c.strokeStyle = INK; c.stroke();
    c.strokeStyle = foam; c.lineWidth = 5; c.lineCap = 'round'; c.beginPath(); for (let x = 600; x <= 1000; x += 16) { const y = wave(x, 12); if (x === 600) c.moveTo(x, y); else c.lineTo(x, y); } c.stroke();
  }
  function bubbles(c, t, col, n, sp) { c.strokeStyle = col; c.lineWidth = 4; for (let i = 0; i < n; i++) { const ph = (t * sp + i * .37) % 1; c.globalAlpha = 1 - ph; c.beginPath(); c.arc(610 + (i * 97) % 380, HY + 34 + (i % 3) * 22, 4 + ph * 15, 0, 7); c.stroke(); } c.globalAlpha = 1; }
  function hazard(c, hz, t) {
    if (hz === 'water') liquid(c, t, ['#4CC0F5', '#1B5FA8'], 'rgba(255,255,255,.7)', 7);
    else if (hz === 'sea') {
      liquid(c, t, ['#2F7FC8', '#123E78'], 'rgba(255,255,255,.6)', 9);
      const x = 800 + Math.sin(t * .7) * 130, d = Math.cos(t * .7) > 0 ? 1 : -1; c.fillStyle = '#3A4660'; c.strokeStyle = INK; c.lineWidth = 5; c.lineJoin = 'round'; c.beginPath(); c.moveTo(x - 26 * d, HY + 14); c.quadraticCurveTo(x - 6 * d, HY - 40, x + 20 * d, HY - 46); c.lineTo(x + 24 * d, HY + 14); c.closePath(); c.fill(); c.stroke();
    }
    else if (hz === 'mud') { liquid(c, t * .4, ['#96643A', '#55351B'], 'rgba(255,220,170,.35)', 4); bubbles(c, t, 'rgba(255,220,170,.6)', 4, .3); }
    else if (hz === 'lava') {
      c.fillStyle = U.lin(c, 0, GY, 0, HY, ['rgba(255,138,61,0)', 'rgba(255,138,61,.45)']); c.fillRect(600, GY, 400, HY - GY + 10);
      liquid(c, t * .6, ['#FFC23A', '#E8421A'], 'rgba(255,240,180,.8)', 6, '#FF8A3D'); bubbles(c, t, '#FFE9A0', 6, .55);
    }
    else if (hz === 'sand') {
      c.fillStyle = U.lin(c, 0, HY, 0, 900, ['#EEC684', '#B8833F']); c.beginPath(); c.moveTo(560, 920); for (let x = 560; x <= 1040; x += 20) c.lineTo(x, HY + 6 + Math.sin(x * .05) * 5); c.lineTo(1040, 920); c.fill(); c.lineWidth = 6; c.strokeStyle = INK; c.stroke();
      c.strokeStyle = 'rgba(120,80,30,.45)'; c.lineWidth = 4; for (let i = 0; i < 3; i++) { c.beginPath(); c.ellipse(800, HY + 62, 150 - i * 46, 28 - i * 8, 0, t * .8 + i * 2, t * .8 + i * 2 + 4.4); c.stroke(); }
    }
    else if (hz === 'chasm') {
      c.fillStyle = U.lin(c, 0, GY + 20, 0, 900, ['rgba(11,14,36,0)', '#0B0E24']); c.fillRect(580, GY + 20, 440, 280);
      c.fillStyle = 'rgba(255,255,255,.16)'; for (let i = 0; i < 3; i++) { c.beginPath(); c.ellipse(800 + Math.sin(t * .3 + i * 2) * 110, 800 + i * 34, 130, 22, 0, 0, 7); c.fill(); }
    }
  }

  /* ---------- characters ---------- */
  function limb(c, p, w, col) { c.lineCap = 'round'; c.lineJoin = 'round'; c.beginPath(); c.moveTo(p[0], p[1]); for (let i = 2; i < p.length; i += 2) c.lineTo(p[i], p[i + 1]); c.lineWidth = w + 9; c.strokeStyle = INK; c.stroke(); c.lineWidth = w; c.strokeStyle = col; c.stroke(); }
  function ik(ax, ay, bx, by, l1, l2, pickFn) {
    const dx = bx - ax, dy = by - ay, d = U.clamp(Math.hypot(dx, dy), Math.abs(l1 - l2) + .01, l1 + l2 - .01), a = Math.atan2(dy, dx), k = Math.acos((l1 * l1 + d * d - l2 * l2) / (2 * l1 * d));
    const p = [ax + Math.cos(a + k) * l1, ay + Math.sin(a + k) * l1], q = [ax + Math.cos(a - k) * l1, ay + Math.sin(a - k) * l1];
    return pickFn(p, q) ? p : q;
  }
  const shoe = (c, x, y) => { c.fillStyle = '#1B1626'; c.strokeStyle = INK; c.lineWidth = 5; U.rr(c, x - 30, y - 16, 48, 20, 9); c.fill(); c.stroke(); c.fillStyle = '#FFF3DA'; c.fillRect(x - 26, y - 1, 40, 4); };
  function mkChar(team, idx) {
    const side = team === 0 ? 1 : -1;
    return { team, idx, side, coord: side * (300 + idx * 100), sc: [.9, 1.02, .84][idx], bw: [60, 78, 52][idx], skin: SKINS[(idx + team) % 3], look: (idx + team * 2) % 3, lean: .32, squat: 0, face: 'strain', state: 'rope', ph: U.rand(6.28), x: 0, y: GY, vx: 0, vy: 0, grav: 0, rot: 0, vr: 0, shrink: 1, alpha: 1, jump: 0 };
  }
  function drawChar(c, ch, t, col) {
    if (ch.state === 'gone') return;
    if (ch.state === 'stuck') { c.save(); c.translate(ch.x, HY + 16); for (const s of [-1, 1]) { const w = Math.sin(t * 9 + ch.ph + s) * 12; limb(c, [s * 12, 0, s * 18 + w, -50], 17, '#2A2440'); shoe(c, s * 18 + w + 6, -54); } c.restore(); return; }
    c.save(); c.globalAlpha = ch.alpha; c.translate(ch.x, ch.y - ch.jump);
    if (ch.rot) { c.translate(0, -110); c.rotate(ch.rot); c.translate(0, 110); }
    c.scale(ch.side * ch.sc * ch.shrink, ch.sc * ch.shrink);
    const a = ch.lean, fall = ch.state === 'fall', cheer = ch.state === 'cheer', wob = fall ? Math.sin(t * 22 + ch.ph) : 0;
    const hipY = -100 + ch.squat * 20, shX = Math.sin(a) * 86, shY = hipY - Math.cos(a) * 86, hdX = shX + Math.sin(a) * 46, hdY = shY - Math.cos(a) * 46;
    let f1 = [-66, 0], f2 = [26, 0];
    if (fall) { f1 = [-40 + wob * 28, -8 - wob * 16]; f2 = [34 - wob * 28, -6 + wob * 16]; } else if (cheer) { f1 = [-24, 0]; f2 = [24, 0]; }
    const k1 = ik(0, hipY, f1[0], f1[1], 54, 54, (p, q) => p[0] < q[0]), k2 = ik(0, hipY, f2[0], f2[1], 54, 54, (p, q) => p[0] < q[0]);
    let h1, h2;
    if (fall) { h1 = [shX - 56 + wob * 30, shY - 54 - wob * 30]; h2 = [shX + 56 - wob * 30, shY - 54 + wob * 30]; }
    else if (cheer) { const w = Math.sin(t * 14 + ch.ph) * 14; h1 = [shX - 50, shY - 72 + w]; h2 = [shX + 50, shY - 72 - w]; }
    else { const hy = (RY - (ch.y - ch.jump)) / ch.sc; h1 = [-74, hy]; h2 = [-46, hy]; }
    const e1 = ik(shX, shY, h1[0], h1[1], 48, 48, (p, q) => p[1] > q[1]), e2 = ik(shX, shY, h2[0], h2[1], 48, 48, (p, q) => p[1] > q[1]);
    limb(c, [shX, shY, e2[0], e2[1], h2[0], h2[1]], 17, ch.skin);
    limb(c, [0, hipY, k2[0], k2[1], f2[0], f2[1] - 12], 22, '#2A2440'); shoe(c, f2[0], f2[1]);
    limb(c, [0, hipY, shX, shY], ch.bw, col);
    c.strokeStyle = 'rgba(0,0,0,.25)'; c.lineWidth = 7; c.beginPath(); c.moveTo(-ch.bw / 2 + 4, hipY - 4); c.lineTo(ch.bw / 2 - 4, hipY - 4); c.stroke();
    limb(c, [0, hipY, k1[0], k1[1], f1[0], f1[1] - 12], 22, '#3A3160'); shoe(c, f1[0], f1[1]);
    /* head */
    const hair = ['#1B1626', '#5A2A3A', '#1B1626'][ch.look];
    if (ch.look === 1) { c.fillStyle = hair; c.strokeStyle = INK; c.lineWidth = 5; c.beginPath(); c.arc(hdX + 40, hdY + 6, 17, 0, 7); c.fill(); c.stroke(); }
    c.fillStyle = ch.skin; c.strokeStyle = INK; c.lineWidth = 5; c.beginPath(); c.arc(hdX + 31, hdY + 3, 9, 0, 7); c.fill(); c.stroke();
    c.beginPath(); c.arc(hdX, hdY, 34, 0, 7); c.fill(); c.stroke();
    c.save(); c.beginPath(); c.arc(hdX, hdY, 34, 0, 7); c.clip();
    if (ch.look === 2) { c.fillStyle = '#FFF3DA'; c.fillRect(hdX - 40, hdY - 30, 80, 13); c.fillStyle = hair; c.fillRect(hdX - 40, hdY - 44, 80, 15); }
    else { c.fillStyle = hair; c.beginPath(); c.arc(hdX + 6, hdY - 12, 36, Math.PI * 1.02, Math.PI * 2.05); c.fill(); }
    if (ch.look === 0) { c.fillStyle = 'rgba(27,22,38,.28)'; c.beginPath(); c.arc(hdX - 4, hdY + 10, 34, .15, Math.PI - .5); c.fill(); }
    c.restore(); c.beginPath(); c.arc(hdX, hdY, 34, 0, 7); c.stroke();
    const face = fall ? 'panic' : ch.face, ex1 = hdX - 21, ex2 = hdX - 2, ey = hdY - 3;
    c.strokeStyle = INK; c.lineCap = 'round'; c.lineWidth = 5.5;
    const up = face === 'panic' ? -1 : face === 'happy' ? 0 : 1;
    c.beginPath(); c.moveTo(ex1 - 9, ey - 15 - up * 4); c.lineTo(ex1 + 8, ey - 15 + up * 4); c.moveTo(ex2 - 7, ey - 15 + up * 4); c.lineTo(ex2 + 10, ey - 15 - up * 4); c.stroke();
    if (ch.look === 2 && !fall) { c.fillStyle = INK; U.rr(c, ex1 - 12, ey - 8, 44, 16, 6); c.fill(); c.fillStyle = 'rgba(255,255,255,.7)'; c.fillRect(ex1 - 6, ey - 5, 9, 3); }
    else if (face === 'panic') { c.fillStyle = '#fff'; c.lineWidth = 3.5; for (const x of [ex1, ex2 + 2]) { c.beginPath(); c.arc(x, ey, 9, 0, 7); c.fill(); c.stroke(); } c.fillStyle = INK; for (const x of [ex1 - 2, ex2]) { c.beginPath(); c.arc(x, ey, 3.2, 0, 7); c.fill(); } }
    else if (face === 'happy') { c.lineWidth = 5; for (const x of [ex1, ex2 + 2]) { c.beginPath(); c.arc(x, ey + 2, 6, Math.PI, 0); c.stroke(); } }
    else if (face === 'yell') { c.lineWidth = 5; for (const x of [ex1, ex2 + 2]) { c.beginPath(); c.moveTo(x - 6, ey - 4); c.lineTo(x + 3, ey); c.lineTo(x - 6, ey + 4); c.stroke(); } }
    else { c.fillStyle = INK; for (const x of [ex1, ex2 + 2]) { c.beginPath(); c.ellipse(x, ey, 4.5, 3, 0, 0, 7); c.fill(); } }
    const mx = hdX - 11, my = hdY + 16;
    if (face === 'strain') { c.fillStyle = '#fff'; c.lineWidth = 3.5; U.rr(c, mx - 14, my - 6, 28, 13, 4); c.fill(); c.stroke(); c.beginPath(); for (let x = mx - 7; x < mx + 12; x += 7) { c.moveTo(x, my - 6); c.lineTo(x, my + 7); } c.stroke(); }
    else if (face === 'yell') { c.fillStyle = INK; c.beginPath(); c.ellipse(mx, my + 1, 12, 13, 0, 0, 7); c.fill(); c.fillStyle = '#FF2E63'; c.beginPath(); c.ellipse(mx, my + 8, 7, 5, 0, 0, 7); c.fill(); }
    else if (face === 'panic') { c.fillStyle = INK; c.beginPath(); c.ellipse(mx, my + 2, 10 + Math.sin(t * 30 + ch.ph) * 2, 8, 0, 0, 7); c.fill(); }
    else { c.fillStyle = INK; c.beginPath(); c.arc(mx, my - 4, 14, 0, Math.PI); c.fill(); c.fillStyle = '#fff'; c.fillRect(mx - 10, my - 4, 20, 5); }
    if (face === 'panic' && !fall) { c.fillStyle = '#8FE3FF'; c.strokeStyle = INK; c.lineWidth = 3; for (let i = 0; i < 2; i++) { const ph = (t * 1.6 + i * .5 + ch.ph) % 1; c.globalAlpha = (1 - ph) * ch.alpha; c.beginPath(); c.ellipse(hdX + 30 + i * 12 + ph * 16, hdY - 34 - i * 8 + ph * 30, 5, 8, .5, 0, 7); c.fill(); c.stroke(); } c.globalAlpha = ch.alpha; }
    limb(c, [shX, shY, e1[0], e1[1], h1[0], h1[1]], 17, ch.skin);
    for (const h of [h2, h1]) { c.fillStyle = ch.skin; c.strokeStyle = INK; c.lineWidth = 5; c.beginPath(); c.arc(h[0], h[1], 13, 0, 7); c.fill(); c.stroke(); }
    c.restore();
  }

  /* ---------- game ---------- */
  let T = null, lastOpts = null, hud = null;
  const mx = () => 800 + T.P * KP;
  const POSE = {
    idle: (ch, t) => [.34 + .035 * Math.sin(t * 5 + ch.ph), 0, 'strain'],
    anticip: () => [.08, 1, 'strain'], heave: () => [.84, .35, 'yell'], drag: () => [-.2, .2, 'panic'],
    slip: () => [-.32, .9, 'panic'], stumble: () => [1.2, 1, 'panic'], cheer: () => [0, 0, 'happy']
  };

  function splash(x, cols) {
    T.parts.emit(28, () => { const a = -Math.PI / 2 + U.rand(-.9, .9), v = U.rand(300, 860); return { x: x + U.rand(-24, 24), y: HY, vx: Math.cos(a) * v, vy: Math.sin(a) * v, g: 1900, life: U.rand(.6, 1.1), size: U.rand(9, 22), color: U.pick(cols), ink: 2 }; });
    T.parts.emit(1, () => ({ x, y: HY + 6, size: 20, grow: 280, life: .6, color: '#fff', shape: 'ring' }));
  }
  function puff(x, y, n, col) { T.parts.emit(n, () => ({ x: x + U.rand(-40, 40), y: y + U.rand(-10, 10), vx: U.rand(-160, 160), vy: U.rand(-220, -30), drag: 1.8, life: U.rand(.6, 1.3), size: U.rand(30, 60), grow: 70, color: col, shape: 'smoke' })); }
  function impact(ch) {
    const hz = T.B.hz; ch.state = 'gone'; G.shake(9);
    if (hz === 'water' || hz === 'sea') { splash(ch.x, ['#fff', '#8FE3FF', '#4CC0F5']); S.splash(); }
    else if (hz === 'mud') { splash(ch.x, ['#96643A', '#55351B', '#C89A6A']); S.splash(); }
    else if (hz === 'lava') {
      T.parts.emit(26, () => ({ x: ch.x + U.rand(-30, 30), y: HY, vx: U.rand(-200, 200), vy: U.rand(-700, -200), g: 600, life: U.rand(.5, 1), size: U.rand(12, 28), rot: U.rand(6), vr: U.rand(-6, 6), color: U.pick(['#FFD23F', '#FF8A3D', '#FF2E63']), shape: 'tri', ink: 2 }));
      puff(ch.x, HY - 10, 8, 'rgba(40,30,40,.6)'); S.sizzle(); G.flash('#FF8A3D', .2);
    }
    else { ch.state = 'stuck'; puff(ch.x, HY, 9, 'rgba(240,210,150,.6)'); S.poof(); }
  }
  function startFall(ch) {
    const d = -ch.side, voidy = T.B.hz === 'void';
    ch.state = 'fall'; ch.vx = d * (voidy ? 60 + ch.idx * 40 : 110 + ch.idx * 95); ch.vy = voidy ? -150 : -430; ch.vr = d * (voidy ? 1.6 : 5.5); ch.grav = voidy ? 0 : 2200;
    if (voidy || T.B.hz === 'chasm') S.fall(); else S.whoosh();
  }
  function pop(team, text, col) { T.pops.push({ x: mx() + (team === 0 ? 1 : -1) * 450, y: GY - 330, text, color: col, age: 0 }); }

  function mountHud() {
    const UI = G.UI; UI.clear(); UI.pauseBtn({ again: () => G.Tug.start(lastOpts) });
    const cards = T.teams.map((t, i) => { const el = UI.mount(UI.teamCard(t, i)); el.querySelector('.sc').textContent = ''; el.style.top = '24px'; el.style.width = '330px'; if (i === 0) el.style.right = '30px'; else el.style.left = '110px'; return el; });
    hud = { cards, menu: null, turn(i) { cards.forEach((c, k) => c.classList.toggle('turn', k === i)); }, clearMenu() { if (this.menu) { this.menu.remove(); this.menu = null; } } };
  }
  function beginTurn() {
    T.phase = 'choose'; hud.turn(T.turn); hud.clearMenu();
    const t = T.teams[T.turn];
    hud.menu = G.UI.mount(`<div class="powers"><div class="who" style="--c:${t.color}">دور <b>${U.esc(t.name)}</b> · اختاروا قوة الشدّة</div><div class="row">${POW.map((p, i) => `<button class="pbtn" data-p="${i}" style="--zc:${p.c}"><b>${p.n}</b><span>سؤال ${p.l} · تسحب ${p.amt}</span></button>`).join('')}</div></div>`);
    hud.menu.addEventListener('click', e => { const b = e.target.closest('[data-p]'); if (b && T && T.phase === 'choose') onPower(+b.dataset.p); });
  }
  async function onPower(i) {
    const my = T, t = T.turn, team = T.teams[t], p = POW[i];
    T.phase = 'question'; hud.clearMenu(); S.pop();
    const ok = await G.UI.ask({ level: p.l, team: team.name, color: team.color, note: p.n });
    if (T !== my) return;
    T.phase = 'anim';
    const w = ok ? t : 1 - t;
    if (ok) { S.good(); pop(t, 'صح!', '#1FE0A8'); await G.wait(.3); }
    else { T.anim[t] = 'slip'; S.bad(); G.flash('#FF2E63', .2); G.shake(8); pop(t, 'غلط!', '#FF2E63'); await G.wait(.6); }
    if (T !== my) return;
    await heave(w, (w === 0 ? 1 : -1) * p.amt, p.p); if (T !== my) return;
    if (Math.abs(T.P) >= 100) return finishGame(T.P > 0 ? 0 : 1);
    T.turn = 1 - T.turn; beginTurn();
  }
  async function heave(w, dP, pulses) {
    const my = T, l = 1 - w, step = dP / pulses;
    G.tween(G.cam, { zoom: 1.05 }, .3);
    for (let i = 0; i < pulses; i++) {
      T.anim[w] = 'anticip'; await G.wait(.17); if (T !== my) return;
      T.anim[w] = 'heave'; T.anim[l] = 'drag'; S.grunt(); S.creak(); G.shake(7); T.tension = 2.6;
      await G.tween(T, { P: U.clamp(T.P + step, -104, 104) }, .3, E.outCubic); if (T !== my) return;
      await G.wait(.1); if (T !== my) return;
      if (Math.abs(T.P) >= 100) break;
    }
    if (Math.abs(T.P) < 100) { T.anim[0] = T.anim[1] = 'idle'; G.tween(G.cam, { zoom: 1 }, .4); if (Math.abs(T.P) >= 60) { const d = T.P > 0 ? 1 : 0; pop(d, 'على الحافة!', '#FFD23F'); S.heart(); } }
  }
  async function finishGame(w) {
    const my = T, l = 1 - w; T.phase = 'finish'; hud.clearMenu(); hud.turn(-1);
    G.slowmo(.3, .9); S.slam(); G.shake(18); T.anim[w] = 'heave'; T.anim[l] = 'drag';
    const losers = T.chars.filter(c => c.team === l).sort((a, b) => a.idx - b.idx), edge = l === 1 ? EL + 22 : ER - 22;
    for (const ch of losers) {
      ch.state = 'drag';
      await G.tween(ch, { x: edge }, .3 + .06 * ch.idx, E.inQuad); if (T !== my) return;
      startFall(ch); await G.wait(.24); if (T !== my) return;
    }
    T.slack = true; T.anim[w] = 'stumble'; S.thud(); G.tween(G.cam, { zoom: 1 }, .5);
    await G.wait(.75); if (T !== my) return;
    T.anim[w] = 'cheer'; T.chars.forEach(c => { if (c.team === w) c.state = 'cheer'; }); S.cheer(); hud.cards[l].classList.add('dead');
    const col = T.teams[w].color;
    T.parts.emit(110, () => ({ x: U.rand(0, 1600), y: U.rand(-300, -20), vx: U.rand(-60, 60), vy: U.rand(120, 420), g: 300, drag: .6, life: U.rand(2.2, 3.4), size: U.rand(12, 22), rot: U.rand(6), vr: U.rand(-9, 9), color: U.pick([col, '#fff', '#FFD23F']), shape: 'rect', ink: 2 }));
    await G.wait(2.1); if (T !== my) return;
    T.phase = 'end';
    G.UI.results({ kicker: T.teams[l].name + ' ' + ({ sand: 'انغرسوا في الرمل', water: 'طاحوا في النهر', sea: 'صاروا عشا للقرش', mud: 'تمرّغوا في الطين', lava: 'انشووا في الحمم', chasm: 'طاحوا في الهاوية', void: 'ضاعوا في الفضاء' })[T.B.hz], title: T.teams[w].name + ' فازوا', color: col, rows: [], onAgain: () => G.Tug.start(lastOpts) });
  }

  function drawRope(c, t) {
    const M = mx(), held = T.chars.filter(ch => ch.state === 'rope' || ch.state === 'drag' || (ch.state === 'cheer' && false));
    const hx = ch => ch.x - ch.side * ch.sc * 60;
    let xs = held.map(hx); const wT = T.slack ? T.chars.filter(ch => ch.team === T.win) : null;
    c.lineCap = 'round'; c.lineJoin = 'round';
    const stroke = () => { c.setLineDash([]); c.lineWidth = 17; c.strokeStyle = INK; c.stroke(); c.lineWidth = 10; c.strokeStyle = '#E2B36C'; c.stroke(); c.setLineDash([12, 11]); c.lineDashOffset = -T.P * KP; c.lineWidth = 4; c.strokeStyle = '#A9773A'; c.stroke(); c.setLineDash([]); };
    if (!xs.length) return;
    const xL = Math.min.apply(null, xs) - 18, xR = Math.max.apply(null, xs) + 18, v = T.tension;
    c.beginPath(); c.moveTo(xL - 120, GY - 8); c.quadraticCurveTo(xL - 70, GY - 6, xL - 44, RY + 70); c.quadraticCurveTo(xL - 30, RY + 6, xL, RY);
    if (T.slack && wT) {
      const s = wT[0].side, inner = s === 1 ? xL : xR, e = s === 1 ? ER : EL;
      if (s === 1) { c.beginPath(); c.moveTo(e - 16, HY + 60); c.lineTo(e - 2, GY); c.quadraticCurveTo((e + inner) / 2, GY + 6, inner, RY + 30); c.lineTo(xR, RY + 30); c.quadraticCurveTo(xR + 40, RY + 40, xR + 60, GY - 8); }
      else { c.beginPath(); c.moveTo(xL - 60, GY - 8); c.quadraticCurveTo(xL - 40, RY + 40, xL, RY + 30); c.lineTo(inner, RY + 30); c.quadraticCurveTo((e + inner) / 2, GY + 6, e + 2, GY); c.lineTo(e + 16, HY + 60); }
      stroke(); return;
    }
    for (let x = xL; x <= xR; x += 22) c.lineTo(x, RY + Math.sin(x * .09 + t * 40) * v);
    c.lineTo(xR, RY); c.quadraticCurveTo(xR + 30, RY + 6, xR + 44, RY + 70); c.quadraticCurveTo(xR + 70, GY - 6, xR + 120, GY - 8);
    stroke();
    if (M > xL && M < xR) {
      c.save(); c.translate(M, RY); c.rotate(T.flag);
      c.beginPath(); c.moveTo(-11, 0); c.lineTo(11, 0); c.lineTo(11, 54); c.lineTo(0, 42); c.lineTo(-11, 54); c.closePath(); c.fillStyle = '#FF2E63'; c.fill(); c.lineWidth = 5; c.strokeStyle = INK; c.stroke();
      c.beginPath(); c.arc(0, 0, 11, 0, 7); c.fillStyle = '#fff'; c.fill(); c.stroke(); c.restore();
    }
  }
  function drawMeter(c) {
    const y = 72, x0 = 520, w = 560, h = 30;
    c.save(); U.rr(c, x0, y - h / 2, w, h, 15); c.fillStyle = INK; c.fill(); c.clip();
    c.fillStyle = T.teams[1].color; c.fillRect(x0, y - h / 2, w / 2, h); c.fillStyle = T.teams[0].color; c.fillRect(800, y - h / 2, w / 2, h);
    c.fillStyle = 'rgba(18,14,28,.45)'; c.fillRect(x0, y - h / 2, 44, h); c.fillRect(x0 + w - 44, y - h / 2, 44, h); c.restore();
    U.rr(c, x0, y - h / 2, w, h, 15); c.lineWidth = 5; c.strokeStyle = INK; c.stroke();
    c.fillStyle = '#fff'; c.fillRect(797, y - h / 2 - 8, 6, h + 16);
    const X = 800 + U.clamp(T.P, -100, 100) * 2.58;
    c.beginPath(); c.arc(X, y, 24, 0, 7); c.fillStyle = '#fff'; c.fill(); c.lineWidth = 6; c.strokeStyle = INK; c.stroke();
    c.beginPath(); c.arc(X, y, 9, 0, 7); c.fillStyle = '#FF2E63'; c.fill();
  }

  const Scene = {
    enter(opts) {
      const B = BGS[opts.style] || BGS.desert;
      T = { B, teams: opts.teams.map(t => ({ name: t.name, color: t.color, score: 0 })), P: 0, lastP: 0, turn: 0, phase: 'intro', anim: ['idle', 'idle'], chars: [], parts: new G.Particles(), pops: [], t: 0, tension: .8, flag: 0, flagV: 0, slack: false, win: -1, dustT: 0 };
      for (let tm = 0; tm < 2; tm++) for (let i = 2; i >= 0; i--) T.chars.push(mkChar(tm, i));
      T.far = G.buffer(c => B.far(c)); T.cl = G.buffer(c => cliffs(c, B));
      mountHud();
      const vs = G.UI.mount(`<div class="vs"><span class="n" style="--c:${T.teams[0].color}">${U.esc(T.teams[0].name)}</span><span class="x">ضد</span><span class="n" style="--c:${T.teams[1].color}">${U.esc(T.teams[1].name)}</span></div>`);
      S.slam(); G.shake(10); const my = T;
      G.wait(1.7).then(() => { vs.classList.add('out'); setTimeout(() => vs.remove(), 320); if (T === my) beginTurn(); });
    },
    exit() { T = null; hud = null; },
    update(dt, real) {
      if (!T) return; T.t += dt;
      if (T.far._res !== G.res) { T.far = G.buffer(c => T.B.far(c)); T.cl = G.buffer(c => cliffs(c, T.B)); }
      const vP = dt > 0 ? (T.P - T.lastP) / dt : 0; T.lastP = T.P;
      T.tension += (.8 - T.tension) * Math.min(1, dt * 3);
      T.flagV += (-T.flag * 60 - T.flagV * 5 - vP * .05) * dt; T.flag += T.flagV * dt; T.flag = U.clamp(T.flag, -1, 1);
      if (T.phase === 'finish' && T.win < 0) T.win = T.P > 0 ? 0 : 1;
      const M = mx(), danger = Math.abs(T.P) >= 60 ? (T.P > 0 ? 1 : 0) : -1;
      T.dustT -= dt;
      for (const ch of T.chars) {
        const pose = POSE[T.anim[ch.team]](ch, T.t);
        if (ch.state === 'rope') { ch.x = M + ch.coord + ch.side * ch.sc * 60; }
        if (ch.state === 'rope' || ch.state === 'drag' || ch.state === 'cheer') {
          const rate = Math.min(1, dt * (17 - ch.idx * 3.5));
          ch.lean += (pose[0] - ch.lean) * rate; ch.squat += (pose[1] - ch.squat) * rate; ch.face = pose[2];
          if (ch.team === danger && ch.idx === 0 && ch.face === 'strain') ch.face = 'panic';
          ch.jump = ch.state === 'cheer' ? Math.abs(Math.sin(T.t * 8 + ch.ph)) * 48 : 0;
        } else if (ch.state === 'fall') {
          ch.vy += ch.grav * dt; ch.x += ch.vx * dt; ch.y += ch.vy * dt; ch.rot += ch.vr * dt;
          const hz = T.B.hz;
          if (hz === 'void') { ch.shrink *= Math.exp(-dt * .45); ch.alpha = U.clamp(ch.shrink * 1.4 - .25, 0, 1); if (ch.alpha <= 0 || ch.y < -300) ch.state = 'gone'; }
          else if (hz === 'chasm') { if (ch.y > 1150) { ch.state = 'gone'; const x = ch.x, my = T; G.wait(.45).then(() => { if (T === my) { puff(x, 900, 7, 'rgba(255,255,255,.5)'); S.thud(.7); G.shake(5); } }); } }
          else if (ch.y - 70 > HY) impact(ch);
        }
        if ((ch.state === 'rope' || ch.state === 'drag') && Math.abs(vP) > 12 && T.dustT <= 0 && T.B.hz !== 'void') T.parts.emit(1, () => ({ x: ch.x - ch.side * 60, y: GY - 4, vx: -ch.side * U.rand(20, 120), vy: U.rand(-90, -20), drag: 2, life: U.rand(.4, .8), size: U.rand(16, 30), grow: 50, color: 'rgba(245,235,215,.55)', shape: 'smoke' }));
      }
      if (T.dustT <= 0) T.dustT = .05;
      for (let i = T.pops.length - 1; i >= 0; i--) { T.pops[i].age += dt; if (T.pops[i].age > 1.3) T.pops.splice(i, 1); }
      T.parts.update(dt);
    },
    draw(c) {
      if (!T) return;
      c.fillStyle = INK; c.fillRect(0, 0, 1600, 900);
      c.save(); G.camApply(c);
      c.drawImage(T.far, 0, 0, 1600, 900);
      if (T.B.fx) T.B.fx(c, T.t);
      hazard(c, T.B.hz, T.t);
      for (const ch of T.chars) if (ch.state === 'stuck') drawChar(c, ch, T.t);
      c.drawImage(T.cl, 0, 0, 1600, 900);
      for (const ch of T.chars) if (ch.state !== 'stuck' && ch.state !== 'fall') drawChar(c, ch, T.t, T.teams[ch.team].color);
      drawRope(c, T.t);
      for (const ch of T.chars) if (ch.state === 'fall') drawChar(c, ch, T.t, T.teams[ch.team].color);
      for (const ch of T.chars) if (ch.state === 'rope' || ch.state === 'drag') { for (const o of [-74, -46]) { c.beginPath(); c.arc(ch.x + ch.side * ch.sc * o, RY, 13 * ch.sc, 0, 7); c.fillStyle = ch.skin; c.fill(); c.lineWidth = 5; c.strokeStyle = INK; c.stroke(); } }
      T.parts.draw(c);
      for (const p of T.pops) { const k = p.age / 1.3; c.save(); c.globalAlpha = k < .7 ? 1 : (1 - k) / .3; U.text(c, p.text, p.x, p.y - E.outCubic(k) * 70, 84 * (k < .15 ? E.outBack(k / .15) : 1), p.color); c.restore(); }
      c.restore();
      drawMeter(c);
    }
  };

  G.Tug = {
    styles: BGS,
    start(opts) { lastOpts = { teams: opts.teams.slice(0, 2), style: opts.style }; G.setScene(Scene, lastOpts); },
    preview(c, id, w, h) {
      const B = BGS[id]; c.save(); c.scale(w / 1600, h / 900); B.far(c); hazard(c, B.hz, 1); cliffs(c, B);
      c.lineCap = 'round'; c.beginPath(); c.moveTo(120, RY + 60); c.lineTo(1480, RY + 60); c.lineWidth = 26; c.strokeStyle = INK; c.stroke(); c.lineWidth = 13; c.strokeStyle = '#E2B36C'; c.stroke();
      c.restore();
    },
    _debug: () => T
  };
})();
