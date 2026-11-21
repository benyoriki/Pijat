/* admin.js — Dashboard Admin (akses penuh) */
(function () {
  'use strict';
  DB.init(); UI.initTheme();
  const user = Auth.guard(['admin']); if (!user) return;
  const esc = UI.esc, A = user.name;
  const sum = (a, f) => a.reduce((s, x) => s + f(x), 0);
  const paid = () => DB.all('transactions').filter(t => t.payStatus === 'lunas');
  const mb = (act, id, icon, label, cls) => '<button class="btn btn-ghost btn-sm ' + (cls || '') + '" data-act="' + act + '" data-id="' + id + '" title="' + label + '">' + UI.icon(icon) + '<span>' + label + '</span></button>';
  const memberOpts = (blank) => [{ value: '', label: blank || 'Bukan member / pelanggan umum' }].concat(DB.all('members').map(m => ({ value: m.id, label: m.name + ' (' + m.number + ')' })));
  const thOpts = (blank) => [{ value: '', label: blank || 'Tanpa terapis / bebas' }].concat(DB.all('therapists').filter(t => t.active).map(t => ({ value: t.id, label: t.name })));
  const dayLabels = n => { const out = []; for (let i = n - 1; i >= 0; i--) { out.push(DB.addDays(DB.today(), -i)); } return out; };
  const dd = s => s.slice(8) + '/' + s.slice(5, 7);

  /* ================= DASHBOARD ================= */
  const dash = { days: 14 };
  function recap() {
    const all = DB.all('transactions'), ms = [...new Set(all.map(t => t.date.slice(0, 7)))].sort().reverse(), unpaid = all.filter(t => t.payStatus === 'belum');
    const rows = ms.map(m => { const a = all.filter(t => t.date.slice(0, 7) === m && t.payStatus === 'lunas'), by = q => sum(a.filter(t => t.method === q), t => t.total); return { m, n: a.length, rev: sum(a, t => t.total), tunai: by('tunai'), transfer: by('transfer'), qris: by('qris') }; });
    return '<div class="card"><div class="card-h"><h3>Rekap Transaksi per Bulan</h3><small class="muted">' + (unpaid.length ? UI.num(unpaid.length) + ' belum lunas · ' + UI.rp(sum(unpaid, t => t.total)) : 'Semua transaksi lunas') + '</small></div>' +
      UI.table([{ label: 'Bulan', render: r => '<b>' + UI.MONTHS_L[+r.m.slice(5) - 1] + ' ' + r.m.slice(0, 4) + '</b>' }, { label: 'Transaksi', cls: 'r', render: r => UI.num(r.n) }, { label: 'Pendapatan', cls: 'r', render: r => '<b>' + UI.rp(r.rev) + '</b>' }, { label: 'Rata-rata', cls: 'r', render: r => UI.rp(r.n ? r.rev / r.n : 0) }, { label: 'Tunai', cls: 'r', render: r => UI.rp(r.tunai) }, { label: 'Transfer', cls: 'r', render: r => UI.rp(r.transfer) }, { label: 'QRIS', cls: 'r', render: r => UI.rp(r.qris) }], rows, { empty: 'Belum ada transaksi.' }) + '</div>';
  }
  const dashboard = {
    render() {
      const t = DB.today(), tx = paid(), res = DB.all('reservations'), mo = t.slice(0, 7);
      const pop = {}; tx.forEach(x => x.items.forEach(i => pop[i.name] = (pop[i.name] || 0) + i.qty)); const top = Object.entries(pop).sort((a, b) => b[1] - a[1])[0];
      const logs = DB.all('activityLogs').sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 8);
      return '<div class="stats">' +
        UI.stat('calendar', 'Reservasi Hari Ini', UI.num(res.filter(r => r.date === t && r.status !== 'cancelled').length)) + UI.stat('users', 'Total Member', UI.num(DB.all('members').length), '', 'info') +
        UI.stat('receipt', 'Total Transaksi', UI.num(tx.length)) + UI.stat('wallet', 'Pendapatan Hari Ini', UI.rp(sum(tx.filter(x => x.date === t), x => x.total)), '', 'info') +
        UI.stat('chart', 'Pendapatan Bulan Ini', UI.rp(sum(tx.filter(x => x.date.slice(0, 7) === mo), x => x.total))) + UI.stat('clock', 'Reservasi Menunggu', UI.num(res.filter(r => r.status === 'pending').length), '', 'warn') +
        UI.stat('activity', 'Sedang Dilayani', UI.num(res.filter(r => r.status === 'serving').length), '', 'info') + UI.stat('star', 'Layanan Terpopuler', top ? esc(top[0]) : '-', top ? top[1] + ' terjual' : '') + '</div>' +
        '<div class="card"><div class="card-h"><h3>Grafik Pendapatan</h3><select class="input" style="width:auto" data-in="days"><option value="7"' + (dash.days === 7 ? ' selected' : '') + '>7 hari</option><option value="14"' + (dash.days === 14 ? ' selected' : '') + '>14 hari</option><option value="30"' + (dash.days === 30 ? ' selected' : '') + '>30 hari</option></select></div><div id="chRev"></div></div>' +
        '<div class="cols"><div class="card"><div class="card-h"><h3>Grafik Reservasi</h3></div><div id="chRes"></div></div><div class="card"><div class="card-h"><h3>Grafik Kunjungan</h3></div><div id="chVis"></div></div></div>' +
        '<div class="cols"><div class="card"><div class="card-h"><h3>Statistik Transaksi</h3><small class="muted">Metode pembayaran</small></div><div id="chPay"></div></div><div class="card"><div class="card-h"><h3>Aktivitas Terbaru</h3></div>' + (logs.length ? logs.map(l => '<div class="list-i"><span class="np-ic">' + UI.icon('activity') + '</span><div><b>' + esc(l.text) + '</b><small>' + esc(l.by) + ' · ' + UI.ago(l.createdAt) + '</small></div></div>').join('') : UI.empty('Belum ada aktivitas.')) + '</div></div>';
    },
    mount(el) {
      const days = dayLabels(dash.days), tx = paid(), res = DB.all('reservations');
      Charts.bar(UI.$('#chRev', el), { labels: days.map(dd), values: days.map(d => sum(tx.filter(x => x.date === d), x => x.total)), fmt: UI.rp, title: 'Pendapatan harian' });
      const d7 = dayLabels(7);
      Charts.line(UI.$('#chRes', el), { labels: d7.map(dd), values: d7.map(d => res.filter(r => r.date === d && r.status !== 'cancelled').length), title: 'Reservasi harian' });
      Charts.bar(UI.$('#chVis', el), { labels: d7.map(dd), values: d7.map(d => tx.filter(x => x.date === d).length), title: 'Kunjungan harian' });
      Charts.donut(UI.$('#chPay', el), { items: Object.keys(DB.METHOD).map(k => ({ label: DB.METHOD[k], value: tx.filter(x => x.method === k).length })), centerLabel: 'Transaksi' });
    },
    inputs: { days(t) { dash.days = +t.value; this.ctx.refresh(); } }
  };

  /* ================= RESERVASI ================= */
  const rv = { q: '', status: '', date: '', p: 1 };
  function resDetail(r) {
    const m = r.memberId ? DB.get('members', r.memberId) : null;
    UI.modal({ title: 'Detail Reservasi', body: '<dl class="kv"><dt>Kode</dt><dd><b>' + esc(r.code) + '</b></dd><dt>Status</dt><dd>' + UI.badge(r.status) + '</dd><dt>Pelanggan</dt><dd>' + esc(r.customerName) + (m ? ' · ' + esc(m.number) : '') + '</dd><dt>Telepon</dt><dd>' + esc(r.phone || (m && m.phone) || '-') + '</dd><dt>Layanan</dt><dd>' + esc(r.serviceName) + ' (' + r.duration + ' mnt · ' + UI.rp(r.price) + ')</dd><dt>Jadwal</dt><dd>' + UI.dateLong(r.date) + ', ' + r.time + '</dd><dt>Terapis</dt><dd>' + esc(r.therapistId ? UI.thName(r.therapistId) : 'Belum ditentukan') + '</dd><dt>Catatan</dt><dd>' + esc(r.notes || '-') + '</dd><dt>Dibuat</dt><dd>' + UI.date(r.createdAt) + ' (' + esc(r.source || '-') + ')</dd>' + (m ? '<dt>Kunjungan</dt><dd>' + DB.memberStats(m.id).visits + ' kali · ' + m.points + ' poin</dd>' : '') + '</dl>' });
  }
  function resForm(r) {
    const edit = !!r;
    const fields = (edit ? [] : [{ name: 'memberId', label: 'Member', type: 'select', options: memberOpts(), span: 2 }, { name: 'customerName', label: 'Nama pelanggan (jika bukan member)', span: 1 }, { name: 'phone', label: 'Telepon', type: 'tel', span: 1 }]).concat([
      { name: 'serviceId', label: 'Layanan', type: 'select', options: UI.svcOptions(true), required: true, span: 2 }, { name: 'date', label: 'Tanggal', type: 'date', required: true, span: 1 }, { name: 'time', label: 'Jam', type: 'time', required: true, span: 1 },
      { name: 'therapistId', label: 'Terapis', type: 'select', options: thOpts(), span: 1 }].concat(edit ? [] : [{ name: 'status', label: 'Status awal', type: 'select', options: [{ value: 'confirmed', label: 'Dikonfirmasi' }, { value: 'pending', label: 'Menunggu Konfirmasi' }], span: 1 }]).concat([{ name: 'notes', label: 'Catatan', type: 'textarea', span: 2 }]));
    UI.form({
      title: edit ? 'Ubah Jadwal ' + r.code : 'Tambah Reservasi Manual', fields, values: edit ? r : { date: DB.today(), status: 'confirmed' },
      onSubmit(v) {
        if (edit) {
          const s = DB.get('services', v.serviceId); const c = DB.checkSlot(v.date, v.time, s.duration, v.therapistId, r.id); if (!c.ok) return c.error;
          DB.update('reservations', r.id, { serviceId: s.id, serviceName: s.name, duration: s.duration, price: s.price, date: v.date, time: v.time, therapistId: v.therapistId, notes: v.notes });
          const m = r.memberId ? DB.get('members', r.memberId) : null; if (m && m.userId) DB.notify({ title: 'Perubahan jadwal', msg: 'Jadwal ' + s.name + ' Anda diubah menjadi ' + v.date + ' ' + v.time + '.', type: 'reservation', userId: m.userId });
          DB.log('Jadwal ' + r.code + ' diubah', A); UI.toast('Jadwal diperbarui.'); return true;
        }
        const m = v.memberId ? DB.get('members', v.memberId) : null; const name = m ? m.name : v.customerName; if (!name) return 'Pilih member atau isi nama pelanggan.';
        const x = DB.createReservation({ memberId: m ? m.id : null, customerName: name, phone: v.phone || (m && m.phone) || '', serviceId: v.serviceId, date: v.date, time: v.time, therapistId: v.therapistId, notes: v.notes, status: v.status, source: 'admin' }, A);
        if (!x.ok) return x.error; UI.toast('Reservasi ' + x.item.code + ' dibuat.'); return true;
      }
    });
  }
  const reservasi = {
    render() {
      let l = DB.all('reservations').sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time));
      if (rv.q) { const q = rv.q.toLowerCase(); l = l.filter(r => (r.customerName + r.code + r.serviceName).toLowerCase().includes(q)); }
      if (rv.status) l = l.filter(r => r.status === rv.status); if (rv.date) l = l.filter(r => r.date === rv.date);
      const pg = UI.page(l, rv.p, 10);
      return '<div class="page-head"><div><h2>Manajemen Reservasi</h2><p class="muted">' + l.length + ' reservasi</p></div><button class="btn btn-primary" data-act="add">' + UI.icon('plus') + ' Reservasi Manual</button></div><div class="card"><div class="filters"><label class="grow searchbox">Cari<input class="input" id="rvQ" placeholder="Nama, kode, layanan…" value="' + esc(rv.q) + '" data-in="q"></label><label>Status<select class="input" data-in="status"><option value="">Semua</option>' + Object.keys(DB.STATUS).map(k => '<option value="' + k + '"' + (rv.status === k ? ' selected' : '') + '>' + DB.STATUS[k] + '</option>').join('') + '</select></label><label>Tanggal<input class="input" type="date" value="' + rv.date + '" data-in="date"></label></div>' +
        UI.table([{ label: 'Kode', render: r => '<b>' + esc(r.code) + '</b>' }, { label: 'Pelanggan', render: r => esc(r.customerName) }, { label: 'Layanan', render: r => esc(r.serviceName) }, { label: 'Jadwal', render: r => UI.date(r.date) + ' · ' + r.time }, { label: 'Terapis', render: r => esc(r.therapistId ? UI.thName(r.therapistId) : '-') }, { label: 'Status', render: r => UI.badge(r.status) },
          { label: '', cls: 'act', render: r => '<div class="mini-btns">' + (r.status === 'pending' ? mb('st-confirmed', r.id, 'check', 'Konfirmasi') : '') + (r.status === 'confirmed' ? mb('st-serving', r.id, 'play', 'Mulai') : '') + (r.status === 'serving' ? mb('st-done', r.id, 'check', 'Selesai') : '') + (['pending', 'confirmed'].includes(r.status) ? mb('edit', r.id, 'edit', 'Ubah') + mb('st-cancelled', r.id, 'x', 'Batal') : '') + mb('detail', r.id, 'eye', 'Detail') + mb('del', r.id, 'trash', 'Hapus') + '</div>' }], pg.items, { empty: 'Tidak ada reservasi.' }) + UI.pager(pg) + '</div>';
    },
    inputs: { q(t) { rv.q = t.value; rv.p = 1; this.ctx.refresh(); }, status(t) { rv.status = t.value; rv.p = 1; this.ctx.refresh(); }, date(t) { rv.date = t.value; rv.p = 1; this.ctx.refresh(); } },
    actions: {
      add() { resForm(null); }, edit(t) { resForm(DB.get('reservations', t.dataset.id)); }, detail(t) { resDetail(DB.get('reservations', t.dataset.id)); }, page(t) { rv.p = +t.dataset.p; this.ctx.refresh(); },
      async del(t) { const r = DB.get('reservations', t.dataset.id); if (await UI.confirm({ title: 'Hapus reservasi', message: 'Hapus permanen <b>' + esc(r.code) + '</b>?', okText: 'Hapus', danger: true })) { DB.remove('reservations', r.id); DB.log('Reservasi ' + r.code + ' dihapus', A); UI.toast('Reservasi dihapus.'); } }
    }
  };
  ['confirmed', 'serving', 'done', 'cancelled'].forEach(s => {
    reservasi.actions['st-' + s] = async function (t) {
      if (s === 'cancelled' && !(await UI.confirm({ title: 'Batalkan reservasi', message: 'Batalkan reservasi ini?', okText: 'Ya, batalkan', danger: true }))) return;
      DB.setReservationStatus(t.dataset.id, s, A); UI.toast('Status: ' + DB.STATUS[s]);
    };
  });

  /* ================= MEMBER ================= */
  const mm = { q: '', status: '', level: '', p: 1 };
  const memFields = (create) => [{ name: 'name', label: 'Nama lengkap', required: true, span: 2 }, { name: 'phone', label: 'Nomor HP', type: 'tel', span: 1 }, { name: 'email', label: 'Email', type: 'email', span: 1 }, { name: 'birth', label: 'Tanggal lahir', type: 'date', span: 1 }, { name: 'status', label: 'Status keanggotaan', type: 'select', options: [{ value: 'active', label: 'Aktif' }, { value: 'inactive', label: 'Nonaktif' }], span: 1 }, { name: 'address', label: 'Alamat', type: 'textarea', span: 2 }].concat(create ? [{ name: 'password', label: 'Password akun login (opsional)', type: 'password', span: 2, hint: 'Isi agar member dapat login. Min. 8 karakter, huruf dan angka.' }] : []);
  function memberForm(m) {
    UI.form({
      title: m ? 'Edit Member' : 'Tambah Member', fields: memFields(!m), values: m || { status: 'active' },
      onSubmit(v) {
        if (m) {
          if (v.phone && DB.all('members').some(x => x.id !== m.id && x.phone === v.phone)) return 'Nomor HP sudah dipakai member lain.';
          const em = v.email.toLowerCase(); if (em && DB.all('users').some(u => u.email === em && u.id !== m.userId)) return 'Email sudah dipakai akun lain.';
          DB.update('members', m.id, { name: v.name, phone: v.phone, email: em, birth: v.birth, address: v.address, status: v.status });
          if (m.userId) DB.update('users', m.userId, { name: v.name, email: em || DB.get('users', m.userId).email, active: v.status === 'active' });
          DB.log('Member ' + v.name + ' diubah', A); UI.toast('Member diperbarui.'); return true;
        }
        if (v.password) { const pe = Auth.validatePassword(v.password); if (pe) return pe; }
        const r = DB.createMember(v); if (!r.ok) return r.error; if (v.status !== 'active') DB.update('members', r.member.id, { status: v.status }); DB.log('Member ' + v.name + ' ditambahkan', A); UI.toast('Member ' + r.member.number + ' ditambahkan.'); return true;
      }
    });
  }
  function memberDetail(m) {
    const st = DB.memberStats(m.id);
    UI.modal({
      title: m.name, size: 'lg', body: '<dl class="kv"><dt>No. Member</dt><dd><b>' + esc(m.number) + '</b> · ' + DB.level(m.points) + '</dd><dt>Telepon</dt><dd>' + esc(m.phone || '-') + '</dd><dt>Email</dt><dd>' + esc(m.email || '-') + '</dd><dt>Lahir</dt><dd>' + (m.birth ? UI.date(m.birth) : '-') + '</dd><dt>Alamat</dt><dd>' + esc(m.address || '-') + '</dd><dt>Status</dt><dd>' + UI.badge(m.status === 'active' ? 'active' : 'inactive', m.status === 'active' ? 'Aktif' : 'Nonaktif') + '</dd><dt>Poin</dt><dd>' + UI.num(m.points) + '</dd><dt>Kunjungan</dt><dd>' + st.visits + ' · ' + UI.rp(st.spent) + '</dd></dl>' +
        '<h4 style="margin:18px 0 6px">Riwayat Kunjungan / Transaksi</h4>' + UI.table([{ label: 'Kode', render: t => esc(t.code) }, { label: 'Tanggal', render: t => UI.date(t.date) }, { label: 'Layanan', render: t => esc(t.items.map(i => i.name).join(', ')) }, { label: 'Total', cls: 'r', render: t => UI.rp(t.total) }], st.tx.slice().reverse().slice(0, 10), { empty: 'Belum ada transaksi.' }) +
        '<h4 style="margin:18px 0 6px">Reservasi</h4>' + UI.table([{ label: 'Kode', render: r => esc(r.code) }, { label: 'Jadwal', render: r => UI.date(r.date) + ' ' + r.time }, { label: 'Layanan', render: r => esc(r.serviceName) }, { label: 'Status', render: r => UI.badge(r.status) }], st.reservations.slice().reverse().slice(0, 8), { empty: 'Belum ada reservasi.' })
    });
  }
  const member = {
    render() {
      let l = DB.all('members'); if (mm.q) { const q = mm.q.toLowerCase(); l = l.filter(m => (m.name + m.number + m.phone + m.email).toLowerCase().includes(q)); }
      if (mm.status) l = l.filter(m => m.status === mm.status); if (mm.level) l = l.filter(m => DB.level(m.points) === mm.level);
      const pg = UI.page(l, mm.p, 10);
      return '<div class="page-head"><div><h2>Manajemen Member</h2><p class="muted">' + l.length + ' member</p></div><button class="btn btn-primary" data-act="add">' + UI.icon('plus') + ' Tambah Member</button></div><div class="card"><div class="filters"><label class="grow searchbox">Cari<input class="input" id="mmQ" placeholder="Nama, nomor, HP, email…" value="' + esc(mm.q) + '" data-in="q"></label><label>Status<select class="input" data-in="status"><option value="">Semua</option><option value="active"' + (mm.status === 'active' ? ' selected' : '') + '>Aktif</option><option value="inactive"' + (mm.status === 'inactive' ? ' selected' : '') + '>Nonaktif</option></select></label><label>Level<select class="input" data-in="level"><option value="">Semua</option>' + ['Silver', 'Gold', 'Platinum'].map(x => '<option' + (mm.level === x ? ' selected' : '') + '>' + x + '</option>').join('') + '</select></label></div>' +
        UI.table([{ label: 'Member', render: m => '<div class="name">' + UI.avatar(m.name, m.photo, 'sm') + '<div><b>' + esc(m.name) + '</b><small>' + esc(m.number) + '</small></div></div>' }, { label: 'Telepon', render: m => esc(m.phone || '-') }, { label: 'Level', render: m => DB.level(m.points) }, { label: 'Poin', cls: 'r', render: m => UI.num(m.points) }, { label: 'Kunjungan', cls: 'r', render: m => DB.memberStats(m.id).visits }, { label: 'Status', render: m => UI.badge(m.status === 'active' ? 'active' : 'inactive', m.status === 'active' ? 'Aktif' : 'Nonaktif') },
          { label: '', cls: 'act', render: m => '<div class="mini-btns">' + mb('detail', m.id, 'eye', 'Detail') + mb('edit', m.id, 'edit', 'Edit') + mb('pts', m.id, 'star', 'Poin') + mb('del', m.id, 'trash', 'Hapus') + '</div>' }], pg.items, { empty: 'Tidak ada member.' }) + UI.pager(pg) + '</div>';
    },
    inputs: { q(t) { mm.q = t.value; mm.p = 1; this.ctx.refresh(); }, status(t) { mm.status = t.value; mm.p = 1; this.ctx.refresh(); }, level(t) { mm.level = t.value; mm.p = 1; this.ctx.refresh(); } },
    actions: {
      add() { memberForm(null); }, edit(t) { memberForm(DB.get('members', t.dataset.id)); }, detail(t) { memberDetail(DB.get('members', t.dataset.id)); }, page(t) { mm.p = +t.dataset.p; this.ctx.refresh(); },
      pts(t) {
        const m = DB.get('members', t.dataset.id);
        UI.form({ title: 'Poin ' + m.name + ' (' + m.points + ')', fields: [{ name: 'delta', label: 'Tambah / kurangi poin (gunakan minus untuk mengurangi)', type: 'number', required: true }, { name: 'note', label: 'Keterangan', required: true }], submitText: 'Terapkan', onSubmit(v) { if (!v.delta) return 'Jumlah poin tidak boleh 0.'; DB.adjustPoints(m.id, v.delta, v.note); DB.log('Poin ' + m.name + ' ' + (v.delta > 0 ? '+' : '') + v.delta, A); UI.toast('Poin diperbarui.'); return true; } });
      },
      async del(t) { const m = DB.get('members', t.dataset.id); if (await UI.confirm({ title: 'Hapus member', message: 'Hapus <b>' + esc(m.name) + '</b>' + (m.userId ? ' beserta akun login-nya' : '') + '? Riwayat transaksi tetap tersimpan.', okText: 'Hapus', danger: true })) { DB.removeMember(m.id); DB.log('Member ' + m.name + ' dihapus', A); UI.toast('Member dihapus.'); } }
    }
  };

  /* ================= LAYANAN ================= */
  const svcFields = [{ name: 'name', label: 'Nama layanan', required: true }, { name: 'category', label: 'Kategori', span: 1 }, { name: 'duration', label: 'Durasi (menit)', type: 'number', min: 5, required: true, span: 1 }, { name: 'price', label: 'Harga (Rp)', type: 'number', min: 0, required: true, span: 1 }, { name: 'description', label: 'Deskripsi', type: 'textarea' }, { name: 'image', label: 'Foto layanan', type: 'image' }, { name: 'active', label: 'Layanan aktif (tampil di website)', type: 'checkbox' }];
  function svcForm(s) {
    UI.form({
      title: s ? 'Edit Layanan' : 'Tambah Layanan', fields: svcFields, values: s || { active: true, duration: 60 },
      onSubmit(v) {
        if (DB.all('services').some(x => x.id !== (s && s.id) && x.name.toLowerCase() === v.name.toLowerCase())) return 'Nama layanan sudah ada.';
        if (s) DB.update('services', s.id, Object.assign({}, v, { demo: false })); else DB.insert('services', Object.assign({}, v, { demo: false }));
        DB.log('Layanan ' + v.name + (s ? ' diubah' : ' ditambahkan'), A); UI.toast('Layanan disimpan.'); return true;
      }
    });
  }
  const layanan = {
    render() {
      const l = DB.all('services');
      return '<div class="page-head"><div><h2>Manajemen Layanan &amp; Harga</h2><p class="muted">Perubahan langsung tampil di website. Data bertanda DEMO adalah contoh; ubah sesuai harga sebenarnya.</p></div><button class="btn btn-primary" data-act="add">' + UI.icon('plus') + ' Tambah Layanan</button></div>' +
        (l.length ? '<div class="mgrid">' + l.map(s => '<div class="mcell' + (s.active ? '' : ' off') + '"><div class="ph">' + UI.img(s.image, s.name) + '</div><div class="bd"><b>' + esc(s.name) + (s.demo ? ' <span class="badge b-demo">DEMO</span>' : '') + '</b><small class="muted">' + esc(s.category || '-') + ' · ' + s.duration + ' menit</small><div class="price">' + UI.rp(s.price) + '</div><small class="muted">' + esc(s.description) + '</small></div><div class="ft"><label class="row" style="flex-wrap:nowrap"><span class="switch"><input type="checkbox" data-in="tog" data-id="' + s.id + '"' + (s.active ? ' checked' : '') + '><i></i></span><small>' + (s.active ? 'Aktif' : 'Nonaktif') + '</small></label><div class="mini-btns">' + mb('edit', s.id, 'edit', 'Edit') + mb('del', s.id, 'trash', 'Hapus') + '</div></div></div>').join('') + '</div>' : '<div class="card">' + UI.empty('Belum ada layanan.') + '</div>');
    },
    inputs: { tog(t) { DB.update('services', t.dataset.id, { active: t.checked }); UI.toast(t.checked ? 'Layanan diaktifkan.' : 'Layanan dinonaktifkan.', 'info'); } },
    actions: { add() { svcForm(null); }, edit(t) { svcForm(DB.get('services', t.dataset.id)); }, async del(t) { const s = DB.get('services', t.dataset.id); if (await UI.confirm({ title: 'Hapus layanan', message: 'Hapus <b>' + esc(s.name) + '</b>? Transaksi lama tidak terpengaruh.', okText: 'Hapus', danger: true })) { DB.remove('services', s.id); DB.log('Layanan ' + s.name + ' dihapus', A); UI.toast('Layanan dihapus.'); } } }
  };

  /* ================= PROMO ================= */
  const KINDS = ['Promo Hari Ini', 'Paket Couple', 'Paket Family', 'Paket Member', 'Promo Ulang Tahun', 'Promo Spesial'];
  const promoFields = [{ name: 'title', label: 'Judul promo', required: true }, { name: 'kind', label: 'Jenis', type: 'select', options: KINDS, span: 1 }, { name: 'code', label: 'Kode promo', required: true, span: 1 }, { name: 'discType', label: 'Tipe diskon', type: 'select', options: [{ value: 'percent', label: 'Persentase (%)' }, { value: 'nominal', label: 'Nominal (Rp)' }], span: 1 }, { name: 'value', label: 'Nilai diskon', type: 'number', min: 0, required: true, span: 1 }, { name: 'minSpend', label: 'Minimal belanja (Rp)', type: 'number', min: 0, span: 1 }, { name: 'packagePrice', label: 'Harga paket (Rp, opsional)', type: 'number', min: 0, span: 1 }, { name: 'pointsCost', label: 'Poin untuk menukar (0 = tidak bisa ditukar)', type: 'number', min: 0, span: 2 }, { name: 'startDate', label: 'Mulai berlaku', type: 'date', required: true, span: 1 }, { name: 'endDate', label: 'Berakhir', type: 'date', required: true, span: 1 }, { name: 'description', label: 'Deskripsi', type: 'textarea' }, { name: 'image', label: 'Gambar', type: 'image' }, { name: 'active', label: 'Promo aktif', type: 'checkbox' }];
  function promoForm(p) {
    UI.form({
      title: p ? 'Edit Promo' : 'Tambah Promo', fields: promoFields, values: p || { active: true, kind: KINDS[5], discType: 'percent', startDate: DB.today(), endDate: DB.addDays(DB.today(), 30) },
      onSubmit(v) {
        v.code = v.code.toUpperCase().replace(/\s+/g, ''); if (DB.all('promotions').some(x => x.id !== (p && p.id) && x.code.toUpperCase() === v.code)) return 'Kode promo sudah digunakan.';
        if (v.endDate < v.startDate) return 'Tanggal berakhir harus setelah tanggal mulai.'; if (v.discType === 'percent' && v.value > 100) return 'Persentase maksimal 100.';
        if (p) DB.update('promotions', p.id, v); else { const n = DB.insert('promotions', v); DB.notify({ title: 'Promo terbaru', msg: v.title + ' — kode ' + v.code, type: 'promo', roles: ['member'] }); }
        DB.log('Promo ' + v.title + (p ? ' diubah' : ' ditambahkan'), A); UI.toast('Promo disimpan.'); return true;
      }
    });
  }
  const promo = {
    render() {
      const t = DB.today(), l = DB.all('promotions');
      return '<div class="page-head"><div><h2>Manajemen Promo</h2></div><button class="btn btn-primary" data-act="add">' + UI.icon('plus') + ' Tambah Promo</button></div><div class="card">' + UI.table([{ label: 'Promo', render: p => '<div class="name">' + UI.img(p.image, p.title, 'avatar') + '<div><b>' + esc(p.title) + '</b><small>' + esc(p.kind) + '</small></div></div>' }, { label: 'Kode', render: p => '<span class="vch">' + esc(p.code) + '</span>' }, { label: 'Diskon', render: p => p.discType === 'percent' ? p.value + '%' : UI.rp(p.value) }, { label: 'Berlaku', render: p => UI.date(p.startDate) + ' – ' + UI.date(p.endDate) },
        { label: 'Status', render: p => !p.active ? UI.badge('inactive', 'Nonaktif') : p.endDate < t ? UI.badge('cancelled', 'Kedaluwarsa') : p.startDate > t ? UI.badge('pending', 'Terjadwal') : UI.badge('active', 'Aktif') }, { label: '', cls: 'act', render: p => '<div class="mini-btns">' + mb('tog', p.id, p.active ? 'x' : 'check', p.active ? 'Nonaktifkan' : 'Aktifkan') + mb('edit', p.id, 'edit', 'Edit') + mb('del', p.id, 'trash', 'Hapus') + '</div>' }], l, { empty: 'Belum ada promo.' }) + '</div>';
    },
    actions: { add() { promoForm(null); }, edit(t) { promoForm(DB.get('promotions', t.dataset.id)); }, tog(t) { const p = DB.get('promotions', t.dataset.id); DB.update('promotions', p.id, { active: !p.active }); UI.toast('Status promo diubah.'); }, async del(t) { const p = DB.get('promotions', t.dataset.id); if (await UI.confirm({ title: 'Hapus promo', message: 'Hapus <b>' + esc(p.title) + '</b>?', okText: 'Hapus', danger: true })) { DB.remove('promotions', p.id); UI.toast('Promo dihapus.'); } } }
  };

  /* ================= TERAPIS ================= */
  const thFields = [{ name: 'name', label: 'Nama karyawan', required: true, span: 1 }, { name: 'phone', label: 'Nomor HP', type: 'tel', span: 1 }, { name: 'days', label: 'Hari kerja', type: 'days', required: true }, { name: 'startTime', label: 'Jam mulai', type: 'time', required: true, span: 1 }, { name: 'endTime', label: 'Jam selesai', type: 'time', required: true, span: 1 }, { name: 'photo', label: 'Foto', type: 'image' }, { name: 'active', label: 'Status aktif', type: 'checkbox' }];
  function thForm(t) {
    UI.form({ title: t ? 'Edit Terapis' : 'Tambah Terapis', fields: thFields, values: t || { active: true, days: [1, 2, 3, 4, 5, 6], startTime: DB.settings().openTime, endTime: DB.settings().closeTime }, onSubmit(v) { if (v.endTime <= v.startTime) return 'Jam selesai harus setelah jam mulai.'; if (t) DB.update('therapists', t.id, Object.assign({}, v, { demo: false })); else DB.insert('therapists', Object.assign({}, v, { demo: false })); DB.log('Terapis ' + v.name + ' disimpan', A); UI.toast('Data terapis disimpan.'); return true; } });
  }
  const terapis = {
    render() {
      const t = DB.today(), att = DB.all('attendance').filter(a => a.date === t).map(a => a.therapistId), l = DB.all('therapists');
      return '<div class="page-head"><div><h2>Terapis &amp; Karyawan</h2><p class="muted">Penugasan terapis dilakukan saat mengatur reservasi dan kasir.</p></div><button class="btn btn-primary" data-act="add">' + UI.icon('plus') + ' Tambah Terapis</button></div>' +
        (l.length ? '<div class="mgrid">' + l.map(x => '<div class="mcell' + (x.active ? '' : ' off') + '"><div class="th-card">' + UI.avatar(x.name, x.photo, 'lg') + '<div class="bd"><b>' + esc(x.name) + (x.demo ? ' <span class="badge b-demo">DEMO</span>' : '') + '</b><br><small class="muted">' + esc(x.phone || 'HP belum diisi') + '</small><br><small>' + (x.days || []).map(d => UI.DAYS[d]).join(', ') + ' · ' + x.startTime + '–' + x.endTime + '</small><br>' + UI.badge(x.active ? 'active' : 'inactive', x.active ? 'Aktif' : 'Nonaktif') + '</div></div><div class="ft"><label class="row" style="flex-wrap:nowrap"><span class="switch"><input type="checkbox" data-in="att" data-id="' + x.id + '"' + (att.includes(x.id) ? ' checked' : '') + '><i></i></span><small>Hadir hari ini</small></label><div class="mini-btns">' + mb('hist', x.id, 'clock', 'Riwayat') + mb('edit', x.id, 'edit', 'Edit') + mb('del', x.id, 'trash', 'Hapus') + '</div></div></div>').join('') + '</div>' : '<div class="card">' + UI.empty('Belum ada terapis.') + '</div>');
    },
    inputs: { att(t) { const d = DB.today(), id = t.dataset.id; const ex = DB.all('attendance').find(a => a.therapistId === id && a.date === d); if (t.checked && !ex) DB.insert('attendance', { therapistId: id, date: d }); if (!t.checked && ex) DB.remove('attendance', ex.id); } },
    actions: {
      add() { thForm(null); }, edit(t) { thForm(DB.get('therapists', t.dataset.id)); },
      hist(t) { const x = DB.get('therapists', t.dataset.id), tx = DB.all('transactions').filter(a => a.therapistId === x.id).sort((a, b) => b.date.localeCompare(a.date)).slice(0, 15); UI.modal({ title: 'Riwayat Pelayanan ' + x.name, size: 'lg', body: UI.table([{ label: 'Tanggal', render: a => UI.date(a.date) }, { label: 'Kode', render: a => esc(a.code) }, { label: 'Pelanggan', render: a => esc(a.customerName) }, { label: 'Layanan', render: a => esc(a.items.map(i => i.name).join(', ')) }, { label: 'Total', cls: 'r', render: a => UI.rp(a.total) }], tx, { empty: 'Belum ada pelayanan.' }) }); },
      async del(t) { const x = DB.get('therapists', t.dataset.id); if (await UI.confirm({ title: 'Hapus terapis', message: 'Hapus <b>' + esc(x.name) + '</b>? Sebaiknya nonaktifkan agar riwayat tetap rapi.', okText: 'Hapus', danger: true })) { DB.remove('therapists', x.id); UI.toast('Terapis dihapus.'); } }
    }
  };

  /* ================= KASIR (mode POS) ================= */
  const K0 = () => ({ memberId: '', cname: '', items: [], promo: '', manual: 0, method: 'tunai', pay: 'lunas', th: '', resId: '', cat: '', cash: '', bank: '', ref: '', dOpen: false });
  let k = K0(); const kq = { q: '', p: 1, st: '', m: '', mo: '', tab: 'baru' };
  const PMI = { tunai: 'cash', transfer: 'bank', qris: 'qr' };
  const initials = n => String(n || '?').split(/\s+/).slice(0, 2).map(w => w[0]).join('').toUpperCase();
  function calc() {
    const subtotal = sum(k.items, i => i.price * i.qty), mem = k.memberId ? DB.get('members', k.memberId) : null;
    let pr = null, pdisc = 0; if (k.promo) { pr = DB.validPromo(k.promo, subtotal, mem); if (pr.ok) pdisc = pr.discount; }
    const manual = Math.min(Math.max(0, +k.manual || 0), subtotal - pdisc); const discount = pdisc + manual;
    const total = subtotal - discount, got = k.cash === '' ? total : +k.cash;
    return { subtotal, pr, mem, discount, total, got, change: got - total };
  }
  const payForm = (tx) => UI.form({
    title: 'Pelunasan ' + tx.code + ' · ' + UI.rp(tx.total), submitText: 'Terima Pembayaran', values: { method: tx.method || 'tunai' },
    fields: [{ name: 'method', label: 'Metode pembayaran', type: 'select', options: Object.keys(DB.METHOD).map(m => ({ value: m, label: DB.METHOD[m] })), span: 2 }, { name: 'paidAmount', label: 'Uang diterima (khusus tunai)', type: 'number', min: 0, span: 2, hint: 'Kosongkan bila uang pas.' }, { name: 'payBank', label: 'Bank pengirim (transfer)', span: 1 }, { name: 'payRef', label: 'No. referensi (transfer/QRIS)', span: 1 }],
    onSubmit(v) { if (!v.paidAmount) delete v.paidAmount; const r = DB.markPaid(tx.id, A, v); if (r && r.ok === false) return r.error; UI.toast('Pembayaran ' + tx.code + ' diterima.'); setTimeout(() => Receipt.preview(DB.get('transactions', tx.id)), 250); return true; }
  });
  function payPanel(c) {
    const s = DB.settings();
    if (k.method === 'tunai') {
      const q = [c.total].concat([20000, 50000, 100000, 150000, 200000].filter(v => v > c.total)).slice(0, 4);
      return '<div class="pm-box"><label for="kCash">Uang diterima (Rp)</label><input class="input input-xl" id="kCash" type="number" inputmode="numeric" min="0" value="' + esc(k.cash) + '" placeholder="' + c.total + '"><div class="qchips">' + q.map((v, i) => '<button type="button" class="chip' + (String(v) === String(k.cash) ? ' on' : '') + '" data-act="quick" data-v="' + v + '">' + (i ? UI.rp(v) : 'Uang pas') + '</button>').join('') + '</div><div class="change"></div></div>';
    }
    if (k.method === 'transfer') {
      return '<div class="pm-box">' + (s.bankAccount ? '<div class="bankcard"><small>' + esc(s.bankName || 'Bank') + '</small><b>' + esc(s.bankAccount) + '</b><span>a.n. ' + esc(s.bankHolder || s.businessName) + '</span><button type="button" class="btn btn-ghost btn-sm" data-act="copyAcc">' + UI.icon('copy') + ' Salin rekening</button></div>' : '<div class="notice-warn">Rekening belum diatur. Isi di Pengaturan → Pembayaran.</div>') +
        '<div class="two-f"><div class="field"><label for="kBank">Bank pengirim</label><input class="input" id="kBank" value="' + esc(k.bank) + '" placeholder="mis. BCA"></div><div class="field"><label for="kRef">Referensi / nama pengirim</label><input class="input" id="kRef" value="' + esc(k.ref) + '" placeholder="Opsional"></div></div><small class="muted">Cocokkan nominal <b>' + UI.rp(c.total) + '</b> dengan mutasi/bukti transfer.</small></div>';
    }
    return '<div class="pm-box qrbox">' + (s.qrisImage ? '<button type="button" class="qr-wrap" data-act="qrBig" title="Perbesar QRIS"><img class="qr-img" src="' + esc(s.qrisImage) + '" alt="QRIS pembayaran"></button>' : '<div class="notice-warn">Gambar QRIS belum diatur (Pengaturan → Pembayaran).</div>') +
      '<div><b class="qr-amt">' + UI.rp(c.total) + '</b><small class="muted">Pelanggan memindai QRIS &amp; memasukkan nominal ini. Konfirmasi setelah dana masuk.</small></div><div class="field" style="width:100%"><label for="kRef">No. referensi (opsional)</label><input class="input" id="kRef" value="' + esc(k.ref) + '" placeholder="Dari notifikasi bank/e-wallet"></div></div>';
  }
  const copyAcc = () => { const a = DB.settings().bankAccount; (navigator.clipboard ? navigator.clipboard.writeText(a) : Promise.reject()).then(() => UI.toast('Nomor rekening disalin.'), () => UI.toast('Rekening: ' + a, 'info')); };
  const qrBig = () => { const c = calc(); UI.modal({ title: 'Scan QRIS · ' + UI.rp(c.total), size: 'md', focus: false, body: '<div class="qr-big"><img src="' + esc(DB.settings().qrisImage) + '" alt="QRIS"><p class="muted">Pelanggan memindai kode ini, lalu memasukkan nominal <b>' + UI.rp(c.total) + '</b>.</p></div>' }); };
  const loadRes = r => { const s = DB.get('services', r.serviceId); k.resId = r.id; k.items = s ? [{ serviceId: s.id, name: s.name, duration: s.duration, price: s.price, qty: 1 }] : []; k.memberId = r.memberId || ''; k.cname = r.memberId ? '' : r.customerName; k.th = r.therapistId || ''; };
  const openRes = () => DB.all('reservations').filter(r => ['pending', 'confirmed', 'serving'].includes(r.status) && r.date >= DB.today()).sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));

  function pickMember(ctx) {
    const m = UI.modal({ title: 'Pilih Pelanggan', size: 'md', body: '<input class="input" id="mpQ" type="search" placeholder="Cari nama / no. member / telepon…" autocomplete="off"><div class="plist" id="mpL"></div>' });
    const L = UI.$('#mpL', m.el), list = DB.all('members').filter(x => x.status !== 'inactive');
    const draw = q => { q = q.toLowerCase().trim(); const l = list.filter(x => !q || (x.name + x.number + (x.phone || '')).toLowerCase().includes(q)).slice(0, 40); L.innerHTML = (q ? '' : '<button class="pitem" data-m=""><span class="av">' + UI.icon('user') + '</span><span><b>Pelanggan umum</b><small>Tanpa member</small></span></button>') + (l.map(x => '<button class="pitem" data-m="' + x.id + '"><span class="av">' + esc(initials(x.name)) + '</span><span><b>' + esc(x.name) + '</b><small>' + esc(x.number) + (x.phone ? ' · ' + esc(x.phone) : '') + '</small></span><em>' + UI.num(x.points) + ' poin</em></button>').join('') || '<p class="muted" style="padding:14px">Member tidak ditemukan.</p>'); };
    draw(''); UI.$('#mpQ', m.el).addEventListener('input', e => draw(e.target.value));
    L.addEventListener('click', e => { const b = e.target.closest('[data-m]'); if (!b) return; k.memberId = b.dataset.m; if (k.memberId) k.cname = ''; m.close(); ctx.refresh(); });
  }
  function pickRes(ctx) {
    const m = UI.modal({ title: 'Ambil dari Reservasi', size: 'md', body: '<input class="input" id="mpQ" type="search" placeholder="Cari nama / kode reservasi…" autocomplete="off"><div class="plist" id="mpL"></div>' });
    const L = UI.$('#mpL', m.el), list = openRes(), t = DB.today();
    const draw = q => { q = q.toLowerCase().trim(); const l = list.filter(r => !q || (r.code + r.customerName + r.serviceName).toLowerCase().includes(q)).slice(0, 40); L.innerHTML = l.map(r => '<button class="pitem" data-r="' + r.id + '"><span class="av">' + esc(r.time) + '</span><span><b>' + esc(r.customerName) + '</b><small>' + esc(r.serviceName) + ' · ' + (r.date === t ? 'Hari ini' : UI.date(r.date)) + ' · ' + esc(r.code) + '</small></span><em>' + UI.badge(r.status, DB.STATUS[r.status]) + '</em></button>').join('') || '<p class="muted" style="padding:14px">Tidak ada reservasi aktif.</p>'; };
    draw(''); UI.$('#mpQ', m.el).addEventListener('input', e => draw(e.target.value));
    L.addEventListener('click', e => { const b = e.target.closest('[data-r]'); if (!b) return; loadRes(DB.get('reservations', b.dataset.r)); m.close(); ctx.refresh(); });
  }
  function doSave(ctx, lunas, done) {
    const c = calc(); if (!k.items.length) return UI.toast('Pilih layanan terlebih dahulu.', 'err');
    if (k.promo && c.pr && !c.pr.ok) return UI.toast('Kode promo tidak valid: ' + c.pr.error, 'err');
    if (lunas && k.method === 'tunai' && c.change < 0) return UI.toast('Uang diterima kurang ' + UI.rp(-c.change) + '.', 'err');
    const m = c.mem; const r = DB.createTransaction({ items: k.items, discount: c.discount, promoCode: c.pr && c.pr.ok ? c.pr.promo.code : '', memberId: m ? m.id : '', customerName: m ? m.name : (k.cname.trim() || 'Pelanggan Umum'), method: k.method, payStatus: lunas ? 'lunas' : 'belum', paidAmount: k.method === 'tunai' ? c.got : undefined, payRef: k.ref, payBank: k.bank, therapistId: k.th, reservationId: k.resId, voucherId: c.pr && c.pr.ok && c.pr.voucher ? c.pr.voucher.id : '' }, A);
    if (!r.ok) return UI.toast(r.error, 'err');
    k = K0(); if (done) done(); UI.toast(lunas ? 'Pembayaran ' + UI.rp(r.item.total) + ' diterima · ' + r.item.code : r.item.code + ' disimpan (belum lunas).'); ctx.refresh(); setTimeout(() => Receipt.preview(r.item), 250);
  }
  function paySheet(ctx) {
    if (!k.items.length) return UI.toast('Pilih layanan terlebih dahulu.', 'err');
    const c0 = calc(); if (k.promo && c0.pr && !c0.pr.ok) return UI.toast('Kode promo tidak valid: ' + c0.pr.error, 'err');
    k.cash = '';
    const m = UI.modal({ title: 'Pembayaran', size: 'md', focus: false, body: '<div class="paysum"><small>Total tagihan</small><b>' + UI.rp(c0.total) + '</b><span>' + sum(k.items, i => i.qty) + ' layanan · ' + esc(c0.mem ? c0.mem.name : (k.cname || 'Pelanggan umum')) + '</span></div><div id="pyT"></div><div id="pyB"></div>', footer: '<button class="btn btn-ghost" data-close>Batal</button><button class="btn btn-primary btn-lg" id="pyOk"></button>' });
    const T = UI.$('#pyT', m.el), B = UI.$('#pyB', m.el), ok = UI.$('#pyOk', m.el);
    const upd = () => { const c = calc(), ch = UI.$('.change', m.el); if (ch) { ch.className = 'change ' + (c.change >= 0 ? 'ok' : 'bad'); ch.innerHTML = '<span>' + (c.change >= 0 ? 'Kembalian' : 'Kurang') + '</span><b>' + UI.rp(Math.abs(c.change)) + '</b>'; } ok.disabled = k.method === 'tunai' && c.change < 0; ok.innerHTML = UI.icon('receipt') + ' Terima ' + UI.rp(c.total) + ' &amp; Cetak Struk'; };
    const paint = () => { T.innerHTML = '<div class="paym" role="radiogroup" aria-label="Metode pembayaran">' + Object.keys(DB.METHOD).map(x => '<button type="button" class="pm' + (k.method === x ? ' on' : '') + '" role="radio" aria-checked="' + (k.method === x) + '" data-act="method" data-v="' + x + '">' + UI.icon(PMI[x]) + '<b>' + DB.METHOD[x] + '</b></button>').join('') + '</div>'; B.innerHTML = payPanel(calc()); upd(); };
    m.el.addEventListener('click', e => { const a = e.target.closest('[data-act]'); if (!a) return; const x = a.dataset.act; if (x === 'method') { k.method = a.dataset.v; k.cash = ''; paint(); } else if (x === 'quick') { k.cash = a.dataset.v; paint(); } else if (x === 'copyAcc') copyAcc(); else if (x === 'qrBig') qrBig(); });
    m.el.addEventListener('input', e => { const t = e.target; if (t.id === 'kCash') { k.cash = t.value; upd(); UI.$$('.qchips .chip', m.el).forEach(b => b.classList.toggle('on', b.dataset.v === t.value)); } else if (t.id === 'kBank') k.bank = t.value; else if (t.id === 'kRef') k.ref = t.value; });
    m.el.addEventListener('keydown', e => { if (e.key === 'Enter' && e.target.id === 'kCash' && !ok.disabled) ok.click(); });
    ok.onclick = () => doSave(ctx, true, m.close); paint(); if (k.method === 'tunai') setTimeout(() => { const i = UI.$('#kCash', m.el); if (i && !matchMedia('(pointer:coarse)').matches) i.focus(); }, 250);
  }

  const kasir = {
    render() {
      const all = DB.all('transactions'), t = DB.today(), td = all.filter(x => x.date === t && x.payStatus === 'lunas'), by = q => sum(td.filter(x => x.method === q), x => x.total), unpaid = all.filter(x => x.payStatus === 'belum');
      const head = '<div class="page-head"><div><h2>Kasir</h2><p class="muted">Pilih pelanggan &amp; layanan, terima pembayaran, cetak struk.</p></div><div class="seg" role="tablist"><button role="tab" class="' + (kq.tab === 'baru' ? 'on' : '') + '" data-act="tab" data-v="baru">' + UI.icon('plus') + ' Kasir Baru</button><button role="tab" class="' + (kq.tab === 'riwayat' ? 'on' : '') + '" data-act="tab" data-v="riwayat">' + UI.icon('receipt') + ' Riwayat <i>' + UI.num(all.length) + '</i></button></div></div>' +
        '<div class="today"><div><small>Hari ini</small><b>' + UI.rp(sum(td, x => x.total)) + '</b><span>' + td.length + ' transaksi lunas</span></div><div><small>Tunai</small><b>' + UI.rp(by('tunai')) + '</b></div><div><small>Transfer</small><b>' + UI.rp(by('transfer')) + '</b></div><div><small>QRIS</small><b>' + UI.rp(by('qris')) + '</b></div><div class="' + (unpaid.length ? 'warn' : '') + '"><small>Belum lunas</small><b>' + UI.num(unpaid.length) + '</b><span>' + UI.rp(sum(unpaid, x => x.total)) + '</span></div></div>';
      return head + (kq.tab === 'baru' ? this.baru() : this.riwayat(all));
    },
    baru() {
      const c = calc(), svcs = DB.all('services').filter(s => s.active), cats = [...new Set(svcs.map(s => s.category).filter(Boolean))], t = DB.today();
      const today = openRes().filter(r => r.date === t).slice(0, 8), mem = c.mem, nItems = sum(k.items, i => i.qty);
      const qtyOf = id => { const i = k.items.find(x => x.serviceId === id); return i ? i.qty : 0; };
      const who = mem ? '<span class="av">' + esc(initials(mem.name)) + '</span><span><b>' + esc(mem.name) + '</b><small>' + esc(mem.number) + ' · ' + UI.num(mem.points) + ' poin</small></span>' : '<span class="av">' + UI.icon('user') + '</span><span><b>Pelanggan umum</b><small>Ketuk untuk pilih member</small></span>';
      const th = DB.all('therapists').filter(x => x.active);
      return '<div class="pos2"><div class="pos-l">' +
        '<section class="card pstep"><div class="card-h"><h3><i class="sn">1</i> Pelanggan</h3>' + (k.resId ? '<button class="chip on" data-act="clrRes">Dari reservasi ✕</button>' : '') + '</div>' +
        '<button class="pick" data-act="pickMember">' + who + UI.icon('chevron') + '</button>' + (mem ? '' : '<div class="field" style="margin-top:10px"><input class="input" id="kName" data-in="cname" value="' + esc(k.cname) + '" placeholder="Nama pelanggan (opsional)" aria-label="Nama pelanggan"></div>') +
        '<div class="rrow"><small class="muted">Reservasi hari ini</small><div class="rchips">' + (today.length ? today.map(r => '<button class="chip' + (k.resId === r.id ? ' on' : '') + '" data-act="loadRes" data-id="' + r.id + '"><b>' + esc(r.time) + '</b> ' + esc(r.customerName) + '</button>').join('') : '<span class="muted">Tidak ada</span>') + '<button class="chip" data-act="pickRes">Lainnya…</button></div></div></section>' +
        '<section class="card pstep"><div class="card-h"><h3><i class="sn">2</i> Layanan</h3></div>' + (cats.length > 1 ? '<div class="rchips cats"><button class="chip' + (k.cat ? '' : ' on') + '" data-act="cat" data-v="">Semua</button>' + cats.map(x => '<button class="chip' + (k.cat === x ? ' on' : '') + '" data-act="cat" data-v="' + esc(x) + '">' + esc(x) + '</button>').join('') + '</div>' : '') +
        '<div class="tiles">' + svcs.filter(s => !k.cat || s.category === k.cat).map(s => { const q = qtyOf(s.id); return '<button class="tile' + (q ? ' on' : '') + '" data-act="addSvc" data-id="' + s.id + '" aria-label="Tambah ' + esc(s.name) + '">' + (q ? '<em>' + q + '</em>' : '') + '<b>' + esc(s.name) + '</b><small>' + s.duration + ' menit</small><strong>' + UI.rp(s.price) + '</strong></button>'; }).join('') + '</div></section></div>' +
        '<aside class="pos-r2"><section class="card pstep"><div class="card-h"><h3><i class="sn">3</i> Pesanan</h3>' + (k.items.length ? '<button class="btn btn-ghost btn-sm" data-act="reset">Kosongkan</button>' : '') + '</div>' +
        (k.items.length ? k.items.map((i, ix) => '<div class="line"><div><b>' + esc(i.name) + '</b><br><small>' + UI.rp(i.price) + ' · ' + i.duration + ' mnt</small></div><span class="qty"><button data-act="dec" data-i="' + ix + '" aria-label="Kurangi">−</button><b>' + i.qty + '</b><button data-act="inc" data-i="' + ix + '" aria-label="Tambah">+</button></span><b class="lt">' + UI.rp(i.price * i.qty) + '</b></div>').join('') : '<div class="empty-cart">' + UI.icon('receipt') + '<p>Belum ada layanan.<br><small>Ketuk layanan di sebelah kiri untuk menambahkan.</small></p></div>') +
        '<div class="rrow"><small class="muted">Terapis</small><div class="rchips"><button class="chip' + (k.th ? '' : ' on') + '" data-act="setTh" data-v="">Bebas</button>' + th.map(x => '<button class="chip' + (k.th === x.id ? ' on' : '') + '" data-act="setTh" data-v="' + x.id + '">' + esc(x.name) + '</button>').join('') + '</div></div>' +
        '<button class="disc-t" data-act="tgDisc" aria-expanded="' + !!(k.dOpen || k.promo || k.manual) + '">' + UI.icon('tag') + ' Promo &amp; diskon' + (c.discount ? ' <b>−' + UI.rp(c.discount) + '</b>' : '') + UI.icon('chevron') + '</button>' +
        (k.dOpen || k.promo || k.manual ? '<div class="form-grid" style="margin-top:8px"><div class="field span-1"><label for="kPromo">Kode promo / voucher</label><input class="input" id="kPromo" data-in="promo" value="' + esc(k.promo) + '" placeholder="mis. HARIINI">' + (k.promo && c.pr ? '<small style="color:' + (c.pr.ok ? 'var(--ok)' : 'var(--bad)') + '">' + (c.pr.ok ? '✓ ' + esc(c.pr.promo.title) + ' −' + UI.rp(c.pr.discount) : esc(c.pr.error)) + '</small>' : '') + '</div><div class="field span-1"><label for="kManual">Diskon manual (Rp)</label><input class="input" id="kManual" type="number" inputmode="numeric" min="0" data-in="manual" value="' + (k.manual || '') + '"></div></div>' : '') +
        '<div class="totals"><div><span>Subtotal</span><span>' + UI.rp(c.subtotal) + '</span></div>' + (c.discount ? '<div><span>Diskon</span><span>−' + UI.rp(c.discount) + '</span></div>' : '') + '<div class="gt"><span>Total</span><span>' + UI.rp(c.total) + '</span></div></div>' +
        '<button class="btn btn-primary btn-block btn-lg pay-main" data-act="openPay"' + (k.items.length ? '' : ' disabled') + '>' + UI.icon('wallet') + ' Bayar ' + UI.rp(c.total) + '</button><button class="btn btn-ghost btn-block" style="margin-top:8px" data-act="later"' + (k.items.length ? '' : ' disabled') + '>Simpan sebagai belum lunas</button></section></aside></div>' +
        (k.items.length ? '<div class="paybar"><div><small>' + nItems + ' layanan</small><b>' + UI.rp(c.total) + '</b></div><button class="btn btn-primary btn-lg" data-act="openPay">' + UI.icon('wallet') + ' Bayar</button></div>' : '');
    },
    riwayat(all) {
      const months = [...new Set(all.map(x => x.date.slice(0, 7)))].sort().reverse(); const opt = (v, l, cur) => '<option value="' + v + '"' + (cur === v ? ' selected' : '') + '>' + l + '</option>';
      let l = all.sort((a, b) => (b.date + b.createdAt).localeCompare(a.date + a.createdAt));
      if (kq.q) { const q = kq.q.toLowerCase(); l = l.filter(x => (x.code + x.customerName).toLowerCase().includes(q)); }
      if (kq.st) l = l.filter(x => x.payStatus === kq.st); if (kq.m) l = l.filter(x => x.method === kq.m); if (kq.mo) l = l.filter(x => x.date.slice(0, 7) === kq.mo);
      const pg = UI.page(l, kq.p, 12), lp = l.filter(x => x.payStatus === 'lunas');
      return '<div class="card"><div class="card-h"><h3>Riwayat Transaksi</h3><small class="muted">' + UI.num(l.length) + ' transaksi · ' + UI.rp(sum(lp, x => x.total)) + ' lunas</small></div><div class="filters"><label class="grow searchbox">Cari<input class="input" id="kSearch" type="search" placeholder="Kode / nama…" value="' + esc(kq.q) + '" data-in="tq"></label>' +
        '<label>Bulan<select class="input" data-in="fmo">' + opt('', 'Semua', kq.mo) + months.map(m => opt(m, UI.MONTHS_L[+m.slice(5) - 1] + ' ' + m.slice(0, 4), kq.mo)).join('') + '</select></label><label>Status<select class="input" data-in="fst">' + opt('', 'Semua', kq.st) + opt('lunas', 'Lunas', kq.st) + opt('belum', 'Belum lunas', kq.st) + '</select></label><label>Metode<select class="input" data-in="fm">' + opt('', 'Semua', kq.m) + Object.keys(DB.METHOD).map(m => opt(m, DB.METHOD[m], kq.m)).join('') + '</select></label></div>' +
        '<div class="txlist">' + (pg.items.length ? pg.items.map(x => '<article class="txrow"><div class="tx-main"><b>' + esc(x.code) + '</b><span>' + UI.date(x.date) + ' · ' + esc(x.customerName) + '</span><small>' + esc((x.items[0] || {}).name || '') + (x.items.length > 1 ? ' +' + (x.items.length - 1) + ' lainnya' : '') + '</small></div><div class="tx-amt"><b>' + UI.rp(x.total) + '</b><span>' + UI.badge(x.payStatus, DB.PAY[x.payStatus]) + ' <i class="mtag">' + DB.METHOD[x.method] + '</i></span></div><div class="tx-act">' + mb('rc', x.id, 'print', 'Struk', 'btn-primary') + (x.payStatus === 'belum' ? mb('lunas', x.id, 'check', 'Lunasi') : '') + '<button class="icon-btn" data-act="del" data-id="' + x.id + '" aria-label="Hapus ' + esc(x.code) + '">' + UI.icon('trash') + '</button></div></article>').join('') : '<p class="muted" style="padding:20px;text-align:center">Tidak ada transaksi.</p>') + '</div>' + UI.pager(pg) + '</div>';
    },
    inputs: {
      cname(t) { k.cname = t.value; }, promo(t) { k.promo = t.value.trim(); this.ctx.refresh(); }, manual(t) { k.manual = +t.value || 0; this.ctx.refresh(); },
      tq(t) { kq.q = t.value; kq.p = 1; this.ctx.refresh(); }, fst(t) { kq.st = t.value; kq.p = 1; this.ctx.refresh(); }, fm(t) { kq.m = t.value; kq.p = 1; this.ctx.refresh(); }, fmo(t) { kq.mo = t.value; kq.p = 1; this.ctx.refresh(); }
    },
    actions: {
      tab(t) { kq.tab = t.dataset.v; this.ctx.refresh(); }, pickMember() { pickMember(this.ctx); }, pickRes() { pickRes(this.ctx); },
      loadRes(t) { loadRes(DB.get('reservations', t.dataset.id)); this.ctx.refresh(); }, clrRes() { k.resId = ''; this.ctx.refresh(); },
      cat(t) { k.cat = t.dataset.v; this.ctx.refresh(); }, setTh(t) { k.th = t.dataset.v; this.ctx.refresh(); }, tgDisc() { k.dOpen = !(k.dOpen || k.promo || k.manual); if (!k.dOpen) { k.promo = ''; k.manual = 0; } this.ctx.refresh(); },
      addSvc(t) { const s = DB.get('services', t.dataset.id); if (!s) return; const ex = k.items.find(i => i.serviceId === s.id); if (ex) ex.qty = Math.min(20, ex.qty + 1); else k.items.push({ serviceId: s.id, name: s.name, duration: s.duration, price: s.price, qty: 1 }); this.ctx.refresh(); },
      inc(t) { k.items[+t.dataset.i].qty = Math.min(20, k.items[+t.dataset.i].qty + 1); this.ctx.refresh(); }, dec(t) { const i = k.items[+t.dataset.i]; if (i.qty > 1) i.qty--; else k.items.splice(+t.dataset.i, 1); this.ctx.refresh(); },
      reset() { k = K0(); this.ctx.refresh(); }, page(t) { kq.p = +t.dataset.p; this.ctx.refresh(); },
      openPay() { paySheet(this.ctx); },
      async later() { if (!k.items.length) return; if (await UI.confirm({ title: 'Simpan belum lunas', message: 'Simpan transaksi <b>' + UI.rp(calc().total) + '</b> tanpa pembayaran? Anda dapat melunasinya nanti dari Riwayat.', okText: 'Simpan' })) doSave(this.ctx, false); },
      rc(t) { Receipt.preview(DB.get('transactions', t.dataset.id)); }, lunas(t) { payForm(DB.get('transactions', t.dataset.id)); },
      async del(t) { const x = DB.get('transactions', t.dataset.id); if (await UI.confirm({ title: 'Hapus transaksi', message: 'Hapus <b>' + esc(x.code) + '</b>? Poin member (jika ada) akan dikurangi kembali.', okText: 'Hapus', danger: true })) { DB.removeTransaction(x.id, A); UI.toast('Transaksi dihapus.'); } }
    }
  };

  /* ================= LAPORAN ================= */
  const laporan = UI.reportView([{ id: 'pendapatan', label: 'Pendapatan' }, { id: 'layanan', label: 'Layanan' }, { id: 'reservasi', label: 'Reservasi' }, { id: 'member', label: 'Member' }, { id: 'karyawan', label: 'Karyawan' }], 'Laporan');

  /* ================= GALERI ================= */
  const gFields = [{ name: 'title', label: 'Judul foto', required: true, span: 1 }, { name: 'category', label: 'Kategori', type: 'select', options: ['Interior', 'Ruang Reflexology', 'Resepsionis', 'Suasana', 'Fasilitas', 'Pelayanan'], span: 1 }, { name: 'url', label: 'Foto', type: 'image', required: true }];
  function gForm(g) { UI.form({ title: g ? 'Edit Foto' : 'Tambah Foto Galeri', fields: gFields, values: g || {}, onSubmit(v) { if (!v.url) return 'Foto wajib diisi (unggah atau tempel URL).'; if (g) DB.update('gallery', g.id, v); else DB.insert('gallery', v); UI.toast('Galeri disimpan.'); return true; } }); }
  const galeri = {
    render() { const l = DB.all('gallery'); return '<div class="page-head"><div><h2>Galeri</h2><p class="muted">Foto yang tampil di website. Ganti foto contoh dengan foto asli tempat Anda.</p></div><button class="btn btn-primary" data-act="add">' + UI.icon('plus') + ' Tambah Foto</button></div>' + (l.length ? '<div class="mgrid">' + l.map(g => '<div class="mcell"><div class="ph">' + UI.img(g.url, g.title) + '</div><div class="bd"><b>' + esc(g.title) + '</b><small class="muted">' + esc(g.category) + '</small></div><div class="ft"><span></span><div class="mini-btns">' + mb('edit', g.id, 'edit', 'Edit') + mb('del', g.id, 'trash', 'Hapus') + '</div></div></div>').join('') + '</div>' : '<div class="card">' + UI.empty('Galeri kosong.', 'image') + '</div>'); },
    actions: { add() { gForm(null); }, edit(t) { gForm(DB.get('gallery', t.dataset.id)); }, async del(t) { if (await UI.confirm({ title: 'Hapus foto', message: 'Hapus foto ini dari galeri?', okText: 'Hapus', danger: true })) { DB.remove('gallery', t.dataset.id); UI.toast('Foto dihapus.'); } } }
  };


  /* ================= DIAGNOSTIK & UJI BEBAN ================= */
  function diagnose() {
    const out = [], add = (lv, t, d) => out.push({ lv, t, d }); const P = performance.now.bind(performance);
    let t0 = P(); const raw = localStorage.getItem('kp_transactions') || '[]'; const parsed = JSON.parse(raw); const parseMs = P() - t0;
    const tx = parsed, res = DB.all('reservations'), mem = DB.all('members'), nt = DB.all('notifications');
    let bytes = 0; for (let i = 0; i < localStorage.length; i++) { const key = localStorage.key(i); if (key.indexOf('kp_') === 0) bytes += (key.length + localStorage.getItem(key).length) * 2; }
    const pct = bytes / (5 * 1024 * 1024) * 100; add(pct > 80 ? 'bad' : pct > 50 ? 'warn' : 'ok', 'Penyimpanan browser', (bytes / 1024).toFixed(0) + ' KB terpakai (±' + pct.toFixed(1) + '% dari kuota 5 MB). Foto yang diunggah paling banyak memakan ruang.');
    t0 = P(); UI.Reports.compute('pendapatan', 'bulanan', DB.today()); const repMs = P() - t0;
    t0 = P(); const h = dashboard.render().length; const dashMs = P() - t0;
    t0 = P(); DB.all('members').forEach(m => DB.memberStats(m.id)); const memMs = P() - t0;
    const lvl = ms => ms > 400 ? 'bad' : ms > 120 ? 'warn' : 'ok';
    add(lvl(parseMs * 3), 'Baca ' + UI.num(tx.length) + ' transaksi', parseMs.toFixed(1) + ' ms (parse JSON). Hasil parse di-cache sehingga pembacaan berikutnya hampir 0 ms.');
    add(lvl(repMs), 'Hitung laporan bulanan', repMs.toFixed(1) + ' ms'); add(lvl(dashMs), 'Render dashboard', dashMs.toFixed(1) + ' ms (' + UI.num(h) + ' karakter HTML)'); add(lvl(memMs), 'Statistik ' + mem.length + ' member', memMs.toFixed(1) + ' ms');
    const dupe = (arr, f) => { const seen = new Set(), d = new Set(); arr.forEach(x => { const c = f(x); if (seen.has(c)) d.add(c); seen.add(c); }); return [...d]; };
    const dt = dupe(tx, t => t.code), dr = dupe(res, r => r.code); add(dt.length ? 'bad' : 'ok', 'Kode transaksi unik', dt.length ? dt.length + ' kode ganda: ' + dt.slice(0, 5).join(', ') : 'Tidak ada duplikat.'); add(dr.length ? 'bad' : 'ok', 'Kode reservasi unik', dr.length ? dr.length + ' kode ganda: ' + dr.slice(0, 5).join(', ') : 'Tidak ada duplikat.');
    const calcBad = tx.filter(t => t.total !== t.subtotal - (t.discount || 0) || t.subtotal !== (t.items || []).reduce((a, i) => a + i.price * i.qty, 0)); add(calcBad.length ? 'bad' : 'ok', 'Konsistensi total transaksi', calcBad.length ? calcBad.length + ' transaksi totalnya tidak cocok dengan item/diskon: ' + calcBad.slice(0, 3).map(t => t.code).join(', ') : 'Subtotal − diskon = total pada semua transaksi.');
    const payBad = tx.filter(t => t.payStatus === 'lunas' && (t.paidAmount == null || t.paidAmount < t.total)); add(payBad.length ? 'warn' : 'ok', 'Data pembayaran lunas', payBad.length ? payBad.length + ' transaksi lunas tanpa catatan uang diterima / kurang (data lama sebelum fitur pembayaran): ' + payBad.slice(0, 3).map(t => t.code).join(', ') : 'Semua transaksi lunas punya catatan pembayaran.');
    const orphan = tx.filter(t => t.memberId && !mem.some(m => m.id === t.memberId)); add(orphan.length ? 'warn' : 'ok', 'Transaksi tanpa member', orphan.length ? orphan.length + ' transaksi merujuk member yang sudah dihapus (riwayat tetap aman).' : 'Semua rujukan member valid.');
    const ptsBad = mem.filter(m => (m.pointsHistory || []).reduce((a, x) => a + x.points, 0) !== m.points); add(ptsBad.length ? 'warn' : 'ok', 'Saldo poin member', ptsBad.length ? ptsBad.length + ' member saldo poin ≠ jumlah riwayat: ' + ptsBad.slice(0, 3).map(m => m.number).join(', ') : 'Saldo poin cocok dengan riwayat.');
    const key = {}; let dbl = 0; res.filter(r => r.status !== 'cancelled' && r.therapistId).forEach(r => { const g = r.date + '|' + r.therapistId; (key[g] = key[g] || []).push(r); }); Object.values(key).forEach(a => { a.sort((x, y) => x.time.localeCompare(y.time)); for (let i = 1; i < a.length; i++) if (DB.toMin(a[i].time) < DB.toMin(a[i - 1].time) + (a[i - 1].duration || 60)) dbl++; });
    add(dbl ? 'bad' : 'ok', 'Jadwal terapis bentrok', dbl ? dbl + ' pasangan reservasi bentrok pada terapis yang sama.' : 'Tidak ada terapis dipesan ganda.');
    const t = DB.today(), stale = res.filter(r => r.date < t && ['pending', 'confirmed', 'serving'].includes(r.status)); add(stale.length ? 'warn' : 'ok', 'Reservasi lewat tanggal belum diselesaikan', stale.length ? stale.length + ' reservasi tanggal lampau masih berstatus aktif.' : 'Tidak ada.');
    const old = tx.filter(x => x.payStatus === 'belum' && x.date <= DB.addDays(t, -3)); add(old.length ? 'warn' : 'ok', 'Tagihan belum lunas > 3 hari', old.length ? old.length + ' transaksi, total ' + UI.rp(sum(old, x => x.total)) : 'Tidak ada.');
    const pb = tx.filter(x => x.payStatus === 'belum' && x.pointsAwarded); add(pb.length ? 'bad' : 'ok', 'Poin pada transaksi belum lunas', pb.length ? pb.length + ' transaksi belum lunas sudah memberi poin.' : 'Poin hanya diberikan setelah lunas.');
    add(nt.length > 300 ? 'warn' : 'ok', 'Jumlah notifikasi', UI.num(nt.length) + ' tersimpan (panel menampilkan 25 terbaru).');
    return out;
  }
  function diagHtml() {
    const r = diagnose(), c = { ok: r.filter(x => x.lv === 'ok').length, warn: r.filter(x => x.lv === 'warn').length, bad: r.filter(x => x.lv === 'bad').length }; const tx = DB.all('transactions'), lt = tx.filter(x => x.load).length;
    return '<div class="card-h"><h3>Diagnostik &amp; Uji Performa</h3><div class="row"><button class="btn btn-ghost btn-sm" data-act="copyDiag">' + UI.icon('copy') + ' Salin laporan</button><button class="btn btn-primary btn-sm" data-act="diag">' + UI.icon('refresh') + ' Jalankan ulang</button></div></div>' +
      '<div class="stats"><div class="stat mini"><div><small>Lolos</small><strong>' + c.ok + '</strong></div></div><div class="stat mini warn"><div><small>Perlu dicek</small><strong>' + c.warn + '</strong></div></div><div class="stat mini"><div><small>Masalah</small><strong style="color:var(--bad)">' + c.bad + '</strong></div></div><div class="stat mini info"><div><small>Data</small><strong>' + UI.num(tx.length) + ' trx</strong></div></div></div>' +
      '<div class="diag">' + r.map(x => '<div class="diag-i"><span class="badge b-' + (x.lv === 'ok' ? 'ok' : x.lv === 'warn' ? 'pending' : 'bad') + '">' + (x.lv === 'ok' ? 'OK' : x.lv === 'warn' ? 'CEK' : 'BUG') + '</span><div><b>' + UI.esc(x.t) + '</b><small>' + UI.esc(x.d) + '</small></div></div>').join('') + '</div>' +
      '<div class="card" style="margin:16px 0 0"><h3>Uji beban</h3><p class="muted" style="margin:6px 0 12px">Tambahkan 200 transaksi tambahan (ditandai uji beban) untuk melihat apakah dashboard, kasir, dan laporan masih lancar. Dapat dihapus kapan saja. Saat ini: <b>' + lt + '</b> transaksi uji.</p><div class="row"><button class="btn btn-bronze btn-sm" data-act="load">' + UI.icon('plus') + ' Tambah 200 transaksi uji</button><button class="btn btn-ghost btn-sm" data-act="unload"' + (lt ? '' : ' disabled') + '>' + UI.icon('trash') + ' Hapus data uji</button></div></div>';
  }
  function loadTest(n) {
    const svcs = DB.all('services'), th = DB.all('therapists'), list = DB.all('transactions'), t = DB.today(), used = new Set(list.map(x => x.code)), M = ['tunai', 'qris', 'transfer'], extra = []; let seq = list.filter(x => x.load).length;
    for (let i = 0; i < n; i++) {
      const d = DB.addDays(t, -Math.floor(Math.random() * 60)), s = svcs[Math.floor(Math.random() * svcs.length)], m = M[Math.floor(Math.random() * 3)]; let code; do { seq++; code = 'LOAD' + d.replace(/-/g, '') + '-' + DB.pad(seq, 4); } while (used.has(code)); used.add(code);
      const o = { id: 'trx_load_' + code, code, date: d, memberId: null, customerName: 'Uji Beban ' + seq, items: [{ serviceId: s.id, name: s.name, duration: s.duration, price: s.price, qty: 1 }], subtotal: s.price, discount: 0, promoCode: '', total: s.price, method: m, payStatus: 'lunas', therapistId: th.length ? th[i % th.length].id : '', reservationId: '', pointsAwarded: false, cashier: 'Uji Beban', createdAt: d + 'T' + DB.pad(10 + Math.floor(Math.random() * 11)) + ':' + DB.pad(Math.floor(Math.random() * 60)) + ':00', load: true, paidAmount: s.price, change: 0, paidAt: d + 'T12:00:00' }; if (m !== 'tunai') o.payRef = 'LD' + seq; extra.push(o);
    }
    DB.write('transactions', list.concat(extra)); window.dispatchEvent(new CustomEvent('kp:change', { detail: { col: 'transactions' } }));
  }

  /* ================= PENGATURAN ================= */
  const sTab = { t: 'identitas' };
  const SF = {
    identitas: [{ name: 'businessName', label: 'Nama bisnis', required: true }, { name: 'tagline', label: 'Tagline' }, { name: 'logo', label: 'Logo (kosongkan untuk logo bawaan)', type: 'image' }, { name: 'address', label: 'Alamat', type: 'textarea' }, { name: 'mapsUrl', label: 'Link Google Maps', type: 'url' }, { name: 'phone', label: 'Nomor telepon', type: 'tel', span: 1 }, { name: 'whatsapp', label: 'Nomor WhatsApp (mis. 0812…)', type: 'tel', span: 1 }, { name: 'instagram', label: 'Link Instagram', type: 'url', span: 1 }, { name: 'facebook', label: 'Link Facebook', type: 'url', span: 1 }],
    operasional: [{ name: 'openTime', label: 'Jam buka', type: 'time', required: true, span: 1 }, { name: 'closeTime', label: 'Jam tutup', type: 'time', required: true, span: 1 }, { name: 'slotMinutes', label: 'Interval slot reservasi (menit)', type: 'number', min: 15, max: 240, span: 1 }, { name: 'cancelHours', label: 'Batas pembatalan (jam sebelum jadwal)', type: 'number', min: 0, span: 1 }, { name: 'pointRate', label: '1 poin setiap belanja (Rp)', type: 'number', min: 1000, span: 1 }, { name: 'rating', label: 'Rating Google', span: 1 }, { name: 'reviews', label: 'Jumlah ulasan Google', type: 'number', min: 0, span: 1 }],
    pembayaran: [{ name: 'bankName', label: 'Nama bank', span: 1 }, { name: 'bankAccount', label: 'Nomor rekening', span: 1 }, { name: 'bankHolder', label: 'Atas nama', span: 2 }, { name: 'qrisImage', label: 'Gambar QRIS (unggah atau URL)', type: 'image' }, { name: 'receiptNote', label: 'Pesan penutup di struk', type: 'textarea' }],
    konten: [{ name: 'heroTitle', label: 'Judul utama beranda (koma memisahkan baris hijau)', required: true }, { name: 'heroText', label: 'Deskripsi beranda', type: 'textarea' }, { name: 'heroImage', label: 'Foto hero', type: 'image' }, { name: 'about', label: 'Teks Tentang Kami', type: 'textarea', rows: 5 }, { name: 'theme', label: 'Tema bawaan pengunjung baru', type: 'select', options: [{ value: 'light', label: 'Terang' }, { value: 'dark', label: 'Gelap' }] }]
  };
  const settings = {
    render() {
      const T = [['identitas', 'Identitas'], ['operasional', 'Operasional'], ['konten', 'Konten Beranda'], ['pembayaran', 'Pembayaran'], ['staf', 'Akun Staf'], ['data', 'Data & Backup'], ['diagnostik', 'Diagnostik & Uji'], ['log', 'Log Aktivitas']];
      let body = '';
      if (SF[sTab.t]) body = '<form id="sForm" class="form-grid" novalidate>' + UI.fields(SF[sTab.t], DB.settings()) + '<div class="form-err" data-formerr></div><div class="field span-2"><button class="btn btn-primary" type="submit">Simpan Pengaturan</button></div></form>';
      else if (sTab.t === 'diagnostik') body = diagHtml();
      else if (sTab.t === 'staf') body = '<div class="card-h"><h3>Akun Admin &amp; Supervisor</h3><button class="btn btn-primary btn-sm" data-act="addStaff">' + UI.icon('plus') + ' Tambah Akun</button></div>' + UI.table([{ label: 'Nama', render: u => esc(u.name) }, { label: 'Email', render: u => esc(u.email) }, { label: 'Role', render: u => Auth.ROLE_LABEL[u.role] }, { label: 'Status', render: u => UI.badge(u.active ? 'active' : 'inactive', u.active ? 'Aktif' : 'Nonaktif') }, { label: '', cls: 'act', render: u => '<div class="mini-btns">' + mb('pw', u.id, 'shield', 'Reset PW') + (u.id !== user.id ? mb('toggle', u.id, 'x', u.active ? 'Nonaktifkan' : 'Aktifkan') + mb('delStaff', u.id, 'trash', 'Hapus') : '<small class="muted">Akun Anda</small>') + '</div>' }], DB.all('users').filter(u => u.role !== 'member'));
      else if (sTab.t === 'data') body = '<div class="cols"><div class="card"><h3>Backup &amp; Restore (JSON)</h3><p class="muted" style="margin:8px 0 14px">Data tersimpan di browser perangkat ini. Lakukan backup rutin dan simpan filenya.</p><div class="row"><button class="btn btn-primary" data-act="backup">' + UI.icon('download') + ' Unduh Backup</button><label class="btn btn-ghost">' + UI.icon('upload') + ' Restore<input type="file" id="rFile" accept="application/json,.json" hidden></label></div></div><div class="card danger-zone"><h3>Reset Data Demo</h3><p class="muted" style="margin:8px 0 14px">Menghapus semua data dan mengembalikan data contoh. Tidak dapat dibatalkan — backup dulu.</p><button class="btn btn-danger" data-act="reset">' + UI.icon('refresh') + ' Reset Data Demo</button></div></div>';
      else body = '<div class="card-h"><h3>50 Aktivitas Terakhir</h3></div>' + UI.table([{ label: 'Waktu', render: l => new Date(l.createdAt).toLocaleString('id-ID') }, { label: 'Oleh', render: l => esc(l.by) }, { label: 'Aktivitas', render: l => esc(l.text) }], DB.all('activityLogs').sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 50));
      return '<div class="page-head"><div><h2>Pengaturan Website</h2></div></div><div class="tabs set-tabs">' + T.map(x => '<button class="tab' + (sTab.t === x[0] ? ' on' : '') + '" data-act="tab" data-id="' + x[0] + '">' + x[1] + '</button>').join('') + '</div><div class="card">' + body + '</div>';
    },
    mount(el) {
      const f = UI.$('#sForm', el);
      if (f) { UI.bindFields(f); f.onsubmit = e => { e.preventDefault(); const v = UI.collect(f, SF[sTab.t]); if (!v) return; if (v.closeTime && v.openTime && v.closeTime <= v.openTime) { UI.$('[data-formerr]', f).textContent = 'Jam tutup harus setelah jam buka.'; return; } DB.saveSettings(v); DB.log('Pengaturan ' + sTab.t + ' disimpan', A); UI.toast('Pengaturan disimpan.'); }; }
      const rf = UI.$('#rFile', el);
      if (rf) rf.onchange = async () => { const file = rf.files[0]; if (!file) return; if (!(await UI.confirm({ title: 'Restore data', message: 'Semua data saat ini akan diganti dengan isi file <b>' + esc(file.name) + '</b>. Lanjutkan?', okText: 'Restore', danger: true }))) { rf.value = ''; return; } const r = DB.restore(await file.text()); if (!r.ok) UI.toast(r.error, 'err'); else UI.toast('Data berhasil dipulihkan.'); rf.value = ''; };
    },
    actions: {
      tab(t) { sTab.t = t.dataset.id; this.ctx.refresh(); }, backup() { UI.download('kayuputih-backup-' + DB.today() + '.json', DB.backup(), 'application/json'); UI.toast('Backup diunduh.'); },
      async reset() { if (await UI.confirm({ title: 'Reset data demo', message: 'Yakin hapus <b>semua data</b> dan kembalikan ke data demo?', okText: 'Ya, reset', danger: true })) { DB.reset(); UI.toast('Data demo dikembalikan.'); } },
      diag() { this.ctx.refresh(); UI.toast('Diagnostik dijalankan ulang.', 'info'); },
      load() { loadTest(200); UI.toast('200 transaksi uji beban ditambahkan.'); },
      unload() { const n = DB.all('transactions').filter(t => t.load).length; DB.write('transactions', DB.all('transactions').filter(t => !t.load)); window.dispatchEvent(new CustomEvent('kp:change', { detail: { col: 'transactions' } })); UI.toast(n + ' transaksi uji beban dihapus.'); },
      copyDiag() { const t = diagnose().map(r => '[' + r.lv.toUpperCase() + '] ' + r.t + ' — ' + r.d).join('\n'); (navigator.clipboard ? navigator.clipboard.writeText(t) : Promise.reject()).then(() => UI.toast('Laporan disalin.'), () => UI.toast('Gagal menyalin.', 'err')); },
      addStaff() {
        UI.form({ title: 'Tambah Akun Staf', fields: [{ name: 'name', label: 'Nama', required: true }, { name: 'email', label: 'Email', type: 'email', required: true, span: 1 }, { name: 'role', label: 'Role', type: 'select', options: [{ value: 'supervisor', label: 'Supervisor' }, { value: 'admin', label: 'Admin' }], span: 1 }, { name: 'password', label: 'Password', type: 'password', required: true, hint: 'Min. 8 karakter, huruf dan angka' }], onSubmit(v) { const e = v.email.toLowerCase(); if (DB.all('users').some(u => u.email === e)) return 'Email sudah terdaftar.'; const pe = Auth.validatePassword(v.password); if (pe) return pe; DB.insert('users', { name: v.name, email: e, role: v.role, passHash: DB.hash(v.password), active: true }); DB.log('Akun ' + v.role + ' ' + e + ' dibuat', A); UI.toast('Akun dibuat.'); return true; } });
      },
      pw(t) { const u = DB.get('users', t.dataset.id); UI.form({ title: 'Reset Password ' + u.name, fields: [{ name: 'password', label: 'Password baru', type: 'password', required: true, hint: 'Min. 8 karakter, huruf dan angka' }], onSubmit(v) { const pe = Auth.validatePassword(v.password); if (pe) return pe; DB.update('users', u.id, { passHash: DB.hash(v.password) }); DB.log('Password ' + u.email + ' direset', A); UI.toast('Password diganti.'); return true; } }); },
      toggle(t) { const u = DB.get('users', t.dataset.id); DB.update('users', u.id, { active: !u.active }); UI.toast('Status akun diubah.'); },
      async delStaff(t) { const u = DB.get('users', t.dataset.id); if (DB.all('users').filter(x => x.role === 'admin').length <= 1 && u.role === 'admin') return UI.toast('Minimal harus ada satu Admin.', 'err'); if (await UI.confirm({ title: 'Hapus akun', message: 'Hapus akun <b>' + esc(u.email) + '</b>?', okText: 'Hapus', danger: true })) { DB.remove('users', u.id); UI.toast('Akun dihapus.'); } }
    }
  };

  UI.shell({
    role: 'admin', roleLabel: 'Administrator', user,
    menu: [{ id: 'dashboard', label: 'Dashboard', short: 'Beranda', icon: 'home' }, { id: 'reservasi', label: 'Reservasi', icon: 'calendar' }, { id: 'kasir', label: 'Kasir', icon: 'receipt' }, { id: 'member', label: 'Member', icon: 'users' }, { id: 'layanan', label: 'Layanan', icon: 'leaf' }, { id: 'promo', label: 'Promo', icon: 'tag' }, { id: 'terapis', label: 'Terapis', icon: 'user' }, { id: 'laporan', label: 'Laporan', icon: 'chart' }, { id: 'galeri', label: 'Galeri', icon: 'image' }, { id: 'pengaturan', label: 'Pengaturan', icon: 'gear' }],
    views: { dashboard, reservasi, kasir, member, layanan, promo, terapis, laporan, galeri, pengaturan: settings }
  });
})();
