import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Download, GraduationCap, Printer } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { useSchool } from "@/context/SchoolContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Loading from "@/components/Loading";

export default function KartuPendaftaran() {
  const { session } = useAuth();
  const { school } = useSchool();
  const [data, setData] = useState(undefined);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!session?.user || !supabase) return;
    async function load() {
      const { data: row, error: err } = await supabase
        .from("calon_siswa")
        .select("*")
        .eq("user_id", session.user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (err) { setError(err.message); setData(null); return; }
      if (!row) { setData(null); return; }

      const [j, a] = await Promise.all([
        supabase.from("jurusan").select("id,nama"),
        supabase.from("asal_sekolah").select("id,nama"),
      ]);
      const jm = Object.fromEntries((j.data || []).map(x => [x.id, x]));
      const am = Object.fromEntries((a.data || []).map(x => [x.id, x]));
      setData({
        ...row,
        pilihan1: jm[row.pilihan_jurusan_1_id || row.jurusan_id] || null,
        pilihan2: jm[row.pilihan_jurusan_2_id] || null,
        diterima: jm[row.jurusan_diterima_id] || null,
        asal_sekolah: am[row.asal_sekolah_id] || null,
      });
    }
    load();
  }, [session?.user?.id]);

  if (data === undefined) return <Loading />;
  if (error) return <div className="container-app py-16"><div className="rounded-2xl border border-red-100 bg-red-50 p-5 text-red-700">{error}</div></div>;
  if (!data) return <div className="container-app py-16"><div className="rounded-[28px] border border-slate-200 bg-white p-8 text-center"><h1 className="text-2xl font-black">Belum ada pendaftaran</h1><p className="mt-2 text-slate-500">Silakan isi formulir pendaftaran terlebih dahulu.</p><Link to="/daftar"><Button className="mt-5">Mulai Pendaftaran</Button></Link></div></div>;

  const status = data.status || "Menunggu Verifikasi";
  return <div className="container-app py-10 sm:py-14">
    <div className="no-print mb-6 flex items-center justify-between gap-3">
      <Link to="/siswa" className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-emerald-600"><ArrowLeft size={16}/> Kembali ke Dashboard</Link>
      <Button onClick={() => window.print()}><Printer size={17}/> Cetak / Simpan PDF</Button>
    </div>

    <Card className="mx-auto max-w-3xl overflow-hidden rounded-[30px] border-0 shadow-xl print:shadow-none">
      <div className="bg-gradient-to-r from-emerald-950 to-slate-950 p-7 text-white sm:p-9">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10"><GraduationCap size={30}/></div>
          <div><p className="text-sm font-bold tracking-widest text-emerald-300">{school?.nama || "SMK Teknologi Nusantara"}</p><h1 className="mt-1 text-2xl font-black sm:text-3xl">Kartu Pendaftaran SPMB</h1><p className="mt-1 text-sm text-slate-300">Tahun Pelajaran {school?.tahun_pelajaran || "2026/2027"}</p></div>
        </div>
      </div>
      <CardContent className="p-7 sm:p-9">
        <div className="rounded-2xl border-2 border-emerald-100 bg-emerald-50 p-5 text-center">
          <p className="text-xs font-bold uppercase tracking-[.2em] text-emerald-600">Nomor Pendaftaran</p>
          <p className="mt-2 text-2xl font-black tracking-wider text-emerald-950">{data.nomor_pendaftaran}</p>
        </div>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <Info label="Nama Lengkap" value={data.nama}/>
          <Info label="NISN" value={data.nisn}/>
          <Info label="Asal Sekolah" value={data.asal_sekolah?.nama}/>
          <Info label="Jenis Kelamin" value={data.jenis_kelamin === "L" ? "Laki-laki" : data.jenis_kelamin === "P" ? "Perempuan" : "-"}/>
          <Info label="Pilihan Jurusan 1" value={data.pilihan1?.nama}/>
          <Info label="Pilihan Jurusan 2" value={data.pilihan2?.nama}/>
          <Info label="Nilai Rapor" value={data.nilai_rapor}/>
          <Info label="Nilai Tes" value={data.nilai_tes}/>
          <Info label="Nilai Akhir" value={data.nilai ?? "Belum dihitung"}/>
          <Info label="Status" value={status}/>
          {data.diterima?.nama && <Info label="Jurusan Diterima" value={data.diterima.nama}/>} 
          {data.peringkat != null && <Info label="Peringkat" value={`#${data.peringkat}`}/>} 
        </div>
        <div className="mt-7 rounded-2xl bg-slate-50 p-5 text-sm leading-6 text-slate-500">
          Kartu ini merupakan bukti pendaftaran elektronik. Simpan kartu ini untuk keperluan verifikasi dan informasi hasil seleksi. Nilai akhir dihitung otomatis oleh sistem dari nilai rapor 60% dan nilai tes 40%.
        </div>
        <div className="no-print mt-6 flex flex-wrap gap-3">
          <Button onClick={() => window.print()}><Printer size={17}/> Cetak Kartu</Button>
          <Link to={`/cek-status?nisn=${data.nisn}`}><Button variant="outline">Cek Status dengan NISN</Button></Link>
        </div>
      </CardContent>
    </Card>
  </div>;
}

function Info({ label, value }) {
  return <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs text-slate-400">{label}</p><p className="mt-1 font-bold text-slate-800">{value || "-"}</p></div>;
}
