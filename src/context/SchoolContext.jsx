import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

const SchoolContext = createContext(null);
export const DEFAULT_SCHOOL = {
  nama: "SMK Teknologi Nusantara",
  alamat: "Jl. Pendidikan No. 12, Kec. Ngasem, Kab. Kediri, Jawa Timur",
  no_telp: "(0354) 123456",
  npsn: "Belum diatur",
  tahun_pelajaran: "2026/2027",
  logo_url: "",
  target_siswa: 500,
  keunggulan: "Sekolah vokasi modern yang mengembangkan karakter, kompetensi, kreativitas, dan kesiapan menghadapi dunia kerja."
};

export function SchoolProvider({ children }) {
  const [school, setSchool] = useState(DEFAULT_SCHOOL);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  async function refresh() {
    if (!supabase) { setLoading(false); return; }
    const { data, error } = await supabase.from("school_settings").select("*").limit(1).maybeSingle();
    if (data) setSchool({ ...DEFAULT_SCHOOL, ...data, nama: DEFAULT_SCHOOL.nama, alamat: DEFAULT_SCHOOL.alamat, no_telp: DEFAULT_SCHOOL.no_telp, tahun_pelajaran: DEFAULT_SCHOOL.tahun_pelajaran, target_siswa: DEFAULT_SCHOOL.target_siswa, keunggulan: DEFAULT_SCHOOL.keunggulan });
    if (error) setError(error.message);
    setLoading(false);
  }
  useEffect(() => { refresh(); }, []);
  return <SchoolContext.Provider value={{ school, loading, error, refresh }}>{children}</SchoolContext.Provider>;
}
export function useSchool() { return useContext(SchoolContext); }
