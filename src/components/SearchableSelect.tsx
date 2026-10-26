import { useEffect, useMemo, useRef, useState } from 'react'
import { Check, ChevronDown, Search } from 'lucide-react'

export interface SelectOption {
  id: number | string
  label: string
  hint?: string
}

/**
 * Filterable combobox used for the party ledger picker and other long lists.
 * Native selects cannot search, and the ERP has hundreds of parties.
 */
export default function SearchableSelect({
  options,
  value,
  onChange,
  placeholder = 'Select…',
  label,
  className = '',
}: {
  options: SelectOption[]
  value: number | string | null
  onChange: (value: number | string) => void
  placeholder?: string
  label?: string
  className?: string
}) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [highlight, setHighlight] = useState(0)
  const wrapRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const selected = options.find((option) => String(option.id) === String(value)) ?? null

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase()
    if (!needle) return options
    return options.filter(
      (option) =>
        option.label.toLowerCase().includes(needle) ||
        (option.hint ? option.hint.toLowerCase().includes(needle) : false),
    )
  }, [options, search])

  useEffect(() => {
    if (!open) return
    const onPointerDown = (event: MouseEvent): void => {
      if (wrapRef.current && !wrapRef.current.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onPointerDown)
    return () => document.removeEventListener('mousedown', onPointerDown)
  }, [open])

  const choose = (option: SelectOption): void => {
    onChange(option.id)
    setOpen(false)
    setSearch('')
    inputRef.current?.blur()
  }

  return (
    <div ref={wrapRef} className={`relative min-w-0 ${className}`}>
      {label && (
        <label className="mb-1 block text-[11px] font-bold uppercase tracking-[0.1em] text-muted">
          {label}
        </label>
      )}
      <div className="relative">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" aria-hidden>
          <Search size={15} />
        </span>
        <input
          ref={inputRef}
          role="combobox"
          aria-expanded={open}
          aria-autocomplete="list"
          autoComplete="off"
          value={open ? search : (selected?.label ?? '')}
          placeholder={selected ? selected.label : placeholder}
          onFocus={() => {
            setOpen(true)
            setSearch('')
            setHighlight(0)
          }}
          onChange={(event) => {
            setSearch(event.target.value)
            setOpen(true)
            setHighlight(0)
          }}
          onKeyDown={(event) => {
            if (event.key === 'ArrowDown') {
              event.preventDefault()
              setOpen(true)
              setHighlight((index) => Math.min(index + 1, filtered.length - 1))
            } else if (event.key === 'ArrowUp') {
              event.preventDefault()
              setHighlight((index) => Math.max(index - 1, 0))
            } else if (event.key === 'Enter' && open) {
              event.preventDefault()
              const option = filtered[highlight]
              if (option) choose(option)
            } else if (event.key === 'Escape') {
              setOpen(false)
              setSearch('')
            }
          }}
          className="w-full rounded-lg border border-line bg-[var(--input-bg)] py-2 pl-9 pr-9 text-sm text-ink placeholder:text-muted/70 focus:border-brand focus:outline-none"
        />
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted" aria-hidden>
          <ChevronDown size={15} />
        </span>
      </div>

      {open && (
        <div
          role="listbox"
          className="absolute z-30 mt-1 max-h-72 w-full overflow-y-auto rounded-lg border border-line bg-surface p-1 shadow-[var(--shadow-float)]"
        >
          {filtered.length === 0 ? (
            <p className="px-2.5 py-3 text-xs text-muted">No matches.</p>
          ) : (
            filtered.map((option, index) => {
              const active = String(option.id) === String(value)
              return (
                <button
                  key={option.id}
                  type="button"
                  role="option"
                  aria-selected={active}
                  onMouseDown={(event) => {
                    event.preventDefault()
                    choose(option)
                  }}
                  onMouseEnter={() => setHighlight(index)}
                  className={`flex w-full items-center justify-between gap-2 rounded-md px-2.5 py-2 text-left text-sm transition-colors ${
                    index === highlight ? 'bg-surface-2 text-ink' : 'text-ink hover:bg-surface-2'
                  }`}
                >
                  <span className="min-w-0 truncate">
                    {option.label}
                    {option.hint && <span className="ml-2 text-xs text-muted">{option.hint}</span>}
                  </span>
                  {active && <Check size={14} className="shrink-0 text-brand" aria-hidden />}
                </button>
              )
            })
          )}
        </div>
      )}
    </div>
  )
}
