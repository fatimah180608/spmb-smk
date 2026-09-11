import React from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";

export default class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { error: null }; }
  static getDerivedStateFromError(error) { return { error }; }
  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="min-h-[70vh] bg-slate-50 px-5 py-20">
        <div className="mx-auto max-w-xl rounded-[28px] border border-red-100 bg-white p-8 text-center shadow-xl shadow-slate-200/60">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-600"><AlertTriangle /></div>
          <h1 className="mt-5 text-2xl font-black text-slate-900">Halaman belum dapat ditampilkan</h1>
          <p className="mt-2 text-sm leading-6 text-slate-500">Ada konfigurasi atau koneksi yang perlu diperbaiki. Setelah diperbaiki, muat ulang halaman.</p>
          <details className="mt-5 text-left text-xs text-slate-400"><summary className="cursor-pointer font-semibold">Lihat detail error</summary><pre className="mt-2 overflow-auto rounded-xl bg-slate-950 p-4 text-slate-200">{String(this.state.error?.message || this.state.error)}</pre></details>
          <button onClick={() => window.location.reload()} className="mt-6 inline-flex h-11 items-center gap-2 rounded-xl bg-emerald-600 px-5 text-sm font-bold text-white hover:bg-emerald-700"><RotateCcw size={16}/> Muat ulang</button>
        </div>
      </div>
    );
  }
}
