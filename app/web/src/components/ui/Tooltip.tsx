import { useState, useRef } from 'react'
import { Info } from 'lucide-react'

interface TooltipProps {
  text: string
  position?: 'top' | 'bottom'
}

export function Tooltip({ text, position = 'top' }: TooltipProps) {
  const [visible, setVisible] = useState(false)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const show = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    setVisible(true)
  }

  const hide = () => {
    timeoutRef.current = setTimeout(() => setVisible(false), 150)
  }

  return (
    <span
      style={{ position: 'relative', display: 'inline-flex', marginLeft: 6, verticalAlign: 'middle' }}
      onMouseEnter={show}
      onMouseLeave={hide}
    >
      <Info
        size={14}
        style={{
          color: 'var(--text-muted)',
          cursor: 'help',
          transition: 'color 0.2s',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--accent)')}
        onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
      />
      {visible && (
        <div
          style={{
            position: 'absolute',
            [position === 'top' ? 'bottom' : 'top']: 'calc(100% + 8px)',
            left: '50%',
            transform: 'translateX(-50%)',
            padding: '10px 14px',
            borderRadius: 'var(--r-md)',
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border-strong)',
            boxShadow: 'var(--shadow-lg)',
            fontSize: 'var(--text-xs)',
            color: 'var(--text-secondary)',
            lineHeight: 1.5,
            whiteSpace: 'normal',
            width: 'max-content',
            maxWidth: 260,
            zIndex: 1000,
            pointerEvents: 'none',
          }}
        >
          {text}
          <div
            style={{
              position: 'absolute',
              [position === 'top' ? 'top' : 'bottom']: -5,
              left: '50%',
              transform: 'translateX(-50%) rotate(45deg)',
              width: 8,
              height: 8,
              background: 'var(--bg-elevated)',
              border: `1px solid var(--border-strong)`,
              borderTop: position === 'top' ? 'none' : undefined,
              borderLeft: position === 'top' ? 'none' : undefined,
              borderBottom: position === 'bottom' ? 'none' : undefined,
              borderRight: position === 'bottom' ? 'none' : undefined,
            }}
          />
        </div>
      )}
    </span>
  )
}
