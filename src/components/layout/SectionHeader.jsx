export default function SectionHeader({ title, meta }) {
  return (
    <div className="flex items-baseline gap-3 mb-6 pb-4 border-b border-rule">
      <h2 className="font-display text-2xl tracking-tight">{title}</h2>
      {meta && (
        <span className="font-mono text-[0.65rem] tracking-widest uppercase text-ink3">
          {meta}
        </span>
      )}
    </div>
  )
}
