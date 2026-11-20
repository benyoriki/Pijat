/* pwa.js — registrasi service worker + tombol instal (Android/Chrome/Edge: prompt bawaan; iOS: panduan) */
(function (global) {
  'use strict';
  let deferred = null;
  const standalone = () => (global.matchMedia && global.matchMedia('(display-mode: standalone)').matches) || global.navigator.standalone === true;
  const ios = () => /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const canShow = () => !standalone() && (!!deferred || ios());
  function refresh() { document.querySelectorAll('[data-install]').forEach(b => { b.hidden = !canShow(); }); }
  async function install() {
    if (deferred) { deferred.prompt(); try { await deferred.userChoice; } catch (e) { } deferred = null; refresh(); return; }
    const html = '<ol style="padding-left:20px;line-height:1.9;margin:0"><li>Ketuk tombol <b>Bagikan</b> (kotak dengan panah ke atas) di Safari.</li><li>Pilih <b>Tambahkan ke Layar Utama</b>.</li><li>Ketuk <b>Tambah</b>. Aplikasi Kayuputih akan muncul di layar utama.</li></ol>';
    if (global.UI && UI.modal) UI.modal({ title: 'Instal Aplikasi Kayuputih', size: 'sm', body: html, footer: '<button class="btn btn-primary" data-close>Mengerti</button>', focus: false }); else alert('Safari → Bagikan → Tambahkan ke Layar Utama');
  }
  global.addEventListener('beforeinstallprompt', e => { e.preventDefault(); deferred = e; refresh(); });
  global.addEventListener('appinstalled', () => { deferred = null; refresh(); if (global.UI && UI.toast) UI.toast('Aplikasi berhasil diinstal'); });
  document.addEventListener('click', e => { if (e.target.closest('[data-install]')) install(); });
  document.addEventListener('DOMContentLoaded', refresh);
  if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) global.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => { }));
  global.PWA = { refresh, install };
})(window);
