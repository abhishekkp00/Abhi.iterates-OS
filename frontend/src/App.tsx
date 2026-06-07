import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'

function App() {
  const [status, setStatus] = useState('checking...')

  useEffect(() => {
    fetch('/api/health')
      .then(r => r.json())
      .then(d => setStatus(d.message))
      .catch(() => setStatus('Backend not reachable'))
  }, [])

  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-4">
      <h1 className="text-3xl font-bold">Day 1 ✅</h1>
      <p className="text-muted-foreground">Backend: <span className="text-green-600 font-medium">{status}</span></p>
      <Button>Shadcn is working</Button>
    </main>
  )
}

export default App
