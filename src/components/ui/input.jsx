import { cn } from "@/lib/utils";
export function Input({ className, ...props }) {
  return <input className={cn("h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10", className)} {...props} />;
}
