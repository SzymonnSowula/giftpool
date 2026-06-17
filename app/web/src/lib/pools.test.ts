import { describe, expect, it } from 'vitest'
import { PublicKey } from '@solana/web3.js'
import {
  filterAndSortPools,
  getContributionGuidance,
  getPoolActionState,
  getPoolPhase,
  validateCreatePoolDraft,
} from './pools'
import type { PoolView } from '../types/pool'

const now = 1_800_000_000
const organizer = new PublicKey('11111111111111111111111111111111')
const receiver = new PublicKey('So11111111111111111111111111111111111111112')
const contributor = new PublicKey('11111111111111111111111111111112')

function pool(overrides: Partial<PoolView> = {}): PoolView {
  return {
    address: new PublicKey('11111111111111111111111111111113'),
    organizer,
    receiver,
    seed: 1,
    name: 'Birthday Pool',
    targetAmount: 10,
    totalContributed: 4,
    deadline: now + 3600,
    status: { open: {} },
    ...overrides,
  }
}

describe('pool lifecycle helpers', () => {
  it('explains that contributors should use app buttons instead of visible addresses', () => {
    expect(getContributionGuidance()).toEqual({
      title: 'Where to send SOL',
      body:
        'Use the contribution buttons below. Do not manually send SOL to the pool account or receiver address; the app routes your payment through the TrustPool program vault.',
      note: 'Pool account is for inspection. Receiver gets paid only after finalization.',
    })
  })

  it('marks an open target-met pool as funded and ready for organizer finalization', () => {
    const fundedPool = pool({ targetAmount: 10, totalContributed: 10 })

    expect(getPoolPhase(fundedPool, now)).toMatchObject({
      id: 'funded',
      status: 'open',
      targetMet: true,
      deadlinePassed: false,
      label: 'Ready to finalize',
    })
    expect(getPoolActionState(fundedPool, organizer, now)).toMatchObject({
      canContribute: true,
      canFinalize: true,
      canRefund: false,
    })
  })

  it('marks an open missed-deadline pool as refundable without changing on-chain status', () => {
    const expiredPool = pool({ deadline: now - 1, totalContributed: 4, targetAmount: 10 })

    expect(getPoolPhase(expiredPool, now)).toMatchObject({
      id: 'expired',
      status: 'open',
      targetMet: false,
      deadlinePassed: true,
      label: 'Refunds available',
    })
    expect(getPoolActionState(expiredPool, contributor, now)).toMatchObject({
      canContribute: false,
      canFinalize: false,
      canRefund: true,
    })
  })

  it('filters by query and status, then keeps actionable pools before closed pools', () => {
    const openPool = pool({
      address: new PublicKey('11111111111111111111111111111114'),
      name: 'Office Cake',
      deadline: now + 100,
    })
    const closedPool = pool({
      address: new PublicKey('11111111111111111111111111111115'),
      name: 'Archived Cake',
      status: { closed: {} },
      deadline: now - 100,
    })
    const fundedPool = pool({
      address: new PublicKey('11111111111111111111111111111116'),
      name: 'Cake Ready',
      totalContributed: 10,
      deadline: now + 500,
    })

    const result = filterAndSortPools([closedPool, openPool, fundedPool], {
      query: 'cake',
      status: 'all',
      nowSeconds: now,
    })

    expect(result.map((item) => item.name)).toEqual(['Cake Ready', 'Office Cake', 'Archived Cake'])
    expect(
      filterAndSortPools([closedPool, openPool, fundedPool], {
        query: '',
        status: 'closed',
        nowSeconds: now,
      }),
    ).toEqual([closedPool])
  })
})

describe('create pool validation', () => {
  it('returns field errors for unsafe form values', () => {
    expect(
      validateCreatePoolDraft({
        name: 'Al',
        seed: '0',
        targetSol: '0',
        deadlineHours: '0',
        receiver: 'not-a-public-key',
      }),
    ).toEqual({
      canSubmit: false,
      errors: {
        name: 'Use at least 3 characters',
        seed: 'Seed must be a positive integer',
        targetSol: 'Target must be at least 0.1 SOL',
        deadlineHours: 'Deadline must be at least 1 hour',
        receiver: 'Invalid Solana address',
      },
    })
  })

  it('accepts a valid draft and optional blank receiver', () => {
    expect(
      validateCreatePoolDraft({
        name: 'Alice birthday',
        seed: '42',
        targetSol: '1.5',
        deadlineHours: '48',
        receiver: '',
      }),
    ).toEqual({ canSubmit: true, errors: {} })
  })
})
