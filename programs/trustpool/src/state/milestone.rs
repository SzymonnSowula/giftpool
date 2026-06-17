use anchor_lang::prelude::*;

#[account]
pub struct MilestoneAccount {
    pub pool: Pubkey,
    pub index: u8,
    pub description: String,
    pub amount: u64,
    pub approved: bool,
    pub approvals_count: u16,
    pub released: bool,
    pub bump: u8,
}

impl MilestoneAccount {
    pub const MAX_DESCRIPTION_LENGTH: usize = 100;
    pub const SPACE: usize = 8 + 32 + 1 + 4 + Self::MAX_DESCRIPTION_LENGTH + 8 + 1 + 2 + 1 + 1;
}
