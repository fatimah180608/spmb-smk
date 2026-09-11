import { Link } from "react-router-dom";
import { ArrowRight, GraduationCap, Building2, UserRound, BriefcaseBusiness, Users, Trophy, Code2, Ruler, ChartNoAxesCombined, Settings, Shirt, Network, ChefHat, PlayCircle, MapPin, Phone, Mail } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { SCHOOL_IMAGES, STATIC_NEWS } from "@/lib/schoolImages";
import { useSchool } from "@/context/SchoolContext";

const fallbackJurusan = [
  ["RPL", "Rekayasa Perangkat Lunak", "/images/jurusan/rpl.jpg"],
  ["DPIB", "Desain Pemodelan dan Informasi Bangunan", "/images/jurusan/dpib.jpg"],
  ["Akuntansi", "Akuntansi dan Keuangan", "/images/jurusan/akuntansi.jpg"],
  ["TP", "Teknik Pemesinan", "/images/jurusan/tp.jpg"],
  ["TPTU", "Tata Busana (Produksi Tekstil)", "/images/jurusan/tptu.jpg"],
  ["TKP", "Teknik Komputer dan Jaringan", "/images/jurusan/tkp.jpg"],
  ["Kuliner", "Tata Boga", "/images/jurusan/kuliner.jpg"],
];

const icons = [Code2, Ruler, ChartNoAxesCombined, Settings, Shirt, Network, ChefHat];
const tones = [
  "bg-[#effbf1] border-[#d8efdd] text-[#13886b]",
  "bg-[#edf7fd] border-[#d9eaf5] text-[#1478bc]",
  "bg-[#fff8e9] border-[#f3e7c8] text-[#b27a00]",
  "bg-[#fff0f7] border-[#f1d9e8] text-[#e51d5d]",
  "bg-[#fff0f7] border-[#f1d9e8] text-[#e51d5d]",
  "bg-[#f3efff] border-[#e1d9f6] text-[#6940d7]",
  "bg-[#eafaf7] border-[#d5eee8] text-[#138c78]",
];

