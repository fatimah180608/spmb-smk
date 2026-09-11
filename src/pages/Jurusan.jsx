import { Link } from "react-router-dom";
import {
  ArrowRight,
  BookOpen,
  GraduationCap,
  Sparkles,
} from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { SCHOOL_IMAGES } from "@/lib/schoolImages";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

/* =========================================================
   DATA FALLBACK
========================================================= */

const fallback = [
  {
    id: "demo-rpl",
    nama: "Rekayasa Perangkat Lunak (RPL)",
    short: "RPL",
    image: "/images/jurusan/rpl.jpg",
    logo: "/images/logos/rpl.png",
    deskripsi:
      "Mempelajari pemrograman, pengembangan aplikasi, website, database, dan teknologi digital.",
  },
  {
    id: "demo-dpib",
    nama: "Desain Pemodelan dan Informasi Bangunan (DPIB)",
    short: "DPIB",
    image: "/images/jurusan/dpib.jpg",
    logo: "/images/logos/dpib.png",
    deskripsi:
      "Mempelajari desain bangunan, gambar teknik, pemodelan, dan teknologi konstruksi.",
  },
  {
    id: "demo-ak",
    nama: "Akuntansi",
    short: "AK",
    image: "/images/jurusan/akuntansi.jpg",
    logo: "/images/logos/akuntansi.png",
    deskripsi:
      "Mempelajari pencatatan keuangan, laporan keuangan, administrasi, dan perpajakan.",
  },
  {
    id: "demo-tp",
    nama: "Teknik Pemesinan (TP)",
    short: "TP",
    image: "/images/jurusan/tp.jpg",
    logo: "/images/logos/tp.png",
    deskripsi:
      "Mempelajari proses produksi, mesin, teknik manufaktur, dan pengoperasian peralatan industri.",
  },
  {
    id: "demo-tptu",
    nama: "Teknik Pendingin dan Tata Udara (TPTU)",
    short: "TPTU",
    image: "/images/jurusan/tptu.jpg",
    logo: "/images/logos/tptu.png",
    deskripsi:
      "Mempelajari instalasi, perawatan, dan perbaikan sistem pendingin dan tata udara.",
  },
  {
    id: "demo-tkp",
    nama: "Teknik Konstruksi dan Perumahan (TKP)",
    short: "TKP",
    image: "/images/jurusan/tkp.jpg",
    logo: "/images/logos/tkp.png",
    deskripsi:
      "Mempelajari konstruksi bangunan, struktur, dan manajemen proyek konstruksi.",
  },
  {
    id: "demo-kuliner",
    nama: "Kuliner",
    short: "KULINER",
    image: "/images/jurusan/kuliner.jpg",
    logo: "/images/logos/kuliner.png",
    deskripsi:
      "Mempelajari seni kuliner, pengolahan makanan, pastry, tata hidang, dan manajemen dapur.",
  },
];

/* =========================================================
   GAMBAR JURUSAN
========================================================= */

const findVisual = (nama = "") => {
  const value = nama.toLowerCase().trim();

  // TPTU harus dicek sebelum TP agar kata "tp" tidak membuat gambar tertukar.
  if (value.includes("tptu") || value.includes("pendingin") || value.includes("tata udara")) {
    return "/images/jurusan/tptu.jpg";
  }
  if (value.includes("pemesinan") || value.includes("pengelasan") || value === "tp" || value.includes("(tp)")) {
    return "/images/jurusan/tp.jpg";
  }
  if (value.includes("rpl") || value.includes("perangkat lunak")) {
    return "/images/jurusan/rpl.jpg";
  }
  if (value.includes("dpib") || value.includes("pemodelan")) {
    return "/images/jurusan/dpib.jpg";
  }
  if (value.includes("akunt")) {
    return "/images/jurusan/akuntansi.jpg";
  }
  if (value.includes("tkp") || value.includes("konstruksi") || value.includes("perumahan")) {
    return "/images/jurusan/tkp.jpg";
  }
  if (value.includes("kuliner")) {
    return "/images/jurusan/kuliner.jpg";
  }

  return "/images/jurusan/rpl.jpg";
};

