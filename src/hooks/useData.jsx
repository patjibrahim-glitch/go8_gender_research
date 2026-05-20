import { createContext, useContext, useEffect, useState } from 'react'

const DataContext = createContext(null)

export function DataProvider({ children }) {
  const [summary,  setSummary]  = useState(null)
  const [byYear,   setByYear]   = useState(null)
  const [pctData,  setPctData]  = useState(null)
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState(null)

  useEffect(() => {
    Promise.all([
      fetch('/data/summary.json').then(r => r.json()),
      fetch('/data/by_year.json').then(r => r.json()),
      fetch('/data/percentiles.json').then(r => r.json()),
    ])
      .then(([s, b, p]) => {
        setSummary(s)
        setByYear(b)
        setPctData(p)
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  return (
    <DataContext.Provider value={{ summary, byYear, pctData, loading, error }}>
      {children}
    </DataContext.Provider>
  )
}

export function useData() {
  return useContext(DataContext)
}
