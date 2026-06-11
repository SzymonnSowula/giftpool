# GiftPool — Minimal Trustless Group-Gift Escrow on Solana

GiftPool is a minimal on-chain system for organizing shared gift pools. Friends contribute SOL to a program-controlled vault, and the pool either settles when the goal is reached or refunds contributors if the deadline passes without success.

## The Problem

Today, group gifting works like this: one person collects money via bank transfers or Blik, keeps a manual spreadsheet, and everyone trusts them to not spend it or lose track. There is no transparency, no automatic settlement, and no easy way to get money back if the plan falls through.

## The Solution on Solana

GiftPool replaces the trusted organizer with a neutral on-chain escrow:

- **Organizer** creates a pool with a target amount and a deadline.
- **Contributors** deposit SOL directly into a program-controlled vault (PDA).
- **Finalize**: if the target is met, the organizer can release the funds to a chosen receiver.
- **Refund**: if the deadline passes and the target is not met, anyone can claim their own refund — no organizer permission needed.

All state is public and immutable. The program enforces the rules, not a person.

## Architecture

### Accounts

| Account | Type | Purpose |
|---------|------|---------|
| `PoolAccount` | PDA | Stores organizer, receiver, target, deadline, total contributed, status, bump. |
| `ContributionAccount` | PDA | Per-user record of how much they contributed and whether they refunded. |
| `Vault` | SystemAccount PDA | Holds the pooled SOL. Only the program can sign transfers from it. |

### State Machine

```
Open → Succeeded (finalize, total >= target)
Open → Refunding (first refund after deadline, total < target)
Succeeded → Closed (funds transferred to receiver)
Refunding → Closed (all refunds claimed)
```

### Instructions

1. `create_pool(seed, name, target_amount, deadline)` — creates `PoolAccount` and `Vault` PDA.
2. `contribute(amount)` — transfers SOL to vault, updates `PoolAccount` and `ContributionAccount`.
3. `finalize_pool()` — transfers all SOL from vault to receiver, sets status to `Closed`. Only organizer, only when target met.
4. `refund_contribution()` — transfers a user's contribution back to them. Only after deadline, only if target not met, only once per user.

### PDAs

- Pool: `sha256(["pool", organizer, seed])`
- Vault: `sha256(["vault", pool])`
- Contribution: `sha256(["contribution", pool, contributor])`

## Why Solana

| Feature | Why it matters |
|---------|----------------|
| **Cheap transactions** | Tracking a $20 gift pool is economically viable. |
| **PDA + invoke_signed** | The program can hold and release SOL without a private key. |
| **Deterministic state** | Everyone sees the same target, deadline, and total. No spreadsheet disputes. |
| **Permissionless refunds** | Users don't need the organizer's cooperation to get their money back. |

## Tradeoffs & Constraints

- **Privacy**: pool names, amounts, and contributors are public on-chain.
- **No SPL tokens**: MVP uses SOL only to keep scope minimal.
- **No partial payouts**: the organizer receives the full pool or nothing.
- **No dispute resolution**: the program does not handle disagreements about the gift choice.
- **Gas fees**: contributors pay a small fee per transaction (~0.000005 SOL on Devnet).

## Devnet Deployment

Program ID: `88S4CSoaugjP3W6mFHq69vmHHa3J7xTaLrE21fzcCxDj`

### Demo Transactions

#### Success Path

