import { useState } from 'react'
import { motion } from 'framer-motion'
import { Plus, ArrowRight } from 'lucide-react'
import { useProgram, derivePoolPda, deriveVaultPda, solToLamports } from '../hooks/useProgram'
import { useToast } from './ui/Toast'
import { Button } from './ui/Button'
import { Input } from './ui/Input'
import { Card } from './ui/Card'
import { BN } from '@coral-xyz/anchor'
import { PublicKey } from '@solana/web3.js'

interface PoolCreateProps {
  onCreated: (pool: any) => void
}

export function PoolCreate({ onCreated }: PoolCreateProps) {
  const { program, wallet } = useProgram()
  const { toast } = useToast()
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)

  const [seed, setSeed] = useState('1')
  const [name, setName] = useState('')
  const [target, setTarget] = useState('1')
  const [deadlineHours, setDeadlineHours] = useState('24')

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
          error={name.length > 0 && name.length < 3 ? 'At least 3 characters' : undefined}
        />
      ),
      canNext: name.length >= 3,
    },
    {
      title: 'Set the goal',
      desc: 'How much SOL do you need?',
      fields: (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <Input
            label="Seed"
            value={seed}
            onChange={(e) => setSeed(e.target.value)}
            type="number"
            min={1}
          />
          <Input
            label="Target (SOL)"
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            type="number"
            step="0.1"
            min="0.1"
          />
        </div>
      ),
      canNext: Number(seed) >= 1 && Number(target) >= 0.1,
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
        />
      ),
      canNext: Number(deadlineHours) >= 1,
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
              <div style={{ color: 'var(--text-muted)', fontSize: 'var(--text-xs)', marginBottom: 2, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Deadline</div>
              <div style={{ fontWeight: 600 }}>{deadlineHours} hours</div>
            </div>
          </div>
        </div>
      ),
      canNext: true,
    },
  ]

  const current = steps[step]

  const handleCreate = async () => {
    if (!program || !wallet) {
      toast({ type: 'error', message: 'Connect your wallet first' })
      return
    }
    setLoading(true)
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
      toast({ type: 'success', message: 'Pool created!', description: pool.toBase58() })
      onCreated({ address: pool, name, targetAmount: targetBn, totalContributed: new BN(0), deadline, status: { open: {} }, organizer: wallet.publicKey })
    } catch (e: any) {
      toast({ type: 'error', message: 'Failed to create pool', description: e?.message?.slice(0, 80) })
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
            <Button variant="primary" onClick={handleCreate} loading={loading} icon={<Plus size={16} />}>
              Create Pool
            </Button>
          )}
        </div>
      </Card>
    </motion.div>
  )
}
