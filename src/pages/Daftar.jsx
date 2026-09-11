import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, FileText, Save, ShieldCheck, UserRound, GraduationCap, AlertCircle } from "lucide-react";
import { supabase, supabaseConfigured, getSupabaseSetupMessage } from "@/lib/supabase";
import { useSchool } from "@/context/SchoolContext";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const initial = {
  nama: "", nik: "", nisn: "", jenis_kelamin: "L", tempat_lahir: "", tanggal_lahir: "",
  alamat: "", no_hp: "", email: "", nama_ayah: "", nama_ibu: "", asal_sekolah_id: "",
  pilihan_jurusan_1_id: "", pilihan_jurusan_2_id: "",
  nilai_rapor: "", nilai_tes: "",
};

export default function Daftar() {
  const { school } = useSchool();
  const { session, profile } = useAuth();
  const [form, setForm] = useState(initial);
  const [jurusan, setJurusan] = useState([]);
  const [asal, setAsal] = useState([]);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!supabase) return;
    Promise.all([
      supabase.from("jurusan").select("*").order("nama"),
      supabase.from("asal_sekolah").select("*").order("nama"),
    ]).then(([j, a]) => {
      if (j.error) setError(j.error.message);
      if (a.error) setError(a.error.message);
      setJurusan(j.data || []);
      setAsal(a.data || []);
    });
  }, []);

  function change(e) {
    setForm((v) => ({ ...v, [e.target.name]: e.target.value }));
  }

  async function submit(e) {
    e.preventDefault();
    setError("");
    if (!supabaseConfigured || !supabase) {
      setError(getSupabaseSetupMessage());
      return;
    }
    if (!/^\d{10}$/.test(form.nisn.trim())) {
      setError("NISN wajib terdiri dari tepat 10 digit angka.");
      return;
    }
    if (!form.pilihan_jurusan_1_id || !form.pilihan_jurusan_2_id) {
      setError("Pilih 2 jurusan. Pilihan 1 akan diprioritaskan, lalu pilihan 2 digunakan jika pilihan 1 sudah penuh.");
      return;
    }
    if (form.pilihan_jurusan_1_id === form.pilihan_jurusan_2_id) {
      setError("Pilihan jurusan 1 dan pilihan jurusan 2 harus berbeda.");
      return;
    }
    const rapor = Number(form.nilai_rapor);
    const tes = Number(form.nilai_tes);
    if (!Number.isFinite(rapor) || rapor < 0 || rapor > 100 || !Number.isFinite(tes) || tes < 0 || tes > 100) {
      setError("Nilai rapor dan nilai tes wajib diisi antara 0 sampai 100.");
      return;
    }
    setSaving(true);
    const nomor = `SPMB-${new Date().getFullYear()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
    const payload = {
      ...form,
      jurusan_id: form.pilihan_jurusan_1_id,
      user_id: session.user.id,
      nomor_pendaftaran: nomor,
      status: "Menunggu Verifikasi",
      status_seleksi: "menunggu",
      nilai_rapor: form.nilai_rapor === "" ? null : Number(form.nilai_rapor),
      nilai_tes: form.nilai_tes === "" ? null : Number(form.nilai_tes),
    };
    const { data: inserted, error } = await supabase.from("calon_siswa").insert(payload).select().single();
    if (error) {
      setSaving(false);
      setError(error.message);
      return;
    }

    // Trigger database langsung menghitung nilai, peringkat per jurusan,
    // dan status kuota setelah pendaftaran masuk. Ambil ulang agar hasil
    // yang tampil benar-benar hasil terbaru dari database.
    const { data: latest, error: latestError } = await supabase
      .from("calon_siswa")
      .select("*")
      .eq("id", inserted.id)
      .single();

    setSaving(false);
    if (latestError) {
      setResult(inserted);
      return;
    }
    setResult(latest);
  }

  if (result) return (
    <div className="container-app py-16">
      <div className="mx-auto max-w-3xl">
        <div className="mb-6 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-emerald-600"><ArrowLeft size={16} /> Kembali</Link>
          <Badge>BERHASIL</Badge>
        </div>
        <Card className="print-card overflow-hidden rounded-[30px] border-0 shadow-2xl shadow-emerald-900/10">
          <div className="gradient-brand p-8 text-white sm:p-10">
            <div className="flex items-center gap-4"><div className="rounded-2xl bg-white/10 p-3"><GraduationCap /></div><div><p className="text-sm text-emerald-200">{school?.nama || "SMK Teknologi Nusantara"}</p><h1 className="text-2xl font-black sm:text-3xl">Pendaftaran berhasil</h1></div></div>
          </div>
          <CardContent className="p-8 sm:p-10">
            <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-6"><p className="text-xs font-bold uppercase tracking-widest text-emerald-600">Nomor pendaftaran</p><p className="mt-2 text-3xl font-black tracking-wide text-emerald-950">{result.nomor_pendaftaran}</p></div>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <Info label="Nama" value={result.nama} />
              <Info label="NISN" value={result.nisn} />
              <Info label="Nilai Akhir" value={result.nilai ?? "-"} />
              <Info label="Pilihan 1" value={jurusan.find((x) => x.id === result.pilihan_jurusan_1_id)?.nama} />
              <Info label="Pilihan 2" value={jurusan.find((x) => x.id === result.pilihan_jurusan_2_id)?.nama} />
              <Info label="Status Saat Ini" value={result.status || "Menunggu Seleksi"} />
            </div>
            <div className="mt-6 rounded-[24px] border border-emerald-200 bg-emerald-50 p-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-600">PERINGKAT SAAT INI</p>
                  <p className="mt-1 text-sm text-emerald-900">Peringkat dihitung otomatis berdasarkan nilai di jurusan tujuan.</p>
                </div>
                <div className="text-4xl font-black text-emerald-800">
                  {result.peringkat != null ? `#${result.peringkat}` : "—"}
                </div>
              </div>
              <p className="mt-3 text-xs leading-5 text-emerald-700">
                Jika ada pendaftar baru dengan nilai lebih tinggi, peringkat dapat berubah otomatis.
                Selama masih berada dalam kuota jurusan, statusmu akan <b>Diterima</b>.
              </p>
            </div>
            <p className="mt-6 text-sm leading-6 text-slate-500">Simpan nomor pendaftaran dan NISN. Sistem menggunakan nilai rapor 60% + nilai tes 40%, lalu mengurutkan calon dari nilai tertinggi. Kuota setiap jurusan menentukan siapa yang masuk dan pilihan 2 digunakan jika pilihan 1 sudah penuh.</p>
            <div className="no-print mt-7 flex flex-wrap gap-3"><Link to="/siswa/kartu"><Button><FileText size={17} /> Lihat Kartu Pendaftaran</Button></Link><Link to={`/cek-status?nisn=${result.nisn}`}><Button variant="outline">Cek Status</Button></Link></div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  return (
    <div className="container-app py-12 sm:py-16">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8">
          <Link to="/" className="mb-5 inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-emerald-600"><ArrowLeft size={16} /> Kembali ke beranda</Link>
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><Badge>FORMULIR SPMB</Badge><h1 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">Daftar sebagai calon murid</h1><p className="mt-3 max-w-2xl leading-7 text-slate-500">Lengkapi data dengan benar. Akun siswa: <span className="font-bold text-emerald-700">{profile?.email || session?.user?.email}</span>.</p></div><div className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700"><ShieldCheck className="mr-2 inline" size={17} /> Data tersimpan aman</div></div>
        </div>
        {(!supabaseConfigured || error) && <div className={`mb-6 flex gap-3 rounded-2xl border p-4 text-sm ${error ? "border-red-100 bg-red-50 text-red-700" : "border-amber-100 bg-amber-50 text-amber-800"}`}><AlertCircle className="mt-0.5 shrink-0" size={18} /><div><p className="font-bold">{error ? "Periksa formulir" : "Supabase belum dikonfigurasi"}</p><p className="mt-1 leading-6">{error || getSupabaseSetupMessage()}</p></div></div>}
        <form onSubmit={submit} className="space-y-5">
          <Card className="rounded-[28px]"><CardHeader><CardTitle className="flex items-center gap-3"><span className="rounded-xl bg-emerald-50 p-2 text-emerald-600"><UserRound size={18} /></span> Data Pribadi</CardTitle></CardHeader><CardContent><div className="grid gap-5 md:grid-cols-2"><Field label="Nama Lengkap" name="nama" value={form.nama} onChange={change} required /><Field label="NIK" name="nik" value={form.nik} onChange={change} /><Field label="NISN (10 digit)" name="nisn" value={form.nisn} onChange={(e)=>setForm(v=>({...v,nisn:e.target.value.replace(/\D/g,"").slice(0,10)}))} inputMode="numeric" maxLength={10} required /><Select label="Jenis Kelamin" name="jenis_kelamin" value={form.jenis_kelamin} onChange={change} options={[["L", "Laki-laki"], ["P", "Perempuan"]]} /><Field label="Tempat Lahir" name="tempat_lahir" value={form.tempat_lahir} onChange={change} /><Field label="Tanggal Lahir" type="date" name="tanggal_lahir" value={form.tanggal_lahir} onChange={change} /><Field label="No. HP" name="no_hp" value={form.no_hp} onChange={change} /><Field label="Email" type="email" name="email" value={form.email} onChange={change} /><label className="text-sm font-bold md:col-span-2">Alamat<textarea name="alamat" value={form.alamat} onChange={change} className="mt-2 min-h-28 w-full rounded-2xl border border-slate-200 bg-white p-3 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10" /></label></div></CardContent></Card>
          <Card className="rounded-[28px]"><CardHeader><CardTitle className="flex items-center gap-3"><span className="rounded-xl bg-cyan-50 p-2 text-cyan-600"><GraduationCap size={18} /></span> Data Sekolah & Pilihan Jurusan</CardTitle></CardHeader><CardContent><div className="grid gap-5 md:grid-cols-2"><Field label="Nama Ayah/Wali" name="nama_ayah" value={form.nama_ayah} onChange={change} /><Field label="Nama Ibu/Wali" name="nama_ibu" value={form.nama_ibu} onChange={change} /><Select label="Asal Sekolah" name="asal_sekolah_id" value={form.asal_sekolah_id} onChange={change} options={asal.map((x) => [x.id, x.nama])} /><Select label="Pilihan Jurusan 1 (Prioritas)" name="pilihan_jurusan_1_id" value={form.pilihan_jurusan_1_id} onChange={change} options={jurusan.map((x) => [x.id, x.nama])} required /><Select label="Pilihan Jurusan 2 (Cadangan)" name="pilihan_jurusan_2_id" value={form.pilihan_jurusan_2_id} onChange={change} options={jurusan.map((x) => [x.id, x.nama])} required /><Field label="Nilai Rapor (0–100)" type="number" min="0" max="100" step="0.01" name="nilai_rapor" value={form.nilai_rapor} onChange={change} required /><Field label="Nilai Tes (0–100)" type="number" min="0" max="100" step="0.01" name="nilai_tes" value={form.nilai_tes} onChange={change} required /></div><div className="mt-5 grid gap-4 sm:grid-cols-2"><div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-sm leading-6 text-emerald-800"><b>Perhitungan nilai akhir:</b><br />Rapor × 60% + Tes × 40%.</div><div className="rounded-2xl border border-slate-200 bg-slate-50 p-4"><p className="text-xs font-bold uppercase tracking-wider text-slate-400">Nilai Akhir</p><p className="mt-1 text-3xl font-black text-emerald-700">{form.nilai_rapor !== "" && form.nilai_tes !== "" ? (Number(form.nilai_rapor) * 0.6 + Number(form.nilai_tes) * 0.4).toFixed(2) : "-"}</p><p className="mt-1 text-xs text-slate-500">Dihitung otomatis oleh sistem.</p></div></div></CardContent></Card>
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between"><p className="text-xs leading-5 text-slate-400">Pastikan pilihan 1 dan pilihan 2 berbeda. Nilai rapor dan tes akan dihitung otomatis menjadi nilai akhir.</p><Button size="lg" className="rounded-2xl" disabled={saving || !supabaseConfigured}>{saving ? <span className="animate-pulse">Menyimpan...</span> : <><Save size={18} /> Kirim Pendaftaran</>}</Button></div>
        </form>
      </div>
    </div>
  );
}
function Field({ label, ...props }) { return <label className="text-sm font-bold">{label}<Input className="mt-2 h-12 rounded-2xl" {...props} /></label>; }
function Select({ label, options, ...props }) { return <label className="text-sm font-bold">{label}<select className="mt-2 h-12 w-full rounded-2xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10" {...props}><option value="">Pilih...</option>{options.map(([v, t]) => <option key={v} value={v}>{t}</option>)}</select></label>; }
function Info({ label, value }) { return <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs text-slate-400">{label}</p><p className="mt-1 font-bold">{value || "-"}</p></div>; }
