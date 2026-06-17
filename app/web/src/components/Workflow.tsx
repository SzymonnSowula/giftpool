import { motion } from 'framer-motion'
import { CheckCircle2, Gift, Link2, RotateCcw, Users } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { workflowSteps, type WorkflowStepId } from '../lib/workflow'

const icons: Record<WorkflowStepId, LucideIcon> = {
  create: Gift,
  share: Link2,
  contribute: Users,
  settle: CheckCircle2,
  receive: RotateCcw,
}

export function Workflow() {
  return (
    <section className="relative mx-auto w-full max-w-[1240px] px-5 pb-8 pt-6 sm:px-6 lg:pb-14">
      <div className="mb-7 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-3 text-xs font-black uppercase tracking-normal text-[var(--gift)]">
            Workflow
          </div>
          <h2 className="max-w-2xl text-3xl font-black tracking-normal text-white sm:text-4xl">
            From idea to payout, every step has one clear owner.
          </h2>
        </div>
        <p className="max-w-md text-sm leading-6 text-[var(--text-muted)]">
          TrustPool keeps the social flow simple while the smart contract handles custody,
          payout, and refunds.
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-5">
        {workflowSteps.map((step, index) => {
          const Icon = icons[step.id]
          return (
            <motion.article
              key={step.id}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.45, delay: index * 0.04, ease: [0.16, 1, 0.3, 1] as const }}
              className="liquid-glass relative min-h-[230px] rounded-2xl p-5"
            >
              {index < workflowSteps.length - 1 && (
                <div className="absolute left-1/2 top-10 hidden h-px w-[calc(100%+12px)] bg-gradient-to-r from-white/30 to-transparent md:block" />
              )}
              <div className="relative mb-5 flex items-center justify-between gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--border-strong)] bg-white/[0.1] text-sm font-black text-white">
                  {step.kicker}
                </span>
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--text)] text-[var(--text-inverse)]">
                  <Icon size={17} />
                </span>
              </div>
              <h3 className="mb-3 text-lg font-black tracking-normal text-white">{step.title}</h3>
              <p className="text-sm leading-6 text-[var(--text-muted)]">{step.body}</p>
            </motion.article>
          )
        })}
      </div>
    </section>
  )
}
