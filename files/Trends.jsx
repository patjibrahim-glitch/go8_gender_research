import { useState } from 'react'
import { useData } from '@/hooks/useData'
import { pct, fmt, COLORS, UNI_COLORS } from '@/lib/utils'
import Loading from '@/components/layout/Loading'
import SectionHeader from '@/components/layout/SectionHeader'
import ChartGrid from '@/components/layout/ChartGrid'
import ChartCard from '@/components/layout/ChartCard'
import Legend from '@/components/layout/Legend'
import ChartTooltip from '@/components/charts/ChartTooltip'
import { Button } from '@/components/ui/button'
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer,
  ReferenceLine, Cell
} from 'recharts'

const TICK  = { fontSize: 11, fontFamily: 'DM Mono, monospace', fill: '#9C9590' }
const GRID  = { stroke: '#E2DDD8' }
const LINE  = { dot: false, strokeWidth: 2, type: 'monotone' }

export default function Trends() {
  const { byYear, pctData, loading } = useData()
  const [citePos, setCitePos] = useState('first')

  if (loading) return <Loading />
  if (!byYear)  return null

  // ── 1. Absolute counts ───────────────────────────────────────────
  const absoluteData = byYear.map(d => ({
    year: d.year,
    Female:    d.absolute_counts.female,
    Male:      d.absolute_counts.male,
    Ambiguous: d.absolute_counts.ambiguous,
  }))

  // ── 2. Leaky pipeline ────────────────────────────────────────────
  const pipelineData = byYear.map(d => ({
    year: d.year,
    'Female first': d.pipeline.female_first_pct,
    'Female last':  d.pipeline.female_last_pct,
    'Male first':   d.pipeline.male_first_pct,
    'Male last':    d.pipeline.male_last_pct,
  }))

  // ── 3. Citation percentiles ──────────────────────────────────────
  const citeYears = [...new Set((pctData || []).map(d => d.year))].sort().filter(y => y < 2025)
  const citeData  = citeYears.map(y => {
    const row = (g) => pctData.find(d => d.year === y && d.gender === g && d.position === citePos)
    return {
      year:      y,
      Female:    row('female')?.median_pct ?? null,
      Male:      row('male')?.median_pct   ?? null,
      Ambiguous: row('ambiguous')?.median_pct ?? null,
    }
  })

  // ── 4. Combos over time ──────────────────────────────────────────
  const comboData = byYear.map(d => ({
    year: d.year,
    'Male–Male':     pct(d.combos.mm || 0, d.total),
    'Female–Female': pct(d.combos.ff || 0, d.total),
    'Female–Male':   pct(d.combos.fm || 0, d.total),
    'Male–Female':   pct(d.combos.mf || 0, d.total),
  }))

  // ── 5. Single author ─────────────────────────────────────────────
  const singleData = byYear.map(d => ({
    year:      d.year,
    Female:    d.single_author.female,
    Male:      d.single_author.male,
    Ambiguous: d.single_author.ambiguous,
  }))

  return (
    <div>
      <SectionHeader title="Trends Over Time" meta="2005–2025" />

      {/* 1. Absolute counts */}
      <ChartGrid cols={1}>
        <ChartCard
          title="Absolute paper counts by first-author gender"
          subtitle="Is growth in female authorship real, or just proportional to overall output growth?"
        >
          <ResponsiveContainer width="100%" height={360}>
            <BarChart data={absoluteData}>
              <CartesianGrid {...GRID} vertical={false} />
              <XAxis dataKey="year" tick={TICK} axisLine={false} tickLine={false} />
              <YAxis tick={TICK} tickFormatter={fmt} axisLine={false} tickLine={false} />
              <Tooltip content={<ChartTooltip formatter={fmt} />} />
              <Bar dataKey="Female"    stackId="s" fill={COLORS.female}    maxBarSize={32} />
              <Bar dataKey="Male"      stackId="s" fill={COLORS.male}      maxBarSize={32} />
              <Bar dataKey="Ambiguous" stackId="s" fill={COLORS.ambiguous} maxBarSize={32} />
            </BarChart>
          </ResponsiveContainer>
          <Legend items={[
            { color: COLORS.female,    label: 'Female' },
            { color: COLORS.male,      label: 'Male' },
            { color: COLORS.ambiguous, label: 'Ambiguous' },
          ]} />
        </ChartCard>
      </ChartGrid>

      {/* 2. Leaky pipeline */}
      <ChartGrid cols={1}>
        <ChartCard
          title="The leaky pipeline — first vs last author"
          subtitle="Female and male representation at junior (first) vs senior (last) authorship positions."
          footnote="A gap between solid and dashed lines of the same colour indicates a pipeline problem — researchers are less likely to reach senior roles than their share at junior level would predict."
        >
          <ResponsiveContainer width="100%" height={360}>
            <LineChart data={pipelineData}>
              <CartesianGrid {...GRID} />
              <XAxis dataKey="year" tick={TICK} axisLine={false} tickLine={false} />
              <YAxis tick={TICK} tickFormatter={v => v + '%'} domain={[0, 100]} axisLine={false} tickLine={false} />
              <Tooltip content={<ChartTooltip formatter={v => v?.toFixed(1) + '%'} />} />
              <Line {...LINE} dataKey="Female first" stroke={COLORS.female} />
              <Line {...LINE} dataKey="Female last"  stroke={COLORS.female} strokeDasharray="5 4" strokeOpacity={0.7} />
              <Line {...LINE} dataKey="Male first"   stroke={COLORS.male} />
              <Line {...LINE} dataKey="Male last"    stroke={COLORS.male}   strokeDasharray="5 4" strokeOpacity={0.7} />
            </LineChart>
          </ResponsiveContainer>
          <Legend items={[
            { color: COLORS.female, label: 'Female first (solid)' },
            { color: COLORS.female, label: 'Female last (dashed)' },
            { color: COLORS.male,   label: 'Male first (solid)' },
            { color: COLORS.male,   label: 'Male last (dashed)' },
          ]} />
        </ChartCard>
      </ChartGrid>

      {/* 3. Citation percentiles */}
      <ChartGrid cols={1}>
        <ChartCard
          title="Citation impact by gender — within-year percentile"
          subtitle="Median citation percentile rank within each year's cohort. Controls for the natural advantage older papers have in accumulating citations."
          footnote="A paper at the 60th percentile was cited more than 60% of papers published the same year. The 50th percentile is the expected baseline. 2025 excluded as papers haven't had time to accumulate citations."
        >
          <div className="flex gap-px border border-rule w-fit mb-5">
            {['first','last'].map(pos => (
              <button key={pos}
                onClick={() => setCitePos(pos)}
                className={`font-mono text-[0.68rem] tracking-widest uppercase px-3 py-1.5 transition-colors ${
                  citePos === pos ? 'bg-ink text-bg' : 'text-ink3 hover:text-ink'
                }`}
              >
                {pos} author
              </button>
            ))}
          </div>
          <ResponsiveContainer width="100%" height={360}>
            <LineChart data={citeData}>
              <CartesianGrid {...GRID} />
              <XAxis dataKey="year" tick={TICK} axisLine={false} tickLine={false} />
              <YAxis tick={TICK} tickFormatter={v => v + 'th'} domain={[30, 70]} axisLine={false} tickLine={false} />
              <Tooltip content={<ChartTooltip formatter={v => v?.toFixed(1) + 'th pct'} />} />
              <ReferenceLine y={50} stroke="#E2DDD8" strokeDasharray="4 4" label={{ value: 'Baseline', fill: '#9C9590', fontSize: 10, fontFamily: 'DM Mono' }} />
              <Line {...LINE} dataKey="Female"    stroke={COLORS.female} />
              <Line {...LINE} dataKey="Male"      stroke={COLORS.male} />
              <Line {...LINE} dataKey="Ambiguous" stroke={COLORS.ambiguous} />
            </LineChart>
          </ResponsiveContainer>
          <Legend items={[
            { color: COLORS.female,    label: 'Female' },
            { color: COLORS.male,      label: 'Male' },
            { color: COLORS.ambiguous, label: 'Ambiguous' },
          ]} />
        </ChartCard>
      </ChartGrid>

      {/* 4. Combos over time */}
      <ChartGrid cols={1}>
        <ChartCard
          title="Authorship combinations over time"
          subtitle="How the mix of first × last author gender combinations has shifted across 20 years"
        >
          <ResponsiveContainer width="100%" height={360}>
            <LineChart data={comboData}>
              <CartesianGrid {...GRID} />
              <XAxis dataKey="year" tick={TICK} axisLine={false} tickLine={false} />
              <YAxis tick={TICK} tickFormatter={v => v + '%'} axisLine={false} tickLine={false} />
              <Tooltip content={<ChartTooltip formatter={v => v?.toFixed(1) + '%'} />} />
              <Line {...LINE} dataKey="Male–Male"     stroke={COLORS.mm} />
              <Line {...LINE} dataKey="Female–Female" stroke={COLORS.ff} />
              <Line {...LINE} dataKey="Female–Male"   stroke={COLORS.fm} />
              <Line {...LINE} dataKey="Male–Female"   stroke={COLORS.mf} />
            </LineChart>
          </ResponsiveContainer>
          <Legend items={[
            { color: COLORS.mm, label: 'Male–Male' },
            { color: COLORS.ff, label: 'Female–Female' },
            { color: COLORS.fm, label: 'Female–Male' },
            { color: COLORS.mf, label: 'Male–Female' },
          ]} />
        </ChartCard>
      </ChartGrid>

      {/* 5. Single author */}
      <ChartGrid cols={1}>
        <ChartCard
          title="Single-author papers by gender"
          subtitle="Do men or women publish alone more often? Single-author papers indicate independent scholarship."
        >
          <ResponsiveContainer width="100%" height={360}>
            <LineChart data={singleData}>
              <CartesianGrid {...GRID} />
              <XAxis dataKey="year" tick={TICK} axisLine={false} tickLine={false} />
              <YAxis tick={TICK} tickFormatter={fmt} axisLine={false} tickLine={false} />
              <Tooltip content={<ChartTooltip formatter={fmt} />} />
              <Line {...LINE} dataKey="Female"    stroke={COLORS.female} />
              <Line {...LINE} dataKey="Male"      stroke={COLORS.male} />
              <Line {...LINE} dataKey="Ambiguous" stroke={COLORS.ambiguous} />
            </LineChart>
          </ResponsiveContainer>
          <Legend items={[
            { color: COLORS.female,    label: 'Female' },
            { color: COLORS.male,      label: 'Male' },
            { color: COLORS.ambiguous, label: 'Ambiguous' },
          ]} />
        </ChartCard>
      </ChartGrid>
    </div>
  )
}
