import { useState } from 'react'
import { motion } from 'framer-motion'
import { Plus, ArrowRight, RefreshCw } from 'lucide-react'
import { useProgram, derivePoolPda, deriveVaultPda, solToLamports, explorerTxUrl } from '../hooks/useProgram'
import { useToast } from './ui/Toast'
import { Button } from './ui/Button'
import { Input } from './ui/Input'
import { Card } from './ui/Card'
import { BN } from '@coral-xyz/anchor'
import { PublicKey } from '@solana/web3.js'
import { validateCreatePoolDraft } from '../lib/pools'
import type { PoolView } from '../types/pool'

interface PoolCreateProps {
  onCreated: (pool: PoolView) => void
}

export function PoolCreate({ onCreated }: PoolCreateProps) {
  const { program, wallet, fetchPool } = useProgram()
  const { toast } = useToast()
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)

  const [seed, setSeed] = useState(() => String(Date.now()))
  const [name, setName] = useState('')
  const [receiver, setReceiver] = useState('')
  const [target, setTarget] = useState('1')
  const [deadlineHours, setDeadlineHours] = useState('24')

  const receiverValue = receiver.trim()
  const validation = validateCreatePoolDraft({
    name,
    seed,
    targetSol: target,
    deadlineHours,
    receiver,
  })
  const errors = validation.errors

  const regenerateSeed = () => setSeed(String(Date.now()))

  const steps = [
    {
      title: 'Name your pool',
      desc: 'What are you collecting for?',
      fields: (
        <Input
          label="Pool Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Birthday Gift for Alice"
          fullWidth
          error={name.length > 0 ? errors.name : undefined}
        />
      ),
      canNext: !errors.name,
    },
    {
      title: 'Set the goal',
      desc: 'How much SOL do you need?',
      fields: (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div>
            <Input
              label="Seed"
              value={seed}
              onChange={(e) => setSeed(e.target.value)}
              type="number"
              min={1}
              error={errors.seed}
            />
            <button
              type="button"
              onClick={regenerateSeed}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                marginTop: 8,
                color: 'var(--text-muted)',
                fontSize: 'var(--text-xs)',
                fontWeight: 800,
              }}
            >
              <RefreshCw size={12} /> New seed
            </button>
          </div>
          <Input
            label="Target (SOL)"
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            type="number"
            step="0.1"
            min="0.1"
            error={errors.targetSol}
          />
        </div>
      ),
      canNext: !errors.seed && !errors.targetSol,
    },
    {
      title: 'Choose receiver',
      desc: 'Who receives funds after the target is met?',
      fields: (
        <Input
          label="Receiver wallet"
          value={receiver}
          onChange={(e) => setReceiver(e.target.value)}
          placeholder={wallet?.publicKey?.toBase58() || 'Defaults to your wallet'}
          fullWidth
          error={receiverValue ? errors.receiver : undefined}
        />
      ),
      canNext: !errors.receiver,
    },
    {
      title: 'Set a deadline',
      desc: 'When does the pool close?',
      fields: (
        <Input
          label="Deadline (hours)"
          value={deadlineHours}
          onChange={(e) => setDeadlineHours(e.target.value)}
          type="number"
          min={1}
          error={errors.deadlineHours}
        />
      ),
      canNext: !errors.deadlineHours,
    },
    {
      title: 'Ready to create',
      desc: 'Review and confirm.',
      fields: (
        <div
          style={{
            borderRadius: 'var(--r-md)',
            border: '1px solid var(--border)',
            background: 'var(--bg)',
            padding: 'var(--space-4)',
          }}
        >
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 24px', fontSize: 'var(--text-sm)' }}>
            <div>
              <div style={{ color: 'var(--text-muted)', fontSize: 'var(--text-xs)', marginBottom: 2, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Name</div>
              <div style={{ fontWeight: 600 }}>{name}</div>
            </div>
            <div>
              <div style={{ color: 'var(--text-muted)', fontSize: 'var(--text-xs)', marginBottom: 2, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Target</div>
              <div style={{ fontWeight: 600 }}>{target} SOL</div>
            </div>
            <div>
              <div style={{ color: 'var(--text-muted)', fontSize: 'var(--text-xs)', marginBottom: 2, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Seed</div>
              <div style={{ fontWeight: 600 }}>{seed}</div>
            </div>
            <div>
              <div style={{ color: 'var(--text-muted)', fontSize: 'var(--text-xs)', marginBottom: 2, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Receiver</div>
              <div style={{ fontWeight: 600, overflowWrap: 'anywhere' }}>{receiverValue || wallet?.publicKey?.toBase58() || 'Your wallet'}</div>
            </div>
            <div>
              <div style={{ color: 'var(--text-muted)', fontSize: 'var(--text-xs)', marginBottom: 2, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Deadline</div>
              <div style={{ fontWeight: 600 }}>{deadlineHours} hours</div>
            </div>
          </div>
        </div>
      ),
      canNext: validation.canSubmit,
    },
  ]

  const current = steps[step]

  const handleCreate = async () => {
    if (!program || !wallet) {
      toast({ type: 'error', message: 'Connect your wallet first' })
      return
    }
    if (!validation.canSubmit) {
      toast({ type: 'error', message: 'Fix the highlighted fields first' })
      return
    }
    setLoading(true)
    try {
      const seedBn = new BN(seed)
      const targetBn = solToLamports(Number(target))
      const deadline = new BN(Math.floor(Date.now() / 1000) + Number(deadlineHours) * 3600)
      const receiverPk = receiverValue ? new PublicKey(receiverValue) : wallet.publicKey
      const pool = derivePoolPda(wallet.publicKey, seedBn)
      const vault = deriveVaultPda(pool)
      const signature = await program.methods
        .createPool(seedBn, name, targetBn, deadline, receiverPk)
        .accounts({ organizer: wallet.publicKey, pool, vault, systemProgram: PublicKey.default })
        .rpc()
      toast({
        type: 'success',
        message: 'Pool created!',
        description: pool.toBase58(),
        actionLabel: 'View on Explorer',
        actionHref: explorerTxUrl(signature),
      })
      const fetched = await fetchPool(pool)
      onCreated(fetched ?? { address: pool, name, targetAmount: targetBn, totalContributed: new BN(0), deadline, status: { open: {} }, organizer: wallet.publicKey, receiver: receiverPk, seed: seedBn })
    } catch (error) {
      toast({ type: 'error', message: 'Failed to create pool', description: error instanceof Error ? error.message.slice(0, 80) : undefined })
    } finally {
      setLoading(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] as const }}
      style={{ maxWidth: 560, margin: '0 auto' }}
    >
      <Card>
        {/* Step indicator */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 24 }}>
          {steps.map((_, i) => (
            <div
              key={i}
              style={{
                flex: 1,
                height: 3,
                borderRadius: 'var(--r-full)',
                background: i <= step ? 'var(--accent)' : 'var(--border)',
                transition: 'background 0.3s',
              }}
            />
          ))}
        </div>

        <div style={{ marginBottom: 8 }}>
          <h3 style={{ fontSize: 'var(--text-xl)', fontWeight: 700, marginBottom: 4 }}>{current.title}</h3>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>{current.desc}</p>
        </div>

        <div style={{ margin: '24px 0' }}>{current.fields}</div>

        <div style={{ display: 'flex', gap: 12, justifyContent: 'space-between' }}>
          <Button variant="ghost" onClick={() => setStep(Math.max(0, step - 1))} disabled={step === 0}>
            Back
          </Button>
          {step < steps.length - 1 ? (
            <Button
              variant="primary"
              onClick={() => setStep(step + 1)}
              disabled={!current.canNext}
              icon={<ArrowRight size={16} />}
            >
              Next
            </Button>
          ) : (
            <Button variant="primary" onClick={handleCreate} loading={loading} disabled={!validation.canSubmit} icon={<Plus size={16} />}>
              Create Pool
            </Button>
          )}
        </div>
      </Card>
    </motion.div>
  )
}
