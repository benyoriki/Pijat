/* =====================================================================
   receipt.js — Struk pembayaran modern (satu sumber desain: SVG).
   Dipakai untuk pratinjau, cetak (printer 80mm / A4), unduh PNG,
   unduh PDF, dan bagikan (WhatsApp / aplikasi lain).
   ===================================================================== */
(function (global) {
  'use strict';
  const W = 400, SANS = "'Helvetica Neue',Helvetica,Arial,sans-serif", SERIF = "Georgia,'Times New Roman',serif", MONO = "'Courier New',Courier,monospace";
  const x = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const rp = n => 'Rp ' + Math.round(+n || 0).toLocaleString('id-ID');
  const wrap = (s, n) => { const out = []; let l = ''; String(s || '').split(/\s+/).forEach(w => { if ((l + ' ' + w).trim().length > n) { if (l) out.push(l); l = w; } else l = (l + ' ' + w).trim(); }); if (l) out.push(l); return out; };
  const T = (X, Y, s, o) => { o = o || {}; return '<text x="' + X + '" y="' + Y + '" font-family="' + (o.f || SANS) + '" font-size="' + (o.s || 13) + '" font-weight="' + (o.w || 400) + '" fill="' + (o.c || '#2a2019') + '" text-anchor="' + (o.a || 'start') + '"' + (o.ls ? ' letter-spacing="' + o.ls + '"' : '') + (o.i ? ' font-style="italic"' : '') + '>' + x(s) + '</text>'; };
  const dash = Y => '<line x1="28" y1="' + Y + '" x2="' + (W - 28) + '" y2="' + Y + '" stroke="#8A6345" stroke-opacity=".45" stroke-dasharray="4 4"/>';
  const dt = iso => { try { const d = new Date(iso); return UI.date(iso.slice(0, 10)) + ' · ' + String(d.getHours()).padStart(2, '0') + '.' + String(d.getMinutes()).padStart(2, '0'); } catch (e) { return UI.date(iso); } };

  /* barcode dekoratif dari kode transaksi (bukan standar Code-128) */
  function bars(code, X, Y, w, h) {
    let seed = 7; for (const ch of code) seed = (seed * 31 + ch.charCodeAt(0)) >>> 0;
    const rnd = () => (seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296; let out = '', cx = X;
    while (cx < X + w) { const bw = 1 + Math.floor(rnd() * 3); if (cx + bw > X + w) break; out += '<rect x="' + cx + '" y="' + Y + '" width="' + bw + '" height="' + h + '" fill="#3a2519"/>'; cx += bw + 1 + Math.floor(rnd() * 2); }
    return out;
  }

  function build(tx, logo) {
    const s = DB.settings(), lunas = tx.payStatus === 'lunas', th = tx.therapistId ? UI.thName(tx.therapistId) : '';
    const mem = tx.memberId ? DB.get('members', tx.memberId) : null;
    const pts = tx.pointsAwarded && tx.memberId ? Math.floor(tx.total / (+s.pointRate || 10000)) : 0;
    let o = '', y = 0;
    const hh = 150;
    o += '<rect width="' + W + '" height="' + hh + '" fill="url(#hd)"/><rect y="' + (hh - 3) + '" width="' + W + '" height="3" fill="#C6A477"/>';
    o += '<circle cx="' + W / 2 + '" cy="50" r="31" fill="#5B3927" stroke="#C6A477" stroke-width="2"/>' + (logo ? '<image href="' + logo + '" x="' + (W / 2 - 28) + '" y="22" width="56" height="56" clip-path="url(#lg)"/>' : T(W / 2, 59, '❦', { s: 28, a: 'middle', c: '#A8D92B', f: SERIF }));
    o += T(W / 2, 108, 'KAYUPUTIH', { s: 20, w: 700, a: 'middle', c: '#fff', ls: 5 }) + T(W / 2, 128, 'family reflexology · Palu', { s: 12, a: 'middle', c: '#C6A477', f: SERIF, i: 1 });
    y = hh + 34;
    const col = lunas ? '#4f8a4b' : '#c0392b';
    o += T(W / 2, y, 'TOTAL PEMBAYARAN', { s: 11, a: 'middle', c: '#8A6345', w: 700, ls: 3 }); y += 38;
    o += T(W / 2, y, rp(tx.total), { s: 34, w: 800, a: 'middle', c: '#2a2019' }); y += 26;
    const label = lunas ? '✓  LUNAS' : 'BELUM LUNAS', pw = lunas ? 104 : 140;
    o += '<rect x="' + (W / 2 - pw / 2) + '" y="' + (y - 17) + '" width="' + pw + '" height="26" rx="13" fill="' + col + '" fill-opacity=".14" stroke="' + col + '" stroke-opacity=".5"/>' + T(W / 2, y, label, { s: 12, w: 800, a: 'middle', c: col, ls: 2 });
    y += 30; o += dash(y); y += 24;
    const meta = [['No. Struk', tx.code], ['Tanggal', dt(tx.createdAt || tx.date + 'T00:00:00')], ['Pelanggan', tx.customerName + (mem ? ' · ' + mem.number : '')]];
    if (th) meta.push(['Terapis', th]); if (tx.cashier) meta.push(['Kasir', tx.cashier]);
    meta.forEach(m => { o += T(28, y, m[0], { s: 12, c: '#7b6b5d' }) + T(W - 28, y, m[1], { s: 12.5, w: 600, a: 'end' }); y += 21; });
    y += 2; o += dash(y); y += 24;
    o += T(28, y, 'LAYANAN', { s: 10.5, w: 700, c: '#8A6345', ls: 2 }) + T(W - 28, y, 'JUMLAH', { s: 10.5, w: 700, c: '#8A6345', a: 'end', ls: 2 }); y += 22;
    tx.items.forEach(i => {
      const nm = wrap(i.name, 30); nm.forEach((l, k) => { o += T(28, y, l, { s: 13.5, w: 700 }); if (k < nm.length - 1) y += 18; });
      o += T(W - 28, y, rp(i.qty * i.price), { s: 13.5, w: 700, a: 'end' }); y += 17;
      o += T(28, y, i.qty + ' × ' + rp(i.price) + (i.duration ? '  ·  ' + i.duration + ' menit' : ''), { s: 11.5, c: '#7b6b5d' }); y += 25;
    });
    o += dash(y - 8); y += 14;
    const row = (a, b, big, c) => { o += T(28, y, a, { s: big ? 15 : 12.5, w: big ? 800 : 400, c: c || (big ? '#2a2019' : '#7b6b5d') }) + T(W - 28, y, b, { s: big ? 17 : 13, w: big ? 800 : 600, a: 'end', c: c || '#2a2019' }); y += big ? 28 : 21; };
    row('Subtotal', rp(tx.subtotal)); if (tx.discount) row('Diskon' + (tx.promoCode ? ' (' + tx.promoCode + ')' : ''), '-' + rp(tx.discount), 0, '#4f8a4b'); y += 4; row('TOTAL', rp(tx.total), 1);
    y += 6; const mt = DB.METHOD[tx.method] || tx.method; const lines = [['Metode', mt]];
    if (lunas) {
      if (tx.method === 'tunai') { lines.push(['Uang diterima', rp(tx.paidAmount == null ? tx.total : tx.paidAmount)]); lines.push(['Kembalian', rp(tx.change || 0)]); }
      else { if (tx.payBank) lines.push(['Bank pengirim', tx.payBank]); if (tx.payRef) lines.push(['Referensi', tx.payRef]); }
      if (tx.paidAt) lines.push(['Dibayar', dt(tx.paidAt)]);
    } else lines.push(['Status', 'Menunggu pembayaran']);
    const bh = 22 + lines.length * 21;
    o += '<rect x="22" y="' + y + '" width="' + (W - 44) + '" height="' + bh + '" rx="14" fill="#F7F2E9" stroke="#C6A477" stroke-opacity=".45"/>'; y += 26;
    lines.forEach((l, k) => { o += T(38, y, l[0], { s: 12, c: '#7b6b5d' }) + T(W - 38, y, l[1], { s: 12.5, w: k === 0 || l[0] === 'Kembalian' ? 800 : 600, a: 'end', c: l[0] === 'Kembalian' ? '#4f8a4b' : '#2a2019' }); y += 21; });
    y += 14;
    if (pts) { o += '<rect x="22" y="' + (y - 4) + '" width="' + (W - 44) + '" height="34" rx="17" fill="#A8D92B" fill-opacity=".28"/>' + T(W / 2, y + 18, '★  Anda mendapat +' + pts + ' poin reward', { s: 12.5, w: 700, a: 'middle', c: '#4d6d0a' }); y += 50; }
    o += dash(y); y += 30;
    wrap(s.receiptNote || 'Terima kasih atas kunjungan Anda.', 44).forEach(l => { o += T(W / 2, y, l, { s: 13, a: 'middle', f: SERIF, i: 1, c: '#5B3927' }); y += 19; });
    y += 8; o += bars(tx.code, 70, y, W - 140, 34); y += 52; o += T(W / 2, y, tx.code, { s: 11, a: 'middle', f: MONO, c: '#7b6b5d', ls: 2 }); y += 22;
    wrap(s.address, 52).slice(0, 3).forEach(l => { o += T(W / 2, y, l, { s: 10, a: 'middle', c: '#9a8a7b' }); y += 14; });
    y += 14;
    const H = y + 12; let zz = 'M0 ' + y; for (let i = 0; i <= W; i += 16) zz += ' L' + i + ' ' + (y + (i / 16 % 2 ? 0 : 10)); zz += ' L' + W + ' ' + H + ' L0 ' + H + 'Z';
    o += '<path d="' + zz + '" fill="#F7F2E9"/>';
    const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="' + W + '" height="' + H + '" viewBox="0 0 ' + W + ' ' + H + '"><defs><linearGradient id="hd" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#3a2519"/><stop offset="1" stop-color="#5B3927"/></linearGradient><clipPath id="lg"><circle cx="' + W / 2 + '" cy="50" r="28"/></clipPath></defs><rect width="' + W + '" height="' + H + '" fill="#FFFCF7"/>' + o + '</svg>';
    return { svg, w: W, h: H };
  }

  let logoCache = null;
  function logoData() {
    if (logoCache !== null) return Promise.resolve(logoCache);
    const src = DB.settings().logo || 'logo.png';
    if (/^data:/.test(src)) return Promise.resolve(logoCache = src);
    return fetch(src).then(r => r.blob()).then(b => new Promise(res => { const f = new FileReader(); f.onload = () => res(logoCache = f.result); f.onerror = () => res(logoCache = ''); f.readAsDataURL(b); })).catch(() => logoCache = '');
  }
  const filename = (tx, ext) => 'struk-' + tx.code + '.' + ext;
  function html(tx, logo) {
    const r = build(tx, logo || '');
    return '<!doctype html><html lang="id"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Struk ' + x(tx.code) + '</title><style>*{box-sizing:border-box}html,body{margin:0}body{background:#e9e1d3;padding:16px;display:flex;justify-content:center}svg{width:min(400px,100%);height:auto;display:block;box-shadow:0 10px 30px rgba(73,48,32,.25);border-radius:6px 6px 0 0}@media print{body{background:#fff;padding:0}svg{width:80mm;box-shadow:none;border-radius:0}@page{margin:0;size:80mm auto}}</style></head><body>' + r.svg + '</body></html>';
  }
  function toCanvas(tx, scale) {
    return logoData().then(l => new Promise((res, rej) => {
      const r = build(tx, l), img = new Image(), url = URL.createObjectURL(new Blob([r.svg], { type: 'image/svg+xml;charset=utf-8' }));
      img.onload = () => { const c = document.createElement('canvas'); c.width = r.w * scale; c.height = r.h * scale; const g = c.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, c.width, c.height); g.drawImage(img, 0, 0, c.width, c.height); URL.revokeObjectURL(url); res(c); };
      img.onerror = () => { URL.revokeObjectURL(url); rej(new Error('Gagal membuat gambar struk')); }; img.src = url;
    }));
  }
  const saveBlob = (name, blob) => { const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 800); };
  const png = tx => toCanvas(tx, 3).then(c => new Promise(res => c.toBlob(res, 'image/png')));

  /* PDF 1 halaman minimal: gambar JPEG struk pada halaman selebar 300 pt */
  function makePdf(canvas) {
    const jpg = Uint8Array.from(atob(canvas.toDataURL('image/jpeg', .92).split(',')[1]), ch => ch.charCodeAt(0));
    const pw = 300, ph = Math.round(pw * canvas.height / canvas.width), enc = new TextEncoder(), parts = [], off = []; let len = 0;
    const put = b => { const u = typeof b === 'string' ? enc.encode(b) : b; parts.push(u); len += u.length; };
    const obj = (n, body) => { off[n] = len; put(n + ' 0 obj\n' + body + '\nendobj\n'); };
    put('%PDF-1.4\n'); obj(1, '<</Type/Catalog/Pages 2 0 R>>'); obj(2, '<</Type/Pages/Kids[3 0 R]/Count 1>>');
    obj(3, '<</Type/Page/Parent 2 0 R/MediaBox[0 0 ' + pw + ' ' + ph + ']/Resources<</XObject<</Im0 4 0 R>>>>/Contents 5 0 R>>');
    off[4] = len; put('4 0 obj\n<</Type/XObject/Subtype/Image/Width ' + canvas.width + '/Height ' + canvas.height + '/ColorSpace/DeviceRGB/BitsPerComponent 8/Filter/DCTDecode/Length ' + jpg.length + '>>\nstream\n'); put(jpg); put('\nendstream\nendobj\n');
    const c = 'q ' + pw + ' 0 0 ' + ph + ' 0 0 cm /Im0 Do Q'; obj(5, '<</Length ' + c.length + '>>\nstream\n' + c + '\nendstream');
    const xr = len; put('xref\n0 6\n0000000000 65535 f \n'); for (let i = 1; i <= 5; i++) put(String(off[i]).padStart(10, '0') + ' 00000 n \n'); put('trailer\n<</Size 6/Root 1 0 R>>\nstartxref\n' + xr + '\n%%EOF');
    return new Blob(parts, { type: 'application/pdf' });
  }
  const fail = e => UI.toast((e && e.message) || 'Gagal membuat file struk.', 'err');
  function downloadPng(tx) { UI.toast('Menyiapkan gambar struk…', 'info'); return png(tx).then(b => { saveBlob(filename(tx, 'png'), b); UI.toast('Struk PNG diunduh.'); }).catch(fail); }
  function downloadPdf(tx) { UI.toast('Menyiapkan PDF struk…', 'info'); return toCanvas(tx, 3).then(c => { saveBlob(filename(tx, 'pdf'), makePdf(c)); UI.toast('Struk PDF diunduh.'); }).catch(fail); }
  function share(tx) {
    const text = DB.settings().businessName + '\nStruk ' + tx.code + '\nTotal ' + rp(tx.total) + ' (' + (DB.PAY[tx.payStatus] || '') + ' · ' + (DB.METHOD[tx.method] || '') + ')\nTerima kasih!';
    return png(tx).then(b => { const f = new File([b], filename(tx, 'png'), { type: 'image/png' }); if (navigator.canShare && navigator.canShare({ files: [f] })) return navigator.share({ files: [f], title: 'Struk ' + tx.code, text }); const m = tx.memberId && DB.get('members', tx.memberId); const ph = m && m.phone ? m.phone.replace(/\D/g, '').replace(/^0/, '62') : ''; window.open('https://wa.me/' + ph + '?text=' + encodeURIComponent(text), '_blank', 'noopener'); }).catch(e => { if (e && e.name !== 'AbortError') fail(e); });
  }
  function print(tx) {
    logoData().then(l => {
      const f = document.createElement('iframe'); f.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;opacity:0'; f.srcdoc = html(tx, l); document.body.appendChild(f);
      f.onload = () => { try { f.contentWindow.focus(); f.contentWindow.print(); } catch (e) { UI.toast('Gagal membuka dialog cetak.', 'err'); } setTimeout(() => f.remove(), 60000); };
    });
  }
  function download(tx) { logoData().then(l => UI.download(filename(tx, 'html'), html(tx, l), 'text/html;charset=utf-8')); }
  function preview(tx) {
    const m = UI.modal({
      title: 'Struk ' + tx.code, size: 'md', focus: false, body: '<iframe class="rc-frame" title="Struk" style="width:100%;height:min(66dvh,640px);border:0;border-radius:12px;background:#e9e1d3"></iframe>',
      footer: '<div class="rc-act"><button class="btn btn-primary" data-pr>' + UI.icon('print') + ' Cetak</button><button class="btn btn-ghost" data-png>' + UI.icon('image') + ' PNG</button><button class="btn btn-ghost" data-pdf>' + UI.icon('download') + ' PDF</button><button class="btn btn-ghost" data-sh>' + UI.icon('send') + ' Bagikan</button></div>'
    });
    logoData().then(l => { const f = UI.$('iframe', m.el); if (f) f.srcdoc = html(tx, l); });
    UI.$('[data-pr]', m.el).onclick = () => print(tx); UI.$('[data-png]', m.el).onclick = () => downloadPng(tx);
    UI.$('[data-pdf]', m.el).onclick = () => downloadPdf(tx); UI.$('[data-sh]', m.el).onclick = () => share(tx);
  }
  global.Receipt = { build, html, print, download, downloadPng, downloadPdf, share, preview, makePdf };
})(window);
