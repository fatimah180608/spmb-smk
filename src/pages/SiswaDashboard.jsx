import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Bell, BellRing, ClipboardList, FileCheck2, GraduationCap, LogOut, Trophy } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { useSchool } from "@/context/SchoolContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Loading from "@/components/Loading";

export default function SiswaDashboard() {
  const { session, profile, signOut } = useAuth();
  const { school } = useSchool();
  const [application, setApplication] = useState(undefined);
  const [notifications, setNotifications] = useState([]);
  const [announcements, setAnnouncements] = useState([]);

  useEffect(() => {
    if (!session?.user || !supabase) return;
    async function load() {
      const [a, n, p, j, as] = await Promise.all([
        supabase.from("calon_siswa").select("*").eq("user_id", session.user.id).order("created_at", { ascending:false }).limit(1).maybeSingle(),
        supabase.from("notifikasi").select("*").eq("user_id", session.user.id).order("created_at", { ascending:false }).limit(8),
        supabase.from("pengumuman").select("id,judul,isi,created_at").eq("published", true).order("created_at", { ascending:false }).limit(5),
        supabase.from("jurusan").select("id,nama"),
        supabase.from("asal_sekolah").select("id,nama"),
      ]);
      const jm = Object.fromEntries((j.data || []).map(x => [x.id, x]));
      const am = Object.fromEntries((as.data || []).map(x => [x.id, x]));
      const row = a.data ? { ...a.data, jurusan: jm[a.data.jurusan_id] || null, pilihan1: jm[a.data.pilihan_jurusan_1_id || a.data.jurusan_id] || null, pilihan2: jm[a.data.pilihan_jurusan_2_id] || null, diterima: jm[a.data.jurusan_diterima_id] || null, asal_sekolah: am[a.data.asal_sekolah_id] || null } : null;
      setApplication(row);
      setNotifications(n.data || []);
      setAnnouncements(p.data || []);
    }
    load();
  }, [session?.user?.id]);

  if (application === undefined) return <Loading/>;

  return <div className="min-h-screen bg-slate-50">
    <header className="border-b border-slate-200 bg-white"><div className="container-app flex h-20 items-center justify-between gap-4"><Link to="/siswa" className="flex items-center gap-3"><div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-600 text-white"><GraduationCap/></div><div><div className="font-black">Portal Siswa</div><div className="text-xs text-slate-500">{school?.nama || "SMK Teknologi Nusantara"}</div></div></Link><div className="flex items-center gap-2"><Link to="/"><Button variant="outline" size="sm">Website</Button></Link><Button variant="outline" size="sm" onClick={signOut}><LogOut size={16}/> Keluar</Button></div></div></header>
    <main className="container-app py-10 sm:py-14">
      <div className="mb-8 grid overflow-hidden rounded-[30px] bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 text-white shadow-2xl md:grid-cols-[1fr_.42fr]"><div className="p-7 sm:p-10"><div className="flex flex-col justify-between gap-7 md:flex-row md:items-end"><div><p className="text-sm font-bold text-emerald-300">PORTAL CALON MURID</p><h1 className="mt-2 text-3xl font-black sm:text-4xl">Halo, {profile?.nama || session?.user?.email?.split("@")[0] || "Calon Murid"} 👋</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">Di sini kamu hanya melihat menu yang dibutuhkan untuk proses SPMB.</p></div><div className="rounded-2xl bg-white/10 px-4 py-3 text-sm"><div className="text-slate-400">Tahun Pelajaran</div><div className="mt-1 font-black">{school?.tahun_pelajaran || "2026/2027"}</div></div></div></div><img src="/images/school-entrance-realistic.jpg" alt="Aktivitas siswa" className="hidden h-full min-h-56 w-full object-cover opacity-90 md:block"/></div>
      <div className="grid gap-5 md:grid-cols-3">
        <Card className="rounded-[26px]"><CardContent className="p-6"><div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600"><ClipboardList/></div><h2 className="mt-5 text-xl font-black">Pendaftaran SPMB</h2><p className="mt-2 text-sm leading-6 text-slate-500">Isi data calon murid dan pilih jurusan yang kamu minati.</p>{application?<Link to={`/cek-status?nisn=${application.nisn}`}><Button className="mt-5 w-full">Lihat Status <ArrowRight size={16}/></Button></Link>:<Link to="/daftar"><Button className="mt-5 w-full">Mulai Pendaftaran <ArrowRight size={16}/></Button></Link>}</CardContent></Card>
        <Card className="rounded-[26px]"><CardContent className="p-6"><div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-50 text-cyan-600"><GraduationCap/></div><h2 className="mt-5 text-xl font-black">Pilihan Jurusan</h2><p className="mt-2 text-sm leading-6 text-slate-500">Lihat RPL, DPIB, Akuntansi, TP, TPTU, TKP, dan Kuliner.</p><div className="mt-5 grid grid-cols-2 gap-2"><Link to="/jurusan"><Button variant="outline" className="w-full">Lihat Jurusan</Button></Link></div></CardContent></Card>
        <Card className="rounded-[26px]"><CardContent className="p-6"><div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-50 text-amber-600"><FileCheck2/></div><h2 className="mt-5 text-xl font-black">Informasi SPMB</h2><p className="mt-2 text-sm leading-6 text-slate-500">Baca syarat, cara daftar, pengumuman, dan informasi sekolah.</p><div className="mt-5 grid grid-cols-2 gap-2"><Link to="/cara-daftar"><Button variant="outline" className="w-full">Cara Daftar</Button></Link><Link to="/berita"><Button variant="outline" className="w-full">Berita</Button></Link></div></CardContent></Card>
      </div>
      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <Card className="rounded-[26px]">
          <CardContent className="p-6">
            <div className="flex items-center justify-between gap-3"><div className="flex items-center gap-3"><div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-50 text-amber-600"><BellRing/></div><div><h2 className="font-black">Notifikasi</h2><p className="text-xs text-slate-500">Informasi terbaru untukmu</p></div></div>{notifications.some(x=>!x.dibaca) && <span className="rounded-full bg-red-50 px-2.5 py-1 text-[11px] font-black text-red-600">{notifications.filter(x=>!x.dibaca).length} baru</span>}</div>
            <div className="mt-5 space-y-3">{notifications.length ? notifications.slice(0,4).map(n=><div key={n.id} className={`rounded-2xl border p-4 ${n.dibaca ? "border-slate-100 bg-slate-50" : "border-emerald-100 bg-emerald-50/50"}`}><div className="flex gap-3"><Bell size={16} className="mt-1 shrink-0 text-emerald-600"/><div><p className="text-sm font-black">{n.judul}</p><p className="mt-1 text-xs leading-5 text-slate-500">{n.isi}</p><p className="mt-2 text-[10px] font-bold text-slate-400">{new Date(n.created_at).toLocaleString("id-ID")}</p></div></div></div>) : <p className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-500">Belum ada notifikasi.</p>}</div>
          </CardContent>
        </Card>
        <Card className="rounded-[26px]">
          <CardContent className="p-6"><div className="flex items-center gap-3"><div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-50 text-cyan-600"><FileCheck2/></div><div><h2 className="font-black">Pengumuman</h2><p className="text-xs text-slate-500">Informasi resmi SPMB</p></div></div><div className="mt-5 space-y-3">{announcements.length ? announcements.slice(0,3).map(a=><div key={a.id} className="rounded-2xl border border-slate-100 bg-slate-50 p-4"><p className="text-sm font-black">{a.judul}</p><p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">{a.isi}</p></div>) : <p className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-500">Belum ada pengumuman.</p>}</div><Link to="/pengumuman"><Button variant="outline" className="mt-4 w-full">Lihat Pengumuman</Button></Link></CardContent>
        </Card>
      </div>
      {application && <Card className="mt-5 rounded-[26px] border-emerald-100"><CardContent className="p-6"><div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center"><div><p className="text-xs font-bold uppercase tracking-widest text-emerald-600">PENDAFTARAN SAYA</p><h2 className="mt-2 text-2xl font-black">{application.nomor_pendaftaran}</h2><p className="mt-1 text-sm text-slate-500">Nilai akhir: <b>{application.nilai ?? "Belum dihitung"}</b> · Rapor: {application.nilai_rapor ?? "-"} · Tes: {application.nilai_tes ?? "-"}</p><p className="mt-1 text-sm text-slate-500">Pilihan 1: {application.pilihan1?.nama || application.jurusan?.nama || "-"} · Pilihan 2: {application.pilihan2?.nama || "-"}</p>{application.diterima?.nama && <p className="mt-1 text-sm font-bold text-emerald-700">Diterima: {application.diterima.nama}</p>}</div><div className="flex flex-wrap items-center gap-2"><Link to="/siswa/kartu"><Button variant="outline">Kartu</Button></Link><Link to="/siswa/hasil-seleksi"><Button variant="outline">Hasil Seleksi</Button></Link><div className="rounded-xl border border-amber-100 bg-amber-50 px-3 py-2 text-sm font-black text-amber-700">{application.peringkat != null ? <><Trophy size={15} className="mr-1 inline"/> #{application.peringkat}</> : "Peringkat belum diproses"}</div><Badge variant={application.status==="Diterima"?"default":application.status==="Ditolak"?"red":"yellow"}>{application.status}</Badge><Link to={`/cek-status?nisn=${application.nisn}`}><Button variant="outline">Detail Status</Button></Link></div></div></CardContent></Card>}
    </main>
  </div>
}
