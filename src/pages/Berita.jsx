import { Link } from "react-router-dom";
import { SCHOOL_IMAGES, STATIC_NEWS } from "@/lib/schoolImages";
import { CalendarDays, ChevronRight, Newspaper } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function Berita() {
  const [data, setData] = useState(STATIC_NEWS);

useEffect(() => {
  let alive = true;

  async function load() {
    // Kalau Supabase tidak tersedia,
    // gunakan berita static
    if (!supabase) {
      setData(STATIC_NEWS.slice(0, 4));
      return;
    }

    const { data: rows, error } = await supabase
      .from("berita")
      .select("*")
      .eq("published", true)
      .order("created_at", { ascending: false });

    if (!alive) return;

    if (error) {
      console.error("Gagal mengambil berita:", error);
      setData(STATIC_NEWS.slice(0, 4));
      return;
    }

    const supabaseNews = rows || [];

    // Gabungkan Supabase + static
    const combinedNews = [
      ...supabaseNews,
      ...STATIC_NEWS,
    ];

    // Hilangkan berita dengan judul yang sama
    const uniqueNews = combinedNews.filter(
      (item, index, self) =>
        index ===
        self.findIndex(
          (x) =>
            x.judul?.trim().toLowerCase() ===
            item.judul?.trim().toLowerCase()
        )
    );

    // Urutkan dari berita terbaru
    uniqueNews.sort(
      (a, b) =>
        new Date(b.created_at) -
        new Date(a.created_at)
    );

    // Ambil maksimal 4 berita
    setData(uniqueNews.slice(0, 4));
  }

  load();

  return () => {
    alive = false;
  };
}, []);

  return (
    <div className="bg-slate-50 py-12 sm:py-16">
      <div className="container-app">

        {/* HEADER */}
        <div className="overflow-hidden rounded-[30px] bg-slate-950 p-8 text-white shadow-xl sm:p-12">
          <Badge className="border-white/15 bg-white/10 text-white">
            BERITA SEKOLAH
          </Badge>

          <h1 className="mt-4 text-4xl font-black sm:text-5xl">
            Kabar terbaru SMK Teknologi Nusantara.
          </h1>

          <p className="mt-4 max-w-2xl leading-7 text-slate-300">
            Informasi kegiatan sekolah, prestasi, dan kabar
            terbaru yang dapat diakses oleh calon murid dan masyarakat.
          </p>
        </div>

        {/* BERITA */}
        <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {data.slice(0, 4).map((n, i) => (
            <Link
              className="group"
              key={n.id}
              to={`/berita/${n.id}`}
            >
              <Card className="card-hover h-full overflow-hidden rounded-[26px] bg-white">

                {/* GAMBAR */}
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={
                      n.image ||
                      SCHOOL_IMAGES.news[
                        i % SCHOOL_IMAGES.news.length
                      ]
                    }
                    alt={`Berita SMK Teknologi Nusantara: ${n.judul}`}
                    className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                  />

                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 to-transparent" />
                </div>

                {/* HEADER CARD */}
                <CardHeader>
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
                    <span className="flex items-center gap-1">
                      <CalendarDays size={13} />

                      {n.created_at
                        ? new Date(n.created_at).toLocaleDateString(
                            "id-ID",
                            {
                              day: "numeric",
                              month: "long",
                              year: "numeric",
                            }
                          )
                        : "2 September 2026"}
                    </span>

                    <ChevronRight size={15} />
                  </div>

                  <CardTitle className="mt-4 leading-6 group-hover:text-emerald-700">
                    {n.judul}
                  </CardTitle>
                </CardHeader>

                {/* ISI */}
                <CardContent>
                  <p className="line-clamp-4 text-sm leading-6 text-slate-500">
                    {n.isi}
                  </p>

                  <div className="mt-5 font-bold text-emerald-700">
                    Read More »
                  </div>
                </CardContent>

              </Card>
            </Link>
          ))}
        </div>

        {/* JIKA BENAR-BENAR KOSONG */}
        {!data.length && (
          <div className="mt-10 rounded-[28px] border border-dashed border-slate-200 bg-white p-12 text-center">
            <Newspaper
              className="mx-auto text-slate-300"
              size={32}
            />

            <h2 className="mt-4 font-black">
              Belum ada berita
            </h2>
          </div>
        )}

      </div>
    </div>
  );
}