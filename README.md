# Kayuputih Family Reflexology Palu — Website + Sistem Manajemen

Semua file berada di root (tanpa folder) dan siap diunggah ke GitHub Pages: unggah isi folder ini ke repository, lalu aktifkan Pages (branch `main`, folder `/root`).

## Halaman
| File | Fungsi |
|---|---|
| index.html, style.css, script.js | Landing page (konten dibaca dari database) |
| login.html/css/js | Login multi-role, registrasi member, lupa password |
| member.html/css/js | Dashboard Member |
| admin.html/css/js | Dashboard Admin |
| supervisor.html/css/js | Dashboard Supervisor |
| database.js, auth.js, components.js, charts.js, receipt.js | Lapisan data, autentikasi, UI bersama, grafik, struk |

## Akun demo (password `Kayuputih123`)
- member@kayuputih.demo · admin@kayuputih.demo · supervisor@kayuputih.demo

(Ejaan `kayupitih.demo` pada brief juga diterima.)

## Catatan penting
- **Autentikasi hanya demonstrasi.** Data dan hash password (cyrb53 + salt) ada di browser; siapa pun dengan akses DevTools dapat mengubahnya. Jangan dipakai untuk data nyata/produksi.
- **LocalStorage** hanya menyimpan data di browser/perangkat masing-masing — tidak sinkron antarperangkat atau pengguna. Gunakan Admin → Pengaturan → Data & Backup untuk backup/restore JSON.
- **Lupa password** disimulasikan: kode 6 digit ditampilkan di layar (tidak ada server email).
- Layanan, terapis, dan promo bertanda **DEMO** hanyalah contoh. Nomor telepon/WhatsApp/media sosial sengaja kosong; isi di Admin → Pengaturan. Rating 4,8 dan 209 ulasan berasal dari referensi Google Maps.
- Foto contoh dari Unsplash (URL); ganti lewat Admin (unggah atau URL). Logo bawaan digambar dengan SVG; unggah logo asli di Pengaturan → Identitas.

## Menuju Firebase
Semua akses data lewat `DB` (`all/get/insert/update/remove/query`) dan `Auth`. Ganti implementasinya dengan Firebase Realtime Database / Firebase Authentication tanpa mengubah halaman.
