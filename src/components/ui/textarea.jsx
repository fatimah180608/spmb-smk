import { cn } from "@/lib/utils";
export function Textarea({ className, ...props }) {
  return <textarea className={cn("min-h-28 w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10", className)} {...props} />;
}
