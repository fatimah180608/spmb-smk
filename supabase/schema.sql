-- =========================================================
-- SPMB SMK TEKNOLOGI NUSANTARA - ROLE & SECURITY VERSION
-- Jalankan di Supabase -> SQL Editor -> New Query
-- =========================================================

create extension if not exists "pgcrypto";

create table if not exists public.school_settings (
  id uuid primary key default gen_random_uuid(),
  nama text not null default 'SMK Teknologi Nusantara',
  alamat text default 'Jl. Pendidikan No. 1, Jawa Timur',
  no_telp text default '',
  npsn text default '',
  tahun_pelajaran text default '2026/2027',
  logo_url text default '',
  target_siswa integer default 0,
  keunggulan text default 'Pembelajaran vokasi berbasis kompetensi dan pengembangan karakter.',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  nama text,
  role text not null default 'student',
  created_at timestamptz not null default now()
);

-- Upgrade database lama agar student menjadi role yang sah.
alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles add constraint profiles_role_check check (role in ('admin','student','staff'));
alter table public.profiles add column if not exists nama text;

create table if not exists public.jurusan (
  id uuid primary key default gen_random_uuid(),
  nama text not null unique,
  deskripsi text,
  kompetensi text,
  prospek text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.asal_sekolah (
  id uuid primary key default gen_random_uuid(),
  nama text not null,
  alamat text,
  created_at timestamptz not null default now()
);

create table if not exists public.pengumuman (
  id uuid primary key default gen_random_uuid(),
  judul text not null,
  isi text not null,
  published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.calon_siswa (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  nomor_pendaftaran text not null unique,
  nama text not null,
  nik text,
  nisn text,
  jenis_kelamin text,
  tempat_lahir text,
  tanggal_lahir date,
  alamat text,
  no_hp text,
  email text,
  nama_ayah text,
  nama_ibu text,
  asal_sekolah_id uuid references public.asal_sekolah(id) on delete set null,
  jurusan_id uuid references public.jurusan(id) on delete set null,
  pilihan_jurusan_1_id uuid references public.jurusan(id) on delete set null,
  pilihan_jurusan_2_id uuid references public.jurusan(id) on delete set null,
  jurusan_diterima_id uuid references public.jurusan(id) on delete set null,
  nilai_rapor numeric(5,2),
  nilai_tes numeric(5,2),
  nilai numeric(5,2),
  peringkat integer,
  status_seleksi text not null default 'menunggu' check (status_seleksi in ('menunggu','diterima','tidak_diterima')),
  status text not null default 'Menunggu Verifikasi'
    check (status in ('Menunggu Verifikasi','Diterima','Ditolak')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.calon_siswa add column if not exists user_id uuid references auth.users(id) on delete set null;
create index if not exists calon_siswa_user_idx on public.calon_siswa(user_id);
create index if not exists calon_siswa_created_idx on public.calon_siswa(created_at desc);
create index if not exists calon_siswa_status_idx on public.calon_siswa(status);
create index if not exists calon_siswa_jurusan_idx on public.calon_siswa(jurusan_id);
create index if not exists calon_siswa_pilihan1_idx on public.calon_siswa(pilihan_jurusan_1_id);
create index if not exists calon_siswa_pilihan2_idx on public.calon_siswa(pilihan_jurusan_2_id);
create index if not exists calon_siswa_diterima_idx on public.calon_siswa(jurusan_diterima_id);
create index if not exists calon_siswa_nilai_idx on public.calon_siswa(nilai desc);

alter table public.calon_siswa drop constraint if exists calon_siswa_nilai_rapor_check;
alter table public.calon_siswa add constraint calon_siswa_nilai_rapor_check check (nilai_rapor is null or (nilai_rapor >= 0 and nilai_rapor <= 100));
alter table public.calon_siswa drop constraint if exists calon_siswa_nilai_tes_check;
alter table public.calon_siswa add constraint calon_siswa_nilai_tes_check check (nilai_tes is null or (nilai_tes >= 0 and nilai_tes <= 100));

create or replace function public.hitung_nilai_akhir_spmb()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.nilai_rapor is not null and new.nilai_tes is not null then
    new.nilai := round((new.nilai_rapor * 0.60 + new.nilai_tes * 0.40)::numeric, 2);
  end if;
  return new;
end;
$$;

drop trigger if exists trg_hitung_nilai_akhir_spmb on public.calon_siswa;
create trigger trg_hitung_nilai_akhir_spmb
before insert or update of nilai_rapor, nilai_tes on public.calon_siswa
for each row execute function public.hitung_nilai_akhir_spmb();

-- =========================================================
-- HELPER ROLE
-- =========================================================
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

grant execute on function public.is_admin() to authenticated;

-- Akun baru melalui Supabase Auth otomatis menjadi STUDENT.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, nama, role)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'nama', ''), 'student')
  on conflict (id) do update
    set email = excluded.email,
        nama = coalesce(nullif(excluded.nama, ''), public.profiles.nama);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

-- Buat profile student untuk akun lama yang belum memiliki profile.
insert into public.profiles (id, email, role)
select u.id, u.email, 'student'
from auth.users u
left join public.profiles p on p.id = u.id
where p.id is null;

-- =========================================================
-- RLS
-- =========================================================
alter table public.school_settings enable row level security;
alter table public.profiles enable row level security;
alter table public.jurusan enable row level security;
alter table public.asal_sekolah enable row level security;
alter table public.pengumuman enable row level security;
alter table public.calon_siswa enable row level security;

-- Hapus policy lama supaya script aman dijalankan ulang.
drop policy if exists "public read school settings" on public.school_settings;
drop policy if exists "authenticated manage school settings" on public.school_settings;
drop policy if exists "public read jurusan" on public.jurusan;
drop policy if exists "authenticated manage jurusan" on public.jurusan;
drop policy if exists "public read asal sekolah" on public.asal_sekolah;
drop policy if exists "authenticated manage asal sekolah" on public.asal_sekolah;
drop policy if exists "public read published announcements" on public.pengumuman;
drop policy if exists "authenticated manage announcements" on public.pengumuman;
drop policy if exists "public insert calon siswa" on public.calon_siswa;
drop policy if exists "authenticated manage calon siswa" on public.calon_siswa;
drop policy if exists "student read own calon siswa" on public.calon_siswa;
drop policy if exists "student insert own calon siswa" on public.calon_siswa;
drop policy if exists "admin manage calon siswa" on public.calon_siswa;
drop policy if exists "profile owner read" on public.profiles;
drop policy if exists "profile owner insert" on public.profiles;
drop policy if exists "profile owner update" on public.profiles;
drop policy if exists "admin manage profiles" on public.profiles;

-- Informasi publik boleh dibaca siapa saja.
create policy "public read school settings" on public.school_settings
for select to anon, authenticated using (true);

create policy "public read jurusan" on public.jurusan
for select to anon, authenticated using (true);

create policy "public read asal sekolah" on public.asal_sekolah
for select to anon, authenticated using (true);

create policy "public read published announcements" on public.pengumuman
for select to anon, authenticated using (published = true);

-- Hanya ADMIN yang boleh CRUD data master dan pengumuman.
create policy "admin manage school settings" on public.school_settings
for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "admin manage jurusan" on public.jurusan
for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "admin manage asal sekolah" on public.asal_sekolah
for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "admin manage announcements" on public.pengumuman
for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- Student hanya boleh melihat dan membuat data miliknya sendiri.
create policy "student read own calon siswa" on public.calon_siswa
for select to authenticated
using (user_id = auth.uid() or public.is_admin());

create policy "student insert own calon siswa" on public.calon_siswa
for insert to authenticated
with check (user_id = auth.uid() and not public.is_admin());

-- Admin dapat melihat, mengubah status, dan menghapus seluruh pendaftar.
create policy "admin manage calon siswa" on public.calon_siswa
for all to authenticated
using (public.is_admin()) with check (public.is_admin());

-- Profile: user boleh membaca/memperbarui profile sendiri, admin boleh mengelola profile.
create policy "profile owner read" on public.profiles
for select to authenticated
using (auth.uid() = id or public.is_admin());

create policy "profile owner insert" on public.profiles
for insert to authenticated
with check (auth.uid() = id and role = 'student');

create policy "profile owner update" on public.profiles
for update to authenticated
using (auth.uid() = id or public.is_admin())
with check ((auth.uid() = id and role = 'student') or public.is_admin());

create policy "admin manage profiles" on public.profiles
for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- =========================================================
-- SELEKSI SPMB: NILAI TERTINGGI + 2 PILIHAN JURUSAN
-- =========================================================
alter table public.calon_siswa add column if not exists pilihan_jurusan_1_id uuid references public.jurusan(id) on delete set null;
alter table public.calon_siswa add column if not exists pilihan_jurusan_2_id uuid references public.jurusan(id) on delete set null;
alter table public.calon_siswa add column if not exists jurusan_diterima_id uuid references public.jurusan(id) on delete set null;
alter table public.calon_siswa add column if not exists nilai_rapor numeric(5,2);
alter table public.calon_siswa add column if not exists nilai_tes numeric(5,2);
alter table public.calon_siswa add column if not exists nilai numeric(5,2);
alter table public.calon_siswa add column if not exists peringkat integer;
alter table public.calon_siswa add column if not exists status_seleksi text default 'menunggu';
alter table public.calon_siswa drop constraint if exists calon_siswa_status_seleksi_check;
alter table public.calon_siswa add constraint calon_siswa_status_seleksi_check check (status_seleksi in ('menunggu','diterima','tidak_diterima'));
alter table public.jurusan add column if not exists kuota integer default 36;

-- Data lama yang hanya punya satu jurusan dianggap sebagai pilihan pertama.
update public.calon_siswa
set pilihan_jurusan_1_id = jurusan_id
where pilihan_jurusan_1_id is null and jurusan_id is not null;

create or replace function public.proses_seleksi_spmb()
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  calon record;
  kuota_terpakai integer;
  kuota_pilihan integer;
  peringkat_counter integer := 0;
  pilihan1 uuid;
  pilihan2 uuid;
  diterima uuid;
begin
  if not public.is_admin() then
    raise exception 'Hanya admin yang dapat menjalankan proses seleksi.';
  end if;

  update public.calon_siswa
  set jurusan_diterima_id = null,
      status_seleksi = 'menunggu',
      peringkat = null,
      status = 'Menunggu Verifikasi';

  for calon in
    select id, pilihan_jurusan_1_id, pilihan_jurusan_2_id, jurusan_id, nilai, created_at
    from public.calon_siswa
    where nilai is not null
    order by nilai desc, created_at asc, id asc
  loop
    peringkat_counter := peringkat_counter + 1;

    update public.calon_siswa
    set peringkat = peringkat_counter
    where id = calon.id;

    pilihan1 := coalesce(calon.pilihan_jurusan_1_id, calon.jurusan_id);
    pilihan2 := calon.pilihan_jurusan_2_id;
    diterima := null;

    if pilihan1 is not null then
      select count(*) into kuota_terpakai
      from public.calon_siswa
      where jurusan_diterima_id = pilihan1
        and status_seleksi = 'diterima';

      select coalesce(kuota, 0) into kuota_pilihan
      from public.jurusan where id = pilihan1;

      if kuota_terpakai < kuota_pilihan then
        diterima := pilihan1;
      end if;
    end if;

    if diterima is null and pilihan2 is not null and pilihan2 <> pilihan1 then
      select count(*) into kuota_terpakai
      from public.calon_siswa
      where jurusan_diterima_id = pilihan2
        and status_seleksi = 'diterima';

      select coalesce(kuota, 0) into kuota_pilihan
      from public.jurusan where id = pilihan2;

      if kuota_terpakai < kuota_pilihan then
        diterima := pilihan2;
      end if;
    end if;

    if diterima is not null then
      update public.calon_siswa
      set jurusan_diterima_id = diterima,
          status_seleksi = 'diterima',
          status = 'Diterima'
      where id = calon.id;
    else
      update public.calon_siswa
      set status_seleksi = 'tidak_diterima',
          status = 'Ditolak'
      where id = calon.id;
    end if;
  end loop;

  return json_build_object(
    'success', true,
    'message', 'Seleksi SPMB berhasil diproses berdasarkan nilai tertinggi dan dua pilihan jurusan.'
  );
end;
$$;

grant execute on function public.proses_seleksi_spmb() to authenticated;

-- =========================================================
-- PUBLIC STATUS CHECK RPC
-- =========================================================
drop function if exists public.check_registration(text);

create or replace function public.check_registration(p_nisn text)
returns table (
  nomor_pendaftaran text,
  nama text,
  nisn text,
  status text,
  jurusan_nama text,
  pilihan_jurusan_1_nama text,
  pilihan_jurusan_2_nama text,
  nilai_rapor numeric,
  nilai_tes numeric,
  nilai numeric,
  peringkat integer,
  asal_sekolah_nama text
)
language sql
security definer
set search_path = public
as $$
  select c.nomor_pendaftaran, c.nama, c.nisn, c.status,
         coalesce(jd.nama, j1.nama) as jurusan_nama,
         j1.nama as pilihan_jurusan_1_nama,
         j2.nama as pilihan_jurusan_2_nama,
         c.nilai_rapor, c.nilai_tes, c.nilai, c.peringkat, a.nama as asal_sekolah_nama
  from public.calon_siswa c
  left join public.jurusan jd on jd.id = c.jurusan_diterima_id
  left join public.jurusan j1 on j1.id = coalesce(c.pilihan_jurusan_1_id, c.jurusan_id)
  left join public.jurusan j2 on j2.id = c.pilihan_jurusan_2_id
  left join public.asal_sekolah a on a.id = c.asal_sekolah_id
  where c.nisn = trim(p_nisn)
  limit 1;
$$;

grant execute on function public.check_registration(text) to anon, authenticated;

-- =========================================================
-- SEED
-- =========================================================
insert into public.school_settings (nama, alamat, no_telp, npsn, tahun_pelajaran, target_siswa, keunggulan)
select 'SMK Teknologi Nusantara', 'Jl. Pendidikan No. 1, Jawa Timur', '', '', '2026/2027', 500,
       'Sekolah vokasi dengan pembelajaran berbasis kompetensi, karakter, dan kesiapan menghadapi dunia kerja.'
where not exists (select 1 from public.school_settings);

insert into public.jurusan (nama, deskripsi, kompetensi, prospek) values
('Rekayasa Perangkat Lunak (RPL)', 'Mempelajari pengembangan perangkat lunak, website, aplikasi, dan sistem informasi.', 'Pemrograman web, basis data, UI/UX, pengembangan aplikasi.', 'Software developer, web developer, UI/UX, database, wirausaha digital.'),
('Desain Pemodelan dan Informasi Bangunan (DPIB)', 'Mempelajari gambar bangunan, pemodelan, dan informasi konstruksi.', 'CAD, gambar teknik, pemodelan bangunan, dokumentasi proyek.', 'Drafter, BIM, estimator, konsultan, wirausaha.'),
('Akuntansi', 'Mempelajari pencatatan dan pengelolaan keuangan organisasi maupun usaha.', 'Akuntansi dasar, laporan keuangan, administrasi, aplikasi akuntansi.', 'Staf keuangan, administrasi, akuntansi, wirausaha.'),
('Teknik Pemesinan (TP)', 'Mempelajari proses pemesinan dan pembuatan komponen teknik.', 'Gambar teknik, mesin perkakas, CNC, pengukuran.', 'Operator mesin, teknisi, manufaktur, wirausaha.'),
('Teknik Pendingin dan Tata Udara (TPTU)', 'Mempelajari instalasi, perawatan, dan perbaikan sistem pendingin dan tata udara.', 'AC, refrigerasi, instalasi, perawatan, troubleshooting.', 'Teknisi HVAC, teknisi AC, maintenance, wirausaha.'),
('Teknik Konstruksi dan Perumahan (TKP)', 'Mempelajari konstruksi, pekerjaan bangunan, dan pengelolaan proyek.', 'Konstruksi, gambar kerja, estimasi, keselamatan kerja.', 'Pelaksana konstruksi, estimator, drafter, wirausaha.'),
('Kuliner', 'Mempelajari pengolahan makanan, pelayanan, dan pengembangan usaha kuliner.', 'Pengolahan makanan, pastry, tata hidang, sanitasi, bisnis.', 'Chef, baker, food entrepreneur, katering, industri hospitality.')
on conflict (nama) do nothing;

insert into public.asal_sekolah (nama, alamat)
select 'SMP/MTs Asal - Tambahkan di Admin', ''
where not exists (select 1 from public.asal_sekolah);

insert into public.pengumuman (judul, isi, published)
select 'Pendaftaran SPMB Dibuka', 'Selamat datang di portal SPMB SMK Teknologi Nusantara. Silakan buat akun siswa, lengkapi formulir pendaftaran, dan simpan nomor pendaftaran Anda.', true
where not exists (select 1 from public.pengumuman);

-- Storage logo sekolah.
insert into storage.buckets (id, name, public)
values ('school-assets', 'school-assets', true)
on conflict (id) do nothing;

drop policy if exists "public read school assets" on storage.objects;
drop policy if exists "authenticated upload school assets" on storage.objects;
drop policy if exists "authenticated update school assets" on storage.objects;
drop policy if exists "authenticated delete school assets" on storage.objects;

create policy "public read school assets" on storage.objects
for select to public using (bucket_id = 'school-assets');

create policy "admin upload school assets" on storage.objects
for insert to authenticated with check (bucket_id = 'school-assets' and public.is_admin());

create policy "admin update school assets" on storage.objects
for update to authenticated using (bucket_id = 'school-assets' and public.is_admin()) with check (bucket_id = 'school-assets' and public.is_admin());

create policy "admin delete school assets" on storage.objects
for delete to authenticated using (bucket_id = 'school-assets' and public.is_admin());

-- =========================================================
-- CARA MEMBUAT ADMIN
-- 1. Buat user lewat Supabase Dashboard -> Authentication -> Users -> Add user.
-- 2. Setelah email user diketahui, jalankan:
--    update public.profiles set role='admin' where email='admin@sekolah.sch.id';
-- Jangan memberikan role admin kepada akun siswa.
-- =========================================================


-- =========================================================
-- LATEST FIX INCLUDED: see FIX_FINAL_SPMB.sql
-- =========================================================
-- =========================================================
-- SPMB FIX: RELATIONSHIP, NISN, BERITA TERPISAH, PENGUMUMAN, NOTIFIKASI
-- Jalankan SEKALI di Supabase SQL Editor. Bisa dijalankan ulang.
-- =========================================================

create extension if not exists "pgcrypto";

-- 1) Pastikan kolom seleksi/nilai ada
alter table public.calon_siswa add column if not exists pilihan_jurusan_1_id uuid references public.jurusan(id) on delete set null;
alter table public.calon_siswa add column if not exists pilihan_jurusan_2_id uuid references public.jurusan(id) on delete set null;
alter table public.calon_siswa add column if not exists jurusan_diterima_id uuid references public.jurusan(id) on delete set null;
alter table public.calon_siswa add column if not exists nilai_rapor numeric(5,2);
alter table public.calon_siswa add column if not exists nilai_tes numeric(5,2);
alter table public.calon_siswa add column if not exists nilai numeric(5,2);
alter table public.calon_siswa add column if not exists peringkat integer;
alter table public.calon_siswa add column if not exists status_seleksi text default 'menunggu';
alter table public.jurusan add column if not exists kuota integer default 36;
update public.jurusan set kuota=36 where kuota is null or kuota<=0;

