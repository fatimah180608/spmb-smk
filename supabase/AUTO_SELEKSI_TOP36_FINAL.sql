-- ============================================================
-- SPMB FINAL: PERINGKAT & SELEKSI OTOMATIS
-- Jalankan FILE INI SATU KALI di Supabase > SQL Editor.
-- Jangan menjalankan file seleksi lama setelah ini.
--
-- Aturan:
-- 1. Nilai akhir = rapor 60% + tes 40%.
-- 2. Begitu calon memiliki nilai + pilihan jurusan, sistem langsung
--    menghitung ulang semua calon.
-- 3. Calon diurutkan nilai tertinggi.
-- 4. Pilihan 1 dicoba lebih dahulu; jika penuh, pilihan 2 dicoba.
-- 5. Kuota default jurusan = 36 (mengikuti kolom jurusan.kuota).
-- 6. Peringkat dihitung PER JURUSAN, bukan peringkat global.
-- 7. Calon yang belum masuk kuota tetap mendapat peringkat di pilihan 1
--    agar bisa melihat posisinya, misalnya #37.
-- 8. Pendaftaran baru otomatis memicu hitung ulang. Tidak perlu tombol
--    "terima/luluskan" satu per satu.
-- ============================================================

-- ------------------------------------------------------------
-- A. Bersihkan trigger/function seleksi lama yang memakai
--    _hitung_seleksi_spmb agar tidak ada dua mesin seleksi berjalan.
-- ------------------------------------------------------------
do $$
declare
  r record;
begin
  -- Bersihkan semua trigger seleksi lama pada calon_siswa agar tidak ada
  -- mesin seleksi kedua yang masih menulis status/peringkat dengan aturan lama.
  for r in
    select t.tgname, t.tgrelid::regclass as relname
    from pg_trigger t
    join pg_proc p on p.oid = t.tgfoid
    join pg_namespace n on n.oid = p.pronamespace
    where not t.tgisinternal
      and t.tgrelid = 'public.calon_siswa'::regclass
      and n.nspname = 'public'
      and (
        p.proname ilike '%seleksi%'
        or p.proname ilike '%hitung_seleksi%'
      )
  loop
    execute format('drop trigger if exists %I on %s', r.tgname, r.relname);
  end loop;
end $$;

-- ------------------------------------------------------------
-- B. Pastikan constraint status tidak lagi menerima nilai lama
--    "Menunggu Seleksi" / "Menunggu Nilai" yang menyebabkan error.
-- ------------------------------------------------------------
alter table public.calon_siswa
  drop constraint if exists calon_siswa_status_check;

-- Normalisasi data lama sebelum constraint baru dipasang.
update public.calon_siswa
set status = case
  when status_seleksi = 'diterima' then 'Diterima'
  when status_seleksi = 'tidak_diterima' then 'Ditolak'
  else 'Menunggu Verifikasi'
end
where status not in ('Menunggu Verifikasi','Diterima','Ditolak');

alter table public.calon_siswa
  add constraint calon_siswa_status_check
  check (status in ('Menunggu Verifikasi','Diterima','Ditolak'));

alter table public.calon_siswa
  drop constraint if exists calon_siswa_status_seleksi_check;

alter table public.calon_siswa
  add constraint calon_siswa_status_seleksi_check
  check (status_seleksi in ('menunggu','diterima','tidak_diterima'));

-- ------------------------------------------------------------
-- C. Nilai akhir otomatis.
-- ------------------------------------------------------------
create or replace function public.hitung_nilai_akhir_spmb()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.nilai_rapor is not null and new.nilai_tes is not null then
    new.nilai := round((new.nilai_rapor * 0.60 + new.nilai_tes * 0.40)::numeric, 2);
  else
    new.nilai := null;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_hitung_nilai_akhir_spmb on public.calon_siswa;
create trigger trg_hitung_nilai_akhir_spmb
before insert or update of nilai_rapor, nilai_tes
on public.calon_siswa
for each row
execute function public.hitung_nilai_akhir_spmb();

-- ------------------------------------------------------------
-- D. Mesin utama seleksi otomatis.
-- SECURITY DEFINER diperlukan agar trigger siswa dapat memperbarui
-- hasil seleksi seluruh pendaftar tanpa membuka UPDATE ke siswa.
-- ------------------------------------------------------------
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
  hasil_jurusan uuid;
