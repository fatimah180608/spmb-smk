export default function Loading({ text = "Memuat data..." }) {
  return <div className="flex min-h-40 items-center justify-center text-sm text-slate-500"><div className="mr-2 h-5 w-5 animate-spin rounded-full border-2 border-slate-200 border-t-emerald-600" />{text}</div>;
}
