import { useState, useCallback, createContext, useContext } from 'react'
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react'

interface Toast {
  id: string
  type: 'success' | 'error' | 'info' | 'warning'
  message: string
  description?: string
  actionLabel?: string
  actionHref?: string
}

const ToastContext = createContext<{
  toast: (t: Omit<Toast, 'id'>) => void
  remove: (id: string) => void
}>({ toast: () => {}, remove: () => {} })

export const useToast = () => useContext(ToastContext)

const icons = {
  success: CheckCircle,
  error: AlertCircle,
  info: Info,
  warning: AlertTriangle,
}

const colors = {
  success: { border: 'var(--success-border)', bg: 'var(--success-bg)', icon: 'var(--success)' },
  error: { border: 'var(--error-border)', bg: 'var(--error-bg)', icon: 'var(--error)' },
  info: { border: 'var(--info-border)', bg: 'var(--info-bg)', icon: 'var(--info)' },
  warning: { border: 'var(--warning-border)', bg: 'var(--warning-bg)', icon: 'var(--warning)' },
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const toast = useCallback((t: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).slice(2)
    setToasts((prev) => [...prev, { ...t, id }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((x) => x.id !== id))
    }, 5000)
  }, [])

  const remove = useCallback((id: string) => {
    setToasts((prev) => prev.filter((x) => x.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={{ toast, remove }}>
      {children}
      <div
        style={{
          position: 'fixed',
          top: 20,
          right: 20,
          zIndex: 100,
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
          maxWidth: 380,
          width: 'calc(100vw - 40px)',
        }}
      >
        {toasts.map((t) => {
          const Icon = icons[t.type]
          const c = colors[t.type]
          return (
            <div
              key={t.id}
              style={{
                animation: 'toastSlide 0.35s var(--ease-out) both',
                background: 'var(--surface-raised)',
                border: `1px solid ${c.border}`,
                borderRadius: 12,
                padding: '14px 16px',
                display: 'flex',
                alignItems: 'flex-start',
                gap: 10,
                boxShadow: 'var(--shadow-lg)',
              }}
            >
              <Icon size={18} color={c.icon} style={{ flexShrink: 0, marginTop: 1 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--text)' }}>{t.message}</div>
                {t.description && (
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{t.description}</div>
                )}
                {t.actionHref && (
                  <a
                    href={t.actionHref}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      display: 'inline-flex',
                      marginTop: 8,
                      color: c.icon,
                      fontSize: 12,
                      fontWeight: 700,
                      textDecoration: 'none',
                    }}
                  >
                    {t.actionLabel || 'View transaction'}
                  </a>
                )}
              </div>
              <button
                onClick={() => remove(t.id)}
                style={{ flexShrink: 0, color: 'var(--text-muted)', padding: 2, borderRadius: 4, cursor: 'pointer' }}
              >
                <X size={14} />
              </button>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}
