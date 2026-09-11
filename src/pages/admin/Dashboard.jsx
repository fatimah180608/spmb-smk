import { useEffect,useState } from "react";
import { CalendarDays, CheckCircle2, Clock3, GraduationCap, Users, XCircle, TrendingUp, Search } from "lucide-react";
import { supabase } from "@/lib/supabase";
import StatCard from "@/components/StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDateTime } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import Loading from "@/components/Loading";

export default function Dashboard(){
  const [d,setD]=useState(null);
  const [search,setSearch]=useState("");
  const [filterJurusan,setFilterJurusan]=useState("");
  useEffect(()=>{async function load(){
    const {data:rows,error}=await supabase.from("calon_siswa").select("id,nama,nisn,status,status_seleksi,created_at,jurusan_id,pilihan_jurusan_1_id,pilihan_jurusan_2_id,jurusan_diterima_id,nilai,peringkat").order("created_at",{ascending:false});
    if(error){ console.error("Dashboard calon_siswa:", error); setD({error:error.message,all:[],recent:[],accepted:0,pending:0,rejected:0,today:0,month:0,year:0,byJurusan:[]}); return; }
    const all=rows||[]; const now=new Date();
    const today=all.filter(x=>new Date(x.created_at).toDateString()===now.toDateString()).length;
    const month=all.filter(x=>{const d=new Date(x.created_at);return d.getMonth()===now.getMonth()&&d.getFullYear()===now.getFullYear()}).length;
    const year=all.filter(x=>new Date(x.created_at).getFullYear()===now.getFullYear()).length;
    const byJurusan=Object.entries(all.reduce((a,x)=>{const n=x.jurusan_id||"Belum dipilih";a[n]=(a[n]||0)+1;return a},{})).sort((a,b)=>b[1]-a[1]);
    const { data: jurusanData } = await supabase.from("jurusan").select("id,nama");
    const jurusanMap=Object.fromEntries((jurusanData||[]).map(j=>[j.id,j.nama]));
    const withNames=all.map(x=>({...x,jurusanName:jurusanMap[x.jurusan_id]||"Belum dipilih"}));
    const jurusanOptions=jurusanData||[];
    const namedByJurusan=Object.entries(withNames.reduce((a,x)=>{const n=x.jurusanName;a[n]=(a[n]||0)+1;return a},{})).sort((a,b)=>b[1]-a[1]);
    setD({all:withNames,recent:withNames.slice(0,7),accepted:withNames.filter(x=>x.status==="Diterima").length,pending:withNames.filter(x=>x.status==="Menunggu Verifikasi").length,rejected:withNames.filter(x=>x.status==="Ditolak").length,today,month,year,byJurusan:namedByJurusan,jurusanOptions});
  }load()},[]);
  if(!d)return <Loading/>;
  const rankMap = Object.fromEntries([...d.all].filter(x=>x.nilai !== null && x.nilai !== undefined).sort((a,b)=>Number(b.nilai)-Number(a.nilai) || new Date(a.created_at)-new Date(b.created_at) || String(a.id).localeCompare(String(b.id))).map((x,i)=>[x.id,x.peringkat ?? i+1]));
  if(d.error) return <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700"><h2 className="font-black">Tidak dapat memuat data pendaftar</h2><p className="mt-2 text-sm leading-6">{d.error}</p><p className="mt-3 text-xs">Buka DevTools Console jika perlu untuk melihat detail.</p></div>;
  return <div>
    <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="text-sm font-semibold text-emerald-600">ADMINISTRATOR</p><h1 className="mt-1 text-3xl font-black">Dashboard SPMB</h1><p className="mt-1 text-sm text-slate-500">Pantau jumlah pendaftar dan proses seleksi secara real-time dari database.</p></div><div className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700"><TrendingUp className="mr-2 inline" size={17}/> {d.all.length} total pendaftar</div></div>
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4"><StatCard title="Total Pendaftar" value={d.all.length} icon={Users} tone="emerald" note="Semua pendaftar"/><StatCard title="Hari Ini" value={d.today} icon={CalendarDays} tone="blue" note="Pendaftar baru"/><StatCard title="Bulan Ini" value={d.month} icon={Clock3} tone="amber" note="Bulan berjalan"/><StatCard title={`Tahun ${new Date().getFullYear()}`} value={d.year} icon={GraduationCap} tone="purple" note="Tahun berjalan"/></div>
    <div className="mt-5 grid gap-4 md:grid-cols-3"><Mini label="Menunggu Verifikasi" value={d.pending} color="bg-amber-500"/><Mini label="Lulus Seleksi" value={d.accepted} color="bg-emerald-500"/><Mini label="Belum Lulus" value={d.rejected} color="bg-red-500"/></div>
    <div className="mt-6 grid gap-5 lg:grid-cols-[1.35fr_.65fr]">
      <Card><CardHeader><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><CardTitle>Daftar Pendaftar</CardTitle><div className="flex flex-col gap-2 sm:flex-row"><div className="relative"><Search className="absolute left-3 top-3 text-slate-400" size={16}/><Input className="h-10 w-full pl-9 sm:w-56" placeholder="Cari nama / NISN..." value={search} onChange={e=>setSearch(e.target.value)}/></div><select value={filterJurusan} onChange={e=>setFilterJurusan(e.target.value)} className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold outline-none focus:border-emerald-500"><option value="">Semua Jurusan</option>{d.jurusanOptions.map(j=><option key={j.id} value={j.id}>{j.nama}</option>)}</select></div></div></CardHeader><CardContent><div className="space-y-3">{d.all.filter(x=>(!search.trim() || `${x.nama} ${x.nisn||""} ${x.id}`.toLowerCase().includes(search.trim().toLowerCase())) && (!filterJurusan || x.pilihan_jurusan_1_id===filterJurusan || x.pilihan_jurusan_2_id===filterJurusan || x.jurusan_diterima_id===filterJurusan)).slice(0,12).map(x=><div key={x.id} className="flex items-center justify-between rounded-xl bg-slate-50 p-4"><div><div className="flex items-center gap-2"><div className="font-bold">{x.nama}</div>{rankMap[x.id] ? <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-black text-amber-700">#{rankMap[x.id]}</span> : null}</div><div className="mt-1 text-xs font-semibold text-slate-500">NISN: <span className="font-bold text-slate-700">{x.nisn || "-"}</span></div><div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500"><GraduationCap size={13}/>{x.jurusanName||"-"} • <CalendarDays size={13}/>{formatDateTime(x.created_at)}</div></div><div className="flex items-center gap-2"><span className="hidden rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-black text-emerald-700 sm:inline">{x.nilai ? `Nilai ${Number(x.nilai).toFixed(2)}` : "Nilai -"}</span><Badge variant={x.status_seleksi==="diterima"?"default":x.status_seleksi==="tidak_diterima"?"red":"yellow"}>{x.status_seleksi==="diterima"?"Lulus":x.status_seleksi==="tidak_diterima"?"Belum Lulus":"Menunggu"}</Badge></div></div>)}{!d.all.length&&<div className="rounded-2xl bg-slate-50 p-8 text-center text-sm text-slate-500">Belum ada pendaftar.</div>}{d.all.length && !d.all.filter(x=>(!search.trim() || `${x.nama} ${x.nisn||""} ${x.id}`.toLowerCase().includes(search.trim().toLowerCase())) && (!filterJurusan || x.pilihan_jurusan_1_id===filterJurusan || x.pilihan_jurusan_2_id===filterJurusan || x.jurusan_diterima_id===filterJurusan)).length && <div className="rounded-2xl bg-slate-50 p-8 text-center text-sm text-slate-500">Pendaftar tidak ditemukan.</div>}</div></CardContent></Card>
      <Card><CardHeader><CardTitle>Jumlah per Jurusan</CardTitle></CardHeader><CardContent><div className="space-y-4">{d.byJurusan.map(([name,count])=><div key={name}><div className="flex justify-between gap-3 text-sm"><span className="font-semibold">{name}</span><span className="font-black">{count}</span></div><div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-emerald-500" style={{width:`${Math.max(4,count/Math.max(1,d.all.length)*100)}%`}}/></div></div>)}{!d.byJurusan.length&&<p className="text-sm text-slate-500">Belum ada data jurusan.</p>}</div></CardContent></Card>
    </div>
  </div>
}
function Mini({label,value,color}){return <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-5"><div><p className="text-xs font-bold uppercase tracking-wider text-slate-400">{label}</p><p className="mt-1 text-3xl font-black">{value}</p></div><span className={`h-3 w-3 rounded-full ${color}`}/></div>}
