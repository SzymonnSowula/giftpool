# TrustPool Design

TrustPool is a Solana escrow for group gifts. The organizer creates a pool, contributors send SOL into a PDA vault, and the program releases funds only to the receiver fixed at creation time once the target is met. If the deadline passes before the target is met, each contributor can claim their own refund.

## Account Model

| Account | Seeds | Purpose |
| --- | --- | --- |
| `PoolAccount` | `["pool", organizer, seed]` | Stores organizer, receiver, target, deadline, status, and tracked total |
| `ContributionAccount` | `["contribution", pool, contributor]` | Tracks one contributor's refundable amount |
| `Vault` | `["vault", pool]` | PDA-owned SOL vault used for finalize and refund transfers |

## State Flow

```text
Open
  | target met, organizer finalizes to stored receiver
  v
Closed

Open
  | deadline passed, target not met, first refund
  v
Refunding
  | all tracked contributions refunded
  v
Closed
```

## Safety Rules

- The receiver is passed to `create_pool` and stored permanently on the pool.
- `finalize_pool` rejects any receiver that does not match the stored receiver.
- Contributions are rejected after the deadline or when the pool is not open.
- Refunds are allowed only after the deadline when the target was not met.
- Contribution accounts close after refund, returning rent to the contributor.
- Anchor events are emitted for create, contribute, finalize, and refund.

## Demo UX

The web app supports pool creation, share links, public pool browsing, contribution actions, finalization, refunds, and Explorer links for transaction/account inspection on devnet.
