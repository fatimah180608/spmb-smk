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
