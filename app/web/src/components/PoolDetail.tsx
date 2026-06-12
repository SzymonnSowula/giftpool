import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Clock, Target, Users, Wallet, CheckCircle, AlertTriangle, Share2 } from 'lucide-react'
import { useProgram, deriveVaultPda, deriveContributionPda, solToLamports, lamportsToSol } from '../hooks/useProgram'
import { useToast } from './ui/Toast'
import { Button } from './ui/Button'
import { Card } from './ui/Card'
import { Badge } from './ui/Badge'
import { Progress } from './ui/Progress'
import { Stat } from './ui/Stat'
import { PublicKey } from '@solana/web3.js'

interface PoolDetailProps {
  pool: any
  onBack: () => void
}

export function PoolDetail({ pool, onBack }: PoolDetailProps) {
  const { program, wallet } = useProgram()
  const { toast } = useToast()
  const [txLoading, setTxLoading] = useState<string | null>(null)

  const status = pool.status ? Object.keys(pool.status)[0] : 'unknown'
  const now = Math.floor(Date.now() / 1000)
  const isDeadlinePassed = pool.deadline?.toNumber() < now
  const isTargetMet = pool.totalContributed?.gte(pool.targetAmount)
  const isOrganizer = wallet && pool.organizer?.toBase58?.() === wallet.publicKey?.toBase58()
  const progress = pool.targetAmount?.toNumber() > 0
    ? (pool.totalContributed?.toNumber() / pool.targetAmount?.toNumber()) * 100
    : 0

  const statusMap: Record<string, 'success' | 'warning' | 'error' | 'info' | 'neutral'> = {
    open: 'info',
    refunding: 'warning',
    closed: 'neutral',
  }

  const handleShare = async () => {
    const addr = pool.address?.toBase58?.() || pool.address
    if (!addr) return
    
    const url = `${window.location.origin}?pool=${addr}`
    
    try {
      await navigator.clipboard.writeText(url)
      toast({ type: 'success', message: 'Link copied to clipboard!' })
    } catch (e) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea')
      textArea.value = url
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      toast({ type: 'success', message: 'Link copied to clipboard!' })
    }
  }

  const handleContribute = async (amountSol: number) => {
    if (!program || !wallet) {
      toast({ type: 'error', message: 'Connect your wallet first' })
      return
    }
    setTxLoading('contribute')
    try {
      const poolPk = pool.address
      const vault = deriveVaultPda(poolPk)
      const contribution = deriveContributionPda(poolPk, wallet.publicKey)
      await program.methods
        .contribute(solToLamports(amountSol))
        .accounts({ contributor: wallet.publicKey, pool: poolPk, vault, contribution, systemProgram: PublicKey.default })
        .rpc()
      toast({ type: 'success', message: `Contributed ${amountSol} SOL` })
    } catch (e: any) {
      toast({ type: 'error', message: 'Contribution failed', description: e?.message?.slice(0, 80) })
    } finally {
      setTxLoading(null)
    }
  }

  const handleFinalize = async () => {
    if (!program || !wallet) return
    setTxLoading('finalize')
    try {
      const poolPk = pool.address
      const vault = deriveVaultPda(poolPk)
      const receiver = pool.receiver || wallet.publicKey
      await program.methods
        .finalizePool()
        .accounts({ organizer: wallet.publicKey, pool: poolPk, vault, receiver, systemProgram: PublicKey.default })
        .rpc()
      toast({ type: 'success', message: 'Pool finalized', description: 'Funds released to receiver' })
    } catch (e: any) {
      toast({ type: 'error', message: 'Finalize failed', description: e?.message?.slice(0, 80) })
    } finally {
      setTxLoading(null)
    }
  }

  const handleRefund = async () => {
    if (!program || !wallet) return
    setTxLoading('refund')
    try {
      const poolPk = pool.address
      const vault = deriveVaultPda(poolPk)
      const contribution = deriveContributionPda(poolPk, wallet.publicKey)
      await program.methods
        .refundContribution()
        .accounts({ contributor: wallet.publicKey, pool: poolPk, vault, contribution, systemProgram: PublicKey.default })
        .rpc()
      toast({ type: 'success', message: 'Refund claimed' })
    } catch (e: any) {
      toast({ type: 'error', message: 'Refund failed', description: e?.message?.slice(0, 80) })
    } finally {
      setTxLoading(null)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] as const }}
      style={{ maxWidth: 640, margin: '0 auto' }}
    >
      <button
        onClick={onBack}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          color: 'var(--text-muted)',
          fontSize: 'var(--text-sm)',
          fontWeight: 500,
          marginBottom: 20,
          cursor: 'pointer',
          background: 'none',
          border: 'none',
          transition: 'color 0.2s',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text)')}
        onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
      >
        <ArrowLeft size={16} /> Back to pools
      </button>

      <Card style={{ overflow: 'hidden' }}>
        {/* Header */}
        <div style={{ padding: 'var(--space-6)', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, flexWrap: 'wrap', gap: 8 }}>
            <h2 style={{ fontSize: 'var(--text-2xl)', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '60%' }}>
              {pool.name || 'Unnamed Pool'}
            </h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <button
                onClick={handleShare}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '6px 12px',
                  borderRadius: 'var(--r-sm)',
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid var(--border)',
                  color: 'var(--text)',
                  fontSize: 'var(--text-xs)',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--accent)'
                  e.currentTarget.style.color = 'var(--accent)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border)'
                  e.currentTarget.style.color = 'var(--text)'
                }}
              >
                <Share2 size={12} />
                Share
              </button>
              <Badge type={statusMap[status] || 'neutral'} size="md">
                {status}
              </Badge>
            </div>
          </div>
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', wordBreak: 'break-all' }}>
            {pool.address?.toBase58?.() || pool.address}
          </div>
        </div>

        {/* Stats */}
        <div style={{ padding: 'var(--space-6)', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 'var(--space-5)', borderBottom: '1px solid var(--border)' }}>
          <Stat label="Target" value={lamportsToSol(pool.targetAmount)} suffix="SOL" icon={<Target size={14} />} delay={0} />
          <Stat label="Raised" value={lamportsToSol(pool.totalContributed)} suffix="SOL" color={isTargetMet ? 'var(--success)' : undefined} icon={<Users size={14} />} delay={1} />
          <Stat label="Deadline" value={isDeadlinePassed ? 'Expired' : (() => {
              const deadlineNum = pool.deadline?.toNumber?.() ?? Number(pool.deadline) ?? 0
              return new Date(deadlineNum * 1000).toLocaleString('pl-PL', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })
            })()} icon={<Clock size={14} />} delay={2} />
          <Stat label="Progress" value={Math.round(Math.min(100, progress))} suffix="%" color={isTargetMet ? 'var(--success)' : undefined} icon={<Wallet size={14} />} delay={3} />
        </div>

        {/* Progress */}
        <div style={{ padding: '0 var(--space-6) var(--space-6)', borderBottom: '1px solid var(--border)' }}>
          <div style={{ marginTop: 8 }}>
            <Progress value={pool.totalContributed?.toNumber()} max={pool.targetAmount?.toNumber()} color={isTargetMet ? 'var(--success)' : 'var(--accent)'} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10, fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
            <span>{Math.round(Math.min(100, progress))}% complete</span>
            <span>{lamportsToSol(Math.max(0, pool.targetAmount?.toNumber() - pool.totalContributed?.toNumber()))} SOL left</span>
          </div>
        </div>

        {/* Actions */}
        <div style={{ padding: 'var(--space-6)', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <AnimatePresence mode="wait">
            {status === 'open' && (
              <motion.div
                key="open-actions"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] as const }}
                style={{ overflow: 'hidden' }}
              >
                <div style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>
                  Contribute
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {[0.1, 0.5, 1, 2].map((amt) => (
                    <Button
                      key={amt}
                      variant="secondary"
                      size="md"
                      onClick={() => handleContribute(amt)}
                      loading={txLoading === 'contribute'}
                      disabled={txLoading === 'contribute'}
                    >
                      + {amt} SOL
                    </Button>
                  ))}
                </div>

                {isOrganizer && isTargetMet && (
                  <div style={{ marginTop: 16 }}>
                    <Button
                      variant="success"
                      size="lg"
                      onClick={handleFinalize}
                      loading={txLoading === 'finalize'}
                      disabled={txLoading === 'finalize'}
                      fullWidth
                      icon={<CheckCircle size={16} />}
                    >
                      Finalize Pool & Release Funds
                    </Button>
                  </div>
                )}

                {isDeadlinePassed && !isTargetMet && (
                  <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 8, padding: '12px', borderRadius: 'var(--r-sm)', background: 'var(--warning-bg)', border: '1px solid var(--warning-border)', color: 'var(--warning)', fontSize: 'var(--text-sm)' }}>
                    <AlertTriangle size={16} />
                    Deadline passed. Target not met. Refunds available.
                  </div>
                )}
              </motion.div>
            )}

            {status === 'refunding' && (
              <motion.div
                key="refund-action"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                style={{ overflow: 'hidden' }}
              >
                <Button
                  variant="warning"
                  size="lg"
                  onClick={handleRefund}
                  loading={txLoading === 'refund'}
                  disabled={txLoading === 'refund'}
                  fullWidth
                  icon={<AlertTriangle size={16} />}
                >
                  Claim Refund
                </Button>
              </motion.div>
            )}

            {status === 'closed' && (
              <motion.div
                key="closed"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                style={{ textAlign: 'center', padding: 'var(--space-4)', color: 'var(--text-muted)', fontSize: 'var(--text-sm)', fontWeight: 500 }}
              >
                Pool is closed.
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </Card>
    </motion.div>
  )
}