-- 2) Nilai akhir otomatis
create or replace function public.hitung_nilai_akhir_spmb()
returns trigger language plpgsql set search_path=public as $$
begin
  if new.nilai_rapor is not null and new.nilai_tes is not null then
    new.nilai := round((new.nilai_rapor*0.60 + new.nilai_tes*0.40)::numeric,2);
  end if;
  return new;
end;
$$;
drop trigger if exists trg_hitung_nilai_akhir_spmb on public.calon_siswa;
create trigger trg_hitung_nilai_akhir_spmb before insert or update of nilai_rapor,nilai_tes on public.calon_siswa for each row execute function public.hitung_nilai_akhir_spmb();

-- 3) Tabel berita dipisahkan dari pengumuman
create table if not exists public.berita (
  id uuid primary key default gen_random_uuid(),
  judul text not null,
  isi text not null,
  image text,
  published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.berita enable row level security;
drop policy if exists "public read published berita" on public.berita;
drop policy if exists "admin manage berita" on public.berita;
create policy "public read published berita" on public.berita for select to anon,authenticated using (published=true);
create policy "admin manage berita" on public.berita for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- 4) Notifikasi siswa
create table if not exists public.notifikasi (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  calon_siswa_id uuid references public.calon_siswa(id) on delete cascade,
  judul text not null,
  isi text not null,
  tipe text not null default 'informasi' check (tipe in ('informasi','hasil_seleksi','pengumuman')),
  dibaca boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists notifikasi_user_idx on public.notifikasi(user_id,created_at desc);
alter table public.notifikasi enable row level security;
drop policy if exists "student read own notifications" on public.notifikasi;
drop policy if exists "student update own notifications" on public.notifikasi;
drop policy if exists "admin manage notifications" on public.notifikasi;
create policy "student read own notifications" on public.notifikasi for select to authenticated using (user_id=auth.uid() or public.is_admin());
create policy "student update own notifications" on public.notifikasi for update to authenticated using (user_id=auth.uid()) with check (user_id=auth.uid());
create policy "admin manage notifications" on public.notifikasi for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- 5) Pengumuman -> notifikasi semua akun siswa
create or replace function public.kirim_notifikasi_pengumuman()
returns trigger language plpgsql security definer set search_path=public as $$
begin
  if new.published=true and (tg_op='INSERT' or coalesce(old.published,false)=false) then
    insert into public.notifikasi(user_id,judul,isi,tipe)
    select p.id,'Pengumuman Baru: '||new.judul,left(new.isi,500),'pengumuman'
    from public.profiles p
    where p.role='student'
      and not exists (select 1 from public.notifikasi n where n.user_id=p.id and n.tipe='pengumuman' and n.judul='Pengumuman Baru: '||new.judul);
  end if;
  return new;
