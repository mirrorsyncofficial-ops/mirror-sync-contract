import * as anchor from "@coral-xyz/anchor";

const programId = new anchor.web3.PublicKey(
  "TFDiX8vcvEKexK6qJY1T172y5YL19oP7k265BFT8MZP"
);

async function initializePlatform() {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program = anchor.workspace.mirrorSync;

  const [platformPda] = anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from("platform")],
    programId
  );

  try {
    const tx = await program.methods
      .initializePlatform()
      .accounts({
        platform: platformPda,
        authority: provider.wallet.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();

    console.log("✅ Platform initialized! Transaction:", tx);
  } catch (error) {
    console.error("❌ Error:", error);
  }
}

async function registerGuide() {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program = anchor.workspace.mirrorSync;

  const [platformPda] = anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from("platform")],
    programId
  );

  const [guidePda] = anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from("guide"), provider.wallet.publicKey.toBuffer()],
    programId
  );

  try {
    const tx = await program.methods
      .registerGuide()
      .accounts({
        guide: guidePda,
        platform: platformPda,
        authority: provider.wallet.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();

    console.log("✅ Guide registered! Transaction:", tx);
  } catch (error) {
    console.error("❌ Error:", error);
  }
}

async function subscribeTraveler() {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program = anchor.workspace.mirrorSync;

  const [platformPda] = anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from("platform")],
    programId
  );

  const [guidePda] = anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from("guide"), provider.wallet.publicKey.toBuffer()],
    programId
  );

  const [travelerPda] = anchor.web3.PublicKey.findProgramAddressSync(
    [
      Buffer.from("traveler"),
      provider.wallet.publicKey.toBuffer(),
      guidePda.toBuffer(),
    ],
    programId
  );

  try {
    const tx = await program.methods
      .subscribeTraveler()
      .accounts({
        traveler: travelerPda,
        guide: guidePda,
        platform: platformPda,
        authority: provider.wallet.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();

    console.log("✅ Traveler subscribed! Transaction:", tx);
  } catch (error) {
    console.error("❌ Error:", error);
  }
}

async function main() {
  console.log("🚀 Starting Mirror Sync Tests...\n");

  // Test in sequence:
  await initializePlatform();
  await registerGuide();
  await subscribeTraveler();
}

main();
