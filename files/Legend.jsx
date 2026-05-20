export default function Legend({ items }) {
  return (
    <div className="flex flex-wrap gap-4 mt-4">
      {items.map(({ color, label }) => (
        <div key={label} className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: color }} />
          <span className="text-xs text-ink2">{label}</span>
        </div>
      ))}
    </div>
  )
}
