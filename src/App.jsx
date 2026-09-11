import { Routes, Route, Navigate } from "react-router-dom";
import PublicLayout from "@/components/PublicLayout";
import AdminLayout from "@/components/AdminLayout";
import { useAuth } from "@/context/AuthContext";
import Loading from "@/components/Loading";
import Home from "@/pages/Home";
import Jurusan from "@/pages/Jurusan";
import JurusanDetail from "@/pages/JurusanDetail";
import Berita from "@/pages/Berita";
import BeritaDetail from "@/pages/BeritaDetail";
import Pengumuman from "@/pages/Pengumuman";
import CaraDaftar from "@/pages/CaraDaftar";
import Daftar from "@/pages/Daftar";
import CekStatus from "@/pages/CekStatus";
import ProfilSekolah from "@/pages/ProfilSekolah";
import Login from "@/pages/admin/Login";
import SiswaLogin from "@/pages/SiswaLogin";
import SiswaRegister from "@/pages/SiswaRegister";
import SiswaDashboard from "@/pages/SiswaDashboard";
import KartuPendaftaran from "@/pages/siswa/KartuPendaftaran";
import HasilSeleksi from "@/pages/siswa/HasilSeleksi";
import Dashboard from "@/pages/admin/Dashboard";
import CalonSiswa from "@/pages/admin/CalonSiswa";
import CrudPage from "@/pages/admin/CrudPage";
import Statistik from "@/pages/admin/Statistik";
import Settings from "@/pages/admin/Settings";

function AdminGuard({children}){const {session,profile,loading}=useAuth();if(loading)return <Loading/>;if(!session)return <Navigate to="/admin/login" replace/>;if(profile?.role!=="admin")return <Navigate to="/siswa" replace/>;return children}
function StudentGuard({children}){const {session,profile,loading}=useAuth();if(loading)return <Loading/>;if(!session)return <Navigate to="/siswa/login?next=/daftar" replace/>;if(profile?.role==="admin")return <Navigate to="/admin" replace/>;return children}
export default function App(){return <Routes><Route element={<PublicLayout/>}><Route path="/" element={<Home/>}/><Route path="/profil" element={<ProfilSekolah/>}/><Route path="/jurusan" element={<Jurusan/>}/><Route path="/jurusan/:id" element={<JurusanDetail/>}/><Route path="/berita" element={<Berita/>}/><Route path="/berita/:id" element={<BeritaDetail/>}/><Route path="/pengumuman" element={<Pengumuman/>}/><Route path="/cara-daftar" element={<CaraDaftar/>}/><Route path="/daftar" element={<StudentGuard><Daftar/></StudentGuard>}/><Route path="/cek-status" element={<CekStatus/>}/></Route><Route path="/admin/login" element={<Login/>}/><Route path="/siswa/login" element={<SiswaLogin/>}/><Route path="/siswa/register" element={<SiswaRegister/>}/><Route path="/siswa" element={<StudentGuard><SiswaDashboard/></StudentGuard>}/><Route path="/siswa/kartu" element={<StudentGuard><KartuPendaftaran/></StudentGuard>}/><Route path="/siswa/hasil-seleksi" element={<StudentGuard><HasilSeleksi/></StudentGuard>}/><Route path="/admin" element={<AdminGuard><AdminLayout/></AdminGuard>}><Route index element={<Dashboard/>}/><Route path="calon-siswa" element={<CalonSiswa/>}/><Route path="jurusan" element={<CrudPage type="jurusan"/>}/><Route path="berita" element={<CrudPage type="berita"/>}/><Route path="asal-sekolah" element={<CrudPage type="asal"/>}/><Route path="pengumuman" element={<CrudPage type="pengumuman"/>}/><Route path="statistik" element={<Statistik/>}/><Route path="settings" element={<Settings/>}/></Route><Route path="*" element={<Navigate to="/" replace/>}/></Routes>}