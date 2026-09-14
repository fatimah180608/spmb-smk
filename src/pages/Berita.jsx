import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  CalendarDays,
  ImageOff,
  Newspaper,
} from "lucide-react";

import { supabase, supabaseConfigured } from "@/lib/supabase";
import { Card, CardContent } from "@/components/ui/card";

export default function Berita() {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadNews();
  }, []);

  async function loadNews() {
    setLoading(true);
    setError("");

    // Cek koneksi Supabase
    if (!supabaseConfigured || !supabase) {
      setError("Supabase belum terhubung.");
      setNews([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error: supabaseError } = await supabase
        .from("berita")
        .select("*")
        .eq("published", true)
        .order("created_at", { ascending: false });

      if (supabaseError) {
        console.error("Gagal mengambil berita:", supabaseError);
        setError(supabaseError.message);
        setNews([]);
        return;
      }

      // Tampilkan SEMUA berita dari database
      setNews(data || []);
    } catch (err) {
      console.error("Terjadi kesalahan:", err);
      setError("Terjadi kesalahan saat mengambil data berita.");
      setNews([]);
    } finally {
      setLoading(false);
    }
  }

  // Format tanggal Indonesia
  function formatDate(date) {
    if (!date) return "-";

    try {
      return new Date(date).toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    } catch {
      return "-";
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* =========================
          HEADER
      ========================== */}
      <section className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-6 py-16 md:py-20">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700 mb-5">
              <Newspaper className="w-4 h-4" />
              Berita Sekolah
            </div>

            <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-slate-900">
              Berita & Informasi
            </h1>

            <p className="mt-5 text-lg md:text-xl leading-relaxed text-slate-600">
              Informasi terbaru seputar kegiatan, program, prestasi, dan
              perkembangan SMK Teknologi Nusantara.
            </p>
          </div>
        </div>
      </section>

      {/* =========================
          CONTENT
      ========================== */}
      <main className="max-w-7xl mx-auto px-6 py-12 md:py-16">
        {/* Loading */}
        {loading && (
          <div className="grid gap-7 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((item) => (
              <div
                key={item}
                className="overflow-hidden rounded-2xl bg-white border animate-pulse"
              >
                <div className="h-56 bg-slate-200" />

                <div className="p-6 space-y-4">
                  <div className="h-4 w-32 bg-slate-200 rounded" />
                  <div className="h-6 w-full bg-slate-200 rounded" />
                  <div className="h-4 w-5/6 bg-slate-200 rounded" />
                  <div className="h-4 w-4/6 bg-slate-200 rounded" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
            <p className="font-semibold text-red-700">
              Gagal memuat berita
            </p>

            <p className="mt-2 text-sm text-red-600">
              {error}
            </p>

            <button
              type="button"
              onClick={loadNews}
              className="mt-5 rounded-lg bg-red-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-red-700 transition"
            >
              Coba Lagi
            </button>
          </div>
        )}

        {/* Tidak ada berita */}
        {!loading && !error && news.length === 0 && (
          <div className="rounded-2xl border bg-white p-12 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
              <Newspaper className="h-8 w-8 text-slate-400" />
            </div>

            <h2 className="mt-5 text-2xl font-bold text-slate-900">
              Belum Ada Berita
            </h2>

            <p className="mt-2 text-slate-500">
              Belum ada berita yang dipublikasikan oleh admin.
            </p>
          </div>
        )}

        {/* =========================
            SEMUA BERITA
        ========================== */}
        {!loading && !error && news.length > 0 && (
          <>
            <div className="mb-8 flex items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl md:text-3xl font-bold text-slate-900">
                  Berita Terbaru
                </h2>

                <p className="mt-2 text-slate-500">
                  Menampilkan {news.length} berita yang telah dipublikasikan.
                </p>
              </div>
            </div>

            {/* 
              PENTING:
              Tidak menggunakan slice(0, 4).
              Semua data dari Supabase ditampilkan.
            */}
            <div className="grid gap-7 sm:grid-cols-2 lg:grid-cols-3">
              {news.map((item) => (
                <Card
                  key={item.id}
                  className="group overflow-hidden rounded-2xl border-slate-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
                >
                  {/* =========================
                      GAMBAR BERITA
                  ========================== */}
                  <div className="relative h-56 w-full overflow-hidden bg-slate-100">
                    {item.image && item.image.trim() !== "" ? (
                      <img
                        src={item.image.trim()}
                        alt={item.judul || "Gambar berita"}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        onError={(e) => {
                          // Jika URL gambar rusak,
                          // jangan ganti dengan gambar random.
                          e.currentTarget.style.display = "none";

                          const placeholder =
                            e.currentTarget.parentElement?.querySelector(
                              ".image-error-placeholder"
                            );

                          if (placeholder) {
                            placeholder.classList.remove("hidden");
                          }
                        }}
                      />
                    ) : null}

                    {/* Placeholder jika tidak ada gambar */}
                    <div
                      className={`image-error-placeholder absolute inset-0 flex flex-col items-center justify-center bg-slate-100 ${
                        item.image && item.image.trim() !== ""
                          ? "hidden"
                          : ""
                      }`}
                    >
                      <ImageOff className="h-10 w-10 text-slate-400" />

                      <span className="mt-3 text-sm font-medium text-slate-500">
                        Tidak ada gambar
                      </span>
                    </div>
                  </div>

                  {/* =========================
                      ISI BERITA
                  ========================== */}
                  <CardContent className="p-6">
                    {/* Tanggal */}
                    <div className="flex items-center gap-2 text-sm text-slate-500">
                      <CalendarDays className="h-4 w-4" />

                      <span>
                        {formatDate(item.created_at)}
                      </span>
                    </div>

                    {/* Judul */}
                    <h3 className="mt-4 line-clamp-2 text-xl font-bold leading-snug text-slate-900 transition-colors group-hover:text-blue-700">
                      {item.judul || "Tanpa Judul"}
                    </h3>

                    {/* Isi */}
                    <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-slate-600">
                      {item.isi || "Tidak ada deskripsi berita."}
                    </p>

                    {/* Detail */}
                    <Link
                      to={`/berita/${item.id}`}
                      className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-blue-700 transition-all hover:gap-3"
                    >
                      Baca Selengkapnya
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}