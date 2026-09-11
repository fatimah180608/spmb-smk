import { Link, useParams } from "react-router-dom";
import { ArrowLeft, CalendarDays } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { SCHOOL_IMAGES, STATIC_NEWS } from "@/lib/schoolImages";
import { formatDate } from "@/lib/utils";
import Loading from "@/components/Loading";

export default function BeritaDetail() {
  const { id } = useParams();

  const [n, setN] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;

    async function load() {

      // Cari dulu dari berita static
      const local = STATIC_NEWS.find(
        (x) => String(x.id) === String(id)
      );

      if (local) {
        setN(local);
        setLoading(false);
        return;
      }

      // Kalau Supabase tidak tersedia
      if (!supabase) {
        setLoading(false);
        return;
      }

      // Cari di Supabase
      const { data, error } = await supabase
        .from("berita")
        .select("*")
        .eq("id", id)
        .single();

      if (!alive) return;

      if (error) {
        console.error("Gagal mengambil detail berita:", error);
        setN(null);
      } else {
        setN(data);
      }

      setLoading(false);
    }

    load();

    return () => {
      alive = false;
    };
  }, [id]);

  if (loading) {
    return <Loading />;
  }

  if (!n) {
    return (
      <div className="container-app py-20">
        <h1 className="text-2xl font-black">
          Pengumuman tidak ditemukan.
        </h1>

        <Link
          to="/berita"
          className="mt-4 inline-block font-bold text-emerald-700"
        >
          Kembali ke berita
        </Link>
      </div>
    );
  }

  return (
    <article className="bg-slate-50 py-12 sm:py-16">
      <div className="container-app max-w-4xl">

        {/* KEMBALI */}
        <Link
          to="/berita"
          className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-emerald-700"
        >
          <ArrowLeft size={16} />
          Kembali ke Berita
        </Link>

        {/* DETAIL */}
        <div className="mt-6 overflow-hidden rounded-[30px] bg-white shadow-sm">

          {/* GAMBAR */}
          <img
            src={
              n.image ||
              SCHOOL_IMAGES.news[0]
            }
            alt={`Berita SMK Teknologi Nusantara: ${n.judul}`}
            className="max-h-[520px] w-full object-cover"
          />

          <div className="p-7 sm:p-10">

            {/* TANGGAL */}
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <CalendarDays size={16} />

              {formatDate(n.created_at)}
            </div>

            {/* JUDUL */}
            <h1 className="mt-4 text-3xl font-black leading-tight sm:text-5xl">
              {n.judul}
            </h1>

            {/* ISI */}
            <div className="mt-8 whitespace-pre-wrap text-[17px] leading-8 text-slate-600">
              {n.isi}
            </div>

          </div>
        </div>
      </div>
    </article>
  );
}