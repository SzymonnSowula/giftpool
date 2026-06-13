import { motion } from 'framer-motion'
import { Clock, Target, Users, Share2 } from 'lucide-react'
import { Badge } from './ui/Badge'
import { Progress } from './ui/Progress'
import { lamportsToSol } from '../hooks/useProgram'
import { useToast } from './ui/Toast'
import { getPoolPhase, numericValueToNumber, publicKeyToString } from '../lib/pools'
import type { PoolView } from '../types/pool'

export function PoolCard({ pool, onClick, index }: { pool: PoolView; onClick: () => void; index: number }) {
  const { toast } = useToast()
  const phase = getPoolPhase(pool)
  const target = numericValueToNumber(pool.targetAmount)
  const total = numericValueToNumber(pool.totalContributed)
  const progress = target > 0 ? (total / target) * 100 : 0

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation()
    const addr = publicKeyToString(pool.address)
    if (!addr) return
    
    const url = `${window.location.origin}?pool=${addr}`
    
    try {
      await navigator.clipboard.writeText(url)
      toast({ type: 'success', message: 'Link copied to clipboard!' })
    } catch {
      const textArea = document.createElement('textarea')
      textArea.value = url
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      toast({ type: 'success', message: 'Link copied to clipboard!' })
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.06, ease: [0.16, 1, 0.3, 1] as const }}
      onClick={onClick}
      className="liquid-glass"
      style={{
        borderRadius: 'var(--r-lg)',
        padding: 'var(--space-5)',
        cursor: 'pointer',
        transition: 'transform 0.2s, border-color 0.2s, box-shadow 0.2s',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = 'var(--border-strong)'
        e.currentTarget.style.transform = 'translateY(-2px)'
        e.currentTarget.style.boxShadow = 'var(--shadow-md)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'var(--border)'
        e.currentTarget.style.transform = 'translateY(0)'
        e.currentTarget.style.boxShadow = 'none'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '60%' }}>
          {pool.name || 'Unnamed Pool'}
        </h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            onClick={handleShare}
            style={{
              padding: 6,
              borderRadius: 'var(--r-sm)',
              background: 'transparent',
              border: '1px solid var(--border)',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'var(--accent)'
              e.currentTarget.style.color = 'var(--accent)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'var(--border)'
              e.currentTarget.style.color = 'var(--text-muted)'
            }}
            title="Share pool"
          >
            <Share2 size={14} />
          </button>
          <Badge type={phase.badgeType}>{phase.label}</Badge>
        </div>
      </div>

      <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginBottom: 16, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {publicKeyToString(pool.address)}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 16px', marginBottom: 16 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            <Target size={12} /> Target
          </div>
          <div style={{ fontSize: 'var(--text-md)', fontWeight: 700 }}>
            {lamportsToSol(pool.targetAmount)} <span style={{ fontSize: 'var(--text-xs)', fontWeight: 500, color: 'var(--text-muted)' }}>SOL</span>
          </div>
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            <Users size={12} /> Raised
          </div>
          <div style={{ fontSize: 'var(--text-md)', fontWeight: 700, color: phase.targetMet ? 'var(--success)' : 'var(--text)' }}>
            {lamportsToSol(pool.totalContributed)} <span style={{ fontSize: 'var(--text-xs)', fontWeight: 500, color: 'var(--text-muted)' }}>SOL</span>
          </div>
        </div>
        <div style={{ gridColumn: '1 / -1' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            <Clock size={12} /> {phase.deadlinePassed ? 'Deadline passed' : 'Deadline'}
          </div>
          <div style={{ fontSize: 'var(--text-sm)', color: phase.deadlinePassed ? 'var(--error)' : 'var(--text-secondary)', fontWeight: 500 }}>
            {phase.deadlinePassed ? phase.label : (() => {
              const deadlineNum = numericValueToNumber(pool.deadline)
              return new Date(deadlineNum * 1000).toLocaleString('pl-PL', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })
            })()}
          </div>
        </div>
      </div>

      <Progress value={total} max={target} color={phase.targetMet ? 'var(--success)' : 'var(--accent)'} />
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
        <span>{Math.round(Math.min(100, progress))}% complete</span>
        <span>{lamportsToSol(Math.max(0, target - total))} SOL left</span>
      </div>
    </motion.div>
  )
}
