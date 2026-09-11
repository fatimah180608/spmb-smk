import { Link, NavLink, Outlet } from "react-router-dom";
import { Menu, X, ArrowRight, LogIn, MapPin, Phone, ShieldCheck, Youtube, Instagram, Facebook } from "lucide-react";
import { useState } from "react";
import Logo from "./Logo";
import { Button } from "./ui/button";
import { useSchool } from "@/context/SchoolContext";
import { useAuth } from "@/context/AuthContext";

export default function PublicLayout() {
  const [open, setOpen] = useState(false);
  const { school } = useSchool();
  const { session, profile, signOut } = useAuth();
  const name = school?.nama || "SMK Teknologi Nusantara";
  const links = [["Beranda", "/"], ["Profil Sekolah", "/profil"], ["Jurusan", "/jurusan"], ["Berita", "/berita"], ["Pengumuman", "/pengumuman"], ["Cek Status", "/cek-status"]];
  const close = () => setOpen(false);
  return (
    <div className="min-h-screen bg-white text-slate-900">
      <div className="bg-[#08605e] text-white">
        <div className="mx-auto flex h-7 max-w-[1140px] items-center justify-between px-4 text-[11px] font-semibold sm:px-6">
          <div className="flex items-center gap-5"><span className="flex items-center gap-1.5"><MapPin size={11} /> {school?.alamat || "Jl. Pendidikan No. 12, Kec. Ngasem, Kab. Kediri, Jawa Timur"}</span><span className="hidden md:block"><Phone size={11} className="mr-1 inline" /> {school?.no_telp || "(0354) 123456"}</span></div>
          <div className="hidden items-center gap-3 sm:flex"><span>info@smkteknologinusantara.sch.id</span><Youtube size={11}/><Instagram size={11}/><Facebook size={11}/></div>
        </div>
      </div>
      <header className="sticky top-0 z-50 border-b border-slate-100 bg-white/95 backdrop-blur">
        <div className="mx-auto flex min-h-[70px] max-w-[1140px] items-center justify-between gap-4 px-4 sm:px-6">
          <Link to="/" onClick={close}><Logo school={school} compact /></Link>
          <nav className="hidden items-center gap-2 lg:flex">
            {links.map(([label, href], i) => <NavLink key={`${label}-${i}`} to={href} end={href === "/"} className={({ isActive }) => `rounded-full px-3.5 py-2.5 text-[12px] font-extrabold transition ${isActive && href !== "/profil" ? "bg-[#087f68] text-white" : "text-[#154a5a] hover:bg-[#e8f8f4] hover:text-[#087f68]"}`}>{label}{(label === "Profil Sekolah" || label === "Jurusan") && <span className="ml-1">⌄</span>}</NavLink>)}
          </nav>
          <div className="hidden items-center gap-2 lg:flex">
            <span className="mr-1 text-lg text-[#0b4a5e]">⌕</span>
            {session ? <><Link to={profile?.role === "admin" ? "/admin" : "/siswa"}><Button variant="outline" className="h-9 rounded-full border-[#0b9a82] px-4.5 text-[12px] font-black">{profile?.role === "admin" ? "Dashboard Admin" : "Portal Siswa"}</Button></Link><Button variant="ghost" className="h-9 rounded-full px-3.5 text-[12px] font-bold" onClick={signOut}>Keluar</Button></> : <><Link to="/siswa/login"><Button variant="outline" className="h-9 rounded-full border-[#087f68] px-4.5 text-[12px] font-black text-[#087f68]"><LogIn size={13}/> Login</Button></Link><Link to="/siswa/register"><Button className="h-9 rounded-full bg-[#087f68] px-4.5 text-[12px] font-black hover:bg-[#066b59]">Daftar <ArrowRight size={13}/></Button></Link></>}
          </div>
          <button className="rounded-xl border border-slate-200 p-2 lg:hidden" onClick={() => setOpen(!open)}>{open ? <X size={20}/> : <Menu size={20}/>}</button>
        </div>
        {open && <div className="border-t border-slate-100 bg-white px-4 pb-4 pt-2 lg:hidden"><nav className="space-y-1">{links.map(([label, href], i) => <NavLink key={`${label}-${i}`} to={href} end={href === "/"} onClick={close} className="block rounded-xl px-3 py-2.5 text-sm font-bold text-slate-600 hover:bg-emerald-50 hover:text-emerald-700">{label}</NavLink>)}</nav><div className="mt-3 grid gap-2 border-t pt-3"><Link to="/siswa/login" onClick={close}><Button variant="outline" className="w-full rounded-xl">Login</Button></Link><Link to="/siswa/register" onClick={close}><Button className="w-full rounded-xl bg-[#087f68]">Daftar Sekarang</Button></Link><Link to="/admin/login" onClick={close}><Button variant="ghost" className="w-full rounded-xl text-slate-500"><ShieldCheck size={15}/> Login Admin</Button></Link></div></div>}
      </header>
      <main><Outlet/></main>
      <footer className="bg-[#075d5b] text-white">
        <div className="mx-auto grid max-w-[1140px] gap-8 px-4 py-7 sm:px-6 md:grid-cols-[1.25fr_.7fr_.7fr_.8fr]">
          <div><Logo school={school} light compact /><p className="mt-3 max-w-sm text-[11px] leading-5 text-white/70">Portal informasi SMK Teknologi Nusantara. Unggul • Berkarakter • Siap Kerja.</p></div>
          <div><h4 className="text-[13px] font-black">Tautan Cepat</h4><div className="mt-2 space-y-1 text-[11px] text-white/70">{links.slice(0,5).map(([label, href]) => <Link key={label} to={href} className="block hover:text-white">• {label}</Link>)}</div></div>
          <div><h4 className="text-[13px] font-black">Jurusan</h4><div className="mt-2 grid grid-cols-2 text-[11px] leading-5 text-white/70"><span>• RPL<br/>• DPIB<br/>• Akuntansi<br/>• TP</span><span>• TPTU<br/>• TKP<br/>• Kuliner</span></div></div>
          <div><h4 className="text-[13px] font-black">Ikuti Kami</h4><div className="mt-3 flex gap-2"><span className="rounded-md bg-white/10 p-2"><Youtube size={12}/></span><span className="rounded-md bg-white/10 p-2"><Instagram size={12}/></span><span className="rounded-md bg-white/10 p-2"><Facebook size={12}/></span></div><p className="mt-4 text-[11px] font-semibold italic text-white/80">Bersama Membangun<br/>Masa Depan</p></div>
        </div>
        <div className="border-t border-white/10"><div className="mx-auto flex max-w-[1140px] justify-between px-4 py-3 text-[8px] text-white/45 sm:px-6"><span>© {new Date().getFullYear()} {name}</span><span>SPMB Digital • {school?.tahun_pelajaran || "2026/2027"}</span></div></div>
      </footer>
    </div>
  );
}
