/* =====================================================================
   auth.js — Autentikasi DEMO berbasis LocalStorage + proteksi role.
   PENTING: ini hanya untuk demonstrasi. Password di-hash sederhana di
   browser dan semua data ada di perangkat pengguna. Untuk produksi
   gunakan Firebase Authentication (atau backend) — lihat README.md.
   ===================================================================== */
(function (global) {
  'use strict';
  const SKEY = 'kp_session', LKEY = 'kp_lock', RKEY = 'kp_reset';
  const HOME = { member: 'member.html', admin: 'admin.html', supervisor: 'supervisor.html' };
  const ROLE_LABEL = { member: 'Member', admin: 'Admin', supervisor: 'Supervisor' };

  const norm = e => String(e || '').trim().toLowerCase().replace('kayupitih.demo', 'kayuputih.demo'); // toleransi salah ketik pada akun demo
  const jget = (st, k) => { try { return JSON.parse(st.getItem(k)); } catch (e) { return null; } };

  function readSession() {
    const s = jget(localStorage, SKEY) || jget(sessionStorage, SKEY);
    if (!s) return null;
    if (s.exp && s.exp < Date.now()) { clear(); return null; }
    return s;
  }
  function clear() { try { localStorage.removeItem(SKEY); sessionStorage.removeItem(SKEY); } catch (e) { } }
  function current() {
    const s = readSession(); if (!s) return null;
    const u = DB.get('users', s.userId);
    if (!u || !u.active) { clear(); return null; }
    return { id: u.id, name: u.name, email: u.email, role: u.role };
  }
  function validatePassword(p) {
    if (!p || p.length < 8) return 'Password minimal 8 karakter.';
    if (!/[A-Za-z]/.test(p) || !/\d/.test(p)) return 'Password harus mengandung huruf dan angka.';
    return '';
  }
  const validEmail = e => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

  function login(email, password, role, remember) {
    const lock = jget(localStorage, LKEY) || { n: 0, until: 0 };
    if (lock.until > Date.now()) return { ok: false, error: 'Terlalu banyak percobaan. Coba lagi dalam ' + Math.ceil((lock.until - Date.now()) / 1000) + ' detik.' };
    email = norm(email);
    if (!validEmail(email)) return { ok: false, error: 'Format email tidak valid.' };
    if (!password) return { ok: false, error: 'Password wajib diisi.' };
    const u = DB.all('users').find(x => x.email === email);
    if (!u || u.passHash !== DB.hash(password)) {
      lock.n++; if (lock.n >= 5) { lock.until = Date.now() + 60000; lock.n = 0; }
      localStorage.setItem(LKEY, JSON.stringify(lock));
      return { ok: false, error: 'Email atau password salah.' };
    }
    if (!u.active) return { ok: false, error: 'Akun dinonaktifkan. Hubungi Admin.' };
    if (role && u.role !== role) return { ok: false, error: 'Akun ini bukan akun ' + ROLE_LABEL[role] + '. Pilih akses "' + ROLE_LABEL[u.role] + '".' };
    localStorage.removeItem(LKEY);
    const s = JSON.stringify({ userId: u.id, role: u.role, exp: remember ? Date.now() + 30 * 864e5 : Date.now() + 12 * 36e5 });
    clear(); (remember ? localStorage : sessionStorage).setItem(SKEY, s);
    DB.log('Login ' + ROLE_LABEL[u.role] + ': ' + u.name, u.name, 'auth');
    return { ok: true, user: u };
  }
  function logout() { clear(); location.href = 'login.html'; }
  function guard(roles) {
    const u = current();
    if (!u) { location.replace('login.html?next=' + encodeURIComponent(location.pathname.split('/').pop() + location.hash)); return null; }
    if (roles && !roles.includes(u.role)) { location.replace(HOME[u.role]); return null; }
    return u;
  }
  function register(d) {
    const name = String(d.name || '').trim(), email = norm(d.email), phone = String(d.phone || '').replace(/[^\d+]/g, '');
    if (name.length < 3) return { ok: false, error: 'Nama minimal 3 karakter.' };
    if (!validEmail(email)) return { ok: false, error: 'Format email tidak valid.' };
    if (!/^(\+62|62|0)8\d{7,12}$/.test(phone)) return { ok: false, error: 'Nomor HP tidak valid (contoh 081234567890).' };
    const pe = validatePassword(d.password); if (pe) return { ok: false, error: pe };
    if (d.password !== d.confirm) return { ok: false, error: 'Konfirmasi password tidak sama.' };
    if (DB.all('users').some(u => u.email === email)) return { ok: false, error: 'Email sudah terdaftar.' };
    const r = DB.createMember({ name, email, phone, birth: d.birth || '', password: d.password });
    if (!r.ok) return r;
    return { ok: true, member: r.member };
  }
  /* Lupa password (simulasi): kode 6 digit dibuat di browser dan DITAMPILKAN di layar,
     karena tidak ada server email. Di produksi kode dikirim lewat email/WhatsApp. */
  function requestReset(email) {
    email = norm(email);
    const u = DB.all('users').find(x => x.email === email);
    if (!u) return { ok: false, error: 'Email tidak terdaftar.' };
    const code = String(Math.floor(100000 + Math.random() * 900000));
    sessionStorage.setItem(RKEY, JSON.stringify({ email, code, exp: Date.now() + 10 * 60000 }));
    return { ok: true, code };
  }
  function completeReset(email, code, pass) {
    const r = jget(sessionStorage, RKEY); email = norm(email);
    if (!r || r.email !== email || r.exp < Date.now() || String(code).trim() !== r.code) return { ok: false, error: 'Kode salah atau kedaluwarsa.' };
    const pe = validatePassword(pass); if (pe) return { ok: false, error: pe };
    const u = DB.all('users').find(x => x.email === email);
    DB.update('users', u.id, { passHash: DB.hash(pass) }); sessionStorage.removeItem(RKEY);
    DB.log('Reset password: ' + u.email, u.name, 'auth');
    return { ok: true };
  }
  function changePassword(userId, oldP, newP) {
    const u = DB.get('users', userId);
    if (!u || u.passHash !== DB.hash(oldP)) return { ok: false, error: 'Password lama salah.' };
    const pe = validatePassword(newP); if (pe) return { ok: false, error: pe };
    DB.update('users', userId, { passHash: DB.hash(newP) }); return { ok: true };
  }

  global.Auth = { HOME, ROLE_LABEL, current, login, logout, guard, register, requestReset, completeReset, changePassword, validatePassword, validEmail, norm };
  if (typeof module !== 'undefined') module.exports = global.Auth;
})(typeof window !== 'undefined' ? window : globalThis);
