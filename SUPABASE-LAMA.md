# Supabase Lama Tetap Dipakai

Project ini **tetap terhubung ke Supabase lama**.

## Yang dilakukan

- URL Supabase lama tetap digunakan dari `.env.local`.
- Publishable key Supabase lama tetap digunakan dari `.env.local`.
- Login siswa/admin tetap memakai Auth lama.
- Data `calon_siswa` lama tetap dipakai.
- Data `profiles` lama tetap dipakai.
- Data `jurusan` lama tetap dipakai.
- Data `asal_sekolah` lama tetap dipakai.
- Data seleksi/ranking lama tetap dipakai.
- Tidak membuat project Supabase baru.

## Mengganti identitas sekolah

Di Supabase lama buka **SQL Editor**, lalu jalankan satu kali:

`supabase/GANTI_IDENTITAS_SEKOLAH.sql`

SQL tersebut hanya mengubah identitas pada `school_settings` dan membersihkan nama sekolah lama yang mungkin masih tersimpan di pengumuman. Data siswa, akun, jurusan, dan seleksi tidak dihapus.

## Nama sekolah baru

**SMK Teknologi Nusantara**

Jurusan tetap:

1. Rekayasa Perangkat Lunak (RPL)
2. Desain Pemodelan dan Informasi Bangunan (DPIB)
3. Akuntansi
4. Teknik Pemesinan (TP)
5. Teknik Pendingin dan Tata Udara (TPTU)
6. Teknik Konstruksi dan Perumahan (TKP)
7. Kuliner
