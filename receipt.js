/* =====================================================================
   receipt.js — Struk transaksi (80mm) yang bisa dicetak / disimpan PDF
   lewat dialog cetak browser, atau diunduh sebagai file HTML.
   ===================================================================== */
(function (global) {
  'use strict';
  const e = s => UI.esc(s);
  function html(tx) {
    const s = DB.settings(); const th = tx.therapistId ? UI.thName(tx.therapistId) : '';
    const rows = tx.items.map(i => '<tr><td colspan="2">' + e(i.name) + '</td></tr><tr><td class="s">' + i.qty + ' × ' + UI.rp(i.price) + '</td><td class="r">' + UI.rp(i.qty * i.price) + '</td></tr>').join('');
    return '<!doctype html><html lang="id"><head><meta charset="utf-8"><title>Struk ' + e(tx.code) + '</title><style>' +
      '*{box-sizing:border-box}body{margin:0;padding:16px;background:#f2eee6;font:13px/1.45 "Courier New",monospace;color:#20201E}' +
      '.rc{width:302px;margin:0 auto;background:#fff;padding:18px 16px;border-radius:6px}.c{text-align:center}h1{font:700 16px Georgia,serif;margin:2px 0;letter-spacing:.06em}' +
      '.leaf{color:#6f9a12;font-size:20px}hr{border:0;border-top:1px dashed #8A6345;margin:10px 0}table{width:100%;border-collapse:collapse}td{padding:1px 0;vertical-align:top}.r{text-align:right}.s{color:#555}' +
      '.tot td{font-weight:700;font-size:15px;padding-top:4px}.stamp{display:inline-block;border:2px solid ' + (tx.payStatus === 'lunas' ? '#4f8a4b' : '#c0392b') + ';color:' + (tx.payStatus === 'lunas' ? '#4f8a4b' : '#c0392b') + ';padding:2px 10px;font-weight:700;letter-spacing:.1em;transform:rotate(-4deg);margin-top:6px}small{color:#666}' +
      '@media print{body{background:#fff;padding:0}.rc{width:80mm;border-radius:0;padding:4mm}@page{margin:0;size:80mm auto}}</style></head><body><div class="rc">' +
      '<div class="c"><div class="leaf">❦</div><h1>' + e(s.businessName.toUpperCase()) + '</h1><small>' + e(s.address) + '</small>' + (s.phone ? '<br><small>Telp ' + e(s.phone) + '</small>' : '') + '</div><hr>' +
      '<table><tr><td>No</td><td class="r">' + e(tx.code) + '</td></tr><tr><td>Tanggal</td><td class="r">' + e(UI.date(tx.date)) + '</td></tr><tr><td>Pelanggan</td><td class="r">' + e(tx.customerName) + '</td></tr>' + (th ? '<tr><td>Terapis</td><td class="r">' + e(th) + '</td></tr>' : '') + (tx.cashier ? '<tr><td>Kasir</td><td class="r">' + e(tx.cashier) + '</td></tr>' : '') + '</table><hr>' +
      '<table>' + rows + '</table><hr><table><tr><td>Subtotal</td><td class="r">' + UI.rp(tx.subtotal) + '</td></tr>' + (tx.discount ? '<tr><td>Diskon' + (tx.promoCode ? ' (' + e(tx.promoCode) + ')' : '') + '</td><td class="r">-' + UI.rp(tx.discount) + '</td></tr>' : '') + '<tr class="tot"><td>TOTAL</td><td class="r">' + UI.rp(tx.total) + '</td></tr><tr><td>Metode</td><td class="r">' + e(DB.METHOD[tx.method] || tx.method) + '</td></tr></table>' +
      '<div class="c"><span class="stamp">' + e((DB.PAY[tx.payStatus] || '').toUpperCase()) + '</span></div><hr><div class="c"><b>Terima kasih atas kunjungan Anda</b><br><small>' + e(s.tagline) + '</small></div></div></body></html>';
  }
  function print(tx) {
    const f = document.createElement('iframe'); f.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;opacity:0';
    f.srcdoc = html(tx); document.body.appendChild(f);
    f.onload = () => { try { f.contentWindow.focus(); f.contentWindow.print(); } catch (x) { UI.toast('Gagal membuka dialog cetak.', 'err'); } setTimeout(() => f.remove(), 60000); };
  }
  function download(tx) { UI.download('struk-' + tx.code + '.html', html(tx), 'text/html;charset=utf-8'); }
  function preview(tx) {
    const m = UI.modal({ title: 'Struk ' + tx.code, size: 'md', body: '<iframe class="rc-frame" title="Struk"></iframe>', footer: '<button class="btn btn-ghost" data-dl>' + UI.icon('download') + ' Simpan</button><button class="btn btn-primary" data-pr>' + UI.icon('print') + ' Cetak</button>', focus: false });
    UI.$('iframe', m.el).srcdoc = html(tx);
    UI.$('[data-pr]', m.el).onclick = () => print(tx); UI.$('[data-dl]', m.el).onclick = () => download(tx);
  }
  global.Receipt = { html, print, download, preview };
})(window);
