import { motion } from 'framer-motion'
import {
  ArrowDown,
  Gift,
  HeartHandshake,
  Lock,
  PartyPopper,
  Shield,
  Sparkles,
  Users,
  Zap,
} from 'lucide-react'
import heroAsset from '../assets/hero.png'

const ease = [0.16, 1, 0.3, 1] as const

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.09, delayChildren: 0.15 } },
}

const item = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.62, ease } },
}

const categories = [
  { icon: Gift, label: 'Group Gifts', desc: 'Birthdays, weddings, office gifts.' },
  { icon: HeartHandshake, label: 'Community Causes', desc: 'Fund shared moments and local initiatives.' },
  { icon: PartyPopper, label: 'Celebrations', desc: 'Collect fast without chasing transfers.' },
]

const trustPoints = [
  { icon: Shield, label: 'Escrowed', desc: 'Funds stay in the program vault.' },
  { icon: Users, label: 'Transparent', desc: 'Everyone can inspect the pool.' },
  { icon: Zap, label: 'Automatic', desc: 'Clear success and refund paths.' },
  { icon: Lock, label: 'Trustless', desc: 'Rules are enforced by code.' },
]

const nftAvatars = [
  {
    src: 'https://i.pinimg.com/736x/9b/bf/7b/9bbf7b7765d1c7f0d01c59bb4264aaf2.jpg',
    alt: 'NFT collector avatar',
  },
  {
    src: 'https://img.magnific.com/free-vector/hand-drawn-nft-style-ape-illustration_23-2149622021.jpg?semt=ais_hybrid&w=740&q=80',
    alt: 'NFT ape avatar',
  },
  {
    src: 'https://lh6.googleusercontent.com/55OdH3DU0kmmzjOOnfxO8TAsBR7xCRuFNBfZivPq0KWrd1gWo-7T12yKdnRWG_nKLuQOeMxOm95o2W0oTenW_0KuYBGOTuqJ_Afdzrtq2V8A7peV5ljeKCnadjfsnZbsLZ3Y-euH5mr2SfsvUA2AuvFsvAHtdCX_sXl5eVQxRfF2M7wRKzxe4BBenw',
    alt: 'NFT profile avatar',
  },
]

function NftAvatar({ avatar, index }: { avatar: (typeof nftAvatars)[number]; index: number }) {
  return (
    <span
      className="relative flex h-10 w-10 overflow-hidden rounded-xl border-2 border-[var(--bg)] bg-white/[0.08] shadow-[0_10px_28px_rgba(0,0,0,0.32)] ring-1 ring-white/20"
      style={{ marginLeft: index === 0 ? 0 : -10 }}
    >
      <img
        src={avatar.src}
        alt={avatar.alt}
        className="h-full w-full object-cover"
        loading="eager"
        referrerPolicy="no-referrer"
      />
      <span className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/25 to-transparent" />
    </span>
  )
}

