-- ============================================================
-- MIGRASI IDENTITAS SEKOLAH - TETAP MENGGUNAKAN SUPABASE LAMA
-- Sekolah baru: SMK Teknologi Nusantara
--
-- PENTING:
-- 1. SQL ini TIDAK membuat project Supabase baru.
-- 2. SQL ini TIDAK menghapus data siswa, akun Auth, jurusan,
--    asal sekolah, atau data seleksi yang sudah ada.
-- 3. Jurusan yang sudah ada TIDAK diubah.
-- 4. Jalankan SEKALI di Supabase lama -> SQL Editor.
-- ============================================================

begin;

-- Pastikan tabel identitas tersedia jika database lama sudah memakai
-- schema SPMB project ini.
create table if not exists public.school_settings (
  id uuid primary key default gen_random_uuid(),
  nama text not null default 'SMK Teknologi Nusantara',
  alamat text default 'Jl. Pendidikan No. 1, Jawa Timur',
  no_telp text default '',
  npsn text default '',
  tahun_pelajaran text default '2026/2027',
  logo_url text default '',
  target_siswa integer default 500,
  keunggulan text default 'Sekolah vokasi modern yang mengembangkan karakter, kompetensi, kreativitas, dan kesiapan menghadapi dunia kerja.',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Ubah identitas sekolah pada row yang sudah ada.
-- WHERE id IS NOT NULL sengaja dipakai agar aman pada mode safe-update.
update public.school_settings
set nama = 'SMK Teknologi Nusantara',
    alamat = coalesce(nullif(trim(alamat), ''), 'Jl. Pendidikan No. 1, Jawa Timur'),
    no_telp = coalesce(nullif(trim(no_telp), ''), '(0355) 700 2026'),
    npsn = coalesce(nullif(trim(npsn), ''), 'Belum diatur'),
    tahun_pelajaran = '2026/2027',
    target_siswa = 500,
    keunggulan = 'Sekolah vokasi modern yang mengembangkan karakter, kompetensi, kreativitas, dan kesiapan menghadapi dunia kerja.',
    updated_at = now()
where id is not null;

-- Jika belum ada setting sekolah, buat satu row.
insert into public.school_settings
  (nama, alamat, no_telp, npsn, tahun_pelajaran, target_siswa, keunggulan)
select
  'SMK Teknologi Nusantara',
  'Jl. Pendidikan No. 1, Jawa Timur',
  '(0355) 700 2026',
  'Belum diatur',
  '2026/2027',
  500,
  'Sekolah vokasi modern yang mengembangkan karakter, kompetensi, kreativitas, dan kesiapan menghadapi dunia kerja.'
where not exists (select 1 from public.school_settings);

-- Normalisasi nama sekolah lama pada konten pengumuman tanpa menyimpan nama lama di source code.
update public.pengumuman
set judul = regexp_replace(judul, 'SMK([[:space:]]|[[:punct:]])+(NEGERI|N)?[[:space:]]*2[[:space:]]*TRENGGALEK', 'SMK Teknologi Nusantara', 1, 0, 'i'),
    isi = regexp_replace(isi, 'SMK([[:space:]]|[[:punct:]])+(NEGERI|N)?[[:space:]]*2[[:space:]]*TRENGGALEK', 'SMK Teknologi Nusantara', 1, 0, 'i'),
    updated_at = now()
where id is not null;

commit;

-- ============================================================
-- HASIL YANG DIHARAPKAN
-- ============================================================
-- school_settings.nama = SMK Teknologi Nusantara
-- Data calon_siswa / Auth / profiles tetap dipertahankan.
-- Data jurusan tetap dipertahankan.
-- Tidak ada project Supabase baru yang dibuat.
