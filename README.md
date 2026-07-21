# DiTz Store — Professional Static Edition

Website portfolio dan toko jasa DiTz Store berbasis HTML, CSS, dan JavaScript murni. Tidak membutuhkan API payment gateway, database, atau dependency frontend.

## Deploy ke Vercel

1. Import repository ini ke Vercel.
2. Vercel otomatis menjalankan `node build.js`.
3. Hasil build tersedia di folder `dist`.
4. Klik **Deploy** tanpa perlu mengisi environment variable.

## Struktur utama

- `index.html` — halaman utama
- `styles.css` — desain black-gold responsive
- `app.js` — portfolio, paket, checkout, dan WhatsApp
- `content.json` — data project, paket, kontak, DANA, dan jam pelayanan
- `ditz-control/` — panel admin tersembunyi untuk draft konten
- `build.js` — build static tanpa dependency
- `vercel.json` — konfigurasi deployment dan security headers

## Pembayaran

Pembayaran dilakukan manual melalui DANA. Website tidak menyimpan saldo dan tidak menganggap transaksi berhasil secara otomatis. Admin wajib mengecek transaksi sebelum memulai pengerjaan.

## Panel konten

Panel admin menggunakan mode static. Perubahan disimpan sebagai draft pada browser admin. Untuk memublikasikan perubahan bagi semua pengunjung, unduh `content.json` dari panel lalu ganti file tersebut di repository dan deploy ulang.
