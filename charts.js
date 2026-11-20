/* =====================================================================
   charts.js — Grafik SVG ringan (tanpa library): bar, line, donut.
   Warna mengikuti CSS variable sehingga ikut Light/Dark Mode.
   ===================================================================== */
(function (global) {
  'use strict';
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const short = v => v >= 1e6 ? (v / 1e6).toFixed(v % 1e6 ? 1 : 0).replace('.', ',') + ' jt' : v >= 1e3 ? Math.round(v / 1e3) + ' rb' : String(Math.round(v));
  const nice = m => { if (m <= 4) return 4; const p = Math.pow(10, Math.floor(Math.log10(m))); const n = m / p; return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10) * p; };
  const W = 600, H = 230, P = { l: 46, r: 12, t: 14, b: 30 };

  function frame(labels, values, o) {
    const max = nice(Math.max.apply(null, values.concat([1]))); const iw = W - P.l - P.r, ih = H - P.t - P.b;
    let g = '';
    for (let i = 0; i <= 4; i++) { const y = P.t + ih - ih * i / 4; g += '<line class="ch-grid" x1="' + P.l + '" x2="' + (W - P.r) + '" y1="' + y + '" y2="' + y + '"/><text class="ch-t" x="' + (P.l - 6) + '" y="' + (y + 4) + '" text-anchor="end">' + (o.fmtAxis || short)(max * i / 4) + '</text>'; }
    const step = Math.ceil(labels.length / 8);
    labels.forEach((l, i) => { if (i % step === 0) g += '<text class="ch-t" x="' + (P.l + iw * (i + .5) / labels.length) + '" y="' + (H - 9) + '" text-anchor="middle">' + esc(l) + '</text>'; });
    return { max, iw, ih, g };
  }
  function bar(el, o) {
    const v = o.values, f = frame(o.labels, v, o); const bw = Math.min(34, f.iw / v.length * .62);
    const bars = v.map((x, i) => { const h = f.ih * x / f.max, cx = P.l + f.iw * (i + .5) / v.length; return '<rect class="ch-bar" x="' + (cx - bw / 2) + '" y="' + (P.t + f.ih - h) + '" width="' + bw + '" height="' + Math.max(h, 0) + '" rx="4"><title>' + esc(o.labels[i]) + ': ' + esc((o.fmt || String)(x)) + '</title></rect>'; }).join('');
    el.innerHTML = '<svg class="chart" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc(o.title || 'Grafik batang') + '">' + f.g + bars + '</svg>';
  }
  function line(el, o) {
    const v = o.values, f = frame(o.labels, v, o);
    const pts = v.map((x, i) => [P.l + f.iw * (i + .5) / v.length, P.t + f.ih - f.ih * x / f.max]);
    const d = pts.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' ');
    const area = d + ' L' + pts[pts.length - 1][0] + ' ' + (P.t + f.ih) + ' L' + pts[0][0] + ' ' + (P.t + f.ih) + ' Z';
    el.innerHTML = '<svg class="chart" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc(o.title || 'Grafik garis') + '">' + f.g + '<path class="ch-area" d="' + area + '"/><path class="ch-line" d="' + d + '"/>' +
      pts.map((p, i) => '<circle class="ch-dot" cx="' + p[0] + '" cy="' + p[1] + '" r="4"><title>' + esc(o.labels[i]) + ': ' + esc((o.fmt || String)(v[i])) + '</title></circle>').join('') + '</svg>';
  }
  const COLORS = ['#A8D92B', '#8A6345', '#C6A477', '#E8892B', '#4f8a4b', '#5B3927', '#b9a38a'];
  function donut(el, o) {
    const items = o.items.filter(i => i.value > 0), total = items.reduce((a, i) => a + i.value, 0);
    if (!total) { el.innerHTML = '<div class="empty small">Belum ada data</div>'; return; }
    const R = 62, C = 2 * Math.PI * R; let off = 0;
    const arcs = items.map((it, i) => { const len = C * it.value / total; const c = it.color || COLORS[i % COLORS.length]; const s = '<circle cx="80" cy="80" r="' + R + '" fill="none" stroke="' + c + '" stroke-width="22" stroke-dasharray="' + len.toFixed(2) + ' ' + (C - len).toFixed(2) + '" stroke-dashoffset="' + (-off).toFixed(2) + '" transform="rotate(-90 80 80)"><title>' + esc(it.label) + ': ' + it.value + '</title></circle>'; off += len; return s; }).join('');
    el.innerHTML = '<div class="donut"><svg viewBox="0 0 160 160" role="img" aria-label="' + esc(o.title || 'Grafik donat') + '">' + arcs + '<text class="ch-c" x="80" y="78" text-anchor="middle">' + esc(o.center != null ? o.center : total) + '</text><text class="ch-t" x="80" y="96" text-anchor="middle">' + esc(o.centerLabel || 'Total') + '</text></svg><ul class="legend">' +
      items.map((it, i) => '<li><i style="background:' + (it.color || COLORS[i % COLORS.length]) + '"></i><span>' + esc(it.label) + '</span><b>' + it.value + '</b></li>').join('') + '</ul></div>';
  }
  global.Charts = { bar, line, donut, short, COLORS };
})(window);
