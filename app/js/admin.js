/* admin.js — question control panel: add one, add many, browse/edit. Talks to Supabase directly. */
(function () {
  'use strict';
  const CFG = window.GJ_CFG, sb = window.supabase.createClient(CFG.url, CFG.key);
  const app = document.getElementById('app'), $ = s => app.querySelector(s);
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const LEVELS = [200, 400, 600], LC = { 200: '#1FE0A8', 400: '#FFD23F', 600: '#FF2E63' };
  const BUILTIN = (window.G && window.G.Q && window.G.Q.builtin) || [];
  const MAX_MB = 45;
  const blank = keep => ({ id: null, category: keep ? keep.category : '', level: keep ? keep.level : 200, question: '', answer: '', media: null, amedia: null });
  const S = { uid: undefined, session: null, state: 'loading', tab: 'add', rows: [], form: blank(), filter: { cat: '', level: 0, q: '' }, parsed: null, armed: null };

  let toastT;
  function toast(msg, bad) { const t = document.getElementById('toast'); t.textContent = msg; t.className = 'show' + (bad ? ' bad' : ''); clearTimeout(toastT); toastT = setTimeout(() => { t.className = ''; }, bad ? 4500 : 2400); }
  const arErr = e => { const m = (e && (e.message || e.error_description)) || String(e); return /Invalid login/i.test(m) ? 'الإيميل أو كلمة السر غلط' : /not confirmed/i.test(m) ? 'افتح إيميلك واضغط رابط التأكيد أول' : /already registered/i.test(m) ? 'هذا الإيميل مسجّل من قبل، سجّل دخول' : /at least 6/i.test(m) ? 'كلمة السر لازم 6 حروف على الأقل' : /row-level security|permission denied/i.test(m) ? 'حسابك ما له صلاحية الإضافة' : m; };
  const cats = () => S.rows.map(r => r.category).concat(BUILTIN.map(q => q.c)).filter((c, i, a) => c && a.indexOf(c) === i);
  const toLatin = s => String(s).replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d));

  /* ---------- data ---------- */
  async function loadRows() {
    const all = [];
    for (let from = 0; from < 20000; from += 1000) {
      const { data, error } = await sb.from('questions').select('*').order('created_at', { ascending: false }).range(from, from + 999);
      if (error) throw error; all.push.apply(all, data); if (data.length < 1000) break;
    }
    S.rows = all;
  }
  async function boot() {
    if (!S.session) { S.state = 'login'; return render(); }
    S.state = 'loading'; render();
    const a = await sb.from('admins').select('user_id').eq('user_id', S.session.user.id).maybeSingle();
    if (a.error) { S.state = /PGRST205|42P01/.test(a.error.code || '') || /schema cache|does not exist/i.test(a.error.message || '') ? 'setup' : 'error'; S.err = a.error.message; return render(); }
    if (!a.data) { S.state = 'noadmin'; return render(); }
    try { await loadRows(); S.state = 'ready'; } catch (e) { S.state = 'error'; S.err = e.message; }
    render();
  }
  function shrink(file) {
    return new Promise(res => {
      const img = new Image(), url = URL.createObjectURL(file);
      img.onerror = () => { URL.revokeObjectURL(url); res(file); };
      img.onload = () => {
        URL.revokeObjectURL(url);
        const k = Math.min(1, 1600 / Math.max(img.naturalWidth, img.naturalHeight));
        if (k === 1 && file.size < 400000) return res(file);
        const cv = document.createElement('canvas'); cv.width = Math.round(img.naturalWidth * k); cv.height = Math.round(img.naturalHeight * k);
        cv.getContext('2d').drawImage(img, 0, 0, cv.width, cv.height);
        cv.toBlob(b => { if (b && b.type === 'image/webp') return res(b); cv.toBlob(j => res(j || file), 'image/jpeg', .86); }, 'image/webp', .86);
      };
      img.src = url;
    });
  }
  async function upload(file) {
    const type = /^image\//.test(file.type) ? 'image' : /^audio\//.test(file.type) ? 'audio' : /^video\//.test(file.type) ? 'video' : null;
    if (!type) throw new Error('نوع الملف غير مدعوم: لازم صورة أو صوت أو فيديو');
    let blob = file, ext = (file.name.split('.').pop() || 'bin').toLowerCase().replace(/[^a-z0-9]/g, '');
    if (type === 'image' && !/gif|svg/.test(file.type)) { blob = await shrink(file); if (blob !== file) ext = blob.type === 'image/webp' ? 'webp' : 'jpg'; }
    if (blob.size > MAX_MB * 1048576) throw new Error('الملف أكبر من ' + MAX_MB + ' ميجا، قصّه أو قلّل جودته');
    const id = (window.crypto && crypto.randomUUID) ? crypto.randomUUID() : Date.now() + '-' + Math.random().toString(36).slice(2);
    const path = type + '/' + id + '.' + ext;
    const { error } = await sb.storage.from('media').upload(path, blob, { contentType: blob.type || file.type, cacheControl: '31536000' });
    if (error) throw error;
    return { url: sb.storage.from('media').getPublicUrl(path).data.publicUrl, type };
  }

  /* ---------- views ---------- */
  const mediaPrev = (m, key) => !m ? '' : `<div class="prev">${m.type === 'image' ? `<img src="${esc(m.url)}" alt="">` : m.type === 'video' ? `<video src="${esc(m.url)}" controls playsinline preload="metadata"></video>` : `<audio src="${esc(m.url)}" controls preload="none"></audio>`}<button class="btn xs ghost" data-a="rm-${key}">شيل الملف</button></div>`;
  function vLogin() {
    return `<div class="top"><h1>لوحة الأسئلة</h1></div>
    <form class="card" id="login"><h2>تسجيل الدخول</h2>
      <label class="f">الإيميل<input type="email" id="lg-email" autocomplete="username" required dir="ltr"></label>
      <label class="f">كلمة السر<input type="password" id="lg-pass" autocomplete="current-password" minlength="6" required dir="ltr"></label>
      <div class="row"><button class="btn grow" data-a="signin">دخول</button><button class="btn ghost" type="button" data-a="signup">حساب جديد</button></div>
      <p class="note">أول مرة؟ اكتب إيميلك وكلمة سر واضغط <b>حساب جديد</b>، وبيوصلك إيميل فيه رابط تأكيد. اضغطه ثم ارجع هنا وسجّل دخول. أول حساب يتسجّل هو المشرف الوحيد.</p>
    </form>`;
  }
  function vSetup() {
    return `<div class="top"><h1>لوحة الأسئلة</h1><button class="btn xs ghost" data-a="signout">خروج</button></div>
    <div class="card"><h2>باقي خطوة: تجهيز قاعدة البيانات</h2>
      <p>الجداول ما انعملت للحين. افتح Supabase ← <b>SQL Editor</b>، الصق محتوى الملف <code dir="ltr">supabase/setup.sql</code> واضغط <b>Run</b>، ثم ارجع هنا.</p>
      <button class="btn" data-a="retry">جرّب من جديد</button></div>`;
  }
  function vAdd() {
    const f = S.form, cs = cats(), isNew = f.category && cs.indexOf(f.category) < 0;
    return `<div class="card"><h2>${f.id ? 'تعديل سؤال' : 'سؤال جديد'}</h2>
      <div class="two">
        <label class="f">الفئة<select id="f-cat"><option value="">اختر فئة</option>${cs.map(c => `<option ${c === f.category ? 'selected' : ''}>${esc(c)}</option>`).join('')}<option value="__new" ${isNew ? 'selected' : ''}>+ فئة جديدة</option></select>
          <input type="text" id="f-newcat" placeholder="اسم الفئة الجديدة" value="${isNew ? esc(f.category) : ''}" ${isNew ? '' : 'hidden'}></label>
        <div class="f">النقاط<div class="seg" id="f-level">${LEVELS.map(l => `<button type="button" data-level="${l}" style="--c:${LC[l]}" class="${l === f.level ? 'on' : ''}">${l}</button>`).join('')}</div></div>
      </div>
      <label class="f">السؤال<textarea id="f-q">${esc(f.question)}</textarea></label>
      <label class="f">الجواب<input type="text" id="f-a" value="${esc(f.answer)}"></label>
      <div class="two">
        <label class="f">ملف مع السؤال <span class="mute sm">صورة أو صوت أو فيديو (اختياري)</span>${mediaPrev(f.media, 'm')}<input type="file" id="f-file" accept="image/*,audio/*,video/*"></label>
        <label class="f">ملف يطلع مع الجواب <span class="mute sm">اختياري</span>${mediaPrev(f.amedia, 'am')}<input type="file" id="f-afile" accept="image/*,audio/*,video/*"></label>
      </div>
      <div class="row"><button class="btn mint grow" data-a="save">${f.id ? 'حفظ التعديل' : 'أضف السؤال'}</button>${f.id ? '<button class="btn ghost" data-a="cancel">إلغاء</button>' : ''}</div>
      <p class="note">الصور تتصغّر تلقائياً. خلّ الفيديو قصير (5 إلى 15 ثانية) عشان ما ياكل المساحة، والحد الأقصى للملف ${MAX_MB} ميجا.</p>
    </div>`;
  }
  function vBulk() {
    return `<div class="card"><h2>إضافة دفعة</h2>
      <p class="mute">كل سؤال في سطر، وبين الخانات علامة <b>|</b> بهذا الترتيب: الفئة | النقاط | السؤال | الجواب. وتقدر بعد تنسخ أربعة أعمدة من إكسل أو Google Sheets وتلصقها هنا مباشرة.</p>
      <div class="note"><code dir="rtl">جغرافيا | 400 | ما عاصمة نيوزيلندا؟ | ويلينغتون</code></div>
      <textarea class="big" id="b-text" placeholder="الفئة | النقاط | السؤال | الجواب"></textarea>
      <div id="b-info" class="mute">الصق الأسئلة فوق.</div>
      <button class="btn mint" data-a="bulk" disabled id="b-go">أضف الأسئلة</button>
    </div>`;
  }
  function vList() {
    const f = S.filter, cs = cats().filter(c => S.rows.some(r => r.category === c));
    const rows = S.rows.filter(r => (!f.cat || r.category === f.cat) && (!f.level || r.level === f.level) && (!f.q || (r.question + ' ' + r.answer).indexOf(f.q) >= 0));
    const cnt = (c, l) => S.rows.filter(r => r.category === c && r.level === l && r.active).length;
    return `<div class="card"><h2>عدد الأسئلة <span class="mute sm">(${S.rows.length} سؤال)</span></h2>
      ${cs.length ? `<div class="counts"><table><tr><th>الفئة</th>${LEVELS.map(l => `<th style="color:${LC[l]}">${l}</th>`).join('')}</tr>${cs.map(c => `<tr><td>${esc(c)}</td>${LEVELS.map(l => { const n = cnt(c, l); return `<td class="${n ? '' : 'z'}">${n}</td>`; }).join('')}</tr>`).join('')}</table></div>` : '<p class="mute">ما فيه أسئلة للحين. اللعبة تستخدم الأسئلة التجريبية لين تضيف أسئلتك.</p>'}
      ${!S.rows.length && BUILTIN.length ? `<button class="btn ghost" data-a="import">انسخ الأسئلة التجريبية (${BUILTIN.length}) عشان أعدّل عليها</button>` : ''}
    </div>
    <div class="card"><div class="two"><select id="l-cat"><option value="">كل الفئات</option>${cs.map(c => `<option ${c === f.cat ? 'selected' : ''}>${esc(c)}</option>`).join('')}</select>
      <select id="l-level"><option value="0">كل النقاط</option>${LEVELS.map(l => `<option ${l === f.level ? 'selected' : ''}>${l}</option>`).join('')}</select></div>
      <input type="search" id="l-q" placeholder="ابحث في السؤال أو الجواب" value="${esc(f.q)}">
      <div class="list" id="l-list">${listHTML(rows)}</div></div>`;
  }
  function listHTML(rows) {
    if (!rows.length) return '<p class="mute">ما فيه نتائج.</p>';
    return rows.slice(0, 150).map(r => `<div class="q ${r.active ? '' : 'off'}">
      <div class="meta"><span class="tag l" style="--c:${LC[r.level]}">${r.level}</span><span class="tag">${esc(r.category)}</span>${r.media_url ? `<span class="tag">${{ image: 'صورة', audio: 'صوت', video: 'فيديو' }[r.media_type] || 'ملف'}</span>` : ''}${r.active ? '' : '<span class="tag">مخفي</span>'}</div>
      <div class="qt">${esc(r.question)}</div><div class="an">${esc(r.answer)}</div>
      <div class="row"><button class="btn xs" data-a="edit" data-id="${r.id}">تعديل</button><button class="btn xs ghost" data-a="toggle" data-id="${r.id}">${r.active ? 'إخفاء' : 'إظهار'}</button><button class="btn xs hot" data-a="del" data-id="${r.id}">${S.armed === r.id ? 'متأكد؟ اضغط مرة ثانية' : 'حذف'}</button></div>
    </div>`).join('') + (rows.length > 150 ? `<p class="mute sm">معروض أول 150 من ${rows.length}. استخدم البحث أو الفلتر.</p>` : '');
  }
  function render() {
    let h;
    if (S.state === 'loading') h = '<div class="top"><h1>لوحة الأسئلة</h1></div><div class="card"><p class="mute">لحظة…</p></div>';
    else if (S.state === 'login') h = vLogin();
    else if (S.state === 'setup') h = vSetup();
    else if (S.state === 'noadmin') h = `<div class="top"><h1>لوحة الأسئلة</h1><button class="btn xs ghost" data-a="signout">خروج</button></div><div class="card"><h2>حسابك ما له صلاحية</h2><p class="mute">المشرف هو أول حساب تسجّل. إذا هذا حسابك الوحيد، شغّل ملف <code dir="ltr">supabase/setup.sql</code> مرة ثانية ثم اضغط الزر.</p><button class="btn" data-a="retry">جرّب من جديد</button></div>`;
    else if (S.state === 'error') h = `<div class="top"><h1>لوحة الأسئلة</h1><button class="btn xs ghost" data-a="signout">خروج</button></div><div class="card"><h2>صار خطأ</h2><p class="err">${esc(S.err)}</p><button class="btn" data-a="retry">جرّب من جديد</button></div>`;
    else h = `<div class="top"><h1>لوحة الأسئلة</h1><div class="row"><a class="btn xs ghost" href="index.html" style="text-decoration:none">افتح اللعبة</a><button class="btn xs ghost" data-a="signout">خروج</button></div></div>
      <div class="tabs">${[['add', 'سؤال جديد'], ['bulk', 'إضافة دفعة'], ['list', 'كل الأسئلة']].map(t => `<button data-tab="${t[0]}" class="${S.tab === t[0] ? 'on' : ''}">${t[1]}</button>`).join('')}</div>
      ${S.tab === 'add' ? vAdd() : S.tab === 'bulk' ? vBulk() : vList()}`;
    app.innerHTML = h;
  }

  /* ---------- actions ---------- */
  function readForm() {
    const f = S.form, sel = $('#f-cat').value;
    f.category = (sel === '__new' ? $('#f-newcat').value : sel).trim(); f.question = $('#f-q').value.trim(); f.answer = $('#f-a').value.trim();
  }
  async function save(btn) {
    readForm(); const f = S.form;
    if (!f.category) return toast('اختر الفئة', true);
    if (!f.question || !f.answer) return toast('اكتب السؤال والجواب', true);
    const file = $('#f-file').files[0], afile = $('#f-afile').files[0];
    btn.disabled = true; btn.textContent = file || afile ? 'يرفع الملف…' : 'يحفظ…';
    try {
      const m = file ? await upload(file) : f.media, am = afile ? await upload(afile) : f.amedia;
      const row = { category: f.category, level: f.level, question: f.question, answer: f.answer, media_url: m ? m.url : null, media_type: m ? m.type : null, answer_media_url: am ? am.url : null, answer_media_type: am ? am.type : null };
      const r = f.id ? await sb.from('questions').update(row).eq('id', f.id).select().single() : await sb.from('questions').insert(row).select().single();
      if (r.error) throw r.error;
      if (f.id) S.rows = S.rows.map(x => x.id === f.id ? r.data : x); else S.rows.unshift(r.data);
      toast(f.id ? 'انحفظ التعديل' : 'انضاف السؤال'); const wasEdit = !!f.id; S.form = blank(f); if (wasEdit) S.tab = 'list'; render();
    } catch (e) { toast(arErr(e), true); btn.disabled = false; btn.textContent = f.id ? 'حفظ التعديل' : 'أضف السؤال'; }
  }
  function parseBulk(text) {
    const good = [], bad = [];
    text.split(/\r?\n/).forEach((line, i) => {
      if (!line.trim()) return;
      const p = (line.indexOf('\t') >= 0 ? line.split('\t') : line.split('|')).map(s => s.trim()), lvl = parseInt(toLatin(p[1] || ''), 10);
      if (p.length < 4 || !p[0] || !p[2] || !p[3] || LEVELS.indexOf(lvl) < 0) bad.push(i + 1);
      else good.push({ category: p[0], level: lvl, question: p[2], answer: p.slice(3).join(' | ') });
    });
    return { good, bad };
  }
  async function insertMany(rows, btn) {
    btn.disabled = true;
    try {
      for (let i = 0; i < rows.length; i += 200) { btn.textContent = 'يضيف… ' + Math.min(i + 200, rows.length) + ' من ' + rows.length; const r = await sb.from('questions').insert(rows.slice(i, i + 200)); if (r.error) throw r.error; }
      await loadRows(); toast('انضاف ' + rows.length + ' سؤال'); S.tab = 'list'; S.parsed = null; render();
    } catch (e) { toast(arErr(e), true); btn.disabled = false; btn.textContent = 'أضف الأسئلة'; }
  }

  app.addEventListener('submit', e => e.preventDefault());
  app.addEventListener('click', async e => {
    const tab = e.target.closest('[data-tab]'), lv = e.target.closest('[data-level]'), b = e.target.closest('[data-a]');
    if (tab) { if (S.tab === 'add' && S.state === 'ready' && $('#f-q')) readForm(); S.tab = tab.dataset.tab; S.armed = null; return render(); }
    if (lv) { S.form.level = +lv.dataset.level; app.querySelectorAll('[data-level]').forEach(x => x.classList.toggle('on', x === lv)); return; }
    if (!b) return;
    const a = b.dataset.a, id = b.dataset.id, row = id && S.rows.find(r => r.id === id);
    if (a === 'signin' || a === 'signup') {
      const email = $('#lg-email').value.trim(), password = $('#lg-pass').value;
      if (!email || password.length < 6) return toast('اكتب الإيميل وكلمة سر من 6 حروف أو أكثر', true);
      b.disabled = true;
      const r = a === 'signin' ? await sb.auth.signInWithPassword({ email, password }) : await sb.auth.signUp({ email, password, options: { emailRedirectTo: location.href.split('#')[0] } });
      b.disabled = false;
      if (r.error) return toast(arErr(r.error), true);
      if (a === 'signup' && !r.data.session) toast('وصلك إيميل تأكيد. اضغط الرابط اللي فيه ثم ارجع وسجّل دخول.');
    }
    else if (a === 'signout') { await sb.auth.signOut(); }
    else if (a === 'retry') boot();
    else if (a === 'save') save(b);
    else if (a === 'cancel') { S.form = blank(); S.tab = 'list'; render(); }
    else if (a === 'rm-m' || a === 'rm-am') { readForm(); S.form[a === 'rm-m' ? 'media' : 'amedia'] = null; render(); }
    else if (a === 'bulk') { if (S.parsed && S.parsed.good.length) insertMany(S.parsed.good, b); }
    else if (a === 'import') insertMany(BUILTIN.map(q => ({ category: q.c, level: q.l, question: q.q, answer: q.a })), b);
    else if (a === 'edit' && row) {
      S.form = { id: row.id, category: row.category, level: row.level, question: row.question, answer: row.answer, media: row.media_url ? { url: row.media_url, type: row.media_type } : null, amedia: row.answer_media_url ? { url: row.answer_media_url, type: row.answer_media_type } : null };
      S.tab = 'add'; render(); window.scrollTo(0, 0);
    }
    else if (a === 'toggle' && row) { const r = await sb.from('questions').update({ active: !row.active }).eq('id', id); if (r.error) return toast(arErr(r.error), true); row.active = !row.active; render(); }
    else if (a === 'del' && row) {
      if (S.armed !== id) { S.armed = id; return render(); }
      const r = await sb.from('questions').delete().eq('id', id); if (r.error) return toast(arErr(r.error), true);
      S.rows = S.rows.filter(x => x.id !== id); S.armed = null; toast('انحذف السؤال'); render();
    }
  });
  app.addEventListener('change', e => {
    const t = e.target;
    if (t.id === 'f-cat') { const n = $('#f-newcat'); n.hidden = t.value !== '__new'; if (!n.hidden) n.focus(); }
    else if (t.id === 'l-cat') { S.filter.cat = t.value; render(); }
    else if (t.id === 'l-level') { S.filter.level = +t.value; render(); }
  });
  app.addEventListener('input', e => {
    const t = e.target;
    if (t.id === 'b-text') {
      const p = S.parsed = parseBulk(t.value), info = $('#b-info'), go = $('#b-go');
      info.innerHTML = !p.good.length && !p.bad.length ? 'الصق الأسئلة فوق.' : `<span class="ok">${p.good.length} سؤال جاهز</span>` + (p.bad.length ? ` · <span class="err">${p.bad.length} سطر فيه خطأ (السطور: ${p.bad.slice(0, 12).join('، ')}${p.bad.length > 12 ? '…' : ''}). تأكد من أربع خانات وأن النقاط 200 أو 400 أو 600.</span>` : '');
      go.disabled = !p.good.length; go.textContent = p.good.length ? 'أضف ' + p.good.length + ' سؤال' : 'أضف الأسئلة';
    }
    else if (t.id === 'l-q') {
      S.filter.q = t.value.trim(); const f = S.filter;
      $('#l-list').innerHTML = listHTML(S.rows.filter(r => (!f.cat || r.category === f.cat) && (!f.level || r.level === f.level) && (!f.q || (r.question + ' ' + r.answer).indexOf(f.q) >= 0)));
    }
  });

  sb.auth.onAuthStateChange((_e, sess) => {
    const uid = sess ? sess.user.id : null; if (uid === S.uid) { S.session = sess; return; }
    S.uid = uid; S.session = sess; setTimeout(boot, 0);
  });
  window.__admin = { S, parseBulk };
})();
