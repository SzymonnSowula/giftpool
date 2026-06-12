import { motion } from 'framer-motion'

interface ProgressProps {
  value: number
  max?: number
  color?: string
  height?: number
  animated?: boolean
}

export function Progress({ value, max = 100, color = 'var(--accent)', height = 6, animated = true }: ProgressProps) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100))
  return (
    <div
      style={{
        height,
        borderRadius: height / 2,
        background: 'rgba(255, 255, 255, 0.11)',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      {animated ? (
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] as const }}
          style={{ height: '100%', borderRadius: height / 2, background: color }}
        />
      ) : (
        <div style={{ width: `${pct}%`, height: '100%', borderRadius: height / 2, background: color }} />
      )}
    </div>
  )
}