export function Hero({
  onCreate,
  onExplore,
}: {
  onCreate: () => void
  onExplore: () => void
  onScroll?: () => void
}) {
  return (
    <section className="relative mx-auto grid min-h-svh max-w-[1240px] grid-cols-1 items-center gap-12 px-5 pb-20 pt-32 sm:px-6 lg:grid-cols-[minmax(0,1.08fr)_minmax(380px,0.92fr)] lg:gap-14 lg:pt-36">
      <motion.div variants={container} initial="hidden" animate="show" className="relative z-10">
        <motion.div variants={item} className="mb-6 flex flex-wrap items-center gap-3">
          <div className="flex items-center" aria-label="NFT collector avatars">
            {nftAvatars.map((avatar, index) => (
              <NftAvatar key={avatar.src} avatar={avatar} index={index} />
            ))}
          </div>
          <span className="inline-flex max-w-full items-center gap-2 rounded-full border border-[var(--border)] bg-white/[0.06] px-4 py-2 text-xs font-bold text-[var(--text-secondary)]">
            <Sparkles size={13} className="shrink-0 text-[var(--gold)]" />
            <span className="truncate">Social gift pools on Solana Devnet</span>
          </span>
        </motion.div>

        <motion.h1
          variants={item}
          className="max-w-[700px] text-[clamp(42px,5.8vw,78px)] font-black leading-[0.98] tracking-normal text-white"
        >
          Make the group gift
          <br />
          <span className="display-serif gift-ribbon-text">feel effortless.</span>
        </motion.h1>

        <motion.p
          variants={item}
          className="mt-6 max-w-[610px] text-[clamp(16px,1.7vw,20px)] leading-[1.65] text-[var(--text-secondary)]"
        >
          Create a beautiful shared pool, invite friends, and let the smart contract hold funds until the goal is
          reached. If the moment falls through, refunds stay automatic.
        </motion.p>

        <motion.div variants={item} className="mt-8 flex flex-wrap gap-3">
          <button
            onClick={onCreate}
            className="rounded-full bg-white px-6 py-4 text-sm font-black text-[var(--text-inverse)] shadow-[0_18px_50px_rgba(255,255,255,0.12)] transition-transform hover:scale-[1.02] active:scale-[0.97]"
          >
            Start a gift pool
          </button>
          <button
            onClick={onExplore}
            className="liquid-glass rounded-full px-6 py-4 text-sm font-black text-white transition-transform hover:scale-[1.02] active:scale-[0.97]"
          >
            Browse pools
          </button>
        </motion.div>

        <motion.div variants={item} className="mt-10 grid max-w-[720px] grid-cols-1 gap-3 sm:grid-cols-3">
          {categories.map((cat) => (
            <div key={cat.label} className="liquid-glass rounded-2xl p-5 transition-transform hover:-translate-y-0.5">
              <cat.icon size={20} className="mb-3 text-[var(--gift)]" />
              <div className="mb-1.5 text-sm font-bold text-white">{cat.label}</div>
              <div className="text-xs leading-5 text-[var(--text-muted)]">{cat.desc}</div>
            </div>
          ))}
        </motion.div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 28, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.8, delay: 0.25, ease }}
        className="relative z-10 mx-auto flex w-full max-w-[500px] flex-col gap-4 lg:mx-0"
      >
        <img
          src={heroAsset}
          alt=""
          className="pointer-events-none absolute -right-7 -top-12 w-[78%] rotate-[7deg] opacity-65 drop-shadow-[0_34px_80px_rgba(132,78,255,0.28)] max-sm:right-0 max-sm:w-[72%]"
        />

        <div className="liquid-glass relative ml-auto w-full rounded-[34px] p-5 sm:p-6">
          <div className="mb-6 flex items-center justify-between gap-5">
            <div className="min-w-0">
              <div className="mb-1 text-xs font-black uppercase text-[var(--text-muted)]">Live gift pool</div>
              <div className="truncate text-2xl font-black text-white">Alice birthday weekend</div>
            </div>
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--gift)] to-[var(--gold)] text-[var(--text-inverse)]">
              <Gift size={22} />
            </div>
          </div>

          <div className="mb-5 rounded-[22px] border border-[var(--border)] bg-white/[0.08] p-5">
            <div className="mb-3 flex items-end justify-between gap-4">
              <div>
                <div className="text-xs font-bold text-[var(--text-muted)]">Raised</div>
                <div className="text-[clamp(32px,4vw,42px)] font-black leading-none text-white">3.750 SOL</div>
              </div>
              <div className="text-sm font-black text-[#c7b7ff]">75%</div>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-white/[0.12]">
              <div className="h-full w-3/4 rounded-full bg-gradient-to-r from-[var(--gift)] via-[#a994ff] to-white/90" />
            </div>
          </div>

          <div className="grid gap-2.5">
            {['Maya joined with 0.5 SOL', 'Kuba shared the pool', 'Smart contract vault active'].map((line, index) => (
              <div
                key={line}
                className={`flex items-center justify-between gap-3 rounded-2xl border border-[var(--border)] px-3.5 py-3 text-sm font-bold text-[var(--text-secondary)] ${
                  index === 0 ? 'bg-[rgba(103,240,200,0.09)]' : 'bg-white/[0.055]'
                }`}
              >
                <span className="truncate">{line}</span>
                <Zap size={14} className={index === 0 ? 'shrink-0 text-[var(--mint)]' : 'shrink-0 text-[var(--text-muted)]'} />
              </div>
            ))}
          </div>
        </div>

        <div className="liquid-glass relative w-full rounded-3xl p-5 sm:max-w-[330px]">
          <div className="mb-3 text-xs font-black uppercase text-[var(--text-muted)]">Why it works</div>
          <div className="grid gap-3">
            {trustPoints.map((point) => (
              <div key={point.label} className="grid grid-cols-[22px_1fr] items-start gap-2.5">
                <point.icon size={17} className={point.label === 'Automatic' ? 'text-[var(--gold)]' : 'text-white'} />
                <div>
                  <div className="text-sm font-black text-white">{point.label}</div>
                  <div className="text-xs leading-5 text-[var(--text-muted)]">{point.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.4, duration: 0.6 }}
        className="absolute bottom-7 left-1/2 hidden -translate-x-1/2 lg:block"
      >
        <ArrowDown size={20} className="text-[var(--text-muted)]" />
      </motion.div>
    </section>
  )
}
