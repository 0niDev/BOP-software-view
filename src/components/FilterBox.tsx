import { Search, X } from 'lucide-react'

export default function FilterBox({
  value,
  onChange,
  placeholder = 'Search…',
  label,
  className = '',
}: {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  label?: string
  className?: string
}) {
  return (
    <label className={`relative block min-w-0 ${className}`}>
      {label && <span className="mb-1 block text-[11px] font-bold uppercase tracking-[0.1em] text-muted">{label}</span>}
      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" aria-hidden>
        <Search size={15} />
      </span>
      <input
        type="search"
        value={value}
        data-search
        autoComplete="off"
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-lg border border-line bg-[var(--input-bg)] py-2 pl-9 pr-9 text-sm text-ink placeholder:text-muted/70 focus:border-brand focus:outline-none"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          aria-label="Clear search"
          className="absolute right-2 top-1/2 grid h-6 w-6 -translate-y-1/2 place-items-center rounded-md text-muted transition-colors hover:text-ink"
        >
          <X size={14} aria-hidden />
        </button>
      )}
    </label>
  )
}
