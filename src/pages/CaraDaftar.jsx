import { CheckCircle2, FileText, Printer, Search, UserPlus, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { useSchool } from "@/context/SchoolContext";
import { SCHOOL_IMAGES } from "@/lib/schoolImages";
import { Button } from "@/components/ui/button";
const steps=[
 ["01","Buat akun siswa",UserPlus,"Daftarkan email dan password untuk mendapatkan akses portal siswa."],
 ["02","Isi formulir SPMB",FileText,"Lengkapi data pribadi, orang tua/wali, asal sekolah, dan pilihan jurusan."],
 ["03","Cetak kartu",Printer,"Setelah berhasil dikirim, simpan nomor pendaftaran dan cetak kartu sebagai arsip."],
 ["04","Cek status",Search,"Pantau proses verifikasi dan hasil pendaftaran menggunakan nomor pendaftaran."]
];
export default function CaraDaftar(){const {school}=useSchool();return <div className="container-app py-12 sm:py-16">
 <div className="grid overflow-hidden rounded-[34px] bg-gradient-to-br from-emerald-950 to-slate-950 text-white shadow-xl lg:grid-cols-[1fr_.8fr]"><div className="p-8 sm:p-12"><p className="font-black tracking-[.18em] text-emerald-300">PANDUAN SPMB</p><h1 className="mt-3 text-4xl font-black sm:text-5xl">Cara Pendaftaran SPMB</h1><p className="mt-4 max-w-2xl leading-7 text-slate-300">Ikuti langkah berikut untuk mendaftar sebagai calon murid {school?.nama||"SMK Teknologi Nusantara"}.</p><Link to="/siswa/register"><Button className="mt-7 rounded-2xl bg-black text-slate-950 hover:bg-slate-100">Buat Akun Siswa <ArrowRight size={17}/></Button></Link></div><img src={SCHOOL_IMAGES.building} alt="Gedung SMK Teknologi Nusantara" className="h-full min-h-64 w-full object-cover"/></div>
 <div className="mt-12 grid gap-5 md:grid-cols-2">{steps.map(([no,title,Icon,text])=><div key={no} className="group rounded-[26px] border border-slate-200 bg-white p-7 shadow-sm transition hover:-translate-y-1 hover:border-emerald-200 hover:shadow-xl"><div className="flex items-center gap-4"><span className="text-sm font-black text-emerald-600">{no}</span><div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600"><Icon size={21}/></div><h3 className="font-black">{title}</h3></div><p className="mt-5 text-sm leading-7 text-slate-500">{text}</p></div>)}</div>
 <div className="mt-7 grid gap-5 lg:grid-cols-[1fr_.7fr]"><div className="rounded-[26px] border border-amber-100 bg-amber-50 p-7 text-amber-950"><div className="flex items-start gap-3"><CheckCircle2 className="mt-0.5 shrink-0 text-amber-700"/><div><h3 className="font-black">Syarat pendaftaran</h3><p className="mt-2 text-sm leading-7">Siapkan data identitas, data orang tua/wali, asal sekolah, pilihan jurusan, serta dokumen yang diminta panitia SPMB. Pastikan data yang diisi benar.</p></div></div></div><div className="rounded-[26px] bg-slate-950 p-7 text-white"><p className="text-xs font-black uppercase tracking-widest text-emerald-300">Butuh bantuan?</p><h3 className="mt-2 text-xl font-black">Hubungi panitia sekolah.</h3><p className="mt-2 text-sm leading-6 text-slate-400">Informasi kontak dapat dilihat pada bagian footer website.</p></div></div>
 </div>}
