-- =========================================================
-- MEMBUAT / MENJADIKAN AKUN ADMIN
-- =========================================================
-- 1. Buat user admin di Supabase Dashboard:
--    Authentication -> Users -> Add user -> Create new user
-- 2. Setelah user dibuat, ubah email di bawah sesuai email admin.
-- 3. Jalankan query ini.

update public.profiles
set role = 'admin'
where email = 'admin@smkteknologinusantara.sch.id';

-- Cek hasil:
select id, email, nama, role
from public.profiles
order by created_at desc;

-- Penting:
-- Akun yang dibuat dari halaman /siswa/register otomatis menjadi student.
-- Jangan memberikan role admin kepada akun siswa.
