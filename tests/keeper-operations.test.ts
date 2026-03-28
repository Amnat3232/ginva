import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Ginva } from "../target/types/ginva";
import { Keypair, PublicKey } from "@solana/web3.js";
import { expect } from "chai";

describe("Keeper Operations", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program = anchor.workspace.Ginva as Program<Ginva>;

  let admin: Keypair;
  let systemConfig: PublicKey;
  let keeperA: Keypair;
  let keeperB: Keypair;

  before(async () => {
    admin = Keypair.fromSecretKey(
      Buffer.from(
        JSON.parse(
          require("fs").readFileSync(process.env.ANCHOR_WALLET, "utf-8")
        )
      )
    );

    [systemConfig] = PublicKey.findProgramAddressSync(
      [Buffer.from("system_config")],
      program.programId
    );

    keeperA = Keypair.generate();
    keeperB = Keypair.generate();

    // Airdrop to keepers
    await provider.connection.confirmTransaction(
      await provider.connection.requestAirdrop(keeperA.publicKey, 1e9)
    );
    await provider.connection.confirmTransaction(
      await provider.connection.requestAirdrop(keeperB.publicKey, 1e9)
    );
  });

  describe("add_trusted_keeper", () => {
    it("Should add trusted keeper successfully", async () => {
      await program.methods
        .addTrustedKeeper()
        .accounts({
          admin: admin.publicKey,
          keeper: keeperA.publicKey,
          systemConfig: systemConfig,
        })
        .signers([admin])
        .rpc();

      const config = await program.account.systemConfig.fetch(systemConfig);
      const keeperExists = config.trustedKeepers.some(
        (k) => k.toString() === keeperA.publicKey.toString()
      );
      expect(keeperExists).to.be.true;
    });

    it("Should fail when non-admin tries to add keeper", async () => {
      const randomUser = Keypair.generate();
      await provider.connection.confirmTransaction(
        await provider.connection.requestAirdrop(randomUser.publicKey, 1e9)
      );

      try {
        await program.methods
          .addTrustedKeeper()
          .accounts({
            admin: randomUser.publicKey,
            keeper: randomUser.publicKey,
            systemConfig: systemConfig,
          })
          .signers([randomUser])
          .rpc();
        throw new Error("Should have failed");
      } catch (e: any) {
        expect(e.error.errorCode.code).to.equal("Unauthorized");
      }
    });
  });

  describe("remove_trusted_keeper", () => {
    it("Should remove trusted keeper successfully", async () => {
      await program.methods
        .removeTrustedKeeper()
        .accounts({
          admin: admin.publicKey,
          keeper: keeperA.publicKey,
          systemConfig: systemConfig,
        })
        .signers([admin])
        .rpc();

      const config = await program.account.systemConfig.fetch(systemConfig);
      const keeperExists = config.trustedKeepers.some(
        (k) => k.toString() === keeperA.publicKey.toString()
      );
      expect(keeperExists).to.be.false;
    });
  });

  describe("keeper_heartbeat", () => {
    it("Should update keeper heartbeat timestamp", async () => {
      // Register keeper first
      await program.methods
        .registerKeeper()
        .accounts({
          keeper: keeperB.publicKey,
          systemConfig: systemConfig,
        })
        .signers([keeperB])
        .rpc();

      // Send heartbeat
      await program.methods
        .keeperHeartbeat()
        .accounts({
          keeper: keeperB.publicKey,
          systemConfig: systemConfig,
        })
        .signers([keeperB])
        .rpc();

      const config = await program.account.systemConfig.fetch(systemConfig);
      const keeperInfo = config.keepers.find(
        (k) => k.keeperAddress.toString() === keeperB.publicKey.toString()
      );
      expect(keeperInfo).to.not.be.undefined;
      expect(keeperInfo!.lastHeartbeat.toNumber()).to.be.greaterThan(0);
    });

    it("Should fail for non-registered keeper", async () => {
      const unauthorizedKeeper = Keypair.generate();
      await provider.connection.confirmTransaction(
        await provider.connection.requestAirdrop(
          unauthorizedKeeper.publicKey,
          1e9
        )
      );

      try {
        await program.methods
          .keeperHeartbeat()
          .accounts({
            keeper: unauthorizedKeeper.publicKey,
            systemConfig: systemConfig,
          })
          .signers([unauthorizedKeeper])
          .rpc();
        throw new Error("Should have failed");
      } catch (e: any) {
        expect(e.error.errorCode.code).to.equal("KeeperNotRegistered");
      }
    });
  });
});
