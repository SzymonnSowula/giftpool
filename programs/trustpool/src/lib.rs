use anchor_lang::prelude::*;

pub mod errors;
pub mod state;

pub use errors::*;
pub use state::*;

declare_id!("88S4CSoaugjP3W6mFHq69vmHHa3J7xTaLrE21fzcCxDj");

// ============================================================================
// ACCOUNT STRUCTS
// ============================================================================

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
    #[account(seeds = [b"vault", pool.key().as_ref()], bump)]
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
        constraint = pool.status == PoolStatus::Open @ TrustPoolError::PoolNotOpen,
        constraint = Clock::get()?.unix_timestamp < pool.deadline @ TrustPoolError::DeadlinePassed,
    )]
    pub pool: Account<'info, PoolAccount>,
    #[account(mut, seeds = [b"vault", pool.key().as_ref()], bump)]
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
        constraint = pool.organizer == organizer.key() @ TrustPoolError::Unauthorized,
        constraint = pool.status == PoolStatus::Open @ TrustPoolError::PoolNotOpen,
        constraint = pool.total_contributed >= pool.target_amount @ TrustPoolError::TargetNotMet,
    )]
    pub pool: Account<'info, PoolAccount>,
    #[account(mut, seeds = [b"vault", pool.key().as_ref()], bump)]
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
        constraint = pool.status == PoolStatus::Open || pool.status == PoolStatus::Refunding @ TrustPoolError::PoolNotRefundable,
    )]
    pub pool: Account<'info, PoolAccount>,
    #[account(mut, seeds = [b"vault", pool.key().as_ref()], bump)]
    pub vault: SystemAccount<'info>,
    #[account(
        mut,
        close = contributor,
        seeds = [b"contribution", pool.key().as_ref(), contributor.key().as_ref()],
        bump = contribution.bump,
        constraint = contribution.contributor == contributor.key() @ TrustPoolError::Unauthorized,
        constraint = !contribution.refunded @ TrustPoolError::AlreadyRefunded,
    )]
    pub contribution: Account<'info, ContributionAccount>,
    pub system_program: Program<'info, System>,
}

// MILESTONE

#[derive(Accounts)]
#[instruction(index: u8)]
pub struct CreateMilestone<'info> {
    #[account(mut)]
    pub organizer: Signer<'info>,
    #[account(
        mut,
        seeds = [b"pool", pool.organizer.as_ref(), pool.seed.to_le_bytes().as_ref()],
        bump = pool.bump,
        constraint = pool.organizer == organizer.key() @ TrustPoolError::Unauthorized,
        constraint = pool.status == PoolStatus::Open @ TrustPoolError::PoolNotOpen,
    )]
    pub pool: Account<'info, PoolAccount>,
    #[account(
        init,
        payer = organizer,
        space = MilestoneAccount::SPACE,
        seeds = [b"milestone", pool.key().as_ref(), &[index]],
        bump,
    )]
    pub milestone: Account<'info, MilestoneAccount>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(index: u8)]
pub struct ApproveMilestone<'info> {
    #[account(mut)]
    pub contributor: Signer<'info>,
    #[account(
        mut,
        seeds = [b"pool", pool.organizer.as_ref(), pool.seed.to_le_bytes().as_ref()],
        bump = pool.bump,
    )]
    pub pool: Account<'info, PoolAccount>,
    #[account(
        mut,
        seeds = [b"milestone", pool.key().as_ref(), &[index]],
        bump = milestone.bump,
    )]
    pub milestone: Account<'info, MilestoneAccount>,
    #[account(
        mut,
        seeds = [b"contribution", pool.key().as_ref(), contributor.key().as_ref()],
        bump = contribution.bump,
        constraint = contribution.contributor == contributor.key() @ TrustPoolError::Unauthorized,
    )]
    pub contribution: Account<'info, ContributionAccount>,
}

