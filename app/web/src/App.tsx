import { useState, useRef, useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Header } from './components/Header'
import { Hero } from './components/Hero'
import { PoolList } from './components/PoolList'
import { PoolDetail } from './components/PoolDetail'
import { PoolCreate } from './components/PoolCreate'
import { BackgroundDecor } from './components/BackgroundDecor'
import { ToastProvider } from './components/ui/Toast'
import { PublicKey } from '@solana/web3.js'
import { useProgram } from './hooks/useProgram'

function App() {
  const { fetchAllPools } = useProgram()
  const [activeTab, setActiveTab] = useState('pools')
  const [selectedPool, setSelectedPool] = useState<any | null>(null)
  const [poolToLoad, setPoolToLoad] = useState<string | null>(null)
  const dashboardRef = useRef<HTMLDivElement>(null)
  const dashboardContentRef = useRef<HTMLDivElement>(null)

  // Handle URL params on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const poolParam = params.get('pool')
    if (poolParam) {
      setPoolToLoad(poolParam)
    }
  }, [])

  // Load pool from URL param
  useEffect(() => {
    if (!poolToLoad || selectedPool) return
    
    const loadPool = async () => {
      try {
        const pubkey = new PublicKey(poolToLoad)
        const pools = await fetchAllPools()
        const found = pools.find((p: any) => p.address.toBase58() === pubkey.toBase58())
        if (found) {
          setSelectedPool(found)
          setActiveTab('pools')
          setTimeout(() => {
            dashboardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
          }, 100)
        }
      } catch (e) {
        console.error('Failed to load pool from URL:', e)
      }
    }
    
    loadPool()
  }, [poolToLoad, selectedPool])

  const scrollToElement = (element: HTMLElement | null, offset = 120) => {
    if (!element) return
    const target = element.getBoundingClientRect().top + window.scrollY - offset
    window.scrollTo({ top: Math.max(0, target), behavior: 'smooth' })
  }

  const scrollToDashboard = () => {
    scrollToElement(dashboardRef.current, 110)
  }

  const scrollToDashboardContent = () => {
    scrollToElement(dashboardContentRef.current, 180)
  }

  const handleTabChange = (tab: string) => {
    setActiveTab(tab)
    setSelectedPool(null)
    if (tab === 'create') {
      window.setTimeout(() => {
        scrollToDashboardContent()
      }, 120)
    }
  }

  const handleHeroCreate = () => {
    setActiveTab('create')
    setSelectedPool(null)
    window.setTimeout(() => {
      scrollToDashboardContent()
    }, 120)
  }

  const handleHeroExplore = () => {
    setActiveTab('pools')
    setSelectedPool(null)
    window.setTimeout(() => {
      dashboardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 120)
  }

  const handleSelectPool = (pool: any) => {
    setSelectedPool(pool)
    setActiveTab('pools')
    // Update URL
    const addr = pool.address?.toBase58?.() || pool.address
    if (addr) {
      const url = new URL(window.location.href)
      url.searchParams.set('pool', addr)
      window.history.pushState({}, '', url.toString())
    }
  }

  const handleBack = () => {
    setSelectedPool(null)
    // Remove pool param from URL
    const url = new URL(window.location.href)
    url.searchParams.delete('pool')
    window.history.pushState({}, '', url.toString())
  }

  const handleCreated = (pool: any) => {
    setSelectedPool(pool)
    setActiveTab('pools')
    // Update URL
    const addr = pool.address?.toBase58?.() || pool.address
    if (addr) {
      const url = new URL(window.location.href)
      url.searchParams.set('pool', addr)
      window.history.pushState({}, '', url.toString())
    }
  }

  return (
    <ToastProvider>
      <BackgroundDecor />
      <div className="relative z-[1] flex min-h-svh flex-col">
        <Header activeTab={activeTab} onTabChange={handleTabChange} />
        <main className="flex-1">
          <Hero onCreate={handleHeroCreate} onExplore={handleHeroExplore} onScroll={scrollToDashboard} />
          <section ref={dashboardRef} className="mx-auto w-full max-w-[1200px] px-5 pb-24 pt-10 sm:px-6">
            <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-3xl font-black tracking-normal text-white sm:text-4xl">
                  {activeTab === 'create' ? 'Create a pool' : selectedPool ? 'Pool details' : 'Explore live pools'}
                </h2>
                <p className="mt-2 max-w-xl text-sm leading-6 text-[var(--text-muted)]">
                  {activeTab === 'create'
                    ? 'Set the gift target, deadline, and vault rules in a few calm steps.'
                    : selectedPool
                      ? 'Contribute, share, finalize, or claim refunds from one focused view.'
                      : 'Browse public GiftPool campaigns and jump into the ones you care about.'}
                </p>
              </div>
              <div className="hidden rounded-full border border-[var(--border)] bg-white/[0.05] px-4 py-2 text-xs font-black uppercase text-[var(--text-muted)] sm:block">
                Devnet vaults
              </div>
            </div>
            <div ref={dashboardContentRef}>
              <AnimatePresence mode="wait">
                {activeTab === 'pools' ? (
                  <motion.div
                    key={selectedPool ? 'detail' : 'list'}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -12 }}
                    transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] as const }}
                  >
                    {selectedPool ? (
                      <PoolDetail
                        pool={selectedPool}
                        onBack={handleBack}
                      />
                    ) : (
                      <PoolList onSelect={handleSelectPool} />
                    )}
                  </motion.div>
                ) : (
                  <motion.div
                    key="create"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -12 }}
                    transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] as const }}
                  >
                    <PoolCreate onCreated={handleCreated} />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </section>
        </main>
        <footer className="border-t border-[var(--border)] px-6 py-8 text-center text-sm text-[var(--text-muted)]">
          GiftPool - trustless group gifting on Solana Devnet
        </footer>
      </div>
    </ToastProvider>
  )
}

export default App
