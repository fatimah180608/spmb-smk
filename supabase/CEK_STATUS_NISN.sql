-- Jalankan di Supabase SQL Editor untuk mengubah Cek Status menjadi pencarian berdasarkan NISN.
-- Peringkat akan tampil otomatis jika proses seleksi sudah dijalankan.

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
