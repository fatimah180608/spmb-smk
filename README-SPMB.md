# SPMB SMK Teknologi Nusantara — Premium Redesign


Perubahan yang sudah dimasukkan:
- Foto gedung/sekolah lama dikembalikan untuk hero dan profil.
- Foto 7 jurusan tetap menggunakan gambar AI yang sudah ada.
- Logo 7 jurusan tetap digunakan.
- Foto Kepala Sekolah menggunakan foto yang diberikan di chat.
- Beranda dibuat bergaya portal sekolah: hero, Latest, News sidebar, Jurusan Unggulan, Profil Kepala Sekolah, statistik pendaftar.
- Berita memiliki data fallback sehingga tetap tampil meskipun tabel `pengumuman` Supabase masih kosong.
- Berita fallback dapat diklik ke halaman detail.
- Halaman Profil Sekolah memiliki bagian Kepala Sekolah.
- Logo sekolah memiliki fallback lokal `public/images/school-logo.png`.
- Supabase tetap dipakai jika konfigurasi `.env` tersedia.

## Menjalankan

Buka PowerShell:

```powershell
cd "C:\Users\siti fatimah\Downloads\spmb-smk-teknologi-nusantara\spmb-final"
npm install
npm run dev
```

Jika `npm install` berhasil, buka URL Vite yang tampil, biasanya:

`http://localhost:5173`

## Supabase

Salin `.env.example` menjadi `.env` dan isi:

```env
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

Data dari Supabase tetap diprioritaskan. Jika tabel jurusan/pengumuman belum berisi data, halaman publik memakai data fallback agar tidak putih/kosong.

## Catatan gambar

- `public/images/school-old.jpg` = foto sekolah lama yang dipulihkan dari screenshot yang diberikan.
- `public/images/jurusan/` = foto jurusan.
- `public/images/logos/` = logo jurusan.
- `public/images/kepala-sekolah.jpg` = foto kepala sekolah yang diberikan.
- `public/images/news/` = gambar berita dari tampilan sekolah yang diberikan.

## Fitur baru - Kartu, Hasil Seleksi, Notifikasi

Tambahan pada versi ini:
- Kartu Pendaftaran siswa di `/siswa/kartu` dan tombol cetak/simpan PDF melalui browser.
- Halaman Hasil Seleksi siswa di `/siswa/hasil-seleksi`.
- Dashboard siswa menampilkan notifikasi dan pengumuman terbaru.
- Saat admin menerbitkan pengumuman, akun siswa mendapat notifikasi.
- Saat admin menjalankan Proses Seleksi, hasil Diterima/Ditolak dan peringkat dikirim sebagai notifikasi ke akun siswa.

### SQL yang wajib dijalankan

Buka Supabase -> SQL Editor -> New Query, lalu jalankan:

`supabase/KARTU_PENGUMUMAN_NOTIFIKASI.sql`

Jalankan setelah schema dan SQL seleksi/nilai yang sudah digunakan project.

### Catatan

Nilai akhir tetap dihitung otomatis oleh database: Nilai Rapor 60% + Nilai Tes 40%. Admin tidak perlu mengisi Nilai Akhir secara manual.


### Perbaikan terbaru
Jalankan `supabase/FIX_FINAL_SPMB.sql` setelah database utama untuk memperbaiki lookup NISN, memisahkan berita dan pengumuman, notifikasi hasil seleksi, serta menghindari ketergantungan relationship cache pada halaman siswa.


## Seleksi otomatis & peringkat per jurusan
Jalankan `supabase/AUTO_PERINGKAT_DAN_SELEKSI.sql` di Supabase SQL Editor. Setelah itu setiap pendaftaran baru yang memiliki nilai akan langsung dihitung: nilai tertinggi diprioritaskan, maksimal sesuai kuota (default 36) dan pilihan 2 dipakai jika pilihan 1 penuh. Peringkat dihitung otomatis per jurusan dan dapat berubah ketika ada pendaftar baru atau nilai diubah.

## PERBAIKAN FINAL: PERINGKAT OTOMATIS

Gunakan **`supabase/AUTO_SELEKSI_TOP36_FINAL.sql`** sebagai SQL utama untuk sistem seleksi.

Setelah SQL dijalankan:
- siswa langsung mendapatkan nilai akhir, peringkat jurusan, dan status setelah daftar;
- kuota jurusan dipakai otomatis (default 36 bila kuota kosong/null);
- pilihan 1 diprioritaskan dan pilihan 2 dipakai jika pilihan 1 penuh;
- siswa di luar kuota tetap mendapat peringkat seperti #37 agar tahu posisinya;
- admin tidak perlu meluluskan siswa satu per satu;
- tombol admin hanya untuk **Perbarui Seleksi** jika kuota/data master diubah.

**Penting:** jangan jalankan SQL seleksi lama setelah SQL final ini karena file lama dapat menimpa fungsi seleksi otomatis.


## Seleksi otomatis final
Gunakan hanya `supabase/AUTO_SELEKSI_TOP36_FINAL.sql` untuk mesin seleksi otomatis.
Jalankan seluruh file tersebut sekali di Supabase SQL Editor. Script ini membersihkan trigger seleksi lama, menghitung nilai akhir, peringkat per jurusan, kuota, pilihan 1/2, dan status secara otomatis. Jangan menjalankan file SQL seleksi lama setelahnya.
