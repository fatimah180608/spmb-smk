export function Table({ children }) {
  return <div className="overflow-x-auto rounded-2xl border border-slate-200"><table className="w-full text-left text-sm">{children}</table></div>;
}
export function THead({ children }) { return <thead className="bg-slate-50 text-xs uppercase text-slate-500">{children}</thead>; }
export function TBody({ children }) { return <tbody className="divide-y divide-slate-100">{children}</tbody>; }
export function TR({ children }) { return <tr className="hover:bg-slate-50/80">{children}</tr>; }
export function TH({ children }) { return <th className="px-4 py-3 font-semibold">{children}</th>; }
export function TD({ children, className }) { return <td className={`px-4 py-3 ${className || ""}`}>{children}</td>; }
