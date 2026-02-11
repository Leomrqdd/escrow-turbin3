use anchor_lang::prelude::*;
use crate::Escrow;
use anchor_spl::token_interface::{Mint,TokenAccount,TokenInterface, transfer_checked, TransferChecked};
use anchor_spl::associated_token::AssociatedToken;

#[derive(Accounts)]
#[instruction(seed: u64)]
pub struct Make<'info> {
    #[account(mut)]
    pub maker: Signer<'info>,
    #[account(
        init,
        payer = maker,
        seeds= [b"escrow", maker.key().as_ref(),seed.to_le_bytes().as_ref()],
        space = Escrow::DISCRIMINATOR.len() + Escrow::INIT_SPACE,
        bump,
    )]
    pub escrow: Account<'info,Escrow>,
    #[account(
        init,
        payer = maker,
        associated_token::mint = mint_a,
        associated_token::authority = escrow,
        associated_token::token_program = token_program,
    )]
    pub vault: InterfaceAccount<'info,TokenAccount>,
    #[account(mint::token_program = token_program)]
    pub mint_a: InterfaceAccount<'info,Mint>,
    #[account(mint::token_program = token_program)]
    pub mint_b: InterfaceAccount<'info,Mint>,
    #[account(
        mut,
        associated_token::mint = mint_a,
        associated_token::authority = maker,
        associated_token::token_program = token_program,

    )]
    pub maker_ata : InterfaceAccount<'info,TokenAccount>,

    pub associated_token_program: Program<'info, AssociatedToken>,
    pub token_program: Interface<'info, TokenInterface>,
    pub system_program: Program<'info, System>,

}

impl<'info> Make<'info> {

    pub fn initialize_escrow(&mut self, seed: u64, receive: u64, bumps:&MakeBumps) -> Result<()> {
        self.escrow.set_inner(Escrow {
            seeds: seed,
            maker: self.maker.key(),
            mint_a: self.mint_a.key(),
            mint_b: self.mint_b.key(),
            receive: receive,
            bump: bumps.escrow,
        });
        Ok(())
    }

    pub fn deposit(&mut self, deposit:u64) -> Result<()> {

    let transfer = TransferChecked {
        from: self.maker_ata.to_account_info(),
        mint: self.mint_a.to_account_info(),
        to: self.vault.to_account_info(),
        authority: self.maker.to_account_info(),
    };
    let cpi_context = CpiContext::new(self.token_program.to_account_info(), transfer);

    transfer_checked(cpi_context, deposit, self.mint_a.decimals)
    }

}