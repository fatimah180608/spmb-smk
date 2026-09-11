import { Link } from "react-router-dom";
import { ArrowRight, Award, BookOpenCheck, Building2, CheckCircle2, GraduationCap, History, MapPin, Phone, Sparkles, Users, BriefcaseBusiness } from "lucide-react";
import { useSchool } from "@/context/SchoolContext";
import { SCHOOL_IMAGES } from "@/lib/schoolImages";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const values = [
  ["Karakter", "Membentuk peserta didik yang berintegritas, disiplin, percaya diri, dan bertanggung jawab."],
  ["Budaya Industri", "Mengenalkan standar kerja, komunikasi profesional, keselamatan, dan etos kerja."],
  ["Kompetensi", "Menguatkan keterampilan kejuruan, literasi digital, kreativitas, dan pemecahan masalah."],
  ["Siap Berkarya", "Mendorong siswa menghasilkan karya, portofolio, dan pengalaman yang relevan."]
];

export default function ProfilSekolah() {
  const { school } = useSchool();
  const name = school?.nama || "SMK Teknologi Nusantara";
  return (
    <div className="bg-[#f6faf8]">
      <section className="relative overflow-hidden bg-[#052b2a] text-white">
        <div className="absolute inset-0 hero-grid opacity-30" />
        <div className="container-app relative grid min-h-[560px] items-center gap-10 py-16 lg:grid-cols-[.9fr_1.1fr]">
          <div>
            <Badge className="border-white/10 bg-white/10 text-white"><Sparkles size={14}/> Profil Sekolah</Badge>
            <h1 className="mt-6 text-5xl font-black leading-[1.02] tracking-[-.05em] sm:text-6xl">Mengenal lebih dekat <span className="text-emerald-300">{name}.</span></h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-white/65">Sekolah vokasi modern yang memadukan pembelajaran, praktik, karakter, dan kesiapan menghadapi dunia profesional.</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/jurusan"><Button className="rounded-2xl bg-emerald-300 font-black text-[#063b36] hover:bg-emerald-200">Lihat Program <ArrowRight size={17}/></Button></Link>
              <Link to="/daftar"><Button variant="outline" className="rounded-2xl border-white/15 bg-white/5 text-white hover:bg-white/10 hover:text-white">Daftar SPMB</Button></Link>
            </div>
          </div>
          <div className="relative">
            <div className="absolute -inset-6 rounded-[44px] bg-emerald-300/10 blur-3xl"/>
            <img src={SCHOOL_IMAGES.building} alt={`Gedung ${name}`} className="relative w-full rounded-[38px] shadow-2xl ring-1 ring-white/10"/>
          </div>
        </div>
      </section>

      <section className="container-app py-20 sm:py-24">
        <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_.95fr]">
          <div>
            <p className="section-kicker">TENTANG KAMI</p>
            <h2 className="section-title">Pendidikan vokasi untuk dunia yang terus berubah.</h2>
            <p className="mt-5 text-base leading-8 text-slate-600">{name} menjadi ruang belajar bagi siswa untuk memahami teori, berlatih dengan proyek nyata, bekerja dalam tim, dan membangun kepercayaan diri untuk melangkah ke masa depan.</p>
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <Info icon={History} title="Orientasi" text="Vokasi modern dan aplikatif."/>
              <Info icon={Award} title="Nilai utama" text="Karakter, kompetensi, dan karya."/>
              <Info icon={GraduationCap} title="Pembelajaran" text="Teori terhubung dengan praktik."/>
              <Info icon={BriefcaseBusiness} title="Karier" text="Mengenal budaya kerja profesional."/>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <img src="/images/jurusan/rpl.jpg" alt="Siswa belajar teknologi dan pemrograman" className="h-64 w-full rounded-[30px] object-cover shadow-xl"/>
            <img src="/images/jurusan/dpib.jpg" alt="Kegiatan pembelajaran dan praktik siswa" className="mt-10 h-64 w-full rounded-[30px] object-cover shadow-xl"/>
          </div>
        </div>
      </section>

      <section className="bg-white py-20">
        <div className="container-app grid items-center gap-12 lg:grid-cols-[.75fr_1.25fr]">
          <div className="overflow-hidden rounded-[34px] bg-emerald-50 shadow-xl"><img src={SCHOOL_IMAGES.building} alt={`Lingkungan ${name}`} className="w-full"/></div>
          <div>
            <p className="section-kicker">ARAH PENDIDIKAN</p>
            <h2 className="section-title">Membentuk generasi yang siap belajar, bekerja, dan berkarya.</h2>
            <p className="mt-5 leading-8 text-slate-600">Setiap kegiatan diarahkan untuk membangun keterampilan teknis sekaligus kemampuan komunikasi, kolaborasi, disiplin, kreativitas, dan tanggung jawab.</p>
            <div className="mt-8 space-y-4">
              {["Pembelajaran berbasis praktik dan proyek", "Penguatan karakter dan budaya kerja", "Pemanfaatan teknologi digital", "Pengembangan portofolio dan karya siswa"].map((x)=><div key={x} className="flex items-center gap-3"><span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-50 text-emerald-700"><CheckCircle2 size={16}/></span><span className="font-bold text-slate-700">{x}</span></div>)}
            </div>
          </div>
        </div>
      </section>

      <section className="container-app py-20">
        <p className="section-kicker">NILAI UTAMA</p><h2 className="section-title">Prinsip yang kami bawa.</h2>
        <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-4">{values.map(([title,text])=><div key={title} className="card-hover rounded-[28px] border bg-white p-6"><div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700"><CheckCircle2 size={20}/></div><h3 className="mt-5 font-black">{title}</h3><p className="mt-2 text-sm leading-6 text-slate-500">{text}</p></div>)}</div>
      </section>

      <section className="bg-[#eaf7f2] py-16">
        <div className="container-app grid gap-5 md:grid-cols-3">
          <Contact icon={MapPin} title="Alamat" text={school?.alamat || "Jl. Pendidikan No. 1, Jawa Timur"}/>
          <Contact icon={Phone} title="Telepon" text={school?.no_telp || "(0355) 700 2026"}/>
          <Contact icon={Building2} title="NPSN" text={school?.npsn || "Belum diatur"}/>
        </div>
      </section>
    </div>
  );
}
function Info({icon:Icon,title,text}){return <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4"><Icon size={19} className="text-emerald-700"/><h3 className="mt-3 text-sm font-black">{title}</h3><p className="mt-1 text-xs leading-5 text-slate-500">{text}</p></div>}
function Contact({icon:Icon,title,text}){return <div className="rounded-[28px] border border-slate-200 bg-white p-7 shadow-sm"><div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700"><Icon/></div><h3 className="mt-5 font-black">{title}</h3><p className="mt-2 text-sm leading-6 text-slate-500">{text}</p></div>}
