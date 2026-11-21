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

  /* ================= KASIR ================= */
  const K0 = () => ({ memberId: '', cname: '', items: [], promo: '', manual: 0, method: 'tunai', pay: 'lunas', th: '', resId: '', selSvc: '', qty: 1, cash: '', bank: '', ref: '' });
  let k = K0(); const kq = { q: '', p: 1, st: '', m: '', mo: '' };
  const PMI = { tunai: 'cash', transfer: 'bank', qris: 'qr' };
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
    const s = DB.settings(), esc = UI.esc;
    if (k.method === 'tunai') {
      const q = [c.total].concat([20000, 50000, 100000, 150000, 200000].filter(v => v > c.total)).slice(0, 4);
      return '<div class="pm-box"><label for="kCash">Uang diterima (Rp)</label><input class="input" id="kCash" type="number" inputmode="numeric" min="0" data-in="cash" value="' + esc(k.cash) + '" placeholder="' + c.total + '"><div class="qchips">' + q.map((v, i) => '<button type="button" class="chip" data-act="quick" data-v="' + v + '">' + (i ? UI.rp(v) : 'Uang pas') + '</button>').join('') + '</div><div class="change ' + (c.change >= 0 ? 'ok' : 'bad') + '"><span>' + (c.change >= 0 ? 'Kembalian' : 'Kurang') + '</span><b>' + UI.rp(Math.abs(c.change)) + '</b></div></div>';
    }
    if (k.method === 'transfer') {
      const has = s.bankAccount;
      return '<div class="pm-box">' + (has ? '<div class="bankcard"><small>' + esc(s.bankName || 'Bank') + '</small><b>' + esc(s.bankAccount) + '</b><span>a.n. ' + esc(s.bankHolder || s.businessName) + '</span><button type="button" class="btn btn-ghost btn-sm" data-act="copyAcc">' + UI.icon('copy') + ' Salin rekening</button></div>' : '<div class="notice-warn">Rekening belum diatur. Isi di <a href="#/pengaturan">Pengaturan → Pembayaran</a>.</div>') +
        '<div class="two-f"><div class="field"><label for="kBank">Bank pengirim</label><input class="input" id="kBank" data-in="bank" value="' + esc(k.bank) + '" placeholder="mis. BCA"></div><div class="field"><label for="kRef">No. referensi / nama pengirim</label><input class="input" id="kRef" data-in="ref" value="' + esc(k.ref) + '" placeholder="Opsional"></div></div><small class="muted">Cocokkan nominal <b>' + UI.rp(c.total) + '</b> dengan mutasi/bukti transfer sebelum menekan tombol bayar.</small></div>';
    }
    return '<div class="pm-box qrbox">' + (s.qrisImage ? '<button type="button" class="qr-wrap" data-act="qrBig" title="Perbesar QRIS"><img class="qr-img" src="' + esc(s.qrisImage) + '" alt="QRIS pembayaran"></button>' : '<div class="notice-warn">Gambar QRIS belum diatur (Pengaturan → Pembayaran).</div>') +
      '<div><b class="qr-amt">' + UI.rp(c.total) + '</b><small class="muted">Minta pelanggan memindai QRIS dan memasukkan nominal ini. Tekan tombol bayar setelah notifikasi dana masuk.</small></div><div class="field" style="width:100%"><label for="kRef">No. referensi (opsional)</label><input class="input" id="kRef" data-in="ref" value="' + esc(k.ref) + '" placeholder="Dari notifikasi bank/e-wallet"></div></div>';
  }
  const kasir = {
    render() {
      const c = calc(), svcs = DB.all('services').filter(s => s.active); if (!k.selSvc && svcs[0]) k.selSvc = svcs[0].id;
      const open = DB.all('reservations').filter(r => ['pending', 'confirmed', 'serving'].includes(r.status)).sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time)).slice(0, 60);
      const opt = (arr, val) => arr.map(x => '<option value="' + esc(x.value) + '"' + (String(x.value) === String(val) ? ' selected' : '') + '>' + esc(x.label) + '</option>').join('');
      const all = DB.all('transactions'); const months = [...new Set(all.map(t => t.date.slice(0, 7)))].sort().reverse();
      let l = all.sort((a, b) => (b.date + b.createdAt).localeCompare(a.date + a.createdAt));
      if (kq.q) { const q = kq.q.toLowerCase(); l = l.filter(t => (t.code + t.customerName).toLowerCase().includes(q)); }
      if (kq.st) l = l.filter(t => t.payStatus === kq.st); if (kq.m) l = l.filter(t => t.method === kq.m); if (kq.mo) l = l.filter(t => t.date.slice(0, 7) === kq.mo);
      const pg = UI.page(l, kq.p, 10), lp = l.filter(t => t.payStatus === 'lunas');
      const lunasOk = k.pay === 'lunas', canPay = k.items.length && (!lunasOk || k.method !== 'tunai' || c.change >= 0);
      return '<div class="page-head"><div><h2>Kasir &amp; Transaksi</h2><p class="muted">Terima pembayaran tunai, transfer, atau QRIS lalu cetak / unduh struk.</p></div></div><div class="pos"><div class="card"><div class="card-h"><h3>Transaksi Baru</h3></div><div class="form-grid">' +
        '<div class="field span-2"><label>Dari reservasi (opsional)</label><select class="input" data-in="res"><option value="">— Tanpa reservasi —</option>' + open.map(r => '<option value="' + r.id + '"' + (k.resId === r.id ? ' selected' : '') + '>' + esc(r.code + ' · ' + r.customerName + ' · ' + r.serviceName + ' · ' + r.time) + '</option>').join('') + '</select></div>' +
        '<div class="field span-1"><label>Pelanggan</label><select class="input" data-in="member">' + opt(memberOpts('Pelanggan umum'), k.memberId) + '</select></div><div class="field span-1"><label for="kName">Nama (pelanggan umum)</label><input class="input" id="kName" data-in="cname" value="' + esc(k.cname) + '"' + (k.memberId ? ' disabled' : '') + ' placeholder="Opsional"></div></div>' +
        '<div class="add-row"><div class="field"><label>Layanan</label><select class="input" data-in="selSvc">' + opt(svcs.map(s => ({ value: s.id, label: s.name + ' · ' + UI.rp(s.price) })), k.selSvc) + '</select></div><div class="field"><label for="kQty">Jml</label><input class="input" id="kQty" type="number" min="1" max="20" value="' + k.qty + '" data-in="qty"></div><button class="btn btn-bronze" data-act="addItem">' + UI.icon('plus') + ' Tambah</button></div>' +
        '<div style="margin-top:12px">' + (k.items.length ? k.items.map((i, ix) => '<div class="line"><div><b>' + esc(i.name) + '</b><br><small>' + UI.rp(i.price) + ' · ' + i.duration + ' mnt</small></div><span class="qty"><button data-act="dec" data-i="' + ix + '" aria-label="Kurangi">−</button><b>' + i.qty + '</b><button data-act="inc" data-i="' + ix + '" aria-label="Tambah">+</button></span><b>' + UI.rp(i.price * i.qty) + '</b><button class="icon-btn" data-act="rm" data-i="' + ix + '" aria-label="Hapus">' + UI.icon('trash') + '</button></div>').join('') : '<p class="muted" style="padding:14px 0">Belum ada layanan dipilih.</p>') + '</div></div>' +
        '<div class="card pos-r"><div class="card-h"><h3>Pembayaran</h3></div><div class="form-grid"><div class="field span-1"><label for="kPromo">Kode promo / voucher</label><input class="input" id="kPromo" data-in="promo" value="' + esc(k.promo) + '" placeholder="mis. HARIINI">' + (k.promo && c.pr ? '<small style="color:' + (c.pr.ok ? 'var(--ok)' : 'var(--bad)') + '">' + (c.pr.ok ? '✓ ' + esc(c.pr.promo.title) + ' −' + UI.rp(c.pr.discount) : esc(c.pr.error)) + '</small>' : '') + '</div>' +
        '<div class="field span-1"><label for="kManual">Diskon manual (Rp)</label><input class="input" id="kManual" type="number" min="0" data-in="manual" value="' + (k.manual || '') + '"></div><div class="field span-2"><label>Terapis</label><select class="input" data-in="th">' + opt(thOpts(), k.th) + '</select></div></div>' +
        '<div class="totals"><div><span>Subtotal</span><span>' + UI.rp(c.subtotal) + '</span></div><div><span>Diskon</span><span>-' + UI.rp(c.discount) + '</span></div><div class="gt"><span>Total</span><span>' + UI.rp(c.total) + '</span></div></div>' +
        '<div class="paym" role="radiogroup" aria-label="Metode pembayaran">' + Object.keys(DB.METHOD).map(m => '<button type="button" class="pm' + (k.method === m ? ' on' : '') + '" role="radio" aria-checked="' + (k.method === m) + '" data-act="method" data-v="' + m + '">' + UI.icon(PMI[m]) + '<b>' + DB.METHOD[m] + '</b></button>').join('') + '</div>' + (lunasOk ? payPanel(c) : '<div class="pm-box"><small class="muted">Transaksi disimpan sebagai <b>belum lunas</b>. Lunasi nanti dari daftar transaksi.</small></div>') +
        '<label class="chk later"><input type="checkbox" data-in="later"' + (lunasOk ? '' : ' checked') + '> Bayar nanti (simpan belum lunas)</label>' +
        '<button class="btn btn-primary btn-block btn-lg" data-act="save"' + (canPay ? '' : ' disabled') + '>' + UI.icon(lunasOk ? 'receipt' : 'check') + (lunasOk ? ' Terima ' + UI.rp(c.total) + ' &amp; Cetak Struk' : ' Simpan Belum Lunas') + '</button><button class="btn btn-ghost btn-block" style="margin-top:8px" data-act="reset">Kosongkan</button></div></div>' +
        '<div class="card" style="margin-top:18px"><div class="card-h"><h3>Daftar Transaksi</h3><small class="muted">' + UI.num(l.length) + ' transaksi · ' + UI.rp(sum(lp, t => t.total)) + ' (lunas)</small></div><div class="filters"><label class="grow searchbox">Cari<input class="input" id="kSearch" placeholder="Kode / nama…" value="' + esc(kq.q) + '" data-in="tq"></label>' +
        '<label>Bulan<select class="input" data-in="fmo"><option value="">Semua</option>' + months.map(m => '<option value="' + m + '"' + (kq.mo === m ? ' selected' : '') + '>' + UI.MONTHS_L[+m.slice(5) - 1] + ' ' + m.slice(0, 4) + '</option>').join('') + '</select></label><label>Status<select class="input" data-in="fst"><option value="">Semua</option><option value="lunas"' + (kq.st === 'lunas' ? ' selected' : '') + '>Lunas</option><option value="belum"' + (kq.st === 'belum' ? ' selected' : '') + '>Belum lunas</option></select></label><label>Metode<select class="input" data-in="fm"><option value="">Semua</option>' + Object.keys(DB.METHOD).map(m => '<option value="' + m + '"' + (kq.m === m ? ' selected' : '') + '>' + DB.METHOD[m] + '</option>').join('') + '</select></label></div>' +
        UI.table([{ label: 'Kode', render: t => '<b>' + esc(t.code) + '</b>' }, { label: 'Tanggal', render: t => UI.date(t.date) }, { label: 'Pelanggan', render: t => esc(t.customerName) }, { label: 'Total', cls: 'r', render: t => UI.rp(t.total) }, { label: 'Metode', render: t => DB.METHOD[t.method] }, { label: 'Status', render: t => UI.badge(t.payStatus, DB.PAY[t.payStatus]) },
          { label: '', cls: 'act', render: t => '<div class="mini-btns">' + mb('rc', t.id, 'print', 'Struk') + (t.payStatus === 'belum' ? mb('lunas', t.id, 'check', 'Lunasi') : '') + mb('del', t.id, 'trash', 'Hapus') + '</div>' }], pg.items, { empty: 'Tidak ada transaksi.' }) + UI.pager(pg) + '</div>';
    },
    inputs: {
      res(t) { k.resId = t.value; const r = t.value ? DB.get('reservations', t.value) : null; if (r) { const s = DB.get('services', r.serviceId); k.items = s ? [{ serviceId: s.id, name: s.name, duration: s.duration, price: s.price, qty: 1 }] : []; k.memberId = r.memberId || ''; k.cname = r.memberId ? '' : r.customerName; k.th = r.therapistId || ''; } this.ctx.refresh(); },
      member(t) { k.memberId = t.value; this.ctx.refresh(); }, cname(t) { k.cname = t.value; }, selSvc(t) { k.selSvc = t.value; }, qty(t) { k.qty = Math.max(1, Math.min(20, +t.value || 1)); },
      promo(t) { k.promo = t.value.trim(); this.ctx.refresh(); }, manual(t) { k.manual = +t.value || 0; this.ctx.refresh(); }, th(t) { k.th = t.value; },
      cash(t) { k.cash = t.value; this.ctx.refresh(); }, bank(t) { k.bank = t.value; }, ref(t) { k.ref = t.value; }, later(t) { k.pay = t.checked ? 'belum' : 'lunas'; this.ctx.refresh(); },
      tq(t) { kq.q = t.value; kq.p = 1; this.ctx.refresh(); }, fst(t) { kq.st = t.value; kq.p = 1; this.ctx.refresh(); }, fm(t) { kq.m = t.value; kq.p = 1; this.ctx.refresh(); }, fmo(t) { kq.mo = t.value; kq.p = 1; this.ctx.refresh(); }
    },
    actions: {
      addItem() { const s = DB.get('services', k.selSvc); if (!s) return UI.toast('Pilih layanan.', 'err'); const ex = k.items.find(i => i.serviceId === s.id); if (ex) ex.qty += k.qty; else k.items.push({ serviceId: s.id, name: s.name, duration: s.duration, price: s.price, qty: k.qty }); k.qty = 1; this.ctx.refresh(); },
      inc(t) { k.items[+t.dataset.i].qty++; this.ctx.refresh(); }, dec(t) { const i = k.items[+t.dataset.i]; if (i.qty > 1) i.qty--; else k.items.splice(+t.dataset.i, 1); this.ctx.refresh(); }, rm(t) { k.items.splice(+t.dataset.i, 1); this.ctx.refresh(); },
      reset() { k = K0(); this.ctx.refresh(); }, page(t) { kq.p = +t.dataset.p; this.ctx.refresh(); },
      method(t) { k.method = t.dataset.v; k.cash = ''; this.ctx.refresh(); }, quick(t) { k.cash = String(t.dataset.v); this.ctx.refresh(); },
      copyAcc() { const a = DB.settings().bankAccount; (navigator.clipboard ? navigator.clipboard.writeText(a) : Promise.reject()).then(() => UI.toast('Nomor rekening disalin.'), () => UI.toast('Rekening: ' + a, 'info')); },
      qrBig() { const c = calc(); UI.modal({ title: 'Scan QRIS · ' + UI.rp(c.total), size: 'md', body: '<div class="qr-big"><img src="' + UI.esc(DB.settings().qrisImage) + '" alt="QRIS"><p class="muted">Pelanggan memindai kode ini, lalu memasukkan nominal <b>' + UI.rp(c.total) + '</b>.</p></div>' }); },
      save() {
        const c = calc(); if (k.promo && c.pr && !c.pr.ok) return UI.toast('Kode promo tidak valid: ' + c.pr.error, 'err');
        const lunas = k.pay === 'lunas'; if (lunas && k.method === 'tunai' && c.change < 0) return UI.toast('Uang diterima kurang ' + UI.rp(-c.change) + '.', 'err');
        const m = c.mem; const r = DB.createTransaction({ items: k.items, discount: c.discount, promoCode: c.pr && c.pr.ok ? c.pr.promo.code : '', memberId: m ? m.id : '', customerName: m ? m.name : (k.cname.trim() || 'Pelanggan Umum'), method: k.method, payStatus: k.pay, paidAmount: k.method === 'tunai' ? c.got : undefined, payRef: k.ref, payBank: k.bank, therapistId: k.th, reservationId: k.resId, voucherId: c.pr && c.pr.ok && c.pr.voucher ? c.pr.voucher.id : '' }, A);
        if (!r.ok) return UI.toast(r.error, 'err'); k = K0(); UI.toast(lunas ? 'Pembayaran ' + UI.rp(r.item.total) + ' diterima · ' + r.item.code : 'Transaksi ' + r.item.code + ' disimpan (belum lunas).'); this.ctx.refresh(); Receipt.preview(r.item);
      },
      rc(t) { Receipt.preview(DB.get('transactions', t.dataset.id)); },
      lunas(t) { payForm(DB.get('transactions', t.dataset.id)); },
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
