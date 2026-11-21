/* login.js — login multi-role, registrasi member, lupa password (simulasi) */
(function () {
  'use strict';
  DB.init(); UI.initTheme();
  const $ = UI.$, q = new URLSearchParams(location.search);
  $('#bLogo').innerHTML = UI.logo(120);
  const next = q.get('next') || '';

  const existing = Auth.current();
  if (existing) { location.replace(safeNext(existing) || Auth.HOME[existing.role]); return; }

  function safeNext(u) { // hanya izinkan halaman internal sesuai role
    if (!/^(member|admin|supervisor)\.html(#.*)?$/.test(next)) return '';
    return next.split('#')[0] === Auth.HOME[u.role] ? next : '';
  }

  if (q.get('msg') === 'reservasi') { const n = $('#notice'); n.hidden = false; n.textContent = 'Silakan masuk atau daftar sebagai Member untuk membuat reservasi.'; }

  const eyeBtn = $('[data-eye]'), pw = $('#password');
  eyeBtn.innerHTML = UI.icon('eye');
  eyeBtn.onclick = () => { const s = pw.type === 'password'; pw.type = s ? 'text' : 'password'; eyeBtn.innerHTML = UI.icon(s ? 'eyeoff' : 'eye'); eyeBtn.setAttribute('aria-label', s ? 'Sembunyikan password' : 'Tampilkan password'); };

  function tab(t) {
    $('#loginForm').hidden = t !== 'login'; $('#regForm').hidden = t !== 'register'; $('#forgotForm').hidden = t !== 'forgot';
    UI.$$('.tabs2 button').forEach(b => b.classList.toggle('on', b.dataset.tab === (t === 'forgot' ? 'login' : t)));
    $('#notice').hidden = t !== 'login' || q.get('msg') !== 'reservasi';
  }
  document.addEventListener('click', e => { const b = e.target.closest('[data-tab]'); if (b) tab(b.dataset.tab); });

  /* akun demo */
  const demos = [['member', 'member@kayuputih.demo', 'Member'], ['admin', 'admin@kayuputih.demo', 'Admin'], ['supervisor', 'supervisor@kayuputih.demo', 'Supervisor']];
  $('#demoList').innerHTML = demos.map(d => '<div class="demo-i"><span><b>' + d[2] + '</b> · ' + d[1] + '</span><button type="button" data-demo="' + d[0] + '">Gunakan</button></div>').join('');
  $('#demoList').addEventListener('click', e => {
    const b = e.target.closest('[data-demo]'); if (!b) return; const d = demos.find(x => x[0] === b.dataset.demo);
    $('#email').value = d[1]; pw.value = 'Kayuputih123'; $('input[name=role][value=' + d[0] + ']').checked = true; $('#loginErr').textContent = '';
  });

  $('#loginForm').addEventListener('submit', e => {
    e.preventDefault(); const err = $('#loginErr'); err.textContent = '';
    const role = $('input[name=role]:checked').value;
    const r = Auth.login($('#email').value, pw.value, role, $('#remember').checked);
    if (!r.ok) { err.textContent = r.error; return; }
    UI.toast('Selamat datang, ' + r.user.name + '!');
    const user = { role: r.user.role };
    setTimeout(() => location.replace(safeNext(user) || Auth.HOME[r.user.role]), 400);
  });

  $('#regForm').addEventListener('submit', e => {
    e.preventDefault(); const err = $('#regErr'); err.textContent = '';
    const r = Auth.register({ name: $('#rName').value, phone: $('#rPhone').value, email: $('#rEmail').value, birth: $('#rBirth').value, password: $('#rPass').value, confirm: $('#rConf').value });
    if (!r.ok) { err.textContent = r.error; return; }
    const l = Auth.login($('#rEmail').value, $('#rPass').value, 'member', false);
    UI.toast('Registrasi berhasil. Nomor member Anda ' + r.member.number);
    setTimeout(() => location.replace(l.ok && safeNext({ role: 'member' }) || Auth.HOME.member), 600);
  });

  /* lupa password (simulasi) */
  let fEmail = '';
  $('#fSend').onclick = () => {
    const err = $('#fErr'); err.textContent = '';
    const r = Auth.requestReset($('#fEmail').value);
    if (!r.ok) { err.textContent = r.error; return; }
    fEmail = $('#fEmail').value; $('#fStep1').hidden = true; $('#fStep2').hidden = false;
    $('#fCode').textContent = 'Kode reset (simulasi): ' + r.code + ' — berlaku 10 menit';
  };
  $('#fDone').onclick = () => {
    const err = $('#fErr'); err.textContent = '';
    const r = Auth.completeReset(fEmail, $('#fCodeIn').value, $('#fNew').value);
    if (!r.ok) { err.textContent = r.error; return; }
    UI.toast('Password berhasil diganti. Silakan masuk.'); $('#fStep1').hidden = false; $('#fStep2').hidden = true; $('#fNew').value = ''; $('#fCodeIn').value = ''; tab('login');
  };
})();

/* tombol kembali: bila datang dari halaman website ini, kembali ke halaman sebelumnya; jika tidak, ke beranda */
(function () { var b = document.getElementById('backBtn'); if (!b) return; b.addEventListener('click', function (e) { try { if (document.referrer && new URL(document.referrer).origin === location.origin && history.length > 1) { e.preventDefault(); history.back(); } } catch (x) { } }); })();
