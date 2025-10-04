use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};

declare_id!("TFDiX8vcvEKexK6qJY1T172y5YL19oP7k265BFT8MZP");

#[program]
pub mod mirror_sync {
    use super::*;

    pub fn initialize_platform(ctx: Context<InitializePlatform>) -> Result<()> {
        let platform = &mut ctx.accounts.platform;
        platform.authority = ctx.accounts.authority.key();
        platform.total_guides = 0;
        platform.total_travelers = 0;
        Ok(())
    }

    pub fn register_guide(ctx: Context<RegisterGuide>) -> Result<()> {
        let guide = &mut ctx.accounts.guide;
        guide.authority = ctx.accounts.authority.key();
        guide.is_active = true;
        guide.total_travelers = 0;
        guide.total_volume = 0;

        let platform = &mut ctx.accounts.platform;
        platform.total_guides += 1;

        Ok(())
    }

    pub fn subscribe_traveler(ctx: Context<SubscribeTraveler>) -> Result<()> {
        let traveler = &mut ctx.accounts.traveler;
        traveler.authority = ctx.accounts.authority.key();
        traveler.guide = ctx.accounts.guide.key();
        traveler.is_active = true;
        traveler.total_mirrored = 0;

        let guide = &mut ctx.accounts.guide;
        guide.total_travelers += 1;

        let platform = &mut ctx.accounts.platform;
        platform.total_travelers += 1;

        Ok(())
    }

    pub fn mirror_trade(ctx: Context<MirrorTrade>, copy_amount: u64) -> Result<()> {
        let guide = &ctx.accounts.guide;
        let traveler = &mut ctx.accounts.traveler;

        require!(guide.is_active, ErrorCode::GuideInactive);
        require!(traveler.is_active, ErrorCode::TravelerInactive);
        require!(copy_amount > 0, ErrorCode::AmountTooSmall);

        let cpi_accounts = Transfer {
            from: ctx.accounts.traveler_token_account.to_account_info(),
            to: ctx.accounts.guide_token_account.to_account_info(),
            authority: ctx.accounts.traveler_authority.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
        token::transfer(cpi_ctx, copy_amount)?;

        traveler.total_mirrored += copy_amount;

        Ok(())
    }
}

#[derive(Accounts)]
pub struct InitializePlatform<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + 32 + 8 + 8,
        seeds = [b"platform"],
        bump
    )]
    pub platform: Account<'info, Platform>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct RegisterGuide<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + 32 + 1 + 8 + 8,
        seeds = [b"guide", authority.key().as_ref()],
        bump
    )]
    pub guide: Account<'info, Guide>,
    #[account(mut)]
    pub platform: Account<'info, Platform>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct SubscribeTraveler<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + 32 + 32 + 1 + 8,
        seeds = [b"traveler", authority.key().as_ref(), guide.key().as_ref()],
        bump
    )]
    pub traveler: Account<'info, Traveler>,
    #[account(mut)]
    pub guide: Account<'info, Guide>,
    #[account(mut)]
    pub platform: Account<'info, Platform>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct MirrorTrade<'info> {
    #[account(mut)]
    pub guide: Account<'info, Guide>,
    #[account(
        mut,
        constraint = traveler.guide == guide.key()
    )]
    pub traveler: Account<'info, Traveler>,
    #[account(mut)]
    pub traveler_token_account: Account<'info, TokenAccount>,
    #[account(mut)]
    pub guide_token_account: Account<'info, TokenAccount>,
    pub traveler_authority: Signer<'info>,
    pub token_program: Program<'info, Token>,
}

#[account]
pub struct Platform {
    pub authority: Pubkey,
    pub total_guides: u64,
    pub total_travelers: u64,
}

#[account]
pub struct Guide {
    pub authority: Pubkey,
    pub is_active: bool,
    pub total_travelers: u64,
    pub total_volume: u64,
}

#[account]
pub struct Traveler {
    pub authority: Pubkey,
    pub guide: Pubkey,
    pub is_active: bool,
    pub total_mirrored: u64,
}

#[error_code]
pub enum ErrorCode {
    #[msg("Amount too small")]
    AmountTooSmall,

    #[msg("Traveler is inactive")]
    TravelerInactive,

    #[msg("Guide is inactive")]
    GuideInactive,
}
