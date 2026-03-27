import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Ginva } from "../target/types/ginva";
import { Keypair, PublicKey } from "@solana/web3.js";
import { BN } from "@coral-xyz/anchor";
import { expect } from "chai";

describe("Circuit Breaker", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program = anchor.workspace.Ginva as Program<Ginva>;

  let admin: Keypair;
  let systemConfig: PublicKey;

  before(async () => {
    admin = Keypair.fromSecretKey(
      Buffer.from(JSON.parse(require("fs").readFileSync(process.env.ANCHOR_WALLET, "utf-8")))
    );

    [systemConfig] = PublicKey.findProgramAddressSync(
      [Buffer.from("system_config")],
      program.programId
    );
  });

  describe("trigger_circuit_breaker", () => {
    it("Should trigger circuit breaker in emergency", async () => {
      await program.methods.triggerCircuitBreaker()
        .accounts({
          admin: admin.publicKey,
          systemConfig: systemConfig,
        })
        .signers([admin])
        .rpc();

      const config = await program.account.systemConfig.fetch(systemConfig);
      expect(config.circuitBreakerActive).to.be.true;
    });

    it("Should fail for non-admin", async () => {
      const randomUser = Keypair.generate();
      await provider.connection.confirmTransaction(
        await provider.connection.requestAirdrop(randomUser.publicKey, 1e9)
      );

      try {
        await program.methods.triggerCircuitBreaker()
          .accounts({
            admin: randomUser.publicKey,
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

  describe("reset_circuit_breaker", () => {
    it("Should reset circuit breaker after emergency", async () => {
      // First trigger it
      await program.methods.triggerCircuitBreaker()
        .accounts({
          admin: admin.publicKey,
          systemConfig: systemConfig,
        })
        .signers([admin])
        .rpc();

      // Then reset it
      await program.methods.resetCircuitBreaker()
        .accounts({
          admin: admin.publicKey,
          systemConfig: systemConfig,
        })
        .signers([admin])
        .rpc();

      const config = await program.account.systemConfig.fetch(systemConfig);
      expect(config.circuitBreakerActive).to.be.false;
    });
  });

  describe("update_circuit_breaker_params", () => {
    it("Should update circuit breaker parameters", async () => {
      const newMaxLiquidationPerHour = new BN(100);
      const newMaxBorrowPerHour = new BN(50000);

      await program.methods.updateCircuitBreakerParams(
        newMaxLiquidationPerHour,
        newMaxBorrowPerHour
      )
      .accounts({
        admin: admin.publicKey,
        systemConfig: systemConfig,
      })
      .signers([admin])
      .rpc();

      const config = await program.account.systemConfig.fetch(systemConfig);
      expect(config.maxLiquidationPerHour.toString()).to.equal(newMaxLiquidationPerHour.toString());
      expect(config.maxBorrowPerHour.toString()).to.equal(newMaxBorrowPerHour.toString());
    });
  });
});