#[derive(Accounts)]
#[instruction(index: u8)]
pub struct ReleaseMilestone<'info> {
    #[account(mut)]
    pub organizer: Signer<'info>,
    #[account(
        mut,
        seeds = [b"pool", pool.organizer.as_ref(), pool.seed.to_le_bytes().as_ref()],
        bump = pool.bump,
        constraint = pool.organizer == organizer.key() @ TrustPoolError::Unauthorized,
    )]
    pub pool: Account<'info, PoolAccount>,
    #[account(
        mut,
        seeds = [b"milestone", pool.key().as_ref(), &[index]],
        bump = milestone.bump,
        constraint = !milestone.released @ TrustPoolError::MilestoneAlreadyReleased,
    )]
    pub milestone: Account<'info, MilestoneAccount>,
    #[account(mut, seeds = [b"vault", pool.key().as_ref()], bump)]
    pub vault: SystemAccount<'info>,
    #[account(mut)]
    pub receiver: SystemAccount<'info>,
    pub system_program: Program<'info, System>,
}

// RECURRING

#[derive(Accounts)]
pub struct RolloverPool<'info> {
    #[account(mut)]
    pub organizer: Signer<'info>,
    #[account(
        mut,
        seeds = [b"pool", pool.organizer.as_ref(), pool.seed.to_le_bytes().as_ref()],
        bump = pool.bump,
        constraint = pool.organizer == organizer.key() @ TrustPoolError::Unauthorized,
        constraint = pool.status == PoolStatus::Closed @ TrustPoolError::PoolNotClosedForRollover,
        constraint = pool.recurrence != Recurrence::None @ TrustPoolError::PoolNotRecurring,
    )]
    pub pool: Account<'info, PoolAccount>,
}

// VOTING

#[derive(Accounts)]
#[instruction(index: u8)]
pub struct CreateCandidate<'info> {
    #[account(mut)]
    pub organizer: Signer<'info>,
    #[account(
        mut,
        seeds = [b"pool", pool.organizer.as_ref(), pool.seed.to_le_bytes().as_ref()],
        bump = pool.bump,
        constraint = pool.organizer == organizer.key() @ TrustPoolError::Unauthorized,
        constraint = pool.status == PoolStatus::Open @ TrustPoolError::PoolNotOpen,
        constraint = pool.voting_mode == VotingMode::ContributorVote @ TrustPoolError::PoolNotVotingMode,
    )]
    pub pool: Account<'info, PoolAccount>,
    #[account(
        init,
        payer = organizer,
        space = CandidateAccount::SPACE,
        seeds = [b"candidate", pool.key().as_ref(), &[index]],
        bump,
    )]
    pub candidate: Account<'info, CandidateAccount>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct FinalizeWithVoting<'info> {
    #[account(mut)]
    pub organizer: Signer<'info>,
    #[account(
        mut,
        seeds = [b"pool", pool.organizer.as_ref(), pool.seed.to_le_bytes().as_ref()],
        bump = pool.bump,
        constraint = pool.organizer == organizer.key() @ TrustPoolError::Unauthorized,
        constraint = pool.status == PoolStatus::Open @ TrustPoolError::PoolNotOpen,
        constraint = pool.total_contributed >= pool.target_amount @ TrustPoolError::TargetNotMet,
        constraint = pool.voting_mode == VotingMode::ContributorVote @ TrustPoolError::PoolNotVotingMode,
    )]
    pub pool: Account<'info, PoolAccount>,
    #[account(mut, seeds = [b"vault", pool.key().as_ref()], bump)]
    pub vault: SystemAccount<'info>,
    #[account(mut)]
    pub winner: SystemAccount<'info>,
    pub system_program: Program<'info, System>,
}

// TIME-BANKING