end;
$$;
drop trigger if exists trg_notifikasi_pengumuman on public.pengumuman;
create trigger trg_notifikasi_pengumuman after insert or update of published on public.pengumuman for each row execute function public.kirim_notifikasi_pengumuman();

-- 6) Seleksi otomatis + peringkat + notifikasi hasil
drop function if exists public.proses_seleksi_spmb();
create or replace function public.proses_seleksi_spmb()
returns json language plpgsql security definer set search_path=public as $$
declare
  calon record; kuota_terpakai integer; kuota_pilihan integer; peringkat_counter integer:=0; pilihan1 uuid; pilihan2 uuid; diterima uuid; nama_jurusan text;
begin
  if not public.is_admin() then raise exception 'Hanya admin yang dapat menjalankan proses seleksi.'; end if;
  update public.calon_siswa set jurusan_diterima_id=null,status_seleksi='menunggu',peringkat=null,status='Menunggu Verifikasi';
  delete from public.notifikasi where tipe='hasil_seleksi';
  for calon in select id,user_id,nama,pilihan_jurusan_1_id,pilihan_jurusan_2_id,jurusan_id,nilai,created_at from public.calon_siswa where nilai is not null order by nilai desc,created_at asc,id asc loop
    peringkat_counter:=peringkat_counter+1;
    update public.calon_siswa set peringkat=peringkat_counter where id=calon.id;
    pilihan1:=coalesce(calon.pilihan_jurusan_1_id,calon.jurusan_id); pilihan2:=calon.pilihan_jurusan_2_id; diterima:=null; nama_jurusan:=null;
    if pilihan1 is not null then
      select count(*) into kuota_terpakai from public.calon_siswa where jurusan_diterima_id=pilihan1 and status_seleksi='diterima';
      select coalesce(kuota,0) into kuota_pilihan from public.jurusan where id=pilihan1;
      if kuota_terpakai<kuota_pilihan then diterima:=pilihan1; end if;
    end if;
    if diterima is null and pilihan2 is not null and pilihan2<>pilihan1 then
      select count(*) into kuota_terpakai from public.calon_siswa where jurusan_diterima_id=pilihan2 and status_seleksi='diterima';
      select coalesce(kuota,0) into kuota_pilihan from public.jurusan where id=pilihan2;
      if kuota_terpakai<kuota_pilihan then diterima:=pilihan2; end if;
    end if;
    if diterima is not null then
      update public.calon_siswa set jurusan_diterima_id=diterima,status_seleksi='diterima',status='Diterima' where id=calon.id;
      select nama into nama_jurusan from public.jurusan where id=diterima;
    else
      update public.calon_siswa set status_seleksi='tidak_diterima',status='Ditolak' where id=calon.id;
    end if;
    if calon.user_id is not null then
      insert into public.notifikasi(user_id,calon_siswa_id,judul,isi,tipe) values(
        calon.user_id,calon.id,
        case when diterima is not null then 'Hasil Seleksi SPMB' else 'Hasil Seleksi SPMB' end,
        case when diterima is not null then 'Hasil seleksi sudah tersedia. Kamu lulus di jurusan '||coalesce(nama_jurusan,'-')||'. Peringkat #'||peringkat_counter||' dengan nilai akhir '||to_char(calon.nilai,'FM990.00')||'.' else 'Hasil seleksi sudah tersedia. Kamu belum lulus pada pilihan jurusan yang tersedia. Peringkat #'||peringkat_counter||' dengan nilai akhir '||to_char(calon.nilai,'FM990.00')||'.' end,
        'hasil_seleksi');
    end if;
  end loop;
  return json_build_object('success',true,'message','Seleksi berhasil diproses. Peringkat dan notifikasi siswa telah diperbarui.');
