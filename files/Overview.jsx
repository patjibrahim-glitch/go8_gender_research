import { useData } from '@/hooks/useData'
import { pct, fmt, COLORS } from '@/lib/utils'
import Loading from '@/components/layout/Loading'
import SectionHeader from '@/components/layout/SectionHeader'
import ChartGrid from '@/components/layout/ChartGrid'
import ChartCard from '@/components/layout/ChartCard'
import ChartTooltip from '@/components/charts/ChartTooltip'
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, LabelList
} from 'recharts'

function StatCard({ label, value, sub, delay = 0 }) {
  return (
    <div className="bg-surface p-6" style={{ animationDelay: `${delay}ms` }}>
      <p className="font-mono text-[0.65rem] tracking-widest uppercase text-ink3 mb-2">{label}</p>
      <p className="font-display text-4xl tracking-tight leading-none">{value}</p>
      {sub && <p className="text-xs text-ink3 mt-1">{sub}</p>}
    </div>
  )
}

const TICK = { fontSize: 11, fontFamily: 'DM Mono, monospace', fill: '#9C9590' }
const GRID = { stroke: '#E2DDD8', strokeDasharray: '0' }

export default function Overview() {
  const { summary, loading } = useData()
  if (loading) return <Loading />
  if (!summary) return null

  const { total_papers, overall, combo_totals, universities, fields } = summary
  const fa = overall.first_author
  const la = overall.last_author
  const faTotal = fa.female + fa.male + fa.ambiguous
  const laTotal = la.female + la.male + la.ambiguous

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

  const comboOrder = ['mm','ff','fm','mf','single','ambiguous','unknown']
  const comboLabels = {
    mm:'Male–Male', ff:'Female–Female', fm:'Female–Male',
    mf:'Male–Female', single:'Single author', ambiguous:'Ambiguous', unknown:'Unknown'
  }
  const comboData = comboOrder
    .map(k => ({ name: comboLabels[k], value: combo_totals[k] || 0, color: COLORS[k] || '#ccc' }))
    .sort((a, b) => b.value - a.value)

  return (
    <div>
      {/* Hero */}
      <div className="border-b border-rule pb-12 mb-10">
        <p className="font-mono text-[0.7rem] tracking-widest uppercase text-ink3 mb-4">
          Australia's Group of Eight Universities · 2005–2025
        </p>
        <h1 className="font-display text-5xl lg:text-7xl tracking-tight leading-[1.05] max-w-3xl mb-5">
          Who is <em className="italic text-female">authoring</em><br />Australian research?
        </h1>
        <p className="text-base text-ink2 max-w-xl leading-relaxed">
          A longitudinal study of gender representation across {fmt(total_papers)} publications
          from Australia's eight leading research universities.
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-px bg-rule border border-rule mb-10">
        <StatCard label="Total papers"        value={fmt(total_papers)}                           sub="2005–2025"          delay={0} />
        <StatCard label="Female first author" value={pct(fa.female, faTotal) + '%'}               sub={fmt(fa.female) + ' papers'} delay={70} />
        <StatCard label="Female last author"  value={pct(la.female, laTotal) + '%'}               sub="Multi-author only"  delay={140} />
        <StatCard label="Universities"        value={universities.length}                          sub="Group of Eight"     delay={210} />
        <StatCard label="Fields mapped"       value={fields.length}                               sub="Broad categories"   delay={280} />
        <StatCard label="FF papers"           value={pct(combo_totals.ff || 0, total_papers) + '%'} sub="Female first & last" delay={350} />
      </div>

      {/* Gender breakdown donuts */}
      <SectionHeader title="Authorship Gender" meta="All papers 2005–2025" />
      <ChartGrid cols={2}>
        <ChartCard
          title="First author gender"
          subtitle="Share of papers by first-author gender across all 20 years"
        >
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={firstDonut} cx="50%" cy="50%" innerRadius={70} outerRadius={110}
                dataKey="value" paddingAngle={2}>
                {firstDonut.map((d, i) => <Cell key={i} fill={d.color} strokeWidth={0} />)}
              </Pie>
              <Tooltip content={<ChartTooltip formatter={(v) => `${pct(v, faTotal)}% (${fmt(v)})`} />} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex justify-center gap-6 mt-2">
            {firstDonut.map(d => (
              <div key={d.name} className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full" style={{ background: d.color }} />
                <span className="text-xs text-ink2">{d.name} — {pct(d.value, faTotal)}%</span>
              </div>
            ))}
          </div>
        </ChartCard>

        <ChartCard
          title="Last author gender (multi-author papers)"
          subtitle="Senior/PI authorship position — excludes single-author papers"
        >
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={lastDonut} cx="50%" cy="50%" innerRadius={70} outerRadius={110}
                dataKey="value" paddingAngle={2}>
                {lastDonut.map((d, i) => <Cell key={i} fill={d.color} strokeWidth={0} />)}
              </Pie>
              <Tooltip content={<ChartTooltip formatter={(v) => `${pct(v, laTotal)}% (${fmt(v)})`} />} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex justify-center gap-6 mt-2">
            {lastDonut.map(d => (
              <div key={d.name} className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full" style={{ background: d.color }} />
                <span className="text-xs text-ink2">{d.name} — {pct(d.value, laTotal)}%</span>
              </div>
            ))}
          </div>
        </ChartCard>
      </ChartGrid>

      {/* Combo bar */}
      <SectionHeader title="Authorship Combinations" meta="Multi-author papers only" />
      <ChartGrid cols={1}>
        <ChartCard
          title="First × Last author gender combos"
          subtitle="How often do female and male researchers appear together as first and last author?"
        >
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={comboData} layout="vertical" margin={{ left: 100, right: 60 }}>
              <CartesianGrid {...GRID} horizontal={false} />
              <XAxis type="number" tick={TICK} tickFormatter={fmt} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="name" tick={{ ...TICK, fill: '#5C5650' }} axisLine={false} tickLine={false} width={95} />
              <Tooltip content={<ChartTooltip formatter={(v) => `${fmt(v)} (${pct(v, total_papers)}%)`} />} />
              <Bar dataKey="value" radius={0} maxBarSize={28}>
                {comboData.map((d, i) => <Cell key={i} fill={d.color} />)}
                <LabelList dataKey="value" position="right" formatter={fmt}
                  style={{ ...TICK, fill: '#9C9590' }} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </ChartGrid>
    </div>
  )
}
