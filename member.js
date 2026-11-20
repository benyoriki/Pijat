/* member.js — Dashboard Member */
(function () {
  'use strict';
  DB.init(); UI.initTheme();
  const user = Auth.guard(['member']); if (!user) return;
  const esc = UI.esc;
  const me = () => DB.query('members', m => m.userId === user.id)[0] || null;
  const mname = () => (me() || {}).name || user.name;

  /* ---------- Overview ---------- */
  const overview = {
    render() {
      const m = me(); if (!m) return UI.empty('Data member tidak ditemukan. Hubungi Admin.');
      const st = DB.memberStats(m.id); const res = st.reservations.sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time));
      const up = res.filter(r => ['pending', 'confirmed', 'serving'].includes(r.status) && r.date >= DB.today()).sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time))[0];
      const promos = DB.all('promotions').filter(p => p.active && p.endDate >= DB.today() && p.startDate <= DB.today());
      const pr = promos.find(p => p.kind === 'Paket Member') || promos[0];
      return '<div class="card hello">' + UI.avatar(m.name, m.photo, 'lg') + '<div class="grow"><h2>Halo, ' + esc(m.name.split(' ')[0]) + ' 👋</h2><p class="muted">Selamat datang di Kayuputih Family Reflexology</p><div class="meta"><span class="lvl">' + UI.icon('star') + DB.level(m.points) + '</span><span class="badge b-active">' + esc(m.number) + '</span><span class="badge b-active">Member aktif</span></div></div><a class="btn btn-primary" href="#/reservasi">' + UI.icon('plus') + ' Reservasi Baru</a></div>' +
        '<div class="stats">' + UI.stat('calendar', 'Total Kunjungan', UI.num(st.visits)) + UI.stat('receipt', 'Total Transaksi', UI.rp(st.spent), '', 'info') + UI.stat('star', 'Poin Reward', UI.num(m.points), 'Level ' + DB.level(m.points)) + '</div>' +
        '<div class="cols"><div class="card"><div class="card-h"><h3>Reservasi Terdekat</h3><a class="link" href="#/riwayat">Lihat semua</a></div>' + (up ? resRow(up, false) : UI.empty('Belum ada reservasi mendatang.', 'calendar')) + '</div>' +
        (pr ? '<div class="promo-box"><h3>Promo Spesial untuk Member</h3><p>' + esc(pr.title) + '</p><div class="big">' + (pr.discType === 'percent' ? pr.value + '%' : UI.rp(pr.value)) + '</div><p>' + esc(pr.description) + '</p><p>Kode: <span class="code">' + esc(pr.code) + '</span> · s.d. ' + UI.date(pr.endDate) + '</p></div>' : '<div class="card">' + UI.empty('Belum ada promo aktif.', 'tag') + '</div>') + '</div>' +
        '<div class="card" style="margin-top:18px"><div class="card-h"><h3>Riwayat Reservasi Terbaru</h3></div>' + (res.length ? res.slice(0, 4).map(r => resRow(r, false)).join('') : UI.empty('Belum ada riwayat reservasi.', 'calendar')) + '</div>';
    }
  };
  function resRow(r, withAct) {
    const d = DB.parseYmd(r.date);
    return '<div class="res-card"><div class="cal"><b>' + d.getDate() + '</b><small>' + UI.MONTHS_L[d.getMonth()].slice(0, 3) + '</small></div><div class="info"><b>' + esc(r.serviceName) + '</b><small>#' + esc(r.code) + ' · ' + r.time + ' · Terapis: ' + esc(r.therapistId ? UI.thName(r.therapistId) : 'Bebas') + '</small>' + (r.notes ? '<small>Catatan: ' + esc(r.notes) + '</small>' : '') + '</div>' + UI.badge(r.status) +
      (withAct && DB.canCancel(r) ? '<button class="btn btn-ghost btn-sm" data-act="cancel" data-id="' + r.id + '">Batalkan</button>' : '') + '</div>';
  }

  /* ---------- Reservasi ---------- */
  const rs = { svc: '', date: DB.today(), time: '', th: '', notes: '' };
  const reservasi = {
    render() {
      const m = me(); if (!m) return UI.empty('Data member tidak ditemukan.');
      const p = UI.hashParams(); if (p.svc && !rs._seen) { rs.svc = p.svc; rs._seen = true; }
      const svcs = DB.all('services').filter(s => s.active); if (!rs.svc || !svcs.some(s => s.id === rs.svc)) rs.svc = svcs[0] ? svcs[0].id : '';
      const s = DB.get('services', rs.svc); const work = DB.workingTherapists(rs.date);
      if (rs.th && !work.some(t => t.id === rs.th)) rs.th = '';
      const slots = s ? DB.slotsFor(rs.date, s.duration, rs.th) : [];
      if (rs.time && !(slots.find(x => x.time === rs.time) || {}).ok) rs.time = '';
      return '<div class="page-head"><div><h2>Buat Reservasi</h2><p class="muted">Pilih layanan, tanggal, dan jam yang tersedia.</p></div></div>' +
        '<div class="card"><div class="card-h"><h3>1. Pilih Layanan</h3></div>' + (svcs.length ? '<div class="svc-pick">' + svcs.map(x => '<label><input type="radio" name="svc" value="' + x.id + '" data-in="svc"' + (x.id === rs.svc ? ' checked' : '') + '><span class="opt">' + UI.img(x.image, x.name) + '<span><b>' + esc(x.name) + '</b><small>' + x.duration + ' mnt · ' + UI.rp(x.price) + '</small></span></span></label>').join('') + '</div>' : UI.empty('Belum ada layanan aktif.')) + '</div>' +
        '<div class="card"><div class="card-h"><h3>2. Tanggal &amp; Jam</h3></div><div class="filters"><label>Tanggal<input class="input" id="rDate" type="date" min="' + DB.today() + '" value="' + rs.date + '" data-in="date"></label><label>Terapis (opsional)<select class="input" data-in="th"><option value="">Bebas (siapa saja tersedia)</option>' + work.map(t => '<option value="' + t.id + '"' + (t.id === rs.th ? ' selected' : '') + '>' + esc(t.name) + '</option>').join('') + '</select></label></div>' +
        (slots.length ? '<div class="slots">' + slots.map(x => '<button class="slot' + (x.time === rs.time ? ' on' : '') + '" data-act="slot" data-t="' + x.time + '"' + (x.ok ? '' : ' disabled') + '>' + x.time + '</button>').join('') + '</div>' : UI.empty('Tidak ada slot untuk layanan ini.', 'clock')) + '<p class="muted" style="margin-top:10px;font-size:.84rem">Jam yang dicoret sudah penuh atau sudah lewat. Jam operasional ' + DB.settings().openTime + '–' + DB.settings().closeTime + '.</p></div>' +
        '<div class="card"><div class="card-h"><h3>3. Catatan &amp; Konfirmasi</h3></div><div class="field"><label for="rNotes">Catatan (opsional)</label><textarea class="input" id="rNotes" data-in="notes" placeholder="Contoh: tekanan pijat ringan">' + esc(rs.notes) + '</textarea></div>' +
        (s ? '<div class="sum" style="margin:14px 0"><span>' + esc(s.name) + (s.demo ? ' <span class="badge b-demo">DEMO</span>' : '') + '</span><span>' + UI.dateLong(rs.date) + ' · ' + (rs.time || '— pilih jam —') + '</span><span>Durasi ' + s.duration + ' menit</span><b>' + UI.rp(s.price) + '</b></div>' : '') +
        '<button class="btn btn-primary btn-block" data-act="submit"' + (rs.time && s ? '' : ' disabled') + '>Kirim Reservasi</button></div>';
    },
    inputs: {
      svc(t) { rs.svc = t.value; this.ctx.refresh(); },
      date(t) { rs.date = t.value && t.value >= DB.today() ? t.value : DB.today(); this.ctx.refresh(); },
      th(t) { rs.th = t.value; this.ctx.refresh(); },
      notes(t) { rs.notes = t.value; }
    },
    actions: {
      slot(t) { rs.time = t.dataset.t; this.ctx.refresh(); },
      submit() {
        const m = me(), s = DB.get('services', rs.svc);
        const r = DB.createReservation({ memberId: m.id, customerName: m.name, phone: m.phone, serviceId: rs.svc, date: rs.date, time: rs.time, therapistId: rs.th, notes: rs.notes, source: 'member' }, m.name);
        if (!r.ok) { UI.toast(r.error, 'err'); this.ctx.refresh(); return; }
        UI.toast('Reservasi ' + r.item.code + ' terkirim. Menunggu konfirmasi.'); rs.time = ''; rs.notes = ''; this.ctx.go('riwayat');
      }
    }
  };

  /* ---------- Riwayat reservasi ---------- */
  const rh = { f: '' };
  const riwayat = {
    render() {
      const m = me(); if (!m) return UI.empty('Data member tidak ditemukan.');
      let list = DB.memberStats(m.id).reservations.sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time)); if (rh.f) list = list.filter(r => r.status === rh.f);
      return '<div class="page-head"><div><h2>Riwayat Reservasi</h2><p class="muted">Pembatalan hanya dapat dilakukan minimal ' + DB.settings().cancelHours + ' jam sebelum jadwal.</p></div><a class="btn btn-primary" href="#/reservasi">' + UI.icon('plus') + ' Reservasi Baru</a></div>' +
        '<div class="card"><div class="filters"><label>Status<select class="input" data-in="f"><option value="">Semua status</option>' + Object.keys(DB.STATUS).map(k => '<option value="' + k + '"' + (rh.f === k ? ' selected' : '') + '>' + DB.STATUS[k] + '</option>').join('') + '</select></label></div>' + (list.length ? list.map(r => resRow(r, true)).join('') : UI.empty('Tidak ada reservasi.', 'calendar')) + '</div>';
    },
    inputs: { f(t) { rh.f = t.value; this.ctx.refresh(); } },
    actions: {
      async cancel(t) {
        const r = DB.get('reservations', t.dataset.id); if (!r || !DB.canCancel(r)) return UI.toast('Reservasi ini sudah tidak dapat dibatalkan.', 'err');
        if (await UI.confirm({ title: 'Batalkan reservasi', message: 'Batalkan reservasi <b>' + esc(r.serviceName) + '</b> pada ' + UI.date(r.date) + ' ' + r.time + '?', okText: 'Ya, batalkan', danger: true })) { DB.setReservationStatus(r.id, 'cancelled', mname()); UI.toast('Reservasi dibatalkan.'); }
      }
    }
  };

  /* ---------- Transaksi ---------- */
  const tp = { p: 1 };
  const transaksi = {
    render() {
      const m = me(); if (!m) return UI.empty('Data member tidak ditemukan.');
      const all = DB.all('transactions').filter(t => t.memberId === m.id).sort((a, b) => (b.date + b.createdAt).localeCompare(a.date + a.createdAt)); const pg = UI.page(all, tp.p, 8);
      return '<div class="page-head"><div><h2>Riwayat Transaksi</h2></div></div><div class="card">' + UI.table([
        { label: 'No. Transaksi', render: t => '<b>' + esc(t.code) + '</b>' }, { label: 'Tanggal', render: t => UI.date(t.date) },
        { label: 'Layanan', render: t => esc(t.items.map(i => i.name).join(', ')) }, { label: 'Durasi', render: t => t.items.reduce((a, i) => a + i.duration * i.qty, 0) + ' mnt' },
        { label: 'Harga', cls: 'r', render: t => UI.rp(t.subtotal) }, { label: 'Diskon', cls: 'r', render: t => t.discount ? '-' + UI.rp(t.discount) : '-' }, { label: 'Total', cls: 'r', render: t => '<b>' + UI.rp(t.total) + '</b>' },
        { label: 'Status', render: t => UI.badge(t.payStatus, DB.PAY[t.payStatus]) }, { label: '', cls: 'act', render: t => '<button class="btn btn-ghost btn-sm" data-act="rc" data-id="' + t.id + '">' + UI.icon('receipt') + ' Struk</button>' }
      ], pg.items, { empty: 'Belum ada transaksi.' }) + UI.pager(pg) + '</div>';
    },
    actions: { page(t) { tp.p = +t.dataset.p; this.ctx.refresh(); }, rc(t) { Receipt.preview(DB.get('transactions', t.dataset.id)); } }
  };

  /* ---------- Membership ---------- */
  const membership = {
    render() {
      const m = me(); if (!m) return UI.empty('Data member tidak ditemukan.');
      const nx = DB.levelNext(m.points); const lv = DB.level(m.points);
      const base = lv === 'Silver' ? 0 : 200; const pct = nx ? Math.min(100, Math.round((m.points - base) / (nx.at - base) * 100)) : 100;
      const rewards = DB.all('promotions').filter(p => p.active && p.pointsCost > 0 && p.endDate >= DB.today());
      const vch = (m.vouchers || []).slice().reverse(); const hist = (m.pointsHistory || []).slice().reverse().slice(0, 12);
      return '<div class="page-head"><div><h2>Membership</h2></div></div><div class="cols"><div class="mcard"><div class="row" style="justify-content:space-between;flex-wrap:nowrap"><b style="letter-spacing:.14em">KAYUPUTIH MEMBER</b><span class="lvl">' + UI.icon('star') + lv + '</span></div><div class="no">' + esc(m.number) + '</div><div>' + esc(m.name) + '</div><div style="margin-top:18px"><small>Poin reward</small><div class="pts">' + UI.num(m.points) + '</div></div></div>' +
        '<div class="card"><div class="card-h"><h3>Progres Level</h3></div><p>' + (nx ? UI.num(nx.at - m.points) + ' poin lagi menuju <b>' + nx.name + '</b>' : 'Anda berada di level tertinggi 🎉') + '</p><div class="bar" style="margin:12px 0"><i style="width:' + pct + '%"></i></div><p class="muted" style="font-size:.84rem">Dapatkan 1 poin setiap belanja ' + UI.rp(DB.settings().pointRate) + ' (transaksi lunas).</p></div></div>' +
        '<div class="cols" style="margin-top:18px"><div class="card"><div class="card-h"><h3>Tukar Reward</h3></div>' + (rewards.length ? rewards.map(p => '<div class="reward"><div><b>' + esc(p.title) + '</b><br><small class="muted">' + esc(p.description) + '</small></div><button class="btn btn-primary btn-sm" data-act="redeem" data-id="' + p.id + '"' + (m.points < p.pointsCost ? ' disabled' : '') + '>' + p.pointsCost + ' poin</button></div>').join('') : UI.empty('Belum ada reward yang dapat ditukar.', 'gift')) +
        '<div class="card-h" style="margin-top:18px"><h3>Voucher Saya</h3></div>' + (vch.length ? vch.map(v => '<div class="reward"><div><b>' + esc(v.title) + '</b><br><small class="muted">Ditukar ' + UI.date(v.date) + '</small></div><span><span class="vch">' + esc(v.code) + '</span> ' + (v.used ? UI.badge('done', 'Terpakai') : UI.badge('active', 'Aktif')) + '</span></div>').join('') + '<p class="muted" style="font-size:.82rem;margin-top:8px">Tunjukkan kode voucher ke kasir.</p>' : '<p class="muted">Belum ada voucher.</p>') + '</div>' +
        '<div class="card"><div class="card-h"><h3>Riwayat Poin</h3></div>' + (hist.length ? hist.map(h => '<div class="list-i"><div><b>' + esc(h.text) + '</b><small>' + UI.date(h.date) + '</small></div><b style="color:' + (h.points >= 0 ? 'var(--ok)' : 'var(--bad)') + '">' + (h.points >= 0 ? '+' : '') + h.points + '</b></div>').join('') : UI.empty('Belum ada riwayat poin.', 'star')) + '</div></div>';
    },
    actions: {
      async redeem(t) {
        const p = DB.get('promotions', t.dataset.id);
        if (!(await UI.confirm({ title: 'Tukar reward', message: 'Tukar <b>' + p.pointsCost + ' poin</b> dengan <b>' + esc(p.title) + '</b>?', okText: 'Tukar' }))) return;
        const r = DB.redeem(me().id, p.id); if (!r.ok) return UI.toast(r.error, 'err'); UI.toast('Berhasil! Kode voucher: ' + r.code);
      }
    }
  };

  /* ---------- Profil ---------- */
  const pf = [
    { name: 'name', label: 'Nama lengkap', required: true, span: 2 }, { name: 'phone', label: 'Nomor HP', type: 'tel', required: true, span: 1 }, { name: 'email', label: 'Email', type: 'email', required: true, span: 1 },
    { name: 'birth', label: 'Tanggal lahir', type: 'date', span: 1 }, { name: 'address', label: 'Alamat', type: 'textarea', span: 2 }, { name: 'photo', label: 'Foto profil', type: 'image', span: 2 }
  ];
  const profil = {
    render() {
      const m = me(); if (!m) return UI.empty('Data member tidak ditemukan.');
      return '<div class="page-head"><div><h2>Profil Saya</h2></div><button class="btn btn-ghost" data-act="pass">' + UI.icon('shield') + ' Ganti Password</button></div><div class="card"><form id="pForm" class="form-grid" novalidate>' + UI.fields(pf, m) + '<div class="form-err" data-formerr></div><div class="field span-2"><button class="btn btn-primary" type="submit">Simpan Perubahan</button></div></form></div>';
    },
    mount(el) {
      const f = UI.$('#pForm', el); if (!f) return; UI.bindFields(f);
      f.addEventListener('submit', e => {
        e.preventDefault(); const v = UI.collect(f, pf); if (!v) return; const m = me(); const err = UI.$('[data-formerr]', f); err.textContent = '';
        const email = v.email.toLowerCase();
        if (DB.all('users').some(u => u.email === email && u.id !== user.id)) { err.textContent = 'Email sudah dipakai akun lain.'; return; }
        if (DB.all('members').some(x => x.id !== m.id && x.phone && x.phone === v.phone)) { err.textContent = 'Nomor HP sudah dipakai member lain.'; return; }
        DB.update('members', m.id, { name: v.name, phone: v.phone, email, birth: v.birth, address: v.address, photo: v.photo });
        DB.update('users', user.id, { name: v.name, email }); UI.toast('Profil diperbarui.');
      });
    },
    actions: {
      pass() {
        UI.form({ title: 'Ganti Password', submitText: 'Simpan', fields: [{ name: 'old', label: 'Password lama', type: 'password', required: true }, { name: 'n1', label: 'Password baru', type: 'password', required: true, hint: 'Min. 8 karakter, huruf dan angka' }, { name: 'n2', label: 'Ulangi password baru', type: 'password', required: true }],
          onSubmit(v) { if (v.n1 !== v.n2) return 'Konfirmasi password tidak sama.'; const r = Auth.changePassword(user.id, v.old, v.n1); if (!r.ok) return r.error; UI.toast('Password diganti.'); } });
      }
    }
  };

  const m0 = me();
  UI.shell({
    role: 'member', roleLabel: 'Member', user: Object.assign({}, user, { name: m0 ? m0.name : user.name }), photo: m0 ? m0.photo : '',
    menu: [{ id: 'overview', label: 'Dashboard', short: 'Beranda', icon: 'home' }, { id: 'reservasi', label: 'Reservasi', icon: 'calendar' }, { id: 'riwayat', label: 'Riwayat', icon: 'clock' }, { id: 'transaksi', label: 'Transaksi', short: 'Transaksi', icon: 'receipt' }, { id: 'membership', label: 'Membership', short: 'Member', icon: 'star' }, { id: 'profil', label: 'Profil', icon: 'user' }],
    views: { overview, reservasi, riwayat, transaksi, membership, profil }
  });
})();