| Step | Transaction | Explorer |
|------|-------------|----------|
| Create pool | `AcVJesDza2wmQgv3nWmchSn6Bswj9WNwgxCk5CrRZsQuqLUH2WGRtQUnprdaN5MGJ7WS9FxEnXzXnhANJEoX5gx` | https://explorer.solana.com/tx/AcVJesDza2wmQgv3nWmchSn6Bswj9WNwgxCk5CrRZsQuqLUH2WGRtQUnprdaN5MGJ7WS9FxEnXzXnhANJEoX5gx?cluster=devnet |
| Contribute 1 SOL | `3eRCKxuP58GgGpkWNor5d292Ty7JsiHHtTQPciSHgY8UeiVJpnXf11pTfR4nVTJYuWWXfhQbFc9nbHeQPsnLkTpw` | https://explorer.solana.com/tx/3eRCKxuP58GgGpkWNor5d292Ty7JsiHHtTQPciSHgY8UeiVJpnXf11pTfR4nVTJYuWWXfhQbFc9nbHeQPsnLkTpw?cluster=devnet |
| Contribute 1 SOL | `4tRe1Hd2VBGKnTiw3NmYwXQ8njKfUwK72bbHPK4kw1jPDye5eekNwaZhYmTJ5BnPKRagiDK9puWrPpWdD4MDA7pg` | https://explorer.solana.com/tx/4tRe1Hd2VBGKnTiw3NmYwXQ8njKfUwK72bbHPK4kw1jPDye5eekNwaZhYmTJ5BnPKRagiDK9puWrPpWdD4MDA7pg?cluster=devnet |
| Finalize | `5tYUuFCoFphGbjBDK9oAJBCvezMz1dfn4mnFozXpkjKFTKmnv2d5JLEiKKK9dPbgfg7y2hGeKGxEEm9qR8nr4WLw` | https://explorer.solana.com/tx/5tYUuFCoFphGbjBDK9oAJBCvezMz1dfn4mnFozXpkjKFTKmnv2d5JLEiKKK9dPbgfg7y2hGeKGxEEm9qR8nr4WLw?cluster=devnet |

#### Refund Path

| Step | Transaction | Explorer |
|------|-------------|----------|
| Create pool | `Y7bsQMPyNmaCJgcdtjYWB4of2qNS8TYyR2FsGXrWcJtm6kfzehhTaCdx74ifrU11WpexzCgbroymTYU3FkQGfCB` | https://explorer.solana.com/tx/Y7bsQMPyNmaCJgcdtjYWB4of2qNS8TYyR2FsGXrWcJtm6kfzehhTaCdx74ifrU11WpexzCgbroymTYU3FkQGfCB?cluster=devnet |
| Contribute 2 SOL | `5FeoAK1u7hemDycDR4kF3J2b2rCAeHzSYpzhnHwSu7saoyn89GEHc7NMN5AGbPF7S6kA8kvH1BMhiAbsSH8yCjPH` | https://explorer.solana.com/tx/5FeoAK1u7hemDycDR4kF3J2b2rCAeHzSYpzhnHwSu7saoyn89GEHc7NMN5AGbPF7S6kA8kvH1BMhiAbsSH8yCjPH?cluster=devnet |
| Refund | `2qYtMZ3M2LxcuBGH4Z6MZFVR6L79DDMdyEsyf8PrbnLF3kJh4tydDqnhXuDDj7JF7QKgZSMs2JKcC54tUEyUx9g6` | https://explorer.solana.com/tx/2qYtMZ3M2LxcuBGH4Z6MZFVR6L79DDMdyEsyf8PrbnLF3kJh4tydDqnhXuDDj7JF7QKgZSMs2JKcC54tUEyUx9g6?cluster=devnet |

## CLI Client

A minimal TypeScript CLI is included in `app/cli.ts`.

```bash
# Create a pool
npx ts-node --transpile-only app/cli.ts create <seed> <name> <target> <deadline>

# Contribute
npx ts-node --transpile-only app/cli.ts contribute <pool> <amount>

# Finalize
npx ts-node --transpile-only app/cli.ts finalize <pool> [receiver]

# Refund
npx ts-node --transpile-only app/cli.ts refund <pool>

# Info
npx ts-node --transpile-only app/cli.ts info <pool>
```

## Running Tests

```bash
anchor test
```

Tests cover:
- Happy path: create → contribute → contribute → finalize
- Refund path: create → contribute → wait for deadline → refund

## Repo Structure

```
├── programs/giftpool/src/
│   ├── lib.rs              # Program entry point, account structs, instructions
│   ├── state/              # PoolAccount, ContributionAccount, PoolStatus enum
│   └── errors.rs           # Shared error codes
├── tests/giftpool.ts       # Anchor test suite
├── app/cli.ts              # Minimal CLI client
├── Anchor.toml
└── README.md
```

## Tech Stack

- **Language**: Rust (Anchor 0.32.1)
- **Network**: Solana Devnet
- **Client**: TypeScript + Anchor
- **Tests**: Mocha + Chai

## License

MIT