end;
$$;
grant execute on function public.proses_seleksi_spmb() to authenticated;

-- 7) Cek status publik berdasarkan NISN. DROP dulu agar return type aman.
drop function if exists public.check_registration(text);
create or replace function public.check_registration(p_nisn text)
returns table(nomor_pendaftaran text,nama text,nisn text,status text,jurusan_nama text,pilihan_jurusan_1_nama text,pilihan_jurusan_2_nama text,nilai_rapor numeric,nilai_tes numeric,nilai numeric,peringkat integer,asal_sekolah_nama text)
language sql security definer set search_path=public as $$
  select c.nomor_pendaftaran,c.nama,c.nisn,c.status,coalesce(jd.nama,j1.nama),j1.nama,j2.nama,c.nilai_rapor,c.nilai_tes,c.nilai,c.peringkat,a.nama
  from public.calon_siswa c
  left join public.jurusan jd on jd.id=c.jurusan_diterima_id
  left join public.jurusan j1 on j1.id=coalesce(c.pilihan_jurusan_1_id,c.jurusan_id)
  left join public.jurusan j2 on j2.id=c.pilihan_jurusan_2_id
  left join public.asal_sekolah a on a.id=c.asal_sekolah_id
  where c.nisn=trim(p_nisn) limit 1;
