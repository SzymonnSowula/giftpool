use anchor_lang::prelude::*;
use crate::state::*;
use crate::errors::GiftPoolError;

pub fn refund_contribution(ctx: Context<crate::RefundContribution>) -> Result<()> {
    let pool = &mut ctx.accounts.pool;
    let contribution = &mut ctx.accounts.contribution;
    let vault = &ctx.accounts.vault;
    let contributor = &ctx.accounts.contributor;

    let now = Clock::get()?.unix_timestamp;
    require!(
        now >= pool.deadline || pool.total_contributed < pool.target_amount,
        GiftPoolError::RefundNotYetAllowed
    );

    let amount = contribution.amount;

    if pool.status == PoolStatus::Open {
        pool.status = PoolStatus::Refunding;
    }

    let vault_seed = pool.key();
    let bump = ctx.bumps.vault;
    let seeds = &[b"vault" as &[u8], vault_seed.as_ref(), &[bump]];
    let signer = &[&seeds[..]];

    let transfer_instruction = anchor_lang::solana_program::system_instruction::transfer(
        &vault.key(),
        &contributor.key(),
        amount,
    );

    anchor_lang::solana_program::program::invoke_signed(
        &transfer_instruction,
        &[
            vault.to_account_info(),
            contributor.to_account_info(),
            ctx.accounts.system_program.to_account_info(),
        ],
        signer,
    )?;

    contribution.refunded = true;
    pool.total_contributed = pool
        .total_contributed
        .checked_sub(amount)
        .ok_or(GiftPoolError::MathOverflow)?;

    msg!(
        "Refunded {} lamports to contributor {}",
        amount,
        contributor.key()
    );
    Ok(())
}
