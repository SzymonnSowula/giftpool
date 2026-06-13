export type WorkflowStepId = 'create' | 'share' | 'contribute' | 'settle' | 'receive'

export interface WorkflowStep {
  id: WorkflowStepId
  kicker: string
  title: string
  body: string
}

export const workflowSteps: WorkflowStep[] = [
  {
    id: 'create',
    kicker: '01',
    title: 'Create the pool',
    body: 'The organizer sets the gift name, target amount, deadline, and receiver wallet. GiftPool derives the pool PDA and vault PDA from those rules.',
  },
  {
    id: 'share',
    kicker: '02',
    title: 'Share the link',
    body: 'The pool gets a public devnet address and share link, so friends can inspect the account before sending SOL.',
  },
  {
    id: 'contribute',
    kicker: '03',
    title: 'Friends contribute',
    body: 'Each contributor sends SOL into the program-controlled vault. Their contribution account records how much they can later reclaim if the pool fails.',
  },
  {
    id: 'settle',
    kicker: '04',
    title: 'Settle by the rules',
    body: 'If the target is met, the organizer finalizes. If the deadline passes first, the pool becomes refundable for contributors.',
  },
  {
    id: 'receive',
    kicker: '05',
    title: 'Receiver gets paid',
    body: 'Successful pools release tracked funds only to the stored receiver. Failed pools keep money available for contributor refund claims.',
  },
]