#[derive(Accounts)]
#[instruction(service_seed: u64)]
pub struct OfferService<'info> {
    #[account(mut)]
    pub provider: Signer<'info>,
    #[account(
        seeds = [b"pool", pool.organizer.as_ref(), pool.seed.to_le_bytes().as_ref()],
        bump = pool.bump,
    )]
    pub pool: Account<'info, PoolAccount>,
    #[account(
        init,
        payer = provider,
        space = ServiceOfferingAccount::SPACE,
        seeds = [b"service", pool.key().as_ref(), provider.key().as_ref(), service_seed.to_le_bytes().as_ref()],
        bump,
    )]
    pub service: Account<'info, ServiceOfferingAccount>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(service_seed: u64)]
pub struct RequestService<'info> {
    #[account(mut)]
    pub requester: Signer<'info>,
    #[account(
        mut,
        seeds = [b"service", pool.key().as_ref(), service.provider.as_ref(), service_seed.to_le_bytes().as_ref()],
        bump = service.bump,
        constraint = service.available @ TrustPoolError::ServiceNotAvailable,
    )]
    pub service: Account<'info, ServiceOfferingAccount>,
    #[account(
        mut,
        seeds = [b"credit", pool.key().as_ref(), requester.key().as_ref()],
        bump,
        constraint = credit.hours >= service.hours_cost @ TrustPoolError::InsufficientCredits,
    )]
    pub credit: Account<'info, TimeCreditAccount>,
    #[account(
        init,
        payer = requester,
        space = ServiceExchangeAccount::SPACE,
        seeds = [b"exchange", service.key().as_ref(), requester.key().as_ref()],
        bump,
    )]
    pub exchange: Account<'info, ServiceExchangeAccount>,
    #[account(
        seeds = [b"pool", pool.organizer.as_ref(), pool.seed.to_le_bytes().as_ref()],
        bump = pool.bump,
    )]
    pub pool: Account<'info, PoolAccount>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(service_seed: u64)]
pub struct CompleteService<'info> {
    #[account(mut)]
    pub provider: Signer<'info>,
    #[account(
        mut,
        seeds = [b"exchange", service.key().as_ref(), exchange.requester.as_ref()],
        bump = exchange.bump,
        constraint = exchange.status == ExchangeStatus::Pending @ TrustPoolError::ExchangeNotPending,
        constraint = service.provider == provider.key() @ TrustPoolError::Unauthorized,
    )]
    pub exchange: Account<'info, ServiceExchangeAccount>,
    #[account(
        mut,
        seeds = [b"service", pool.key().as_ref(), service.provider.as_ref(), service_seed.to_le_bytes().as_ref()],
        bump = service.bump,
    )]
    pub service: Account<'info, ServiceOfferingAccount>,
    #[account(
        seeds = [b"pool", pool.organizer.as_ref(), pool.seed.to_le_bytes().as_ref()],
        bump = pool.bump,
    )]
    pub pool: Account<'info, PoolAccount>,
}

#[derive(Accounts)]
#[instruction(service_seed: u64)]
pub struct DisputeService<'info> {
    #[account(mut)]
    pub requester: Signer<'info>,
    #[account(
        mut,
        seeds = [b"exchange", service.key().as_ref(), exchange.requester.as_ref()],
        bump = exchange.bump,
        constraint = exchange.status == ExchangeStatus::Pending @ TrustPoolError::ExchangeNotPending,
        constraint = exchange.requester == requester.key() @ TrustPoolError::Unauthorized,
    )]
    pub exchange: Account<'info, ServiceExchangeAccount>,
    #[account(
        mut,
        seeds = [b"credit", pool.key().as_ref(), exchange.requester.as_ref()],
        bump = credit.bump,
    )]
    pub credit: Account<'info, TimeCreditAccount>,
    #[account(
        mut,
        seeds = [b"service", pool.key().as_ref(), service.provider.as_ref(), service_seed.to_le_bytes().as_ref()],
        bump = service.bump,
    )]
    pub service: Account<'info, ServiceOfferingAccount>,
    #[account(
        seeds = [b"pool", pool.organizer.as_ref(), pool.seed.to_le_bytes().as_ref()],
        bump = pool.bump,
    )]
    pub pool: Account<'info, PoolAccount>,
}

