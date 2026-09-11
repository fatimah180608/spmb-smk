-- FIX PERINGKAT SPMB - jalankan SETELAH schema utama
-- Mengisi peringkat berdasarkan Nilai Akhir tertinggi.

alter table public.calon_siswa add column if not exists peringkat integer;

-- 1) Isi ulang peringkat yang tersimpan untuk semua pendaftar yang punya nilai akhir.
with ranked as (
  select id,
         row_number() over (order by nilai desc, created_at asc, id asc)::integer as nomor
  from public.calon_siswa
  where nilai is not null
)
update public.calon_siswa c
set peringkat = r.nomor
from ranked r
where c.id = r.id;

-- Pendaftar tanpa nilai tidak punya peringkat.
update public.calon_siswa
set peringkat = null
where nilai is null;

-- 2) Fungsi cek status: peringkat dihitung langsung dari database,
-- jadi tetap terlihat walaupun kolom peringkat sebelumnya kosong.
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
  with ranked as (
    select c.*,
           case when c.nilai is not null then
             row_number() over (order by c.nilai desc, c.created_at asc, c.id asc)::integer
           end as rank_hitung
    from public.calon_siswa c
  )
  select
    c.nomor_pendaftaran,
    c.nama,
    c.nisn,
    c.status,
    jd.nama as jurusan_nama,
    j1.nama as pilihan_jurusan_1_nama,
    j2.nama as pilihan_jurusan_2_nama,
    c.nilai_rapor,
    c.nilai_tes,
    c.nilai,
    c.rank_hitung as peringkat,
    a.nama as asal_sekolah_nama
  from ranked c
  left join public.jurusan jd on jd.id = c.jurusan_diterima_id
  left join public.jurusan j1 on j1.id = coalesce(c.pilihan_jurusan_1_id, c.jurusan_id)
  left join public.jurusan j2 on j2.id = c.pilihan_jurusan_2_id
  left join public.asal_sekolah a on a.id = c.asal_sekolah_id
  where trim(c.nisn) = trim(p_nisn)
  limit 1;
$$;

grant execute on function public.check_registration(text) to anon, authenticated;

-- 3) Fungsi sederhana untuk memperbarui peringkat kapan saja.
drop function if exists public.refresh_peringkat_spmb();
create or replace function public.refresh_peringkat_spmb()
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  total integer;
begin
  if not public.is_admin() then
    raise exception 'Hanya admin yang dapat memperbarui peringkat.';
  end if;

  with ranked as (
    select id,
           row_number() over (order by nilai desc, created_at asc, id asc)::integer as nomor
    from public.calon_siswa
    where nilai is not null
  )
  update public.calon_siswa c
  set peringkat = r.nomor
  from ranked r
  where c.id = r.id;

  update public.calon_siswa set peringkat = null where nilai is null;
  select count(*) into total from public.calon_siswa where nilai is not null;
  return json_build_object('success', true, 'jumlah', total);
end;
$$;

grant execute on function public.refresh_peringkat_spmb() to authenticated;

-- Verifikasi manual:
-- select nama, nisn, nilai, peringkat, status, status_seleksi
-- from public.calon_siswa order by peringkat nulls last;
