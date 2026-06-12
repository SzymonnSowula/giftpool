import { useMemo } from 'react'
import { useAnchorWallet, useConnection } from '@solana/wallet-adapter-react'
import { AnchorProvider, Program, BN, web3 } from '@coral-xyz/anchor'
import idl from '../idl/giftpool.json'

const PROGRAM_ID = new web3.PublicKey('88S4CSoaugjP3W6mFHq69vmHHa3J7xTaLrE21fzcCxDj')

export function useProgram() {
  const { connection } = useConnection()
  const wallet = useAnchorWallet()

  const provider = useMemo(() => {
    if (!wallet) return null
    return new AnchorProvider(connection, wallet, { commitment: 'confirmed' })
  }, [connection, wallet])

  const program = useMemo(() => {
    if (!provider) return null
    return new Program(idl as any, provider) as any
  }, [provider])

  // Read-only function to fetch all pools directly from connection
  const fetchAllPools = async () => {
    // Discriminator for PoolAccount (from IDL)
    const poolDiscriminator = [116, 210, 187, 119, 196, 196, 52, 137]
    
    const accounts = await connection.getProgramAccounts(PROGRAM_ID, {
      commitment: 'confirmed',
    })
    
    // Decode accounts using IDL
    const { BorshAccountsCoder } = await import('@coral-xyz/anchor')
    const coder = new BorshAccountsCoder(idl as any)
    const pools = accounts
      .filter((a) => {
        // Filter by discriminator (first 8 bytes)
        const data = a.account.data
        if (data.length < 8) return false
        for (let i = 0; i < 8; i++) {
          if (data[i] !== poolDiscriminator[i]) return false
        }
        return true
      })
      .map((a) => {
        try {
          const decoded = coder.decode('PoolAccount', a.account.data)
          // Convert snake_case to camelCase for React components
          return {
            address: a.pubkey,
            organizer: decoded.organizer,
            receiver: decoded.receiver,
            seed: decoded.seed,
            name: decoded.name,
            targetAmount: decoded.target_amount,
            totalContributed: decoded.total_contributed,
            deadline: decoded.deadline,
            status: decoded.status,
            bump: decoded.bump,
          }
        } catch {
          return null
        }
      })
      .filter(Boolean)
    
    return pools
  }

  return { program, provider, wallet, connection, fetchAllPools }
}

export function derivePoolPda(organizer: web3.PublicKey, seed: BN) {
  return web3.PublicKey.findProgramAddressSync(
    [Buffer.from('pool'), organizer.toBuffer(), seed.toArrayLike(Buffer, 'le', 8)],
    PROGRAM_ID,
  )[0]
}

export function deriveVaultPda(pool: web3.PublicKey) {
  return web3.PublicKey.findProgramAddressSync(
    [Buffer.from('vault'), pool.toBuffer()],
    PROGRAM_ID,
  )[0]
}

export function deriveContributionPda(pool: web3.PublicKey, contributor: web3.PublicKey) {
  return web3.PublicKey.findProgramAddressSync(
    [Buffer.from('contribution'), pool.toBuffer(), contributor.toBuffer()],
    PROGRAM_ID,
  )[0]
}

export function lamportsToSol(lamports: BN | number | string): string {
  const val = typeof lamports === 'object' ? lamports.toNumber() : Number(lamports)
  return (val / web3.LAMPORTS_PER_SOL).toFixed(3)
}

export function solToLamports(sol: number): BN {
  return new BN(Math.round(sol * web3.LAMPORTS_PER_SOL))
}
