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

## Pembaruan 2026 (PWA & tampilan)
- **Logo asli** (`logo.png`, `icon-*.png`, `favicon.png`) dipotong dari gambar logo Anda; menggantikan logo SVG buatan.
- **Loading screen 4 detik** di `index.html` (murni CSS + sedikit JS, tampil sekali per sesi browser).
- **PWA**: `manifest.webmanifest`, `sw.js`, `pwa.js`. Tombol ikon unduh muncul di header (dan di dashboard) saat browser mendukung instal; di iPhone tombol menampilkan panduan "Tambahkan ke Layar Utama". PWA hanya aktif lewat HTTPS (GitHub Pages sudah HTTPS).
- Semua path relatif, sehingga aman di sub-path seperti `/Pijat/`.
- Jika setelah update tampilan lama masih muncul, tutup lalu buka ulang aplikasi/tab (service worker memperbarui cache di latar belakang).

## Pembaruan v5 (Nov 2026)
- **Login**: tombol Kembali (tampil di HP & PC).
- **Kasir**: pembayaran Tunai (uang diterima + kembalian), Transfer (rekening + referensi), QRIS (gambar `qris.webp`, bisa diganti di Pengaturan → Pembayaran). Bayar nanti → Lunasi dari daftar transaksi. Filter bulan/status/metode.
- **Struk modern**: cetak 80mm/A4, unduh PNG, unduh PDF, bagikan (WhatsApp/aplikasi).
- **Desain 2026**: `modern.css` (header kaca, hero baru, carousel geser di HP, FAQ, marquee, navigasi bawah melayang, dark mode).
- **Data dummy**: 1 Okt 2026 s.d. hari ini, ±2× lebih ramai (±380 transaksi, ±300 reservasi, notifikasi pembayaran). Data lama dimigrasi otomatis (pengaturan, akun, dan data buatan sendiri dipertahankan).
- **Dashboard**: rekap per bulan, grafik 60/90 hari. **Pengaturan → Diagnostik & Uji**: cek bug data, ukur performa, uji beban +200 transaksi.
- QRIS bawaan = QRIS yang Anda unggah (atas nama Riki Hermawan). Ganti dengan QRIS Kayuputih sebelum dipakai nyata.