$$;
grant execute on function public.check_registration(text) to anon,authenticated;

-- 8) Isi data lama: jika pilihan 1 kosong, gunakan jurusan_id.
update public.calon_siswa set pilihan_jurusan_1_id=jurusan_id where pilihan_jurusan_1_id is null and jurusan_id is not null;

-- 9) Opsional: jadikan NISN unik setelah memastikan tidak ada duplikat.
-- create unique index if not exists calon_siswa_nisn_unique_idx on public.calon_siswa(nisn) where nisn is not null and nisn<>'';


-- ============================================================
-- AUTO PERINGKAT & SELEKSI SPMB
-- Sistem:
-- 1. Nilai akhir = Rapor 60% + Tes 40%
-- 2. Semua calon yang punya nilai diurutkan dari nilai tertinggi
-- 3. Pilihan 1 diprioritaskan, lalu pilihan 2 jika kuota penuh
-- 4. Maksimal sesuai kuota jurusan (default 36)
-- 5. Peringkat otomatis dibuat PER JURUSAN
-- 6. Setelah siswa mendaftar, ranking/status langsung diperbarui
-- ============================================================

create or replace function public._hitung_seleksi_spmb()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  calon record;
  kuota_terpakai integer;
  kuota_pilihan integer;
  pilihan1 uuid;
  pilihan2 uuid;
  diterima uuid;
  jumlah integer := 0;
  rank_count integer := 0;
  nama_jurusan text;
