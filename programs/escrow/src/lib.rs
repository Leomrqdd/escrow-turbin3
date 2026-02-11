use anchor_lang::prelude::*;


pub mod state;
pub mod instructions;

pub use state::*;
pub use instructions::*;

declare_id!("5C2dC79BYoHpXFiPBvnHVhUQnKnY3GeW4AjwJ4wESqFh");

#[program]
pub mod escrow {
    use super::*;

    pub fn make(ctx: Context<Make>, seed: u64, deposit: u64, receive: u64) -> Result<()> {
        ctx.accounts.initialize_escrow(seed, receive, &ctx.bumps)?;
        ctx.accounts.deposit(deposit)?;
        Ok(())
    }

    pub fn refund(ctx:Context<Refund>) -> Result <()> {
        ctx.accounts.refund_and_close_escrow_and_vault()
    }
}
