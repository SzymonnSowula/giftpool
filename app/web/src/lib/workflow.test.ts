import { describe, expect, it } from 'vitest'
import { workflowSteps } from './workflow'

describe('workflow content', () => {
  it('describes the complete product path from pool creation to payout or refund', () => {
    expect(workflowSteps.map((step) => step.id)).toEqual([
      'create',
      'share',
      'contribute',
      'settle',
      'receive',
    ])
    expect(workflowSteps[0].title).toContain('Create')
    expect(workflowSteps.at(-1)?.body).toContain('receiver')
    expect(workflowSteps.at(-1)?.body).toContain('refund')
  })
})
