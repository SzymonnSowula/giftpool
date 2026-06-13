export type NumericValue =
  | number
  | string
  | bigint
  | {
      toNumber: () => number
    }
  | {
      toString: () => string
    }

export type PublicKeyLike =
  | string
  | {
      toBase58: () => string
    }

export type PoolStatusName = 'open' | 'refunding' | 'closed' | 'unknown'

export type PoolPhaseId = 'open' | 'funded' | 'expired' | 'refunding' | 'closed' | 'unknown'

export type PoolFilterStatus = 'all' | PoolPhaseId

export interface PoolView {
  address: PublicKeyLike
  organizer: PublicKeyLike
  receiver: PublicKeyLike
  seed: NumericValue
  name: string
  targetAmount: NumericValue
  totalContributed: NumericValue
  deadline: NumericValue
  status?: Record<string, unknown> | string | null
  bump?: number
}

export interface PoolPhase {
  id: PoolPhaseId
  status: PoolStatusName
  label: string
  description: string
  targetMet: boolean
  deadlinePassed: boolean
  rank: number
  badgeType: 'success' | 'error' | 'warning' | 'info' | 'neutral'
}
