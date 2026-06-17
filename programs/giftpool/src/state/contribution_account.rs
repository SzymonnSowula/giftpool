use anchor_lang::prelude::*;

#[account]
pub struct ContributionAccount {
    pub pool: Pubkey,
    pub contributor: Pubkey,
    pub amount: u64,
    pub refunded: bool,
    pub bump: u8,
    // Voting: which candidate this contribution votes for
    pub candidate_index: u8,
    pub has_voted: bool,
    // Milestone approvals: bitmask (up to 8 milestones)
    pub milestone_approvals: u8,
    // Time credits earned from this contribution
    pub credits_earned: u64,
}

impl ContributionAccount {
    pub const SPACE: usize = 8 + 32 + 32 + 8 + 1 + 1 + 1 + 1 + 1 + 8;
}
