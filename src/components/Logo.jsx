import { GraduationCap } from "lucide-react";
import { SCHOOL_IMAGES } from "@/lib/schoolImages";

export default function Logo({ school, light = false, compact = false }) {
  return (
    <div className={`flex items-center ${compact ? "gap-2.5" : "gap-3"}`}>
      <div className="flex h-[48px] w-[42px] shrink-0 items-center justify-center overflow-hidden">
        {school?.logo_url ? <img src={school.logo_url} alt="Logo sekolah" className="h-full w-full object-contain" /> : <img src="/images/school-logo.png" alt="Logo SMK Teknologi Nusantara" className="h-full w-full object-contain" onError={(e)=>{e.currentTarget.style.display="none";e.currentTarget.nextElementSibling.style.display="flex"}}/>}
        <div className="hidden h-full w-full items-center justify-center text-[#087f68]"><GraduationCap size={28}/></div>
      </div>
      <div className="min-w-0">
        <div className={`text-[13px] font-black leading-[13px] tracking-tight ${light ? "text-white" : "text-[#0b4660]"}`}>SMK TEKNOLOGI<br/>NUSANTARA</div>
        <div className={`mt-1 text-[8px] font-bold ${light ? "text-white/60" : "text-[#4c8090]"}`}>Unggul • Berkarakter • Siap Kerja</div>
      </div>
    </div>
  );
}
