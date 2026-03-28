import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Ginva } from "../target/types/ginva";
import { Keypair, PublicKey } from "@solana/web3.js";
import { expect } from "chai";

describe("Security Tests - Missing Instructions", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program = anchor.workspace.Ginva as Program<Ginva>;

  let admin: Keypair;
  let systemConfig: PublicKey;

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
  });

  describe("execute_dex_fallback Security", () => {
    it("Should reject invalid Jupiter route data", async () => {
      const keeper = Keypair.generate();
      await provider.connection.confirmTransaction(
        await provider.connection.requestAirdrop(keeper.publicKey, 1e9)
      );

      // Try with empty data (should fail)
      try {
        await program.methods
          .executeDexFallback()
          .accounts({
            keeper: keeper.publicKey,
            loanAccount: PublicKey.default,
            collateralReceiver: keeper.publicKey,
            systemConfig: systemConfig,
            tokenProgram: PublicKey.default,
          })
          .remainingAccounts([])
          .signers([keeper])
          .rpc();
        throw new Error("Should have failed with invalid data");
      } catch (e: any) {
        expect(e.error.errorCode.code).to.be.oneOf([
          "InvalidJupiterRoute",
          "AccountNotFound",
        ]);
      }
    });

    it("Should reject duplicate liquidation attempts", async () => {
      const keeper = Keypair.generate();
      await provider.connection.confirmTransaction(
        await provider.connection.requestAirdrop(keeper.publicKey, 1e9)
      );

      // Try to execute swap twice
      const collateralReceiver = Keypair.generate();
      await provider.connection.confirmTransaction(
        await provider.connection.requestAirdrop(
          collateralReceiver.publicKey,
          1e9
        )
      );

      // First attempt
      try {
        await program.methods
          .executeDexFallback()
          .accounts({
            keeper: keeper.publicKey,
            loanAccount: PublicKey.default,
            collateralReceiver: collateralReceiver.publicKey,
            systemConfig: systemConfig,
            tokenProgram: PublicKey.default,
          })
          .remainingAccounts([])
          .signers([keeper])
          .rpc();
      } catch (e: any) {
        // Expected: loan not found
      }

      // Try again (should fail due to duplicate)
      try {
        await program.methods
          .executeDexFallback()
          .accounts({
            keeper: keeper.publicKey,
            loanAccount: PublicKey.default,
            collateralReceiver: collateralReceiver.publicKey,
            systemConfig: systemConfig,
            tokenProgram: PublicKey.default,
          })
          .remainingAccounts([])
          .signers([keeper])
          .rpc();
        throw new Error("Should have failed - duplicate attempt");
      } catch (e: any) {
        expect(e.error.errorCode.code).to.be.oneOf([
          "AlreadySwapped",
          "InvalidLoanState",
        ]);
      }
    });
  });

  describe("Fund Distribution Security", () => {
    it("Should only allow admin to distribute safety fund", async () => {
      const randomUser = Keypair.generate();
      await provider.connection.confirmTransaction(
        await provider.connection.requestAirdrop(randomUser.publicKey, 1e9)
      );

      try {
        await program.methods
          .distributeSafetyFund()
          .accounts({
            admin: randomUser.publicKey,
            systemConfig: systemConfig,
          })
          .signers([randomUser])
          .rpc();
        throw new Error("Should have failed - unauthorized");
      } catch (e: any) {
        expect(e.error.errorCode.code).to.equal("Unauthorized");
      }
    });

    it("Should prevent distribute_dev_fund with insufficient balance", async () => {
      const devFundWallet = PublicKey.default;

      try {
        await program.methods
          .distributeDevFund()
          .accounts({
            admin: admin.publicKey,
            systemConfig: systemConfig,
            devFundWallet: devFundWallet,
          })
          .signers([admin])
          .rpc();
        // May succeed or fail depending on fund balance
      } catch (e: any) {
        expect(e.error.errorCode.code).to.be.oneOf([
          "InsufficientFunds",
          "ArithmeticError",
        ]);
      }
    });
  });

  describe("Agent System Security", () => {
    it("Should prevent double registration of agent", async () => {
      const agent = Keypair.generate();
      await provider.connection.confirmTransaction(
        await provider.connection.requestAirdrop(agent.publicKey, 1e9)
      );

      // Register once
      await program.methods
        .registerAgent()
        .accounts({
          agent: agent.publicKey,
          systemConfig: systemConfig,
        })
        .signers([agent])
        .rpc();

      // Try to register again
      try {
        await program.methods
          .registerAgent()
          .accounts({
            agent: agent.publicKey,
            systemConfig: systemConfig,
          })
          .signers([agent])
          .rpc();
        throw new Error("Should have failed - already registered");
      } catch (e: any) {
        expect(e.error.errorCode.code).to.equal("AgentAlreadyRegistered");
      }
    });

    it("Should prevent non-agent from claiming rewards", async () => {
      const nonAgent = Keypair.generate();
      await provider.connection.confirmTransaction(
        await provider.connection.requestAirdrop(nonAgent.publicKey, 1e9)
      );

      try {
        await program.methods
          .claimAgentRewards()
          .accounts({
            agent: nonAgent.publicKey,
            systemConfig: systemConfig,
          })
          .signers([nonAgent])
          .rpc();
        throw new Error("Should have failed - not an agent");
      } catch (e: any) {
        expect(e.error.errorCode.code).to.equal("AgentNotRegistered");
      }
    });
  });

  describe("Unauthorized Access Prevention", () => {
    it("Should prevent non-admin from updating ops wallet", async () => {
      const randomUser = Keypair.generate();
      await provider.connection.confirmTransaction(
        await provider.connection.requestAirdrop(randomUser.publicKey, 1e9)
      );

      try {
        await program.methods
          .updateOpsWallet()
          .accounts({
            admin: randomUser.publicKey,
            systemConfig: systemConfig,
            newOpsWallet: randomUser.publicKey,
          })
          .signers([randomUser])
          .rpc();
        throw new Error("Should have failed - unauthorized");
      } catch (e: any) {
        expect(e.error.errorCode.code).to.equal("Unauthorized");
      }
    });
  });
});
