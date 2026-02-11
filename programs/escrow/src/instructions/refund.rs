use anchor_lang::prelude::*;
use crate::Escrow;
use anchor_spl::token_interface::{Mint,TokenAccount,TokenInterface, transfer_checked,TransferChecked, CloseAccount, close_account};
use anchor_spl::associated_token::AssociatedToken;

#[derive(Accounts)]
pub struct Refund<'info> {
    #[account(mut)]
    pub maker: Signer<'info>,
    #[account(
        mut,
        close = maker,
        has_one = maker,
        has_one = mint_a,
        has_one = mint_b,
        seeds= [b"escrow", maker.key().as_ref(),escrow.seeds.to_le_bytes().as_ref()],
        bump,
    )]
    pub escrow: Account<'info,Escrow>,
    #[account(
        mut,
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




impl<'info> Refund<'info> {

    pub fn refund_and_close_escrow_and_vault(&mut self) -> Result<()> {
        let signer_seeds: [&[&[u8]]; 1] = [&[
            b"escrow",
            self.maker.to_account_info().key.as_ref(),
            &self.escrow.seeds.to_le_bytes()[..],
            &[self.escrow.bump],
        ]];

        let transfer = TransferChecked {
            from: self.vault.to_account_info(),
            mint: self.mint_a.to_account_info(),
            to: self.maker_ata.to_account_info(),
            authority: self.escrow.to_account_info(),
        };
        let cpi_context = CpiContext::new_with_signer(self.token_program.to_account_info(), transfer, &signer_seeds);
    
        transfer_checked(cpi_context, self.vault.amount, self.mint_a.decimals)?;

                
        let close_accounts = CloseAccount {
            account: self.vault.to_account_info(),
            destination: self.maker.to_account_info(),
            authority: self.escrow.to_account_info(),
        };

        let cpi_context_2 = CpiContext::new_with_signer(self.token_program.to_account_info(), close_accounts, &signer_seeds);

        close_account(cpi_context_2)

        }

    }

