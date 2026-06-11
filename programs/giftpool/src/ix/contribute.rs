use anchor_lang::prelude::*;
use anchor_lang::system_program::{transfer, Transfer};
use crate::state::*;
use crate::errors::GiftPoolError;

pub fn contribute(ctx: Context<crate::Contribute>, amount: u64) -> Result<()> {
    require!(amount > 0, GiftPoolError::ContributionAmountZero);

    let pool = &mut ctx.accounts.pool;
    let contribution = &mut ctx.accounts.contribution;

    let cpi_context = CpiContext::new(
        ctx.accounts.system_program.to_account_info(),
        Transfer {
            from: ctx.accounts.contributor.to_account_info(),
            to: ctx.accounts.vault.to_account_info(),
        },
    );
    transfer(cpi_context, amount)?;

    pool.total_contributed = pool
        .total_contributed
        .checked_add(amount)
        .ok_or(GiftPoolError::MathOverflow)?;

    contribution.pool = pool.key();
    contribution.contributor = ctx.accounts.contributor.key();
    contribution.amount = contribution
        .amount
        .checked_add(amount)
        .ok_or(GiftPoolError::MathOverflow)?;
    contribution.refunded = false;
    contribution.bump = ctx.bumps.contribution;

    msg!(
        "Contributed {} lamports to pool {}. Total: {}",
        amount,
        pool.key(),
        pool.total_contributed
    );
    Ok(())
}
