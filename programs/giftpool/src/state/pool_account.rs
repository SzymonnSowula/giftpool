use anchor_lang::prelude::*;

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq)]
pub enum PoolStatus {
    Open,
    Refunding,
    Closed,
    MilestoneVoting,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq)]
pub enum Recurrence {
    None,
    Weekly,
    Monthly,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq)]
pub enum VotingMode {
    FixedReceiver,
    ContributorVote,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq)]
pub enum SplitType {
    Equal,
    Weighted,
}

#[account]
pub struct PoolAccount {
    pub organizer: Pubkey,
    pub receiver: Pubkey,
    pub seed: u64,
    pub name: String,
    pub target_amount: u64,
    pub total_contributed: u64,
    pub deadline: i64,
    pub status: PoolStatus,
    pub bump: u8,
    // Recurring pools
    pub recurrence: Recurrence,
    pub cycle_count: u8,
    pub max_cycles: u8,
    // Voting mode
    pub voting_mode: VotingMode,
    pub candidates_count: u8,
    // Split bill
    pub split_type: SplitType,
    pub split_members_count: u8,
    // Milestones
    pub milestones_count: u8,
    pub milestones_released: u8,
}

impl PoolAccount {
    pub const MAX_NAME_LENGTH: usize = 50;
    pub const SPACE: usize = 8 + 32 + 32 + 8 + 4 + Self::MAX_NAME_LENGTH + 8 + 8 + 8 + 1 + 1 + 1 + 1 + 1 + 1 + 1 + 1 + 1 + 1 + 1;
}
