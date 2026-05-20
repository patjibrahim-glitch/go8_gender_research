import { useState } from 'react'
import { useData } from '@/hooks/useData.jsx'
import { pct, fmt, COLORS, UNI_COLORS } from '@/lib/utils'
import Loading from '@/components/layout/Loading'
import SectionHeader from '@/components/layout/SectionHeader'
import ChartGrid from '@/components/layout/ChartGrid'
import ChartCard from '@/components/layout/ChartCard'
import Legend from '@/components/layout/Legend'
import ChartTooltip from '@/components/charts/ChartTooltip'
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, LabelList
} from 'recharts'

const TICK = { fontSize: 11, fontFamily: 'DM Mono, monospace', fill: '#9C9590' }
const GRID = { stroke: '#E2DDD8' }
const LINE = { dot: false, strokeWidth: 1.5, type: 'monotone' }

export default function DeepDive() {
  const { summary, byYear, loading } = useData()
  const [activeTab, setActiveTab] = useState('universities')

  if (loading) return <Loading />
  if (!summary) return null

  const unis   = summary.by_university
  const fields = summary.by_field

  const uniBarData = unis.map(u => ({
    name:     u.university
      .replace('University of ', 'U. of ')
      .replace('Australian National University', 'ANU')
      .replace('UNSW Sydney', 'UNSW'),
    full:     u.university,
    firstPct: u.female_first_pct,
    lastPct:  u.female_last_pct,
  })).sort((a, b) => b.firstPct - a.firstPct)

  const uniTimeData = byYear.map(d => ({
    year: d.year,
    ...Object.fromEntries(
      summary.universities.map(u => [u, d.by_university[u] ?? null])
    )
  }))

  const fieldData = [...fields].sort((a, b) => b.female_first_pct - a.female_first_pct)

  return (
    <div>
      <SectionHeader title="Deep Dive" meta="By university and field" />

      {/* Tab buttons */}
      <div className="flex border-b border-rule mb-8">
        {['universities', 'fields'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`font-mono text-[0.68rem] tracking-widest uppercase px-5 py-3 border-b-2 transition-colors ${
              activeTab === tab
                ? 'border-female text-ink'
                : 'border-transparent text-ink3 hover:text-ink'
            }`}
          >
            {tab === 'universities' ? 'Universities' : 'Fields'}
          </button>
        ))}
      </div>

      {/* ── Universities ── */}
      {activeTab === 'universities' && (
        <>
          <ChartGrid cols={1}>
            <ChartCard
              title="Female authorship % by university — all years"
              subtitle="Ranked by female first-author share. Darker bar = first author, lighter = last author."
            >
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={uniBarData} margin={{ top: 10, right: 40, left: 0, bottom: 0 }}>
                  <CartesianGrid {...GRID} vertical={false} />
                  <XAxis dataKey="name" tick={{ ...TICK, fill: '#5C5650' }} axisLine={false} tickLine={false} />
                  <YAxis tick={TICK} tickFormatter={v => v + '%'} axisLine={false} tickLine={false} />
                  <Tooltip content={<ChartTooltip formatter={v => v?.toFixed(1) + '%'} />} />
                  <Bar dataKey="firstPct" name="Female first %" fill={COLORS.female} maxBarSize={32} />
                  <Bar dataKey="lastPct"  name="Female last %"  fill={COLORS.female + '77'} maxBarSize={32} />
                </BarChart>
              </ResponsiveContainer>
              <Legend items={[
                { color: COLORS.female,        label: 'Female first author %' },
                { color: COLORS.female + '77', label: 'Female last author %' },
              ]} />
            </ChartCard>
          </ChartGrid>

          <ChartGrid cols={1}>
            <ChartCard
              title="University parity over time — female first-author %"
              subtitle="How each of the eight universities has changed from 2005 to 2025"
            >
              <ResponsiveContainer width="100%" height={360}>
                <LineChart data={uniTimeData}>
                  <CartesianGrid {...GRID} />
                  <XAxis dataKey="year" tick={TICK} axisLine={false} tickLine={false} />
                  <YAxis tick={TICK} tickFormatter={v => v + '%'} axisLine={false} tickLine={false} />
                  <Tooltip content={<ChartTooltip formatter={v => v?.toFixed(1) + '%'} />} />
                  {summary.universities.map((u, i) => (
                    <Line key={u} {...LINE} dataKey={u} stroke={UNI_COLORS[i % UNI_COLORS.length]} name={u} />
                  ))}
                </LineChart>
              </ResponsiveContainer>
              <Legend items={summary.universities.map((u, i) => ({
                color: UNI_COLORS[i % UNI_COLORS.length],
                label: u,
              }))} />
            </ChartCard>
          </ChartGrid>
        </>
      )}

      {/* ── Fields ── */}
      {activeTab === 'fields' && (
        <ChartGrid cols={2}>
          <ChartCard
            title="Female first-author % by field"
            subtitle="Which disciplines lead and lag on gender parity at junior authorship level?"
          >
            <ResponsiveContainer width="100%" height={380}>
              <BarChart data={fieldData} layout="vertical" margin={{ top: 0, right: 48, left: 0, bottom: 0 }}>
                <CartesianGrid {...GRID} horizontal={false} />
                <XAxis type="number" tick={TICK} tickFormatter={v => v + '%'} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="field" tick={{ ...TICK, fill: '#5C5650' }} axisLine={false} tickLine={false} width={175} />
                <Tooltip content={<ChartTooltip formatter={v => v?.toFixed(1) + '%'} />} />
                <Bar dataKey="female_first_pct" name="Female first %" fill={COLORS.female} maxBarSize={20} radius={0}>
                  <LabelList dataKey="female_first_pct" position="right" formatter={v => v?.toFixed(1) + '%'}
                    style={{ ...TICK, fill: '#9C9590' }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard
            title="Female last-author % by field"
            subtitle="Senior authorship parity across disciplines"
          >
            <ResponsiveContainer width="100%" height={380}>
              <BarChart data={fieldData} layout="vertical" margin={{ top: 0, right: 48, left: 0, bottom: 0 }}>
                <CartesianGrid {...GRID} horizontal={false} />
                <XAxis type="number" tick={TICK} tickFormatter={v => v + '%'} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="field" tick={{ ...TICK, fill: '#5C5650' }} axisLine={false} tickLine={false} width={175} />
                <Tooltip content={<ChartTooltip formatter={v => v?.toFixed(1) + '%'} />} />
                <Bar dataKey="female_last_pct" name="Female last %" fill={COLORS.female + '99'} maxBarSize={20} radius={0}>
                  <LabelList dataKey="female_last_pct" position="right" formatter={v => v?.toFixed(1) + '%'}
                    style={{ ...TICK, fill: '#9C9590' }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </ChartGrid>
      )}
    </div>
  )
}
