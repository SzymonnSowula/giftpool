import { useCallback, useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, RefreshCw, Inbox } from 'lucide-react'
import { useProgram } from '../hooks/useProgram'
import { PoolCard } from './PoolCard'
import { Skeleton } from './ui/Skeleton'
import { Input } from './ui/Input'
import { filterAndSortPools, getPoolPhase, publicKeyToString } from '../lib/pools'
import type { PoolFilterStatus, PoolView } from '../types/pool'

const statusFilters: { id: PoolFilterStatus; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'open', label: 'Open' },
  { id: 'funded', label: 'Funded' },
  { id: 'expired', label: 'Refundable' },
  { id: 'refunding', label: 'Refunding' },
  { id: 'closed', label: 'Closed' },
]

export function PoolList({ onSelect }: { onSelect: (pool: PoolView) => void }) {
  const { fetchAllPools } = useProgram()
  const [pools, setPools] = useState<PoolView[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<PoolFilterStatus>('all')
  const [error, setError] = useState('')

  const fetchPools = useCallback(async (initial = false) => {
    if (initial) setLoading(true)
    else setRefreshing(true)
    setError('')
    try {
      const all = await fetchAllPools()
      setPools(all)
    } catch (error) {
      console.error('Failed to fetch pools:', error)
      setError('Failed to load pools')
    } finally {
      if (initial) setLoading(false)
      else setRefreshing(false)
    }
  }, [fetchAllPools])

  useEffect(() => {
    fetchPools(true)
    const interval = setInterval(() => fetchPools(false), 15000)
    return () => clearInterval(interval)
  }, [fetchPools])

  const counts = useMemo(() => {
    return pools.reduce<Record<PoolFilterStatus, number>>(
      (acc, pool) => {
        const phase = getPoolPhase(pool).id
        acc.all += 1
        acc[phase] += 1
        return acc
      },
      { all: 0, open: 0, funded: 0, expired: 0, refunding: 0, closed: 0, unknown: 0 },
    )
  }, [pools])

  const filtered = useMemo(() => {
    return filterAndSortPools(pools, {
      query,
      status: statusFilter,
    })
  }, [pools, query, statusFilter])

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
          onClick={() => fetchPools(false)}
          disabled={loading || refreshing}
          style={{
            padding: 10,
            borderRadius: 'var(--r-sm)',
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            color: 'var(--text)',
            cursor: loading || refreshing ? 'wait' : 'pointer',
            transition: 'transform 0.15s',
          }}
          title="Refresh pools"
          onMouseDown={(e) => !loading && !refreshing && (e.currentTarget.style.transform = 'scale(0.96)')}
          onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
        >
          <RefreshCw size={16} className={loading || refreshing ? 'spin' : ''} />
        </button>
      </div>

      <div
        style={{
          display: 'flex',
          gap: 8,
          marginBottom: 24,
          overflowX: 'auto',
          paddingBottom: 2,
        }}
      >
        {statusFilters.map((filter) => {
          const active = statusFilter === filter.id
          return (
            <button
              key={filter.id}
              type="button"
              onClick={() => setStatusFilter(filter.id)}
              style={{
                flex: '0 0 auto',
                borderRadius: 'var(--r-full)',
                border: `1px solid ${active ? 'var(--border-strong)' : 'var(--border)'}`,
                background: active ? 'rgba(255, 255, 255, 0.13)' : 'rgba(255, 255, 255, 0.05)',
                color: active ? 'var(--text)' : 'var(--text-muted)',
                padding: '8px 12px',
                fontSize: 'var(--text-xs)',
                fontWeight: 800,
                transition: 'background 0.2s, color 0.2s, border-color 0.2s',
              }}
            >
              {filter.label} {counts[filter.id] > 0 ? counts[filter.id] : ''}
            </button>
          )
        })}
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
              <PoolCard key={publicKeyToString(pool.address)} pool={pool} onClick={() => onSelect(pool)} index={i} />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
