export function Table({ children, className = '' }) {
  return (
    <div
      className={`overflow-hidden rounded-2xl border border-slate-200/80 bg-white/90 shadow-sm dark:border-slate-700 dark:bg-slate-900/60 ${className}`}
    >
      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse text-left text-sm">{children}</table>
      </div>
    </div>
  )
}

export function THead({ children }) {
  return (
    <thead className="border-b border-slate-200/80 bg-slate-50/90 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-400">
      {children}
    </thead>
  )
}

export function TBody({ children }) {
  return <tbody className="divide-y divide-slate-100 dark:divide-slate-800">{children}</tbody>
}

export function TR({ children, className = '' }) {
  return (
    <tr
      className={`transition hover:bg-emerald-50/40 dark:hover:bg-slate-800/50 ${className}`}
    >
      {children}
    </tr>
  )
}

export function TH({ children, className = '' }) {
  return <th className={`px-4 py-3 ${className}`}>{children}</th>
}

export function TD({ children, className = '' }) {
  return <td className={`px-4 py-3 text-slate-700 dark:text-slate-200 ${className}`}>{children}</td>
}
