import { forwardRef, useId } from 'react'
import type { InputHTMLAttributes } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  icon?: React.ReactNode
  fullWidth?: boolean
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, icon, fullWidth, style, id, ...props }, ref) => {
    const generatedId = useId()
    const inputId = id || generatedId
    const errorId = `${inputId}-error`
    const describedBy = props['aria-describedby']

    return (
      <div style={{ width: fullWidth ? '100%' : undefined }}>
        {label && (
          <label
            htmlFor={inputId}
            style={{
              display: 'block',
              fontSize: 'var(--text-xs)',
              fontWeight: 600,
              color: 'var(--text-muted)',
              marginBottom: 6,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
            }}
          >
            {label}
          </label>
        )}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '0 14px',
            borderRadius: 'var(--r-md)',
            background: 'rgba(255, 255, 255, 0.07)',
            border: `1px solid ${error ? 'var(--error-border)' : 'var(--border)'}`,
            transition: 'border-color 0.2s, box-shadow 0.2s',
            height: 48,
            ...style,
          }}
        >
          {icon && <span style={{ color: 'var(--text-muted)', flexShrink: 0 }}>{icon}</span>}
          <input
            ref={ref}
            {...props}
            id={inputId}
            aria-describedby={error ? errorId : describedBy}
            aria-invalid={error ? true : props['aria-invalid']}
            style={{
              flex: 1,
              background: 'none',
              border: 'none',
              outline: 'none',
              color: 'var(--text)',
              fontSize: 'var(--text-sm)',
              fontWeight: 700,
              width: '100%',
              height: '100%',
              minWidth: 0,
            }}
          />
        </div>
        {error && (
          <div
            id={errorId}
            style={{ fontSize: 'var(--text-xs)', color: 'var(--error)', marginTop: 6 }}
          >
            {error}
          </div>
        )}
      </div>
    )
  }
)
Input.displayName = 'Input'
