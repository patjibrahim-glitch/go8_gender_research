import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { DataProvider } from '@/hooks/useData'
import Header from '@/components/layout/Header'
import PageShell from '@/components/layout/PageShell'
import Overview from '@/pages/Overview'
import Trends   from '@/pages/Trends'
import DeepDive from '@/pages/DeepDive'
import Explore  from '@/pages/Explore'

export default function App() {
  return (
    <DataProvider>
      <BrowserRouter>
        <Header />
        <PageShell>
          <Routes>
            <Route path="/"         element={<Overview />} />
            <Route path="/trends"   element={<Trends />}   />
            <Route path="/deepdive" element={<DeepDive />} />
            <Route path="/explore"  element={<Explore />}  />
          </Routes>
        </PageShell>
      </BrowserRouter>
    </DataProvider>
  )
}
