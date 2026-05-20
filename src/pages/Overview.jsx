import { useState } from 'react'
import { useData } from '@/hooks/useData.jsx'
import { pct, fmt, COLORS } from '@/lib/utils'
import Loading from '@/components/layout/Loading'
import ChartGrid from '@/components/layout/ChartGrid'
import ChartCard from '@/components/layout/ChartCard'
import ChartTooltip from '@/components/charts/ChartTooltip'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, LabelList,
  LineChart, Line
} from 'recharts'

const TICK = { fontSize: 11, fontFamily: 'DM Mono, monospace', fill: '#9C9590' }
const GRID = { stroke: '#E2DDD8' }
const LINE = { dot: false, strokeWidth: 2, type: 'monotone' }

// ── Combo definitions ─────────────────────────────────────────────
const COMBO_DEFS = [
  { key: 'mm',           label: 'Male–Male',        color: COLORS.mm },
  { key: 'ff',           label: 'Female–Female',    color: COLORS.ff },
  { key: 'fm',           label: 'Female–Male',      color: COLORS.fm },
  { key: 'mf',           label: 'Male–Female',      color: COLORS.mf },
  { key: 'single_male',  label: 'Single (Male)',    color: COLORS.male },
  { key: 'single_female',label: 'Single (Female)',  color: COLORS.female },
  { key: 'other',        label: 'Other',            color: '#D4D4D8' },
]

function StatPill({ label, value }) {
  return (
    <div className="flex flex-col items-center px-6 py-3 bg-white/60 border border-rule backdrop-blur-sm">
      <span className="font-display text-2xl tracking-tight">{value}</span>
      <span className="font-mono text-[0.62rem] tracking-widest uppercase text-ink3 mt-0.5">{label}</span>
    </div>
  )
}

function StatCard({ label, value, sub, color }) {
  return (
    <Card className="rounded-none border-rule shadow-none">
      <CardContent className="p-6">
        <p className="font-mono text-[0.62rem] tracking-widest uppercase text-ink3 mb-2">{label}</p>
        <p className="font-display text-4xl tracking-tight leading-none" style={color ? { color } : {}}>
          {value}
        </p>
        {sub && <p className="text-xs text-ink3 mt-1.5">{sub}</p>}
      </CardContent>
    </Card>
  )
}

