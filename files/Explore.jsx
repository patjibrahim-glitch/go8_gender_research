import { useState, useEffect, useCallback } from 'react'
import { useData } from '@/hooks/useData'
import { fmt } from '@/lib/utils'
import Loading from '@/components/layout/Loading'
import SectionHeader from '@/components/layout/SectionHeader'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Table, TableBody, TableCell,
  TableHead, TableHeader, TableRow,
} from '@/components/ui/table'

const GENDER_COLORS = {
  female:    'bg-[#FAE8E2] text-[#C1440E]',
  male:      'bg-[#E2EAF4] text-[#1B4F8A]',
  ambiguous: 'bg-[#EEEAE6] text-[#7A6E5F]',
  '':        'bg-rule text-ink3',
}
const COMBO_COLORS = {
  ff: 'text-[#C1440E]', mm: 'text-[#1B4F8A]',
  fm: 'text-[#6B8F71]', mf: 'text-[#C9963A]',
}

function GenderBadge({ value }) {
  const cls = GENDER_COLORS[value] || GENDER_COLORS['']
  return (
    <span className={`inline-block font-mono text-[0.6rem] tracking-wider uppercase px-1.5 py-0.5 ${cls}`}>
      {value || 'empty'}
    </span>
  )
}

function FilterInput({ label, children }) {
  return (
    <div className="flex flex-col gap-1 flex-1 min-w-[130px]">
      <label className="font-mono text-[0.62rem] tracking-widest uppercase text-ink3">{label}</label>
      {children}
    </div>
  )
}

const inputCls = "font-sans text-sm px-2 py-1.5 border border-rule bg-bg text-ink focus:border-ink outline-none w-full"

