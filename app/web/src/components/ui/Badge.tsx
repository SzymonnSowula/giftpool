type BadgeType = 'success' | 'error' | 'warning' | 'info' | 'neutral'

const styles: Record<BadgeType, { bg: string; color: string; border: string }> = {
  success: {
    bg: 'var(--success-bg)',
    color: 'var(--success)',
    border: 'var(--success-border)',
  },
  error: {
    bg: 'var(--error-bg)',
    color: 'var(--error)',
    border: 'var(--error-border)',
  },
  warning: {
    bg: 'var(--warning-bg)',
    color: 'var(--warning)',
    border: 'var(--warning-border)',
  },
  info: {
    bg: 'var(--info-bg)',
    color: 'var(--info)',
    border: 'var(--info-border)',
  },
  neutral: {
    bg: 'var(--surface-raised)',
    color: 'var(--text-secondary)',
    border: 'var(--border)',
  },
}

interface BadgeProps {
  children: React.ReactNode
  type?: BadgeType
  size?: 'sm' | 'md'
}

export function Badge({ children, type = 'neutral', size = 'sm' }: BadgeProps) {
  const s = styles[type]
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: size === 'sm' ? '3px 10px' : '5px 12px',
        borderRadius: 'var(--r-xs)',
        fontSize: size === 'sm' ? 'var(--text-xs)' : 'var(--text-sm)',
        fontWeight: 700,
        textTransform: 'uppercase',
        letterSpacing: '0.06em',
        background: s.bg,
        color: s.color,
        border: `1px solid ${s.border}`,
      }}
    >
      {children}
    </span>
  )
}
