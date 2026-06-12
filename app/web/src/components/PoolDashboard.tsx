import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Plus, ChevronRight, Clock, Target, Users, Loader2 } from 'lucide-react'
import { PublicKey } from '@solana/web3.js'
import { useProgram, derivePoolPda, deriveVaultPda, deriveContributionPda, solToLamports, lamportsToSol } from '../hooks/useProgram'
import { BN } from '@coral-xyz/anchor'

export function PoolDashboard() {
  const { program, wallet } = useProgram()
  const [tab, setTab] = useState<'find' | 'create'>('find')
  const [poolAddress, setPoolAddress] = useState('')
  const [poolData, setPoolData] = useState<any | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [txLoading, setTxLoading] = useState<string | null>(null)
  const [txSuccess, setTxSuccess] = useState('')

  // Create form
  const [seed, setSeed] = useState('1')
  const [name, setName] = useState('')
  const [target, setTarget] = useState('1')
  const [deadlineHours, setDeadlineHours] = useState('24')

  const handleFind = async () => {
    if (!program) { setError('Connect wallet first'); return }
    setLoading(true); setError(''); setPoolData(null); setTxSuccess('')
    try {
      const pubkey = new PublicKey(poolAddress.trim())
      const data = await program.account.poolAccount.fetch(pubkey)
      setPoolData({ address: pubkey, ...data })
    } catch (e) {
      setError('Pool not found or invalid address')
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async () => {
    if (!program || !wallet) { setError('Connect wallet first'); return }
    setTxLoading('create'); setError(''); setTxSuccess('')
    try {
      const seedBn = new BN(seed)
      const targetBn = solToLamports(Number(target))
      const deadline = new BN(Math.floor(Date.now() / 1000) + Number(deadlineHours) * 3600)
      const pool = derivePoolPda(wallet.publicKey, seedBn)
      const vault = deriveVaultPda(pool)
      await program.methods
        .createPool(seedBn, name, targetBn, deadline)
        .accounts({ organizer: wallet.publicKey, pool, vault, systemProgram: PublicKey.default })
        .rpc()
      setTxSuccess(`Pool created. Address: ${pool.toBase58()}`)
      setPoolAddress(pool.toBase58())
      setTab('find')
      await handleFindForPool(pool)
    } catch (e: any) {
      setError(e?.message || 'Transaction failed')
    } finally {
      setTxLoading(null)
    }
  }

  const handleFindForPool = async (pool: PublicKey) => {
    if (!program) return
    try {
      const data = await program.account.poolAccount.fetch(pool)
      setPoolData({ address: pool, ...data })
    } catch {}
  }

  const handleContribute = async (amountSol: number) => {
    if (!program || !wallet || !poolData) return
    setTxLoading('contribute'); setError(''); setTxSuccess('')
    try {
      const pool = poolData.address
      const vault = deriveVaultPda(pool)
      const contribution = deriveContributionPda(pool, wallet.publicKey)
      await program.methods
        .contribute(solToLamports(amountSol))
        .accounts({ contributor: wallet.publicKey, pool, vault, contribution, systemProgram: PublicKey.default })
        .rpc()
      setTxSuccess(`Contributed ${amountSol} SOL.`)
      await handleFindForPool(pool)
    } catch (e: any) {
      setError(e?.message || 'Contribution failed')
    } finally {
      setTxLoading(null)
    }
  }

  const handleFinalize = async () => {
    if (!program || !wallet || !poolData) return
    setTxLoading('finalize'); setError(''); setTxSuccess('')
    try {
      const pool = poolData.address
      const vault = deriveVaultPda(pool)
      const receiver = poolData.receiver || wallet.publicKey
      await program.methods
        .finalizePool()
        .accounts({ organizer: wallet.publicKey, pool, vault, receiver, systemProgram: PublicKey.default })
        .rpc()
      setTxSuccess('Pool finalized. Funds released.')
      await handleFindForPool(pool)
    } catch (e: any) {
      setError(e?.message || 'Finalize failed')
    } finally {
      setTxLoading(null)
    }
  }

  const handleRefund = async () => {
    if (!program || !wallet || !poolData) return
    setTxLoading('refund'); setError(''); setTxSuccess('')
    try {
      const pool = poolData.address
      const vault = deriveVaultPda(pool)
      const contribution = deriveContributionPda(pool, wallet.publicKey)
      await program.methods
        .refundContribution()
        .accounts({ contributor: wallet.publicKey, pool, vault, contribution, systemProgram: PublicKey.default })
        .rpc()
      setTxSuccess('Refund claimed.')
      await handleFindForPool(pool)
    } catch (e: any) {
      setError(e?.message || 'Refund failed')
    } finally {
      setTxLoading(null)
    }
  }

  const isOrganizer = wallet && poolData && poolData.organizer?.toBase58() === wallet.publicKey?.toBase58()
  const now = Math.floor(Date.now() / 1000)
  const isDeadlinePassed = poolData ? poolData.deadline?.toNumber() < now : false
  const isTargetMet = poolData ? poolData.totalContributed?.gte(poolData.targetAmount) : false
  const status = poolData?.status ? Object.keys(poolData.status)[0] : 'unknown'

  return (
    <div style={{ maxWidth: 640, margin: '0 auto', padding: '24px' }}>
      {/* Tabs */}
      <div
        style={{
          display: 'flex',
          gap: 8,
          marginBottom: 24,
          padding: 4,
          borderRadius: 10,
          background: 'var(--surface)',
          border: '1px solid var(--border)',
        }}
      >
        <button
          onClick={() => setTab('find')}
          style={{
            flex: 1,
            padding: '10px',
            borderRadius: 8,
            fontSize: 14,
            fontWeight: 500,
            background: tab === 'find' ? 'var(--surface-raised)' : 'transparent',
            border: tab === 'find' ? '1px solid var(--border-strong)' : '1px solid transparent',
            color: tab === 'find' ? 'var(--text)' : 'var(--text-muted)',
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
        >
          <Search size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 6 }} />
          Find Pool
        </button>
        <button
          onClick={() => setTab('create')}
          style={{
            flex: 1,
            padding: '10px',
            borderRadius: 8,
            fontSize: 14,
            fontWeight: 500,
            background: tab === 'create' ? 'var(--surface-raised)' : 'transparent',
            border: tab === 'create' ? '1px solid var(--border-strong)' : '1px solid transparent',
            color: tab === 'create' ? 'var(--text)' : 'var(--text-muted)',
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
        >
          <Plus size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 6 }} />
          Create Pool
        </button>
      </div>

      <AnimatePresence mode="wait">
        {tab === 'find' ? (
          <motion.div
            key="find"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          >
            <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
              <input
                value={poolAddress}
                onChange={(e) => setPoolAddress(e.target.value)}
                placeholder="Pool address..."
                style={{
                  flex: 1,
                  padding: '12px 16px',
                  borderRadius: 10,
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  fontSize: 14,
                  color: 'var(--text)',
                  outline: 'none',
                }}
              />
              <button
                onClick={handleFind}
                disabled={loading || !poolAddress}
                style={{
                  padding: '12px 20px',
                  borderRadius: 10,
                  background: 'var(--accent)',
                  color: '#0a0a0f',
                  fontSize: 14,
                  fontWeight: 600,
                  border: 'none',
                  cursor: loading ? 'wait' : 'pointer',
                  opacity: loading ? 0.6 : 1,
                  transition: 'transform 0.15s',
                }}
                onMouseDown={(e) => !loading && (e.currentTarget.style.transform = 'scale(0.96)')}
                onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
              >
                {loading ? <Loader2 size={16} className="spin" /> : <ChevronRight size={16} />}
              </button>
            </div>

            {/* Pool Detail */}
            {poolData && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                style={{
                  borderRadius: 16,
                  border: '1px solid var(--border)',
                  background: 'var(--surface)',
                  overflow: 'hidden',
                }}
              >
                {/* Header */}
                <div style={{ padding: '24px', borderBottom: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <h3 style={{ fontSize: 20, fontWeight: 600 }}>{poolData.name || 'Unnamed Pool'}</h3>
                    <span
                      style={{
                        padding: '4px 10px',
                        borderRadius: 6,
                        fontSize: 12,
                        fontWeight: 600,
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        background: status === 'open' ? 'rgba(34,197,94,0.12)' : status === 'refunding' ? 'rgba(245,158,11,0.12)' : 'rgba(239,68,68,0.12)',
                        color: status === 'open' ? 'var(--success)' : status === 'refunding' ? 'var(--warning)' : 'var(--error)',
                      }}
                    >
                      {status}
                    </span>
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                    {poolData.address?.toBase58?.() || poolData.address}
                  </div>
                </div>

                {/* Stats */}
                <div style={{ padding: '24px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, borderBottom: '1px solid var(--border)' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      <Target size={12} /> Target
                    </div>
                    <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em' }}>
                      {lamportsToSol(poolData.targetAmount)} <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-muted)' }}>SOL</span>
                    </div>
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      <Users size={12} /> Raised
                    </div>
                    <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em', color: isTargetMet ? 'var(--success)' : 'var(--text)' }}>
                      {lamportsToSol(poolData.totalContributed)} <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-muted)' }}>SOL</span>
                    </div>
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      <Clock size={12} /> Deadline
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 500, color: isDeadlinePassed ? 'var(--error)' : 'var(--text-secondary)' }}>
                      {isDeadlinePassed ? 'Passed' : (() => {
                        const deadlineNum = poolData.deadline?.toNumber?.() ?? Number(poolData.deadline) ?? 0
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
                  <div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Progress</div>
                    <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-secondary)' }}>
                      {Math.min(100, Math.round((poolData.totalContributed?.toNumber() / poolData.targetAmount?.toNumber()) * 100))}%
                    </div>
                  </div>
                </div>

                {/* Progress Bar */}
                <div style={{ padding: '0 24px 24px', borderBottom: '1px solid var(--border)' }}>
                  <div
                    style={{
                      height: 6,
                      borderRadius: 3,
                      background: 'var(--surface-raised)',
                      overflow: 'hidden',
                      marginTop: 8,
                    }}
                  >
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(100, (poolData.totalContributed?.toNumber() / poolData.targetAmount?.toNumber()) * 100)}%` }}
                      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                      style={{
                        height: '100%',
                        borderRadius: 3,
                        background: isTargetMet ? 'var(--success)' : 'var(--accent)',
                      }}
                    />
                  </div>
                </div>

                {/* Actions */}
                <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {status === 'open' && (
                    <>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button
                          onClick={() => handleContribute(0.1)}
                          disabled={txLoading === 'contribute'}
                          style={{
                            flex: 1,
                            padding: '12px',
                            borderRadius: 10,
                            background: 'var(--surface-raised)',
                            border: '1px solid var(--border)',
                            color: 'var(--text)',
                            fontSize: 14,
                            fontWeight: 600,
                            cursor: 'pointer',
                            transition: 'transform 0.15s',
                          }}
                          onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.96)')}
                          onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                        >
                          {txLoading === 'contribute' ? <Loader2 size={14} className="spin" /> : '+ 0.1 SOL'}
                        </button>
                        <button
                          onClick={() => handleContribute(0.5)}
                          disabled={txLoading === 'contribute'}
                          style={{
                            flex: 1,
                            padding: '12px',
                            borderRadius: 10,
                            background: 'var(--surface-raised)',
                            border: '1px solid var(--border)',
                            color: 'var(--text)',
                            fontSize: 14,
                            fontWeight: 600,
                            cursor: 'pointer',
                            transition: 'transform 0.15s',
                          }}
                          onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.96)')}
                          onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                        >
                          {txLoading === 'contribute' ? <Loader2 size={14} className="spin" /> : '+ 0.5 SOL'}
                        </button>
                        <button
                          onClick={() => handleContribute(1)}
                          disabled={txLoading === 'contribute'}
                          style={{
                            flex: 1,
                            padding: '12px',
                            borderRadius: 10,
                            background: 'var(--surface-raised)',
                            border: '1px solid var(--border)',
                            color: 'var(--text)',
                            fontSize: 14,
                            fontWeight: 600,
                            cursor: 'pointer',
                            transition: 'transform 0.15s',
                          }}
                          onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.96)')}
                          onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                        >
                          {txLoading === 'contribute' ? <Loader2 size={14} className="spin" /> : '+ 1 SOL'}
                        </button>
                      </div>
                      {isOrganizer && isTargetMet && (
                        <button
                          onClick={handleFinalize}
                          disabled={txLoading === 'finalize'}
                          style={{
                            padding: '14px',
                            borderRadius: 10,
                            background: 'var(--success)',
                            color: '#0a0a0f',
                            fontSize: 14,
                            fontWeight: 700,
                            border: 'none',
                            cursor: 'pointer',
                            transition: 'transform 0.15s',
                          }}
                          onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.96)')}
                          onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                        >
                          {txLoading === 'finalize' ? <Loader2 size={16} className="spin" /> : 'Finalize Pool & Release Funds'}
                        </button>
                      )}
                    </>
                  )}

                  {status === 'refunding' && (
                    <button
                      onClick={handleRefund}
                      disabled={txLoading === 'refund'}
                      style={{
                        padding: '14px',
                        borderRadius: 10,
                        background: 'var(--warning)',
                        color: '#0a0a0f',
                        fontSize: 14,
                        fontWeight: 700,
                        border: 'none',
                        cursor: 'pointer',
                        transition: 'transform 0.15s',
                      }}
                      onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.96)')}
                      onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                    >
                      {txLoading === 'refund' ? <Loader2 size={16} className="spin" /> : 'Claim Refund'}
                    </button>
                  )}
                </div>
              </motion.div>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="create"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            style={{
              borderRadius: 16,
              border: '1px solid var(--border)',
              background: 'var(--surface)',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
            }}
          >
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Pool Name</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Birthday Gift for Alice"
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: 10,
                  background: 'var(--bg)',
                  border: '1px solid var(--border)',
                  fontSize: 14,
                  outline: 'none',
                }}
              />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Seed</label>
                <input
                  value={seed}
                  onChange={(e) => setSeed(e.target.value)}
                  type="number"
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: 10,
                    background: 'var(--bg)',
                    border: '1px solid var(--border)',
                    fontSize: 14,
                    outline: 'none',
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Target (SOL)</label>
                <input
                  value={target}
                  onChange={(e) => setTarget(e.target.value)}
                  type="number"
                  step="0.1"
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: 10,
                    background: 'var(--bg)',
                    border: '1px solid var(--border)',
                    fontSize: 14,
                    outline: 'none',
                  }}
                />
              </div>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Deadline (hours)</label>
              <input
                value={deadlineHours}
                onChange={(e) => setDeadlineHours(e.target.value)}
                type="number"
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: 10,
                  background: 'var(--bg)',
                  border: '1px solid var(--border)',
                  fontSize: 14,
                  outline: 'none',
                }}
              />
            </div>
            <button
              onClick={handleCreate}
              disabled={txLoading === 'create' || !name}
              style={{
                marginTop: 8,
                padding: '14px',
                borderRadius: 10,
                background: 'var(--accent)',
                color: '#0a0a0f',
                fontSize: 14,
                fontWeight: 700,
                border: 'none',
                cursor: 'pointer',
                transition: 'transform 0.15s',
                opacity: !name ? 0.5 : 1,
              }}
              onMouseDown={(e) => name && (e.currentTarget.style.transform = 'scale(0.96)')}
              onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
            >
              {txLoading === 'create' ? <Loader2 size={16} className="spin" style={{ display: 'inline', verticalAlign: 'middle' }} /> : 'Create Pool'}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error / Success */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            style={{
              marginTop: 16,
              padding: '12px 16px',
              borderRadius: 10,
              background: 'rgba(239,68,68,0.1)',
              border: '1px solid rgba(239,68,68,0.3)',
              color: 'var(--error)',
              fontSize: 13,
            }}
          >
            {error}
          </motion.div>
        )}
        {txSuccess && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            style={{
              marginTop: 16,
              padding: '12px 16px',
              borderRadius: 10,
              background: 'rgba(34,197,94,0.1)',
              border: '1px solid rgba(34,197,94,0.3)',
              color: 'var(--success)',
              fontSize: 13,
            }}
          >
            {txSuccess}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
