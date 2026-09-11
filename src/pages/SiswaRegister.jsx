import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, Eye, EyeOff, GraduationCap, LockKeyhole, Mail, UserPlus, AlertCircle, CheckCircle2 } from "lucide-react";
import { supabase, supabaseConfigured, getSupabaseSetupMessage } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";

export default function SiswaRegister() {
  const [f, setF] = useState({ email:"", password:"", confirm:"", nama:"" });
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const nav = useNavigate();
  const location = useLocation();
  const next = new URLSearchParams(location.search).get("next") || "/siswa";

  async function submit(e) {
    e.preventDefault(); setError(""); setSuccess("");
    if (!supabaseConfigured || !supabase) { setError(getSupabaseSetupMessage()); return; }
    if (f.password.length < 6) { setError("Password minimal 6 karakter."); return; }
    if (f.password !== f.confirm) { setError("Konfirmasi password tidak sama."); return; }
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email: f.email.trim(), password: f.password,
      options: { data: { nama: f.nama.trim() }, emailRedirectTo: `${window.location.origin}/siswa/login` }
    });
    if (error) { setLoading(false); setError(error.message); return; }
    if (data.session && data.user) {
      await supabase.from("profiles").upsert({ id:data.user.id, email:f.email.trim(), nama:f.nama.trim(), role:"student" });
      setLoading(false); nav(next, { replace:true });
      return;
    }
    setLoading(false);
    setSuccess("Akun berhasil dibuat. Jika konfirmasi email aktif di Supabase, buka email konfirmasi lalu login ke Portal Siswa.");
  }

  return (
    <div className="min-h-screen bg-slate-950">
      <div className="grid min-h-screen lg:grid-cols-[1fr_.9fr]">
        <div className="gradient-brand relative hidden overflow-hidden p-12 text-white lg:flex lg:flex-col lg:justify-between"><img src="/images/school-building.jpg" alt="Aktivitas siswa" className="absolute inset-0 h-full w-full object-cover opacity-20"/><div className="absolute inset-0 bg-slate-950/50"/>
          <Link to="/" className="relative inline-flex w-fit items-center gap-2 text-sm text-slate-300 hover:text-white"><ArrowLeft size={16}/> Kembali ke website</Link>
          <div className="relative max-w-xl"><div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10"><GraduationCap size={32}/></div><p className="font-bold text-emerald-300">PENDAFTARAN AKUN SISWA</p><h1 className="mt-3 text-5xl font-black leading-tight">Buat akun untuk mulai SPMB.</h1><p className="mt-5 leading-7 text-slate-300">Akun siswa terpisah dari administrator. Kamu hanya mendapatkan fitur yang berkaitan dengan pendaftaran dan informasi SPMB.</p></div>
          <p className="relative text-sm text-slate-400">SMK Teknologi Nusantara • Portal SPMB</p>
        </div>
        <div className="flex items-center justify-center p-5 sm:p-10">
          <Card className="w-full max-w-md rounded-[30px] border-0 shadow-2xl"><CardContent className="p-7 sm:p-9">
            <Link to={`/siswa/login?next=${encodeURIComponent(next)}`} className="inline-flex items-center gap-2 text-sm font-bold text-slate-400"><ArrowLeft size={16}/> Kembali ke login</Link>
            <div className="mt-7"><div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600"><UserPlus/></div><h2 className="mt-5 text-3xl font-black">Buat Akun Siswa</h2><p className="mt-2 text-sm leading-6 text-slate-500">Akun ini digunakan khusus untuk proses SPMB.</p></div>
            {error&&<div className="mt-6 flex gap-2 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm text-red-700"><AlertCircle size={18} className="mt-0.5 shrink-0"/>{error}</div>}
            {success&&<div className="mt-6 flex gap-2 rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-sm text-emerald-700"><CheckCircle2 size={18} className="mt-0.5 shrink-0"/>{success}</div>}
            <form onSubmit={submit} className="mt-7 space-y-5">
              <label className="text-sm font-bold">Nama<input className="mt-2 h-12 w-full rounded-2xl border border-slate-200 px-3 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10" value={f.nama} onChange={e=>setF({...f,nama:e.target.value})} placeholder="Nama lengkap" required/></label>
              <label className="text-sm font-bold">Email<div className="relative mt-2"><Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18}/><Input className="h-12 rounded-2xl pl-10" type="email" value={f.email} onChange={e=>setF({...f,email:e.target.value})} placeholder="emailkamu@gmail.com" required/></div></label>
              <label className="text-sm font-bold">Password<div className="relative mt-2"><LockKeyhole className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18}/><Input className="h-12 rounded-2xl pl-10 pr-11" type={show?"text":"password"} value={f.password} onChange={e=>setF({...f,password:e.target.value})} placeholder="Minimal 6 karakter" required/><button type="button" onClick={()=>setShow(!show)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">{show?<EyeOff size={18}/>:<Eye size={18}/>}</button></div></label>
              <label className="text-sm font-bold">Konfirmasi Password<Input className="mt-2 h-12 rounded-2xl" type={show?"text":"password"} value={f.confirm} onChange={e=>setF({...f,confirm:e.target.value})} placeholder="Ulangi password" required/></label>
              <Button className="h-12 w-full rounded-2xl" disabled={loading}>{loading?"Membuat akun...":"Daftar Akun Siswa"}</Button>
            </form>
          </CardContent></Card>
        </div>
      </div>
    </div>
  );
}
