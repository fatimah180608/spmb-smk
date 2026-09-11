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
