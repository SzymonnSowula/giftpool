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
    #[msg("Receiver does not match the receiver stored on the pool")]
    InvalidReceiver,
    // Milestone errors
    #[msg("Milestone description too long")]
    MilestoneDescriptionTooLong,
    #[msg("Milestone amount must be greater than zero")]
    MilestoneAmountZero,
    #[msg("Milestones total exceeds pool target")]
    MilestonesExceedTarget,
    #[msg("Milestone index out of range")]
    MilestoneIndexOutOfRange,
    #[msg("Milestone already approved by this contributor")]
    MilestoneAlreadyApproved,
    #[msg("Milestone not approved by majority")]
    MilestoneNotApproved,
    #[msg("Milestone already released")]
    MilestoneAlreadyReleased,
    #[msg("Pool has no milestones configured")]
    NoMilestonesConfigured,
    #[msg("Milestones must sum exactly to target amount")]
    MilestonesSumMismatch,
    // Recurring errors
    #[msg("Pool is not recurring")]
    PoolNotRecurring,
    #[msg("Pool has reached maximum cycles")]
    MaxCyclesReached,
    #[msg("Pool must be closed to rollover")]
    PoolNotClosedForRollover,
    // Voting errors
    #[msg("Candidate index out of range")]
    CandidateIndexOutOfRange,
    #[msg("Pool is not in voting mode")]
    PoolNotVotingMode,
    // Time-banking errors
    #[msg("Service description too long")]
    ServiceDescriptionTooLong,
    #[msg("Insufficient time credits")]
    InsufficientCredits,
    #[msg("Service not available")]
    ServiceNotAvailable,
    #[msg("Exchange not pending")]
    ExchangeNotPending,
    #[msg("Cannot dispute own service")]
    CannotDisputeOwn,
    #[msg("Hours must be greater than zero")]
    HoursZero,
    // Split bill errors
    #[msg("Too many split members (max 10)")]
    TooManySplitMembers,
    #[msg("Split member not found")]
    SplitMemberNotFound,
    #[msg("Split already settled")]
    SplitAlreadySettled,
    #[msg("Split not settled yet")]
    SplitNotSettled,
}
