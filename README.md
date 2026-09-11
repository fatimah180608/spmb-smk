# SPMB SMK Teknologi Nusantara — Modern React + Supabase

Project SPMB dengan tampilan modern, responsive, React/Vite, Tailwind CSS, Supabase Authentication, Database, Storage, dan React Router.

## Perbaikan penting

Versi sebelumnya memiliki masalah utama pada `PublicLayout.jsx`: route bersarang React Router menggunakan `<Outlet />`, bukan `children`. Akibatnya header dan footer muncul tetapi isi `/`, `/daftar`, `/jurusan`, dan halaman publik lain kosong. Versi ini sudah diperbaiki.

## Jalankan lokal

```bash
npm install
npm run dev
```

Buat file `.env.local` di folder yang sama dengan `package.json`:

```env
VITE_SUPABASE_URL=https://PROJECT-KAMU.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=PASTE_PUBLISHABLE_KEY
```

Setelah membuat/mengubah `.env.local`, restart Vite:

```bash
Ctrl+C
npm run dev
```

## Supabase

1. Buat project Supabase.
2. SQL Editor → New Query.
3. Jalankan seluruh `supabase/schema.sql`.
4. Pastikan Email Authentication aktif.
5. Untuk demo sekolah, jika ingin login langsung tanpa konfirmasi email, nonaktifkan konfirmasi email pada provider Email.
6. Ambil Project URL dan Publishable Key dari halaman Connect/API Keys.

## URL

- `/` — Landing page
- `/jurusan` — Jurusan
- `/berita` — Berita
- `/cara-daftar` — Cara daftar
- `/daftar` — Form pendaftaran
- `/cek-status` — Cek status
- `/admin/register` — Register admin
- `/admin/login` — Login admin
- `/admin` — Dashboard
- `/admin/calon-siswa` — CRUD calon siswa
- `/admin/jurusan` — CRUD jurusan
- `/admin/asal-sekolah` — CRUD asal sekolah
- `/admin/pengumuman` — CRUD pengumuman
- `/admin/statistik` — Statistik
- `/admin/settings` — Pengaturan sekolah

## Build

```bash
npm run build
```

Publish directory Netlify: `dist`

Environment variables Netlify:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`

`public/_redirects` sudah disediakan untuk React Router.


## Pemisahan Akun Siswa dan Admin

- `/siswa/register` = pendaftaran akun siswa. Role otomatis `student`.
- `/siswa/login` = login siswa.
- `/siswa` = portal siswa, hanya berisi fitur yang dibutuhkan untuk SPMB.
- `/daftar` = formulir SPMB dan hanya dapat dibuka setelah siswa login.
- `/admin/login` = login khusus administrator.
- Tidak ada register admin dari website. Admin dibuat melalui Supabase Dashboard lalu role dipromosikan menjadi `admin` menggunakan `supabase/ADMIN_SETUP.sql`.
- Admin dapat melihat seluruh jumlah pendaftar, statistik hari/bulan/tahun, data calon siswa, dan CRUD data master.
- Student hanya dapat membaca data pendaftarannya sendiri; RLS Supabase mencegah student membaca data calon siswa lain.

### Urutan database baru
1. Jalankan `supabase/schema.sql`.
2. Buat user admin di Supabase Authentication -> Users.
3. Sesuaikan email pada `supabase/ADMIN_SETUP.sql`, lalu jalankan query tersebut.
4. Buat akun siswa dari `/siswa/register`.

## Update UI: Profil, Foto Jurusan, dan Berita
- Tambahan halaman `/profil` untuk Profil Sekolah.
- Navigasi publik sekarang memiliki menu **Profil Sekolah**.
- Foto program keahlian menggunakan mapping `src/lib/schoolImages.js`.
- Foto berita menggunakan `SCHOOL_IMAGES.news`.
- Identitas demo menggunakan SMK Teknologi Nusantara. Tujuh konsentrasi keahlian tetap dipertahankan: RPL, DPIB, Akuntansi, TP, TPTU, TKP, dan Kuliner.

## Supabase lama tetap digunakan

Versi ini tidak membuat database Supabase baru. Konfigurasi `.env.local` tetap menggunakan project Supabase yang sudah dipakai sebelumnya. Untuk mengubah identitas sekolah menjadi **SMK Teknologi Nusantara** tanpa menghapus data siswa, akun, jurusan, dan seleksi, jalankan `supabase/GANTI_IDENTITAS_SEKOLAH.sql` satu kali di Supabase lama.
