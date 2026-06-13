import { AnchorProvider, BN, Program, Wallet, web3 } from "@coral-xyz/anchor";
import { Giftpool } from "../target/types/giftpool";
import * as fs from "fs";
import * as path from "path";

const PROGRAM_ID = new web3.PublicKey(
  "88S4CSoaugjP3W6mFHq69vmHHa3J7xTaLrE21fzcCxDj"
);

function getProvider() {
  const home = process.env.HOME || "/home/szymon";
  const keypairPath = path.join(home, ".config/solana/id.json");
  const keypair = web3.Keypair.fromSecretKey(
    Uint8Array.from(JSON.parse(fs.readFileSync(keypairPath, "utf-8")))
  );
  const connection = new web3.Connection(
    "https://api.devnet.solana.com",
    "confirmed"
  );
  const wallet = new Wallet(keypair);
  return new AnchorProvider(connection, wallet, { commitment: "confirmed" });
}

function getProgram(provider: AnchorProvider) {
  const idl = JSON.parse(fs.readFileSync("target/idl/giftpool.json", "utf-8"));
  return new Program(idl, provider) as Program<Giftpool>;
}

function derivePoolPda(organizer: web3.PublicKey, seed: BN) {
  return web3.PublicKey.findProgramAddressSync(
    [
      Buffer.from("pool"),
      organizer.toBuffer(),
      seed.toArrayLike(Buffer, "le", 8),
    ],
    PROGRAM_ID
  )[0];
}

function deriveVaultPda(pool: web3.PublicKey) {
  return web3.PublicKey.findProgramAddressSync(
    [Buffer.from("vault"), pool.toBuffer()],
    PROGRAM_ID
  )[0];
}

function deriveContributionPda(
  pool: web3.PublicKey,
  contributor: web3.PublicKey
) {
  return web3.PublicKey.findProgramAddressSync(
    [Buffer.from("contribution"), pool.toBuffer(), contributor.toBuffer()],
    PROGRAM_ID
  )[0];
}

async function main() {
  const args = process.argv.slice(2);
  const cmd = args[0];
  const provider = getProvider();
  const program = getProgram(provider);
  const wallet = provider.wallet as Wallet;

  if (cmd === "create") {
    const seed = new BN(args[1] || "1");
    const name = args[2] || "Demo Pool";
    const target = new BN(args[3] || "1000000000");
    const deadline = new BN(args[4] || Math.floor(Date.now() / 1000) + 3600);
    const receiver = new web3.PublicKey(args[5] || wallet.publicKey.toBase58());

    const pool = derivePoolPda(wallet.publicKey, seed);
    const vault = deriveVaultPda(pool);

    const tx = await program.methods
      .createPool(seed, name, target, deadline, receiver)
      .accounts({
        organizer: wallet.publicKey,
        pool,
        vault,
        systemProgram: web3.SystemProgram.programId,
      })
      .rpc();

    console.log("Pool created:", pool.toBase58());
    console.log("Receiver:", receiver.toBase58());
    console.log("Tx:", tx);
  } else if (cmd === "contribute") {
    const poolPubkey = new web3.PublicKey(args[1]);
    const amount = new BN(args[2] || "500000000");
    const vault = deriveVaultPda(poolPubkey);
    const contribution = deriveContributionPda(poolPubkey, wallet.publicKey);

    const tx = await program.methods
      .contribute(amount)
      .accounts({
        contributor: wallet.publicKey,
        pool: poolPubkey,
        vault,
        contribution,
        systemProgram: web3.SystemProgram.programId,
      })
      .rpc();

    console.log("Contributed:", amount.toString(), "lamports");
    console.log("Tx:", tx);
  } else if (cmd === "finalize") {
    const poolPubkey = new web3.PublicKey(args[1]);
    const poolData = await program.account.poolAccount.fetch(poolPubkey);
    const receiver = poolData.receiver;
    const vault = deriveVaultPda(poolPubkey);

    const tx = await program.methods
      .finalizePool()
      .accounts({
        organizer: wallet.publicKey,
        pool: poolPubkey,
        vault,
        receiver,
        systemProgram: web3.SystemProgram.programId,
      })
      .rpc();

    console.log("Pool finalized");
    console.log("Tx:", tx);
  } else if (cmd === "refund") {
    const poolPubkey = new web3.PublicKey(args[1]);
    const vault = deriveVaultPda(poolPubkey);
    const contribution = deriveContributionPda(poolPubkey, wallet.publicKey);

    const tx = await program.methods
      .refundContribution()
      .accounts({
        contributor: wallet.publicKey,
        pool: poolPubkey,
        vault,
        contribution,
        systemProgram: web3.SystemProgram.programId,
      })
      .rpc();

    console.log("Refunded");
    console.log("Tx:", tx);
  } else if (cmd === "info") {
    const poolPubkey = new web3.PublicKey(args[1]);
    const pool = await program.account.poolAccount.fetch(poolPubkey);
    console.log("Pool:", pool);
  } else {
    console.log("Usage:");
    console.log(
      "  npx ts-node app/cli.ts create <seed> <name> <target> <deadline> [receiver]"
    );
    console.log("  npx ts-node app/cli.ts contribute <pool> <amount>");
    console.log("  npx ts-node app/cli.ts finalize <pool>");
    console.log("  npx ts-node app/cli.ts refund <pool>");
    console.log("  npx ts-node app/cli.ts info <pool>");
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
