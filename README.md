# GiftPool — Trustless Group-Gift Escrow on Solana

GiftPool is an Anchor program for organizing shared SOL gift pools. Contributors send SOL into a program-controlled vault PDA, the organizer can finalize a successful pool, and contributors can independently refund themselves when a pool misses its deadline and target.

Program ID: `88S4CSoaugjP3W6mFHq69vmHHa3J7xTaLrE21fzcCxDj`

Network: Solana Devnet

## What It Solves

Group gifting usually depends on one person collecting money manually, tracking transfers, and deciding what happens if the plan fails. GiftPool moves those rules on-chain:

- Pool state is public.
- SOL is held by a PDA vault, not by a private wallet.
- Settlement and refunds are enforced by the program.
- Contributors do not need organizer permission to claim a valid refund.

## Solana Architecture

### Accounts

| Account | PDA seeds | Purpose |
|---------|-----------|---------|
| `PoolAccount` | `["pool", organizer, seed]` | Pool metadata, organizer, target, deadline, total contributed, status, bump. |
| `ContributionAccount` | `["contribution", pool, contributor]` | Per-contributor amount, refund flag, bump. |
| `Vault` | `["vault", pool]` | System-owned PDA address holding pooled SOL. Program transfers from it with `invoke_signed`. |

### Pool State Machine

```text
Open -> Closed
  finalize_pool, organizer signer, total_contributed >= target_amount

Open -> Refunding
  first valid refund, deadline passed, total_contributed < target_amount

Refunding -> Closed
  last refund, total_contributed == 0
```

### Instructions

1. `create_pool(seed, name, target_amount, deadline)`
   - Creates `PoolAccount`.
   - Derives the vault PDA.
   - Validates name length, positive target, and future deadline.
   - Sets `receiver` to the organizer for now.

2. `contribute(amount)`
   - Requires `PoolStatus::Open`.
   - Requires current time to be before `deadline`.
   - Transfers SOL from contributor to vault via the System Program.
   - Uses `init_if_needed` for the contributor's PDA so repeated contributions accumulate in one account.

3. `finalize_pool()`
   - Requires organizer signer.
   - Requires `PoolStatus::Open`.
   - Requires `total_contributed >= target_amount`.
   - Transfers tracked pool SOL from vault to the provided receiver account with `invoke_signed`.
   - Sets status to `Closed`.

4. `refund_contribution()`
   - Requires `PoolStatus::Open` or `PoolStatus::Refunding`.
   - Requires `deadline` to have passed.
   - Requires `total_contributed < target_amount`.
   - Requires the caller's contribution to be unrefunded.
   - Transfers the caller's contribution from vault back to the caller with `invoke_signed`.
   - Sets status to `Closed` once all tracked contributions are refunded.

## Solana Ecosystem Fit

The program uses the core Solana patterns expected for this type of escrow:

- **PDAs for deterministic authority**: pool, vault, and contribution addresses are derived from stable seeds.
- **PDA signing via `invoke_signed`**: the vault has no private key; only the program can authorize transfers from it.
- **Anchor account constraints**: signer checks, PDA seed checks, status checks, and custom errors live close to account validation.
- **Checked arithmetic**: contribution totals use checked add/sub operations.
- **One contribution PDA per contributor per pool**: this keeps refunds permissionless and easy to verify.

## Current MVP Constraints

- **SOL only**: SPL tokens are not supported yet.
- **Public data**: pool names, amounts, deadlines, and contributor records are public on-chain.
- **Organizer-controlled final receiver**: only the organizer can finalize, but the receiver account is currently supplied during `finalize_pool`. `PoolAccount.receiver` is initialized to the organizer and reserved for a stricter receiver model.
- **Tracked vault amount**: finalize transfers `pool.total_contributed`. SOL sent directly to the vault outside `contribute` is not tracked by the pool.
- **No account closing flow**: contribution accounts remain on-chain after refund. This is acceptable for an MVP, but a production version should close refunded contribution accounts and return rent.
- **No emitted Anchor events yet**: clients currently rely on account fetches and transaction logs.

## Devnet Deployment

Program ID: `88S4CSoaugjP3W6mFHq69vmHHa3J7xTaLrE21fzcCxDj`

`Anchor.toml` includes both localnet and devnet program mappings. The default provider cluster is localnet for tests; pass `--provider.cluster devnet` for devnet deploys and manual devnet work.

```bash
anchor build
anchor deploy --provider.cluster devnet
```

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

## Local Development

### Prerequisites

- Anchor CLI `0.32.1`
- Solana CLI / Agave CLI
- Rust `1.89.0`
- Node.js with npm

### Commands

```bash
# Build the Anchor program and regenerate IDL/types
anchor build

# Run local validator integration tests
anchor test

# Run the React frontend
cd app/web
npm install
npm run dev
```

## Tests

The Anchor integration suite lives in `tests/giftpool.ts`.

Covered behavior:

- Create pool.
- Contribute from one user.
- Accumulate contributions from another user.
- Finalize a successful pool.
- Refund a failed pool after deadline.
- Reject refund before deadline even when target is not met.
- Reject refund after deadline when the target was met.
- Close a failed pool once all tracked contributions are refunded.

## CLI Client

A minimal TypeScript CLI is included in `app/cli.ts`.

```bash
npx ts-node --transpile-only app/cli.ts create <seed> <name> <target_lamports> <deadline_unix>
npx ts-node --transpile-only app/cli.ts contribute <pool_pubkey> <amount_lamports>
npx ts-node --transpile-only app/cli.ts finalize <pool_pubkey> [receiver_pubkey]
npx ts-node --transpile-only app/cli.ts refund <pool_pubkey>
npx ts-node --transpile-only app/cli.ts info <pool_pubkey>
```

The CLI loads `~/.config/solana/id.json` and connects to Devnet.

## Repository Structure

```text
programs/giftpool/src/
  lib.rs                         Anchor account contexts and instruction handlers
  errors.rs                      Program error codes
  state/
    pool_account.rs              PoolAccount and PoolStatus
    contribution_account.rs      ContributionAccount
tests/giftpool.ts                Anchor integration tests
app/cli.ts                       Devnet CLI client
app/web/                         React frontend
Anchor.toml                      Anchor workspace, localnet/devnet program IDs, test script
```

## Hardening Backlog

- Decide the receiver model: either enforce `pool.receiver` during finalize or add a receiver parameter to `create_pool`.
- Emit Anchor events for pool creation, contributions, finalization, and refunds.
- Add contribution account closing after refund to return rent.
- Add a strategy for accidental direct SOL transfers to the vault PDA.
- Add negative tests for unauthorized finalize, zero amounts, invalid deadlines, duplicate seeds, and contribution after deadline.

## License

MIT
