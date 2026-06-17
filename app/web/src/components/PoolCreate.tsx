import { useState } from 'react'
import { motion } from 'framer-motion'
import { Plus, ArrowRight, RefreshCw, Settings } from 'lucide-react'
import { useProgram, derivePoolPda, deriveVaultPda, solToLamports, explorerTxUrl } from '../hooks/useProgram'
import { useToast } from './ui/Toast'
import { Button } from './ui/Button'
import { Input } from './ui/Input'
import { Card } from './ui/Card'
import { Tooltip } from './ui/Tooltip'
import { BN } from '@coral-xyz/anchor'
import { PublicKey } from '@solana/web3.js'
import { validateCreatePoolDraft } from '../lib/pools'
import type { PoolView, RecurrenceType, VotingModeType, SplitTypeValue } from '../types/pool'

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
  
  // Advanced options
  const [recurrence, setRecurrence] = useState<RecurrenceType>('none')
  const [maxCycles, setMaxCycles] = useState('0')
  const [votingMode, setVotingMode] = useState<VotingModeType>('fixedReceiver')
  const [splitType, setSplitType] = useState<SplitTypeValue>('equal')

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

  const recurrenceLabel = { none: 'One-time', weekly: 'Weekly', monthly: 'Monthly' }[recurrence]
  const votingLabel = { fixedReceiver: 'Fixed receiver', contributorVote: 'Voting by contributors' }[votingMode]
  const splitLabel = { equal: 'Equal split', weighted: 'Weighted split' }[splitType]

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
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Seed</span>
              <Tooltip text="A unique number that identifies this pool. Each pool needs a different seed. Click 'New seed' to generate a random one." />
            </div>
            <Input
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
      title: 'Advanced options',
      desc: 'Configure pool behavior (optional)',
      fields: (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Recurrence */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Recurrence</span>
              <Tooltip text="Set if the pool should repeat automatically. Weekly/Monthly pools reset after closing and start a new collection cycle. Useful for regular expenses like rent or subscriptions." />
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              {(['none', 'weekly', 'monthly'] as RecurrenceType[]).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRecurrence(r)}
                  style={{
                    flex: 1,
                    padding: '10px 12px',
                    borderRadius: 'var(--r-md)',
                    border: `1px solid ${recurrence === r ? 'var(--accent)' : 'var(--border)'}`,
                    background: recurrence === r ? 'var(--accent-bg)' : 'transparent',
                    color: recurrence === r ? 'var(--accent)' : 'var(--text-secondary)',
                    fontSize: 'var(--text-sm)',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                >
                  {r === 'none' ? 'One-time' : r === 'weekly' ? 'Weekly' : 'Monthly'}
                </button>
              ))}
            </div>
            {recurrence !== 'none' && (
              <Input
                label="Max cycles (0 = unlimited)"
                value={maxCycles}
                onChange={(e) => setMaxCycles(e.target.value)}
                type="number"
                min={0}
                style={{ marginTop: 12 }}
              />
            )}
          </div>

          {/* Voting Mode */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Receiver selection</span>
              <Tooltip text="Choose how the fund receiver is determined. 'Fixed' sends funds to the address you specify. 'Voting' lets contributors vote with their contributions — the candidate with most votes receives the funds." />
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              {(['fixedReceiver', 'contributorVote'] as VotingModeType[]).map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setVotingMode(v)}
                  style={{
                    flex: 1,
                    padding: '10px 12px',
                    borderRadius: 'var(--r-md)',
                    border: `1px solid ${votingMode === v ? 'var(--accent)' : 'var(--border)'}`,
                    background: votingMode === v ? 'var(--accent-bg)' : 'transparent',
                    color: votingMode === v ? 'var(--accent)' : 'var(--text-secondary)',
                    fontSize: 'var(--text-sm)',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                >
                  {v === 'fixedReceiver' ? 'Fixed' : 'Voting'}
                </button>
              ))}
            </div>
            <p style={{ marginTop: 6, fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
              {votingMode === 'fixedReceiver' 
                ? 'Receiver is set at creation. Funds go directly to them.'
                : 'Contributors vote with their contributions. Winner gets the funds.'}
            </p>
          </div>

          {/* Split Type */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Split mode</span>
              <Tooltip text="Determine how funds are distributed among members. 'Equal' divides the amount evenly. 'Weighted' lets you assign different shares based on each member's contribution or agreement." />
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              {(['equal', 'weighted'] as SplitTypeValue[]).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSplitType(s)}
                  style={{
                    flex: 1,
                    padding: '10px 12px',
                    borderRadius: 'var(--r-md)',
                    border: `1px solid ${splitType === s ? 'var(--accent)' : 'var(--border)'}`,
                    background: splitType === s ? 'var(--accent-bg)' : 'transparent',
                    color: splitType === s ? 'var(--accent)' : 'var(--text-secondary)',
                    fontSize: 'var(--text-sm)',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                >
                  {s === 'equal' ? 'Equal' : 'Weighted'}
                </button>
              ))}
            </div>
            <p style={{ marginTop: 6, fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
              {splitType === 'equal'
                ? 'Split equally among all members.'
                : 'Assign weights to members for proportional split.'}
            </p>
          </div>
        </div>
      ),
      canNext: true,
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
            <div>
              <div style={{ color: 'var(--text-muted)', fontSize: 'var(--text-xs)', marginBottom: 2, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Recurrence</div>
              <div style={{ fontWeight: 600 }}>{recurrenceLabel}{recurrence !== 'none' && maxCycles !== '0' ? ` (${maxCycles}x)` : ''}</div>
            </div>
            <div>
              <div style={{ color: 'var(--text-muted)', fontSize: 'var(--text-xs)', marginBottom: 2, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Receiver mode</div>
              <div style={{ fontWeight: 600 }}>{votingLabel}</div>
            </div>
            <div>
              <div style={{ color: 'var(--text-muted)', fontSize: 'var(--text-xs)', marginBottom: 2, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Split</div>
              <div style={{ fontWeight: 600 }}>{splitLabel}</div>
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
      
      const recurrenceEnum = recurrence === 'none' ? { none: {} } : recurrence === 'weekly' ? { weekly: {} } : { monthly: {} }
      const votingEnum = votingMode === 'fixedReceiver' ? { fixedReceiver: {} } : { contributorVote: {} }
      const splitEnum = splitType === 'equal' ? { equal: {} } : { weighted: {} }
      
      console.log('Creating pool with enums:', { recurrence, votingMode, splitType, recurrenceEnum, votingEnum, splitEnum });
      
      const pool = derivePoolPda(wallet.publicKey, seedBn)
      const vault = deriveVaultPda(pool)
      const signature = await program.methods
        .createPool(seedBn, name, targetBn, deadline, receiverPk, recurrenceEnum, Number(maxCycles), votingEnum, splitEnum)
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
      onCreated(fetched ?? { 
        address: pool, 
        name, 
        targetAmount: targetBn, 
        totalContributed: new BN(0), 
        deadline, 
        status: { open: {} }, 
        organizer: wallet.publicKey, 
        receiver: receiverPk, 
        seed: seedBn,
        recurrence,
        maxCycles: Number(maxCycles),
        votingMode,
        splitType,
      })
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
          <h3 style={{ fontSize: 'var(--text-xl)', fontWeight: 700, marginBottom: 4 }}>
            {step === steps.length - 2 && <Settings size={18} style={{ display: 'inline', marginRight: 8, verticalAlign: 'middle' }} />}
            {current.title}
          </h3>
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
