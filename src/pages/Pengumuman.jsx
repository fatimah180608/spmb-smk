import { useEffect, useState } from "react";
import { CalendarDays, Megaphone } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function Pengumuman(){
  const [rows,setRows]=useState([]);
  const [loading,setLoading]=useState(true);
  useEffect(()=>{
    let alive=true;
    async function load(){
      if(!supabase){setLoading(false);return;}
      const {data,error}=await supabase.from("pengumuman").select("*").eq("published",true).order("created_at",{ascending:false});
      if(alive){ if(error) console.error(error); setRows(data||[]); setLoading(false); }
    }
    load(); return ()=>{alive=false};
  },[]);
  return <div className="bg-slate-50 py-12 sm:py-16"><div className="container-app">
    <div className="rounded-[30px] bg-gradient-to-br from-slate-950 to-emerald-950 p-8 text-white shadow-xl sm:p-12">
      <Badge className="border-white/10 bg-white/10 text-white">PENGUMUMAN RESMI</Badge>
      <h1 className="mt-4 text-4xl font-black sm:text-5xl">Informasi resmi SPMB.</h1>
      <p className="mt-4 max-w-2xl leading-7 text-slate-300">Pengumuman dari panitia SPMB dipisahkan dari berita kegiatan sekolah agar informasi penting lebih mudah ditemukan.</p>
    </div>
    <div className="mt-8 space-y-5">
      {loading && <div className="rounded-2xl bg-white p-8 text-center text-sm text-slate-500">Memuat pengumuman...</div>}
      {!loading && !rows.length && <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-10 text-center text-sm text-slate-500">Belum ada pengumuman resmi.</div>}
      {rows.map((r)=><Card key={r.id} className="rounded-[26px]"><CardHeader><div className="flex gap-4"><div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600"><Megaphone size={20}/></div><div><CardTitle>{r.judul}</CardTitle><p className="mt-2 flex items-center gap-2 text-xs font-semibold text-slate-400"><CalendarDays size={14}/>{new Date(r.created_at).toLocaleDateString("id-ID",{day:"numeric",month:"long",year:"numeric"})}</p></div></div></CardHeader><CardContent><p className="whitespace-pre-wrap text-sm leading-7 text-slate-600">{r.isi}</p></CardContent></Card>)}
    </div>
  </div></div>;
}
