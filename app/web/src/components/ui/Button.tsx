import { Loader2 } from 'lucide-react'
import type { ReactNode } from 'react'

type Variant = 'primary' | 'secondary' | 'ghost' | 'success' | 'warning' | 'danger'
type Size = 'sm' | 'md' | 'lg'

const variantStyles: Record<Variant, React.CSSProperties> = {
  primary: {
    background: 'var(--text)',
    color: 'var(--text-inverse)',
    border: '1px solid transparent',
  },
  secondary: {
    background: 'rgba(255, 255, 255, 0.08)',
    color: 'var(--text)',
    border: '1px solid var(--border)',
  },
  ghost: {
    background: 'transparent',
    color: 'var(--text-secondary)',
    border: '1px solid transparent',
  },
  success: {
    background: 'var(--success)',
    color: 'var(--text-inverse)',
    border: '1px solid transparent',
  },
  warning: {
    background: 'var(--warning)',
    color: 'var(--text-inverse)',
    border: '1px solid transparent',
  },
  danger: {
    background: 'var(--error)',
    color: 'var(--text-inverse)',
    border: '1px solid transparent',
  },
}

const sizeStyles: Record<Size, { padding: string; fontSize: string; height: string }> = {
  sm: { padding: '6px 12px', fontSize: 'var(--text-xs)', height: '32px' },
  md: { padding: '10px 16px', fontSize: 'var(--text-sm)', height: '40px' },
  lg: { padding: '12px 24px', fontSize: 'var(--text-md)', height: '48px' },
}

interface ButtonProps {
  children: ReactNode
  variant?: Variant
  size?: Size
  disabled?: boolean
  loading?: boolean
  onClick?: () => void
  type?: 'button' | 'submit'
  style?: React.CSSProperties
  icon?: ReactNode
  fullWidth?: boolean
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  disabled,
  loading,
  onClick,
  type = 'button',
  style,
  icon,
  fullWidth,
}: ButtonProps) {
  const isDisabled = disabled || loading
  const v = variantStyles[variant]
  const s = sizeStyles[size]

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={isDisabled}
      style={{
        ...v,
        ...s,
        borderRadius: 'var(--r-full)',
        fontWeight: 800,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        cursor: isDisabled ? 'not-allowed' : 'pointer',
        opacity: isDisabled ? 0.5 : 1,
        transition: 'transform 0.12s, opacity 0.2s, background 0.2s, border-color 0.2s',
        width: fullWidth ? '100%' : undefined,
        ...style,
      }}
      onMouseDown={(e) => {
        if (!isDisabled) e.currentTarget.style.transform = 'scale(0.96)'
      }}
      onMouseUp={(e) => {
        e.currentTarget.style.transform = 'scale(1)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'scale(1)'
      }}
    >
      {loading ? <Loader2 size={16} className="spin" /> : icon}
      {children}
    </button>
  )
}
