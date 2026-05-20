import { useData } from '@/hooks/useData.jsx'
import { pct, fmt, COLORS } from '@/lib/utils'
import Loading from '@/components/layout/Loading'
import ChartGrid from '@/components/layout/ChartGrid'
import ChartCard from '@/components/layout/ChartCard'
import ChartTooltip from '@/components/charts/ChartTooltip'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, LabelList
} from 'recharts'

const TICK = { fontSize: 11, fontFamily: 'DM Mono, monospace', fill: '#9C9590' }
const GRID = { stroke: '#E2DDD8' }

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
        {/* Stat pills */}
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
        <ChartCard
          title="First author gender"
          subtitle="Share of papers by first-author gender across all 20 years"
        >
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={firstDonut} cx="50%" cy="50%" innerRadius={65} outerRadius={105}
                dataKey="value" paddingAngle={2}>
                {firstDonut.map((d, i) => <Cell key={i} fill={d.color} strokeWidth={0} />)}
              </Pie>
              <Tooltip content={<ChartTooltip formatter={(v) => `${pct(v, faTotal)}% · ${fmt(v)} papers`} />} />
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

        <ChartCard
          title="Last author gender (multi-author papers)"
          subtitle="Senior/PI authorship position — excludes single-author papers"
        >
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={lastDonut} cx="50%" cy="50%" innerRadius={65} outerRadius={105}
                dataKey="value" paddingAngle={2}>
                {lastDonut.map((d, i) => <Cell key={i} fill={d.color} strokeWidth={0} />)}
              </Pie>
              <Tooltip content={<ChartTooltip formatter={(v) => `${pct(v, laTotal)}% · ${fmt(v)} papers`} />} />
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
        <p className="text-sm text-ink3 font-mono tracking-wider uppercase mb-6">Multi-author papers only</p>
        <Separator className="mb-8 bg-rule" />
      </div>

      <ChartGrid cols={1}>
        <ChartCard
          title="First × Last author gender combos"
          subtitle="How often do female and male researchers appear together as first and last author?"
        >
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={comboData} layout="vertical" margin={{ left: 10, right: 60, top: 4, bottom: 4 }}>
              <CartesianGrid {...GRID} horizontal={false} />
              <XAxis type="number" tick={TICK} tickFormatter={fmt} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="name" tick={{ ...TICK, fill: '#5C5650' }} axisLine={false} tickLine={false} width={110} />
              <Tooltip content={<ChartTooltip formatter={(v, n) => `${fmt(v)} papers · ${pct(v, total_papers)}%`} />} />
              <Bar dataKey="value" maxBarSize={24} radius={0}>
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
