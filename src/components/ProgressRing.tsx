/** Anillo de progreso circular — el elemento "firma" del rediseño: mismo componente en el hero de
    Hoy (progreso del día) y en las tarjetas de resumen por proyecto, para que ambos se sientan parte
    de un mismo sistema visual. */
export default function ProgressRing({
  pct, size = 56, stroke = 6, color = 'hsl(var(--accent-2))', trackColor = 'hsl(var(--muted))', children,
}: {
  pct: number
  size?: number
  stroke?: number
  color?: string
  trackColor?: string
  children?: React.ReactNode
}) {
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const clamped = Math.max(0, Math.min(100, pct))
  const offset = c - (clamped / 100) * c
  return (
    <div className="relative inline-flex shrink-0 items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={trackColor} strokeWidth={stroke} />
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke}
          strokeDasharray={c} strokeDashoffset={offset} strokeLinecap="round"
          className="transition-[stroke-dashoffset] duration-700 ease-out motion-reduce:transition-none"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">{children}</div>
    </div>
  )
}
