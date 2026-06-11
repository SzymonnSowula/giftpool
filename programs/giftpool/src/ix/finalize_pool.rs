use anchor_lang::prelude::*;
use crate::state::*;
use crate::errors::GiftPoolError;

pub fn finalize_pool(ctx: Context<crate::FinalizePool>) -> Result<()> {
    let pool = &mut ctx.accounts.pool;
    let vault = &ctx.accounts.vault;
    let receiver = &ctx.accounts.receiver;

    let amount = pool.total_contributed;

    let vault_seed = pool.key();
    let bump = ctx.bumps.vault;
    let seeds = &[b"vault" as &[u8], vault_seed.as_ref(), &[bump]];
    let signer = &[&seeds[..]];

    let transfer_instruction = anchor_lang::solana_program::system_instruction::transfer(
        &vault.key(),
        &receiver.key(),
        amount,
    );

    anchor_lang::solana_program::program::invoke_signed(
        &transfer_instruction,
        &[
            vault.to_account_info(),
            receiver.to_account_info(),
            ctx.accounts.system_program.to_account_info(),
        ],
        signer,
    )?;

    pool.status = PoolStatus::Closed;

    msg!(
        "Pool finalized. Transferred {} lamports to receiver.",
        amount
    );
    Ok(())
}
