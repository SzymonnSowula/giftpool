import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, RefreshCw, Inbox } from 'lucide-react'
import { useProgram } from '../hooks/useProgram'
import { PoolCard } from './PoolCard'
import { Skeleton } from './ui/Skeleton'
import { Input } from './ui/Input'

export function PoolList({ onSelect }: { onSelect: (pool: any) => void }) {
  const { fetchAllPools } = useProgram()
  const [pools, setPools] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [error, setError] = useState('')

  const fetchPools = async () => {
    setLoading(true)
    setError('')
    try {
      const all = await fetchAllPools()
      setPools(all)
    } catch (e) {
      console.error('Failed to fetch pools:', e)
      setError('Failed to load pools')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPools()
    const interval = setInterval(fetchPools, 15000)
    return () => clearInterval(interval)
  }, [])

  const filtered = pools.filter((p) => {
    const q = query.toLowerCase()
    const name = (p.name || '').toLowerCase()
    const addr = (p.address?.toBase58?.() || p.address || '').toLowerCase()
    return name.includes(q) || addr.includes(q)
  })

  return (
    <div>
      <div style={{ display: 'flex', gap: 12, marginBottom: 24, alignItems: 'center' }}>
        <div style={{ flex: 1 }}>
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search pools..."
            icon={<Search size={16} />}
            fullWidth
          />
        </div>
        <button
          onClick={fetchPools}
          disabled={loading}
          style={{
            padding: 10,
            borderRadius: 'var(--r-sm)',
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            color: 'var(--text)',
            cursor: loading ? 'wait' : 'pointer',
            transition: 'transform 0.15s',
          }}
          onMouseDown={(e) => !loading && (e.currentTarget.style.transform = 'scale(0.96)')}
          onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
        >
          <RefreshCw size={16} className={loading ? 'spin' : ''} />
        </button>
      </div>

      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div
            key="skeleton"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ display: 'flex', flexDirection: 'column', gap: 16 }}
          >
            {[1, 2, 3].map((i) => (
              <div key={i} style={{ borderRadius: 'var(--r-lg)', border: '1px solid var(--border)', background: 'var(--surface)', padding: 24 }}>
                <Skeleton width="60%" height={20} style={{ marginBottom: 12 }} />
                <Skeleton width="40%" height={14} style={{ marginBottom: 20 }} />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                  <Skeleton width="80%" height={16} />
                  <Skeleton width="80%" height={16} />
                </div>
                <Skeleton width="100%" height={6} />
              </div>
            ))}
          </motion.div>
        ) : error ? (
          <motion.div
            key="error"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            style={{ textAlign: 'center', padding: '48px 24px', color: 'var(--error)' }}
          >
            {error}
          </motion.div>
        ) : filtered.length === 0 ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            style={{ textAlign: 'center', padding: '64px 24px' }}
          >
            <Inbox size={40} color="var(--text-muted)" style={{ marginBottom: 16 }} />
            <div style={{ fontSize: 'var(--text-lg)', fontWeight: 600, color: 'var(--text)', marginBottom: 8 }}>
              No pools found
            </div>
            <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>
              {query ? 'Try a different search term' : 'Be the first to create a pool'}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="list"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ display: 'flex', flexDirection: 'column', gap: 16 }}
          >
            {filtered.map((pool, i) => (
              <PoolCard key={pool.address.toBase58()} pool={pool} onClick={() => onSelect(pool)} index={i} />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