export default function Home() {
  const { school } = useSchool();
  const name = school?.nama || "SMK Teknologi Nusantara";
  const year = school?.tahun_pelajaran || "2026/2027";
  const [jurusan, setJurusan] = useState([]);
  const [news, setNews] = useState(STATIC_NEWS);

  useEffect(() => {
    let alive = true;
    async function load() {
      const fallback = fallbackJurusan.map(([kode, nama, image], i) => ({ id: `demo-${i}`, kode, nama, image }));
      if (!supabase) { setJurusan(fallback); return; }
      const [j, n] = await Promise.all([
        supabase.from("jurusan").select("*").order("nama"),
        supabase.from("berita").select("*").eq("published", true).order("created_at", { ascending: false }).limit(8),
      ]);
      if (!alive) return;
      setJurusan(j.data?.length ? j.data : fallback);
      if (n.data?.length) setNews(n.data);
    }
    load().catch(() => setJurusan(fallbackJurusan.map(([kode,nama,image],i)=>({id:`demo-${i}`,kode,nama,image}))));
    return () => { alive = false; };
  }, []);

  const shownJurusan = jurusan.length ? jurusan.slice(0, 7) : fallbackJurusan.map(([kode,nama,image],i)=>({id:`demo-${i}`,kode,nama,image}));

  return (
    <div className="home-page bg-white text-[#12485a]">
      <section className="hero-reference">
        <div className="hero-reference-bg" aria-hidden="true" />
        <div className="hero-reference-wash" aria-hidden="true" />
        <div className="hero-reference-inner">
          <div className="hero-copy">
            <span className="welcome-pill">Selamat Datang di</span>
            <h1>SMK TEKNOLOGI<br />NUSANTARA</h1>
            <p>Mencetak Generasi Unggul, Profesional dan Berkarakter<br className="desktop-only" /> untuk Masa Depan yang Lebih Baik</p>
            <div className="hero-benefits">
              <span><GraduationCap /> Pendidikan<br />Berkualitas</span>
              <span><Building2 /> Fasilitas<br />Lengkap</span>
              <span><UserRound /> Guru Profesional</span>
              <span><BriefcaseBusiness /> Kerja Sama<br />Industri</span>
            </div>
            <div className="hero-actions">
              <Link to="/jurusan" className="primary-btn">Jelajahi Jurusan <ArrowRight /></Link>
              <Link to="/profil" className="outline-btn"><PlayCircle /> Profil Sekolah</Link>
            </div>
          </div>
        </div>
      </section>

      <section className="stats-wrap">
        <div className="stats-grid">
          <Stat icon={Users} title="Jumlah Siswa" value="1.248" sub="Siswa Aktif" />
          <Stat icon={UserRound} title="Jumlah Guru & Staf" value="87" sub="Guru & Staf" />
          <Stat icon={GraduationCap} title="Jumlah Jurusan" value="7" sub="Program Keahlian" />
          <Stat icon={Trophy} title="Tahun Berdiri" value="2010" sub="Berpengalaman Sejak" />
        </div>
      </section>

      <section className="program-section">
        <div className="section-heading">
          <div>
            <div className="section-kicker-ref">PROGRAM KEAHLIAN</div>
            <h2>7 Jurusan Unggulan</h2>
            <p>Pilih jurusan sesuai minat dan bakatmu, wujudkan masa depan yang cerah bersama kami.</p>
          </div>
          <Link to="/jurusan" className="see-all">Lihat Semua Jurusan <ArrowRight /></Link>
        </div>
        <div className="program-grid">
          {shownJurusan.map((x, i) => {
            const Icon = icons[i];
            return (
              <Link key={x.id} to={String(x.id).startsWith("demo") ? "/jurusan" : `/jurusan/${x.id}`} className={`program-card ${tones[i]}`}>
                <div className="program-icon"><Icon /></div>
                <div className="program-code">{x.kode || fallbackJurusan[i]?.[0]}</div>
                <div className="program-name">{fallbackJurusan[i]?.[1] || x.nama}</div>
                <span className="more-btn">Selengkapnya <ArrowRight /></span>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="lower-section">
        <div className="lower-inner">
          <div className="news-column">
            <div className="lower-title-row"><h2>Berita Terbaru</h2><Link to="/berita">Lihat Semua <ArrowRight /></Link></div>
            <div className="news-grid">
              {news.slice(0,3).map((n,i)=><NewsCard key={n.id} news={n} fallback={SCHOOL_IMAGES.news[i % SCHOOL_IMAGES.news.length]} />)}
            </div>
          </div>
          <div className="profile-mini">
            <img src={SCHOOL_IMAGES.building} alt="Gedung SMK Teknologi Nusantara" />
            <div className="profile-mini-content">
              <h3>SMK Teknologi Nusantara</h3>
              <p>SMK Teknologi Nusantara adalah sekolah menengah kejuruan yang berkomitmen mencetak lulusan berkualitas, berkarakter, dan siap bersaing di dunia kerja maupun melanjutkan pendidikan ke jenjang yang lebih tinggi.</p>
              <div className="contact-mini"><span><MapPin /> Jl. Pendidikan No. 12,<br />Kec. Ngasem, Kab. Kediri</span><span><Phone /> (0354) 123456<br /><Mail /> info@smkteknologinusantara.sch.id</span></div>
              <Link to="/profil" className="profile-more">Selengkapnya <ArrowRight /></Link>
            </div>
          </div>
        </div>
      </section>


    </div>
  );
}

function Stat({icon: Icon,title,value,sub}){
  return <div className="stat-card"><div className="stat-icon"><Icon /></div><div><div className="stat-title">{title}</div><div className="stat-value">{value}</div><div className="stat-sub">{sub}</div></div></div>;
}
function NewsCard({news,fallback}){
  return <Link to={`/berita/${news.id}`} className="news-card"><img src={news.image || fallback} alt={news.judul} /><div className="news-body"><div className="news-date">{news.created_at ? new Date(news.created_at).toLocaleDateString("id-ID",{day:"numeric",month:"short",year:"numeric"}) : "Informasi terbaru"}</div><h3>{news.judul}</h3><span>Kegiatan</span></div></Link>;
}
