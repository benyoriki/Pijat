/* =====================================================================
   script.js — Landing page Kayuputih. Seluruh konten dibaca dari DB
   (settings, services, promotions, gallery) sehingga bisa diubah Admin.
   ===================================================================== */
(function () {
  'use strict';
  DB.init(); UI.initTheme();
  const $ = UI.$, esc = UI.esc;
  const waLink = (s, text) => { const n = String(s.whatsapp || '').replace(/\D/g, '').replace(/^0/, '62'); return n ? 'https://wa.me/' + n + (text ? '?text=' + encodeURIComponent(text) : '') : ''; };
  const dirLink = s => 'https://www.google.com/maps/dir/?api=1&destination=' + encodeURIComponent(s.businessName + ', ' + s.address);

  function reserveUrl(svcId) {
    const u = Auth.current(); const target = 'member.html#/reservasi' + (svcId ? '?svc=' + svcId : '');
    return u && u.role === 'member' ? target : 'login.html?next=' + encodeURIComponent(target) + '&msg=reservasi';
  }

  function header(s) {
    const u = Auth.current();
    return '<div class="container hd"><a class="brand" href="#beranda">' + UI.logo(48, { mini: false }) + '<div><b>KAYUPUTIH</b><small>family reflexology</small></div></a>' +
      '<nav class="nav" id="nav" aria-label="Navigasi utama">' + [['beranda', 'Beranda'], ['layanan', 'Layanan'], ['harga', 'Harga'], ['promo', 'Promo'], ['galeri', 'Galeri'], ['tentang', 'Tentang Kami'], ['lokasi', 'Lokasi']].map(x => '<a href="#' + x[0] + '" data-sec="' + x[0] + '">' + x[1] + '</a>').join('') + '</nav>' +
      '<div class="hd-act"><button class="icon-btn" data-theme-toggle data-theme-ic aria-label="Ganti tema terang/gelap"></button>' +
      '<a class="btn btn-ghost btn-sm" style="color:#fff;border-color:rgba(255,255,255,.4)" href="' + (u ? Auth.HOME[u.role] : 'login.html') + '">' + UI.icon('user') + (u ? ' Dashboard' : ' Login Member') + '</a>' +
      '<a class="btn btn-primary btn-sm" href="' + reserveUrl() + '">Reservasi Sekarang</a><button class="icon-btn burger" id="burger" aria-label="Buka menu" aria-expanded="false">' + UI.icon('menu') + '</button></div></div>';
  }

  function hero(s) {
    const parts = String(s.heroTitle).split(/,\s*/); const first = parts.shift(), rest = parts.join(', ');
    return '<section class="hero" id="beranda" style="--hero:url(\'' + esc(s.heroImage) + '\')"><div class="container"><div class="hero-copy"><span class="eyebrow">' + UI.icon('leaf') + ' Family Reflexology · Palu</span><h1>' + esc(first) + (rest ? ',<span>' + esc(rest) + '</span>' : '') + '</h1><p class="lead">' + esc(s.heroText) + '</p><div class="hero-cta"><a class="btn btn-primary" href="' + reserveUrl() + '">Reservasi Sekarang</a><a class="btn btn-light" href="#layanan">Lihat Layanan ' + UI.icon('arrow') + '</a></div></div></div><div class="hero-curve"></div></section>' +
      '<div class="container trust rv"><div class="trust-i">' + UI.icon('star', 'star') + '<div><b>' + esc(s.rating) + '/5</b><small>' + UI.num(s.reviews) + ' ulasan Google</small></div></div>' +
      '<div class="trust-i">' + UI.icon('users') + '<div><b>Family</b><small>Reflexology</small></div></div>' +
      '<div class="trust-i">' + UI.icon('pin') + '<div><b>Lokasi</b><small>Palu, Sulawesi Tengah</small></div></div>' +
      '<div class="trust-i">' + UI.icon('clock') + '<div><b>Buka s.d. ' + esc(s.closeTime) + '</b><small>Cek jam operasional</small></div></div></div>';
  }

  const secHead = (eb, t, p) => '<div class="sec-h rv"><span class="eyebrow">' + eb + '</span><h2>' + t + '</h2>' + (p ? '<p>' + p + '</p>' : '') + '</div>';
  const demoTag = x => x.demo ? ' <span class="badge b-demo">DEMO</span>' : '';

  function services() {
    const list = DB.all('services').filter(x => x.active);
    return '<section class="sec" id="layanan"><div class="container">' + secHead('Layanan Kami', 'Pilih Perawatan yang Sesuai untuk Anda', 'Setiap layanan dilakukan dengan nyaman dan ramah.') +
      (list.length ? '<div class="grid g3">' + list.map(x => '<article class="svc rv"><div class="ph">' + UI.img(x.image, x.name) + '<span class="tag">' + UI.icon('clock') + x.duration + ' menit</span></div><div class="bd"><h3>' + esc(x.name) + demoTag(x) + '</h3><p>' + esc(x.description) + '</p><div class="ft"><span class="price">' + UI.rp(x.price) + '</span><a class="btn btn-ghost btn-sm" href="' + reserveUrl(x.id) + '">Reservasi ' + UI.icon('arrow') + '</a></div></div></article>').join('') + '</div>' : UI.empty('Layanan belum tersedia.')) + '</div></section>';
  }
  function prices() {
    const list = DB.all('services').filter(x => x.active);
    return '<section class="sec" id="harga"><div class="container">' + secHead('Daftar Harga', 'Harga Transparan, Tanpa Kejutan', 'Harga dikelola langsung oleh pihak Kayuputih dan dapat berubah sewaktu-waktu.') +
      '<div class="plist">' + (list.length ? list.map(x => '<div class="pr rv">' + UI.img(x.image, x.name) + '<div><h3>' + esc(x.name) + demoTag(x) + '</h3><p>' + esc(x.description) + '</p></div><div class="meta"><span class="price">' + UI.rp(x.price) + '</span><small>' + UI.icon('clock') + x.duration + ' menit</small></div><a class="btn btn-primary btn-sm" href="' + reserveUrl(x.id) + '">Reservasi</a></div>').join('') : UI.empty('Belum ada daftar harga.')) + '</div></div></section>';
  }
  function promos() {
    const t = DB.today(); const list = DB.all('promotions').filter(p => p.active && p.startDate <= t && p.endDate >= t);
    return '<section class="sec" id="promo"><div class="container">' + secHead('Promo &amp; Paket Spesial', 'Lebih Hemat, Lebih Nyaman', 'Gunakan kode promo saat transaksi di kasir.') +
      (list.length ? '<div class="grid g3">' + list.map(p => '<article class="promo rv">' + UI.img(p.image, p.title) + '<div class="bd"><span class="kind">' + esc(p.kind) + '</span><h3>' + esc(p.title) + '</h3><p>' + esc(p.description) + '</p>' + (p.packagePrice ? '<p><b>Harga paket ' + UI.rp(p.packagePrice) + '</b></p>' : '') + '<div class="row"><button class="code" data-copy="' + esc(p.code) + '" title="Salin kode">' + esc(p.code) + '</button><small>s.d. ' + UI.date(p.endDate) + '</small></div></div></article>').join('') + '</div>' : UI.empty('Belum ada promo aktif saat ini.', 'tag')) + '</div></section>';
  }
  function gallery() {
    const list = DB.all('gallery'); const cats = ['Semua'].concat([...new Set(list.map(g => g.category))]);
    return '<section class="sec" id="galeri"><div class="container">' + secHead('Galeri', 'Suasana yang Menenangkan', 'Foto dapat diganti oleh Admin melalui dashboard.') +
      '<div class="chips rv">' + cats.map((c, i) => '<button class="chip' + (i ? '' : ' on') + '" data-cat="' + esc(c) + '">' + esc(c) + '</button>').join('') + '</div><div class="gal" id="galGrid">' +
      list.map(g => '<figure class="rv" data-cat="' + esc(g.category) + '" data-full="' + esc(g.url) + '">' + UI.img(g.url, g.title) + '<figcaption>' + esc(g.title) + '</figcaption></figure>').join('') + '</div></div></section>';
  }
  function about(s) {
    return '<section class="sec" id="tentang"><div class="container about"><div class="rv"><span class="eyebrow" style="color:var(--bronze)">Tentang Kami</span><h2>' + esc(s.businessName) + '</h2><p>' + esc(s.about) + '</p><p><i>"' + esc(s.tagline) + '"</i></p><a class="btn btn-bronze" href="' + reserveUrl() + '">Reservasi Sekarang</a></div>' +
      '<div class="rate rv"><div class="big">' + esc(s.rating) + '</div><div class="stars">' + [1, 2, 3, 4, 5].map(() => UI.icon('star')).join('') + '</div><p>Berdasarkan ' + UI.num(s.reviews) + ' ulasan Google (data referensi, dapat diperbarui Admin)</p><a class="btn btn-primary" href="' + esc(s.mapsUrl) + '" target="_blank" rel="noopener">Lihat ulasan di Google Maps</a></div></div></section>';
  }
  function locSec(s) {
    const wa = waLink(s, 'Halo Kayuputih, saya ingin bertanya.');
    return '<section class="sec" id="lokasi"><div class="container">' + secHead('Lokasi', 'Kunjungi Kami di Palu', '') + '<div class="loc rv"><div class="loc-card"><h3>' + esc(s.businessName) + '</h3><div class="li">' + UI.icon('pin') + '<span>' + esc(s.address) + '</span></div><div class="li">' + UI.icon('clock') + '<span>Jam operasional ' + esc(s.openTime) + ' – ' + esc(s.closeTime) + '</span></div>' + (s.phone ? '<div class="li">' + UI.icon('phone') + '<span>' + esc(s.phone) + '</span></div>' : '') +
      '<div class="row"><a class="btn btn-primary" href="' + dirLink(s) + '" target="_blank" rel="noopener">' + UI.icon('pin') + ' Petunjuk Arah</a>' + (wa ? '<a class="btn btn-ghost" href="' + wa + '" target="_blank" rel="noopener">' + UI.icon('whatsapp') + ' Hubungi Kami</a>' : '<button class="btn btn-ghost" data-nocontact>' + UI.icon('phone') + ' Hubungi Kami</button>') + '<a class="btn btn-ghost" href="' + esc(s.mapsUrl) + '" target="_blank" rel="noopener">Buka Google Maps</a></div></div>' +
      '<div class="map"><iframe title="Peta lokasi ' + esc(s.businessName) + '" loading="lazy" referrerpolicy="no-referrer-when-downgrade" src="https://www.google.com/maps?q=' + encodeURIComponent(s.businessName + ' ' + s.address) + '&output=embed"></iframe></div></div></div></section>';
  }
  function footer(s) {
    return '<div class="container"><div class="foot-g"><div><div class="row" style="flex-wrap:nowrap">' + UI.logo(56) + '<div><b style="color:#fff;letter-spacing:.14em">KAYUPUTIH</b><br><small style="font-style:italic;color:var(--gold)">family reflexology</small></div></div><p>' + esc(s.tagline) + '. ' + esc(s.about.slice(0, 120)) + '…</p></div>' +
      '<div><h4>Navigasi</h4><a href="#beranda">Beranda</a><a href="#layanan">Layanan</a><a href="#harga">Harga</a><a href="#promo">Promo</a><a href="#galeri">Galeri</a><a href="login.html">Login Member</a></div>' +
      '<div><h4>Layanan</h4><ul>' + DB.all('services').filter(x => x.active).slice(0, 6).map(x => '<li>' + esc(x.name) + '</li>').join('') + '</ul></div>' +
      '<div><h4>Kontak</h4><ul><li>' + esc(s.address) + '</li>' + (s.phone ? '<li>Telp: ' + esc(s.phone) + '</li>' : '') + (s.whatsapp ? '<li>WhatsApp: ' + esc(s.whatsapp) + '</li>' : '') + '<li>Buka ' + esc(s.openTime) + ' – ' + esc(s.closeTime) + '</li></ul>' +
      '<div style="margin-top:8px">' + (s.instagram ? '<a href="' + esc(s.instagram) + '" target="_blank" rel="noopener">Instagram</a>' : '') + (s.facebook ? '<a href="' + esc(s.facebook) + '" target="_blank" rel="noopener">Facebook</a>' : '') + '<a href="' + esc(s.mapsUrl) + '" target="_blank" rel="noopener">Google Maps</a></div></div></div>' +
      '<div class="foot-b"><span>© 2026 Kayuputih Family Reflexology.</span><span>Developed by <a href="https://benyoriki.com" target="_blank" rel="noopener">benyoriki.com</a></span></div></div>';
  }

  function render() {
    const s = DB.settings();
    $('#splashLogo').innerHTML = UI.logo(110);
    $('#hdr').innerHTML = header(s);
    $('#site').innerHTML = hero(s) + services() + prices() + promos() + gallery() + about(s) + locSec(s);
    $('#foot').innerHTML = footer(s);
    const wa = waLink(s, 'Halo Kayuputih, saya ingin bertanya.'); const f = $('#waFloat'); if (wa) { f.href = wa; f.target = '_blank'; f.rel = 'noopener'; f.innerHTML = UI.icon('whatsapp'); f.hidden = false; }
    UI.setTheme(UI.theme());
    observe();
  }
  function observe() {
    const io = 'IntersectionObserver' in window ? new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: .12 }) : null;
    UI.$$('.rv').forEach(el => io ? io.observe(el) : el.classList.add('in'));
  }

  render();
  setTimeout(() => $('#splash').classList.add('off'), 450);

  /* header sticky shadow + menu aktif */
  addEventListener('scroll', () => $('#hdr').classList.toggle('sc', scrollY > 10), { passive: true });
  const secs = ['beranda', 'layanan', 'harga', 'promo', 'galeri', 'tentang', 'lokasi'];
  if ('IntersectionObserver' in window) {
    const so = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) UI.$$('[data-sec]').forEach(a => a.classList.toggle('on', a.dataset.sec === e.target.id)); }), { rootMargin: '-45% 0px -50% 0px' });
    secs.forEach(id => { const el = document.getElementById(id); if (el) so.observe(el); });
  }

  document.addEventListener('click', e => {
    const b = e.target.closest('#burger');
    if (b) { const n = $('#nav'); const o = n.classList.toggle('open'); b.setAttribute('aria-expanded', o); return; }
    if (e.target.closest('#nav a')) { $('#nav').classList.remove('open'); $('#burger').setAttribute('aria-expanded', 'false'); }
    const c = e.target.closest('[data-copy]'); if (c) { (navigator.clipboard ? navigator.clipboard.writeText(c.dataset.copy) : Promise.reject()).then(() => UI.toast('Kode ' + c.dataset.copy + ' disalin'), () => UI.toast('Kode promo: ' + c.dataset.copy, 'info')); return; }
    if (e.target.closest('[data-nocontact]')) { UI.toast('Nomor kontak belum diatur Admin. Silakan gunakan Petunjuk Arah atau Reservasi online.', 'info'); return; }
    const ch = e.target.closest('[data-cat]'); if (ch && ch.classList.contains('chip')) {
      UI.$$('.chip').forEach(x => x.classList.toggle('on', x === ch));
      UI.$$('#galGrid figure').forEach(f => f.style.display = ch.dataset.cat === 'Semua' || f.dataset.cat === ch.dataset.cat ? '' : 'none'); return;
    }
    const fg = e.target.closest('#galGrid figure'); if (fg) {
      const lb = document.createElement('div'); lb.className = 'lightbox'; lb.innerHTML = '<button class="icon-btn" aria-label="Tutup">' + UI.icon('x') + '</button><img alt="" src="' + esc(fg.dataset.full) + '">';
      lb.onclick = () => lb.remove(); document.body.appendChild(lb);
    }
  });
})();
