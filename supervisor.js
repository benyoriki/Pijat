/* supervisor.js — Dashboard Supervisor (monitoring; tanpa akses pengaturan Admin) */
(function () {
  'use strict';
  DB.init(); UI.initTheme();
  const user = Auth.guard(['supervisor']); if (!user) return;
  const esc = UI.esc, S = user.name;
  const sum = (a, f) => a.reduce((s, x) => s + f(x), 0);
  const paid = () => DB.all('transactions').filter(t => t.payStatus === 'lunas');
  const mb = (act, id, icon, label) => '<button class="btn btn-ghost btn-sm" data-act="' + act + '" data-id="' + id + '">' + UI.icon(icon) + '<span>' + label + '</span></button>';

  /* ---------- Overview ---------- */
  const overview = {
    render() {
      const t = DB.today(), res = DB.all('reservations'), th = DB.all('therapists');
      const tr = res.filter(r => r.date === t);
      const d7 = []; for (let i = 6; i >= 0; i--) d7.push(DB.addDays(t, -i));
      const perf = th.filter(x => x.active).map(x => { const r = res.filter(y => y.therapistId === x.id && y.status !== 'cancelled'); const dn = r.filter(y => y.status === 'done').length; return { n: x.name, total: r.length, pct: r.length ? Math.round(dn / r.length * 100) : 0 }; });
      return '<div class="stats">' + UI.stat('calendar', 'Total Reservasi', UI.num(res.length), UI.num(tr.length) + ' hari ini') + UI.stat('clock', 'Reservasi Aktif', UI.num(res.filter(r => ['pending', 'confirmed'].includes(r.status)).length), '', 'warn') + UI.stat('activity', 'Sedang Dilayani', UI.num(res.filter(r => r.status === 'serving').length), '', 'info') + UI.stat('check', 'Pelayanan Selesai', UI.num(res.filter(r => r.status === 'done').length)) + UI.stat('users', 'Terapis Aktif', UI.num(th.filter(x => x.active).length), '', 'info') + '</div>' +
        '<div class="cols"><div class="card"><div class="card-h"><h3>Status Pelayanan</h3></div><div id="chSt"></div></div><div class="card"><div class="card-h"><h3>Pelayanan 7 Hari Terakhir</h3></div><div id="chSv"></div></div></div>' +
        '<div class="card" style="margin-top:18px"><div class="card-h"><h3>Kinerja Terapis</h3><small class="muted">% reservasi selesai</small></div><div class="perf">' + (perf.length ? perf.map(p => '<div class="perf-i"><b>' + esc(p.n) + '</b><div class="bar"><i style="width:' + p.pct + '%"></i></div><small>' + p.pct + '% · ' + p.total + ' reservasi</small></div>').join('') : UI.empty('Belum ada terapis aktif.')) + '</div></div>';
    },
    mount(el) {
      const res = DB.all('reservations'), t = DB.today(), d7 = []; for (let i = 6; i >= 0; i--) d7.push(DB.addDays(t, -i));
      Charts.donut(UI.$('#chSt', el), { items: Object.keys(DB.STATUS).map(k => ({ label: DB.STATUS[k], value: res.filter(r => r.status === k).length })), centerLabel: 'Reservasi' });
      Charts.bar(UI.$('#chSv', el), { labels: d7.map(d => d.slice(8) + '/' + d.slice(5, 7)), values: d7.map(d => res.filter(r => r.date === d && r.status === 'done').length), title: 'Pelayanan selesai' });
    }
  };

  /* ---------- Monitoring reservasi ---------- */
  const mon = { date: DB.today(), status: '' };
  const reservasi = {
    render() {
      let l = DB.all('reservations').filter(r => !mon.date || r.date === mon.date); if (mon.status) l = l.filter(r => r.status === mon.status);
      l.sort((a, b) => a.time.localeCompare(b.time));
      const queue = l.filter(r => ['pending', 'confirmed', 'serving'].includes(r.status));
      return '<div class="page-head"><div><h2>Monitoring Reservasi</h2><p class="muted">Konfirmasi dan pantau status pelayanan.</p></div></div><div class="card"><div class="filters"><label>Tanggal<input class="input" type="date" value="' + mon.date + '" data-in="date"></label><label>Status<select class="input" data-in="status"><option value="">Semua</option>' + Object.keys(DB.STATUS).map(k => '<option value="' + k + '"' + (mon.status === k ? ' selected' : '') + '>' + DB.STATUS[k] + '</option>').join('') + '</select></label><button class="btn btn-ghost" data-act="all">Semua tanggal</button></div></div>' +
        '<div class="card"><div class="card-h"><h3>Antrean' + (mon.date ? ' · ' + UI.date(mon.date) : '') + '</h3></div><div class="queue">' + (queue.length ? queue.map(r => '<div class="q-i"><span class="t">' + r.time + '</span><div><b>' + esc(r.customerName) + '</b><small>' + esc(r.serviceName) + ' · ' + esc(r.therapistId ? UI.thName(r.therapistId) : 'Terapis belum ditentukan') + '</small></div>' + UI.badge(r.status) + '<div class="mini-btns">' + (r.status === 'pending' ? mb('confirmed', r.id, 'check', 'Konfirmasi') : '') + (r.status === 'confirmed' ? mb('serving', r.id, 'play', 'Mulai') : '') + (r.status === 'serving' ? mb('done', r.id, 'check', 'Validasi Selesai') : '') + '</div></div>').join('') : UI.empty('Tidak ada antrean.', 'calendar')) + '</div></div>' +
        '<div class="card"><div class="card-h"><h3>Semua Reservasi (' + l.length + ')</h3></div>' + UI.table([{ label: 'Kode', render: r => esc(r.code) }, { label: 'Jadwal', render: r => UI.date(r.date) + ' · ' + r.time }, { label: 'Pelanggan', render: r => esc(r.customerName) }, { label: 'Layanan', render: r => esc(r.serviceName) }, { label: 'Terapis', render: r => esc(r.therapistId ? UI.thName(r.therapistId) : '-') }, { label: 'Status', render: r => UI.badge(r.status) }], l, { empty: 'Tidak ada reservasi.' }) + '</div>';
    },
    inputs: { date(t) { mon.date = t.value; this.ctx.refresh(); }, status(t) { mon.status = t.value; this.ctx.refresh(); } },
    actions: { all() { mon.date = ''; this.ctx.refresh(); } }
  };
  ['confirmed', 'serving', 'done'].forEach(s => { reservasi.actions[s] = t => { DB.setReservationStatus(t.dataset.id, s, S); UI.toast('Status: ' + DB.STATUS[s]); }; });

  /* ---------- Monitoring terapis ---------- */
  const terapis = {
    render() {
      const t = DB.today(), res = DB.all('reservations'), att = DB.all('attendance').filter(a => a.date === t).map(a => a.therapistId), wd = DB.workingTherapists(t).map(x => x.id);
      return '<div class="page-head"><div><h2>Monitoring Terapis</h2></div></div><div class="card">' + UI.table([{ label: 'Terapis', render: x => '<div class="name">' + UI.avatar(x.name, x.photo, 'sm') + '<div><b>' + esc(x.name) + '</b><small>' + x.startTime + '–' + x.endTime + '</small></div></div>' }, { label: 'Status', render: x => !x.active ? UI.badge('inactive', 'Nonaktif') : res.some(r => r.therapistId === x.id && r.date === t && r.status === 'serving') ? UI.badge('serving', 'Sedang melayani') : wd.includes(x.id) ? UI.badge('active', att.includes(x.id) ? 'Hadir' : 'Bertugas hari ini') : UI.badge('pending', 'Libur') },
        { label: 'Beban hari ini', cls: 'r', render: x => res.filter(r => r.therapistId === x.id && r.date === t && r.status !== 'cancelled').length }, { label: 'Total selesai', cls: 'r', render: x => res.filter(r => r.therapistId === x.id && r.status === 'done').length }, { label: '', cls: 'act', render: x => mb('hist', x.id, 'clock', 'Riwayat') }], DB.all('therapists'), { empty: 'Belum ada terapis.' }) + '</div>';
    },
    actions: { hist(t) { const x = DB.get('therapists', t.dataset.id), l = DB.all('reservations').filter(r => r.therapistId === x.id).sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time)).slice(0, 15); UI.modal({ title: 'Riwayat ' + x.name, size: 'lg', body: UI.table([{ label: 'Jadwal', render: r => UI.date(r.date) + ' ' + r.time }, { label: 'Pelanggan', render: r => esc(r.customerName) }, { label: 'Layanan', render: r => esc(r.serviceName) }, { label: 'Status', render: r => UI.badge(r.status) }], l, { empty: 'Belum ada pelayanan.' }) }); } }
  };

  /* ---------- Monitoring transaksi (hanya baca) ---------- */
  const tr = { p: 1, f: '' };
  const transaksi = {
    render() {
      const tx = paid(), t = DB.today(), mo = t.slice(0, 7);
      let l = DB.all('transactions').sort((a, b) => (b.date + b.createdAt).localeCompare(a.date + a.createdAt)); if (tr.f) l = l.filter(x => x.payStatus === tr.f); const pg = UI.page(l, tr.p, 10);
      return '<div class="page-head"><div><h2>Monitoring Transaksi</h2><p class="muted">Mode pantau — tidak dapat mengubah transaksi.</p></div></div><div class="stats">' + UI.stat('wallet', 'Pendapatan Hari Ini', UI.rp(sum(tx.filter(x => x.date === t), x => x.total))) + UI.stat('chart', 'Pendapatan Bulan Ini', UI.rp(sum(tx.filter(x => x.date.slice(0, 7) === mo), x => x.total)), '', 'info') + UI.stat('clock', 'Belum Lunas', UI.num(DB.all('transactions').filter(x => x.payStatus === 'belum').length), '', 'warn') + '</div>' +
        '<div class="card"><div class="filters"><label>Status bayar<select class="input" data-in="f"><option value="">Semua</option><option value="lunas"' + (tr.f === 'lunas' ? ' selected' : '') + '>Lunas</option><option value="belum"' + (tr.f === 'belum' ? ' selected' : '') + '>Belum lunas</option></select></label></div>' + UI.table([{ label: 'Kode', render: x => '<b>' + esc(x.code) + '</b>' }, { label: 'Tanggal', render: x => UI.date(x.date) }, { label: 'Pelanggan', render: x => esc(x.customerName) }, { label: 'Metode', render: x => DB.METHOD[x.method] }, { label: 'Total', cls: 'r', render: x => UI.rp(x.total) }, { label: 'Status', render: x => UI.badge(x.payStatus, DB.PAY[x.payStatus]) }], pg.items, { empty: 'Belum ada transaksi.' }) + UI.pager(pg) + '</div>';
    },
    inputs: { f(t) { tr.f = t.value; tr.p = 1; this.ctx.refresh(); } }, actions: { page(t) { tr.p = +t.dataset.p; this.ctx.refresh(); } }
  };

  /* ---------- Laporan + catatan operasional ---------- */
  const rep = UI.reportView([{ id: 'pelayanan', label: 'Pelayanan' }, { id: 'kunjungan', label: 'Kunjungan' }, { id: 'karyawan', label: 'Kinerja Terapis' }, { id: 'reservasi', label: 'Reservasi' }, { id: 'catatan', label: 'Catatan Operasional' }], 'Laporan Supervisor');
  const baseRender = rep.render;
  rep.render = function () {
    return baseRender.call(this) + '<div class="card noprint"><div class="card-h"><h3>Tambah Catatan Operasional</h3></div><form id="noteForm" class="note-form"><textarea class="input" id="noteText" placeholder="Tulis catatan operasional hari ini…" required></textarea><button class="btn btn-primary" type="submit" style="justify-self:start">' + UI.icon('plus') + ' Simpan Catatan</button></form></div>';
  };
  rep.mount = function (el) {
    const f = UI.$('#noteForm', el); if (!f) return;
    f.onsubmit = e => { e.preventDefault(); const v = UI.$('#noteText', f).value.trim(); if (!v) return UI.toast('Catatan kosong.', 'err'); DB.insert('activityLogs', { type: 'note', text: v, by: S }); UI.toast('Catatan disimpan.'); };
  };

  UI.shell({
    role: 'supervisor', roleLabel: 'Supervisor', user,
    menu: [{ id: 'overview', label: 'Dashboard', short: 'Beranda', icon: 'home' }, { id: 'reservasi', label: 'Monitoring', icon: 'calendar' }, { id: 'terapis', label: 'Terapis', icon: 'users' }, { id: 'transaksi', label: 'Transaksi', icon: 'receipt' }, { id: 'laporan', label: 'Laporan', icon: 'chart' }],
    views: { overview, reservasi, terapis, transaksi, laporan: rep }
  });
})();
