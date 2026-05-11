import { forwardRef } from 'react'

export const Input = forwardRef(function Input(
  { label, hint, error, className = '', id, ...props },
  ref,
) {
  const inputId = id || props.name
  return (
    <label className="block w-full">
      {label ? (
        <span className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
          {label}
        </span>
      ) : null}
      <input
        ref={ref}
        id={inputId}
        className={`w-full rounded-xl border border-slate-200/90 bg-white/90 px-4 py-2.5 text-sm text-slate-900 shadow-inner shadow-slate-900/5 outline-none transition placeholder:text-slate-400 focus:border-emerald-500/80 focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-600 dark:bg-slate-900/80 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-emerald-400/80 dark:focus:ring-emerald-400/20 ${error ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500/20' : ''} ${className}`}
        {...props}
      />
      {error ? (
        <span className="mt-1 block text-xs text-rose-600 dark:text-rose-400">{error}</span>
      ) : hint ? (
        <span className="mt-1 block text-xs text-slate-500 dark:text-slate-400">{hint}</span>
      ) : null}
    </label>
  )
})
