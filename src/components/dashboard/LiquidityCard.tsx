import { Banknote, Boxes, Landmark, Scale } from 'lucide-react'
import type { DashboardBalances } from '../../lib/types'
import { formatCurrency } from '../../lib/format'

function Line({ icon: Icon, label, value }: { icon: typeof Banknote; label: string; value: number }) {
  return (
    <div className="flex items-center justify-between gap-3 py-2">
      <span className="inline-flex items-center gap-2 text-[12px] font-semibold text-muted">
        <Icon size={14} aria-hidden />
        {label}
      </span>
      <span className="num text-[13px] font-bold text-ink">{formatCurrency(value)}</span>
    </div>
  )
}

export default function LiquidityCard({ balances }: { balances: DashboardBalances }) {
  return (
    <div className="divide-y divide-line/60">
      <Line icon={Banknote} label="Cash in hand" value={balances.cash} />
      <Line icon={Landmark} label="Bank" value={balances.bank} />
      <Line icon={Boxes} label="Inventory" value={balances.inventory} />
      <div className="flex items-center justify-between gap-3 pt-3">
        <span className="inline-flex items-center gap-2 text-[12px] font-bold text-ink">
          <Scale size={14} aria-hidden />
          Total liquidity
        </span>
        <span className="num text-[15px] font-extrabold text-ink">{formatCurrency(balances.total)}</span>
      </div>
      <div className="grid grid-cols-2 gap-3 pt-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-muted">Receivable</p>
          <p className="num mt-0.5 text-[13px] font-bold text-ok-ink">{formatCurrency(balances.receivable)}</p>
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-muted">Payable</p>
          <p className="num mt-0.5 text-[13px] font-bold text-amber-ink">{formatCurrency(balances.payable)}</p>
        </div>
      </div>
    </div>
  )
}