// ── Drill-down panel ──────────────────────────────────────────────
function DrillDownPanel({ combo, comboData, byYear, summary, total, onClose }) {
  if (!combo) return null

  const def = COMBO_DEFS.find(d => d.key === combo)
  if (!def) return null

  // By year data
  const byYearData = byYear.map(d => {
    let val
    if (combo === 'single_male')   val = d.single_author?.male   || 0
    else if (combo === 'single_female') val = d.single_author?.female || 0
    else if (combo === 'other') {
      const known = (d.combos.mm||0)+(d.combos.ff||0)+(d.combos.fm||0)+(d.combos.mf||0)+(d.single_author?.male||0)+(d.single_author?.female||0)
      val = d.total - known
    } else val = d.combos[combo] || 0
    return { year: d.year, value: pct(val, d.total) }
  })

  // By university data
  const uniData = summary.by_university.map(u => {
    const ct = comboData.find(c => c.key === combo)
    return {
      name: u.university.replace('University of ', 'U. ').replace('Australian National University', 'ANU').replace('UNSW Sydney', 'UNSW'),
      value: u[`female_first_pct`] // placeholder — ideally we'd have per-uni combo breakdown
    }
  })

  // By field data
  const fieldData = summary.by_field.map(f => ({
    name: f.field,
    value: f.female_first_pct
  })).sort((a, b) => b.value - a.value)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={onClose}>
      <div className="bg-background border border-rule w-full max-w-4xl max-h-[85vh] overflow-y-auto mx-4"
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-rule">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full" style={{ background: def.color }} />
            <h3 className="font-display text-xl tracking-tight">{def.label}</h3>
            <span className="font-mono text-xs text-ink3">
              {pct(comboData.find(c => c.key === combo)?.rawValue || 0, total)}% of all papers
            </span>
          </div>
          <button onClick={onClose}
            className="font-mono text-xs tracking-widest uppercase text-ink3 hover:text-ink transition-colors px-2 py-1 border border-rule hover:border-ink">
            Close ×
          </button>
        </div>

        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* By year */}
          <div>
            <p className="font-mono text-[0.65rem] tracking-widest uppercase text-ink3 mb-4">
              % of papers per year
            </p>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={byYearData}>
                <CartesianGrid {...GRID} />
                <XAxis dataKey="year" tick={TICK} axisLine={false} tickLine={false} />
                <YAxis tick={TICK} tickFormatter={v => v + '%'} axisLine={false} tickLine={false} />
                <Tooltip content={<ChartTooltip formatter={v => v?.toFixed(1) + '%'} />} />
                <Line {...LINE} dataKey="value" stroke={def.color} name={def.label} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* By university */}
          <div>
            <p className="font-mono text-[0.65rem] tracking-widest uppercase text-ink3 mb-4">
              Female first-author % by university
            </p>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={uniData} layout="vertical" margin={{ left: 0, right: 40 }}>
                <CartesianGrid {...GRID} horizontal={false} />
                <XAxis type="number" tick={TICK} tickFormatter={v => v + '%'} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" tick={{ ...TICK, fill: '#5C5650' }} axisLine={false} tickLine={false} width={70} />
                <Tooltip content={<ChartTooltip formatter={v => v?.toFixed(1) + '%'} />} />
                <Bar dataKey="value" fill={def.color} maxBarSize={16} radius={0}>
                  <LabelList dataKey="value" position="right" formatter={v => v?.toFixed(1) + '%'}
                    style={{ ...TICK, fill: '#9C9590' }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* By field */}
          <div className="md:col-span-2">
            <p className="font-mono text-[0.65rem] tracking-widest uppercase text-ink3 mb-4">
              Female first-author % by field
            </p>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={fieldData} layout="vertical" margin={{ left: 0, right: 60 }}>
                <CartesianGrid {...GRID} horizontal={false} />
                <XAxis type="number" tick={TICK} tickFormatter={v => v + '%'} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" tick={{ ...TICK, fill: '#5C5650' }} axisLine={false} tickLine={false} width={175} />
                <Tooltip content={<ChartTooltip formatter={v => v?.toFixed(1) + '%'} />} />
                <Bar dataKey="value" fill={def.color} maxBarSize={16} radius={0}>
                  <LabelList dataKey="value" position="right" formatter={v => v?.toFixed(1) + '%'}
                    style={{ ...TICK, fill: '#9C9590' }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Custom bar shape with hover ───────────────────────────────────
function ClickableBar(props) {
  const { x, y, width, height, fill, onClick } = props
  return (
    <rect x={x} y={y} width={width} height={height} fill={fill}
      style={{ cursor: 'pointer', transition: 'opacity 0.15s' }}
      onMouseEnter={e => e.target.style.opacity = '0.75'}
      onMouseLeave={e => e.target.style.opacity = '1'}
      onClick={onClick}
    />
  )
}

export default function Overview() {
  const { summary, byYear, loading } = useData()
  const [activeCombo, setActiveCombo] = useState(null)

  if (loading) return <Loading />
  if (!summary) return null

  const { total_papers, overall, combo_totals, universities, fields } = summary
  const fa = overall.first_author
  const la = overall.last_author
  const faTotal = fa.female + fa.male + fa.ambiguous
  const laTotal = la.female + la.male + la.ambiguous

  // ── Compute single author male/female from by_year totals ────────
  const singleMale   = byYear ? byYear.reduce((s, d) => s + (d.single_author?.male   || 0), 0) : 0
  const singleFemale = byYear ? byYear.reduce((s, d) => s + (d.single_author?.female || 0), 0) : 0
  const singleAmbig  = byYear ? byYear.reduce((s, d) => s + (d.single_author?.ambiguous || 0), 0) : 0

  // "Other" = everything not in the 4 combos or single male/female
  const knownTotal = (combo_totals.mm||0) + (combo_totals.ff||0) + (combo_totals.fm||0) +
                     (combo_totals.mf||0) + singleMale + singleFemale
  const otherTotal = total_papers - knownTotal

  // Build combo chart data
  const comboData = COMBO_DEFS.map(def => {
    let raw
    if      (def.key === 'mm')            raw = combo_totals.mm || 0
    else if (def.key === 'ff')            raw = combo_totals.ff || 0
    else if (def.key === 'fm')            raw = combo_totals.fm || 0
    else if (def.key === 'mf')            raw = combo_totals.mf || 0
    else if (def.key === 'single_male')   raw = singleMale
    else if (def.key === 'single_female') raw = singleFemale
    else                                  raw = Math.max(0, otherTotal)
    return {
      ...def,
      rawValue: raw,
      value:    pct(raw, total_papers),
    }
  }).sort((a, b) => b.value - a.value)

  const firstDonut = [
    { name: 'Female',    value: fa.female,    color: COLORS.female },
    { name: 'Male',      value: fa.male,      color: COLORS.male },
    { name: 'Ambiguous', value: fa.ambiguous, color: COLORS.ambiguous },
  ]
  const lastDonut = [
    { name: 'Female',    value: la.female,    color: COLORS.female },
    { name: 'Male',      value: la.male,      color: COLORS.male },
    { name: 'Ambiguous', value: la.ambiguous, color: COLORS.ambiguous },
  ]

  return (
    <div>
      {/* ── Hero ── */}
      <div className="text-center py-20 mb-16 border-b border-rule">
        <Badge variant="outline" className="font-mono text-[0.62rem] tracking-widest uppercase text-ink3 border-rule mb-6 rounded-none px-3 py-1">
          Australia's Group of Eight · 2005–2025
        </Badge>
        <h1 className="font-display text-5xl lg:text-7xl tracking-tight leading-[1.05] mb-6">
          Who is <em className="italic text-female">authoring</em><br />Australian research?
        </h1>
        <p className="text-base text-ink2 max-w-lg mx-auto leading-relaxed mb-10">
          A longitudinal study of gender representation across {fmt(total_papers)} publications
          from Australia's eight leading research universities.
        </p>
        <div className="flex flex-wrap justify-center gap-px bg-rule border border-rule w-fit mx-auto">
          <StatPill label="Total papers"        value={fmt(total_papers)} />
          <StatPill label="Female first author" value={pct(fa.female, faTotal) + '%'} />
          <StatPill label="Female last author"  value={pct(la.female, laTotal) + '%'} />
          <StatPill label="Universities"        value={universities.length} />
          <StatPill label="Years covered"       value="20" />
        </div>
      </div>

      {/* ── Stat cards ── */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-px bg-rule border border-rule mb-12">
        <StatCard label="Total papers"        value={fmt(total_papers)}                              sub="2005–2025" />
        <StatCard label="Female first author" value={pct(fa.female, faTotal) + '%'}                  sub={fmt(fa.female) + ' papers'} color={COLORS.female} />
        <StatCard label="Female last author"  value={pct(la.female, laTotal) + '%'}                  sub="Multi-author only"           color={COLORS.female} />
        <StatCard label="Male first author"   value={pct(fa.male, faTotal) + '%'}                    sub={fmt(fa.male) + ' papers'}   color={COLORS.male} />
        <StatCard label="FF papers"           value={pct(combo_totals.ff || 0, total_papers) + '%'}  sub="Female first & last" />
        <StatCard label="MM papers"           value={pct(combo_totals.mm || 0, total_papers) + '%'}  sub="Male first & last" />
      </div>

      {/* ── Gender donuts ── */}
      <div className="mb-4">
        <h2 className="font-display text-2xl tracking-tight mb-1">Authorship Gender</h2>
        <p className="text-sm text-ink3 font-mono tracking-wider uppercase mb-6">All papers · 2005–2025</p>
        <Separator className="mb-8 bg-rule" />
      </div>

      <ChartGrid cols={2}>
        <ChartCard title="First author gender" subtitle="Share of papers by first-author gender across all 20 years">
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={firstDonut} cx="50%" cy="50%" innerRadius={65} outerRadius={105}
                dataKey="value" paddingAngle={2}>
                {firstDonut.map((d, i) => <Cell key={i} fill={d.color} strokeWidth={0} />)}
              </Pie>
              <Tooltip content={<ChartTooltip formatter={v => `${pct(v, faTotal)}% · ${fmt(v)} papers`} />} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex justify-center gap-5 mt-2">
            {firstDonut.map(d => (
              <div key={d.name} className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full" style={{ background: d.color }} />
                <span className="text-xs text-ink2">{d.name} <span className="font-mono text-ink3">{pct(d.value, faTotal)}%</span></span>
              </div>
            ))}
          </div>
        </ChartCard>

        <ChartCard title="Last author gender (multi-author papers)" subtitle="Senior/PI authorship position — excludes single-author papers">
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={lastDonut} cx="50%" cy="50%" innerRadius={65} outerRadius={105}
                dataKey="value" paddingAngle={2}>
                {lastDonut.map((d, i) => <Cell key={i} fill={d.color} strokeWidth={0} />)}
              </Pie>
              <Tooltip content={<ChartTooltip formatter={v => `${pct(v, laTotal)}% · ${fmt(v)} papers`} />} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex justify-center gap-5 mt-2">
            {lastDonut.map(d => (
              <div key={d.name} className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full" style={{ background: d.color }} />
                <span className="text-xs text-ink2">{d.name} <span className="font-mono text-ink3">{pct(d.value, laTotal)}%</span></span>
              </div>
            ))}
          </div>
        </ChartCard>
      </ChartGrid>

      {/* ── Combo bar ── */}
      <div className="mb-4">
        <h2 className="font-display text-2xl tracking-tight mb-1">Authorship Combinations</h2>
        <p className="text-sm text-ink3 font-mono tracking-wider uppercase mb-2">All papers · click a bar to explore</p>
        <Separator className="mb-8 bg-rule" />
      </div>

      <ChartGrid cols={1}>
        <ChartCard
          title="First × Last author gender combos"
          subtitle="Percentage of all papers by authorship gender combination. Click any bar to see breakdown by year, university and field."
        >
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={comboData} layout="vertical" margin={{ left: 10, right: 70, top: 4, bottom: 4 }}>
              <CartesianGrid {...GRID} horizontal={false} />
              <XAxis type="number" tick={TICK} tickFormatter={v => v + '%'} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="label" tick={{ ...TICK, fill: '#5C5650' }} axisLine={false} tickLine={false} width={120} />
              <Tooltip content={<ChartTooltip formatter={(v, n, props) => `${v?.toFixed(1)}% · ${fmt(props?.payload?.rawValue)} papers`} />} />
              <Bar dataKey="value" maxBarSize={24} radius={0}
                shape={(props) => {
                  const d = comboData[props.index]
                  return <ClickableBar {...props} fill={d?.color || '#ccc'} onClick={() => setActiveCombo(d?.key)} />
                }}
              >
                <LabelList dataKey="value" position="right" formatter={v => v?.toFixed(1) + '%'}
                  style={{ ...TICK, fill: '#9C9590' }} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <p className="text-xs text-ink3 mt-3">Click any bar to see breakdown by year, university and field →</p>
        </ChartCard>
      </ChartGrid>

      {/* ── Drill-down panel ── */}
      {activeCombo && (
        <DrillDownPanel
          combo={activeCombo}
          comboData={comboData}
          byYear={byYear}
          summary={summary}
          total={total_papers}
          onClose={() => setActiveCombo(null)}
        />
      )}
    </div>
  )
}
