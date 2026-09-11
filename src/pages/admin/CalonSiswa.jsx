import { useEffect, useMemo, useState } from "react";
import { Eye, Search, PlayCircle, Pencil, Save } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import { formatDateTime } from "@/lib/utils";

export default function CalonSiswa() {
  const [rows, setRows] = useState([]);
  const [jurusan, setJurusan] = useState([]);
  const [search, setSearch] = useState("");
  const [filterJurusan, setFilterJurusan] = useState("");
  const [selected, setSelected] = useState(null);
  const [edit, setEdit] = useState(null);
  const [saving, setSaving] = useState(false);
  const [processing, setProcessing] = useState(false);

  async function load() {
    // Pastikan data seleksi terbaru setiap kali halaman admin dibuka.
    const sync = await supabase.rpc("proses_seleksi_spmb");
    if (sync.error) console.warn("Seleksi belum tersinkron:", sync.error.message);

    const [calonRes, jurusanRes, asalRes] = await Promise.all([
      supabase.from("calon_siswa").select("*").order("nilai", { ascending: false, nullsFirst: false }).order("created_at", { ascending: true }),
      supabase.from("jurusan").select("id,nama,kuota").order("nama"),
      supabase.from("asal_sekolah").select("id,nama"),
    ]);
    if (calonRes.error) { alert(`Gagal memuat calon siswa: ${calonRes.error.message}`); return; }
    if (jurusanRes.error) { alert(`Gagal memuat jurusan: ${jurusanRes.error.message}`); return; }
    const jurusanData = jurusanRes.data || [];
    const jmap = Object.fromEntries(jurusanData.map(j => [j.id, j]));
    const amap = Object.fromEntries((asalRes.data || []).map(a => [a.id, a]));
    const enriched = (calonRes.data || []).map(x => ({
      ...x,
      pilihan1: jmap[x.pilihan_jurusan_1_id || x.jurusan_id] || null,
      pilihan2: jmap[x.pilihan_jurusan_2_id] || null,
      diterima: jmap[x.jurusan_diterima_id] || null,
      asal_sekolah: amap[x.asal_sekolah_id] || null,
    }));
    setRows(enriched);
    setJurusan(jurusanData);
  }

  useEffect(() => { load(); }, []);

  async function saveEdit(e) {
    e.preventDefault();
    setSaving(true);
    const payload = {
      nilai_rapor: edit.nilai_rapor === "" ? null : Number(edit.nilai_rapor),
      nilai_tes: edit.nilai_tes === "" ? null : Number(edit.nilai_tes),
      pilihan_jurusan_1_id: edit.pilihan_jurusan_1_id || null,
      pilihan_jurusan_2_id: edit.pilihan_jurusan_2_id || null,
      jurusan_id: edit.pilihan_jurusan_1_id || null,
    };
    const { error } = await supabase.from("calon_siswa").update(payload).eq("id", edit.id);
    setSaving(false);
    if (error) return alert(error.message);
    setEdit(null);
    await load();
  }

  async function processSelection() {
    if (!confirm("Proses seleksi berdasarkan nilai tertinggi sekarang? Hasil seleksi sebelumnya akan dihitung ulang.")) return;
    setProcessing(true);
    const { data, error } = await supabase.rpc("proses_seleksi_spmb");
    setProcessing(false);
    if (error) return alert(error.message);
    alert(data?.message || "Seleksi berhasil diproses.");
    await load();
  }


  const filtered = useMemo(() => rows.filter((x) => {
    const q = search.trim().toLowerCase();
    const cocokCari = !q || `${x.nama} ${x.nomor_pendaftaran} ${x.nisn || ""}`.toLowerCase().includes(q);
    const cocokJurusan = !filterJurusan || x.pilihan1?.id === filterJurusan || x.pilihan2?.id === filterJurusan || x.diterima?.id === filterJurusan;
    return cocokCari && cocokJurusan;
  }), [rows, search, filterJurusan]);
  const calculated = useMemo(() => {
    const scored = rows.filter((x) => x.nilai != null && (x.pilihan_jurusan_1_id || x.jurusan_id)).slice().sort((a,b) => Number(b.nilai)-Number(a.nilai) || new Date(a.created_at)-new Date(b.created_at) || String(a.id).localeCompare(String(b.id)));
    const used = new Map(); const result = new Map();
    for (const x of scored) {
      const p1 = x.pilihan_jurusan_1_id || x.jurusan_id; const p2 = x.pilihan_jurusan_2_id; let acceptedMajor = null;
      for (const choice of [p1,p2]) {
        if (!choice || choice === acceptedMajor) continue;
        const quota = Number(jurusan.find(j => j.id === choice)?.kuota ?? 36);
        if ((used.get(choice) || 0) < quota) { acceptedMajor = choice; used.set(choice, (used.get(choice)||0)+1); break; }
      }
      result.set(x.id, { rankGroup: acceptedMajor || p1, acceptedMajor, computedStatus: acceptedMajor ? "diterima" : "tidak_diterima", rank: 0 });
    }
    const groups = new Map();
    for (const x of scored) { const r=result.get(x.id); if(!groups.has(r.rankGroup)) groups.set(r.rankGroup,[]); groups.get(r.rankGroup).push(x); }
    for (const members of groups.values()) members.forEach((x,i)=>{ result.get(x.id).rank=i+1; });
    return result;
  }, [rows, jurusan]);

  const rankMap = useMemo(() => Object.fromEntries(rows.map((x) => [x.id, x.peringkat ?? calculated.get(x.id)?.rank ?? null])), [rows, calculated]);
  const effectiveStatus = (x) => x.nilai == null ? "menunggu" : (calculated.get(x.id)?.computedStatus || x.status_seleksi);
  const accepted = rows.filter((x) => effectiveStatus(x) === "diterima").length;
  const waiting = rows.filter((x) => x.nilai == null).length;

  return <div>
    <div className="mb-7 grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-end">
      <div>
        <p className="text-sm font-semibold text-emerald-600">DATA PENDAFTAR</p>
        <h1 className="mt-1 text-3xl font-black">Calon Siswa</h1>
        <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-500">
          Peringkat dan kelulusan dihitung otomatis setelah pendaftaran. Sistem mengurutkan nilai tertinggi per jurusan, memakai kuota jurusan, lalu mencoba pilihan 2 jika pilihan 1 sudah penuh.
        </p>
      </div>
      <div className="rounded-[24px] border border-emerald-100 bg-white p-3 shadow-sm">
        <Button
          size="lg"
          className="h-12 w-full rounded-2xl whitespace-nowrap px-5 text-sm sm:text-base"
          onClick={processSelection}
          disabled={processing || !rows.length}
        >
          <PlayCircle size={18} />
          {processing ? "Memperbarui..." : "Perbarui Seleksi"}
        </Button>
        <p className="mt-2 text-center text-[11px] font-semibold text-slate-400">
          Sinkronkan jika kuota atau data nilai diubah
        </p>
      </div>
    </div>

    <div className="mb-5 grid gap-4 sm:grid-cols-3"><Mini label="Total pendaftar" value={rows.length} /><Mini label="Lulus Seleksi" value={accepted} /><Mini label="Belum ada nilai" value={waiting} /></div>

    <Card><div className="border-b border-slate-100 p-4"><div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_260px]"><div className="relative"><Search className="absolute left-3 top-3.5 text-slate-400" size={17} /><Input className="pl-10" placeholder="Cari nama / nomor / NISN..." value={search} onChange={(e) => setSearch(e.target.value)} /></div><select value={filterJurusan} onChange={(e) => setFilterJurusan(e.target.value)} className="h-12 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"><option value="">Semua Jurusan</option>{jurusan.map((j) => <option key={j.id} value={j.id}>{j.nama}</option>)}</select></div><div className="mt-3 flex items-center justify-between text-xs text-slate-500"><span>Menampilkan <b className="text-slate-700">{filtered.length}</b> dari {rows.length} pendaftar</span>{filterJurusan && <button type="button" className="font-bold text-emerald-700" onClick={() => setFilterJurusan("")}>Reset filter</button>}</div></div>
      <Table><THead><TR><TH>Peringkat</TH><TH>Nama / NISN</TH><TH>Rapor</TH><TH>Tes</TH><TH>Nilai Akhir</TH><TH>Pilihan 1</TH><TH>Pilihan 2</TH><TH>Status</TH><TH>Aksi</TH></TR></THead><TBody>{filtered.map((x) => <TR key={x.id}><TD>{rankMap[x.id] != null ? <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 font-black text-amber-700">#{rankMap[x.id]}</span> : <span className="text-slate-400">—</span>}</TD><TD><div className="font-bold">{x.nama}</div><div className="text-xs font-semibold text-slate-400">NISN: {x.nisn || "-"}</div></TD><TD>{x.nilai_rapor ?? "-"}</TD><TD>{x.nilai_tes ?? "-"}</TD><TD><span className="font-black text-emerald-700">{x.nilai ?? "-"}</span></TD><TD>{x.pilihan1?.nama || "-"}</TD><TD>{x.pilihan2?.nama || "-"}</TD><TD><Badge variant={effectiveStatus(x) === "diterima" ? "default" : effectiveStatus(x) === "tidak_diterima" ? "red" : "yellow"}>{effectiveStatus(x) === "diterima" ? "Lulus Seleksi" : effectiveStatus(x) === "tidak_diterima" ? "Belum Lulus / Di Luar Kuota" : "Menunggu Nilai"}</Badge></TD><TD>
  <div className="flex flex-wrap items-center gap-1">
<Button size="icon" variant="ghost" title="Edit nilai & pilihan" onClick={() => setEdit({ id: x.id, nilai_rapor: x.nilai_rapor ?? "", nilai_tes: x.nilai_tes ?? "", pilihan_jurusan_1_id: x.pilihan_jurusan_1_id || x.jurusan_id || "", pilihan_jurusan_2_id: x.pilihan_jurusan_2_id || "" })}><Pencil size={16} /></Button>
    <Button size="icon" variant="ghost" title="Lihat detail" onClick={() => setSelected(x)}><Eye size={16} /></Button>
  </div>
</TD></TR>)}</TBody></Table>
    </Card>

    <Dialog open={!!selected} onClose={() => setSelected(null)} title="Detail Calon Siswa">{selected && <div className="grid gap-3 text-sm sm:grid-cols-2">{Object.entries({ Nama: selected.nama, NIK: selected.nik, NISN: selected.nisn, NilaiRapor: selected.nilai_rapor, NilaiTes: selected.nilai_tes, NilaiAkhir: selected.nilai, Peringkat: selected.peringkat ?? rankMap[selected.id], Pilihan1: selected.pilihan1?.nama, Pilihan2: selected.pilihan2?.nama, HasilJurusan: selected.diterima?.nama, JenisKelamin: selected.jenis_kelamin, TempatLahir: selected.tempat_lahir, TanggalLahir: selected.tanggal_lahir, NoHP: selected.no_hp, Email: selected.email, Alamat: selected.alamat, Ayah: selected.nama_ayah, Ibu: selected.nama_ibu, AsalSekolah: selected.asal_sekolah?.nama, Hasil: effectiveStatus(selected) === "diterima" ? "Lulus" : effectiveStatus(selected) === "tidak_diterima" ? "Belum Lulus / Di Luar Kuota" : "Menunggu Nilai" }).map(([k, v]) => <div key={k} className="rounded-xl bg-slate-50 p-3"><div className="text-xs text-slate-400">{k}</div><div className="mt-1 font-semibold">{v || "-"}</div></div>)}</div>}</Dialog>

    <Dialog open={!!edit} onClose={() => setEdit(null)} title="Atur Nilai & Pilihan" description="Nilai akhir, peringkat, dan status seleksi dihitung otomatis oleh sistem. Admin hanya memperbaiki nilai atau pilihan jika memang diperlukan.">{edit && <form onSubmit={saveEdit} className="space-y-5"><div className="grid gap-4 sm:grid-cols-2"><label className="text-sm font-bold">Nilai Rapor<Input type="number" min="0" max="100" step="0.01" className="mt-2 h-12 rounded-2xl" value={edit.nilai_rapor} onChange={(e) => setEdit({ ...edit, nilai_rapor: e.target.value })} required /></label><label className="text-sm font-bold">Nilai Tes<Input type="number" min="0" max="100" step="0.01" className="mt-2 h-12 rounded-2xl" value={edit.nilai_tes} onChange={(e) => setEdit({ ...edit, nilai_tes: e.target.value })} required /></label></div><div className="rounded-2xl bg-emerald-50 p-4 text-sm"><span className="text-slate-500">Nilai akhir otomatis: </span><b className="text-emerald-700">{edit.nilai_rapor !== "" && edit.nilai_tes !== "" ? (Number(edit.nilai_rapor)*0.6 + Number(edit.nilai_tes)*0.4).toFixed(2) : "-"}</b></div><Select label="Pilihan Jurusan 1" value={edit.pilihan_jurusan_1_id} onChange={(e) => setEdit({ ...edit, pilihan_jurusan_1_id: e.target.value })} options={jurusan} /><Select label="Pilihan Jurusan 2" value={edit.pilihan_jurusan_2_id} onChange={(e) => setEdit({ ...edit, pilihan_jurusan_2_id: e.target.value })} options={jurusan} /><div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={() => setEdit(null)}>Batal</Button><Button type="submit" disabled={saving}><Save size={16} />{saving ? "Menyimpan..." : "Simpan"}</Button></div></form>}</Dialog>
  </div>;
}
function Select({ label, options, ...props }) { return <label className="text-sm font-bold">{label}<select className="mt-2 h-12 w-full rounded-2xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10" {...props}><option value="">Pilih...</option>{options.map((x) => <option key={x.id} value={x.id}>{x.nama}</option>)}</select></label>; }
function Mini({ label, value }) { return <Card className="rounded-2xl p-4"><p className="text-xs font-bold uppercase tracking-wider text-slate-400">{label}</p><p className="mt-1 text-2xl font-black text-slate-900">{value}</p></Card>; }
