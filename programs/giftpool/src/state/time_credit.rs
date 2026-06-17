use anchor_lang::prelude::*;

#[account]
pub struct TimeCreditAccount {
    pub owner: Pubkey,
    pub pool: Pubkey,
    pub hours: u64,
    pub bump: u8,
}

impl TimeCreditAccount {
    pub const SPACE: usize = 8 + 32 + 32 + 8 + 1;
}

#[account]
pub struct ServiceOfferingAccount {
    pub provider: Pubkey,
    pub pool: Pubkey,
    pub description: String,
    pub hours_cost: u64,
    pub available: bool,
    pub bump: u8,
}

impl ServiceOfferingAccount {
    pub const MAX_DESCRIPTION_LENGTH: usize = 100;
    pub const SPACE: usize = 8 + 32 + 32 + 4 + Self::MAX_DESCRIPTION_LENGTH + 8 + 1 + 1;
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq)]
pub enum ExchangeStatus {
    Pending,
    Completed,
    Disputed,
    Refunded,
}

#[account]
pub struct ServiceExchangeAccount {
    pub offering: Pubkey,
    pub requester: Pubkey,
    pub provider: Pubkey,
    pub hours: u64,
    pub status: ExchangeStatus,
    pub bump: u8,
}

impl ServiceExchangeAccount {
    pub const SPACE: usize = 8 + 32 + 32 + 32 + 8 + 1 + 1;
}