begin
  -- Cegah dua proses seleksi berjalan bersamaan.
  perform pg_advisory_xact_lock(hashtext('spmb-auto-selection'));

  -- Bersihkan hasil sebelumnya. Nilai input siswa tetap aman.
  update public.calon_siswa
  set jurusan_diterima_id = null,
      status_seleksi = 'menunggu',
      peringkat = null,
      status = 'Menunggu Seleksi'
  where nilai is not null;

  -- Calon tanpa nilai belum masuk ranking/seleksi.
  update public.calon_siswa
  set jurusan_diterima_id = null,
      status_seleksi = 'menunggu',
      peringkat = null,
      status = 'Menunggu Nilai'
  where nilai is null;

  -- Proses dari nilai tertinggi.
  for calon in
    select id, user_id, nama,
           pilihan_jurusan_1_id,
           pilihan_jurusan_2_id,
           jurusan_id,
           nilai,
           created_at
    from public.calon_siswa
    where nilai is not null
      and coalesce(pilihan_jurusan_1_id, jurusan_id) is not null
    order by nilai desc, created_at asc, id asc
  loop
    jumlah := jumlah + 1;
    pilihan1 := coalesce(calon.pilihan_jurusan_1_id, calon.jurusan_id);
    pilihan2 := calon.pilihan_jurusan_2_id;
    diterima := null;

    -- Coba pilihan 1.
    select coalesce(j.kuota, 36)
      into kuota_pilihan
    from public.jurusan j
    where j.id = pilihan1;

    select count(*)
      into kuota_terpakai
    from public.calon_siswa c
    where c.jurusan_diterima_id = pilihan1
      and c.status_seleksi = 'diterima';

    if pilihan1 is not null and kuota_terpakai < coalesce(kuota_pilihan, 36) then
      diterima := pilihan1;
    end if;

    -- Kalau pilihan 1 penuh, coba pilihan 2.
    if diterima is null and pilihan2 is not null and pilihan2 <> pilihan1 then
      select coalesce(j.kuota, 36)
        into kuota_pilihan
      from public.jurusan j
      where j.id = pilihan2;

      select count(*)
        into kuota_terpakai
      from public.calon_siswa c
      where c.jurusan_diterima_id = pilihan2
        and c.status_seleksi = 'diterima';

      if kuota_terpakai < coalesce(kuota_pilihan, 36) then
        diterima := pilihan2;
      end if;
    end if;

    if diterima is not null then
      update public.calon_siswa
      set jurusan_diterima_id = diterima,
          status_seleksi = 'diterima',
          status = 'Diterima'
      where id = calon.id;
    else
      update public.calon_siswa
      set jurusan_diterima_id = null,
          status_seleksi = 'tidak_diterima',
          status = 'Ditolak'
      where id = calon.id;
    end if;
  end loop;

  -- Ranking PER JURUSAN:
  -- siswa yang diterima diranking di jurusan diterimanya;
  -- siswa yang belum diterima diranking di pilihan 1-nya.
  with ranked as (
    select
      c.id,
      row_number() over (
        partition by coalesce(c.jurusan_diterima_id, c.pilihan_jurusan_1_id, c.jurusan_id)
        order by c.nilai desc, c.created_at asc, c.id asc
      )::integer as nomor
    from public.calon_siswa c
    where c.nilai is not null
      and coalesce(c.jurusan_diterima_id, c.pilihan_jurusan_1_id, c.jurusan_id) is not null
  )
  update public.calon_siswa c
  set peringkat = r.nomor
  from ranked r
  where c.id = r.id;

  -- Buat/refresh notifikasi hasil seleksi untuk akun siswa.
  -- Hanya satu notifikasi hasil seleksi per pendaftaran.
  delete from public.notifikasi
  where tipe = 'hasil_seleksi';

  insert into public.notifikasi (user_id, calon_siswa_id, judul, isi, tipe)
  select
    c.user_id,
    c.id,
    case
      when c.status_seleksi = 'diterima' then '🎉 Kamu Masuk Kuota SPMB'
      else '📊 Posisi Seleksi SPMB Diperbarui'
    end,
    case
      when c.status_seleksi = 'diterima' then
        'Selamat ' || c.nama || '! Nilai akhir ' ||
        to_char(c.nilai, 'FM990.00') ||
        ' menempatkanmu di peringkat #' || c.peringkat ||
        ' pada jurusan ' || coalesce(j.nama, '-') ||
        '. Kamu saat ini masuk kuota penerimaan.'
      else
        'Posisi seleksimu diperbarui. Nilai akhir ' ||
        to_char(c.nilai, 'FM990.00') ||
        ', peringkat #' || coalesce(c.peringkat, 0) ||
        ' pada pilihan jurusanmu. Kamu belum masuk kuota saat ini.'
    end,
    'hasil_seleksi'
  from public.calon_siswa c
  left join public.jurusan j on j.id = c.jurusan_diterima_id
  where c.user_id is not null
    and c.nilai is not null;

  return jumlah;