// SPLIT BILL

#[derive(Accounts)]
pub struct CreateSplitMember<'info> {
    #[account(mut)]
    pub organizer: Signer<'info>,
    #[account(
        mut,
        seeds = [b"pool", pool.organizer.as_ref(), pool.seed.to_le_bytes().as_ref()],
        bump = pool.bump,
        constraint = pool.organizer == organizer.key() @ TrustPoolError::Unauthorized,
        constraint = pool.status == PoolStatus::Open @ TrustPoolError::PoolNotOpen,
        constraint = pool.split_members_count < 10 @ TrustPoolError::TooManySplitMembers,
    )]
    pub pool: Account<'info, PoolAccount>,
    #[account(
        init,
        payer = organizer,
        space = SplitMemberAccount::SPACE,
        seeds = [b"split", pool.key().as_ref(), member.key().as_ref()],
        bump,
    )]
    pub split_member: Account<'info, SplitMemberAccount>,
    /// CHECK: member pubkey
    pub member: UncheckedAccount<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct SettleSplit<'info> {
    #[account(mut)]
    pub organizer: Signer<'info>,
    #[account(
        mut,
        seeds = [b"pool", pool.organizer.as_ref(), pool.seed.to_le_bytes().as_ref()],
        bump = pool.bump,
        constraint = pool.organizer == organizer.key() @ TrustPoolError::Unauthorized,
        constraint = pool.status == PoolStatus::Closed @ TrustPoolError::PoolNotClosedForRollover,
    )]
    pub pool: Account<'info, PoolAccount>,
    #[account(
        mut,
        seeds = [b"split", pool.key().as_ref(), split_member.member.as_ref()],
        bump = split_member.bump,
        constraint = !split_member.settled @ TrustPoolError::SplitAlreadySettled,
    )]
    pub split_member: Account<'info, SplitMemberAccount>,
    #[account(mut, seeds = [b"vault", pool.key().as_ref()], bump)]
    pub vault: SystemAccount<'info>,
    #[account(mut)]
    pub member: SystemAccount<'info>,
    pub system_program: Program<'info, System>,
}

// ============================================================================
// EVENTS
// ============================================================================

#[event]
pub struct PoolCreated { pub pool: Pubkey, pub organizer: Pubkey, pub receiver: Pubkey, pub target_amount: u64, pub deadline: i64 }
#[event]
pub struct ContributionMade { pub pool: Pubkey, pub contributor: Pubkey, pub amount: u64, pub total: u64 }
#[event]
pub struct PoolFinalized { pub pool: Pubkey, pub receiver: Pubkey, pub amount: u64 }
#[event]
pub struct ContributionRefunded { pub pool: Pubkey, pub contributor: Pubkey, pub amount: u64 }
#[event]
pub struct MilestoneCreated { pub pool: Pubkey, pub index: u8, pub amount: u64 }
#[event]
pub struct MilestoneApproved { pub pool: Pubkey, pub index: u8, pub contributor: Pubkey }
#[event]
pub struct MilestoneReleased { pub pool: Pubkey, pub index: u8, pub amount: u64 }
#[event]
pub struct PoolRolledOver { pub pool: Pubkey, pub cycle: u8, pub new_deadline: i64 }
#[event]
pub struct CandidateCreated { pub pool: Pubkey, pub index: u8, pub pubkey: Pubkey }
#[event]
pub struct ServiceOffered { pub pool: Pubkey, pub provider: Pubkey, pub hours_cost: u64 }
#[event]
pub struct ServiceRequested { pub pool: Pubkey, pub requester: Pubkey, pub provider: Pubkey, pub hours: u64 }
#[event]
pub struct ServiceCompleted { pub pool: Pubkey, pub requester: Pubkey, pub provider: Pubkey, pub hours: u64 }
#[event]
pub struct ServiceDisputed { pub pool: Pubkey, pub requester: Pubkey, pub hours: u64 }
#[event]
pub struct SplitMemberCreated { pub pool: Pubkey, pub member: Pubkey, pub weight: u16 }
#[event]
pub struct SplitSettled { pub pool: Pubkey, pub member: Pubkey, pub amount: u64 }

