/* tower.js — البرج: pull a block, answer, pray. Sway is a spring model; the collapse is real rigid-body physics (Matter.js). */
(function () {
  'use strict';
  const G = window.G, U = G.U, E = U.ease, S = G.sfx, INK = G.INK;
  const ZC = ['#1FE0A8', '#FFD23F', '#FF2E63'], ZP = [200, 400, 600];
  const CX = 800, GY = 800, VIS = 1.5;

  /* ---------- painters ---------- */
  function body(c, w, h, rad, top, bot, deco) {
    U.rr(c, -w / 2, -h / 2, w, h, rad); c.fillStyle = U.lin(c, 0, -h / 2, 0, h / 2, [top, bot]); c.fill();
    c.save(); c.clip(); if (deco) deco();
    c.fillStyle = 'rgba(255,255,255,.22)'; c.fillRect(-w / 2, -h / 2, w, Math.min(7, h * .3));
    c.fillStyle = 'rgba(0,0,0,.15)'; c.fillRect(-w / 2, h / 2 - Math.min(8, h * .3), w, 8);
    c.restore();
    U.rr(c, -w / 2, -h / 2, w, h, rad); c.lineWidth = 5; c.strokeStyle = INK; c.lineJoin = 'round'; c.stroke();
  }
  const inkLine = c => { c.fillStyle = INK; c.fillRect(0, 796, 1600, 6); };

  const STYLES = {
    wood: {
      name: 'خشب', floors: 9, bw: 112, bh: 54, sh: 16, gap: 6, risk: 1, debris: ['#EDB877', '#C0803F', '#8E5B2C'], dshape: 'rect', capH: 0,
      block(c, w, h, r) { body(c, w, h, 9, '#EDB877', '#C0803F', () => { c.strokeStyle = 'rgba(120,70,30,.5)'; c.lineWidth = 2.5; for (let i = 0; i < 3; i++) { const y = -h / 2 + h * (.28 + .22 * i) + r() * 6 - 3; c.beginPath(); c.moveTo(-w / 2, y); c.bezierCurveTo(-w / 6, y + r() * 10 - 5, w / 6, y + r() * 10 - 5, w / 2, y + r() * 4 - 2); c.stroke(); } }); },
      slab(c, w, h) { body(c, w, h, 6, '#8E5B2C', '#6B411D'); },
      bg(c) {
        c.fillStyle = U.lin(c, 0, 0, 0, 900, ['#35213C', '#1A1022']); c.fillRect(0, 0, 1600, 900);
        c.strokeStyle = 'rgba(255,255,255,.04)'; c.lineWidth = 3;
        for (let y = 30, row = 0; y < 780; y += 58, row++) for (let x = (row % 2) * -64; x < 1600; x += 128) c.strokeRect(x, y, 124, 54);
        const r = U.srand(5), cols = ['#3B2A55', '#274A45', '#5A2A3A', '#4A3A22'];
        for (const sx of [70, 1130]) for (const sy of [260, 480]) {
          c.fillStyle = '#0F0916'; c.fillRect(sx, sy, 400, 16);
          for (let i = 0; i < 7; i++) { const bx = sx + 22 + i * 54, bh = 58 + r() * 44; c.fillStyle = cols[(r() * 4) | 0]; U.rr(c, bx, sy - bh, 30, bh, 6); c.fill(); c.fillRect(bx + 10, sy - bh - 22, 10, 26); c.fillStyle = 'rgba(255,255,255,.14)'; c.fillRect(bx + 4, sy - bh + 6, 4, bh - 14); }
        }
        c.fillStyle = U.lin(c, 0, 70, 0, 800, ['rgba(255,214,140,.24)', 'rgba(255,214,140,0)']); c.beginPath(); c.moveTo(740, 74); c.lineTo(860, 74); c.lineTo(1190, 800); c.lineTo(410, 800); c.fill();
        c.strokeStyle = INK; c.lineWidth = 5; c.beginPath(); c.moveTo(800, 0); c.lineTo(800, 22); c.stroke();
        c.beginPath(); c.moveTo(736, 22); c.lineTo(864, 22); c.lineTo(900, 78); c.lineTo(700, 78); c.closePath(); c.fillStyle = '#FFD23F'; c.fill(); c.stroke();
        c.fillStyle = U.lin(c, 0, 800, 0, 900, ['#7A4A28', '#3A2212']); c.fillRect(0, 800, 1600, 100); c.fillStyle = 'rgba(255,255,255,.12)'; c.fillRect(0, 802, 1600, 8); inkLine(c);
      },
      fx(c, t) { c.fillStyle = 'rgba(255,230,180,.35)'; for (let i = 0; i < 22; i++) { const y = 90 + ((i * 97 + t * 16) % 690), sp = (y - 70) / 730 * 330; c.beginPath(); c.arc(800 + Math.sin(i * 12.9 + t * .3) * sp, y, 2 + (i % 3), 0, 7); c.fill(); } }
    },
    khalifa: {
      name: 'برج خليفة', tag: 'صعب', floors: 11, bw: 86, bh: 40, sh: 10, gap: 5, risk: 1.3, debris: ['#A9DBFA', '#4A84B6', '#E8F6FF'], dshape: 'tri', capW: 70, capH: 96,
      block(c, w, h) { body(c, w, h, 5, '#A9DBFA', '#4A84B6', () => { c.strokeStyle = 'rgba(255,255,255,.4)'; c.lineWidth = 2; for (let x = -w / 4; x < w / 2; x += w / 4) { c.beginPath(); c.moveTo(x, -h / 2); c.lineTo(x, h / 2); c.stroke(); } c.fillStyle = 'rgba(255,255,255,.28)'; c.beginPath(); c.moveTo(-w / 2 + 6, h / 2); c.lineTo(-w / 2 + 24, -h / 2); c.lineTo(-w / 2 + 38, -h / 2); c.lineTo(-w / 2 + 20, h / 2); c.fill(); }); },
      slab(c, w, h) { body(c, w, h, 4, '#3A5F84', '#243F5C'); },
      cap(c, t) {
        c.beginPath(); c.moveTo(-34, 0); c.lineTo(-7, -96); c.lineTo(7, -96); c.lineTo(34, 0); c.closePath(); c.fillStyle = U.lin(c, -34, 0, 34, 0, ['#A9DBFA', '#4A84B6']); c.fill(); c.lineWidth = 5; c.strokeStyle = INK; c.lineJoin = 'round'; c.stroke();
        c.beginPath(); c.moveTo(0, -96); c.lineTo(0, -126); c.stroke();
        c.fillStyle = Math.sin(t * 5) > 0 ? '#FF2E63' : '#6A1730'; c.beginPath(); c.arc(0, -128, 6, 0, 7); c.fill(); c.lineWidth = 3; c.stroke();
      },
      bg(c) {
        c.fillStyle = U.lin(c, 0, 0, 0, 800, ['#0A0E2C', '#2A1E5E', '#5A2E78']); c.fillRect(0, 0, 1600, 900);
        const r = U.srand(9); for (let i = 0; i < 140; i++) { c.fillStyle = 'rgba(255,255,255,' + (.3 + r() * .6) + ')'; const s = 2 + r() * 2; c.fillRect(r() * 1600, r() * 520, s, s); }
        c.fillStyle = '#FFF3DA'; c.beginPath(); c.arc(1330, 150, 62, 0, 7); c.fill(); c.fillStyle = 'rgba(0,0,0,.08)'; c.beginPath(); c.arc(1310, 135, 14, 0, 7); c.arc(1350, 172, 9, 0, 7); c.fill();
        const row = (col, hmin, hmax, lit) => { let x = -10; while (x < 1600) { const w = 50 + r() * 80, h = hmin + r() * (hmax - hmin); c.fillStyle = col; c.fillRect(x, 800 - h, w, h); for (let wy = 800 - h + 12; wy < 786; wy += 20) for (let wx = x + 8; wx < x + w - 10; wx += 16) if (r() < lit) { c.fillStyle = 'rgba(255,210,63,.6)'; c.fillRect(wx, wy, 6, 9); } x += w + 4; } };
        row('#1A2150', 140, 400, .28); row('#0E1330', 60, 190, .14);
        c.fillStyle = '#090B1C'; c.fillRect(0, 800, 1600, 100); c.fillStyle = 'rgba(255,210,63,.5)'; for (let x = 20; x < 1600; x += 130) c.fillRect(x, 848, 64, 8); inkLine(c);
      }
    },
    sand: {
      name: 'قلعة رمل', floors: 9, bw: 112, bh: 54, sh: 16, gap: 6, risk: 1.15, debris: ['#F4D593', '#D9A95B', '#C9974E'], dshape: 'circle', capW: 280, capH: 36,
      block(c, w, h, r) { body(c, w, h, 12, '#F6D898', '#D9A95B', () => { for (let i = 0; i < 16; i++) { c.fillStyle = i % 2 ? 'rgba(150,100,40,.35)' : 'rgba(255,255,255,.35)'; c.beginPath(); c.arc(-w / 2 + r() * w, -h / 2 + r() * h, 1.5 + r() * 2, 0, 7); c.fill(); } }); },
      slab(c, w, h) { body(c, w, h, 8, '#CFA05A', '#B5843F'); },
      cap(c, t) {
        for (let i = -1; i <= 1; i++) { c.save(); c.translate(i * 112, -18); body(c, 56, 36, 6, '#F6D898', '#D9A95B'); c.restore(); }
        c.strokeStyle = INK; c.lineWidth = 5; c.lineJoin = 'round'; c.beginPath(); c.moveTo(0, -36); c.lineTo(0, -104); c.stroke();
        c.beginPath(); c.moveTo(0, -104); c.quadraticCurveTo(24, -112 + Math.sin(t * 4) * 5, 50, -94 + Math.sin(t * 4 + 1) * 5); c.lineTo(0, -76); c.closePath(); c.fillStyle = '#FF2E63'; c.fill(); c.stroke();
      },
      bg(c) {
        c.fillStyle = U.lin(c, 0, 0, 0, 560, ['#3A1F5D', '#B8456B', '#FF8A4C', '#FFC56B']); c.fillRect(0, 0, 1600, 562);
        c.fillStyle = '#FFE08A'; c.beginPath(); c.arc(1180, 560, 124, Math.PI, 0); c.fill();
        c.fillStyle = U.lin(c, 0, 560, 0, 670, ['#27548A', '#17305C']); c.fillRect(0, 560, 1600, 112);
        const r = U.srand(3); c.fillStyle = 'rgba(255,224,138,.55)'; for (let i = 0; i < 8; i++) c.fillRect(1180 - 100 + r() * 160, 568 + i * 12, 40 + r() * 70, 4);
        c.fillStyle = U.lin(c, 0, 650, 0, 900, ['#F3CC8B', '#C9924D']); c.fillRect(0, 656, 1600, 244);
        c.fillStyle = 'rgba(255,255,255,.5)'; c.beginPath(); c.moveTo(0, 656); for (let x = 0; x <= 1600; x += 40) c.lineTo(x, 656 + Math.sin(x * .02) * 6); c.lineTo(1600, 668); c.lineTo(0, 668); c.fill();
        c.strokeStyle = '#2A1A2E'; c.lineCap = 'round'; c.lineWidth = 26; c.beginPath(); c.moveTo(170, 830); c.quadraticCurveTo(170, 600, 250, 420); c.stroke();
        c.lineWidth = 16; for (let i = 0; i < 6; i++) { const a = -2.9 + i * .56; c.beginPath(); c.moveTo(250, 420); c.quadraticCurveTo(250 + Math.cos(a) * 110, 420 + Math.sin(a) * 110 - 40, 250 + Math.cos(a) * 190, 420 + Math.sin(a) * 120 + 30); c.stroke(); }
        c.fillStyle = 'rgba(0,0,0,.12)'; c.fillRect(0, 800, 1600, 4);
      }
    },
    glass: {
      name: 'برج قزاز', floors: 10, bw: 102, bh: 48, sh: 12, gap: 6, risk: 1.1, debris: ['rgba(160,240,255,.9)', '#fff', 'rgba(49,183,255,.8)'], dshape: 'tri', capW: 64, capH: 72,
      block(c, w, h) { body(c, w, h, 6, 'rgba(170,240,255,.62)', 'rgba(60,170,230,.5)', () => { c.fillStyle = 'rgba(255,255,255,.55)'; c.beginPath(); c.moveTo(-w / 2 + 10, h / 2); c.lineTo(-w / 2 + 34, -h / 2); c.lineTo(-w / 2 + 46, -h / 2); c.lineTo(-w / 2 + 22, h / 2); c.fill(); c.beginPath(); c.moveTo(w / 2 - 34, h / 2); c.lineTo(w / 2 - 20, -h / 2); c.lineTo(w / 2 - 14, -h / 2); c.lineTo(w / 2 - 28, h / 2); c.fill(); }); },
      slab(c, w, h) { body(c, w, h, 5, 'rgba(220,250,255,.85)', 'rgba(120,200,240,.7)'); },
      cap(c) {
        c.beginPath(); c.moveTo(-32, -30); c.lineTo(0, -72); c.lineTo(32, -30); c.lineTo(0, 0); c.closePath(); c.fillStyle = 'rgba(150,240,255,.75)'; c.fill(); c.lineWidth = 5; c.strokeStyle = INK; c.lineJoin = 'round'; c.stroke();
        c.lineWidth = 3; c.beginPath(); c.moveTo(-32, -30); c.lineTo(32, -30); c.moveTo(0, -72); c.lineTo(0, 0); c.stroke();
      },
      bg(c) {
        c.fillStyle = U.lin(c, 0, 0, 0, 900, ['#0A0F24', '#171E4A']); c.fillRect(0, 0, 1600, 900);
        for (const [x, col] of [[150, '#FF2E63'], [262, '#31B7FF'], [1324, '#31B7FF'], [1436, '#FF2E63']]) { c.save(); c.shadowColor = col; c.shadowBlur = 44; c.fillStyle = col; U.rr(c, x, 150, 14, 440, 7); c.fill(); c.fill(); c.restore(); }
        c.fillStyle = U.lin(c, 0, 800, 0, 900, ['#1B2458', '#0A0F24']); c.fillRect(0, 800, 1600, 100);
        c.strokeStyle = 'rgba(139,92,255,.55)'; c.lineWidth = 2; c.beginPath(); for (let i = -12; i <= 12; i++) { c.moveTo(800 + i * 70, 800); c.lineTo(800 + i * 210, 900); } for (const y of [814, 834, 860, 892]) { c.moveTo(0, y); c.lineTo(1600, y); } c.stroke();
        c.fillStyle = '#8B5CFF'; c.fillRect(0, 796, 1600, 5);
      }
    },
    cake: {
      name: 'كيكة', tag: 'ثابتة', floors: 8, bw: 122, bh: 58, sh: 18, gap: 6, risk: .9, debris: ['#F3D29B', '#F59DB9', '#FFF3E0', '#8A5332'], dshape: 'circle', capW: 60, capH: 60,
      block(c, w, h, r, f) { const k = [['#F7DCA8', '#E9BE7C'], ['#F9AFC8', '#EE82A8'], ['#9A6038', '#74421F']][f % 3]; body(c, w, h, 8, k[0], k[1], () => { for (let i = 0; i < 12; i++) { c.fillStyle = 'rgba(0,0,0,.12)'; c.beginPath(); c.arc(-w / 2 + r() * w, -h / 2 + r() * h, 2 + r() * 2.5, 0, 7); c.fill(); } }); },
      slab(c, w, h) {
        body(c, w, h, 9, '#FFF8EA', '#F6E3C4');
        c.fillStyle = '#F6E3C4'; c.strokeStyle = INK; c.lineWidth = 4;
        for (let x = -w / 2 + 26; x < w / 2 - 10; x += 46) { c.beginPath(); c.arc(x, h / 2 - 2, 10, 0, Math.PI); c.fill(); c.stroke(); }
      },
      cap(c) {
        c.strokeStyle = INK; c.lineWidth = 5; c.lineJoin = 'round'; c.beginPath(); c.moveTo(4, -40); c.quadraticCurveTo(16, -66, 34, -64); c.stroke();
        c.fillStyle = '#E3173E'; c.beginPath(); c.arc(0, -22, 23, 0, 7); c.fill(); c.stroke(); c.fillStyle = 'rgba(255,255,255,.6)'; c.beginPath(); c.arc(-8, -30, 6, 0, 7); c.fill();
      },
      bg(c) {
        c.fillStyle = U.lin(c, 0, 0, 0, 800, ['#42204D', '#28143A']); c.fillRect(0, 0, 1600, 900);
        c.fillStyle = 'rgba(255,255,255,.03)'; for (let x = 0; x < 1600; x += 160) c.fillRect(x, 0, 80, 800);
        const cols = ['#FF2E63', '#FFD23F', '#1FE0A8', '#31B7FF', '#FF8A3D'];
        for (const [x0, x1] of [[-20, 800], [800, 1620]]) {
          c.strokeStyle = INK; c.lineWidth = 5; c.beginPath(); c.moveTo(x0, 70); c.quadraticCurveTo((x0 + x1) / 2, 250, x1, 70); c.stroke();
          for (let i = 1; i < 10; i++) { const t = i / 10, x = (1 - t) * (1 - t) * x0 + 2 * (1 - t) * t * (x0 + x1) / 2 + t * t * x1, y = (1 - t) * (1 - t) * 70 + 2 * (1 - t) * t * 250 + t * t * 70; const col = cols[i % 5]; c.save(); c.shadowColor = col; c.shadowBlur = 30; c.fillStyle = col; c.beginPath(); c.arc(x, y + 16, 13, 0, 7); c.fill(); c.restore(); c.lineWidth = 3; c.stroke(); }
        }
        c.fillStyle = '#B81D5B'; c.fillRect(0, 800, 1600, 100); c.fillStyle = '#E0457F'; c.fillRect(0, 802, 1600, 14);
        c.fillStyle = 'rgba(255,255,255,.14)'; for (let x = 30; x < 1600; x += 70) for (let y = 836; y < 900; y += 44) { c.beginPath(); c.arc(x + ((y / 44) | 0) % 2 * 35, y, 8, 0, 7); c.fill(); } inkLine(c);
      }
    },
    lego: {
      name: 'مكعبات', floors: 9, bw: 110, bh: 56, sh: 14, gap: 4, risk: 1, debris: ['#E3262E', '#1F6FEB', '#FFCF1F', '#1FAE5A'], dshape: 'rect', capW: 300, capH: 12,
      block(c, w, h, r) { const k = [['#F0434A', '#C81E26'], ['#3D8BFF', '#1A5AD0'], ['#FFDB4A', '#E8B50C'], ['#35C672', '#16904A']][(r() * 4) | 0]; body(c, w, h, 5, k[0], k[1], () => { c.fillStyle = 'rgba(255,255,255,.25)'; U.rr(c, -w / 2 + 10, -h / 2 + 12, w - 20, 9, 4); c.fill(); }); },
      slab(c, w, h) { c.fillStyle = '#AEB6C4'; c.strokeStyle = INK; c.lineWidth = 4; for (let x = -w / 2 + 24; x < w / 2 - 20; x += 38) { U.rr(c, x - 12, -h / 2 - 9, 24, 12, 3); c.fill(); c.stroke(); } body(c, w, h, 4, '#C8CFDA', '#98A1B2'); },
      cap: null,
      bg(c) {
        c.fillStyle = U.lin(c, 0, 0, 0, 800, ['#14454F', '#0B2932']); c.fillRect(0, 0, 1600, 900);
        c.fillStyle = 'rgba(255,255,255,.07)'; for (let x = 30; x < 1600; x += 44) for (let y = 30; y < 780; y += 44) { c.beginPath(); c.arc(x, y, 4, 0, 7); c.fill(); }
        c.fillStyle = '#0E5A4A'; c.fillRect(0, 800, 1600, 100); c.strokeStyle = 'rgba(255,255,255,.2)'; c.lineWidth = 2; c.beginPath(); for (let x = 0; x < 1600; x += 50) { c.moveTo(x, 800); c.lineTo(x, 900); } for (const y of [832, 866]) { c.moveTo(0, y); c.lineTo(1600, y); } c.stroke(); inkLine(c);
      }
    }
  };
  Object.keys(STYLES).forEach(id => { STYLES[id].id = id; });

  /* ---------- model ---------- */
  let T = null, lastOpts = null, hud = null;

  function makeModel(st) {
    const fh = st.bh + st.sh, N = st.floors;
    const M = { st, N, fh, H: N * fh, sw: 3 * st.bw + 2 * st.gap + 14, theta: 0, t: 0, drop: null, sel: null, pick: false, floors: [] };
    for (let f = 0; f < N; f++) M.floors.push([0, 1, 2].map(b => ({ present: true, can: true, seed: f * 31 + b * 17 + 3 })));
    return M;
  }
  const zone = (M, f) => f < M.N / 3 ? 2 : f < 2 * M.N / 3 ? 1 : 0;
  function swayAt(M, h) { const th = M.theta * VIS; return { phi: th * (.35 + .65 * h / M.H), dx: th * (.35 * h + .325 * h * h / M.H) }; }
  function bpos(M, f, b) { const st = M.st, h = f * M.fh + st.bh / 2, s = swayAt(M, h), lx = (b - 1) * (st.bw + st.gap); return { x: CX + s.dx + lx * Math.cos(s.phi), y: GY - h + lx * Math.sin(s.phi) + (M.drop ? M.drop[f] : 0), phi: s.phi, h }; }
  function spos(M, f) { const st = M.st, h = f * M.fh + st.bh + st.sh / 2, s = swayAt(M, h); return { x: CX + s.dx, y: GY - h + (M.drop ? M.drop[f] : 0), phi: s.phi, h }; }

  function floorInfo(fl) {
    const p = fl.map(b => b.present), n = p.filter(Boolean).length;
    if (n === 3) return { w: 0, bias: 0, lone: false };
    if (n === 2) return p[1] ? { w: .8, bias: p[0] ? .5 : -.5, lone: false } : { w: .35, bias: 0, lone: false };
    if (n === 1) return p[1] ? { w: 1.6, bias: 0, lone: false } : { w: 2.6, bias: p[0] ? 1.2 : -1.2, lone: true };
    return { w: 5, bias: 0, lone: true };
  }
  function recompute() {
    let W = 0, B = 0;
    for (let f = 0; f < T.N; f++) { const i = floorInfo(T.floors[f]), wt = .35 + .65 * (1 - f / (T.N - 1)); W += wt * i.w; B += wt * i.bias; }
    T.Wk = W; T.k = 34 / (1 + .22 * W); T.d = 2.4 / (1 + .2 * W);
    T.crit = .11 / (1 + .07 * W) / Math.sqrt(T.st.risk);
    T.eq = U.clamp(.007 * B, -T.crit * .45, T.crit * .45);
    for (let f = 0; f < T.N; f++) { const n = T.floors[f].filter(b => b.present).length; T.floors[f].forEach(b => { b.can = b.present && n > 1; }); }
  }
  function riskOf(f, ok) {
    const z = zone(T, f), zf = .5 + .5 * z, lone = floorInfo(T.floors[f]).lone, W = T.Wk;
    if (ok) return U.clamp((Math.max(0, W - 4.5) * .05 * zf + (lone && z > 0 ? .1 : 0)) * T.st.risk, 0, .5);
    return U.clamp((.03 + .085 * W) * zf * (lone ? 1.5 : 1) * T.st.risk, .02, .95);
  }
  function peakFactor() { let th = 0, om = 1, pk = 0; const dt = 1 / 240; for (let i = 0; i < 1400; i++) { om += (-T.k * th - T.d * om) * dt; th += om * dt; if (th > pk) pk = th; else if (i > 20) break; } return pk; }
  /* decide the outcome by risk, then kick the spring so the sway tells that story */
  function kick(f, ok) {
    const r = riskOf(f, ok), fall = Math.random() < r;
    const s = Math.abs(T.eq) > T.crit * .08 ? Math.sign(T.eq) : U.sign();
    const target = fall ? T.crit * 1.4 : ok ? T.crit * (.07 + .3 * r) * U.rand(.8, 1.1) : T.crit * Math.min(.93, U.lerp(.42, .9, Math.sqrt(r)) * U.rand(.92, 1.06));
    T.omega += (s * target - T.eq) / peakFactor(); T.willFall = fall;
  }
  function stepSway(dt) {
    const n = Math.max(1, Math.ceil(dt * 240)), h = dt / n;
    for (let i = 0; i < n; i++) { T.omega += (-T.k * (T.theta0 - T.eq) - T.d * T.omega) * h; T.theta0 += T.omega * h; }
    if (!T.willFall) { const m = T.crit * .97; if (Math.abs(T.theta0) > m) { T.theta0 = m * Math.sign(T.theta0); T.omega *= -.2; } }
    T.theta = T.theta0 + Math.sin(T.t * 1.7) * .0011 * Math.min(6, T.Wk) + Math.sin(T.t * 2.9 + 1) * .0005 * Math.min(6, T.Wk);
  }

  /* ---------- drawing ---------- */
  function renderTower(c, M) {
    const st = M.st;
    for (let f = 0; f < M.N; f++) {
      if (M.drop && M.drop[f] < -1400) continue;
      const z = zone(M, f);
      for (let b = 0; b < 3; b++) {
        const B = M.floors[f][b]; if (!B.present) continue;
        const p = bpos(M, f, b), sel = M.sel && M.sel.f === f && M.sel.b === b;
        c.save(); c.translate(p.x, p.y); c.rotate(p.phi);
        if (sel) { const k = 1.06 + Math.sin(M.t * 12) * .04; c.scale(k, k); }
        st.block(c, st.bw, st.bh, U.srand(B.seed), f);
        if (M.pick && B.can) { c.globalAlpha = .5 + .4 * Math.sin(M.t * 4 + f * .7); U.rr(c, -st.bw / 2 + 5, -st.bh / 2 + 5, st.bw - 10, st.bh - 10, 6); c.lineWidth = 5; c.strokeStyle = ZC[z]; c.stroke(); }
        if (sel) { c.globalAlpha = 1; U.rr(c, -st.bw / 2 - 5, -st.bh / 2 - 5, st.bw + 10, st.bh + 10, 12); c.lineWidth = 7; c.strokeStyle = '#fff'; c.stroke(); }
        c.restore();
      }
      const p = spos(M, f); c.save(); c.translate(p.x, p.y); c.rotate(p.phi); st.slab(c, M.sw, st.sh, U.srand(f + 99), f);
      if (f === M.N - 1 && st.cap) { c.translate(0, -st.sh / 2); st.cap(c, M.t); }
      c.restore();
    }
  }
  function zoneBars(c, M) {
    const x = CX - M.sw / 2 - 58;
    for (let z = 0; z < 3; z++) {
      let f0 = -1, f1 = -1; for (let f = 0; f < M.N; f++) if (zone(M, f) === z) { if (f0 < 0) f0 = f; f1 = f; }
      if (f0 < 0) continue;
      const yb = GY - f0 * M.fh - 4, yt = GY - (f1 + 1) * M.fh + 8;
      U.rr(c, x, yt, 16, yb - yt, 8); c.fillStyle = ZC[z]; c.fill(); c.lineWidth = 4; c.strokeStyle = INK; c.stroke();
      U.text(c, String(ZP[z]), x - 58, (yb + yt) / 2 + 4, 46, ZC[z]);
    }
  }
  function debris(x, y, n, pow) { const st = T.st; T.parts.emit(n, () => ({ x: x + U.rand(-30, 30), y: y + U.rand(-14, 14), vx: U.rand(-1, 1) * pow, vy: U.rand(-1, .2) * pow, g: 1600, life: U.rand(.6, 1.3), size: U.rand(8, 17), rot: U.rand(6), vr: U.rand(-12, 12), color: U.pick(st.debris), shape: st.dshape, ink: 2, floorY: GY })); }
  function dust(x, y, n, spread) { T.parts.emit(n, () => ({ x: x + U.rand(-spread, spread), y: y + U.rand(-12, 4), vx: U.rand(-110, 110), vy: U.rand(-80, -10), drag: 1.6, life: U.rand(.6, 1.3), size: U.rand(26, 54), grow: 55, color: 'rgba(240,230,215,.5)', shape: 'smoke' })); }
  function sparkle(x, y, col) { T.parts.emit(14, () => { const a = U.rand(6.28), v = U.rand(120, 420); return { x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, drag: 3, life: U.rand(.35, .7), size: U.rand(8, 16), rot: a, color: Math.random() < .5 ? '#fff' : col, shape: 'spark' }; }); }

  /* ---------- HUD ---------- */
  function mountHud() {
    const UI = G.UI; UI.clear();
    UI.pauseBtn({ again: () => G.Tower.start(lastOpts) });
    const cards = T.teams.map((t, i) => { const el = UI.mount(UI.teamCard(t, i)); el.style.right = '30px'; el.style.top = (30 + i * 116) + 'px'; return el; });
    const stick = UI.mount('<div class="sticker" style="left:110px;top:24px;min-width:250px"></div>');
    UI.mount(`<div class="legend"><div style="--c:${ZC[0]}"><i>200</i>فوق · سؤال متوسط</div><div style="--c:${ZC[1]}"><i>400</i>الوسط · سؤال أصعب</div><div style="--c:${ZC[2]}"><i>600</i>تحت · صعب وخطير</div><p>اللي يطيّح البرج يخسر كل نقاطه.</p></div>`);
    hud = {
      cards, stick,
      turn() { cards.forEach((c, i) => c.classList.toggle('turn', i === T.turn)); const t = T.teams[T.turn]; stick.style.setProperty('--c', t.color); stick.innerHTML = '<small>الدور على</small><b>' + U.esc(t.name) + '</b><small>اختاروا بلوك</small>'; stick.classList.remove('pop'); void stick.offsetWidth; stick.classList.add('pop'); },
      scores() { cards.forEach((c, i) => UI.setScore(c, T.teams[i].score)); },
      say(html) { stick.innerHTML = html; stick.classList.remove('pop'); void stick.offsetWidth; stick.classList.add('pop'); }
    };
  }

  /* ---------- flow ---------- */
  function beginPick() {
    recompute();
    if (!T.floors.some(fl => fl.some(b => b.can))) return finish(-1);
    T.phase = 'pick'; T.pick = true; T.sel = null; hud.turn();
  }
  async function onPick(hit) {
    const my = T, team = T.teams[T.turn], z = zone(T, hit.f);
    T.sel = hit; T.phase = 'question'; T.pick = false; S.pop();
    const ok = await G.UI.ask({ level: ZP[z], team: team.name, color: team.color });
    if (T !== my) return;
    pull(hit, ok, ZP[z]);
  }
  async function pull(hit, ok, pts) {
    const my = T, st = T.st, team = T.teams[T.turn];
    const gone = () => T !== my || T.phase === 'collapse';
    T.phase = 'pull';
    const B = T.floors[hit.f][hit.b], p = bpos(T, hit.f, hit.b), dir = hit.b === 0 ? -1 : hit.b === 2 ? 1 : U.sign();
    const fl = { x: p.x, y: p.y, rot: p.phi, sc: 1, a: 1, seed: B.seed, f: hit.f, vx: 0, vy: 0, vr: 0, free: false };
    B.present = false; T.sel = null; T.fly.push(fl); recompute(); T.pulls++;
    hud.say(ok ? '<b style="--c:#1FE0A8">صح!</b><small>اسحبوه بهدوء…</small>' : '<b style="--c:#FF2E63">غلط!</b><small>الله يستر…</small>');
    await G.wait(.3); if (gone()) return;
    if (ok) {
      S.slide(); G.tween(fl, { sc: 1.1 }, .2);
      G.wait(.32).then(() => { if (!gone()) kick(hit.f, true); });
      await G.tween(fl, { x: p.x + dir * st.bw * 1.9 }, .8, E.inOutCubic); if (gone()) return;
      S.good(); sparkle(fl.x, fl.y, ZC[zone(T, hit.f)]);
      team.score += pts; hud.scores(); T.pops.push({ x: fl.x, y: fl.y - 30, text: '+' + pts, color: ZC[zone(T, hit.f)], age: 0 });
      G.tween(fl, { y: fl.y - 110, a: 0, sc: .6, rot: fl.rot + dir * .6 }, .55, E.outCubic).then(() => { const i = my.fly.indexOf(fl); if (i >= 0) my.fly.splice(i, 1); });
    } else {
      for (let i = 0; i < 3; i++) { S.creak(); await G.tween(fl, { x: p.x + dir * 11 }, .07); await G.tween(fl, { x: p.x - dir * 5 }, .07); if (gone()) return; }
      S.yank(); S.bad(); G.shake(16); G.flash('#FF2E63', .25);
      kick(hit.f, false); debris(p.x, p.y, 14, 520); dust(p.x, p.y, 3, 20);
      fl.free = true; fl.vx = dir * 1500; fl.vy = -420; fl.vr = dir * 9;
      T.pops.push({ x: p.x, y: p.y - 40, text: 'غلط!', color: '#FF2E63', age: 0 });
    }
    T.phase = 'sway'; T.swayT = 0;
  }
  function collapse() {
    const M = window.Matter, st = T.st, culprit = T.turn;
    T.phase = 'collapse'; T.pick = false; T.sel = null; G.slowHold = 1;
    const eng = M.Engine.create({ positionIterations: 10, velocityIterations: 8 }); T.engine = eng;
    const om = (Math.sign(T.theta0) || 1) * Math.max(Math.abs(T.omega), .9), bodies = [];
    const add = (x, y, w, h, ang, hgt, draw) => {
      const b = M.Bodies.rectangle(x, y, w, h, { angle: ang, friction: .7, frictionStatic: .9, restitution: .12, density: .002 });
      M.Body.setVelocity(b, { x: om * hgt * VIS * .9 / 60 + U.rand(-.4, .4), y: U.rand(-.6, .2) }); M.Body.setAngularVelocity(b, om * .5 / 60 + U.rand(-.012, .012));
      b.plugin = { draw }; bodies.push(b);
    };
    for (let f = 0; f < T.N; f++) {
      for (let b = 0; b < 3; b++) { const B = T.floors[f][b]; if (!B.present) continue; const p = bpos(T, f, b); add(p.x, p.y, st.bw, st.bh, p.phi, p.h, c => st.block(c, st.bw, st.bh, U.srand(B.seed), f)); }
      const p = spos(T, f); add(p.x, p.y, T.sw, st.sh, p.phi, p.h, c => st.slab(c, T.sw, st.sh, U.srand(f + 99), f));
    }
    if (st.cap) { const p = spos(T, T.N - 1); add(p.x, p.y - st.sh / 2 - st.capH / 2, st.capW, st.capH, p.phi, p.h + st.capH, c => { c.translate(0, st.capH / 2); st.cap(c, T.t); }); }
    const wall = (x, y, w, h) => M.Bodies.rectangle(x, y, w, h, { isStatic: true, friction: 1 });
    M.Composite.add(eng.world, bodies.concat([wall(800, GY + 60, 4000, 120), wall(-700, 0, 120, 3000), wall(2300, 0, 120, 3000)]));
    M.Events.on(eng, 'collisionStart', ev => {
      if (!T || T.thudCd > 0) return;
      for (const pr of ev.pairs) {
        const o = pr.bodyA.isStatic ? pr.bodyB : pr.bodyB.isStatic ? pr.bodyA : null; if (!o || o.isStatic || o.speed < 4) continue;
        T.thudCd = .07; S.thud(Math.min(1, o.speed / 14)); dust(o.position.x, GY, 2, 20); G.shake(Math.min(11, o.speed * .6)); if (o.speed > 7) debris(o.position.x, GY - 10, 4, 240); break;
      }
    });
    T.bodies = bodies; T.acc = 0;
    T.fly.forEach(f => { if (!f.free) { f.free = true; f.a = 1; f.vx = U.rand(-260, 260); f.vy = -260; f.vr = U.rand(-6, 6); } });
    G.slowmo(.2, 1.2); S.crash(); G.shake(26); G.flash('#fff', .18);
    dust(CX, GY, 10, 160);
    hud.say('<b style="--c:#FF2E63">طاااح!</b>');
    const my = T;
    G.wait(2.7).then(() => { if (T === my) finish(culprit); });
  }
  function finish(culprit) {
    T.phase = 'end';
    if (culprit >= 0) { T.teams[culprit].score = 0; hud.scores(); hud.cards[culprit].classList.add('dead'); }
    const rest = T.teams.map((t, i) => Object.assign({ i }, t)).filter(t => t.i !== culprit);
    const best = Math.max.apply(null, rest.map(t => t.score)), winners = rest.filter(t => t.score === best);
    const rows = T.teams.map((t, i) => ({ name: t.name, color: t.color, score: t.score, tag: i === culprit ? 'طيّحوا البرج' : '' })).sort((a, b) => b.score - a.score);
    S.cheer();
    G.UI.results({
      kicker: culprit >= 0 ? T.teams[culprit].name + ' طيّحوا البرج!' : 'خلصت البلوكات!',
      title: winners.length > 1 ? 'تعادل!' : winners[0].name + ' فازوا',
      color: winners.length > 1 ? '#FFD23F' : winners[0].color,
      sub: culprit >= 0 ? 'وخسروا كل نقاطهم' : 'والبرج صمد للنهاية',
      rows, onAgain: () => G.Tower.start(lastOpts)
    });
  }

  /* ---------- scene ---------- */
  const Scene = {
    enter(opts) {
      const st = STYLES[opts.style] || STYLES.wood;
      T = makeModel(st);
      Object.assign(T, { teams: opts.teams.map(t => ({ name: t.name, color: t.color, score: 0 })), turn: 0, phase: 'intro', theta0: 0, omega: 0, eq: 0, willFall: false, fly: [], pops: [], parts: new G.Particles(), introT: 0, drop: new Array(st.floors).fill(-1500), landed: [], danger: 0, pulls: 0, thudCd: 0, bodies: null, engine: null, beat: 0, bg: G.buffer(c => st.bg(c)) });
      recompute(); mountHud(); hud.say('<small>جهّزوا أعصابكم</small><b style="--c:#FFD23F">لا تطيّحونه</b>');
    },
    exit() { if (T && T.engine) { window.Matter.Events.off(T.engine); window.Matter.Engine.clear(T.engine); } T = null; hud = null; },
    update(dt, real) {
      if (!T) return; T.t += dt; T.thudCd -= real;
      if (T.bg._res !== G.res) T.bg = G.buffer(c => T.st.bg(c));
      if (T.phase === 'intro') {
        T.introT += dt;
        for (let f = 0; f < T.N; f++) { const tt = (T.introT - .25 - f * .08) / .45; T.drop[f] = tt < 0 ? -1500 : -(1 - E.outBounce(U.clamp(tt, 0, 1))) * 560; if (tt > .36 && !T.landed[f]) { T.landed[f] = 1; S.thud(.5); G.shake(3); if (f === 0) dust(CX, GY, 4, 120); } }
        if (T.introT > .25 + T.N * .08 + .6) { T.drop = null; beginPick(); }
      } else if (T.phase !== 'collapse' && T.phase !== 'end') {
        stepSway(dt);
        const r = Math.abs(T.theta0) / T.crit, live = T.phase === 'pull' || T.phase === 'sway';
        T.danger += ((live && r > .5 ? Math.min(1, r) : 0) - T.danger) * Math.min(1, real * 6);
        G.slowHold = live && r > .72 ? .32 : 1;
        if (live && r > .72) { T.beat -= real; if (T.beat <= 0) { T.beat = .62; S.heart(); } } else T.beat = 0;
        if (live && Math.abs(T.omega) > .12 && Math.random() < dt * 5) S.creak();
        if (T.willFall && Math.abs(T.theta0) > T.crit) collapse();
        else if (T.phase === 'sway') { T.swayT += dt; if (T.swayT > 1 && ((Math.abs(T.theta0 - T.eq) < T.crit * .07 && Math.abs(T.omega) < .03) || T.swayT > 7)) { T.turn = (T.turn + 1) % T.teams.length; beginPick(); } }
      } else if (T.engine) {
        T.danger *= Math.exp(-real * 3); T.acc += dt;
        let n = 0; while (T.acc >= 1 / 120 && n++ < 8) { window.Matter.Engine.update(T.engine, 1000 / 120); T.acc -= 1 / 120; }
      }
      for (let i = T.fly.length - 1; i >= 0; i--) { const f = T.fly[i]; if (!f.free) continue; f.vy += 2400 * dt; f.x += f.vx * dt; f.y += f.vy * dt; f.rot += f.vr * dt; if (f.y > 1100 || f.x < -200 || f.x > 1800) T.fly.splice(i, 1); }
      for (let i = T.pops.length - 1; i >= 0; i--) { T.pops[i].age += dt; if (T.pops[i].age > 1.3) T.pops.splice(i, 1); }
      T.parts.update(dt);
    },
    draw(c) {
      if (!T) return; const st = T.st;
      c.fillStyle = INK; c.fillRect(0, 0, 1600, 900);
      c.save(); G.camApply(c);
      c.drawImage(T.bg, 0, 0, 1600, 900);
      if (st.fx) st.fx(c, T.t);
      if (!T.bodies) { c.fillStyle = 'rgba(0,0,0,.34)'; c.beginPath(); c.ellipse(CX + T.theta * VIS * 120, GY + 8, T.sw * .6, 15, 0, 0, 7); c.fill(); }
      if (T.bodies) for (const b of T.bodies) { c.save(); c.translate(b.position.x, b.position.y); c.rotate(b.angle); b.plugin.draw(c); c.restore(); }
      else { renderTower(c, T); if (T.phase !== 'intro') zoneBars(c, T); }
      for (const f of T.fly) { c.save(); c.globalAlpha = f.a; c.translate(f.x, f.y); c.rotate(f.rot); c.scale(f.sc, f.sc); st.block(c, st.bw, st.bh, U.srand(f.seed), f.f); c.restore(); }
      T.parts.draw(c);
      for (const p of T.pops) { const k = p.age / 1.3; c.save(); c.globalAlpha = k < .7 ? 1 : (1 - k) / .3; U.text(c, p.text, p.x, p.y - E.outCubic(k) * 90, 64 * (k < .15 ? E.outBack(k / .15) : 1), p.color); c.restore(); }
      c.restore();
      if (T.danger > .04) { const g = c.createRadialGradient(800, 450, 280, 800, 450, 950); g.addColorStop(0, 'rgba(255,46,99,0)'); g.addColorStop(1, 'rgba(255,46,99,' + (.6 * T.danger) + ')'); c.fillStyle = g; c.fillRect(0, 0, 1600, 900); }
    },
    down(x, y) {
      if (!T || T.phase !== 'pick') return;
      let best = null, bd = 1e9;
      for (let f = 0; f < T.N; f++) for (let b = 0; b < 3; b++) {
        const B = T.floors[f][b]; if (!B.present) continue; const p = bpos(T, f, b), dx = Math.abs(x - p.x), dy = Math.abs(y - p.y);
        if (dx < T.st.bw / 2 + 8 && dy < T.st.bh / 2 + 10 && dx + dy < bd) { bd = dx + dy; best = { f, b }; }
      }
      if (!best) return;
      if (!T.floors[best.f][best.b].can) { S.bad(); G.UI.toast('آخر بلوك في الطابق ما ينسحب'); return; }
      onPick(best);
    }
  };

  G.Tower = {
    styles: STYLES,
    start(opts) { lastOpts = opts; G.setScene(Scene, opts); },
    preview(c, id, w, h) {
      const st = STYLES[id], M = makeModel(st); M.theta = .012;
      c.save(); c.scale(w / 1600, h / 900); st.bg(c);
      const k = 1.15; c.translate(800, 900); c.scale(k, k); c.translate(-800, -840); renderTower(c, M); c.restore();
    },
    _debug: () => T
  };
})();
