import { motion } from 'framer-motion'

export function BackgroundDecor() {
  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        pointerEvents: 'none',
        zIndex: 0,
        overflow: 'hidden',
      }}
    >
      {/* Gift Box 1 - Top Right */}
      <motion.svg
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 0.06, scale: 1 }}
        transition={{ duration: 1.5, delay: 0.2 }}
        width="280"
        height="280"
        viewBox="0 0 280 280"
        fill="none"
        style={{
          position: 'absolute',
          top: '5%',
          right: '-5%',
        }}
      >
        <rect x="60" y="100" width="160" height="120" rx="8" stroke="currentColor" strokeWidth="2" />
        <rect x="60" y="100" width="160" height="30" rx="4" stroke="currentColor" strokeWidth="2" />
        <line x1="140" y1="100" x2="140" y2="220" stroke="currentColor" strokeWidth="2" />
        <path d="M 100 100 Q 120 60 140 100" stroke="currentColor" strokeWidth="2" fill="none" />
        <path d="M 180 100 Q 160 60 140 100" stroke="currentColor" strokeWidth="2" fill="none" />
      </motion.svg>

      {/* Gift Box 2 - Bottom Left */}
      <motion.svg
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 0.05, scale: 1 }}
        transition={{ duration: 1.5, delay: 0.4 }}
        width="200"
        height="200"
        viewBox="0 0 200 200"
        fill="none"
        style={{
          position: 'absolute',
          bottom: '10%',
          left: '-3%',
        }}
      >
        <rect x="40" y="70" width="120" height="90" rx="6" stroke="currentColor" strokeWidth="1.5" />
        <rect x="40" y="70" width="120" height="25" rx="3" stroke="currentColor" strokeWidth="1.5" />
        <line x1="100" y1="70" x2="100" y2="160" stroke="currentColor" strokeWidth="1.5" />
        <path d="M 70 70 Q 85 40 100 70" stroke="currentColor" strokeWidth="1.5" fill="none" />
        <path d="M 130 70 Q 115 40 100 70" stroke="currentColor" strokeWidth="1.5" fill="none" />
      </motion.svg>

      {/* Coins - Top Left */}
      <motion.svg
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 0.07, y: 0 }}
        transition={{ duration: 1.5, delay: 0.6 }}
        width="160"
        height="160"
        viewBox="0 0 160 160"
        fill="none"
        style={{
          position: 'absolute',
          top: '15%',
          left: '8%',
        }}
      >
        <ellipse cx="80" cy="90" rx="50" ry="15" stroke="currentColor" strokeWidth="1.5" />
        <ellipse cx="80" cy="80" rx="50" ry="15" stroke="currentColor" strokeWidth="1.5" />
        <ellipse cx="80" cy="70" rx="50" ry="15" stroke="currentColor" strokeWidth="1.5" />
        <line x1="30" y1="70" x2="30" y2="90" stroke="currentColor" strokeWidth="1.5" />
        <line x1="130" y1="70" x2="130" y2="90" stroke="currentColor" strokeWidth="1.5" />
      </motion.svg>

      {/* Heart - Middle Right */}
      <motion.svg
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 0.05, scale: 1 }}
        transition={{ duration: 1.5, delay: 0.8 }}
        width="120"
        height="120"
        viewBox="0 0 120 120"
        fill="none"
        style={{
          position: 'absolute',
          top: '45%',
          right: '10%',
        }}
      >
        <path
          d="M 60 95 L 25 60 Q 15 45 30 35 Q 45 25 60 45 Q 75 25 90 35 Q 105 45 95 60 Z"
          stroke="currentColor"
          strokeWidth="1.5"
        />
      </motion.svg>

      {/* Star - Bottom Right */}
      <motion.svg
        initial={{ opacity: 0, rotate: -20 }}
        animate={{ opacity: 0.06, rotate: 0 }}
        transition={{ duration: 1.5, delay: 1 }}
        width="100"
        height="100"
        viewBox="0 0 100 100"
        fill="none"
        style={{
          position: 'absolute',
          bottom: '20%',
          right: '15%',
        }}
      >
        <path
          d="M 50 15 L 60 40 L 85 40 L 65 55 L 75 80 L 50 65 L 25 80 L 35 55 L 15 40 L 40 40 Z"
          stroke="currentColor"
          strokeWidth="1.5"
        />
      </motion.svg>

      {/* Rocket - Top Center */}
      <motion.svg
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 0.05, y: 0 }}
        transition={{ duration: 1.5, delay: 1.2 }}
        width="140"
        height="140"
        viewBox="0 0 140 140"
        fill="none"
        style={{
          position: 'absolute',
          top: '8%',
          left: '35%',
        }}
      >
        <path
          d="M 70 20 Q 85 40 85 70 L 85 90 L 55 90 L 55 70 Q 55 40 70 20 Z"
          stroke="currentColor"
          strokeWidth="1.5"
        />
        <circle cx="70" cy="55" r="8" stroke="currentColor" strokeWidth="1.5" />
        <path d="M 55 80 L 40 95 L 55 90" stroke="currentColor" strokeWidth="1.5" />
        <path d="M 85 80 L 100 95 L 85 90" stroke="currentColor" strokeWidth="1.5" />
        <path d="M 60 90 L 65 110 L 70 95 L 75 110 L 80 90" stroke="currentColor" strokeWidth="1.5" />
      </motion.svg>

      {/* Community/People - Bottom Center */}
      <motion.svg
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 0.05, y: 0 }}
        transition={{ duration: 1.5, delay: 1.4 }}
        width="180"
        height="120"
        viewBox="0 0 180 120"
        fill="none"
        style={{
          position: 'absolute',
          bottom: '5%',
          left: '30%',
        }}
      >
        <circle cx="60" cy="40" r="15" stroke="currentColor" strokeWidth="1.5" />
        <path d="M 35 90 Q 35 60 60 60 Q 85 60 85 90" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="120" cy="40" r="15" stroke="currentColor" strokeWidth="1.5" />
        <path d="M 95 90 Q 95 60 120 60 Q 145 60 145 90" stroke="currentColor" strokeWidth="1.5" />
      </motion.svg>
    </div>
  )
}