export default function Explore() {
  const { summary, loading: dataLoading } = useData()

  const [filters, setFilters]   = useState({
    search: '', institution: '', year_from: '', year_to: '',
    first_author_name: '', last_author_name: '', combo: '',
  })
  const [results,  setResults]  = useState(null)
  const [page,     setPage]     = useState(1)
  const [fetching, setFetching] = useState(false)

  const fetchPapers = useCallback(async (p = 1) => {
    setFetching(true)
    setPage(p)
    const params = new URLSearchParams({ page: p })
    Object.entries(filters).forEach(([k, v]) => { if (v) params.set(k, v) })
    try {
      const res  = await fetch(`/.netlify/functions/papers?${params}`)
      const data = await res.json()
      setResults(data)
    } catch {
      setResults({ error: true })
    } finally {
      setFetching(false)
    }
  }, [filters])

  useEffect(() => { fetchPapers(1) }, [])

  function reset() {
    setFilters({ search: '', institution: '', year_from: '', year_to: '', first_author_name: '', last_author_name: '', combo: '' })
  }

  if (dataLoading) return <Loading />

  const unis = summary?.universities || []

  return (
    <div>
      <SectionHeader title="Explore Papers" meta="Browse & filter 1.2M publications" />

      {/* Filters */}
      <div className="bg-surface border border-rule p-5 mb-6">
        <div className="flex flex-wrap gap-3">
          <FilterInput label="Search title">
            <input className={inputCls} placeholder="e.g. climate change"
              value={filters.search}
              onChange={e => setFilters(f => ({ ...f, search: e.target.value }))}
              onKeyDown={e => e.key === 'Enter' && fetchPapers(1)}
            />
          </FilterInput>

          <FilterInput label="University">
            <Select value={filters.institution} onValueChange={v => setFilters(f => ({ ...f, institution: v === '_all' ? '' : v }))}>
              <SelectTrigger className="rounded-none border-rule bg-bg h-[34px] text-sm font-sans">
                <SelectValue placeholder="All universities" />
              </SelectTrigger>
              <SelectContent className="rounded-none">
                <SelectItem value="_all">All universities</SelectItem>
                {unis.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}
              </SelectContent>
            </Select>
          </FilterInput>

          <FilterInput label="Year from" >
            <input className={inputCls} type="number" min={2005} max={2025} placeholder="2005"
              value={filters.year_from}
              onChange={e => setFilters(f => ({ ...f, year_from: e.target.value }))}
            />
          </FilterInput>

          <FilterInput label="Year to">
            <input className={inputCls} type="number" min={2005} max={2025} placeholder="2025"
              value={filters.year_to}
              onChange={e => setFilters(f => ({ ...f, year_to: e.target.value }))}
            />
          </FilterInput>

          <FilterInput label="First author name">
            <input className={inputCls} placeholder="e.g. Jane Smith"
              value={filters.first_author_name}
              onChange={e => setFilters(f => ({ ...f, first_author_name: e.target.value }))}
              onKeyDown={e => e.key === 'Enter' && fetchPapers(1)}
            />
          </FilterInput>

          <FilterInput label="Last author name">
            <input className={inputCls} placeholder="e.g. John Doe"
              value={filters.last_author_name}
              onChange={e => setFilters(f => ({ ...f, last_author_name: e.target.value }))}
              onKeyDown={e => e.key === 'Enter' && fetchPapers(1)}
            />
          </FilterInput>

          <FilterInput label="Combo">
            <Select value={filters.combo} onValueChange={v => setFilters(f => ({ ...f, combo: v === '_all' ? '' : v }))}>
              <SelectTrigger className="rounded-none border-rule bg-bg h-[34px] text-sm font-sans">
                <SelectValue placeholder="Any" />
              </SelectTrigger>
              <SelectContent className="rounded-none">
                <SelectItem value="_all">Any</SelectItem>
                {['ff','mm','fm','mf','single','ambiguous','unknown'].map(c =>
                  <SelectItem key={c} value={c}>{c.toUpperCase()}</SelectItem>
                )}
              </SelectContent>
            </Select>
          </FilterInput>

          <div className="flex items-end gap-2">
            <button onClick={() => fetchPapers(1)}
              className="font-mono text-[0.68rem] tracking-widest uppercase px-4 py-1.5 bg-ink text-bg hover:bg-female transition-colors">
              Search
            </button>
            <button onClick={() => { reset(); setTimeout(() => fetchPapers(1), 0) }}
              className="font-mono text-[0.68rem] tracking-widest uppercase px-4 py-1.5 border border-ink text-ink hover:bg-ink hover:text-bg transition-colors">
              Reset
            </button>
          </div>
        </div>
      </div>

      {/* Results info */}
      {results && !results.error && (
        <p className="font-mono text-[0.68rem] tracking-wider text-ink3 mb-3">
          {results.total?.toLocaleString()} papers — page {results.page} of {results.pages?.toLocaleString()}
        </p>
      )}

      {/* Table */}
      {fetching ? (
        <Loading />
      ) : results?.error ? (
        <p className="text-sm text-ink3 py-8">Failed to load papers.</p>
      ) : results?.papers?.length === 0 ? (
        <p className="text-sm text-ink3 py-8">No papers found.</p>
      ) : results?.papers ? (
        <>
          <div className="border border-rule overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-b-2 border-ink hover:bg-transparent">
                  {['Title','Year','Institution','Journal','First Author','Last Author','Combo','Citations','Pct','OA'].map(h => (
                    <TableHead key={h} className="font-mono text-[0.62rem] tracking-widest uppercase text-ink3 whitespace-nowrap py-2.5">
                      {h}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {results.papers.map((p, i) => {
                  const fg = p.first_author_gender || ''
                  const lg = p.last_author_gender  || ''
                  const combo = p.combo || ''
                  return (
                    <TableRow key={i} className="border-rule hover:bg-surface/60">
                      <TableCell className="max-w-[280px] py-2.5">
                        {p.doi
                          ? <a href={p.doi} target="_blank" rel="noopener"
                              className="text-ink text-sm leading-snug hover:text-female transition-colors">
                              {p.title || '—'}
                            </a>
                          : <span className="text-sm">{p.title || '—'}</span>
                        }
                      </TableCell>
                      <TableCell className="font-mono text-xs text-ink3 whitespace-nowrap py-2.5">{p.year}</TableCell>
                      <TableCell className="text-xs text-ink2 whitespace-nowrap py-2.5">{p.institution || '—'}</TableCell>
                      <TableCell className="text-xs text-ink2 max-w-[140px] py-2.5">{p.journal || '—'}</TableCell>
                      <TableCell className="whitespace-nowrap py-2.5">
                        <div className="text-xs mb-1">{p.first_author_name || '—'}</div>
                        <GenderBadge value={fg} />
                      </TableCell>
                      <TableCell className="whitespace-nowrap py-2.5">
                        <div className="text-xs mb-1">{p.last_author_name || '—'}</div>
                        <GenderBadge value={lg} />
                      </TableCell>
                      <TableCell className="py-2.5">
                        <span className={`font-mono text-xs font-medium ${COMBO_COLORS[combo] || 'text-ink3'}`}>
                          {combo.toUpperCase()}
                        </span>
                      </TableCell>
                      <TableCell className="font-mono text-xs text-ink3 py-2.5">
                        {parseInt(p.cited_by_count)?.toLocaleString()}
                      </TableCell>
                      <TableCell className="font-mono text-xs text-ink3 py-2.5">
                        {parseFloat(p.cite_pct)?.toFixed(1)}
                      </TableCell>
                      <TableCell className="text-xs text-ink3 py-2.5">
                        {p.open_access === 'True' ? '✓' : ''}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          <Pagination page={results.page} pages={results.pages} onPage={fetchPapers} />
        </>
      ) : null}
    </div>
  )
}

function Pagination({ page, pages, onPage }) {
  if (pages <= 1) return null

  const range = [1]
  if (page > 3) range.push('…')
  for (let i = Math.max(2, page - 1); i <= Math.min(pages - 1, page + 1); i++) range.push(i)
  if (page < pages - 2) range.push('…')
  if (pages > 1) range.push(pages)

  return (
    <div className="flex items-center justify-center gap-1 mt-6">
      <button disabled={page === 1} onClick={() => onPage(page - 1)}
        className="font-mono text-[0.68rem] tracking-wider px-3 py-1.5 border border-rule text-ink2 hover:border-ink hover:text-ink transition-colors disabled:opacity-30 disabled:cursor-default">
        ← Prev
      </button>
      {range.map((r, i) => r === '…'
        ? <span key={i} className="font-mono text-xs text-ink3 px-1">…</span>
        : <button key={r} onClick={() => onPage(r)}
            className={`font-mono text-[0.68rem] tracking-wider px-3 py-1.5 border transition-colors ${
              r === page
                ? 'bg-ink text-bg border-ink'
                : 'border-rule text-ink2 hover:border-ink hover:text-ink'
            }`}>
            {r}
          </button>
      )}
      <button disabled={page === pages} onClick={() => onPage(page + 1)}
        className="font-mono text-[0.68rem] tracking-wider px-3 py-1.5 border border-rule text-ink2 hover:border-ink hover:text-ink transition-colors disabled:opacity-30 disabled:cursor-default">
        Next →
      </button>
    </div>
  )
}
