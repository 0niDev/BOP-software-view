import type { ReactNode } from 'react'
import { LockKeyhole, ShieldCheck } from 'lucide-react'

/** Banner repeated on administration pages: this view is strictly read-only. */
export default function ReadOnlyNotice({
  title = 'Read-only administration',
  children,
}: {
  title?: string
  children?: ReactNode
}) {
  return (
    <div className="flex items-start gap-3 rounded-card border border-line bg-surface-2 px-4 py-3">
      <span aria-hidden className="mt-0.5 shrink-0 text-brand">
        <ShieldCheck size={18} />
      </span>
      <div className="min-w-0">
        <p className="text-[12px] font-bold text-ink">{title}</p>
        <p className="mt-0.5 text-[11px] leading-relaxed text-muted">
          {children ?? (
            <>
              This view can read configuration but cannot create, edit or delete it. Passwords, hashes and
              salts are never queried.
            </>
          )}
        </p>
      </div>
      <LockKeyhole size={14} aria-hidden className="ml-auto hidden shrink-0 text-muted sm:block" />
    </div>
  )
}
