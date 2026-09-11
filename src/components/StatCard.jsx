import { Card } from "./ui/card";
export default function StatCard({ title, value, icon: Icon, note, tone = "emerald" }) {
  const tones = { emerald: "bg-emerald-50 text-emerald-600", blue: "bg-blue-50 text-blue-600", amber: "bg-amber-50 text-amber-600", purple: "bg-violet-50 text-violet-600" };
  return <Card className="card-hover"><div className="p-5"><div className="flex items-start justify-between"><div><p className="text-sm font-medium text-slate-500">{title}</p><div className="mt-2 text-3xl font-black tracking-tight">{value}</div></div><div className={`rounded-2xl p-3 ${tones[tone]}`}><Icon size={21}/></div></div>{note&&<p className="mt-4 text-xs text-slate-500">{note}</p>}</div></Card>;
}
