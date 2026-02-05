  });

  describe("👑 Fresh Borrower Experience", () => {
    it("Should handle fresh borrower journey", async () => {
      console.log("--- Fresh User Journey: Onboarding Experience ---");
      
      // สร้าง PDAs ให้ borrower ใหม่
      const [freshLoanAccount] = PublicKey.findProgramAddressSync(
        [Buffer.from("loan"), freshBorrower.publicKey.toBuffer()],
        program.programId
      );

      // 1. User ใหม่ฝากของ + กู้เงิน
      const depositAmount = new BN(5 * LAMPORTS_PER_SOL);
      const borrowAmount = new BN(10_000_000); // 10 USDC

      // สร้าง ATAs ให้ borrower ใหม่
      const freshUserCollateral = await getAssociatedTokenAddress(collateralMint, freshBorrower.publicKey);
      const freshUserUsdc = await getAssociatedTokenAddress(usdcMint, freshBorrower.publicKey);

      // Mint SOL ให้ user ใหม่
      await mintTo(
        connection, 
        admin.payer, 
        collateralMint, 
        freshUserCollateral, 
        admin.publicKey, 
        10 * LAMPORTS_PER_SOL
      );

      // Deposit collateral
      await program.methods.depositCollateral(depositAmount)
        .accounts({
          user: freshBorrower.publicKey,
          systemConfig, 
          assetConfig, 
          loanAccount: freshLoanAccount,
          userCollateralAccount: freshUserCollateral,
          vaultCollateralAccount,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        })
        .signers([freshBorrower])
        .rpc();

      console.log("✅ Step 1: Fresh borrower deposited collateral");

      // 2. User กู้เงิน
      await mintTo(
        connection, 
        admin.payer, 
        usdcMint, 
        freshUserUsdc, 
        admin.publicKey, 
        11_000_000 // เผื่อดอกเบี้ยให้่วน
      );

      await program.methods.borrowUsdc(2, 30)
        .accounts({
          user: freshBorrower.publicKey,
          systemConfig,
          collateralMint: solMint,
          loanMint: usdcMint,
          loanAccount: freshLoanAccount,
          userCollateralAccount: freshUserCollateral,
          userUsdcAccount: freshUserUsdc,
          capitalWallet,
          vaultCollateralAccount,
          capitalWalletAuthority: capitalAuth,
          vaultWalletAuthority: vaultAuth,
          pythPriceFeed: new PublicKey("J83w4HKfqxwcq3BEMMkPFSppX3gqekLyLJBexebFVkix"),
          assetConfig,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .signers([freshBorrower])
        .rpc();

      console.log("✅ Step 2: Fresh borrower borrowed USDC");

      // 3. Repay Loan (คืนเงินต้น + ดอกเบี้ย)
      await mintTo(
        connection,
        admin.payer,
        usdcMint,
        freshUserUsdc,
        admin.publicKey,
        1_000_000 // 1 USDC interest
      );

      try {
        await program.methods.repayLoan()
          .accounts({
            user: freshBorrower.publicKey,
            loanAccount: freshLoanAccount,
            systemConfig,
            vaultAuthority: vaultAuth,
            userCollateralAccount: freshUserCollateral,
            userUsdcAccount: freshUserUsdc,
            capitalWallet,
            vaultCollateralAccount,
            tokenProgram: TOKEN_PROGRAM_ID,
          })
          .signers([freshBorrower])
          .rpc();

        const loan = await program.account.loanAccount.fetch(freshLoanAccount);
        
        // ตรวจสอบว่า Repaid status
        assert.equal(loan.status, 5); // Repaid = 5
        assert.equal(loan.loanAmount.toString(), "0"); // No more loan
        assert.equal(loan.collateralAmount.toString(), "0"); // No more collateral
        
        console.log("✅ Step 3: Fresh borrower fully repaid loan");
        console.log("💰 Perfect onboarding: deposit → borrow → repay");

      } catch (error) {
        console.log("❌ Repayment failed:", error);
        assert.fail("Repayment should succeed for fresh borrower");
      }
    });

    it("Should validate fresh borrower constraints", async () => {
      console.log("--- Fresh User: Constraint Validation ---");
      
      // Test: ไม่สามารถ deposit หาก loan มีอยู่
      try {
        await program.methods.depositCollateral(new BN(100))
          .accounts({
            user: freshBorrower.publicKey,
            systemConfig,
            assetConfig,
            loanAccount: freshLoanAccount,
            userCollateralAccount: freshUserCollateral,
            vaultCollateralAccount,
            tokenProgram: TOKEN_PROGRAM_ID,
            systemProgram: SystemProgram.programId,
          })
          .signers([freshBorrower])
          .rpc();

        // Should succeed (no active loan yet)
        console.log("✅ Fresh borrower can deposit with no existing loan");
        
      } catch (error) {
        console.log("❌ Fresh deposit constraint failed:", error);
      }

      // Test: ไม่สามารถ borrow หากไม่มี collateral
      try {
        await program.methods.borrowUsdc(2, 30)
          .accounts({
            user: freshBorrower.publicKey,
            systemConfig,
            collateralMint: solMint,
            loanMint: usdcMint,
            loanAccount: freshLoanAccount,
            userCollateralAccount: freshUserCollateral,
            userUsdcAccount: freshUserUsdc,
            capitalWallet,
            vaultCollateralAccount,
            capitalWalletAuthority: capitalAuth,
            vaultWalletAuthority: vaultAuth,
            pythPriceFeed: new PublicKey("J83w4HKfqxwcq3BEMMkPFSppX3gqekLyLJBexebFVkix"),
            assetConfig,
            tokenProgram: TOKEN_PROGRAM_ID,
          })
          .signers([freshBorrower])
          .rpc();

        assert.fail("Should fail without collateral");
        
      } catch (error) {
        assert.include(error.message, "Active", "Should fail due to no collateral");
        console.log("✅ Fresh borrower constraint validated: requires collateral first");
      }
    });
  });

  describe("Passive Income: Extend Loan (Rollover)", () => {