// ============================================================================
// PROGRAM
// ============================================================================

#[program]
pub mod trustpool {
    use super::*;
    use anchor_lang::system_program::{transfer, Transfer};

    // ---- CORE ----

    pub fn create_pool(
        ctx: Context<CreatePool>, seed: u64, name: String, target_amount: u64,
        deadline: i64, receiver: Pubkey, recurrence: Recurrence, max_cycles: u8,
        voting_mode: VotingMode, split_type: SplitType,
    ) -> Result<()> {
        require!(name.len() <= PoolAccount::MAX_NAME_LENGTH, TrustPoolError::NameTooLong);
        require!(target_amount > 0, TrustPoolError::TargetAmountZero);
        require!(deadline > Clock::get()?.unix_timestamp, TrustPoolError::DeadlineInPast);

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
        pool.recurrence = recurrence;
        pool.cycle_count = 0;
        pool.max_cycles = max_cycles;
        pool.voting_mode = voting_mode;
        pool.candidates_count = 0;
        pool.split_type = split_type;
        pool.split_members_count = 0;
        pool.milestones_count = 0;
        pool.milestones_released = 0;

        emit!(PoolCreated { pool: pool.key(), organizer: pool.organizer, receiver, target_amount, deadline });
        Ok(())
    }

    pub fn contribute(ctx: Context<Contribute>, amount: u64, candidate_index: u8) -> Result<()> {
        require!(amount > 0, TrustPoolError::ContributionAmountZero);

        let transfer_ctx = CpiContext::new(
            ctx.accounts.system_program.to_account_info(),
            Transfer { from: ctx.accounts.contributor.to_account_info(), to: ctx.accounts.vault.to_account_info() },
        );
        transfer(transfer_ctx, amount)?;

        let pool = &mut ctx.accounts.pool;
        pool.total_contributed = pool.total_contributed.checked_add(amount).ok_or(TrustPoolError::MathOverflow)?;

        let c = &mut ctx.accounts.contribution;
        c.pool = pool.key();
        c.contributor = ctx.accounts.contributor.key();
        c.amount = c.amount.checked_add(amount).ok_or(TrustPoolError::MathOverflow)?;
        c.refunded = false;
        c.bump = ctx.bumps.contribution;
        c.candidate_index = candidate_index;
        c.has_voted = pool.voting_mode == VotingMode::ContributorVote;
        c.milestone_approvals = 0;
        c.credits_earned = 0;

        emit!(ContributionMade { pool: pool.key(), contributor: c.contributor, amount, total: pool.total_contributed });
        Ok(())
    }

    pub fn finalize_pool(ctx: Context<FinalizePool>) -> Result<()> {
        let pool = &mut ctx.accounts.pool;
        let vault = &ctx.accounts.vault;
        let receiver = &ctx.accounts.receiver;
        require!(receiver.key() == pool.receiver, TrustPoolError::InvalidReceiver);

        let amount = pool.total_contributed;
        let bump = ctx.bumps.vault;
        let pool_key = pool.key();
        let seeds = &[b"vault" as &[u8], pool_key.as_ref(), &[bump]];
        let signer = &[&seeds[..]];

        anchor_lang::solana_program::program::invoke_signed(
            &anchor_lang::solana_program::system_instruction::transfer(&vault.key(), &receiver.key(), amount),
            &[vault.to_account_info(), receiver.to_account_info(), ctx.accounts.system_program.to_account_info()],
            signer,
        )?;

        pool.status = PoolStatus::Closed;
        emit!(PoolFinalized { pool: pool.key(), receiver: receiver.key(), amount });
        Ok(())
    }

