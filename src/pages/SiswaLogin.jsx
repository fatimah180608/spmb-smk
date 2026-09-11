import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, Eye, EyeOff, GraduationCap, LockKeyhole, Mail, AlertCircle } from "lucide-react";
import { supabase, supabaseConfigured, getSupabaseSetupMessage } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";

export default function SiswaLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const nav = useNavigate();
  const location = useLocation();
  const next = new URLSearchParams(location.search).get("next") || "/siswa";

  async function submit(e) {
    e.preventDefault();
    setError("");
    if (!supabaseConfigured || !supabase) {
      setError(getSupabaseSetupMessage());
      return;
    }
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (error) {
      setLoading(false);
      setError(error.message);
      return;
    }
    const { data: profile } = await supabase.from("profiles").select("role").eq("id", data.user.id).maybeSingle();
    setLoading(false);
    if (profile?.role === "admin") {
      await supabase.auth.signOut();
      setError("Akun administrator harus masuk melalui halaman Login Admin.");
      return;
    }
    nav(next, { replace: true });
  }

  return (
    <div className="min-h-screen bg-slate-950">
      <div className="grid min-h-screen lg:grid-cols-[1fr_.9fr]">
        <div className="gradient-brand relative hidden overflow-hidden p-12 text-white lg:flex lg:flex-col lg:justify-between"><img src="/images/school-building.jpg" alt="Aktivitas siswa" className="absolute inset-0 h-full w-full object-cover opacity-20"/><div className="absolute inset-0 bg-slate-950/50"/>
          <Link to="/" className="relative inline-flex w-fit items-center gap-2 text-sm text-slate-300 hover:text-white"><ArrowLeft size={16}/> Kembali ke website</Link>
          <div className="relative max-w-xl">
            <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10"><GraduationCap size={32}/></div>
            <p className="font-bold text-emerald-300">PORTAL CALON MURID</p>
            <h1 className="mt-3 text-5xl font-black leading-tight">Satu akun untuk proses SPMB kamu.</h1>
            <p className="mt-5 max-w-lg leading-7 text-slate-300">Daftar akun, isi formulir SPMB, simpan nomor pendaftaran, dan pantau status seleksi dari satu tempat.</p>
          </div>
          <p className="relative text-sm text-slate-400">SMK Teknologi Nusantara • Portal SPMB</p>
        </div>

        <div className="flex items-center justify-center p-5 sm:p-10">
          <Card className="w-full max-w-md rounded-[30px] border-0 shadow-2xl">
            <CardContent className="p-7 sm:p-9">
              <Link to="/" className="inline-flex items-center gap-2 text-sm font-bold text-slate-400 lg:hidden"><ArrowLeft size={16}/> Kembali</Link>
              <div className="mt-7 lg:mt-0">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600"><GraduationCap/></div>
                <h2 className="mt-5 text-3xl font-black">Masuk Portal Siswa</h2>
                <p className="mt-2 text-sm leading-6 text-slate-500">Gunakan akun siswa untuk melanjutkan pendaftaran SPMB.</p>
              </div>
              {error && <div className="mt-6 flex gap-2 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm text-red-700"><AlertCircle size={18} className="mt-0.5 shrink-0"/><span>{error}</span></div>}
              <form onSubmit={submit} className="mt-7 space-y-5">
                <label className="text-sm font-bold">Email<Input className="mt-2 h-12 rounded-2xl" type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="emailkamu@gmail.com" required/></label>
                <label className="text-sm font-bold">Password<div className="relative mt-2"><LockKeyhole className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18}/><Input className="h-12 rounded-2xl pl-10 pr-11" type={show?"text":"password"} value={password} onChange={e=>setPassword(e.target.value)} placeholder="Masukkan password" required/><button type="button" onClick={()=>setShow(!show)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">{show?<EyeOff size={18}/>:<Eye size={18}/>}</button></div></label>
                <Button className="h-12 w-full rounded-2xl" disabled={loading}>{loading?"Memproses...":"Masuk sebagai Siswa"}</Button>
              </form>
              <div className="mt-6 rounded-2xl bg-slate-50 p-4 text-sm text-slate-500">Belum punya akun? <Link className="font-black text-emerald-600" to={`/siswa/register?next=${encodeURIComponent(next)}`}>Daftar akun siswa</Link></div>
              <div className="mt-5 text-center"><Link to="/admin/login" className="text-xs font-bold text-slate-400 hover:text-slate-700">Login khusus Administrator →</Link></div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
