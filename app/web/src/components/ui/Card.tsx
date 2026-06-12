import type { ReactNode } from 'react'

interface CardProps {
  children: ReactNode
  style?: React.CSSProperties
  padding?: 'sm' | 'md' | 'lg'
  hover?: boolean
  onClick?: () => void
}

const paddingMap = {
  sm: '16px',
  md: '24px',
  lg: '32px',
}

export function Card({ children, style, padding = 'md', hover, onClick }: CardProps) {
  return (
    <div
      onClick={onClick}
      className="liquid-glass"
      style={{
        borderRadius: 'var(--r-xl)',
        padding: paddingMap[padding],
        transition: 'transform 0.2s, border-color 0.2s, box-shadow 0.2s',
        cursor: onClick ? 'pointer' : undefined,
        ...style,
      }}
      onMouseEnter={(e) => {
        if (hover || onClick) {
          e.currentTarget.style.borderColor = 'var(--border-strong)'
          e.currentTarget.style.boxShadow = 'var(--shadow-md)'
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'var(--border)'
        e.currentTarget.style.boxShadow = 'none'
      }}
    >
      {children}
    </div>
  )
}