    pub fn refund_contribution(ctx: Context<RefundContribution>) -> Result<()> {
        let pool = &mut ctx.accounts.pool;
        let contribution = &mut ctx.accounts.contribution;
        let vault = &ctx.accounts.vault;
        let contributor = &ctx.accounts.contributor;

        let now = Clock::get()?.unix_timestamp;
        require!(now >= pool.deadline && pool.total_contributed < pool.target_amount, TrustPoolError::RefundNotYetAllowed);

        let amount = contribution.amount;
        if pool.status == PoolStatus::Open { pool.status = PoolStatus::Refunding; }

        let bump = ctx.bumps.vault;
        let pool_key = pool.key();
        let seeds = &[b"vault" as &[u8], pool_key.as_ref(), &[bump]];
        let signer = &[&seeds[..]];

        anchor_lang::solana_program::program::invoke_signed(
            &anchor_lang::solana_program::system_instruction::transfer(&vault.key(), &contributor.key(), amount),
            &[vault.to_account_info(), contributor.to_account_info(), ctx.accounts.system_program.to_account_info()],
            signer,
        )?;

        contribution.refunded = true;
        pool.total_contributed = pool.total_contributed.checked_sub(amount).ok_or(TrustPoolError::MathOverflow)?;
        if pool.total_contributed == 0 { pool.status = PoolStatus::Closed; }

        emit!(ContributionRefunded { pool: pool.key(), contributor: contributor.key(), amount });
        Ok(())
    }

    // ---- MILESTONES ----

    pub fn create_milestone(ctx: Context<CreateMilestone>, index: u8, description: String, amount: u64) -> Result<()> {
        require!(description.len() <= MilestoneAccount::MAX_DESCRIPTION_LENGTH, TrustPoolError::MilestoneDescriptionTooLong);
        require!(amount > 0, TrustPoolError::MilestoneAmountZero);
        require!(index == ctx.accounts.pool.milestones_count, TrustPoolError::MilestoneIndexOutOfRange);

        let m = &mut ctx.accounts.milestone;
        m.pool = ctx.accounts.pool.key();
        m.index = index;
        m.description = description;
        m.amount = amount;
        m.approved = false;
        m.approvals_count = 0;
        m.released = false;
        m.bump = ctx.bumps.milestone;

        ctx.accounts.pool.milestones_count = ctx.accounts.pool.milestones_count.checked_add(1).ok_or(TrustPoolError::MathOverflow)?;
        emit!(MilestoneCreated { pool: ctx.accounts.pool.key(), index, amount });
        Ok(())
    }

    pub fn approve_milestone(ctx: Context<ApproveMilestone>, index: u8) -> Result<()> {
        let c = &mut ctx.accounts.contribution;
        let m = &mut ctx.accounts.milestone;
        require!(index == m.index, TrustPoolError::MilestoneIndexOutOfRange);

        let bit = 1u8.checked_shl(index as u32).ok_or(TrustPoolError::MilestoneIndexOutOfRange)?;
        require!((c.milestone_approvals & bit) == 0, TrustPoolError::MilestoneAlreadyApproved);

        c.milestone_approvals |= bit;
        m.approvals_count = m.approvals_count.checked_add(1).ok_or(TrustPoolError::MathOverflow)?;

        emit!(MilestoneApproved { pool: ctx.accounts.pool.key(), index, contributor: c.contributor });
        Ok(())
    }

