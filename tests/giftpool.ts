import * as anchor from "@coral-xyz/anchor";
import { Program, BN } from "@coral-xyz/anchor";
import { Giftpool } from "../target/types/giftpool";
import { expect } from "chai";

describe("giftpool", () => {
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace.giftpool as Program<Giftpool>;
  const provider = anchor.getProvider();
  const wallet = provider.wallet as anchor.Wallet;
  const giftReceiver = anchor.web3.Keypair.generate();

  const seed = new BN(1);
  const targetAmount = new BN(1_000_000_000); // 1 SOL
  const deadline = new BN(Math.floor(Date.now() / 1000) + 3600); // 1 hour from now

  const poolPda = anchor.web3.PublicKey.findProgramAddressSync(
    [
      Buffer.from("pool"),
      wallet.publicKey.toBuffer(),
      seed.toArrayLike(Buffer, "le", 8),
    ],
    program.programId
  )[0];

  const vaultPda = anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from("vault"), poolPda.toBuffer()],
    program.programId
  )[0];

  const contributionPda = anchor.web3.PublicKey.findProgramAddressSync(
    [
      Buffer.from("contribution"),
      poolPda.toBuffer(),
      wallet.publicKey.toBuffer(),
    ],
    program.programId
  )[0];

  const anotherContributor = anchor.web3.Keypair.generate();
  const anotherContributionPda = anchor.web3.PublicKey.findProgramAddressSync(
    [
      Buffer.from("contribution"),
      poolPda.toBuffer(),
      anotherContributor.publicKey.toBuffer(),
    ],
    program.programId
  )[0];

  before(async () => {
    const airdrop = await provider.connection.requestAirdrop(
      anotherContributor.publicKey,
      2_000_000_000
    );
    await provider.connection.confirmTransaction(airdrop);
  });

  it("Creates a pool", async () => {
    const tx = await program.methods
      .createPool(
        seed,
        "Birthday Gift",
        targetAmount,
        deadline,
        giftReceiver.publicKey
      )
      .accounts({
        organizer: wallet.publicKey,
        pool: poolPda,
        vault: vaultPda,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();

    console.log("Create pool tx:", tx);

    const pool = await program.account.poolAccount.fetch(poolPda);
    expect(pool.name).to.equal("Birthday Gift");
    expect(pool.targetAmount.toNumber()).to.equal(targetAmount.toNumber());
    expect(pool.receiver.toBase58()).to.equal(
      giftReceiver.publicKey.toBase58()
    );
    expect(pool.status.open).to.not.be.undefined;
  });

  it("Contributes to the pool", async () => {
    const tx = await program.methods
      .contribute(new BN(500_000_000))
      .accounts({
        contributor: wallet.publicKey,
        pool: poolPda,
        vault: vaultPda,
        contribution: contributionPda,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();

    console.log("Contribute tx:", tx);

    const pool = await program.account.poolAccount.fetch(poolPda);
    expect(pool.totalContributed.toNumber()).to.equal(500_000_000);

    const contribution = await program.account.contributionAccount.fetch(
      contributionPda
    );
    expect(contribution.amount.toNumber()).to.equal(500_000_000);
  });

  it("Another contributor adds funds", async () => {
    const tx = await program.methods
      .contribute(new BN(600_000_000))
      .accounts({
        contributor: anotherContributor.publicKey,
        pool: poolPda,
        vault: vaultPda,
        contribution: anotherContributionPda,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([anotherContributor])
      .rpc();

    console.log("Second contribute tx:", tx);

    const pool = await program.account.poolAccount.fetch(poolPda);
    expect(pool.totalContributed.toNumber()).to.equal(1_100_000_000);
  });

  it("Finalizes the pool", async () => {
    const tx = await program.methods
      .finalizePool()
      .accounts({
        organizer: wallet.publicKey,
        pool: poolPda,
        vault: vaultPda,
        receiver: giftReceiver.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();

    console.log("Finalize tx:", tx);

    const pool = await program.account.poolAccount.fetch(poolPda);
    expect(pool.status.closed).to.not.be.undefined;

    const receiverBalance = await provider.connection.getBalance(
      giftReceiver.publicKey
    );
    expect(receiverBalance).to.equal(1_100_000_000);
  });

  // Refund scenario
  const refundSeed = new BN(2);
  const refundPoolPda = anchor.web3.PublicKey.findProgramAddressSync(
    [
      Buffer.from("pool"),
      wallet.publicKey.toBuffer(),
      refundSeed.toArrayLike(Buffer, "le", 8),
    ],
    program.programId
  )[0];

  const refundVaultPda = anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from("vault"), refundPoolPda.toBuffer()],
    program.programId
  )[0];

  const refundContributionPda = anchor.web3.PublicKey.findProgramAddressSync(
    [
      Buffer.from("contribution"),
      refundPoolPda.toBuffer(),
      anotherContributor.publicKey.toBuffer(),
    ],
    program.programId
  )[0];

  it("Creates a pool for refund test", async () => {
    const nearDeadline = new BN(Math.floor(Date.now() / 1000) + 2); // 2 seconds from now

    await program.methods
      .createPool(
        refundSeed,
        "Failed Gift",
        targetAmount,
        nearDeadline,
        wallet.publicKey
      )
      .accounts({
        organizer: wallet.publicKey,
        pool: refundPoolPda,
        vault: refundVaultPda,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();

    const pool = await program.account.poolAccount.fetch(refundPoolPda);
    expect(pool.name).to.equal("Failed Gift");
  });

  it("Contributes to refund pool", async () => {
    await program.methods
      .contribute(new BN(300_000_000))
      .accounts({
        contributor: anotherContributor.publicKey,
        pool: refundPoolPda,
        vault: refundVaultPda,
        contribution: refundContributionPda,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([anotherContributor])
      .rpc();

    const pool = await program.account.poolAccount.fetch(refundPoolPda);
    expect(pool.totalContributed.toNumber()).to.equal(300_000_000);
  });

  it("Refunds contribution after deadline", async () => {
    await new Promise((resolve) => setTimeout(resolve, 3000)); // wait for deadline

    const balanceBefore = await provider.connection.getBalance(
      anotherContributor.publicKey
    );

    const tx = await program.methods
      .refundContribution()
      .accounts({
        contributor: anotherContributor.publicKey,
        pool: refundPoolPda,
        vault: refundVaultPda,
        contribution: refundContributionPda,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([anotherContributor])
      .rpc();

    console.log("Refund tx:", tx);

    let closedContributionError: unknown;
    try {
      await program.account.contributionAccount.fetch(refundContributionPda);
    } catch (error) {
      closedContributionError = error;
    }
    expect(
      closedContributionError,
      "Expected refunded contribution account to be closed"
    ).to.not.be.undefined;

    const balanceAfter = await provider.connection.getBalance(
      anotherContributor.publicKey
    );
    expect(balanceAfter).to.be.greaterThan(balanceBefore - 100_000); // minus fees

    const pool = await program.account.poolAccount.fetch(refundPoolPda);
    expect(pool.status.closed).to.not.be.undefined;
    expect(pool.totalContributed.toNumber()).to.equal(0);
  });

  it("Rejects refunds before deadline even when target is not met", async () => {
    const earlyRefundSeed = new BN(3);
    const earlyRefundPoolPda = anchor.web3.PublicKey.findProgramAddressSync(
      [
        Buffer.from("pool"),
        wallet.publicKey.toBuffer(),
        earlyRefundSeed.toArrayLike(Buffer, "le", 8),
      ],
      program.programId
    )[0];
    const earlyRefundVaultPda = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("vault"), earlyRefundPoolPda.toBuffer()],
      program.programId
    )[0];
    const earlyRefundContributionPda =
      anchor.web3.PublicKey.findProgramAddressSync(
        [
          Buffer.from("contribution"),
          earlyRefundPoolPda.toBuffer(),
          anotherContributor.publicKey.toBuffer(),
        ],
        program.programId
      )[0];

    await program.methods
      .createPool(
        earlyRefundSeed,
        "Early Refund Guard",
        targetAmount,
        new BN(Math.floor(Date.now() / 1000) + 3600),
        wallet.publicKey
      )
      .accounts({
        organizer: wallet.publicKey,
        pool: earlyRefundPoolPda,
        vault: earlyRefundVaultPda,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();

    await program.methods
      .contribute(new BN(100_000_000))
      .accounts({
        contributor: anotherContributor.publicKey,
        pool: earlyRefundPoolPda,
        vault: earlyRefundVaultPda,
        contribution: earlyRefundContributionPda,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([anotherContributor])
      .rpc();

    let refundError: unknown;
    try {
      await program.methods
        .refundContribution()
        .accounts({
          contributor: anotherContributor.publicKey,
          pool: earlyRefundPoolPda,
          vault: earlyRefundVaultPda,
          contribution: earlyRefundContributionPda,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([anotherContributor])
        .rpc();
    } catch (error) {
      refundError = error;
    }

    expect(refundError, "Expected refund before deadline to be rejected").to.not
      .be.undefined;
    expect((refundError as anchor.AnchorError).error.errorCode.code).to.equal(
      "RefundNotYetAllowed"
    );
  });

  it("Rejects refunds after deadline when target was met", async () => {
    const successfulRefundSeed = new BN(4);
    const successfulRefundPoolPda =
      anchor.web3.PublicKey.findProgramAddressSync(
        [
          Buffer.from("pool"),
          wallet.publicKey.toBuffer(),
          successfulRefundSeed.toArrayLike(Buffer, "le", 8),
        ],
        program.programId
      )[0];
    const successfulRefundVaultPda =
      anchor.web3.PublicKey.findProgramAddressSync(
        [Buffer.from("vault"), successfulRefundPoolPda.toBuffer()],
        program.programId
      )[0];
    const successfulRefundContributionPda =
      anchor.web3.PublicKey.findProgramAddressSync(
        [
          Buffer.from("contribution"),
          successfulRefundPoolPda.toBuffer(),
          anotherContributor.publicKey.toBuffer(),
        ],
        program.programId
      )[0];

    await program.methods
      .createPool(
        successfulRefundSeed,
        "Successful Refund Guard",
        new BN(100_000_000),
        new BN(Math.floor(Date.now() / 1000) + 2),
        wallet.publicKey
      )
      .accounts({
        organizer: wallet.publicKey,
        pool: successfulRefundPoolPda,
        vault: successfulRefundVaultPda,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();

    await program.methods
      .contribute(new BN(100_000_000))
      .accounts({
        contributor: anotherContributor.publicKey,
        pool: successfulRefundPoolPda,
        vault: successfulRefundVaultPda,
        contribution: successfulRefundContributionPda,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([anotherContributor])
      .rpc();

    await new Promise((resolve) => setTimeout(resolve, 3000));

    let refundError: unknown;
    try {
      await program.methods
        .refundContribution()
        .accounts({
          contributor: anotherContributor.publicKey,
          pool: successfulRefundPoolPda,
          vault: successfulRefundVaultPda,
          contribution: successfulRefundContributionPda,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([anotherContributor])
        .rpc();
    } catch (error) {
      refundError = error;
    }

    expect(
      refundError,
      "Expected refund after a successful pool to be rejected"
    ).to.not.be.undefined;
    expect((refundError as anchor.AnchorError).error.errorCode.code).to.equal(
      "RefundNotYetAllowed"
    );
  });

  it("Rejects finalize to a receiver that is not stored on the pool", async () => {
    const receiverGuardSeed = new BN(5);
    const receiverGuardPoolPda = anchor.web3.PublicKey.findProgramAddressSync(
      [
        Buffer.from("pool"),
        wallet.publicKey.toBuffer(),
        receiverGuardSeed.toArrayLike(Buffer, "le", 8),
      ],
      program.programId
    )[0];
    const receiverGuardVaultPda = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("vault"), receiverGuardPoolPda.toBuffer()],
      program.programId
    )[0];
    const receiverGuardContributionPda =
      anchor.web3.PublicKey.findProgramAddressSync(
        [
          Buffer.from("contribution"),
          receiverGuardPoolPda.toBuffer(),
          anotherContributor.publicKey.toBuffer(),
        ],
        program.programId
      )[0];

    await program.methods
      .createPool(
        receiverGuardSeed,
        "Receiver Guard",
        new BN(100_000_000),
        new BN(Math.floor(Date.now() / 1000) + 3600),
        giftReceiver.publicKey
      )
      .accounts({
        organizer: wallet.publicKey,
        pool: receiverGuardPoolPda,
        vault: receiverGuardVaultPda,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();

    await program.methods
      .contribute(new BN(100_000_000))
      .accounts({
        contributor: anotherContributor.publicKey,
        pool: receiverGuardPoolPda,
        vault: receiverGuardVaultPda,
        contribution: receiverGuardContributionPda,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([anotherContributor])
      .rpc();

    let finalizeError: unknown;
    try {
      await program.methods
        .finalizePool()
        .accounts({
          organizer: wallet.publicKey,
          pool: receiverGuardPoolPda,
          vault: receiverGuardVaultPda,
          receiver: anchor.web3.Keypair.generate().publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .rpc();
    } catch (error) {
      finalizeError = error;
    }

    expect(finalizeError, "Expected finalize to reject an unstored receiver").to
      .not.be.undefined;
    expect((finalizeError as anchor.AnchorError).error.errorCode.code).to.equal(
      "InvalidReceiver"
    );
  });

  it("Rejects duplicate pool seeds for the same organizer", async () => {
    let duplicateError: unknown;
    try {
      await program.methods
        .createPool(
          seed,
          "Duplicate Birthday Gift",
          targetAmount,
          deadline,
          giftReceiver.publicKey
        )
        .accounts({
          organizer: wallet.publicKey,
          pool: poolPda,
          vault: vaultPda,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .rpc();
    } catch (error) {
      duplicateError = error;
    }

    expect(duplicateError, "Expected duplicate pool creation to fail").to.not.be
      .undefined;
  });

  it("Rejects pools with zero target amount", async () => {
    const zeroTargetSeed = new BN(6);
    const zeroTargetPoolPda = anchor.web3.PublicKey.findProgramAddressSync(
      [
        Buffer.from("pool"),
        wallet.publicKey.toBuffer(),
        zeroTargetSeed.toArrayLike(Buffer, "le", 8),
      ],
      program.programId
    )[0];
    const zeroTargetVaultPda = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("vault"), zeroTargetPoolPda.toBuffer()],
      program.programId
    )[0];

    let createError: unknown;
    try {
      await program.methods
        .createPool(
          zeroTargetSeed,
          "Zero Target",
          new BN(0),
          new BN(Math.floor(Date.now() / 1000) + 3600),
          giftReceiver.publicKey
        )
        .accounts({
          organizer: wallet.publicKey,
          pool: zeroTargetPoolPda,
          vault: zeroTargetVaultPda,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .rpc();
    } catch (error) {
      createError = error;
    }

    expect((createError as anchor.AnchorError).error.errorCode.code).to.equal(
      "TargetAmountZero"
    );
  });

  it("Rejects pools with a past deadline", async () => {
    const pastDeadlineSeed = new BN(7);
    const pastDeadlinePoolPda = anchor.web3.PublicKey.findProgramAddressSync(
      [
        Buffer.from("pool"),
        wallet.publicKey.toBuffer(),
        pastDeadlineSeed.toArrayLike(Buffer, "le", 8),
      ],
      program.programId
    )[0];
    const pastDeadlineVaultPda = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("vault"), pastDeadlinePoolPda.toBuffer()],
      program.programId
    )[0];

    let createError: unknown;
    try {
      await program.methods
        .createPool(
          pastDeadlineSeed,
          "Past Deadline",
          targetAmount,
          new BN(Math.floor(Date.now() / 1000) - 1),
          giftReceiver.publicKey
        )
        .accounts({
          organizer: wallet.publicKey,
          pool: pastDeadlinePoolPda,
          vault: pastDeadlineVaultPda,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .rpc();
    } catch (error) {
      createError = error;
    }

    expect((createError as anchor.AnchorError).error.errorCode.code).to.equal(
      "DeadlineInPast"
    );
  });

  it("Rejects zero-lamport contributions", async () => {
    const zeroContributionSeed = new BN(8);
    const zeroContributionPoolPda =
      anchor.web3.PublicKey.findProgramAddressSync(
        [
          Buffer.from("pool"),
          wallet.publicKey.toBuffer(),
          zeroContributionSeed.toArrayLike(Buffer, "le", 8),
        ],
        program.programId
      )[0];
    const zeroContributionVaultPda =
      anchor.web3.PublicKey.findProgramAddressSync(
        [Buffer.from("vault"), zeroContributionPoolPda.toBuffer()],
        program.programId
      )[0];
    const zeroContributionPda = anchor.web3.PublicKey.findProgramAddressSync(
      [
        Buffer.from("contribution"),
        zeroContributionPoolPda.toBuffer(),
        anotherContributor.publicKey.toBuffer(),
      ],
      program.programId
    )[0];

    await program.methods
      .createPool(
        zeroContributionSeed,
        "Zero Contribution Guard",
        targetAmount,
        new BN(Math.floor(Date.now() / 1000) + 3600),
        giftReceiver.publicKey
      )
      .accounts({
        organizer: wallet.publicKey,
        pool: zeroContributionPoolPda,
        vault: zeroContributionVaultPda,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();

    let contributionError: unknown;
    try {
      await program.methods
        .contribute(new BN(0))
        .accounts({
          contributor: anotherContributor.publicKey,
          pool: zeroContributionPoolPda,
          vault: zeroContributionVaultPda,
          contribution: zeroContributionPda,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([anotherContributor])
        .rpc();
    } catch (error) {
      contributionError = error;
    }

    expect(
      (contributionError as anchor.AnchorError).error.errorCode.code
    ).to.equal("ContributionAmountZero");
  });

  it("Rejects contributions after the deadline", async () => {
    const lateContributionSeed = new BN(9);
    const lateContributionPoolPda =
      anchor.web3.PublicKey.findProgramAddressSync(
        [
          Buffer.from("pool"),
          wallet.publicKey.toBuffer(),
          lateContributionSeed.toArrayLike(Buffer, "le", 8),
        ],
        program.programId
      )[0];
    const lateContributionVaultPda =
      anchor.web3.PublicKey.findProgramAddressSync(
        [Buffer.from("vault"), lateContributionPoolPda.toBuffer()],
        program.programId
      )[0];
    const lateContributionPda = anchor.web3.PublicKey.findProgramAddressSync(
      [
        Buffer.from("contribution"),
        lateContributionPoolPda.toBuffer(),
        anotherContributor.publicKey.toBuffer(),
      ],
      program.programId
    )[0];

    await program.methods
      .createPool(
        lateContributionSeed,
        "Late Contribution Guard",
        targetAmount,
        new BN(Math.floor(Date.now() / 1000) + 2),
        giftReceiver.publicKey
      )
      .accounts({
        organizer: wallet.publicKey,
        pool: lateContributionPoolPda,
        vault: lateContributionVaultPda,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();

    await new Promise((resolve) => setTimeout(resolve, 3000));

    let contributionError: unknown;
    try {
      await program.methods
        .contribute(new BN(100_000_000))
        .accounts({
          contributor: anotherContributor.publicKey,
          pool: lateContributionPoolPda,
          vault: lateContributionVaultPda,
          contribution: lateContributionPda,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([anotherContributor])
        .rpc();
    } catch (error) {
      contributionError = error;
    }

    expect(
      (contributionError as anchor.AnchorError).error.errorCode.code
    ).to.equal("DeadlinePassed");
  });

  it("Rejects finalize from a non-organizer", async () => {
    const unauthorizedSeed = new BN(10);
    const unauthorizedPoolPda = anchor.web3.PublicKey.findProgramAddressSync(
      [
        Buffer.from("pool"),
        wallet.publicKey.toBuffer(),
        unauthorizedSeed.toArrayLike(Buffer, "le", 8),
      ],
      program.programId
    )[0];
    const unauthorizedVaultPda = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("vault"), unauthorizedPoolPda.toBuffer()],
      program.programId
    )[0];
    const unauthorizedContributionPda =
      anchor.web3.PublicKey.findProgramAddressSync(
        [
          Buffer.from("contribution"),
          unauthorizedPoolPda.toBuffer(),
          wallet.publicKey.toBuffer(),
        ],
        program.programId
      )[0];

    await program.methods
      .createPool(
        unauthorizedSeed,
        "Unauthorized Finalize Guard",
        new BN(100_000_000),
        new BN(Math.floor(Date.now() / 1000) + 3600),
        giftReceiver.publicKey
      )
      .accounts({
        organizer: wallet.publicKey,
        pool: unauthorizedPoolPda,
        vault: unauthorizedVaultPda,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();

    await program.methods
      .contribute(new BN(100_000_000))
      .accounts({
        contributor: wallet.publicKey,
        pool: unauthorizedPoolPda,
        vault: unauthorizedVaultPda,
        contribution: unauthorizedContributionPda,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();

    let finalizeError: unknown;
    try {
      await program.methods
        .finalizePool()
        .accounts({
          organizer: anotherContributor.publicKey,
          pool: unauthorizedPoolPda,
          vault: unauthorizedVaultPda,
          receiver: giftReceiver.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([anotherContributor])
        .rpc();
    } catch (error) {
      finalizeError = error;
    }

    expect((finalizeError as anchor.AnchorError).error.errorCode.code).to.equal(
      "Unauthorized"
    );
  });
});
