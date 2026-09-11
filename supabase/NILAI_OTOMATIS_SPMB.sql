-- =========================================================
-- MIGRASI NILAI OTOMATIS SPMB
-- Siswa mengisi Nilai Rapor + Nilai Tes. Sistem menghitung Nilai Akhir.
-- Bobot: Rapor 60% + Tes 40%.
-- Jalankan setelah schema.sql dan SELEKSI_SPMB.sql lama.
-- =========================================================

alter table public.calon_siswa add column if not exists nilai_rapor numeric(5,2);
alter table public.calon_siswa add column if not exists nilai_tes numeric(5,2);

alter table public.calon_siswa drop constraint if exists calon_siswa_nilai_rapor_check;
alter table public.calon_siswa add constraint calon_siswa_nilai_rapor_check check (nilai_rapor is null or (nilai_rapor >= 0 and nilai_rapor <= 100));
alter table public.calon_siswa drop constraint if exists calon_siswa_nilai_tes_check;
alter table public.calon_siswa add constraint calon_siswa_nilai_tes_check check (nilai_tes is null or (nilai_tes >= 0 and nilai_tes <= 100));

-- Data lama tetap konsisten: komponen lama disamakan dengan nilai akhir yang sudah tersimpan.
update public.calon_siswa
set nilai_rapor = nilai,
    nilai_tes = nilai
where nilai is not null
  and nilai_rapor is null
  and nilai_tes is null;

-- Nilai akhir tidak lagi acak. Nilai dihitung dari komponen saat insert/update.
alter table public.calon_siswa alter column nilai drop default;

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

-- Status publik juga menampilkan komponen nilai.
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