    pub fn release_milestone(ctx: Context<ReleaseMilestone>, index: u8) -> Result<()> {
        let pool = &mut ctx.accounts.pool;
        let m = &mut ctx.accounts.milestone;
        let vault = &ctx.accounts.vault;
        let receiver = &ctx.accounts.receiver;

        require!(index == m.index, TrustPoolError::MilestoneIndexOutOfRange);
        require!(receiver.key() == pool.receiver, TrustPoolError::InvalidReceiver);
        require!(m.approvals_count > 0, TrustPoolError::MilestoneNotApproved);

        let amount = m.amount;
        let bump = ctx.bumps.vault;
        let pool_key = pool.key();
        let seeds = &[b"vault" as &[u8], pool_key.as_ref(), &[bump]];
        let signer = &[&seeds[..]];

        anchor_lang::solana_program::program::invoke_signed(
            &anchor_lang::solana_program::system_instruction::transfer(&vault.key(), &receiver.key(), amount),
            &[vault.to_account_info(), receiver.to_account_info(), ctx.accounts.system_program.to_account_info()],
            signer,
        )?;

        m.released = true;
        pool.milestones_released = pool.milestones_released.checked_add(1).ok_or(TrustPoolError::MathOverflow)?;
        pool.total_contributed = pool.total_contributed.checked_sub(amount).ok_or(TrustPoolError::MathOverflow)?;
        if pool.milestones_released == pool.milestones_count { pool.status = PoolStatus::Closed; }

        emit!(MilestoneReleased { pool: pool.key(), index, amount });
        Ok(())
    }

    // ---- RECURRING ----

    pub fn rollover_pool(ctx: Context<RolloverPool>) -> Result<()> {
        let pool = &mut ctx.accounts.pool;
        require!(pool.max_cycles == 0 || pool.cycle_count < pool.max_cycles, TrustPoolError::MaxCyclesReached);

        let now = Clock::get()?.unix_timestamp;
        let new_deadline = match pool.recurrence {
            Recurrence::Weekly => now.checked_add(7 * 86400).ok_or(TrustPoolError::MathOverflow)?,
            Recurrence::Monthly => now.checked_add(30 * 86400).ok_or(TrustPoolError::MathOverflow)?,
            Recurrence::None => return Err(TrustPoolError::PoolNotRecurring.into()),
        };

        pool.cycle_count = pool.cycle_count.checked_add(1).ok_or(TrustPoolError::MathOverflow)?;
        pool.total_contributed = 0;
        pool.deadline = new_deadline;
        pool.status = PoolStatus::Open;

        emit!(PoolRolledOver { pool: pool.key(), cycle: pool.cycle_count, new_deadline });
        Ok(())
    }

    // ---- VOTING ----

    pub fn create_candidate(ctx: Context<CreateCandidate>, index: u8, pubkey: Pubkey) -> Result<()> {
        require!(index == ctx.accounts.pool.candidates_count, TrustPoolError::CandidateIndexOutOfRange);

        let c = &mut ctx.accounts.candidate;
        c.pool = ctx.accounts.pool.key();
        c.index = index;
        c.pubkey = pubkey;
        c.votes = 0;
        c.bump = ctx.bumps.candidate;

        ctx.accounts.pool.candidates_count = ctx.accounts.pool.candidates_count.checked_add(1).ok_or(TrustPoolError::MathOverflow)?;
        emit!(CandidateCreated { pool: ctx.accounts.pool.key(), index, pubkey });
        Ok(())
    }

    pub fn finalize_with_voting(ctx: Context<FinalizeWithVoting>) -> Result<()> {
        let pool = &mut ctx.accounts.pool;
        let vault = &ctx.accounts.vault;
        let winner = &ctx.accounts.winner;
        let amount = pool.total_contributed;

        let bump = ctx.bumps.vault;
        let pool_key = pool.key();
        let seeds = &[b"vault" as &[u8], pool_key.as_ref(), &[bump]];
        let signer = &[&seeds[..]];

        anchor_lang::solana_program::program::invoke_signed(
            &anchor_lang::solana_program::system_instruction::transfer(&vault.key(), &winner.key(), amount),
            &[vault.to_account_info(), winner.to_account_info(), ctx.accounts.system_program.to_account_info()],
            signer,
        )?;

        pool.status = PoolStatus::Closed;
        emit!(PoolFinalized { pool: pool.key(), receiver: winner.key(), amount });
        Ok(())
    }

    // ---- TIME-BANKING ----

