import { useState, useCallback } from 'react'
import { useData } from '@/hooks/useData.jsx'
import { fmt } from '@/lib/utils'
import Loading from '@/components/layout/Loading'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Table, TableBody, TableCell,
  TableHead, TableHeader, TableRow,
} from '@/components/ui/table'

const GENDER_STYLE = {
  female:    'bg-[#FAE8E2] text-[#C1440E] border-[#F0C4B8]',
  male:      'bg-[#E2EAF4] text-[#1B4F8A] border-[#C0CFEA]',
  ambiguous: 'bg-[#EEEAE6] text-[#7A6E5F] border-[#DDD8D2]',
  '':        'bg-muted text-ink3 border-rule',
}

const COMBO_STYLE = {
  ff: 'text-[#C1440E] font-semibold',
  mm: 'text-[#1B4F8A] font-semibold',
  fm: 'text-[#6B8F71] font-semibold',
  mf: 'text-[#C9963A] font-semibold',
}

function GenderBadge({ value }) {
  const style = GENDER_STYLE[value] || GENDER_STYLE['']
  return (
    <span className={`inline-block font-mono text-[0.58rem] tracking-wider uppercase px-1.5 py-0.5 border ${style}`}>
      {value || '—'}
    </span>
  )
}

function FilterLabel({ children }) {
  return (
    <label className="font-mono text-[0.6rem] tracking-widest uppercase text-ink3 mb-1 block">
      {children}
    </label>
  )
}

const inputCls = "w-full font-sans text-sm px-3 py-1.5 border border-rule bg-background text-foreground focus:border-primary outline-none transition-colors placeholder:text-muted-foreground"

