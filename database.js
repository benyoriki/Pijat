/* =====================================================================
   database.js — Lapisan data LocalStorage Kayuputih Family Reflexology
   Semua akses data lewat objek global `DB`. Struktur dibuat agar mudah
   dipindahkan ke Firebase Realtime Database (all/get/insert/update/remove
   tinggal diganti implementasinya).
   ===================================================================== */
(function (global) {
  'use strict';
  const PREFIX = 'kp_';
  const VERSION = 5;
  const COLS = ['users', 'members', 'services', 'reservations', 'transactions', 'therapists',
    'promotions', 'notifications', 'attendance', 'settings', 'activityLogs', 'gallery'];

  const STATUS = { pending: 'Menunggu Konfirmasi', confirmed: 'Dikonfirmasi', serving: 'Sedang Dilayani', done: 'Selesai', cancelled: 'Dibatalkan' };
  const PAY = { lunas: 'Lunas', belum: 'Belum Lunas' };
  const METHOD = { tunai: 'Tunai', transfer: 'Transfer', qris: 'QRIS' };

  /* ---------- util ---------- */
  const pad = (n, l) => String(n).padStart(l || 2, '0');
  const ymd = d => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  const today = () => ymd(new Date());
  const parseYmd = s => { const p = String(s).split('-'); return new Date(+p[0], +p[1] - 1, +p[2]); };
  const addDays = (s, n) => { const d = parseYmd(s); d.setDate(d.getDate() + n); return ymd(d); };
  const toMin = t => { const p = String(t || '0:0').split(':'); return (+p[0]) * 60 + (+p[1] || 0); };
  const fromMin = m => pad(Math.floor(m / 60)) + ':' + pad(m % 60);
  const nowMin = () => { const d = new Date(); return d.getHours() * 60 + d.getMinutes(); };
  const uid = p => (p || 'id') + '_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

  // Hash demo (cyrb53 + salt). BUKAN untuk produksi — gunakan Firebase Auth / bcrypt di server.
  function hash(s) {
    s = 'kp-salt-2026::' + s;
    let h1 = 0xdeadbeef, h2 = 0x41c6ce57;
    for (let i = 0, ch; i < s.length; i++) {
      ch = s.charCodeAt(i);
      h1 = Math.imul(h1 ^ ch, 2654435761);
      h2 = Math.imul(h2 ^ ch, 1597334677);
    }
    h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
    h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
    return 'h1$' + (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(16);
  }

  /* ---------- storage ---------- */
  const cache = {};   // cache hasil parse: JSON.parse hanya dijalankan ulang bila isi LocalStorage berubah
  function read(k, d) {
    try {
      const raw = localStorage.getItem(PREFIX + k); if (raw === null) return d;
      let c = cache[k]; if (!c || c.raw !== raw) c = cache[k] = { raw, v: JSON.parse(raw) };
      return Array.isArray(c.v) ? c.v.slice() : c.v;
    } catch (e) { return d; }
  }
  function write(k, v) {
    try { localStorage.setItem(PREFIX + k, JSON.stringify(v)); return true; }
    catch (e) {
      console.error('Gagal menyimpan', k, e);
      if (global.dispatchEvent) global.dispatchEvent(new CustomEvent('kp:error', { detail: 'Penyimpanan browser penuh. Hapus foto besar atau lakukan backup lalu reset.' }));
      return false;
    }
  }
  let silent = 0;
  function emit(col) { if (!silent && global.dispatchEvent) global.dispatchEvent(new CustomEvent('kp:change', { detail: { col } })); }

  const all = c => read(c, c === 'settings' ? {} : []);
  const get = (c, id) => all(c).find(x => x.id === id) || null;
  function insert(c, obj) {
    const list = all(c);
    const item = Object.assign({ id: uid(c.slice(0, 3)), createdAt: new Date().toISOString() }, obj);
    list.push(item); write(c, list); emit(c); return item;
  }
  function update(c, id, patch) {
    const list = all(c); const i = list.findIndex(x => x.id === id);
    if (i < 0) return null;
    list[i] = Object.assign({}, list[i], patch, { updatedAt: new Date().toISOString() });
    write(c, list); emit(c); return list[i];
  }
  function remove(c, id) {
    const list = all(c); const n = list.filter(x => x.id !== id);
    if (n.length === list.length) return false;
    write(c, n); emit(c); return true;
  }
  const query = (c, fn) => all(c).filter(fn);

  /* ---------- settings ---------- */
  const IMG = {
    hero: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1600&q=70',
    a: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&w=900&q=70',
    b: 'https://images.unsplash.com/photo-1600334129128-685c5582fd35?auto=format&fit=crop&w=900&q=70',
    c: 'https://images.unsplash.com/photo-1507652313519-d4e9174996dd?auto=format&fit=crop&w=900&q=70',
    d: 'https://images.unsplash.com/photo-1515377905703-c4788e51af15?auto=format&fit=crop&w=900&q=70',
    e: 'https://images.unsplash.com/photo-1519823551278-64ac92734fb1?auto=format&fit=crop&w=900&q=70',
    f: 'https://images.unsplash.com/photo-1620733723572-11c53f73b416?auto=format&fit=crop&w=900&q=70'
  };
  const settings = () => Object.assign({}, defaultSettings(), read('settings', {}));
  function saveSettings(p) { const s = Object.assign({}, settings(), p); write('settings', s); emit('settings'); return s; }
  function defaultSettings() {
    return {
      businessName: 'Kayuputih Family Reflexology Palu',
      tagline: 'Relax Your Body, Refresh Your Mind',
      address: 'Belakang AlfaMidi Sparman, Jl. Soeprapto, Besusu Tengah, Kecamatan Palu Timur, Kota Palu, Sulawesi Tengah 94111',
      mapsUrl: 'https://maps.app.goo.gl/TwffxMsQfpR1Zook6?g_st=ac',
      phone: '', whatsapp: '', instagram: '', facebook: '',
      openTime: '10:00', closeTime: '22:00', slotMinutes: 60, cancelHours: 2, pointRate: 10000,
      rating: '4,8', reviews: 209, logo: '',
      bankName: '', bankAccount: '', bankHolder: '', qrisImage: 'qris.webp', qrisName: 'QRIS', receiptNote: 'Terima kasih atas kunjungan Anda. Sampai jumpa kembali!',
      heroTitle: 'Rasakan Kenyamanan, Pulihkan Kesegaran Tubuh Anda',
      heroText: 'Temukan pengalaman relaksasi bersama Kayuputih Family Reflexology. Nikmati suasana nyaman, pelayanan ramah, dan pengalaman pijat yang membantu tubuh lebih rileks.',
      heroImage: IMG.hero,
      about: 'Kayuputih Family Reflexology adalah tempat refleksi dan pijat relaksasi di Kota Palu dengan suasana hangat bernuansa kayu. Kami melayani pelanggan perorangan maupun keluarga dengan ramah dan nyaman.',
      theme: 'light'
    };
  }

  /* ---------- seed ---------- */
  function mulberry(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  const level = p => p >= 600 ? 'Platinum' : p >= 200 ? 'Gold' : 'Silver';
  const levelNext = p => p >= 600 ? null : p >= 200 ? { name: 'Platinum', at: 600 } : { name: 'Gold', at: 200 };

  function seed() {
    silent++;
    const t = today(); const rng = mulberry(2026);
    const pick = a => a[Math.floor(rng() * a.length)];
    const demoPass = hash('Kayuputih123');
    const now = new Date().toISOString();
    const START = '2026-10-01' <= t ? '2026-10-01' : addDays(t, -30);   // rekap dimulai Oktober 2026
    const span = Math.round((parseYmd(t) - parseYmd(START)) / 864e5);

    const users = [
      { id: 'u_admin', name: 'Admin Kayuputih', email: 'admin@kayuputih.demo', role: 'admin', passHash: demoPass, active: true, createdAt: now },
      { id: 'u_super', name: 'Supervisor Operasional', email: 'supervisor@kayuputih.demo', role: 'supervisor', passHash: demoPass, active: true, createdAt: now },
      { id: 'u_member', name: 'Budi Santoso', email: 'member@kayuputih.demo', role: 'member', passHash: demoPass, active: true, createdAt: now }
    ];

    const mk = (id, n, name, userId) => ({ id, userId: userId || null, number: 'KP-' + pad(n, 4), name, phone: '0812000' + pad(n, 4), email: '', birth: '', address: '', photo: '', points: 0, pointsHistory: [], vouchers: [], status: 'active', joinDate: addDays(t, -Math.min(span + 20, 80) + n * 3), createdAt: now });
    const MN = ['Siti Aminah', 'Rizky Pratama', 'Dewi Lestari', 'Andi Wijaya', 'Maya Putri', 'Hendra Saputra', 'Nur Halimah', 'Fajar Ramadhan', 'Lestari Ningsih', 'Yusuf Maulana', 'Rina Wulandari', 'Ahmad Fauzi', 'Putri Ayu', 'Dian Kusuma'];
    const members = [Object.assign(mk('mem_budi', 1, 'Budi Santoso', 'u_member'), { email: 'member@kayuputih.demo' })].concat(MN.map((n, i) => mk('mem_' + (i + 2), i + 2, n)));

    const sv = (id, name, cat, duration, price, desc, image) => ({ id, name, category: cat, duration, price, description: desc, image, active: true, demo: true, createdAt: now });
    const services = [
      sv('svc_1', 'Traditional Reflexology', 'Reflexology', 60, 85000, 'Pijat refleksi tradisional pada titik-titik telapak kaki untuk membantu tubuh terasa lebih rileks.', IMG.a),
      sv('svc_2', 'Foot Reflexology', 'Reflexology', 45, 65000, 'Fokus pada kaki dan betis; cocok untuk melepas penat setelah beraktivitas seharian.', IMG.e),
      sv('svc_3', 'Body Massage', 'Massage', 90, 150000, 'Pijat badan dengan tekanan sesuai kenyamanan Anda untuk meredakan pegal.', IMG.b),
      sv('svc_4', 'Full Body Relaxation', 'Massage', 120, 200000, 'Rangkaian relaksasi menyeluruh dari kepala hingga kaki.', IMG.c),
      sv('svc_5', 'Family Treatment', 'Family', 60, 70000, 'Paket pijat untuk anggota keluarga; harga per orang.', IMG.d),
      sv('svc_6', 'Paket Relaksasi', 'Paket', 150, 250000, 'Kombinasi body massage dan reflexology dalam satu paket santai.', IMG.f)
    ];

    const days = [0, 1, 2, 3, 4, 5, 6];
    const th = (id, name, phone) => ({ id, name, phone, photo: '', active: true, days: days.slice(), startTime: '10:00', endTime: '22:00', demo: true, createdAt: now });
    const therapists = [th('th_1', 'Sari', ''), th('th_2', 'Budi', ''), th('th_3', 'Ani', ''), th('th_4', 'Dewi', '')];

    const promo = (id, title, kind, code, discType, value, endOff, img, desc, extra) => Object.assign({ id, title, kind, code, discType, value, startDate: START, endDate: addDays(t, endOff), image: img, description: desc, active: true, packagePrice: 0, pointsCost: 0, createdAt: now }, extra || {});
    const promotions = [
      promo('pro_1', 'Promo Hari Ini', 'Promo Hari Ini', 'HARIINI', 'percent', 10, 365, IMG.a, 'Diskon 10% untuk semua layanan (DEMO).'),
      promo('pro_2', 'Paket Couple', 'Paket Couple', 'COUPLE', 'nominal', 20000, 365, IMG.b, 'Datang berdua, hemat Rp 20.000 (DEMO).', { packagePrice: 150000 }),
      promo('pro_3', 'Paket Family', 'Paket Family', 'FAMILY', 'percent', 15, 365, IMG.d, 'Diskon 15% untuk rombongan keluarga (DEMO).'),
      promo('pro_4', 'Paket Member', 'Paket Member', 'MEMBER5', 'percent', 5, 365, IMG.c, 'Diskon 5% khusus member; dapat ditukar dengan poin (DEMO).', { pointsCost: 100 }),
      promo('pro_5', 'Promo Ulang Tahun', 'Promo Ulang Tahun', 'BDAY', 'percent', 20, 365, IMG.f, 'Diskon 20% di bulan ulang tahun Anda (DEMO).'),
      promo('pro_6', 'Promo Spesial', 'Promo Spesial', 'SPESIAL', 'nominal', 15000, 90, IMG.e, 'Potongan Rp 15.000 untuk layanan di atas Rp 100.000 (DEMO).', { minSpend: 100000 })
    ];

    const gallery = [
      { id: 'gal_1', title: 'Ruang Reflexology', category: 'Ruang Reflexology', url: IMG.a },
      { id: 'gal_2', title: 'Suasana Relaksasi', category: 'Suasana', url: IMG.hero },
      { id: 'gal_3', title: 'Interior Kayu', category: 'Interior', url: IMG.c },
      { id: 'gal_4', title: 'Area Pelayanan', category: 'Pelayanan', url: IMG.b },
      { id: 'gal_5', title: 'Fasilitas', category: 'Fasilitas', url: IMG.f },
      { id: 'gal_6', title: 'Area Resepsionis', category: 'Resepsionis', url: IMG.d }
    ];

    /* ---- transaksi: 1 Okt 2026 → hari ini, ±2× lebih ramai dari versi lama ---- */
    const rate = defaultSettings().pointRate;
    const tx = []; const seqs = {}; const notifications = []; const activityLogs = [];
    const digits = n => { let s = ''; for (let i = 0; i < n; i++) s += Math.floor(rng() * 10); return s; };
    const BANKS = ['BCA', 'BRI', 'Mandiri', 'BNI', 'BSI'];
    const mAt = (date, min) => date + 'T' + pad(Math.floor(min / 60)) + ':' + pad(min % 60) + ':00';
    const addTx = (date, min, mem, items, method, therapist, promoPick, unpaid) => {
      const subtotal = items.reduce((a, i) => a + i.price * i.qty, 0);
      const k = date.replace(/-/g, ''); seqs[k] = (seqs[k] || 0) + 1;
      const code = 'TRX' + k + '-' + pad(seqs[k], 3);
      let discount = 0, promoCode = '';
      if (promoPick) { discount = promoPick.discType === 'percent' ? Math.round(subtotal * promoPick.value / 100) : promoPick.value; promoCode = promoPick.code; }
      const total = subtotal - discount;
      const o = { id: 'trx_' + k + '_' + seqs[k], code, date, memberId: mem ? mem.id : null, customerName: mem ? mem.name : pick(['Pelanggan Umum', 'Pelanggan Umum', 'Pelanggan Umum', 'Tamu Walk-in']), items, subtotal, discount, promoCode, total, method, payStatus: unpaid ? 'belum' : 'lunas', therapistId: therapist, reservationId: '', pointsAwarded: !!mem && !unpaid, cashier: 'Admin Kayuputih', createdAt: mAt(date, min) };
      if (!unpaid) {
        o.paidAt = o.createdAt;
        if (method === 'tunai') { const r = pick([5000, 10000, 50000, 100000]); o.paidAmount = Math.max(total, Math.ceil(total / r) * r); o.change = o.paidAmount - total; }
        else { o.paidAmount = total; o.change = 0; o.payRef = (method === 'qris' ? 'QRIS' + digits(10) : 'TRF' + digits(8)); if (method === 'transfer') o.payBank = pick(BANKS); }
      }
      tx.push(o);
      if (mem && !unpaid) { const p = Math.floor(total / rate); mem.points += p; mem.pointsHistory.push({ date, text: 'Transaksi ' + code, points: p }); }
      return o;
    };
    const nowM = nowMin();
    for (let i = span; i >= 0; i--) {
      const date = addDays(t, -i); const wd = weekdayOf(date);
      let n = wd === 0 || wd === 6 ? 8 + Math.floor(rng() * 5) : wd === 5 ? 6 + Math.floor(rng() * 4) : 4 + Math.floor(rng() * 5);   // 4–12 per hari
      let maxMin = 21 * 60 + 30;
      if (i === 0) { maxMin = Math.min(maxMin, nowM); n = maxMin < 630 ? 0 : Math.max(1, Math.round(n * (maxMin - 600) / 690)); }
      const times = []; for (let j = 0; j < n; j++) times.push(600 + Math.floor(rng() * Math.max(1, maxMin - 600))); times.sort((a, b) => a - b);
      times.forEach((min, j) => {
        const s1 = pick(services); const items = [{ serviceId: s1.id, name: s1.name, duration: s1.duration, price: s1.price, qty: s1.id === 'svc_5' && rng() < .4 ? 2 : 1 }];
        if (rng() < 0.22) { const s2 = pick(services); if (s2.id !== s1.id) items.push({ serviceId: s2.id, name: s2.name, duration: s2.duration, price: s2.price, qty: 1 }); }
        let mem = rng() < 0.6 ? pick(members) : null;
        if (j === 0 && (i === 20 || i === 9 || i === 2)) mem = members[0]; else if (mem && mem.id === 'mem_budi') mem = members[1];
        const pr = rng() < 0.16 ? pick([promotions[0], promotions[2], promotions[3]]) : null;
        const unpaid = i <= 4 && j === times.length - 1 && rng() < 0.45;
        const m = rng(); const method = m < 0.42 ? 'tunai' : m < 0.78 ? 'qris' : 'transfer';
        addTx(date, min, mem, items, unpaid ? 'tunai' : method, pick(therapists).id, pr, unpaid);
      });
    }
    members[0].vouchers = [];

    /* ---- reservasi: 1 Okt → 7 hari ke depan ---- */
    const reservations = []; const rsq = {};
    const hourNow = new Date().getHours();
    const WALK = ['Hasan', 'Lina', 'Agus', 'Wati', 'Ferdi', 'Citra', 'Bayu', 'Rosa'];
    for (let d = -span; d <= 7; d++) {
      const date = addDays(t, d); const n = d === 0 ? 8 : d < 0 ? 3 + Math.floor(rng() * 6) : 4 + Math.floor(rng() * 4);
      const busy = {};
      for (let k = 0; k < n; k++) {
        const h = 10 + Math.floor(rng() * 11); const time = pad(h) + ':00'; const s = pick(services);
        if (h * 60 + s.duration > 22 * 60) continue;
        const free = therapists.filter(x => !(busy[x.id] || []).some(b => b[0] < h * 60 + s.duration && b[1] > h * 60)); if (!free.length) continue;
        const th = free[Math.floor(rng() * free.length)]; (busy[th.id] = busy[th.id] || []).push([h * 60, h * 60 + s.duration]);
        const mem = k === 0 && d === 1 ? members[0] : rng() < .7 ? pick(members.slice(1)) : null;
        let status;
        if (d < 0) status = rng() < 0.12 ? 'cancelled' : 'done';
        else if (d > 0) status = rng() < 0.62 ? 'confirmed' : 'pending';
        else status = h + 1 <= hourNow ? 'done' : h <= hourNow ? 'serving' : rng() < 0.6 ? 'confirmed' : 'pending';
        const key = date.replace(/-/g, ''); rsq[key] = (rsq[key] || 0) + 1;
        reservations.push({ id: 'res_' + key + '_' + rsq[key], code: 'RES' + key + '-' + pad(rsq[key], 3), memberId: mem ? mem.id : null, customerName: mem ? mem.name : pick(WALK), phone: mem ? mem.phone : '', serviceId: s.id, serviceName: s.name, duration: s.duration, price: s.price, therapistId: th.id, date, time, notes: '', status, source: pick(['seed', 'member', 'admin']), createdAt: addDays(date, -1) + 'T09:00:00' });
      }
    }
    reservations.push({ id: 'res_budi_demo', code: 'RES' + t.replace(/-/g, '') + '-900', memberId: 'mem_budi', customerName: 'Budi Santoso', phone: '', serviceId: 'svc_1', serviceName: 'Traditional Reflexology', duration: 60, price: 85000, therapistId: 'th_4', date: addDays(t, 3), time: '14:00', notes: '', status: 'confirmed', source: 'seed', createdAt: now });

    /* ---- notifikasi & log aktivitas (pembayaran, reservasi, promo) ---- */
    const R = ['admin', 'supervisor'], rd = ['u_admin', 'u_super'];
    tx.slice(-45).forEach((x, i, a) => {
      const old = x.date < t, mt = DB_METHOD[x.method];
      notifications.push({ id: 'not_p' + i, title: x.payStatus === 'lunas' ? 'Pembayaran diterima' : 'Pembayaran tertunda', msg: x.code + ' · ' + x.customerName + ' · ' + mt + ' · Rp ' + x.total.toLocaleString('id-ID'), type: x.payStatus === 'lunas' ? 'payment' : 'transaction', roles: R, userId: null, readBy: old && i < a.length - 8 ? rd.slice() : [], createdAt: x.createdAt });
    });
    reservations.filter(r => r.status === 'pending').slice(0, 8).forEach((r, i) => notifications.push({ id: 'not_r' + i, title: 'Reservasi baru', msg: 'Ada reservasi baru dari ' + r.customerName + ' (' + r.date + ' ' + r.time + ').', type: 'reservation', roles: R, userId: null, readBy: [], createdAt: new Date(Date.now() - (i + 1) * 37 * 60000).toISOString() }));
    notifications.push({ id: 'not_2', title: 'Promo terbaru', msg: 'Promo Hari Ini kini aktif: diskon 10% (DEMO).', type: 'promo', roles: ['member'], userId: null, readBy: [], createdAt: now },
      { id: 'not_3', title: 'Reservasi dikonfirmasi', msg: 'Reservasi Traditional Reflexology Anda telah dikonfirmasi.', type: 'reservation', roles: null, userId: 'u_member', readBy: [], createdAt: now });
    tx.slice(-60).forEach((x, i) => activityLogs.push({ id: 'log_t' + i, type: 'activity', text: 'Transaksi ' + x.code + ' Rp ' + x.total.toLocaleString('id-ID') + ' (' + DB_METHOD[x.method] + (x.payStatus === 'lunas' ? '' : ', belum lunas') + ')', by: 'Admin Kayuputih', createdAt: x.createdAt }));
    activityLogs.push({ id: 'log_1', type: 'system', text: 'Data demo dibuat (' + tx.length + ' transaksi sejak ' + START + ')', by: 'Sistem', createdAt: now });

    const data = { users, members, services, reservations, transactions: tx, therapists, promotions, notifications, attendance: [], settings: defaultSettings(), activityLogs, gallery };
    COLS.forEach(c => write(c, data[c]));
    write('version', VERSION);
    silent--; emit('*');
  }
  const DB_METHOD = METHOD;
  const weekdayOf = s => parseYmd(s).getDay();
  /* data bawaan (seed) vs data buatan pengguna — dipakai saat migrasi versi */
  const SEEDRX = { users: /^u_(admin|super|member)$/, members: /^mem_(budi|\d+)$/, reservations: /^res_(\d{8}_\d+|budi_demo)$/, transactions: /^trx_\d{8}_\d+$/ };
  function migrate() {
    const keep = {}; ['settings', 'users', 'members', 'reservations', 'transactions', 'attendance'].forEach(c => keep[c] = read(c, c === 'settings' ? {} : []));
    seed(); silent++;
    write('settings', Object.assign({}, defaultSettings(), keep.settings));
    const oldU = keep.users.filter(u => u && u.id); const uIds = new Set(oldU.map(u => u.id));
    write('users', all('users').filter(u => !uIds.has(u.id)).concat(oldU));
    ['members', 'reservations', 'transactions'].forEach(c => { const extra = keep[c].filter(x => x && x.id && !SEEDRX[c].test(x.id)); if (extra.length) write(c, all(c).concat(extra)); });
    write('attendance', keep.attendance); silent--; emit('*');
  }
  function init() { const v = read('version', 0); if (v !== VERSION) { if (!v || !read('users', null)) seed(); else migrate(); } COLS.forEach(c => { if (read(c, null) === null) write(c, c === 'settings' ? {} : []); }); }

  /* ---------- notifications / logs ---------- */
  function notify(n) { return insert('notifications', Object.assign({ type: 'info', roles: null, userId: null, readBy: [] }, n)); }
  function notifsFor(user) {
    return all('notifications').filter(n => n.userId ? n.userId === user.id : (n.roles && n.roles.includes(user.role)))
      .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
  }
  function markRead(user) {
    const list = all('notifications'); let ch = false;
    notifsFor(user).forEach(n => { if (!n.readBy.includes(user.id)) { const o = list.find(x => x.id === n.id); o.readBy.push(user.id); ch = true; } });
    if (ch) { write('notifications', list); emit('notifications'); }
  }
  function log(text, by, type) { return insert('activityLogs', { type: type || 'activity', text, by: by || 'Sistem' }); }

  /* ---------- members ---------- */
  function nextMemberNumber() { const max = all('members').reduce((m, x) => Math.max(m, parseInt(String(x.number).replace(/\D/g, ''), 10) || 0), 0); return 'KP-' + pad(max + 1, 4); }
  function createMember(d) {
    const members = all('members');
    if (d.phone && members.some(m => m.phone && m.phone === d.phone)) return { ok: false, error: 'Nomor HP sudah terdaftar.' };
    if (d.email && (all('users').some(u => u.email === d.email.toLowerCase()) || members.some(m => m.email && m.email.toLowerCase() === d.email.toLowerCase()))) return { ok: false, error: 'Email sudah terdaftar.' };
    let userId = null;
    if (d.password) {
      if (!d.email) return { ok: false, error: 'Email wajib diisi untuk membuat akun login.' };
      userId = uid('u');
      const users = all('users'); users.push({ id: userId, name: d.name, email: d.email.toLowerCase(), role: 'member', passHash: hash(d.password), active: true, createdAt: new Date().toISOString() });
      write('users', users);
    }
    const m = insert('members', { userId, number: nextMemberNumber(), name: d.name, phone: d.phone || '', email: (d.email || '').toLowerCase(), birth: d.birth || '', address: d.address || '', photo: '', points: 0, pointsHistory: [], vouchers: [], status: 'active', joinDate: today() });
    notify({ title: 'Member baru', msg: m.name + ' (' + m.number + ') terdaftar.', type: 'member', roles: ['admin'] });
    return { ok: true, member: m };
  }
  function removeMember(id) { const m = get('members', id); if (!m) return false; if (m.userId) remove('users', m.userId); return remove('members', id); }
  function memberStats(id) {
    const tx = all('transactions').filter(t => t.memberId === id && t.payStatus === 'lunas');
    return { visits: tx.length, spent: tx.reduce((a, t) => a + t.total, 0), tx, reservations: all('reservations').filter(r => r.memberId === id) };
  }
  function adjustPoints(id, delta, text) {
    const m = get('members', id); if (!m) return null;
    const pts = Math.max(0, m.points + delta);
    return update('members', id, { points: pts, pointsHistory: (m.pointsHistory || []).concat([{ date: today(), text: text || 'Penyesuaian poin', points: pts - m.points }]) });
  }
  function redeem(memberId, promoId) {
    const m = get('members', memberId), p = get('promotions', promoId);
    if (!m || !p) return { ok: false, error: 'Data tidak ditemukan.' };
    if (!p.pointsCost) return { ok: false, error: 'Reward ini tidak dapat ditukar dengan poin.' };
    if (m.points < p.pointsCost) return { ok: false, error: 'Poin tidak cukup.' };
    const code = 'V-' + Math.random().toString(36).slice(2, 8).toUpperCase();
    update('members', memberId, {
      points: m.points - p.pointsCost,
      pointsHistory: (m.pointsHistory || []).concat([{ date: today(), text: 'Tukar reward: ' + p.title, points: -p.pointsCost }]),
      vouchers: (m.vouchers || []).concat([{ id: uid('v'), code, promoId, title: p.title, date: today(), used: false }])
    });
    return { ok: true, code };
  }

  /* ---------- reservations ---------- */
  const weekday = s => parseYmd(s).getDay();
  function workingTherapists(date) { return all('therapists').filter(t => t.active && (t.days || []).includes(weekday(date))); }
  function checkSlot(date, time, duration, therapistId, ignoreId) {
    const s = settings(); const start = toMin(time), end = start + duration;
    if (start < toMin(s.openTime) || end > toMin(s.closeTime)) return { ok: false, error: 'Jam di luar operasional (' + s.openTime + '–' + s.closeTime + ').' };
    if (date === today() && start <= nowMin()) return { ok: false, error: 'Jam tersebut sudah lewat.' };
    const work = workingTherapists(date);
    if (therapistId && !work.some(t => t.id === therapistId)) return { ok: false, error: 'Terapis tidak bertugas pada tanggal tersebut.' };
    const ov = all('reservations').filter(r => r.id !== ignoreId && r.date === date && r.status !== 'cancelled' && toMin(r.time) < end && toMin(r.time) + (r.duration || 60) > start);
    if (therapistId && ov.some(r => r.therapistId === therapistId)) return { ok: false, error: 'Terapis sudah terjadwal pada jam tersebut.' };
    if (ov.length >= Math.max(1, work.length)) return { ok: false, error: 'Slot penuh. Pilih jam lain.' };
    return { ok: true };
  }
  function slotsFor(date, duration, therapistId, ignoreId) {
    const s = settings(); const out = []; const step = Math.max(15, +s.slotMinutes || 60);
    for (let m = toMin(s.openTime); m + duration <= toMin(s.closeTime); m += step) { const time = fromMin(m); out.push({ time, ok: checkSlot(date, time, duration, therapistId, ignoreId).ok }); }
    return out;
  }
  function nextCode(prefix, col, date) {
    const k = date.replace(/-/g, ''); const n = all(col).filter(x => (x.code || '').startsWith(prefix + k)).length + 1;
    let code = prefix + k + '-' + pad(n, 3), i = n;
    while (all(col).some(x => x.code === code)) { i++; code = prefix + k + '-' + pad(i, 3); }
    return code;
  }
  function createReservation(d, actor) {
    const svc = get('services', d.serviceId);
    if (!svc) return { ok: false, error: 'Pilih layanan terlebih dahulu.' };
    if (!d.customerName || !String(d.customerName).trim()) return { ok: false, error: 'Nama pelanggan wajib diisi.' };
    if (!d.date) return { ok: false, error: 'Pilih tanggal.' };
    if (d.date < today()) return { ok: false, error: 'Tanggal tidak boleh di masa lalu.' };
    if (!d.time) return { ok: false, error: 'Pilih jam.' };
    const c = checkSlot(d.date, d.time, svc.duration, d.therapistId || '', null);
    if (!c.ok) return c;
    const code = nextCode('RES', 'reservations', d.date);
    const item = insert('reservations', { code, memberId: d.memberId || null, customerName: String(d.customerName).trim(), phone: d.phone || '', serviceId: svc.id, serviceName: svc.name, duration: svc.duration, price: svc.price, therapistId: d.therapistId || '', date: d.date, time: d.time, notes: d.notes || '', status: d.status || 'pending', source: d.source || 'member' });
    notify({ title: 'Reservasi baru', msg: item.customerName + ' — ' + svc.name + ', ' + item.date + ' ' + item.time, type: 'reservation', roles: ['admin', 'supervisor'] });
    log('Reservasi ' + code + ' dibuat untuk ' + item.customerName, actor || item.customerName);
    return { ok: true, item };
  }
  function setReservationStatus(id, status, actor) {
    const r = get('reservations', id); if (!r) return null;
    const u = update('reservations', id, { status });
    const mem = r.memberId ? get('members', r.memberId) : null;
    const txt = { confirmed: ['Reservasi dikonfirmasi', 'Reservasi ' + r.serviceName + ' pada ' + r.date + ' ' + r.time + ' telah dikonfirmasi.'], serving: ['Pelayanan dimulai', r.customerName + ' sedang dilayani.'], done: ['Pelayanan selesai', 'Pelayanan ' + r.serviceName + ' untuk ' + r.customerName + ' selesai.'], cancelled: ['Reservasi dibatalkan', 'Reservasi ' + r.code + ' dibatalkan.'] }[status];
    if (txt) {
      notify({ title: txt[0], msg: txt[1], type: 'reservation', roles: ['admin', 'supervisor'] });
      if (mem && mem.userId) notify({ title: txt[0], msg: txt[1], type: 'reservation', userId: mem.userId });
    }
    log('Status ' + r.code + ' → ' + STATUS[status], actor);
    return u;
  }
  function canCancel(r) {
    if (!['pending', 'confirmed'].includes(r.status)) return false;
    const start = new Date(r.date + 'T' + r.time + ':00').getTime();
    return start - Date.now() >= (+settings().cancelHours || 0) * 3600000;
  }

  /* ---------- transactions ---------- */
  function validPromo(code, subtotal, member) {
    code = String(code || '').trim().toUpperCase(); if (!code) return { ok: false, error: 'Masukkan kode promo.' };
    const t = today(); let voucher = null;
    let p = all('promotions').find(x => x.code.toUpperCase() === code);
    if (!p && member) {
      voucher = (member.vouchers || []).find(v => v.code === code && !v.used);
      if (voucher) p = get('promotions', voucher.promoId);
    }
    if (!p) return { ok: false, error: 'Kode promo tidak ditemukan.' };
    if (!p.active) return { ok: false, error: 'Promo tidak aktif.' };
    if (p.startDate > t || p.endDate < t) return { ok: false, error: 'Promo di luar masa berlaku.' };
    if (p.minSpend && subtotal < p.minSpend) return { ok: false, error: 'Minimal belanja Rp ' + p.minSpend.toLocaleString('id-ID') + '.' };
    const disc = p.discType === 'percent' ? Math.round(subtotal * p.value / 100) : p.value;
    return { ok: true, promo: p, voucher, discount: Math.min(disc, subtotal) };
  }
  function awardPoints(tx) {
    if (!tx.memberId || tx.pointsAwarded || tx.payStatus !== 'lunas') return;
    const m = get('members', tx.memberId); if (!m) return;
    const p = Math.floor(tx.total / (+settings().pointRate || 10000));
    update('members', m.id, { points: m.points + p, pointsHistory: (m.pointsHistory || []).concat([{ date: tx.date, text: 'Transaksi ' + tx.code, points: p }]) });
    update('transactions', tx.id, { pointsAwarded: true });
  }
  function createTransaction(d, actor) {
    if (!d.items || !d.items.length) return { ok: false, error: 'Tambahkan minimal satu layanan.' };
    const subtotal = d.items.reduce((a, i) => a + i.price * i.qty, 0);
    const discount = Math.min(Math.max(0, +d.discount || 0), subtotal);
    const date = d.date || today();
    if ((d.payStatus || 'lunas') === 'lunas' && (d.method || 'tunai') === 'tunai' && d.paidAmount != null && +d.paidAmount < subtotal - discount) return { ok: false, error: 'Uang diterima kurang dari total tagihan.' };
    const item = insert('transactions', { code: nextCode('TRX', 'transactions', date), date, memberId: d.memberId || null, customerName: d.customerName || 'Pelanggan Umum', items: d.items, subtotal, discount, promoCode: d.promoCode || '', total: subtotal - discount, method: d.method || 'tunai', payStatus: d.payStatus || 'lunas', therapistId: d.therapistId || '', reservationId: d.reservationId || '', pointsAwarded: false, note: d.note || '', cashier: actor || '' });
    if ((d.payStatus || 'lunas') === 'lunas') { const pay = payInfo(d, item.total); if (!pay.ok) { remove('transactions', item.id); return pay; } update('transactions', item.id, pay.data); }
    if (d.voucherId && d.memberId) { const m = get('members', d.memberId); if (m) update('members', m.id, { vouchers: (m.vouchers || []).map(v => v.id === d.voucherId ? Object.assign({}, v, { used: true }) : v) }); }
    if (d.reservationId) setReservationStatus(d.reservationId, 'done', actor);
    awardPoints(item);
    const mem = item.memberId ? get('members', item.memberId) : null;
    const lunas = item.payStatus === 'lunas';
    notify({ title: lunas ? 'Pembayaran diterima' : 'Pembayaran tertunda', msg: item.code + ' · ' + item.customerName + ' · ' + METHOD[item.method] + ' · Rp ' + item.total.toLocaleString('id-ID'), type: lunas ? 'payment' : 'transaction', roles: ['admin', 'supervisor'] });
    if (mem && mem.userId) notify({ title: lunas ? 'Pembayaran berhasil' : 'Transaksi tercatat', msg: lunas ? 'Terima kasih! Pembayaran ' + item.code + ' via ' + METHOD[item.method] + ' diterima.' : 'Transaksi ' + item.code + ' tercatat, menunggu pembayaran.', type: lunas ? 'payment' : 'transaction', userId: mem.userId });
    log('Transaksi ' + item.code + ' Rp ' + item.total.toLocaleString('id-ID'), actor);
    return { ok: true, item: get('transactions', item.id) };
  }
  /* data pembayaran: tunai → uang diterima & kembalian; transfer/QRIS → nominal pas + referensi */
  function payInfo(d, total) {
    const method = d.method || 'tunai';
    if (method === 'tunai') {
      const paid = d.paidAmount == null || d.paidAmount === '' ? total : Math.round(+d.paidAmount);
      if (!(paid >= total)) return { ok: false, error: 'Uang diterima kurang dari total tagihan.' };
      return { ok: true, data: { paidAmount: paid, change: paid - total, paidAt: new Date().toISOString() } };
    }
    return { ok: true, data: { paidAmount: total, change: 0, payRef: String(d.payRef || '').trim(), payBank: String(d.payBank || '').trim(), paidAt: new Date().toISOString() } };
  }
  function markPaid(id, actor, pay) {
    const tx = get('transactions', id); if (!tx) return null;
    const d = Object.assign({ method: tx.method }, pay || {}); const p = payInfo(d, tx.total); if (!p.ok) return p;
    const u = update('transactions', id, Object.assign({ payStatus: 'lunas', method: d.method }, p.data)); awardPoints(u);
    notify({ title: 'Pembayaran diterima', msg: tx.code + ' · ' + tx.customerName + ' · ' + METHOD[d.method] + ' · Rp ' + tx.total.toLocaleString('id-ID'), type: 'payment', roles: ['admin', 'supervisor'] });
    log('Transaksi ' + tx.code + ' dilunasi via ' + METHOD[d.method], actor); return u;
  }
  function removeTransaction(id, actor) {
    const tx = get('transactions', id); if (!tx) return false;
    if (tx.pointsAwarded && tx.memberId) {
      const p = Math.floor(tx.total / (+settings().pointRate || 10000));
      adjustPoints(tx.memberId, -p, 'Pembatalan ' + tx.code);
    }
    log('Transaksi ' + tx.code + ' dihapus', actor);
    return remove('transactions', id);
  }

  /* ---------- backup ---------- */
  function backup() { const o = { app: 'kayuputih', version: VERSION, exportedAt: new Date().toISOString() }; COLS.forEach(c => o[c] = all(c)); return JSON.stringify(o, null, 2); }
  function restore(text) {
    let o; try { o = JSON.parse(text); } catch (e) { return { ok: false, error: 'File bukan JSON yang valid.' }; }
    if (!o || o.app !== 'kayuputih') return { ok: false, error: 'Bukan file backup Kayuputih.' };
    for (const c of COLS) { if (c === 'settings' ? typeof o[c] !== 'object' : !Array.isArray(o[c])) return { ok: false, error: 'Koleksi "' + c + '" tidak valid.' }; }
    if (!o.users.some(u => u.role === 'admin')) return { ok: false, error: 'Backup harus memuat minimal satu akun admin.' };
    silent++; COLS.forEach(c => write(c, o[c])); write('version', VERSION); silent--; emit('*');
    return { ok: true };
  }
  function reset() { silent++; COLS.forEach(c => localStorage.removeItem(PREFIX + c)); localStorage.removeItem(PREFIX + 'version'); seed(); silent--; emit('*'); }

  /* sinkron antar tab */
  if (global.addEventListener) global.addEventListener('storage', e => { if (e.key && e.key.indexOf(PREFIX) === 0 && e.key.indexOf('session') < 0) emit('*'); });

  global.DB = { PREFIX, COLS, STATUS, PAY, METHOD, uid, hash, pad, ymd, today, parseYmd, addDays, toMin, fromMin, level, levelNext,
    init, all, get, insert, update, remove, query, settings, saveSettings, notify, notifsFor, markRead, log,
    createMember, removeMember, memberStats, adjustPoints, redeem, nextMemberNumber,
    createReservation, setReservationStatus, canCancel, checkSlot, slotsFor, workingTherapists,
    validPromo, createTransaction, markPaid, payInfo, migrate, removeTransaction, awardPoints, backup, restore, reset, read, write };
  if (typeof module !== 'undefined') module.exports = global.DB;
})(typeof window !== 'undefined' ? window : globalThis);