end;
$$;

-- Fungsi yang dipakai ADMIN untuk tombol sinkronisasi manual.
drop function if exists public.proses_seleksi_spmb();
create or replace function public.proses_seleksi_spmb()
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  jumlah integer;
begin
  if not public.is_admin() then
    raise exception 'Hanya admin yang dapat menyinkronkan seleksi.';
  end if;

  jumlah := public._hitung_seleksi_spmb();

  return json_build_object(
    'success', true,
    'jumlah_diproses', jumlah,
    'message', 'Seleksi dan peringkat per jurusan berhasil diperbarui.'
  );
end;
$$;

grant execute on function public.proses_seleksi_spmb() to authenticated;

-- Otomatis setelah calon baru mendaftar atau nilai/pilihannya berubah.
create or replace function public.trg_auto_seleksi_spmb()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public._hitung_seleksi_spmb();
  return new;
end;
$$;

drop trigger if exists trg_auto_seleksi_spmb on public.calon_siswa;
create trigger trg_auto_seleksi_spmb
after insert or update of nilai_rapor, nilai_tes, pilihan_jurusan_1_id, pilihan_jurusan_2_id, jurusan_id
on public.calon_siswa
for each statement
execute function public.trg_auto_seleksi_spmb();

-- Pastikan fungsi RPC cek status tetap membaca ranking terbaru.
drop function if exists public.check_registration(text);
create or replace function public.check_registration(p_nisn text)
returns table (
  nomor_pendaftaran text,
  nama text,
  nisn text,
  status text,
  jurusan_nama text,
  pilihan_jurusan_1_nama text,
  pilihan_jurusan_2_nama text,
  nilai_rapor numeric,
  nilai_tes numeric,
  nilai numeric,
  peringkat integer,
  asal_sekolah_nama text
)
language sql
security definer
set search_path = public
as $$
  select
    c.nomor_pendaftaran,
    c.nama,
    c.nisn,
    c.status,
    jd.nama,
    j1.nama,
    j2.nama,
    c.nilai_rapor,
    c.nilai_tes,
    c.nilai,
    c.peringkat,
    a.nama
  from public.calon_siswa c
  left join public.jurusan jd on jd.id = c.jurusan_diterima_id
  left join public.jurusan j1 on j1.id = coalesce(c.pilihan_jurusan_1_id, c.jurusan_id)
  left join public.jurusan j2 on j2.id = c.pilihan_jurusan_2_id
  left join public.asal_sekolah a on a.id = c.asal_sekolah_id
  where trim(c.nisn) = trim(p_nisn)
  limit 1;
$$;

grant execute on function public.check_registration(text) to anon, authenticated;

-- Jalankan sekali sekarang agar data lama langsung ikut sistem otomatis.
select public._hitung_seleksi_spmb();
