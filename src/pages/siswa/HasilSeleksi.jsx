import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, CheckCircle2, Clock3, Trophy, XCircle } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Loading from "@/components/Loading";

export default function HasilSeleksi() {
  const { session } = useAuth();
  const [data, setData] = useState(undefined);
  useEffect(() => {
    if (!session?.user || !supabase) return;
    async function load() {
      const { data: row, error } = await supabase
        .from("calon_siswa")
        .select("*")
        .eq("user_id", session.user.id)
        .order("created_at", { ascending:false })
        .limit(1)
        .maybeSingle();
      if (error) { console.error(error); setData(null); return; }
      if (!row) { setData(null); return; }
      const { data: jurusan } = await supabase.from("jurusan").select("id,nama");
      const jm = Object.fromEntries((jurusan || []).map(x => [x.id, x]));
      setData({ ...row, pilihan1: jm[row.pilihan_jurusan_1_id || row.jurusan_id] || null, pilihan2: jm[row.pilihan_jurusan_2_id] || null, diterima: jm[row.jurusan_diterima_id] || null });
    }
    load();
  }, [session?.user?.id]);
  if (data === undefined) return <Loading/>;
  if (!data) return <div className="container-app py-16"><Card className="mx-auto max-w-xl rounded-[28px]"><CardContent className="p-8 text-center"><h1 className="text-2xl font-black">Belum ada data pendaftaran</h1><Link to="/daftar"><Button className="mt-5">Daftar Sekarang</Button></Link></CardContent></Card></div>;
  const diterima = data.status === "Diterima";
  const diproses = data.peringkat != null;
  return <div className="container-app py-10 sm:py-16">
    <Link to="/siswa" className="mb-6 inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-emerald-600"><ArrowLeft size={16}/> Kembali ke Dashboard</Link>
    <Card className="mx-auto max-w-3xl overflow-hidden rounded-[30px] border-0 shadow-xl">
      <div className={`p-8 text-white sm:p-10 ${diterima ? "bg-gradient-to-br from-emerald-950 to-emerald-700" : data.status === "Ditolak" ? "bg-gradient-to-br from-slate-950 to-red-900" : "bg-gradient-to-br from-slate-950 to-slate-800"}`}>
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10">{diterima ? <CheckCircle2 size={30}/> : data.status === "Ditolak" ? <XCircle size={30}/> : <Clock3 size={30}/>}</div>
        <p className="mt-6 text-sm font-bold tracking-widest text-white/70">HASIL SELEKSI SPMB</p>
        <h1 className="mt-2 text-4xl font-black">{diterima ? "Selamat, kamu diterima! 🎉" : data.status === "Ditolak" ? "Hasil Seleksi" : "Seleksi Belum Diproses"}</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-white/75">{diterima ? `Kamu diterima melalui ${data.diterima?.nama ? "jurusan yang tersedia" : "proses seleksi"}.` : data.status === "Ditolak" ? "Terima kasih sudah mengikuti proses SPMB. Silakan periksa informasi resmi dari sekolah." : "Peringkat dan status seleksi diperbarui otomatis berdasarkan nilai dan kuota jurusan."}</p>
      </div>
      <CardContent className="p-7 sm:p-9">
        <div className="grid gap-4 sm:grid-cols-2">
          <Info label="Nama" value={data.nama}/><Info label="NISN" value={data.nisn}/><Info label="Nilai Rapor" value={data.nilai_rapor}/><Info label="Nilai Tes" value={data.nilai_tes}/><Info label="Nilai Akhir" value={data.nilai}/><Info label="Peringkat" value={diproses ? `#${data.peringkat}` : "Belum diproses"} icon={diproses ? <Trophy size={16}/> : null}/><Info label="Pilihan 1" value={data.pilihan1?.nama}/><Info label="Pilihan 2" value={data.pilihan2?.nama}/><Info label="Jurusan Diterima" value={data.diterima?.nama || "-"}/><Info label="Status" value={data.status}/>
        </div>
        <div className="mt-7 flex flex-wrap gap-3"><Link to="/siswa/kartu"><Button>Lihat Kartu Pendaftaran</Button></Link><Link to={`/cek-status?nisn=${data.nisn}`}><Button variant="outline">Cek Status dengan NISN</Button></Link></div>
      </CardContent>
    </Card>
  </div>;
}
function Info({label,value,icon}){return <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs text-slate-400">{label}</p><p className="mt-1 flex items-center gap-2 font-black text-slate-800">{icon}<span>{value||"-"}</span></p></div>}
