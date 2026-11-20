/* =====================================================================
   components.js — Komponen UI bersama: ikon, logo, toast, modal, form,
   tabel, shell dashboard (sidebar/topbar/bottom-nav), notifikasi, laporan.
   ===================================================================== */
(function (global) {
  'use strict';
  const UI = {};
  UI.$ = (s, r) => (r || document).querySelector(s);
  UI.$$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  UI.esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  UI.rp = n => 'Rp ' + Math.round(+n || 0).toLocaleString('id-ID');
  UI.num = n => (+n || 0).toLocaleString('id-ID');
  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  const MONTHS_L = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
  const DAYS = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
  UI.MONTHS_L = MONTHS_L; UI.DAYS = DAYS;
  UI.date = s => { if (!s) return '-'; const d = DB.parseYmd(String(s).slice(0, 10)); return d.getDate() + ' ' + MONTHS[d.getMonth()] + ' ' + d.getFullYear(); };
  UI.dateLong = s => { const d = DB.parseYmd(String(s).slice(0, 10)); return DAYS[d.getDay()] + ', ' + d.getDate() + ' ' + MONTHS_L[d.getMonth()] + ' ' + d.getFullYear(); };
  UI.ago = iso => { const m = Math.round((Date.now() - new Date(iso).getTime()) / 60000); if (m < 1) return 'baru saja'; if (m < 60) return m + ' menit lalu'; if (m < 1440) return Math.round(m / 60) + ' jam lalu'; return Math.round(m / 1440) + ' hari lalu'; };
  UI.initials = n => String(n || '?').trim().split(/\s+/).slice(0, 2).map(w => w[0]).join('').toUpperCase();

  /* ---------- ikon ---------- */
  const IC = {
    home: '<path d="M3 11l9-8 9 8"/><path d="M5 10v10h14V10"/>',
    calendar: '<rect x="3" y="4" width="18" height="17" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
    users: '<circle cx="9" cy="8" r="3.5"/><path d="M2 20c0-4 3-6 7-6s7 2 7 6"/><path d="M16 4.5a3.5 3.5 0 010 7M18 14c2.5.7 4 2.5 4 6"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7"/>',
    leaf: '<path d="M5 19c0-9 5-14 15-14 0 10-5 15-15 15z"/><path d="M5 19L14 10"/>',
    tag: '<path d="M3 12V3h9l9 9-9 9z"/><circle cx="7.5" cy="7.5" r="1.5"/>',
    receipt: '<path d="M5 3h14v18l-3-2-2 2-2-2-2 2-2-2-3 2z"/><path d="M9 8h6M9 12h6"/>',
    chart: '<path d="M4 20V10M10 20V4M16 20v-8M22 20H2"/>',
    gear: '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M19.1 4.9L17 7M7 17l-2.1 2.1"/>',
    logout: '<path d="M9 21H5V3h4M16 17l5-5-5-5M21 12H9"/>',
    bell: '<path d="M6 8a6 6 0 0112 0c0 7 3 8 3 8H3s3-1 3-8"/><path d="M10 21h4"/>',
    moon: '<path d="M21 13A9 9 0 1111 3a7 7 0 0010 10z"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5L19 19M5 19l1.5-1.5M17.5 6.5L19 5"/>',
    star: '<path d="M12 2l3 7 7 .6-5.3 4.7 1.7 7.2L12 17.8 5.6 21.5l1.7-7.2L2 9.6 9 9z"/>',
    plus: '<path d="M12 5v14M5 12h14"/>', edit: '<path d="M4 20h4L20 8l-4-4L4 16z"/>',
    trash: '<path d="M4 7h16M9 7V4h6v3M6 7l1 14h10l1-14"/>', search: '<circle cx="11" cy="11" r="7"/><path d="M21 21l-5-5"/>',
    check: '<path d="M4 12l5 5L20 6"/>', x: '<path d="M6 6l12 12M18 6L6 18"/>', menu: '<path d="M3 6h18M3 12h18M3 18h18"/>',
    print: '<path d="M6 9V3h12v6M6 18H3v-8h18v8h-3M6 14h12v7H6z"/>', download: '<path d="M12 3v12M7 10l5 5 5-5M4 21h16"/>',
    upload: '<path d="M12 15V3M7 8l5-5 5 5M4 21h16"/>',
    eye: '<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
    eyeoff: '<path d="M3 3l18 18M10.6 5.1A9.6 9.6 0 0112 5c6 0 10 7 10 7a17 17 0 01-3.2 3.9M6.6 6.6A17 17 0 002 12s4 7 10 7a9.7 9.7 0 004.1-.9"/>',
    pin: '<path d="M12 22s7-6.5 7-12a7 7 0 10-14 0c0 5.5 7 12 7 12z"/><circle cx="12" cy="10" r="2.5"/>',
    phone: '<path d="M5 3h4l2 5-2.5 1.5a11 11 0 006 6L16 13l5 2v4a2 2 0 01-2 2A16 16 0 013 5a2 2 0 012-2z"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    gift: '<rect x="3" y="8" width="18" height="4"/><path d="M12 8v13M5 12v9h14v-9M12 8c-3-5-6-3-4 0M12 8c3-5 6-3 4 0"/>',
    monitor: '<rect x="3" y="4" width="18" height="12" rx="2"/><path d="M8 21h8M12 16v5"/>',
    wallet: '<path d="M3 7h16a2 2 0 012 2v10H5a2 2 0 01-2-2z"/><path d="M3 7l2-3h12"/><circle cx="16" cy="14" r="1"/>',
    shield: '<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/>', image: '<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="2"/><path d="M21 16l-5-5-9 9"/>',
    note: '<path d="M5 3h14v18H5z"/><path d="M9 8h6M9 12h6M9 16h3"/>', dots: '<circle cx="5" cy="12" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="19" cy="12" r="1.5"/>',
    arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>', chevron: '<path d="M9 6l6 6-6 6"/>', whatsapp: '<path d="M3 21l1.6-5A8.5 8.5 0 1112 20.5a8.4 8.4 0 01-4.2-1.1z"/><path d="M9 8c0 3 3 6 6 6l1-1.5-2-1-1 .8c-1-.4-2-1.4-2.4-2.4l.8-1-1-2z"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.5"/>', copy: '<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5a1 1 0 00-1-1H5a1 1 0 00-1 1v10a1 1 0 001 1h3"/>',
    activity: '<path d="M3 12h4l3-8 4 16 3-8h4"/>', play: '<path d="M7 4l13 8-13 8z"/>', refresh: '<path d="M20 5v5h-5M4 19v-5h5M5.5 9A8 8 0 0119 8M18.5 15A8 8 0 015 16"/>'
  };
  UI.icon = (n, c) => '<svg class="ic ' + (c || '') + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (IC[n] || '') + '</svg>';

  /* ---------- logo ---------- */
  const leaf = (x, y, a, s) => '<path transform="translate(' + x + ' ' + y + ') rotate(' + a + ') scale(' + (s || 1) + ')" d="M0 0Q7-11 19-5Q10 5 0 0z"/>';
  UI.logo = function (size, opts) {
    opts = opts || {}; const s = DB.settings();
    if (s.logo) return '<img class="logo-img" src="' + UI.esc(s.logo) + '" alt="Logo ' + UI.esc(s.businessName) + '" style="width:' + size + 'px;height:' + size + 'px" onerror="this.outerHTML=\'\'">';
    return '<span class="logo' + (opts.mini ? ' mini' : '') + '" style="--s:' + size + 'px" role="img" aria-label="Logo Kayuputih Family Reflexology">' +
      '<svg viewBox="0 0 100 50" aria-hidden="true"><path d="M8 38C30 27 62 24 94 35" stroke="#5a5a56" stroke-width="2.4" fill="none" stroke-linecap="round"/><g fill="#A8D92B">' +
      leaf(20, 31, -35) + leaf(36, 29, -25) + leaf(52, 28, -5) + leaf(68, 30, 15) + leaf(26, 36, 20, .85) + leaf(42, 35, 10, .85) + leaf(60, 36, 35, .85) + '</g></svg>' +
      (opts.mini ? '' : '<b>KAYUPUTIH</b><i>family reflexology</i>') + '</span>';
  };
  UI.PLACEHOLDER = "data:image/svg+xml;utf8," + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#8A6345"/><stop offset="1" stop-color="#493020"/></linearGradient></defs><rect width="400" height="300" fill="url(#g)"/><g fill="#A8D92B" opacity=".85"><path d="M150 180q20-50 80-40-20 50-80 40z"/><path d="M190 200q10-40 60-45-8 40-60 45z" opacity=".7"/></g></svg>');
  UI.img = (src, alt, cls) => '<img class="' + (cls || '') + '" src="' + UI.esc(src || UI.PLACEHOLDER) + '" alt="' + UI.esc(alt || '') + '" loading="lazy" onerror="this.onerror=null;this.src=UI.PLACEHOLDER">';
  UI.avatar = (name, photo, cls) => photo ? '<img class="avatar ' + (cls || '') + '" src="' + UI.esc(photo) + '" alt="' + UI.esc(name) + '" onerror="this.outerHTML=\'<span class=&quot;avatar ' + (cls || '') + '&quot;>' + UI.esc(UI.initials(name)) + '</span>\'">' : '<span class="avatar ' + (cls || '') + '">' + UI.esc(UI.initials(name)) + '</span>';

  /* ---------- tema ---------- */
  UI.theme = () => { try { return localStorage.getItem('kp_theme') || 'light'; } catch (e) { return 'light'; } };
  UI.setTheme = t => { document.documentElement.dataset.theme = t; try { localStorage.setItem('kp_theme', t); } catch (e) { } UI.$$('[data-theme-ic]').forEach(b => b.innerHTML = UI.icon(t === 'dark' ? 'sun' : 'moon')); };
  UI.initTheme = () => { UI.setTheme(UI.theme()); document.addEventListener('click', e => { if (e.target.closest('[data-theme-toggle]')) UI.setTheme(UI.theme() === 'dark' ? 'light' : 'dark'); }); };

  /* ---------- toast ---------- */
  UI.toast = function (msg, type) {
    let w = UI.$('#toasts'); if (!w) { w = document.createElement('div'); w.id = 'toasts'; w.className = 'toasts'; w.setAttribute('aria-live', 'polite'); document.body.appendChild(w); }
    const t = document.createElement('div'); t.className = 'toast ' + (type || 'ok');
    t.innerHTML = UI.icon(type === 'err' ? 'x' : type === 'info' ? 'info' : 'check') + '<span>' + UI.esc(msg) + '</span>';
    w.appendChild(t); requestAnimationFrame(() => t.classList.add('in'));
    setTimeout(() => { t.classList.remove('in'); setTimeout(() => t.remove(), 300); }, 3600);
  };
  global.addEventListener('kp:error', e => UI.toast(e.detail, 'err'));

  /* ---------- modal ---------- */
  UI.modal = function (o) {
    const back = document.createElement('div'); back.className = 'modal-back';
    back.innerHTML = '<div class="modal ' + (o.size || '') + '" role="dialog" aria-modal="true" aria-label="' + UI.esc(o.title) + '"><div class="modal-h"><h3>' + UI.esc(o.title) + '</h3><button class="icon-btn" data-close aria-label="Tutup">' + UI.icon('x') + '</button></div><div class="modal-b">' + (o.body || '') + '</div>' + (o.footer ? '<div class="modal-f">' + o.footer + '</div>' : '') + '</div>';
    document.body.appendChild(back); document.body.classList.add('noscroll');
    const close = () => { back.classList.remove('in'); document.body.classList.toggle('noscroll', UI.$$('.modal-back').length > 1); setTimeout(() => back.remove(), 200); document.removeEventListener('keydown', esc); if (o.onClose) o.onClose(); };
    const esc = e => { if (e.key === 'Escape' && back === UI.$$('.modal-back').pop()) close(); };
    back.addEventListener('mousedown', e => { if (e.target === back) close(); });
    back.addEventListener('click', e => { if (e.target.closest('[data-close]')) close(); });
    document.addEventListener('keydown', esc);
    requestAnimationFrame(() => { back.classList.add('in'); const f = UI.$('input:not([type=hidden]):not([type=file]),select,textarea', back); if (f && o.focus !== false) f.focus(); });
    if (o.onMount) o.onMount(back, close);
    return { el: back, close };
  };
  UI.confirm = o => new Promise(res => {
    if (typeof o === 'string') o = { message: o };
    let done = false; const m = UI.modal({
      title: o.title || 'Konfirmasi', size: 'sm', body: '<p class="confirm-msg">' + o.message + '</p>',
      footer: '<button class="btn btn-ghost" data-close>Batal</button><button class="btn ' + (o.danger ? 'btn-danger' : 'btn-primary') + '" data-ok>' + UI.esc(o.okText || 'Ya, lanjutkan') + '</button>',
      onClose: () => { if (!done) res(false); }, focus: false
    });
    UI.$('[data-ok]', m.el).addEventListener('click', () => { done = true; res(true); m.close(); });
  });

  /* ---------- form ---------- */
  UI.readImage = function (file, max) {
    return new Promise((res, rej) => {
      if (!file || !/^image\//.test(file.type)) return rej(new Error('File harus berupa gambar.'));
      const fr = new FileReader(); fr.onerror = () => rej(new Error('Gagal membaca file.'));
      fr.onload = () => { const im = new Image(); im.onerror = () => rej(new Error('Gambar tidak valid.')); im.onload = () => { const k = Math.min(1, (max || 800) / Math.max(im.width, im.height)); const c = document.createElement('canvas'); c.width = Math.round(im.width * k); c.height = Math.round(im.height * k); c.getContext('2d').drawImage(im, 0, 0, c.width, c.height); res(c.toDataURL('image/jpeg', .72)); }; im.src = fr.result; };
      fr.readAsDataURL(file);
    });
  };
  const optHtml = (o, val) => (o || []).map(x => { const v = typeof x === 'object' ? x.value : x, l = typeof x === 'object' ? x.label : x; return '<option value="' + UI.esc(v) + '"' + (String(v) === String(val) ? ' selected' : '') + '>' + UI.esc(l) + '</option>'; }).join('');
  UI.fields = function (fields, v) {
    v = v || {};
    return fields.map(f => {
      const val = v[f.name] != null ? v[f.name] : (f.value != null ? f.value : ''); const id = 'f_' + f.name; const req = f.required ? ' required' : '';
      let inp;
      if (f.type === 'select') inp = '<select class="input" id="' + id + '" name="' + f.name + '"' + req + '>' + optHtml(f.options, val) + '</select>';
      else if (f.type === 'textarea') inp = '<textarea class="input" id="' + id + '" name="' + f.name + '" rows="' + (f.rows || 3) + '"' + req + (f.placeholder ? ' placeholder="' + UI.esc(f.placeholder) + '"' : '') + '>' + UI.esc(val) + '</textarea>';
      else if (f.type === 'checkbox') return '<label class="field check span-' + (f.span || 2) + '"><input type="checkbox" name="' + f.name + '"' + (val ? ' checked' : '') + '><span>' + UI.esc(f.label) + '</span></label>';
      else if (f.type === 'days') inp = '<div class="days" data-days="' + f.name + '">' + DAYS.map((d, i) => '<label><input type="checkbox" value="' + i + '"' + ((val || []).includes(i) ? ' checked' : '') + '><span>' + d + '</span></label>').join('') + '</div>';
      else if (f.type === 'image') inp = '<div class="imgfield" data-img="' + f.name + '"><img src="' + UI.esc(val || UI.PLACEHOLDER) + '" alt="" onerror="this.onerror=null;this.src=UI.PLACEHOLDER"><div><input type="hidden" name="' + f.name + '" value="' + UI.esc(val) + '"><input class="input" type="text" data-url placeholder="Tempel URL gambar" value="' + UI.esc(/^data:/.test(val) ? '' : val) + '"><label class="btn btn-ghost btn-sm">' + UI.icon('upload') + ' Unggah foto<input type="file" accept="image/*" hidden></label></div></div>';
      else inp = '<input class="input" id="' + id + '" name="' + f.name + '" type="' + (f.type || 'text') + '" value="' + UI.esc(val) + '"' + req + (f.min != null ? ' min="' + f.min + '"' : '') + (f.max != null ? ' max="' + f.max + '"' : '') + (f.step ? ' step="' + f.step + '"' : '') + (f.placeholder ? ' placeholder="' + UI.esc(f.placeholder) + '"' : '') + (f.autocomplete ? ' autocomplete="' + f.autocomplete + '"' : '') + '>';
      return '<div class="field span-' + (f.span || 2) + '"><label for="' + id + '">' + UI.esc(f.label) + (f.required ? ' <em>*</em>' : '') + '</label>' + inp + (f.hint ? '<small class="hint">' + UI.esc(f.hint) + '</small>' : '') + '<small class="err" data-err="' + f.name + '"></small></div>';
    }).join('');
  };
  UI.bindFields = function (root) {
    UI.$$('[data-img]', root).forEach(b => {
      const hid = UI.$('input[type=hidden]', b), im = UI.$('img', b), url = UI.$('[data-url]', b), file = UI.$('input[type=file]', b);
      url.addEventListener('input', () => { hid.value = url.value.trim(); im.src = hid.value || UI.PLACEHOLDER; });
      file.addEventListener('change', async () => { try { hid.value = await UI.readImage(file.files[0], 800); im.src = hid.value; url.value = ''; url.placeholder = 'Foto terunggah'; } catch (e) { UI.toast(e.message, 'err'); } });
    });
  };
  UI.collect = function (form, fields) {
    const out = {}; let ok = true; UI.$$('.err', form).forEach(e => e.textContent = ''); UI.$$('.input.bad', form).forEach(e => e.classList.remove('bad'));
    const bad = (n, m) => { ok = false; const e = UI.$('[data-err="' + n + '"]', form); if (e) e.textContent = m; const i = form.elements[n]; if (i && i.classList) i.classList.add('bad'); };
    fields.forEach(f => {
      if (f.type === 'checkbox') { out[f.name] = form.elements[f.name].checked; return; }
      if (f.type === 'days') { out[f.name] = UI.$$('[data-days="' + f.name + '"] input:checked', form).map(i => +i.value); if (f.required && !out[f.name].length) bad(f.name, 'Pilih minimal satu hari.'); return; }
      let v = form.elements[f.name].value; if (typeof v === 'string') v = v.trim();
      if (f.required && v === '') { bad(f.name, f.label + ' wajib diisi.'); return; }
      if (v !== '') {
        if (f.type === 'email' && !Auth.validEmail(v)) bad(f.name, 'Format email tidak valid.');
        if (f.type === 'tel' && !/^[\d+\-\s]{8,16}$/.test(v)) bad(f.name, 'Nomor telepon tidak valid.');
        if (f.type === 'number') { v = Number(v); if (isNaN(v)) bad(f.name, 'Harus berupa angka.'); else if (f.min != null && v < f.min) bad(f.name, 'Minimal ' + f.min + '.'); else if (f.max != null && v > f.max) bad(f.name, 'Maksimal ' + f.max + '.'); }
        if (f.type === 'url' && !/^(https?:\/\/|data:image)/.test(v)) bad(f.name, 'URL harus diawali http(s)://');
      } else if (f.type === 'number') v = 0;
      out[f.name] = v;
    });
    return ok ? out : null;
  };
  UI.form = function (o) {
    const body = '<form class="form-grid" novalidate>' + UI.fields(o.fields, o.values) + '<div class="form-err" data-formerr></div></form>';
    const m = UI.modal({ title: o.title, size: o.size || '', body, footer: '<button class="btn btn-ghost" data-close>Batal</button><button class="btn btn-primary" data-submit>' + UI.esc(o.submitText || 'Simpan') + '</button>' });
    const form = UI.$('form', m.el); UI.bindFields(form);
    const submit = async () => {
      const vals = UI.collect(form, o.fields); if (!vals) { const e = UI.$('.input.bad', form); if (e) e.focus(); return; }
      const r = await o.onSubmit(vals, m);
      if (typeof r === 'string') UI.$('[data-formerr]', form).textContent = r; else if (r !== false) m.close();
    };
    UI.$('[data-submit]', m.el).addEventListener('click', submit);
    form.addEventListener('submit', e => { e.preventDefault(); submit(); });
    return m;
  };

  /* ---------- komponen kecil ---------- */
  UI.badge = (s, label) => '<span class="badge b-' + s + '">' + UI.esc(label || DB.STATUS[s] || s) + '</span>';
  UI.empty = (msg, icon) => '<div class="empty">' + UI.icon(icon || 'leaf', 'big') + '<p>' + UI.esc(msg || 'Belum ada data') + '</p></div>';
  UI.skeleton = () => '<div class="skel-wrap"><div class="skel h"></div><div class="skel-grid"><div class="skel"></div><div class="skel"></div><div class="skel"></div></div><div class="skel big"></div></div>';
  UI.stat = (icon, label, value, sub, cls) => '<div class="stat ' + (cls || '') + '"><span class="stat-ic">' + UI.icon(icon) + '</span><div><small>' + UI.esc(label) + '</small><strong>' + value + '</strong>' + (sub ? '<em>' + sub + '</em>' : '') + '</div></div>';
  UI.table = function (cols, rows, opts) {
    opts = opts || {}; if (!rows.length) return UI.empty(opts.empty || 'Belum ada data');
    return '<div class="tbl-wrap"><table class="tbl"><thead><tr>' + cols.map(c => '<th class="' + (c.cls || '') + '">' + c.label + '</th>').join('') + '</tr></thead><tbody>' +
      rows.map(r => '<tr>' + cols.map(c => '<td data-label="' + UI.esc(c.label.replace(/<[^>]+>/g, '')) + '" class="' + (c.cls || '') + '">' + (c.render ? c.render(r) : UI.esc(r[c.key])) + '</td>').join('') + '</tr>').join('') + '</tbody></table></div>';
  };
  UI.page = (arr, p, per) => { const pages = Math.max(1, Math.ceil(arr.length / per)); p = Math.min(Math.max(1, p), pages); return { items: arr.slice((p - 1) * per, p * per), page: p, pages, total: arr.length }; };
  UI.pager = pg => pg.pages <= 1 ? '' : '<div class="pager"><button class="btn btn-ghost btn-sm" data-act="page" data-p="' + (pg.page - 1) + '"' + (pg.page <= 1 ? ' disabled' : '') + '>‹ Sebelumnya</button><span>' + pg.page + ' / ' + pg.pages + ' · ' + pg.total + ' data</span><button class="btn btn-ghost btn-sm" data-act="page" data-p="' + (pg.page + 1) + '"' + (pg.page >= pg.pages ? ' disabled' : '') + '>Berikutnya ›</button></div>';
  UI.csv = function (name, cols, rows) {
    const q = v => '"' + String(v == null ? '' : v).replace(/"/g, '""') + '"';
    const txt = '\ufeff' + [cols.map(c => q(c.label)).join(',')].concat(rows.map(r => cols.map(c => q(r[c.key])).join(','))).join('\r\n');
    UI.download(name, txt, 'text/csv;charset=utf-8');
  };
  UI.download = function (name, text, type) {
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([text], { type: type || 'text/plain' })); a.download = name; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  };
  UI.hashParams = () => { const q = (location.hash.split('?')[1] || ''); const o = {}; q.split('&').forEach(p => { if (p) { const [k, v] = p.split('='); o[decodeURIComponent(k)] = decodeURIComponent(v || ''); } }); return o; };
  UI.svcOptions = (onlyActive) => DB.all('services').filter(s => !onlyActive || s.active).map(s => ({ value: s.id, label: s.name + ' · ' + s.duration + ' mnt · ' + UI.rp(s.price) }));
  UI.thName = id => { const t = DB.get('therapists', id); return t ? t.name : '-'; };

  /* ---------- notifikasi ---------- */
  function notifHtml(user) {
    const list = DB.notifsFor(user).slice(0, 25);
    const ic = { reservation: 'calendar', transaction: 'receipt', promo: 'tag', member: 'users', info: 'info' };
    return '<div class="np-h"><strong>Notifikasi</strong><button class="link" data-readall>Tandai dibaca</button></div>' + (list.length ? list.map(n => '<div class="np-i' + (n.readBy.includes(user.id) ? '' : ' unread') + '"><span class="np-ic">' + UI.icon(ic[n.type] || 'bell') + '</span><div><b>' + UI.esc(n.title) + '</b><p>' + UI.esc(n.msg) + '</p><small>' + UI.ago(n.createdAt) + '</small></div></div>').join('') : '<div class="empty small">Belum ada notifikasi</div>');
  }

  /* ---------- shell dashboard ---------- */
  UI.shell = function (cfg) {
    const user = cfg.user, menu = cfg.menu, app = document.getElementById('app'); let cur = null, view = null, timer = null, raf = null;
    const maxB = 4;
    const navLink = m => '<a href="#/' + m.id + '" data-nav="' + m.id + '">' + UI.icon(m.icon) + '<span>' + UI.esc(m.label) + '</span></a>';
    app.innerHTML = '<div class="dash role-' + cfg.role + '"><aside class="side" id="side"><div class="side-brand">' + UI.logo(46) + '<div><b>' + UI.esc(DB.settings().businessName.replace(' Palu', '')) + '</b><small>' + UI.esc(cfg.roleLabel) + '</small></div></div><nav class="side-nav">' + menu.map(navLink).join('') + '</nav><div class="side-foot"><a href="index.html">' + UI.icon('home') + '<span>Lihat Website</span></a><button data-logout>' + UI.icon('logout') + '<span>Logout</span></button></div></aside><div class="backdrop" id="backdrop"></div>' +
      '<div class="main"><header class="topbar"><button class="icon-btn menu-btn" id="menuBtn" aria-label="Menu">' + UI.icon('menu') + '</button><h1 id="pageTitle"></h1><div class="grow"></div><button class="icon-btn" data-theme-toggle data-theme-ic aria-label="Ganti tema"></button><div class="np-wrap"><button class="icon-btn" id="bellBtn" aria-label="Notifikasi">' + UI.icon('bell') + '<span class="dot" id="bellDot" hidden>0</span></button><div class="np" id="notifPanel" hidden></div></div><div class="who">' + UI.avatar(user.name, cfg.photo || '', 'sm') + '<div><b>' + UI.esc(user.name) + '</b><small>' + UI.esc(cfg.roleLabel) + '</small></div></div></header><main class="view" id="view" tabindex="-1"></main></div>' +
      '<nav class="bottomnav">' + menu.slice(0, maxB).map(m => '<a href="#/' + m.id + '" data-nav="' + m.id + '">' + UI.icon(m.icon) + '<span>' + UI.esc(m.short || m.label) + '</span></a>').join('') + '<button id="moreBtn">' + UI.icon('menu') + '<span>Menu</span></button></nav></div>';
    const viewEl = UI.$('#view'), side = UI.$('#side'), back = UI.$('#backdrop');
    const openDrawer = o => { side.classList.toggle('open', o); back.classList.toggle('open', o); };
    UI.$('#menuBtn').onclick = () => openDrawer(true); UI.$('#moreBtn').onclick = () => openDrawer(true); back.onclick = () => openDrawer(false);
    UI.$$('[data-logout]').forEach(b => b.onclick = async () => { if (await UI.confirm({ title: 'Logout', message: 'Keluar dari akun ini?', okText: 'Logout' })) Auth.logout(); });
    const route = () => { const id = (location.hash || '').replace(/^#\/?/, '').split('?')[0]; return menu.some(m => m.id === id) ? id : menu[0].id; };
    const ctx = { user, refresh: () => draw(true), go: id => { location.hash = '#/' + id; }, badge: null };
    const bell = () => { const n = DB.notifsFor(user).filter(x => !x.readBy.includes(user.id)).length; const d = UI.$('#bellDot'); d.hidden = !n; d.textContent = n > 9 ? '9+' : n; };
    const panel = UI.$('#notifPanel');
    UI.$('#bellBtn').onclick = e => { e.stopPropagation(); panel.hidden = !panel.hidden; if (!panel.hidden) panel.innerHTML = notifHtml(user); };
    panel.onclick = e => { e.stopPropagation(); if (e.target.closest('[data-readall]')) { DB.markRead(user); panel.innerHTML = notifHtml(user); bell(); } };
    document.addEventListener('click', () => { panel.hidden = true; });
    function setActive(id) { UI.$$('[data-nav]').forEach(a => a.classList.toggle('active', a.dataset.nav === id)); const m = menu.find(x => x.id === id); UI.$('#pageTitle').textContent = m.label; document.title = m.label + ' · ' + cfg.roleLabel + ' · Kayuputih'; }
    function draw(keep) {
      const ae = document.activeElement; const aid = ae && viewEl.contains(ae) ? ae.id : null; const sel = ae && ae.selectionStart != null && aid ? [ae.selectionStart, ae.selectionEnd] : null; const sy = window.scrollY;
      try { viewEl.innerHTML = view.render(ctx); } catch (e) { console.error(e); viewEl.innerHTML = UI.empty('Terjadi kesalahan saat menampilkan halaman.'); }
      try { if (view.mount) view.mount(viewEl, ctx); } catch (e) { console.error(e); }
      if (aid) { const n = document.getElementById(aid); if (n) { n.focus(); if (sel && n.setSelectionRange) try { n.setSelectionRange(sel[0], sel[1]); } catch (e) { } } }
      if (keep) window.scrollTo(0, sy);
      bell();
    }
    function show() {
      const id = route(), changed = id !== cur; cur = id; view = cfg.views[id]; view.ctx = ctx; setActive(id); openDrawer(false);
      if (changed) { viewEl.innerHTML = UI.skeleton(); window.scrollTo(0, 0); clearTimeout(timer); timer = setTimeout(() => draw(false), 160); } else draw(true);
    }
    viewEl.addEventListener('click', e => { const t = e.target.closest('[data-act]'); if (!t || !viewEl.contains(t) || t.disabled) return; const f = view.actions && view.actions[t.dataset.act]; if (f) { e.preventDefault(); f.call(view, t, e); } });
    ['input', 'change'].forEach(ev => viewEl.addEventListener(ev, e => {
      const t = e.target.closest('[data-in]'); if (!t) return; const f = view.inputs && view.inputs[t.dataset.in]; if (!f) return;
      const instant = t.tagName === 'SELECT' || ['date', 'time', 'checkbox', 'radio'].includes(t.type);
      if ((ev === 'input' && instant) || (ev === 'change' && !instant)) return;
      f.call(view, t, e);
    }));
    window.addEventListener('hashchange', show);
    window.addEventListener('kp:change', () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(() => { if (view) draw(true); }); });
    show();
    return ctx;
  };

  /* ---------- laporan ---------- */
  const R = {};
  R.range = function (period, anchor) {
    const d = DB.parseYmd(anchor);
    if (period === 'harian') return { from: anchor, to: anchor, label: UI.dateLong(anchor) };
    if (period === 'mingguan') { const w = (d.getDay() + 6) % 7; const f = DB.addDays(anchor, -w), t = DB.addDays(f, 6); return { from: f, to: t, label: UI.date(f) + ' – ' + UI.date(t) }; }
    if (period === 'bulanan') { const f = DB.ymd(new Date(d.getFullYear(), d.getMonth(), 1)), t = DB.ymd(new Date(d.getFullYear(), d.getMonth() + 1, 0)); return { from: f, to: t, label: MONTHS_L[d.getMonth()] + ' ' + d.getFullYear() }; }
    return { from: d.getFullYear() + '-01-01', to: d.getFullYear() + '-12-31', label: 'Tahun ' + d.getFullYear() };
  };
  R.compute = function (type, period, anchor) {
    const rg = R.range(period, anchor), inr = x => x >= rg.from && x <= rg.to;
    const tx = DB.all('transactions').filter(t => t.payStatus === 'lunas' && inr(t.date));
    const res = DB.all('reservations').filter(r => inr(r.date));
    const sum = (a, f) => a.reduce((s, x) => s + f(x), 0);
    const keyOf = d => period === 'tahunan' ? MONTHS_L[+d.slice(5, 7) - 1] : d;
    const group = (arr, kf) => { const m = new Map(); arr.forEach(x => { const k = kf(x); if (!m.has(k)) m.set(k, []); m.get(k).push(x); }); return m; };
    let o;
    if (type === 'pendapatan') {
      const g = group(tx.slice().sort((a, b) => a.date.localeCompare(b.date)), t => keyOf(t.date));
      o = { columns: [{ key: 'periode', label: 'Periode' }, { key: 'jumlah', label: 'Transaksi', type: 'num' }, { key: 'subtotal', label: 'Subtotal', type: 'rp' }, { key: 'diskon', label: 'Diskon', type: 'rp' }, { key: 'total', label: 'Pendapatan', type: 'rp' }], rows: [...g].map(([k, a]) => ({ periode: period === 'tahunan' ? k : UI.date(k), jumlah: a.length, subtotal: sum(a, x => x.subtotal), diskon: sum(a, x => x.discount), total: sum(a, x => x.total) })), summary: [['Total pendapatan', UI.rp(sum(tx, x => x.total))], ['Jumlah transaksi', UI.num(tx.length)], ['Rata-rata/transaksi', UI.rp(tx.length ? sum(tx, x => x.total) / tx.length : 0)], ['Total diskon', UI.rp(sum(tx, x => x.discount))]] };
    } else if (type === 'layanan') {
      const m = {}; tx.forEach(t => t.items.forEach(i => { m[i.name] = m[i.name] || { layanan: i.name, qty: 0, total: 0 }; m[i.name].qty += i.qty; m[i.name].total += i.qty * i.price; }));
      const rows = Object.values(m).sort((a, b) => b.total - a.total);
      o = { columns: [{ key: 'layanan', label: 'Layanan' }, { key: 'qty', label: 'Jumlah', type: 'num' }, { key: 'total', label: 'Pendapatan', type: 'rp' }], rows, summary: [['Layanan terjual', UI.num(sum(rows, x => x.qty))], ['Terpopuler', rows[0] ? rows[0].layanan : '-'], ['Pendapatan layanan', UI.rp(sum(rows, x => x.total))]] };
    } else if (type === 'reservasi') {
      const c = s => res.filter(r => r.status === s).length;
      o = { columns: [{ key: 'kode', label: 'Kode' }, { key: 'tanggal', label: 'Tanggal', type: 'date' }, { key: 'jam', label: 'Jam' }, { key: 'pelanggan', label: 'Pelanggan' }, { key: 'layanan', label: 'Layanan' }, { key: 'terapis', label: 'Terapis' }, { key: 'status', label: 'Status', type: 'status' }], rows: res.sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time)).map(r => ({ kode: r.code, tanggal: r.date, jam: r.time, pelanggan: r.customerName, layanan: r.serviceName, terapis: UI.thName(r.therapistId), status: r.status })), summary: [['Total reservasi', UI.num(res.length)], ['Selesai', UI.num(c('done'))], ['Dibatalkan', UI.num(c('cancelled'))], ['Menunggu/aktif', UI.num(c('pending') + c('confirmed') + c('serving'))]] };
    } else if (type === 'member') {
      const rows = DB.all('members').map(m => { const t = tx.filter(x => x.memberId === m.id); return { nomor: m.number, nama: m.name, bergabung: m.joinDate, kunjungan: t.length, belanja: sum(t, x => x.total), poin: m.points, level: DB.level(m.points) }; }).filter(r => r.kunjungan || (r.bergabung >= rg.from && r.bergabung <= rg.to)).sort((a, b) => b.belanja - a.belanja);
      o = { columns: [{ key: 'nomor', label: 'No. Member' }, { key: 'nama', label: 'Nama' }, { key: 'bergabung', label: 'Bergabung', type: 'date' }, { key: 'kunjungan', label: 'Kunjungan', type: 'num' }, { key: 'belanja', label: 'Belanja', type: 'rp' }, { key: 'poin', label: 'Poin', type: 'num' }, { key: 'level', label: 'Level' }], rows, summary: [['Member aktif di periode', UI.num(rows.filter(r => r.kunjungan).length)], ['Member baru', UI.num(rows.filter(r => r.bergabung >= rg.from && r.bergabung <= rg.to).length)], ['Total belanja member', UI.rp(sum(rows, r => r.belanja))]] };
    } else if (type === 'karyawan') {
      const rows = DB.all('therapists').map(t => { const a = tx.filter(x => x.therapistId === t.id), r = res.filter(x => x.therapistId === t.id && x.status !== 'cancelled'); return { nama: t.name, status: t.active ? 'Aktif' : 'Nonaktif', pelayanan: a.length, reservasi: r.length, selesai: r.filter(x => x.status === 'done').length, pendapatan: sum(a, x => x.total) }; }).sort((a, b) => b.pelayanan - a.pelayanan);
      o = { columns: [{ key: 'nama', label: 'Terapis' }, { key: 'status', label: 'Status' }, { key: 'pelayanan', label: 'Pelayanan (transaksi)', type: 'num' }, { key: 'reservasi', label: 'Reservasi', type: 'num' }, { key: 'selesai', label: 'Reservasi selesai', type: 'num' }, { key: 'pendapatan', label: 'Pendapatan', type: 'rp' }], rows, summary: [['Terapis aktif', UI.num(rows.filter(r => r.status === 'Aktif').length)], ['Total pelayanan', UI.num(sum(rows, r => r.pelayanan))], ['Teratas', rows[0] ? rows[0].nama : '-']] };
    } else if (type === 'kunjungan') {
      const g = group(tx.slice().sort((a, b) => a.date.localeCompare(b.date)), t => keyOf(t.date));
      const rows = [...g].map(([k, a]) => ({ periode: period === 'tahunan' ? k : UI.date(k), kunjungan: a.length, member: a.filter(x => x.memberId).length, umum: a.filter(x => !x.memberId).length, unik: new Set(a.map(x => x.memberId || x.id)).size }));
      o = { columns: [{ key: 'periode', label: 'Periode' }, { key: 'kunjungan', label: 'Kunjungan', type: 'num' }, { key: 'member', label: 'Member', type: 'num' }, { key: 'umum', label: 'Umum', type: 'num' }, { key: 'unik', label: 'Pelanggan unik', type: 'num' }], rows, summary: [['Total kunjungan', UI.num(tx.length)], ['Dari member', UI.num(tx.filter(x => x.memberId).length)], ['Pelanggan umum', UI.num(tx.filter(x => !x.memberId).length)]] };
    } else if (type === 'pelayanan') {
      const d = res.filter(r => r.status === 'done');
      o = { columns: [{ key: 'kode', label: 'Kode' }, { key: 'tanggal', label: 'Tanggal', type: 'date' }, { key: 'jam', label: 'Jam' }, { key: 'pelanggan', label: 'Pelanggan' }, { key: 'layanan', label: 'Layanan' }, { key: 'durasi', label: 'Durasi (mnt)', type: 'num' }, { key: 'terapis', label: 'Terapis' }], rows: d.map(r => ({ kode: r.code, tanggal: r.date, jam: r.time, pelanggan: r.customerName, layanan: r.serviceName, durasi: r.duration, terapis: UI.thName(r.therapistId) })), summary: [['Pelayanan selesai', UI.num(d.length)], ['Total menit layanan', UI.num(sum(d, x => x.duration || 0))], ['Dibatalkan', UI.num(res.filter(r => r.status === 'cancelled').length)]] };
    } else {
      const notes = DB.all('activityLogs').filter(l => l.type === 'note' && inr(l.createdAt.slice(0, 10)));
      o = { columns: [{ key: 'waktu', label: 'Waktu' }, { key: 'oleh', label: 'Oleh' }, { key: 'catatan', label: 'Catatan' }], rows: notes.sort((a, b) => b.createdAt.localeCompare(a.createdAt)).map(l => ({ waktu: new Date(l.createdAt).toLocaleString('id-ID'), oleh: l.by, catatan: l.text })), summary: [['Jumlah catatan', UI.num(notes.length)]] };
    }
    o.range = rg; return o;
  };
  const fmtCell = (c, v) => c.type === 'rp' ? UI.rp(v) : c.type === 'num' ? UI.num(v) : c.type === 'date' ? UI.date(v) : c.type === 'status' ? UI.badge(v) : UI.esc(v);
  const rawCell = (c, v) => c.type === 'status' ? (DB.STATUS[v] || v) : v;
  UI.reportView = function (types, title) {
    const st = { type: types[0].id, period: 'bulanan', anchor: DB.today() };
    return {
      render() {
        const r = R.compute(st.type, st.period, st.anchor);
        return '<div class="page-head noprint"><div><h2>' + UI.esc(title || 'Laporan') + '</h2><p class="muted">Data dihitung langsung dari transaksi dan reservasi.</p></div><div class="row"><button class="btn btn-ghost" data-act="csv">' + UI.icon('download') + ' Ekspor CSV</button><button class="btn btn-primary" data-act="print">' + UI.icon('print') + ' Cetak</button></div></div>' +
          '<div class="card noprint"><div class="tabs">' + types.map(t => '<button class="tab' + (t.id === st.type ? ' on' : '') + '" data-act="type" data-v="' + t.id + '">' + t.label + '</button>').join('') + '</div><div class="filters"><label>Periode<select class="input" data-in="period">' + ['harian', 'mingguan', 'bulanan', 'tahunan'].map(p => '<option value="' + p + '"' + (p === st.period ? ' selected' : '') + '>' + p[0].toUpperCase() + p.slice(1) + '</option>').join('') + '</select></label><label>Tanggal acuan<input class="input" type="date" data-in="anchor" value="' + st.anchor + '"></label></div></div>' +
          '<div class="print-only report-head"><h2>' + UI.esc(DB.settings().businessName) + '</h2><p>Laporan ' + (types.find(t => t.id === st.type) || {}).label + ' · ' + UI.esc(r.range.label) + '</p></div>' +
          '<div class="stats">' + r.summary.map(s => '<div class="stat mini"><div><small>' + UI.esc(s[0]) + '</small><strong>' + UI.esc(s[1]) + '</strong></div></div>').join('') + '</div>' +
          '<div class="card"><div class="card-h"><h3>' + (types.find(t => t.id === st.type) || {}).label + ' <span class="muted">· ' + UI.esc(r.range.label) + '</span></h3></div>' + UI.table(r.columns.map(c => ({ label: c.label, cls: c.type === 'rp' || c.type === 'num' ? 'r' : '', render: x => fmtCell(c, x[c.key]) })), r.rows, { empty: 'Tidak ada data pada periode ini' }) + '</div>';
      },
      actions: {
        type(t) { st.type = t.dataset.v; this.ctx.refresh(); },
        csv() { const r = R.compute(st.type, st.period, st.anchor); if (!r.rows.length) return UI.toast('Tidak ada data untuk diekspor.', 'info'); UI.csv('laporan-' + st.type + '-' + st.period + '-' + st.anchor + '.csv', r.columns, r.rows.map(x => { const o = {}; r.columns.forEach(c => o[c.key] = rawCell(c, x[c.key])); return o; })); },
        print() { window.print(); }
      },
      inputs: { period(t) { st.period = t.value; this.ctx.refresh(); }, anchor(t) { if (t.value) { st.anchor = t.value; this.ctx.refresh(); } } },
      bindCtx(c) { this.ctx = c; return this; }
    };
  };
  UI.Reports = R;

  global.UI = UI;
})(window);
