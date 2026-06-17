use anchor_lang::prelude::*;

#[account]
pub struct CandidateAccount {
    pub pool: Pubkey,
    pub index: u8,
    pub pubkey: Pubkey,
    pub votes: u64,
    pub bump: u8,
}

impl CandidateAccount {
    pub const SPACE: usize = 8 + 32 + 1 + 32 + 8 + 1;
}