begin
  -- Hanya satu proses seleksi boleh berjalan dalam satu waktu.
  perform pg_advisory_xact_lock(hashtext('spmb-auto-selection-final'));

  -- Simpan hasil lama untuk menentukan notifikasi perubahan hasil.
  create temp table if not exists _spmb_old_result (
    id uuid primary key,
    status_seleksi text,
    jurusan_diterima_id uuid,
    peringkat integer
  ) on commit drop;
  truncate _spmb_old_result;

  insert into _spmb_old_result (id, status_seleksi, jurusan_diterima_id, peringkat)
  select id, status_seleksi, jurusan_diterima_id, peringkat
  from public.calon_siswa;

  -- Reset hanya kolom hasil seleksi. Data pendaftaran/nilai tidak disentuh.
  update public.calon_siswa
  set jurusan_diterima_id = null,
      status_seleksi = case when nilai is null then 'menunggu' else 'tidak_diterima' end,
      peringkat = null,
      status = case when nilai is null then 'Menunggu Verifikasi' else 'Ditolak' end
  where id is not null;

  -- ----------------------------------------------------------
  -- Proses nilai tertinggi ke terendah.
  -- ----------------------------------------------------------
  for calon in
    select
      c.id,
      c.pilihan_jurusan_1_id,
      c.pilihan_jurusan_2_id,
      c.jurusan_id,
      c.nilai,
      c.created_at
    from public.calon_siswa c
    where c.nilai is not null
      and coalesce(c.pilihan_jurusan_1_id, c.jurusan_id) is not null
    order by c.nilai desc, c.created_at asc, c.id asc
  loop
    jumlah := jumlah + 1;
    pilihan1 := coalesce(calon.pilihan_jurusan_1_id, calon.jurusan_id);
    pilihan2 := calon.pilihan_jurusan_2_id;
    diterima := null;

    -- Pilihan 1.
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

    -- Pilihan 2 hanya dicoba jika pilihan 1 sudah penuh.
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

  -- ----------------------------------------------------------
  -- Peringkat PER JURUSAN.
  --
  -- Yang diterima diranking di jurusan yang benar-benar diterima.
  -- Yang belum diterima diranking di pilihan 1 supaya tetap bisa
  -- melihat posisi kompetisinya (#37, #38, dst.).
  -- ----------------------------------------------------------
  with ranked as (
    select
      c.id,
      row_number() over (
        partition by coalesce(
          c.jurusan_diterima_id,
          c.pilihan_jurusan_1_id,
          c.jurusan_id
        )
        order by c.nilai desc, c.created_at asc, c.id asc
      )::integer as nomor
    from public.calon_siswa c
    where c.nilai is not null
      and coalesce(c.jurusan_diterima_id, c.pilihan_jurusan_1_id, c.jurusan_id) is not null
  )
  update public.calon_siswa c
  set peringkat = ranked.nomor
  from ranked
  where c.id = ranked.id;

  -- ----------------------------------------------------------
  -- Notifikasi hanya dibuat jika hasil siswa berubah.
  -- Ini mencegah spam notifikasi setiap kali admin melakukan sinkronisasi.
  -- ----------------------------------------------------------
  insert into public.notifikasi (user_id, calon_siswa_id, judul, isi, tipe)
  select
    c.user_id,
    c.id,
    case
      when c.status_seleksi = 'diterima' then '🎉 Hasil Seleksi SPMB Diperbarui'
      else '📊 Peringkat SPMB Diperbarui'
    end,
    case
      when c.status_seleksi = 'diterima' then
        'Selamat! Kamu saat ini diterima di ' || coalesce(j.nama, '-') ||
        ' dengan peringkat #' || coalesce(c.peringkat, 0) ||
        ' dan nilai akhir ' || to_char(c.nilai, 'FM990.00') || '.'
      else
        'Peringkatmu saat ini #' || coalesce(c.peringkat, 0) ||
        ' pada pilihan jurusanmu dengan nilai akhir ' || to_char(c.nilai, 'FM990.00') ||
        '. Kuota jurusan menentukan status diterima atau belum.'
    end,
    'hasil_seleksi'
  from public.calon_siswa c
  left join public.jurusan j on j.id = c.jurusan_diterima_id
  left join _spmb_old_result o on o.id = c.id
  where c.user_id is not null
    and c.nilai is not null
    and (
      o.id is null
      or o.status_seleksi is distinct from c.status_seleksi
      or o.jurusan_diterima_id is distinct from c.jurusan_diterima_id
    );

  return jumlah;
end;
$$;

-- ------------------------------------------------------------
-- E. RPC admin untuk sinkronisasi manual jika kuota/master berubah.
-- Pendaftaran baru tidak membutuhkan RPC ini karena trigger otomatis.
-- ------------------------------------------------------------
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
    'message', 'Peringkat dan kelulusan otomatis berhasil diperbarui.'
  );
end;
$$;

grant execute on function public.proses_seleksi_spmb() to authenticated;

-- ------------------------------------------------------------
-- F. Trigger otomatis.
-- Penting: statement-level agar 1 pendaftaran hanya memicu 1 kali
-- hitung ulang untuk seluruh daftar.
-- ------------------------------------------------------------
create or replace function public.trg_auto_seleksi_spmb()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public._hitung_seleksi_spmb();
  return null;
end;
$$;

drop trigger if exists trg_auto_seleksi_spmb on public.calon_siswa;
create trigger trg_auto_seleksi_spmb
after insert or update of nilai_rapor, nilai_tes, pilihan_jurusan_1_id, pilihan_jurusan_2_id, jurusan_id
on public.calon_siswa
for each statement
execute function public.trg_auto_seleksi_spmb();

-- ------------------------------------------------------------
-- G. RPC cek status berdasarkan NISN.
-- ------------------------------------------------------------
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

-- ------------------------------------------------------------
-- H. Jalankan sekali sekarang untuk data lama.
-- ------------------------------------------------------------
select public._hitung_seleksi_spmb();

-- Cek hasil setelah menjalankan script:
select
  c.nama,
  c.nisn,
  c.nilai,
  c.peringkat,
  c.status,
  c.status_seleksi,
  j.nama as jurusan_diterima
from public.calon_siswa c
left join public.jurusan j on j.id = c.jurusan_diterima_id
order by c.peringkat nulls last, c.nilai desc nulls last;
