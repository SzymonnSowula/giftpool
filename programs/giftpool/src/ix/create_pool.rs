use anchor_lang::prelude::*;
use crate::state::*;
use crate::errors::GiftPoolError;

pub fn create_pool(
    ctx: Context<crate::CreatePool>,
    seed: u64,
    name: String,
    target_amount: u64,
    deadline: i64,
) -> Result<()> {
    require!(
        name.len() <= PoolAccount::MAX_NAME_LENGTH,
        GiftPoolError::NameTooLong
    );
    require!(target_amount > 0, GiftPoolError::TargetAmountZero);
    require!(
        deadline > Clock::get()?.unix_timestamp,
        GiftPoolError::DeadlineInPast
    );

    let pool = &mut ctx.accounts.pool;
    pool.organizer = ctx.accounts.organizer.key();
    pool.receiver = ctx.accounts.organizer.key();
    pool.seed = seed;
    pool.name = name;
    pool.target_amount = target_amount;
    pool.total_contributed = 0;
    pool.deadline = deadline;
    pool.status = PoolStatus::Open;
    pool.bump = ctx.bumps.pool;

    msg!("Pool created: {}", pool.name);
    Ok(())
}
