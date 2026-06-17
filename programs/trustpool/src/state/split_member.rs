use anchor_lang::prelude::*;

#[account]
pub struct SplitMemberAccount {
    pub pool: Pubkey,
    pub member: Pubkey,
    pub weight: u16,
    pub amount_owed: u64,
    pub amount_paid: u64,
    pub settled: bool,
    pub bump: u8,
}

impl SplitMemberAccount {
    pub const SPACE: usize = 8 + 32 + 32 + 2 + 8 + 8 + 1 + 1;
}
