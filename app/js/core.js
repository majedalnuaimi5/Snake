/* core.js — engine: stage scaling, loop, tweens, particles, audio, camera */
(function () {
  'use strict';
  const G = window.G = {
    W: 1600, H: 900, time: 0, timeScale: 1, res: 1, scale: 1, scene: null,
    cam: { x: 800, y: 450, zoom: 1, shake: 0, sx: 0, sy: 0 },
    INK: '#120E1C',
    TEAM_COLORS: ['#FF2E63', '#31B7FF', '#FFD23F']
  };

  /* ---------- utils ---------- */
  const U = G.U = {};
  U.clamp = (v, a, b) => v < a ? a : v > b ? b : v;
  U.lerp = (a, b, t) => a + (b - a) * t;
  U.rand = (a, b) => b === undefined ? Math.random() * (a === undefined ? 1 : a) : a + Math.random() * (b - a);
  U.sign = () => Math.random() < .5 ? -1 : 1;
  U.pick = a => a[(Math.random() * a.length) | 0];
  U.shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = (Math.random() * (i + 1)) | 0; [a[i], a[j]] = [a[j], a[i]]; } return a; };
  U.srand = seed => () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  U.esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  U.ease = {
    lin: t => t,
    inQuad: t => t * t, outQuad: t => 1 - (1 - t) * (1 - t),
    inCubic: t => t * t * t, outCubic: t => 1 - Math.pow(1 - t, 3),
    inOutCubic: t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2,
    outBack: t => 1 + 2.70158 * Math.pow(t - 1, 3) + 1.70158 * Math.pow(t - 1, 2),
    inBack: t => 2.70158 * t * t * t - 1.70158 * t * t,
    outBounce: t => { const n = 7.5625, d = 2.75; if (t < 1 / d) return n * t * t; if (t < 2 / d) return n * (t -= 1.5 / d) * t + .75; if (t < 2.5 / d) return n * (t -= 2.25 / d) * t + .9375; return n * (t -= 2.625 / d) * t + .984375; }
  };
  U.rr = (c, x, y, w, h, r) => {
    r = Math.min(r, w / 2, h / 2);
    c.beginPath();
    c.moveTo(x + r, y); c.lineTo(x + w - r, y); c.quadraticCurveTo(x + w, y, x + w, y + r);
    c.lineTo(x + w, y + h - r); c.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    c.lineTo(x + r, y + h); c.quadraticCurveTo(x, y + h, x, y + h - r);
    c.lineTo(x, y + r); c.quadraticCurveTo(x, y, x + r, y); c.closePath();
  };
  U.lin = (c, x0, y0, x1, y1, cols) => { const g = c.createLinearGradient(x0, y0, x1, y1); cols.forEach((col, i) => g.addColorStop(i / (cols.length - 1), col)); return g; };
  /* outlined comic text on canvas */
  U.text = (c, str, x, y, size, fill, opt) => {
    opt = opt || {};
    c.save();
    c.font = (opt.weight || '400') + ' ' + size + 'px ' + (opt.font || "Lalezar, Cairo, sans-serif");
    c.textAlign = opt.align || 'center'; c.textBaseline = opt.base || 'middle'; c.direction = 'rtl';
    c.lineJoin = 'round';
    if (opt.stroke !== 0) { c.lineWidth = opt.stroke || Math.max(6, size * .22); c.strokeStyle = opt.ink || G.INK; c.strokeText(str, x, y); }
    c.fillStyle = fill; c.fillText(str, x, y);
    c.restore();
  };

  /* ---------- storage ---------- */
  G.store = {
    get(k, d) { try { const v = localStorage.getItem('gj:' + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem('gj:' + k, JSON.stringify(v)); } catch (e) { /* storage unavailable */ } }
  };

  /* ---------- audio (synth, no files) ---------- */
  const A = G.audio = {
    ctx: null, master: null, nbuf: null, muted: !!G.store.get('mute', false),
    init() {
      if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume().catch(() => { }); return; }
      try {
        const C = window.AudioContext || window.webkitAudioContext; this.ctx = new C();
        this.master = this.ctx.createGain(); this.master.gain.value = this.muted ? 0 : .9; this.master.connect(this.ctx.destination);
        const n = this.ctx.sampleRate * 2, b = this.ctx.createBuffer(1, n, this.ctx.sampleRate), d = b.getChannelData(0);
        for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1; this.nbuf = b;
      } catch (e) { this.ctx = null; }
    },
    setMuted(m) { this.muted = m; G.store.set('mute', m); if (this.master) this.master.gain.value = m ? 0 : .9; },
    tone(f, d, o) {
      if (!this.ctx) return; o = o || {};
      const c = this.ctx, t = c.currentTime + (o.delay || 0), os = c.createOscillator(), g = c.createGain();
      os.type = o.type || 'sine'; os.frequency.setValueAtTime(f, t);
      if (o.to) os.frequency.exponentialRampToValueAtTime(Math.max(1, o.to), t + d);
      const v = o.vol == null ? .2 : o.vol;
      g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(v, t + (o.attack || .008)); g.gain.exponentialRampToValueAtTime(.0001, t + d);
      os.connect(g); g.connect(this.master); os.start(t); os.stop(t + d + .05);
    },
    noise(d, o) {
      if (!this.ctx) return; o = o || {};
      const c = this.ctx, t = c.currentTime + (o.delay || 0), s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
      s.buffer = this.nbuf; s.loop = true; f.type = o.type || 'lowpass'; f.frequency.setValueAtTime(o.f || 1200, t);
      if (o.to) f.frequency.exponentialRampToValueAtTime(Math.max(20, o.to), t + d);
      f.Q.value = o.q || .8; const v = o.vol == null ? .3 : o.vol;
      g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(v, t + (o.attack || .01)); g.gain.exponentialRampToValueAtTime(.0001, t + d);
      s.connect(f); f.connect(g); g.connect(this.master); s.start(t, Math.random()); s.stop(t + d + .05);
    }
  };
  G.sfx = {
    click() { A.tone(520, .06, { type: 'square', vol: .07 }); },
    pop() { A.tone(300, .12, { to: 900, vol: .18 }); },
    whoosh() { A.noise(.35, { f: 400, to: 3000, type: 'bandpass', q: 1.2, vol: .25 }); },
    slide() { A.noise(.6, { f: 900, to: 500, type: 'bandpass', q: 2, vol: .18 }); },
    creak() { A.tone(U.rand(90, 130), .25, { type: 'sawtooth', to: U.rand(60, 80), vol: .12 }); A.noise(.2, { f: 700, type: 'bandpass', q: 6, vol: .1 }); },
    yank() { A.noise(.25, { f: 2500, to: 300, vol: .5 }); A.tone(160, .25, { to: 50, type: 'square', vol: .25 }); },
    thud(v) { v = v || 1; A.tone(110, .18, { to: 45, vol: .35 * v }); A.noise(.12, { f: 500, vol: .25 * v }); },
    crash() { A.noise(1.6, { f: 3000, to: 120, vol: .7 }); A.tone(80, 1.2, { to: 28, type: 'sawtooth', vol: .4 }); for (let i = 0; i < 8; i++) A.tone(U.rand(90, 220), .15, { to: 50, vol: .25, delay: .1 + i * .13 + U.rand(.05) }); },
    good() { [523, 659, 784, 1047].forEach((f, i) => A.tone(f, .22, { type: 'triangle', vol: .2, delay: i * .07 })); },
    bad() { A.tone(220, .35, { type: 'sawtooth', to: 110, vol: .18 }); A.tone(233, .35, { type: 'sawtooth', to: 104, vol: .18 }); },
    tick() { A.tone(1100, .04, { type: 'square', vol: .07 }); },
    heart() { A.tone(60, .14, { to: 40, vol: .6 }); A.tone(55, .16, { to: 38, vol: .5, delay: .22 }); },
    coin() { A.tone(988, .08, { type: 'square', vol: .1 }); A.tone(1319, .3, { type: 'square', vol: .1, delay: .08 }); },
    cheer() { A.noise(1.8, { f: 1800, type: 'bandpass', q: .6, vol: .3, attack: .3 }); [523, 659, 784].forEach((f, i) => A.tone(f, .5, { type: 'triangle', vol: .14, delay: i * .12 })); A.tone(1047, .9, { type: 'triangle', vol: .16, delay: .36 }); },
    splash() { A.noise(.7, { f: 3500, to: 400, vol: .5 }); A.tone(300, .3, { to: 80, vol: .2 }); },
    sizzle() { A.noise(1.2, { f: 6000, type: 'highpass', vol: .3 }); A.tone(140, .5, { to: 60, type: 'sawtooth', vol: .2 }); },
    grunt() { A.tone(U.rand(95, 125), .22, { type: 'sawtooth', to: 70, vol: .2 }); A.noise(.18, { f: 600, type: 'bandpass', q: 3, vol: .12 }); },
    slam() { A.tone(90, .3, { to: 35, vol: .6 }); A.noise(.25, { f: 1500, to: 200, vol: .45 }); },
    fall() { A.tone(900, 1.1, { to: 120, vol: .16 }); },
    poof() { A.noise(.5, { f: 800, to: 200, vol: .4 }); }
  };

  /* ---------- tweens + waits (run on game clock, dropped on scene change) ---------- */
  const tweens = [], waits = [];
  G.tween = (obj, to, dur, ease, delay) => new Promise(res => { tweens.push({ obj, to, dur, ease: ease || U.ease.outCubic, t: -(delay || 0), from: null, res }); });
  G.wait = sec => new Promise(res => { waits.push({ t: sec, res }); });
  function stepTimers(dt) {
    for (let i = tweens.length - 1; i >= 0; i--) {
      const tw = tweens[i]; tw.t += dt; if (tw.t < 0) continue;
      if (!tw.from) { tw.from = {}; for (const k in tw.to) tw.from[k] = tw.obj[k]; }
      const p = U.clamp(tw.t / tw.dur, 0, 1), e = tw.ease(p);
      for (const k in tw.to) tw.obj[k] = tw.from[k] + (tw.to[k] - tw.from[k]) * e;
      if (p >= 1) { tweens.splice(i, 1); tw.res(); }
    }
    for (let i = waits.length - 1; i >= 0; i--) { const w = waits[i]; w.t -= dt; if (w.t <= 0) { waits.splice(i, 1); w.res(); } }
  }

  /* ---------- particles ---------- */
  class Particles {
    constructor() { this.p = []; }
    emit(n, fn) {
      for (let i = 0; i < n; i++) this.p.push(Object.assign({ x: 0, y: 0, vx: 0, vy: 0, g: 0, drag: 0, life: 1, age: 0, size: 6, grow: 0, rot: 0, vr: 0, color: '#fff', shape: 'circle', alpha: 1, ink: 0, floorY: null }, fn(i)));
    }
    update(dt) {
      for (let i = this.p.length - 1; i >= 0; i--) {
        const p = this.p[i]; p.age += dt; if (p.age >= p.life) { this.p.splice(i, 1); continue; }
        p.vy += p.g * dt; if (p.drag) { const k = Math.exp(-p.drag * dt); p.vx *= k; p.vy *= k; }
        p.x += p.vx * dt; p.y += p.vy * dt; p.rot += p.vr * dt; p.size = Math.max(0, p.size + p.grow * dt);
        if (p.floorY != null && p.y > p.floorY) { p.y = p.floorY; p.vy *= -.35; p.vx *= .6; p.vr *= .5; }
      }
    }
    draw(c) {
      for (const p of this.p) {
        const k = p.age / p.life, a = p.alpha * (p.shape === 'smoke' ? (1 - k) * .8 : k < .7 ? 1 : (1 - k) / .3);
        if (a <= 0) continue;
        c.save(); c.globalAlpha = a; c.translate(p.x, p.y); c.rotate(p.rot); c.fillStyle = p.color; c.strokeStyle = G.INK; c.lineWidth = p.ink;
        const s = p.size;
        c.beginPath();
        if (p.shape === 'rect') c.rect(-s / 2, -s / 3, s, s * .66);
        else if (p.shape === 'tri') { c.moveTo(0, -s * .7); c.lineTo(s * .6, s * .5); c.lineTo(-s * .6, s * .5); c.closePath(); }
        else if (p.shape === 'spark') { c.rect(-s, -1.5, s * 2, 3); }
        else if (p.shape === 'ring') { c.arc(0, 0, s, 0, 7); c.lineWidth = Math.max(1, 6 * (1 - k)); c.strokeStyle = p.color; c.stroke(); c.restore(); continue; }
        else c.arc(0, 0, s / 2, 0, 7);
        c.fill(); if (p.ink) c.stroke();
        c.restore();
      }
    }
  }
  G.Particles = Particles;

  /* ---------- camera / juice ---------- */
  G.shake = a => { G.cam.shake = Math.max(G.cam.shake, a); };
  G.camApply = c => {
    const cam = G.cam;
    c.translate(G.W / 2 + cam.sx, G.H / 2 + cam.sy); c.scale(cam.zoom, cam.zoom); c.translate(-cam.x, -cam.y);
  };
  G.camReset = () => { Object.assign(G.cam, { x: 800, y: 450, zoom: 1, shake: 0, sx: 0, sy: 0 }); };
  let slow = { scale: 1, until: 0 };
  G.slowmo = (scale, sec) => { slow = { scale, until: performance.now() + sec * 1000 }; };
  G.slowHold = 1; /* scenes may set <1 each frame for sustained slow motion */
  G.flash = (color, sec) => {
    const fx = document.getElementById('fx'); if (!fx) return;
    fx.style.transition = 'none'; fx.style.background = color; fx.style.opacity = '.5';
    requestAnimationFrame(() => { fx.style.transition = 'opacity ' + (sec || .25) + 's ease-out'; fx.style.opacity = '0'; });
  };
  G.buffer = draw => {
    const b = document.createElement('canvas'); b.width = Math.round(G.W * G.res); b.height = Math.round(G.H * G.res);
    const c = b.getContext('2d'); c.scale(G.res, G.res); draw(c); b._res = G.res; return b;
  };

  /* ---------- scenes ---------- */
  G.setScene = (s, arg) => {
    if (G.scene && G.scene.exit) G.scene.exit();
    tweens.length = 0; waits.length = 0; G.paused = false; G.camReset(); G.timeScale = 1; G.slowHold = 1; slow.until = 0;
    G.scene = s; if (s.enter) s.enter(arg);
  };

  /* ---------- stage fit + loop ---------- */
  let cv, ctx, wrap, stage, frame;
  function fit() {
    const cs = getComputedStyle(frame);
    const aw = frame.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
    const ah = frame.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);
    const s = Math.max(.05, Math.min(aw / G.W, ah / G.H)); G.scale = s;
    wrap.style.width = Math.floor(G.W * s) + 'px'; wrap.style.height = Math.floor(G.H * s) + 'px';
    stage.style.transform = 'scale(' + s + ')';
    const res = U.clamp(s * (window.devicePixelRatio || 1), .75, 2);
    if (Math.abs(res - G.res) > .01 || cv.width < 10) { G.res = res; cv.width = Math.round(G.W * res); cv.height = Math.round(G.H * res); }
  }
  let last = 0;
  function loop(now) {
    const real = Math.min(.05, (now - last) / 1000 || 0); last = now;
    const target = Math.min(now < slow.until ? slow.scale : 1, G.slowHold);
    G.timeScale += (target - G.timeScale) * Math.min(1, real * 9);
    const dt = G.paused ? 0 : real * G.timeScale; G.time += dt;
    const cam = G.cam; cam.shake *= Math.exp(-real * 5.5);
    if (cam.shake < .3) { cam.shake = 0; cam.sx = cam.sy = 0; } else { cam.sx = U.rand(-1, 1) * cam.shake; cam.sy = U.rand(-1, 1) * cam.shake; }
    stepTimers(dt);
    if (G.scene) {
      if (G.scene.update) G.scene.update(dt, real);
      ctx.setTransform(G.res, 0, 0, G.res, 0, 0);
      ctx.clearRect(0, 0, G.W, G.H);
      if (G.scene.draw) G.scene.draw(ctx);
    }
    requestAnimationFrame(loop);
  }
  G.boot = () => {
    cv = document.getElementById('cv'); ctx = cv.getContext('2d');
    wrap = document.getElementById('wrap'); stage = document.getElementById('stage'); frame = document.getElementById('frame');
    fit(); window.addEventListener('resize', fit); window.addEventListener('orientationchange', () => setTimeout(fit, 250));
    if (window.ResizeObserver) new ResizeObserver(fit).observe(frame);
    const pt = e => { const r = cv.getBoundingClientRect(); return { x: (e.clientX - r.left) / r.width * G.W, y: (e.clientY - r.top) / r.height * G.H }; };
    cv.addEventListener('pointerdown', e => { A.init(); const p = pt(e); if (G.scene && G.scene.down) G.scene.down(p.x, p.y); });
    cv.addEventListener('pointermove', e => { const p = pt(e); if (G.scene && G.scene.move) G.scene.move(p.x, p.y); });
    document.addEventListener('pointerdown', () => A.init(), { passive: true });
    requestAnimationFrame(loop);
  };
})();
