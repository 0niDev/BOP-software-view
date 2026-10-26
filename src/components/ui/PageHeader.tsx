import type { ReactNode } from 'react'

export default function PageHeader({
  eyebrow,
  title,
  subtitle,
  actions,
}: {
  eyebrow?: string
  title: string
  subtitle?: ReactNode
  actions?: ReactNode
}) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        {eyebrow && (
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-muted">{eyebrow}</p>
        )}
        <h1 className="mt-1.5 text-[26px] font-extrabold tracking-tight text-ink sm:text-[28px]">
          {title}
        </h1>
        {subtitle && <div className="mt-1.5 text-[13px] font-medium text-muted">{subtitle}</div>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </header>
  )
}