export default function Explore() {
  const { summary, loading: dataLoading } = useData()

  const [filters, setFilters] = useState({
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

  function reset() {
    setFilters({ search: '', institution: '', year_from: '', year_to: '', first_author_name: '', last_author_name: '', combo: '' })
  }

  const unis = summary?.universities || []

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h2 className="font-display text-2xl tracking-tight mb-1">Explore Papers</h2>
        <p className="text-sm text-ink3 font-mono tracking-wider uppercase">Browse & filter 1.2M publications</p>
        <Separator className="mt-6 bg-rule" />
      </div>

      {/* Filters */}
      <Card className="rounded-none border-rule shadow-none mb-6">
        <CardContent className="p-5">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[180px]">
              <FilterLabel>Search title</FilterLabel>
              <input className={inputCls} placeholder="e.g. climate change"
                value={filters.search}
                onChange={e => setFilters(f => ({ ...f, search: e.target.value }))}
                onKeyDown={e => e.key === 'Enter' && fetchPapers(1)}
              />
            </div>

            <div className="min-w-[180px]">
              <FilterLabel>University</FilterLabel>
              <Select value={filters.institution || '_all'}
                onValueChange={v => setFilters(f => ({ ...f, institution: v === '_all' ? '' : v }))}>
                <SelectTrigger className="rounded-none border-rule bg-background h-[34px] text-sm">
                  <SelectValue placeholder="All universities" />
                </SelectTrigger>
                <SelectContent className="rounded-none">
                  <SelectItem value="_all">All universities</SelectItem>
                  {unis.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="w-[100px]">
              <FilterLabel>Year from</FilterLabel>
              <input className={inputCls} type="number" min={2005} max={2025} placeholder="2005"
                value={filters.year_from}
                onChange={e => setFilters(f => ({ ...f, year_from: e.target.value }))}
              />
            </div>

            <div className="w-[100px]">
              <FilterLabel>Year to</FilterLabel>
              <input className={inputCls} type="number" min={2005} max={2025} placeholder="2025"
                value={filters.year_to}
                onChange={e => setFilters(f => ({ ...f, year_to: e.target.value }))}
              />
            </div>

            <div className="flex-1 min-w-[150px]">
              <FilterLabel>First author name</FilterLabel>
              <input className={inputCls} placeholder="e.g. Jane Smith"
                value={filters.first_author_name}
                onChange={e => setFilters(f => ({ ...f, first_author_name: e.target.value }))}
                onKeyDown={e => e.key === 'Enter' && fetchPapers(1)}
              />
            </div>

            <div className="flex-1 min-w-[150px]">
              <FilterLabel>Last author name</FilterLabel>
              <input className={inputCls} placeholder="e.g. John Doe"
                value={filters.last_author_name}
                onChange={e => setFilters(f => ({ ...f, last_author_name: e.target.value }))}
                onKeyDown={e => e.key === 'Enter' && fetchPapers(1)}
              />
            </div>

            <div className="w-[120px]">
              <FilterLabel>Combo</FilterLabel>
              <Select value={filters.combo || '_all'}
                onValueChange={v => setFilters(f => ({ ...f, combo: v === '_all' ? '' : v }))}>
                <SelectTrigger className="rounded-none border-rule bg-background h-[34px] text-sm">
                  <SelectValue placeholder="Any" />
                </SelectTrigger>
                <SelectContent className="rounded-none">
                  <SelectItem value="_all">Any</SelectItem>
                  {['ff','mm','fm','mf','single','ambiguous','unknown'].map(c =>
                    <SelectItem key={c} value={c}>{c.toUpperCase()}</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end gap-2">
              <button onClick={() => fetchPapers(1)}
                className="font-mono text-[0.65rem] tracking-widest uppercase px-4 py-2 bg-primary text-primary-foreground hover:bg-female transition-colors">
                Search
              </button>
              <button onClick={() => { reset(); setTimeout(() => fetchPapers(1), 50) }}
                className="font-mono text-[0.65rem] tracking-widest uppercase px-4 py-2 border border-primary text-primary hover:bg-primary hover:text-primary-foreground transition-colors">
                Reset
              </button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results info */}
      {results && !results.error && (
        <p className="font-mono text-[0.65rem] tracking-wider text-ink3 mb-3 uppercase">
          {results.total?.toLocaleString()} papers · page {results.page} of {results.pages?.toLocaleString()}
        </p>
      )}

      {/* Table */}
      {fetching ? (
        <Loading />
      ) : results?.error ? (
        <p className="text-sm text-ink3 py-10 text-center">Failed to load papers.</p>
      ) : results?.papers?.length === 0 ? (
        <p className="text-sm text-ink3 py-10 text-center">No papers found.</p>
      ) : results?.papers ? (
        <>
          <Card className="rounded-none border-rule shadow-none overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="border-b-2 border-primary hover:bg-transparent">
                  {['Title','Year','Institution','Journal','First Author','Last Author','Combo','Citations','Pct','OA'].map(h => (
                    <TableHead key={h} className="font-mono text-[0.6rem] tracking-widest uppercase text-ink3 whitespace-nowrap py-3 bg-muted/30">
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
                    <TableRow key={i} className="border-rule hover:bg-muted/20 transition-colors">
                      <TableCell className="max-w-[260px] py-3">
                        {p.doi
                          ? <a href={p.doi} target="_blank" rel="noopener"
                              className="text-sm text-foreground leading-snug hover:text-female transition-colors line-clamp-2">
                              {p.title || '—'}
                            </a>
                          : <span className="text-sm line-clamp-2">{p.title || '—'}</span>
                        }
                      </TableCell>
                      <TableCell className="font-mono text-xs text-ink3 whitespace-nowrap py-3">{p.year}</TableCell>
                      <TableCell className="text-xs text-ink2 whitespace-nowrap py-3 max-w-[120px]">{p.institution || '—'}</TableCell>
                      <TableCell className="text-xs text-ink2 max-w-[130px] py-3 line-clamp-2">{p.journal || '—'}</TableCell>
                      <TableCell className="whitespace-nowrap py-3">
                        <div className="text-xs text-ink mb-1">{p.first_author_name || '—'}</div>
                        <GenderBadge value={fg} />
                      </TableCell>
                      <TableCell className="whitespace-nowrap py-3">
                        <div className="text-xs text-ink mb-1">{p.last_author_name || '—'}</div>
                        <GenderBadge value={lg} />
                      </TableCell>
                      <TableCell className="py-3">
                        <span className={`font-mono text-xs ${COMBO_STYLE[combo] || 'text-ink3'}`}>
                          {combo.toUpperCase()}
                        </span>
                      </TableCell>
                      <TableCell className="font-mono text-xs text-ink3 py-3 whitespace-nowrap">
                        {parseInt(p.cited_by_count)?.toLocaleString()}
                      </TableCell>
                      <TableCell className="font-mono text-xs text-ink3 py-3">
                        {parseFloat(p.cite_pct)?.toFixed(1)}
                      </TableCell>
                      <TableCell className="text-xs text-ink3 py-3">
                        {p.open_access === 'True'
                          ? <span className="text-[#6B8F71] font-medium">✓</span>
                          : <span className="text-rule">—</span>
                        }
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </Card>

          <Pagination page={results.page} pages={results.pages} onPage={fetchPapers} />
        </>
      ) : (
        <div className="py-16 text-center">
          <p className="font-mono text-xs text-ink3 tracking-widest uppercase mb-4">Ready to search</p>
          <p className="text-sm text-ink2">Use the filters above to explore papers</p>
          <button onClick={() => fetchPapers(1)}
            className="mt-6 font-mono text-[0.65rem] tracking-widest uppercase px-6 py-2 bg-primary text-primary-foreground hover:bg-female transition-colors">
            Load all papers
          </button>
        </div>
      )}
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
        className="font-mono text-[0.65rem] tracking-wider uppercase px-3 py-1.5 border border-rule text-ink2 hover:border-primary hover:text-primary transition-colors disabled:opacity-30 disabled:cursor-default">
        ← Prev
      </button>
      {range.map((r, i) => r === '…'
        ? <span key={i} className="font-mono text-xs text-ink3 px-1">…</span>
        : <button key={r} onClick={() => typeof r === 'number' && onPage(r)}
            className={`font-mono text-[0.65rem] tracking-wider uppercase px-3 py-1.5 border transition-colors ${
              r === page
                ? 'bg-primary text-primary-foreground border-primary'
                : 'border-rule text-ink2 hover:border-primary hover:text-primary'
            }`}>
            {r}
          </button>
      )}
      <button disabled={page === pages} onClick={() => onPage(page + 1)}
        className="font-mono text-[0.65rem] tracking-wider uppercase px-3 py-1.5 border border-rule text-ink2 hover:border-primary hover:text-primary transition-colors disabled:opacity-30 disabled:cursor-default">
        Next →
      </button>
    </div>
  )
}
