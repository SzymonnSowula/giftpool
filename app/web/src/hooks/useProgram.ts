import { useCallback, useMemo } from "react";
import { useAnchorWallet, useConnection } from "@solana/wallet-adapter-react";
import { AnchorProvider, BorshAccountsCoder, Program, BN, web3 } from "@coral-xyz/anchor";
import { Buffer } from "buffer";
import idl from "../idl/giftpool.json";
import type { NumericValue, PoolView } from "../types/pool";

const PROGRAM_ID = new web3.PublicKey(
  "88S4CSoaugjP3W6mFHq69vmHHa3J7xTaLrE21fzcCxDj"
);

const POOL_DISCRIMINATOR = [116, 210, 187, 119, 196, 196, 52, 137];
const coder = new BorshAccountsCoder(idl as any);

interface DecodedPoolAccount {
  organizer: web3.PublicKey;
  receiver: web3.PublicKey;
  seed: NumericValue;
  name: string;
  target_amount?: NumericValue;
  targetAmount?: NumericValue;
  total_contributed?: NumericValue;
  totalContributed?: NumericValue;
  deadline: NumericValue;
  status?: Record<string, unknown> | string | null;
  bump?: number;
}

function hasPoolDiscriminator(data: Uint8Array) {
  if (data.length < POOL_DISCRIMINATOR.length) return false;
  return POOL_DISCRIMINATOR.every((byte, index) => data[index] === byte);
}

function decodePoolAccount(address: web3.PublicKey, data: Uint8Array): PoolView | null {
  try {
    const decoded = coder.decode("PoolAccount", Buffer.from(data)) as DecodedPoolAccount;
    return {
      address,
      organizer: decoded.organizer,
      receiver: decoded.receiver,
      seed: decoded.seed,
      name: decoded.name,
      targetAmount: decoded.target_amount ?? decoded.targetAmount ?? 0,
      totalContributed: decoded.total_contributed ?? decoded.totalContributed ?? 0,
      deadline: decoded.deadline,
      status: decoded.status,
      bump: decoded.bump,
    };
  } catch {
    return null;
  }
}

export function useProgram() {
  const { connection } = useConnection();
  const wallet = useAnchorWallet();

  const provider = useMemo(() => {
    if (!wallet) return null;
    return new AnchorProvider(connection, wallet, { commitment: "confirmed" });
  }, [connection, wallet]);

  const program = useMemo(() => {
    if (!provider) return null;
    return new Program(idl as any, provider) as any;
  }, [provider]);

  const fetchPool = useCallback(async (address: web3.PublicKey | string): Promise<PoolView | null> => {
    const poolAddress = typeof address === "string" ? new web3.PublicKey(address) : address;
    const account = await connection.getAccountInfo(poolAddress, "confirmed");
    if (!account || !hasPoolDiscriminator(account.data)) return null;
    return decodePoolAccount(poolAddress, account.data);
  }, [connection]);

  const fetchAllPools = useCallback(async (): Promise<PoolView[]> => {
    const accounts = await connection.getProgramAccounts(PROGRAM_ID, {
      commitment: "confirmed",
    });

    const pools = accounts
      .filter((a) => hasPoolDiscriminator(a.account.data))
      .map((a) => {
        return decodePoolAccount(a.pubkey, a.account.data);
      })
      .filter((pool): pool is PoolView => Boolean(pool));

    return pools;
  }, [connection]);

  return { program, provider, wallet, connection, fetchAllPools, fetchPool };
}

export function derivePoolPda(organizer: web3.PublicKey, seed: BN) {
  return web3.PublicKey.findProgramAddressSync(
    [
      Buffer.from("pool"),
      organizer.toBuffer(),
      seed.toArrayLike(Buffer, "le", 8),
    ],
    PROGRAM_ID
  )[0];
}

export function deriveVaultPda(pool: web3.PublicKey) {
  return web3.PublicKey.findProgramAddressSync(
    [Buffer.from("vault"), pool.toBuffer()],
    PROGRAM_ID
  )[0];
}

export function deriveContributionPda(
  pool: web3.PublicKey,
  contributor: web3.PublicKey
) {
  return web3.PublicKey.findProgramAddressSync(
    [Buffer.from("contribution"), pool.toBuffer(), contributor.toBuffer()],
    PROGRAM_ID
  )[0];
}

export function lamportsToSol(lamports: NumericValue): string {
  const val = (() => {
    if (typeof lamports === "number") return lamports;
    if (typeof lamports === "bigint") return Number(lamports);
    if (typeof lamports === "string") return Number(lamports);
    if ("toNumber" in lamports) return lamports.toNumber();
    return Number(lamports.toString());
  })();
  return (val / web3.LAMPORTS_PER_SOL).toFixed(3);
}

export function solToLamports(sol: number): BN {
  return new BN(Math.round(sol * web3.LAMPORTS_PER_SOL));
}

export function explorerTxUrl(signature: string) {
  return `https://explorer.solana.com/tx/${signature}?cluster=devnet`;
}
