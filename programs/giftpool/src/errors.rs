use anchor_lang::prelude::*;

#[error_code]
pub enum GiftPoolError {
    #[msg("Pool name too long")]
    NameTooLong,
    #[msg("Target amount must be greater than zero")]
    TargetAmountZero,
    #[msg("Deadline must be in the future")]
    DeadlineInPast,
    #[msg("Pool is not open")]
    PoolNotOpen,
    #[msg("Deadline has passed")]
    DeadlinePassed,
    #[msg("Contribution amount must be greater than zero")]
    ContributionAmountZero,
    #[msg("Math overflow")]
    MathOverflow,
    #[msg("Unauthorized")]
    Unauthorized,
    #[msg("Target not met")]
    TargetNotMet,
    #[msg("Pool is not refundable")]
    PoolNotRefundable,
    #[msg("Already refunded")]
    AlreadyRefunded,
    #[msg("Refund not yet allowed")]
    RefundNotYetAllowed,
}
