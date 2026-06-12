import { useState } from 'react'
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'
import { AnimatePresence, motion } from 'framer-motion'
import { Gift, Menu, PlusCircle, Search, X } from 'lucide-react'

const tabs = [
  { id: 'pools', label: 'Explore', icon: Search },
  { id: 'create', label: 'Create', icon: PlusCircle },
]

export function Header({ activeTab, onTabChange }: { activeTab: string; onTabChange: (t: string) => void }) {
  const [mobileOpen, setMobileOpen] = useState(false)

  const chooseTab = (tab: string) => {
    onTabChange(tab)
    setMobileOpen(false)
  }

  return (
    <motion.header
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] as const }}
      className="fixed inset-x-0 top-0 z-50"
    >
      <div className="mx-auto mt-3.5 max-w-[1240px] px-5">
        <div className="liquid-glass flex min-h-16 items-center justify-between gap-4 rounded-full py-2.5 pl-4 pr-3">
          <button
            type="button"
            onClick={() => chooseTab('pools')}
            className="flex shrink-0 items-center gap-3"
            aria-label="Go to GiftPool home"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--border-strong)] bg-gradient-to-br from-white/[0.18] to-[rgba(255,122,144,0.28)] shadow-[var(--shadow-glow)]">
              <Gift size={17} className="text-white" strokeWidth={2.2} />
            </span>
            <span className="text-base font-black tracking-normal text-white sm:text-lg">GiftPool</span>
          </button>

          <nav className="hidden flex-1 items-center justify-center gap-1.5 sm:flex">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => chooseTab(tab.id)}
                className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-black transition ${
                  activeTab === tab.id
                    ? 'border-[var(--border-strong)] bg-white/[0.13] text-white'
                    : 'border-transparent text-[var(--text-muted)] hover:bg-white/[0.06] hover:text-white'
                }`}
              >
                <tab.icon size={14} />
                {tab.label}
              </button>
            ))}
          </nav>

          <div className="flex shrink-0 items-center gap-3">
            <WalletMultiButton />
            <button
              type="button"
              onClick={() => setMobileOpen((open) => !open)}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--border)] bg-white/[0.08] text-white sm:hidden"
              aria-label="Toggle navigation"
            >
              {mobileOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] as const }}
            className="overflow-hidden px-5 sm:hidden"
          >
            <div className="liquid-glass mx-auto mt-2 grid max-w-[1240px] gap-1 rounded-3xl p-2.5">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => chooseTab(tab.id)}
                  className={`flex items-center gap-2 rounded-xl px-3.5 py-3 text-sm font-black ${
                    activeTab === tab.id
                      ? 'bg-white/[0.13] text-white'
                      : 'text-[var(--text-muted)] hover:bg-white/[0.06] hover:text-white'
                  }`}
                >
                  <tab.icon size={14} />
                  {tab.label}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  )
}
