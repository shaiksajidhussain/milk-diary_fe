import { motion } from 'framer-motion'

const variants = {
  primary:
    'bg-emerald-600 text-white shadow-lg shadow-emerald-600/25 hover:bg-emerald-500 dark:bg-emerald-500 dark:hover:bg-emerald-400',
  secondary:
    'bg-slate-900 text-white shadow-md hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white',
  outline:
    'border border-slate-200/80 bg-white/80 text-slate-800 hover:border-emerald-300 hover:bg-emerald-50/80 dark:border-slate-600 dark:bg-slate-800/80 dark:text-slate-100 dark:hover:border-emerald-500/50 dark:hover:bg-slate-700',
  ghost: 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800',
  danger: 'bg-rose-600 text-white hover:bg-rose-500',
}

const sizes = {
  sm: 'px-3 py-1.5 text-sm rounded-lg',
  md: 'px-4 py-2.5 text-sm rounded-xl',
  lg: 'px-5 py-3 text-base rounded-xl',
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  loading = false,
  disabled,
  type = 'button',
  ...props
}) {
  const isDisabled = disabled || loading

  return (
    <motion.button
      type={type}
      whileHover={{ scale: isDisabled ? 1 : 1.02 }}
      whileTap={{ scale: isDisabled ? 1 : 0.98 }}
      transition={{ type: 'spring', stiffness: 400, damping: 22 }}
      className={`inline-flex items-center justify-center gap-2 font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500 disabled:pointer-events-none disabled:opacity-50 ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={isDisabled}
      {...props}
    >
      {loading ? (
        <span className="inline-flex items-center gap-2">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
          Please wait
        </span>
      ) : (
        children
      )}
    </motion.button>
  )
}
