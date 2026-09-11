-- Jalankan file ini SEKALI di Supabase SQL Editor jika database lama sudah terlanjur dibuat.
-- Setelah itu fitur seleksi dua pilihan jurusan + nilai akan aktif.

create extension if not exists "pgcrypto";

-- =========================================================
-- SELEKSI SPMB: NILAI TERTINGGI + 2 PILIHAN JURUSAN
-- =========================================================
alter table public.calon_siswa add column if not exists pilihan_jurusan_1_id uuid references public.jurusan(id) on delete set null;
alter table public.calon_siswa add column if not exists pilihan_jurusan_2_id uuid references public.jurusan(id) on delete set null;
alter table public.calon_siswa add column if not exists jurusan_diterima_id uuid references public.jurusan(id) on delete set null;
alter table public.calon_siswa add column if not exists nilai numeric(5,2);
alter table public.calon_siswa add column if not exists peringkat integer;
alter table public.calon_siswa add column if not exists status_seleksi text default 'menunggu';
alter table public.calon_siswa drop constraint if exists calon_siswa_status_seleksi_check;
alter table public.calon_siswa add constraint calon_siswa_status_seleksi_check check (status_seleksi in ('menunggu','diterima','tidak_diterima'));
alter table public.jurusan add column if not exists kuota integer default 36;
update public.jurusan set kuota = 36 where kuota is null or kuota <= 0;
-- Nilai akhir dihitung otomatis dari Nilai Rapor 60% + Nilai Tes 40%.
alter table public.calon_siswa add column if not exists nilai_rapor numeric(5,2);
alter table public.calon_siswa add column if not exists nilai_tes numeric(5,2);
alter table public.calon_siswa drop constraint if exists calon_siswa_nilai_rapor_check;
alter table public.calon_siswa add constraint calon_siswa_nilai_rapor_check check (nilai_rapor is null or (nilai_rapor >= 0 and nilai_rapor <= 100));
alter table public.calon_siswa drop constraint if exists calon_siswa_nilai_tes_check;
alter table public.calon_siswa add constraint calon_siswa_nilai_tes_check check (nilai_tes is null or (nilai_tes >= 0 and nilai_tes <= 100));
alter table public.calon_siswa alter column nilai drop default;

create or replace function public.hitung_nilai_akhir_spmb()
returns trigger language plpgsql set search_path = public as $$
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
    'message', 'Seleksi berhasil: nilai tertinggi diproses lebih dahulu, maksimal sesuai kuota (default 36) per jurusan, dan pilihan 2 dipakai jika pilihan 1 penuh.'
  );
end;
$$;

grant execute on function public.proses_seleksi_spmb() to authenticated;


drop function if exists public.check_registration(text);

create or replace function public.check_registration(p_nomor text)
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
  where c.nomor_pendaftaran = p_nomor
  limit 1;
$$;


grant execute on function public.check_registration(text) to anon, authenticated;
