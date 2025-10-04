import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { assert } from "chai";

describe("mirror-sync", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.mirrorSync;
  const programId = program.programId;

  let platformPda: anchor.web3.PublicKey;
  let guidePda: anchor.web3.PublicKey;
  let travelerPda: anchor.web3.PublicKey;

  before(async () => {
    [platformPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("platform")],
      programId
    );

    [guidePda] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("guide"), provider.wallet.publicKey.toBuffer()],
      programId
    );

    [travelerPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [
        Buffer.from("traveler"),
        provider.wallet.publicKey.toBuffer(),
        guidePda.toBuffer(),
      ],
      programId
    );
  });

  it("Platform exists and has correct data", async () => {
    const platformAccount = await program.account.platform.fetch(platformPda);

    assert.equal(
      platformAccount.authority.toString(),
      provider.wallet.publicKey.toString()
    );
    console.log(
      "Platform total guides:",
      platformAccount.totalGuides.toString()
    );
    console.log(
      "Platform total travelers:",
      platformAccount.totalTravelers.toString()
    );
  });

  it("Guide exists and has correct data", async () => {
    const guideAccount = await program.account.guide.fetch(guidePda);

    assert.equal(
      guideAccount.authority.toString(),
      provider.wallet.publicKey.toString()
    );
    assert.equal(guideAccount.isActive, true);
    console.log(
      "Guide total travelers:",
      guideAccount.totalTravelers.toString()
    );
  });

  it("Traveler exists and has correct data", async () => {
    const travelerAccount = await program.account.traveler.fetch(travelerPda);

    assert.equal(
      travelerAccount.authority.toString(),
      provider.wallet.publicKey.toString()
    );
    assert.equal(travelerAccount.guide.toString(), guidePda.toString());
    assert.equal(travelerAccount.isActive, true);
    console.log(
      "Traveler total mirrored:",
      travelerAccount.totalMirrored.toString()
    );
  });
});
