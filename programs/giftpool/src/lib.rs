use anchor_lang::prelude::*;

pub mod errors;
pub mod state;

pub use errors::*;
pub use state::*;

declare_id!("88S4CSoaugjP3W6mFHq69vmHHa3J7xTaLrE21fzcCxDj");

#[derive(Accounts)]
#[instruction(seed: u64)]
pub struct CreatePool<'info> {
    #[account(mut)]
    pub organizer: Signer<'info>,
    #[account(
        init,
        payer = organizer,
        space = PoolAccount::SPACE,
        seeds = [b"pool", organizer.key().as_ref(), seed.to_le_bytes().as_ref()],
        bump,
    )]
    pub pool: Account<'info, PoolAccount>,
    #[account(
        seeds = [b"vault", pool.key().as_ref()],
        bump,
    )]
    pub vault: SystemAccount<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Contribute<'info> {
    #[account(mut)]
    pub contributor: Signer<'info>,
    #[account(
        mut,
        seeds = [b"pool", pool.organizer.as_ref(), pool.seed.to_le_bytes().as_ref()],
        bump = pool.bump,
        constraint = pool.status == PoolStatus::Open @ GiftPoolError::PoolNotOpen,
        constraint = Clock::get()?.unix_timestamp < pool.deadline @ GiftPoolError::DeadlinePassed,
    )]
    pub pool: Account<'info, PoolAccount>,
    #[account(
        mut,
        seeds = [b"vault", pool.key().as_ref()],
        bump,
    )]
    pub vault: SystemAccount<'info>,
    #[account(
        init_if_needed,
        payer = contributor,
        space = ContributionAccount::SPACE,
        seeds = [b"contribution", pool.key().as_ref(), contributor.key().as_ref()],
        bump,
    )]
    pub contribution: Account<'info, ContributionAccount>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct FinalizePool<'info> {
    #[account(mut)]
    pub organizer: Signer<'info>,
    #[account(
        mut,
        seeds = [b"pool", pool.organizer.as_ref(), pool.seed.to_le_bytes().as_ref()],
        bump = pool.bump,
        constraint = pool.organizer == organizer.key() @ GiftPoolError::Unauthorized,
        constraint = pool.status == PoolStatus::Open @ GiftPoolError::PoolNotOpen,
        constraint = pool.total_contributed >= pool.target_amount @ GiftPoolError::TargetNotMet,
    )]
    pub pool: Account<'info, PoolAccount>,
    #[account(
        mut,
        seeds = [b"vault", pool.key().as_ref()],
        bump,
    )]
    pub vault: SystemAccount<'info>,
    #[account(mut)]
    pub receiver: SystemAccount<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct RefundContribution<'info> {
    #[account(mut)]
    pub contributor: Signer<'info>,
    #[account(
        mut,
        seeds = [b"pool", pool.organizer.as_ref(), pool.seed.to_le_bytes().as_ref()],
        bump = pool.bump,
        constraint = pool.status == PoolStatus::Open || pool.status == PoolStatus::Refunding @ GiftPoolError::PoolNotRefundable,
    )]
    pub pool: Account<'info, PoolAccount>,
    #[account(
        mut,
        seeds = [b"vault", pool.key().as_ref()],
        bump,
    )]
    pub vault: SystemAccount<'info>,
    #[account(
        mut,
        close = contributor,
        seeds = [b"contribution", pool.key().as_ref(), contributor.key().as_ref()],
        bump = contribution.bump,
        constraint = contribution.contributor == contributor.key() @ GiftPoolError::Unauthorized,
        constraint = !contribution.refunded @ GiftPoolError::AlreadyRefunded,
    )]
    pub contribution: Account<'info, ContributionAccount>,
    pub system_program: Program<'info, System>,
}

#[event]
pub struct PoolCreated {
    pub pool: Pubkey,
    pub organizer: Pubkey,
    pub receiver: Pubkey,
    pub seed: u64,
    pub target_amount: u64,
    pub deadline: i64,
}

#[event]
pub struct ContributionMade {
    pub pool: Pubkey,
    pub contributor: Pubkey,
    pub amount: u64,
    pub total_contributed: u64,
}

#[event]
pub struct PoolFinalized {
    pub pool: Pubkey,
    pub receiver: Pubkey,
    pub amount: u64,
}

#[event]
pub struct ContributionRefunded {
    pub pool: Pubkey,
    pub contributor: Pubkey,
    pub amount: u64,
    pub remaining_contributed: u64,
}

#[program]
pub mod giftpool {
    use super::*;
    use anchor_lang::system_program::{transfer, Transfer};

    pub fn create_pool(
        ctx: Context<CreatePool>,
        seed: u64,
        name: String,
        target_amount: u64,
        deadline: i64,
        receiver: Pubkey,
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
        pool.receiver = receiver;
        pool.seed = seed;
        pool.name = name;
        pool.target_amount = target_amount;
        pool.total_contributed = 0;
        pool.deadline = deadline;
        pool.status = PoolStatus::Open;
        pool.bump = ctx.bumps.pool;

        emit!(PoolCreated {
            pool: pool.key(),
            organizer: pool.organizer,
            receiver: pool.receiver,
            seed,
            target_amount,
            deadline,
        });

        msg!("Pool created: {}", pool.name);
        Ok(())
    }

    pub fn contribute(ctx: Context<Contribute>, amount: u64) -> Result<()> {
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

        emit!(ContributionMade {
            pool: pool.key(),
            contributor: contribution.contributor,
            amount,
            total_contributed: pool.total_contributed,
        });

        msg!(
            "Contributed {} lamports to pool {}. Total: {}",
            amount,
            pool.key(),
            pool.total_contributed
        );
        Ok(())
    }

    pub fn finalize_pool(ctx: Context<FinalizePool>) -> Result<()> {
        let pool = &mut ctx.accounts.pool;
        let vault = &ctx.accounts.vault;
        let receiver = &ctx.accounts.receiver;

        require!(
            receiver.key() == pool.receiver,
            GiftPoolError::InvalidReceiver
        );

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

        emit!(PoolFinalized {
            pool: pool.key(),
            receiver: receiver.key(),
            amount,
        });

        msg!(
            "Pool finalized. Transferred {} lamports to receiver.",
            amount
        );
        Ok(())
    }

    pub fn refund_contribution(ctx: Context<RefundContribution>) -> Result<()> {
        let pool = &mut ctx.accounts.pool;
        let contribution = &mut ctx.accounts.contribution;
        let vault = &ctx.accounts.vault;
        let contributor = &ctx.accounts.contributor;

        let now = Clock::get()?.unix_timestamp;
        require!(
            now >= pool.deadline && pool.total_contributed < pool.target_amount,
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

        if pool.total_contributed == 0 {
            pool.status = PoolStatus::Closed;
        }

        emit!(ContributionRefunded {
            pool: pool.key(),
            contributor: contributor.key(),
            amount,
            remaining_contributed: pool.total_contributed,
        });

        msg!(
            "Refunded {} lamports to contributor {}",
            amount,
            contributor.key()
        );
        Ok(())
    }
}
