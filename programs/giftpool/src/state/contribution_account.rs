use anchor_lang::prelude::*;

#[account]
pub struct ContributionAccount {
    pub pool: Pubkey,
    pub contributor: Pubkey,
    pub amount: u64,
    pub refunded: bool,
    pub bump: u8,
}

impl ContributionAccount {
    pub const SPACE: usize = 8 + 32 + 32 + 8 + 1 + 1;
}
