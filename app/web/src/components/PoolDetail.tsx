import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Clock, Target, Users, Wallet, CheckCircle, AlertTriangle, Share2, ExternalLink, Info, RefreshCw, ListChecks, Vote, Split } from 'lucide-react'
import { useProgram, deriveVaultPda, deriveContributionPda, solToLamports, lamportsToSol, explorerTxUrl } from '../hooks/useProgram'
import { useToast } from './ui/Toast'
import { Button } from './ui/Button'
import { Card } from './ui/Card'
import { Badge } from './ui/Badge'
import { Progress } from './ui/Progress'
import { Stat } from './ui/Stat'
import { PublicKey } from '@solana/web3.js'
import {
  getPoolActionState,
  getContributionGuidance,
  getPoolPhase,
  numericValueToNumber,
  publicKeyToString,
} from '../lib/pools'
import type { PoolView } from '../types/pool'

interface PoolDetailProps {
  pool: PoolView
  onBack: () => void
  onUpdated: (pool: PoolView) => void
}

export function PoolDetail({ pool, onBack, onUpdated }: PoolDetailProps) {
  const { program, wallet, fetchPool } = useProgram()
  const { toast } = useToast()
  const [txLoading, setTxLoading] = useState<string | null>(null)

  const phase = getPoolPhase(pool)
  const actions = getPoolActionState(pool, wallet?.publicKey)
  const poolAddress = publicKeyToString(pool.address)
  const poolPublicKey = new PublicKey(poolAddress)
  const target = numericValueToNumber(pool.targetAmount)
  const total = numericValueToNumber(pool.totalContributed)
  const progress = target > 0 ? (total / target) * 100 : 0
  const { isOrganizer, canContribute, canFinalize, canRefund } = actions
  const contributionGuidance = getContributionGuidance()
  const deadlineLabel = phase.deadlinePassed
    ? phase.label
    : new Date(numericValueToNumber(pool.deadline) * 1000).toLocaleString('pl-PL', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })

  const refreshPool = async () => {
    const updated = await fetchPool(poolPublicKey)
    if (updated) onUpdated(updated)
  }

  const handleShare = async () => {
    const addr = poolAddress
    if (!addr) return
    
    const url = `${window.location.origin}?pool=${addr}`
    
    try {
      await navigator.clipboard.writeText(url)
      toast({ type: 'success', message: 'Link copied to clipboard!' })
    } catch {
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
      const vault = deriveVaultPda(poolPublicKey)
      const contribution = deriveContributionPda(poolPublicKey, wallet.publicKey)
      const signature = await program.methods
        .contribute(solToLamports(amountSol), 0) // candidate_index = 0 (default)
        .accounts({ contributor: wallet.publicKey, pool: poolPublicKey, vault, contribution, systemProgram: PublicKey.default })
        .rpc()
      await refreshPool()
      toast({
        type: 'success',
        message: `Contributed ${amountSol} SOL`,
        actionLabel: 'View on Explorer',
        actionHref: explorerTxUrl(signature),
      })
    } catch (error) {
      toast({ type: 'error', message: 'Contribution failed', description: error instanceof Error ? error.message.slice(0, 80) : undefined })
    } finally {
      setTxLoading(null)
    }
  }

  const handleFinalize = async () => {
    if (!program || !wallet) return
    setTxLoading('finalize')
    try {
      const vault = deriveVaultPda(poolPublicKey)
      const receiver = new PublicKey(publicKeyToString(pool.receiver || wallet.publicKey))
      const signature = await program.methods
        .finalizePool()
        .accounts({ organizer: wallet.publicKey, pool: poolPublicKey, vault, receiver, systemProgram: PublicKey.default })
        .rpc()
      await refreshPool()
      toast({
        type: 'success',
        message: 'Pool finalized',
        description: 'Funds released to receiver',
        actionLabel: 'View on Explorer',
        actionHref: explorerTxUrl(signature),
      })
    } catch (error) {
      toast({ type: 'error', message: 'Finalize failed', description: error instanceof Error ? error.message.slice(0, 80) : undefined })
    } finally {
      setTxLoading(null)
    }
  }

  const handleRefund = async () => {
    if (!program || !wallet) return
    setTxLoading('refund')
    try {
      const vault = deriveVaultPda(poolPublicKey)
      const contribution = deriveContributionPda(poolPublicKey, wallet.publicKey)
      const signature = await program.methods
        .refundContribution()
        .accounts({ contributor: wallet.publicKey, pool: poolPublicKey, vault, contribution, systemProgram: PublicKey.default })
        .rpc()
      await refreshPool()
      toast({
        type: 'success',
        message: 'Refund claimed',
        actionLabel: 'View on Explorer',
        actionHref: explorerTxUrl(signature),
      })
    } catch (error) {
      toast({ type: 'error', message: 'Refund failed', description: error instanceof Error ? error.message.slice(0, 80) : undefined })
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
              <Badge type={phase.badgeType} size="md">
                {phase.label}
              </Badge>
            </div>
          </div>
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', wordBreak: 'break-all' }}>
            {poolAddress}
          </div>
          <p style={{ marginTop: 10, color: 'var(--text-muted)', fontSize: 'var(--text-sm)' }}>{phase.description}</p>
          <a
            href={`https://explorer.solana.com/address/${poolAddress}?cluster=devnet`}
            target="_blank"
            rel="noreferrer"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 10, color: 'var(--accent)', fontSize: 'var(--text-xs)', fontWeight: 700, textDecoration: 'none' }}
          >
            View pool account <ExternalLink size={12} />
          </a>
        </div>

        {/* Stats */}
        <div style={{ padding: 'var(--space-6)', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 'var(--space-5)', borderBottom: '1px solid var(--border)' }}>
          <Stat label="Target" value={lamportsToSol(pool.targetAmount)} suffix="SOL" icon={<Target size={14} />} delay={0} />
          <Stat label="Raised" value={lamportsToSol(pool.totalContributed)} suffix="SOL" color={phase.targetMet ? 'var(--success)' : undefined} icon={<Users size={14} />} delay={1} />
          <Stat label="Deadline" value={deadlineLabel} icon={<Clock size={14} />} delay={2} />
          <Stat label="Progress" value={Math.round(Math.min(100, progress))} suffix="%" color={phase.targetMet ? 'var(--success)' : undefined} icon={<Wallet size={14} />} delay={3} />
        </div>

        {/* Pool Features */}
        {(pool.recurrence !== 'none' || pool.votingMode !== 'fixedReceiver' || pool.splitType !== 'equal' || (pool.milestonesCount ?? 0) > 0) && (
          <div style={{ padding: '0 var(--space-6) var(--space-4)', borderBottom: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
              {pool.recurrence && pool.recurrence !== 'none' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 'var(--r-sm)', background: 'var(--accent-bg)', border: '1px solid var(--accent-border)', fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--accent)' }}>
                  <RefreshCw size={12} />
                  {pool.recurrence === 'weekly' ? 'Weekly' : 'Monthly'}
                  {pool.maxCycles ? ` (${pool.cycleCount ?? 0}/${pool.maxCycles})` : ''}
                </div>
              )}
              {pool.votingMode === 'contributorVote' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 'var(--r-sm)', background: 'var(--info-bg)', border: '1px solid var(--info-border)', fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--info)' }}>
                  <Vote size={12} />
                  Voting mode
                </div>
              )}
              {pool.splitType && pool.splitType !== 'equal' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 'var(--r-sm)', background: 'var(--warning-bg)', border: '1px solid var(--warning-border)', fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--warning)' }}>
                  <Split size={12} />
                  Weighted split
                </div>
              )}
              {(pool.milestonesCount ?? 0) > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 'var(--r-sm)', background: 'var(--success-bg)', border: '1px solid var(--success-border)', fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--success)' }}>
                  <ListChecks size={12} />
                  {pool.milestonesReleased ?? 0}/{pool.milestonesCount} milestones
                </div>
              )}
            </div>
          </div>
        )}

        {/* Progress */}
        <div style={{ padding: '0 var(--space-6) var(--space-6)', borderBottom: '1px solid var(--border)' }}>
          <div style={{ marginTop: 8 }}>
            <Progress value={total} max={target} color={phase.targetMet ? 'var(--success)' : 'var(--accent)'} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10, fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
            <span>{Math.round(Math.min(100, progress))}% complete</span>
            <span>{lamportsToSol(Math.max(0, target - total))} SOL left</span>
          </div>
          <div style={{ marginTop: 14, padding: '12px', borderRadius: 'var(--r-sm)', background: 'var(--bg)', border: '1px solid var(--border)', fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
            <div style={{ marginBottom: 4, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Receiver</div>
            <div style={{ fontFamily: 'var(--font-mono)', overflowWrap: 'anywhere' }}>{publicKeyToString(pool.receiver)}</div>
          </div>
        </div>

        {/* Actions */}
        <div style={{ padding: 'var(--space-6)', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <AnimatePresence mode="wait">
            {phase.status === 'open' && (
              <motion.div
                key="open-actions"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] as const }}
                style={{ overflow: 'hidden' }}
              >
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '20px 1fr',
                    gap: 10,
                    marginBottom: 16,
                    padding: '14px',
                    borderRadius: 'var(--r-md)',
                    border: '1px solid var(--info-border)',
                    background: 'var(--info-bg)',
                    color: 'var(--text-secondary)',
                  }}
                >
                  <Info size={18} style={{ color: 'var(--info)', marginTop: 2 }} />
                  <div>
                    <div style={{ marginBottom: 5, color: 'var(--text)', fontSize: 'var(--text-sm)', fontWeight: 900 }}>
                      {contributionGuidance.title}
                    </div>
                    <div style={{ fontSize: 'var(--text-sm)', lineHeight: 1.55 }}>
                      {contributionGuidance.body}
                    </div>
                    <div style={{ marginTop: 8, color: 'var(--text-muted)', fontSize: 'var(--text-xs)', lineHeight: 1.5 }}>
                      {contributionGuidance.note}
                    </div>
                  </div>
                </div>
                <div style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>
                  Contribute
                </div>
                {!canContribute && (
                  <div style={{ marginBottom: 12, color: 'var(--warning)', fontSize: 'var(--text-sm)' }}>
                    Deadline passed. New contributions are closed.
                  </div>
                )}
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {[0.1, 0.5, 1, 2].map((amt) => (
                    <Button
                      key={amt}
                      variant="secondary"
                      size="md"
                      onClick={() => handleContribute(amt)}
                      loading={txLoading === 'contribute'}
                      disabled={txLoading === 'contribute' || !canContribute}
                    >
                      + {amt} SOL
                    </Button>
                  ))}
                </div>

                {canFinalize && (
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

                {phase.targetMet && !isOrganizer && (
                  <div style={{ marginTop: 16, color: 'var(--text-muted)', fontSize: 'var(--text-sm)' }}>
                    Target met. Waiting for the organizer to finalize.
                  </div>
                )}

                {canRefund && (
                  <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px', borderRadius: 'var(--r-sm)', background: 'var(--warning-bg)', border: '1px solid var(--warning-border)', color: 'var(--warning)', fontSize: 'var(--text-sm)' }}>
                      <AlertTriangle size={16} />
                      Deadline passed. Target not met. Contributors can claim refunds.
                    </div>
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
                  </div>
                )}
              </motion.div>
            )}

            {phase.id === 'refunding' && (
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

            {phase.id === 'closed' && (
              <motion.div
                key="closed"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                style={{ display: 'flex', flexDirection: 'column', gap: 12 }}
              >
                <div style={{ textAlign: 'center', padding: 'var(--space-4)', color: 'var(--text-muted)', fontSize: 'var(--text-sm)', fontWeight: 500 }}>
                  Pool is closed.
                </div>
                
                {/* Rollover button for recurring pools */}
                {isOrganizer && pool.recurrence && pool.recurrence !== 'none' && (
                  <Button
                    variant="secondary"
                    size="lg"
                    onClick={async () => {
                      if (!program || !wallet) return
                      setTxLoading('rollover')
                      try {
                        const signature = await program.methods
                          .rolloverPool()
                          .accounts({ organizer: wallet.publicKey, pool: poolPublicKey })
                          .rpc()
                        await refreshPool()
                        toast({
                          type: 'success',
                          message: 'Pool rolled over',
                          description: 'New cycle started',
                          actionLabel: 'View on Explorer',
                          actionHref: explorerTxUrl(signature),
                        })
                      } catch (error) {
                        toast({ type: 'error', message: 'Rollover failed', description: error instanceof Error ? error.message.slice(0, 80) : undefined })
                      } finally {
                        setTxLoading(null)
                      }
                    }}
                    loading={txLoading === 'rollover'}
                    disabled={txLoading === 'rollover'}
                    fullWidth
                    icon={<RefreshCw size={16} />}
                  >
                    Start Next Cycle
                  </Button>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </Card>
    </motion.div>
  )
}
