import { PublicKey } from '@solana/web3.js'
import type { NumericValue, PoolFilterStatus, PoolPhase, PoolStatusName, PoolView, PublicKeyLike } from '../types/pool'

interface FilterOptions {
  query: string
  status: PoolFilterStatus
  nowSeconds?: number
}

interface CreatePoolDraft {
  name: string
  seed: string
  targetSol: string
  deadlineHours: string
  receiver: string
}

interface CreatePoolValidation {
  canSubmit: boolean
  errors: Partial<Record<keyof CreatePoolDraft, string>>
}

export function getContributionGuidance() {
  return {
    title: 'Where to send SOL',
    body:
      'Use the contribution buttons below. Do not manually send SOL to the pool account or receiver address; the app routes your payment through the GiftPool program vault.',
    note: 'Pool account is for inspection. Receiver gets paid only after finalization.',
  }
}

export function numericValueToNumber(value: NumericValue | null | undefined): number {
  if (value == null) return 0
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0
  if (typeof value === 'bigint') return Number(value)
  if (typeof value === 'string') return Number(value)
  if ('toNumber' in value) return value.toNumber()
  return Number(value.toString())
}

export function publicKeyToString(value: PublicKeyLike | null | undefined): string {
  if (!value) return ''
  return typeof value === 'string' ? value : value.toBase58()
}

export function poolStatusName(status: PoolView['status']): PoolStatusName {
  if (!status) return 'unknown'
  if (typeof status === 'string') return normalizeStatusName(status)
  const [firstKey] = Object.keys(status)
  return normalizeStatusName(firstKey)
}

export function getPoolPhase(pool: PoolView, nowSeconds = Math.floor(Date.now() / 1000)): PoolPhase {
  const status = poolStatusName(pool.status)
  const total = numericValueToNumber(pool.totalContributed)
  const target = numericValueToNumber(pool.targetAmount)
  const deadline = numericValueToNumber(pool.deadline)
  const targetMet = target > 0 && total >= target
  const deadlinePassed = deadline <= nowSeconds

  if (status === 'closed') {
    return phase('closed', status, 'Closed', 'This pool has completed its lifecycle.', targetMet, deadlinePassed)
  }
  if (status === 'refunding') {
    return phase('refunding', status, 'Refunding', 'Contributors can claim refunds from the vault.', targetMet, deadlinePassed)
  }
  if (status === 'open' && targetMet) {
    return phase('funded', status, 'Ready to finalize', 'The target is met and the organizer can release funds.', targetMet, deadlinePassed)
  }
  if (status === 'open' && deadlinePassed && !targetMet) {
    return phase('expired', status, 'Refunds available', 'The deadline passed before the target was met.', targetMet, deadlinePassed)
  }
  if (status === 'open') {
    return phase('open', status, 'Collecting', 'Friends can still contribute before the deadline.', targetMet, deadlinePassed)
  }
  return phase('unknown', status, 'Unknown', 'The app could not classify this pool state.', targetMet, deadlinePassed)
}

export function getPoolActionState(pool: PoolView, wallet: PublicKeyLike | null | undefined, nowSeconds?: number) {
  const phaseInfo = getPoolPhase(pool, nowSeconds)
  const walletAddress = publicKeyToString(wallet)
  const organizerAddress = publicKeyToString(pool.organizer)
  const isOrganizer = Boolean(walletAddress && walletAddress === organizerAddress)

  return {
    phase: phaseInfo,
    isOrganizer,
    canContribute: phaseInfo.status === 'open' && !phaseInfo.deadlinePassed,
    canFinalize: phaseInfo.status === 'open' && phaseInfo.targetMet && isOrganizer,
    canRefund:
      (phaseInfo.id === 'expired' || phaseInfo.id === 'refunding') &&
      phaseInfo.deadlinePassed &&
      !phaseInfo.targetMet,
  }
}

export function filterAndSortPools(pools: PoolView[], options: FilterOptions): PoolView[] {
  const query = options.query.trim().toLowerCase()
  const nowSeconds = options.nowSeconds ?? Math.floor(Date.now() / 1000)

  return pools
    .filter((pool) => {
      const phaseInfo = getPoolPhase(pool, nowSeconds)
      if (options.status !== 'all' && phaseInfo.id !== options.status) return false
      if (!query) return true

      const searchable = [
        pool.name,
        publicKeyToString(pool.address),
        publicKeyToString(pool.organizer),
        publicKeyToString(pool.receiver),
        phaseInfo.label,
        phaseInfo.id,
      ]
        .join(' ')
        .toLowerCase()

      return searchable.includes(query)
    })
    .toSorted((a, b) => {
      const phaseA = getPoolPhase(a, nowSeconds)
      const phaseB = getPoolPhase(b, nowSeconds)
      if (phaseA.rank !== phaseB.rank) return phaseA.rank - phaseB.rank
      return numericValueToNumber(a.deadline) - numericValueToNumber(b.deadline)
    })
}

export function validateCreatePoolDraft(draft: CreatePoolDraft): CreatePoolValidation {
  const errors: CreatePoolValidation['errors'] = {}
  const name = draft.name.trim()
  const seed = Number(draft.seed)
  const targetSol = Number(draft.targetSol)
  const deadlineHours = Number(draft.deadlineHours)
  const receiver = draft.receiver.trim()

  if (name.length < 3) errors.name = 'Use at least 3 characters'
  if (!Number.isInteger(seed) || seed < 1) errors.seed = 'Seed must be a positive integer'
  if (!Number.isFinite(targetSol) || targetSol < 0.1) errors.targetSol = 'Target must be at least 0.1 SOL'
  if (!Number.isFinite(deadlineHours) || deadlineHours < 1) {
    errors.deadlineHours = 'Deadline must be at least 1 hour'
  }
  if (receiver) {
    try {
      new PublicKey(receiver)
    } catch {
      errors.receiver = 'Invalid Solana address'
    }
  }

  return {
    canSubmit: Object.keys(errors).length === 0,
    errors,
  }
}

function normalizeStatusName(value: string | undefined): PoolStatusName {
  const normalized = value?.toLowerCase()
  if (normalized === 'open' || normalized === 'refunding' || normalized === 'closed') return normalized
  return 'unknown'
}

function phase(
  id: PoolPhase['id'],
  status: PoolStatusName,
  label: string,
  description: string,
  targetMet: boolean,
  deadlinePassed: boolean,
): PoolPhase {
  const rank: Record<PoolPhase['id'], number> = {
    funded: 0,
    open: 1,
    expired: 2,
    refunding: 3,
    closed: 4,
    unknown: 5,
  }

  const badgeType: Record<PoolPhase['id'], PoolPhase['badgeType']> = {
    funded: 'success',
    open: 'info',
    expired: 'warning',
    refunding: 'warning',
    closed: 'neutral',
    unknown: 'neutral',
  }

  return {
    id,
    status,
    label,
    description,
    targetMet,
    deadlinePassed,
    rank: rank[id],
    badgeType: badgeType[id],
  }
}