    pub fn offer_service(ctx: Context<OfferService>, _service_seed: u64, description: String, hours_cost: u64) -> Result<()> {
        require!(description.len() <= ServiceOfferingAccount::MAX_DESCRIPTION_LENGTH, TrustPoolError::ServiceDescriptionTooLong);
        require!(hours_cost > 0, TrustPoolError::HoursZero);

        let s = &mut ctx.accounts.service;
        s.provider = ctx.accounts.provider.key();
        s.pool = ctx.accounts.pool.key();
        s.description = description;
        s.hours_cost = hours_cost;
        s.available = true;
        s.bump = ctx.bumps.service;

        emit!(ServiceOffered { pool: s.pool, provider: s.provider, hours_cost });
        Ok(())
    }

    pub fn request_service(ctx: Context<RequestService>, _service_seed: u64) -> Result<()> {
        let s = &mut ctx.accounts.service;
        let credit = &mut ctx.accounts.credit;
        let e = &mut ctx.accounts.exchange;

        s.available = false;
        credit.hours = credit.hours.checked_sub(s.hours_cost).ok_or(TrustPoolError::MathOverflow)?;

        e.offering = s.key();
        e.requester = ctx.accounts.requester.key();
        e.provider = s.provider;
        e.hours = s.hours_cost;
        e.status = ExchangeStatus::Pending;
        e.bump = ctx.bumps.exchange;

        emit!(ServiceRequested { pool: ctx.accounts.pool.key(), requester: e.requester, provider: e.provider, hours: e.hours });
        Ok(())
    }

    pub fn complete_service(ctx: Context<CompleteService>, _service_seed: u64) -> Result<()> {
        let e = &mut ctx.accounts.exchange;
        let s = &mut ctx.accounts.service;
        e.status = ExchangeStatus::Completed;
        s.available = true;
        emit!(ServiceCompleted { pool: ctx.accounts.pool.key(), requester: e.requester, provider: e.provider, hours: e.hours });
        Ok(())
    }

    pub fn dispute_service(ctx: Context<DisputeService>, _service_seed: u64) -> Result<()> {
        let e = &mut ctx.accounts.exchange;
        let credit = &mut ctx.accounts.credit;
        let s = &mut ctx.accounts.service;
        e.status = ExchangeStatus::Disputed;
        s.available = true;
        credit.hours = credit.hours.checked_add(e.hours).ok_or(TrustPoolError::MathOverflow)?;
        emit!(ServiceDisputed { pool: ctx.accounts.pool.key(), requester: e.requester, hours: e.hours });
        Ok(())
    }

    // ---- SPLIT BILL ----

    pub fn create_split_member(ctx: Context<CreateSplitMember>, weight: u16) -> Result<()> {
        let sm = &mut ctx.accounts.split_member;
        sm.pool = ctx.accounts.pool.key();
        sm.member = ctx.accounts.member.key();
        sm.weight = weight;
        sm.amount_owed = 0;
        sm.amount_paid = 0;
        sm.settled = false;
        sm.bump = ctx.bumps.split_member;

        ctx.accounts.pool.split_members_count = ctx.accounts.pool.split_members_count.checked_add(1).ok_or(TrustPoolError::MathOverflow)?;
        emit!(SplitMemberCreated { pool: ctx.accounts.pool.key(), member: sm.member, weight });
        Ok(())
    }

    pub fn settle_split(ctx: Context<SettleSplit>) -> Result<()> {
        let pool = &mut ctx.accounts.pool;
        let sm = &mut ctx.accounts.split_member;
        let member = &ctx.accounts.member;
        require!(member.key() == sm.member, TrustPoolError::SplitMemberNotFound);

        let amount = match pool.split_type {
            SplitType::Equal => pool.target_amount.checked_div(pool.split_members_count as u64).ok_or(TrustPoolError::MathOverflow)?,
            SplitType::Weighted => sm.amount_owed,
        };

        sm.amount_owed = amount;
        sm.settled = true;

        emit!(SplitSettled { pool: pool.key(), member: member.key(), amount });
        Ok(())
    }
}
