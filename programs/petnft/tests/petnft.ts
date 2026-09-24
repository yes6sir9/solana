// Anchor test skeleton for the PetNFT program.
//
// NOT RUN in this session — no Rust/Solana/Anchor toolchain was available
// in the environment this repo was generated in. Once you have `anchor`
// installed (see README), run `anchor test` from the repo root; this file
// gives you a starting point, not a verified passing suite.

import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { PublicKey, Keypair, SystemProgram } from "@solana/web3.js";
import { assert } from "chai";

describe("petnft", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  // Cast to `any` since the generated IDL type isn't checked into the repo
  // (it's produced by `anchor build`).
  const program = anchor.workspace.Petnft as Program<any>;

  it("initializes a pet record PDA for a mint", async () => {
    const mint = Keypair.generate();

    const [petRecordPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("pet-record"), mint.publicKey.toBuffer()],
      program.programId
    );

    await program.methods
      .initializePetRecord("Blaze", { dragon: {} }, { rare: {} })
      .accounts({
        owner: provider.wallet.publicKey,
        mint: mint.publicKey,
        petRecord: petRecordPda,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    const record = await program.account.petRecord.fetch(petRecordPda);
    assert.equal(record.name, "Blaze");
    assert.equal(record.level, 1);
  });
});
