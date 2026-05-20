export default function Loading({ text = 'Loading' }) {
  return (
    <div className="flex items-center justify-center py-20 gap-3 text-ink3 font-mono text-xs tracking-widest uppercase">
      {text}
      <span className="w-4 h-4 border border-rule border-t-ink3 rounded-full animate-spin" />
    </div>
  )
}