/* =========================================================
   LOGO JURUSAN
   SESUAI DENGAN FILE YANG ADA DI FOLDER KAMU
========================================================= */

const findLogo = (nama = "") => {
  const value = nama.toLowerCase();

  if (
    value.includes("rpl") ||
    value.includes("perangkat lunak")
  ) {
    return "/images/logos/rpl.png";
  }

  if (
    value.includes("dpib") ||
    value.includes("pemodelan")
  ) {
    return "/images/logos/dpib.png";
  }

  if (value.includes("akunt")) {
    return "/images/logos/akuntansi.png";
  }

  if (
    value.includes("pemesinan") ||
    value.includes("pengelasan")
  ) {
    return "/images/logos/tp.png";
  }

  if (
    value.includes("tptu") ||
    value.includes("pendingin") ||
    value.includes("tata udara")
  ) {
    return "/images/logos/tptu.png";
  }

  if (
    value.includes("tkp") ||
    value.includes("konstruksi")
  ) {
    return "/images/logos/tkp.png";
  }

  if (value.includes("kuliner")) {
    return "/images/logos/kuliner.png";
  }

  // fallback yang BENAR
  return "/images/logos/rpl.png";
};

/* =========================================================
   COMPONENT
========================================================= */

export default function Jurusan() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function loadJurusan() {
      try {
        const { data: rows, error } = await supabase
          .from("jurusan")
          .select("*")
          .order("nama");

        if (!active) return;

        if (error || !rows?.length) {
          setData(fallback);
        } else {
          setData(rows);
        }
      } catch (error) {
        console.error("Gagal memuat jurusan:", error);

        if (active) {
          setData(fallback);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadJurusan();

    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="bg-slate-50">

      {/* =====================================================
          HERO
      ===================================================== */}

      <section className="relative overflow-hidden bg-slate-950 text-white">

        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-950/60 to-emerald-950/30" />

        <img
          src={SCHOOL_IMAGES.building}
          alt="SMK Teknologi Nusantara"
          className="absolute inset-0 h-full w-full object-cover opacity-60"
        />

        <div className="relative container-app py-20 sm:py-28">

          <Badge className="border-white/20 bg-white/10 text-white">
            <Sparkles className="mr-2 h-4 w-4" />
            PROGRAM KEAHLIAN
          </Badge>

          <h1 className="mt-5 max-w-3xl text-4xl font-black tracking-tight sm:text-6xl">
            Pilih jurusan untuk membangun masa depanmu.
          </h1>

          <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-200">
            Kenali 7 program keahlian SMK Teknologi Nusantara lengkap
            dengan gambaran kegiatan pembelajarannya.
          </p>

        </div>
      </section>

      {/* =====================================================
          CONTENT
      ===================================================== */}

      <section className="container-app py-12 sm:py-16">

        <div className="mb-10 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">

          <div>
            <p className="font-black uppercase tracking-[0.2em] text-emerald-600">
              7 Program Keahlian
            </p>

            <h2 className="mt-2 text-3xl font-black text-slate-900 sm:text-4xl">
              Temukan bidang yang paling cocok
            </h2>

            <p className="mt-3 max-w-2xl text-slate-500">
              Klik kartu jurusan untuk melihat informasi lebih
              lanjut atau lanjutkan ke pendaftaran.
            </p>
          </div>

          <Link
            to="/daftar"
            className="inline-flex items-center gap-2 font-bold text-emerald-600 transition hover:text-emerald-700"
          >
            Daftar sekarang
            <ArrowRight size={18} />
          </Link>

        </div>

        {/* =====================================================
            GRID JURUSAN
        ===================================================== */}

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">

          {loading ? (
            Array.from({ length: 7 }).map((_, i) => (
              <div
                key={i}
                className="h-[430px] animate-pulse rounded-[28px] bg-slate-200"
              />
            ))
          ) : (
            data.map((j, i) => {

              const visual = findVisual(j.nama);

              /*
               * PENTING:
               * Jangan gunakan j.logo dari Supabase.
               * Kita gunakan file logo terbaru yang ada
               * di public/images/logos/
               */
              const logo = findLogo(j.nama);

              const isDemo =
                String(j.id).startsWith("demo-");

              return (
                <Link
                  to={
                    isDemo
                      ? "/daftar"
                      : `/jurusan/${j.id}`
                  }
                  key={j.id}
                  className="group"
                >

                  <Card className="h-full overflow-hidden rounded-[28px] border-slate-200 bg-white shadow-sm transition-all duration-300 group-hover:-translate-y-2 group-hover:shadow-2xl">

                    {/* =================================================
                        FOTO JURUSAN
                    ================================================= */}

                    <div className="relative h-52 overflow-hidden">

                      <img
                        src={visual}
                        alt={j.nama}
                        className="h-full w-full object-cover transition duration-500 group-hover:scale-110"
                      />

                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent" />

                      {/* NOMOR */}

                      <div className="absolute left-4 top-4 flex h-12 min-w-12 items-center justify-center rounded-2xl bg-white px-3 text-sm font-black text-slate-900 shadow-lg">
                        {String(i + 1).padStart(2, "0")}
                      </div>

                      {/* =================================================
                          LOGO
                      ================================================= */}

                      <div className="absolute bottom-4 left-4 z-10 flex h-[78px] w-[78px] items-center justify-center rounded-[22px] border-4 border-white bg-white p-2 shadow-xl">

                        <img
                          src={logo}
                          alt={`Logo ${j.nama}`}
                          className="block h-full w-full object-contain object-center"
                          onError={(e) => {
                            console.error(
                              "Logo tidak ditemukan:",
                              logo
                            );

                            e.currentTarget.style.display =
                              "none";
                          }}
                        />

                      </div>

                    </div>

                    {/* =================================================
                        TITLE
                    ================================================= */}

                    <CardHeader className="pb-3 pt-7">

                      <div className="flex items-start justify-between gap-3">

                        <CardTitle className="leading-7 text-slate-900">
                          {j.nama}
                        </CardTitle>

                        <ArrowRight
                          className="mt-1 shrink-0 text-emerald-500 transition duration-300 group-hover:translate-x-1"
                          size={24}
                        />

                      </div>

                    </CardHeader>

                    {/* =================================================
                        DESCRIPTION
                    ================================================= */}

                    <CardContent>

                      <p className="text-sm leading-6 text-slate-500">
                        {j.deskripsi ||
                          "Program keahlian untuk mengembangkan kompetensi dan kesiapan siswa menghadapi dunia kerja."}
                      </p>

                      <div className="mt-5 flex items-center gap-2 text-sm font-bold text-emerald-600">
                        <BookOpen size={16} />
                        Lihat informasi jurusan
                      </div>

                    </CardContent>

                  </Card>

                </Link>
              );
            })
          )}

        </div>

        {/* =====================================================
            CTA
        ===================================================== */}

        <div className="mt-12 overflow-hidden rounded-[28px] bg-gradient-to-r from-emerald-600 to-teal-600 p-7 text-white shadow-xl sm:p-9">

          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">

            <div>

              <p className="text-sm font-black uppercase tracking-widest text-emerald-100">
                Masih bingung memilih?
              </p>

              <h3 className="mt-1 text-2xl font-black">
                Konsultasikan pilihan jurusanmu.
              </h3>

              <p className="mt-2 text-emerald-50">
                Pelajari informasi setiap program sebelum
                mengisi formulir SPMB.
              </p>

            </div>

            <Link
              to="/daftar"
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 font-black text-emerald-700 shadow-sm transition hover:bg-emerald-50"
            >
              Mulai Pendaftaran
              <GraduationCap size={19} />
            </Link>

          </div>

        </div>

      </section>
    </div>
  );
}