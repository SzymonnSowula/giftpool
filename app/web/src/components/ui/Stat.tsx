import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'

interface StatProps {
  label: string
  value: string | number
  suffix?: string
  color?: string
  icon?: React.ReactNode
  delay?: number
}

function CountUp({ value, delay = 0 }: { value: number; delay?: number }) {
  const [display, setDisplay] = useState(0)
  useEffect(() => {
    const timeout = setTimeout(() => {
      const duration = 800
      const start = performance.now()
      const animate = (now: number) => {
        const p = Math.min(1, (now - start) / duration)
        const eased = 1 - Math.pow(1 - p, 3)
        setDisplay(eased * value)
        if (p < 1) requestAnimationFrame(animate)
      }
      requestAnimationFrame(animate)
    }, delay)
    return () => clearTimeout(timeout)
  }, [value, delay])
  return <>{display.toFixed(3)}</>
}

export function Stat({ label, value, suffix, color, icon, delay = 0 }: StatProps) {
  const num = typeof value === 'number' ? value : parseFloat(value as string)
  const isNum = !isNaN(num)
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: delay * 0.05, ease: [0.16, 1, 0.3, 1] as const }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
        {icon && <span style={{ color: 'var(--text-muted)' }}>{icon}</span>}
        <span
          style={{
            fontSize: 'var(--text-xs)',
            fontWeight: 600,
            color: 'var(--text-muted)',
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
          }}
        >
          {label}
        </span>
      </div>
      <div
        style={{
          fontSize: 'var(--text-2xl)',
          fontWeight: 700,
          letterSpacing: '-0.02em',
          color: color || 'var(--text)',
          lineHeight: 1.2,
        }}
      >
        {isNum ? <CountUp value={num} delay={delay} /> : value}
        {suffix && (
          <span style={{ fontSize: 'var(--text-sm)', fontWeight: 500, color: 'var(--text-muted)', marginLeft: 4 }}>
            {suffix}
          </span>
        )}
      </div>
    </motion.div>
  )
}
