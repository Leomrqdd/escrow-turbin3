import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Escrow } from "../target/types/escrow";
import { getAssociatedTokenAddressSync, createAssociatedTokenAccountInstruction, createMint, mintTo, TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID } from "@solana/spl-token";

describe("escrow", () => {
  // Configure the client to use the local cluster.
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program = anchor.workspace.escrow as Program<Escrow>;
  const maker = provider.wallet.payer;
  const taker = anchor.web3.Keypair.generate();
  const seed = new anchor.BN(1); 
  let escrowPda: anchor.web3.PublicKey;
  let escrowBump: number;
  let vaultPda: anchor.web3.PublicKey;
  let vaultBump: number;


  

  let mintA: anchor.web3.PublicKey;
  let mintB: anchor.web3.PublicKey;
  let makerAtaA: anchor.web3.PublicKey;
  let takerAtaA: anchor.web3.PublicKey;
  let makerAtaB: anchor.web3.PublicKey;
  let takerAtaB: anchor.web3.PublicKey;




  const depositAmount = 100;
  const receiveAmount = 300;

  before(async() => {
    console.log("Airdropping SOL to maker & taker...");

    await provider.connection.requestAirdrop(maker.publicKey, 100*anchor.web3.LAMPORTS_PER_SOL);
    await provider.connection.requestAirdrop(taker.publicKey, 100*anchor.web3.LAMPORTS_PER_SOL);
    console.log("Airdropped SOL to maker.");
    const makerBalance = await provider.connection.getBalance(maker.publicKey);
    console.log("Maker balance:", makerBalance);
    console.log("Maker public key:", maker.publicKey.toBase58());
    const takerBalance = await provider.connection.getBalance(taker.publicKey);
    console.log("Taker balance:", takerBalance);
    console.log("Taker public key:", taker.publicKey.toBase58());
    console.log("--------------------------------");

    console.log("Creating mints...");
    mintA = await createMint(provider.connection,maker,maker.publicKey,null,0)
    mintB = await createMint(provider.connection, taker, taker.publicKey,null,0)
    console.log("Mints created:",mintA.toBase58(),mintB.toBase58());

    console.log("Creating ATA...");
    makerAtaA = getAssociatedTokenAddressSync(mintA,maker.publicKey);
    takerAtaB= getAssociatedTokenAddressSync(mintB,taker.publicKey);
    takerAtaA = getAssociatedTokenAddressSync(mintA,taker.publicKey);
    makerAtaB = getAssociatedTokenAddressSync(mintB,maker.publicKey);
    const makerAtaAIx = await createAssociatedTokenAccountInstruction(maker.publicKey,makerAtaA,maker.publicKey,mintA);
    const takerAtaBIx = await createAssociatedTokenAccountInstruction(taker.publicKey,takerAtaB,taker.publicKey,mintB);
    const takerAtaAIx = await createAssociatedTokenAccountInstruction(taker.publicKey,takerAtaA,taker.publicKey,mintA);
    const makerAtaBIx = await createAssociatedTokenAccountInstruction(maker.publicKey,makerAtaB,maker.publicKey,mintB);

    const tx = new anchor.web3.Transaction().add(makerAtaAIx,takerAtaBIx,makerAtaBIx,takerAtaAIx);
    await provider.sendAndConfirm(tx, [maker, taker]);
    console.log("ATA created:",makerAtaA.toBase58(),takerAtaB.toBase58());




    console.log("Minting tokens...");
    const mintATx = await mintTo(provider.connection,maker,mintA,makerAtaA,maker,depositAmount);
    const mintBTx = await mintTo(provider.connection,taker,mintB,takerAtaB,taker,receiveAmount);
    console.log("Tokens minted:",mintATx,mintBTx);

    console.log("Checking balances...");

    const makerTokenBalanceA = await provider.connection.getTokenAccountBalance(makerAtaA)
    const takerTokenBalanceB = await provider.connection.getTokenAccountBalance(takerAtaB)
    const makerTokenBalanceB = await provider.connection.getTokenAccountBalance(makerAtaB)
    const takerTokenBalanceA = await provider.connection.getTokenAccountBalance(takerAtaA)

    console.log("Maker token balance A:", makerTokenBalanceA.value.amount)
    console.log("Maker token balance B:", makerTokenBalanceB.value.amount)
    console.log("Taker token balance A:", takerTokenBalanceA.value.amount)
    console.log("Taker token balance B:", takerTokenBalanceB.value.amount)





  })



  it("Initialize escrow", async () => {
    [escrowPda,escrowBump] = anchor.web3.PublicKey.findProgramAddressSync([
      Buffer.from("escrow"),
      maker.publicKey.toBuffer(),
      seed.toArrayLike(Buffer, "le", 8)],
      program.programId
    );
  
    vaultPda = getAssociatedTokenAddressSync(mintA, escrowPda,true);

    console.log("Escrow PDA:", escrowPda.toBase58());
    console.log("Vault PDA:", vaultPda.toBase58());
    console.log("Maker ATA A:", makerAtaA.toBase58());
    console.log("Maker ATA B:", makerAtaB.toBase58());
    console.log("Taker ATA A:", takerAtaA.toBase58());
    console.log("Taker ATA B:", takerAtaB.toBase58());
    console.log("Mint A:", mintA.toBase58());
    console.log("Mint B:", mintB.toBase58());
    console.log("associated token program:", ASSOCIATED_TOKEN_PROGRAM_ID.toBase58());
    console.log("token program:", TOKEN_PROGRAM_ID.toBase58());
    console.log("system program:", anchor.web3.SystemProgram.programId.toBase58());

    const tx = await program.methods.make(seed,new anchor.BN(depositAmount),new anchor.BN(receiveAmount)).accountsStrict({
      maker: maker.publicKey,
      escrow: escrowPda,
      vault: vaultPda,
      mintA : mintA,
      mintB : mintB,
      makerAta : makerAtaA,
      associatedTokenProgram : ASSOCIATED_TOKEN_PROGRAM_ID,
      tokenProgram : TOKEN_PROGRAM_ID,
      systemProgram : anchor.web3.SystemProgram.programId,
    }).rpc();
    console.log("Escrow initialized:", tx);
  });


  // it("Refund escrow", async () => {
  //   const tx = await program.methods.refund().accountsStrict({
  //     maker: maker.publicKey,
  //     escrow: escrowPda,
  //     vault: vaultPda,
  //     mintA: mintA,
  //     mintB: mintB,
  //     makerAta: makerAtaA,
  //     associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
  //     tokenProgram: TOKEN_PROGRAM_ID,
  //     systemProgram: anchor.web3.SystemProgram.programId,
  //   }).rpc();
  //   console.log("Escrow refunded:", tx);
  // });


  it("take escrow", async () => {
    const tx = await program.methods.take().accountsStrict({
      taker: taker.publicKey,
      maker: maker.publicKey,
      escrow: escrowPda,
      vault: vaultPda,
      mintA: mintA,
      mintB: mintB,
      makerAtaB: makerAtaB,
      takerAtaB: takerAtaB,
      takerAtaA: takerAtaA,
      associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
      tokenProgram: TOKEN_PROGRAM_ID,
      systemProgram: anchor.web3.SystemProgram.programId,
    }).signers([taker]).rpc();
    console.log("Escrow taken:", tx);

    const makerTokenBalanceA = await provider.connection.getTokenAccountBalance(makerAtaA)
    const takerTokenBalanceB = await provider.connection.getTokenAccountBalance(takerAtaB)
    const makerTokenBalanceB = await provider.connection.getTokenAccountBalance(makerAtaB)
    const takerTokenBalanceA = await provider.connection.getTokenAccountBalance(takerAtaA)

    console.log("Maker token balance A:", makerTokenBalanceA.value.amount)
    console.log("Maker token balance B:", makerTokenBalanceB.value.amount)
    console.log("Taker token balance A:", takerTokenBalanceA.value.amount)
    console.log("Taker token balance B:", takerTokenBalanceB.value.amount)


  });





});
