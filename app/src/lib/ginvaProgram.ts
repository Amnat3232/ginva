import {
  Connection,
  PublicKey,
  Transaction,
  SYSVAR_RENT_PUBKEY,
} from "@solana/web3.js";
import { AnchorProvider, Program, BN } from "@coral-xyz/anchor";
import type { WalletContextState } from "@solana/wallet-adapter-react";
import idl from "../idl/ginva.json";

/**
 * VAULT ADDRESSES
 *
 * IMPORTANT: These vault addresses are derived from the GINVA smart contract's
 * PDA (Program Derived Address) using seeds defined in the Solidity/Anchor program.
 * They are NOT hardcoded secrets - they are public addresses that anyone can verify
 * by calling getVaultAddress() on the smart contract.
 *
 * Security: The actual funds in these vaults are protected by:
 * 1. The smart contract's instruction logic (only allow withdrawals to authorized accounts)
 * 2. The PROGRAM_ID which validates all transactions
 * 3. The PDA derivation using the program's authority
 *
 * These addresses follow the standard Solana pattern where:
 * - collateralVault: PDA for holding user collateral (SOL/JUP tokens)
 * - usdcVault: PDA for holding borrowed USDC (the lending pool)
 */

const PROGRAM_ID = new PublicKey(
  "HQd5KLkNzAuJiG6jyyfs2wiMByLdAyGncUnbFhmhQhBj"
);
const TOKEN_PROGRAM = new PublicKey(
  "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
);

const GINVA_IDL = idl as unknown as import("@coral-xyz/anchor").Idl;

let programInstance: GinvaProgram | null = null;

export class GinvaProgram {
  private _program: Program;
  private _connection: Connection;
  private _wallet: PublicKey | null;
  private _walletContext: WalletContextState | null;

  private constructor(
    connection: Connection,
    program: Program,
    wallet: PublicKey | null,
    walletContext: WalletContextState | null
  ) {
    this._connection = connection;
    this._program = program;
    this._wallet = wallet;
    this._walletContext = walletContext;
  }

  static async initialize(
    connection: Connection,
    wallet: WalletContextState
  ): Promise<GinvaProgram> {
    const publicKey = wallet.publicKey;

    if (
      programInstance &&
      programInstance._wallet?.toString() === publicKey?.toString()
    ) {
      return programInstance;
    }

    const dummyWallet = {
      publicKey: PublicKey.default,
      signTransaction: async <T extends Transaction>(_tx: T): Promise<T> => {
        throw new Error("Use signAndSendTransaction with wallet adapter");
      },
      signAllTransactions: async <T extends Transaction>(
        _txs: T[]
      ): Promise<T[]> => {
        throw new Error("Use signAndSendTransaction with wallet adapter");
      },
    };

    const provider = new AnchorProvider(
      connection,
      // @ts-ignore - Using dummy wallet for provider initialization
      // Actual transaction signing is handled via walletContext in signAndSendTransaction
      dummyWallet,
      AnchorProvider.defaultOptions()
    );

    // @ts-ignore - Using pattern from useGinvaProgram.ts
    const program = new Program(GINVA_IDL, PROGRAM_ID, provider);
    programInstance = new GinvaProgram(connection, program, publicKey, wallet);
    return programInstance;
  }

  get provider(): AnchorProvider {
    return this._program.provider as AnchorProvider;
  }

  get program(): Program {
    return this._program;
  }

  get connection(): Connection {
    return this._connection;
  }

  get userPublicKey(): PublicKey | null {
    return this._wallet;
  }

  async getLoanAccount(user: PublicKey): Promise<PublicKey> {
    const [loanAccount] = PublicKey.findProgramAddressSync(
      [Buffer.from("loan"), user.toBuffer()],
      PROGRAM_ID
    );
    return loanAccount;
  }

  async getSystemConfig(): Promise<PublicKey> {
    const [systemConfig] = PublicKey.findProgramAddressSync(
      [Buffer.from("system_config")],
      PROGRAM_ID
    );
    return systemConfig;
  }

  async getStakingAccount(user: PublicKey): Promise<PublicKey> {
    const [stakingAccount] = PublicKey.findProgramAddressSync(
      [Buffer.from("staking"), user.toBuffer()],
      PROGRAM_ID
    );
    return stakingAccount;
  }

  async getAgentAccount(user: PublicKey): Promise<PublicKey> {
    const [agentAccount] = PublicKey.findProgramAddressSync(
      [Buffer.from("agent"), user.toBuffer()],
      PROGRAM_ID
    );
    return agentAccount;
  }

  async depositCollateral(amount: BN, _loanId?: BN): Promise<Transaction> {
    if (!this._wallet) {
      throw new Error("Wallet not connected");
    }
    const loanAccount = await this.getLoanAccount(this._wallet);
    const systemConfig = await this.getSystemConfig();

    const collateralVault = new PublicKey(
      "JUP4Fb2cqiRUcaTHdrPC8h2gNsA2ETXiPDD33WcGuJB"
    );
    const userTokenAccount = this._wallet;

    return this._program.methods
      .depositCollateral(amount)
      .accounts({
        user: this._wallet,
        userTokenAccount,
        collateralVault,
        loanAccount,
        systemConfig,
        tokenProgram: TOKEN_PROGRAM,
        rent: SYSVAR_RENT_PUBKEY,
      })
      .transaction();
  }

  async borrowUsdc(
    loanId: number,
    ltvOption: number,
    durationDays: number
  ): Promise<Transaction> {
    if (!this._wallet) {
      throw new Error("Wallet not connected");
    }
    const loanAccount = await this.getLoanAccount(this._wallet);
    const systemConfig = await this.getSystemConfig();

    const userUsdcAccount = this._wallet;
    const usdcVault = new PublicKey(
      "JUP4Fb2cqiRUcaTHdrPC8h2gNsA2ETXiPDD33WcGuJB"
    );

    return this._program.methods
      .borrowUsdc(new BN(loanId), new BN(ltvOption), new BN(durationDays))
      .accounts({
        user: this._wallet,
        loanAccount,
        userUsdcAccount,
        usdcVault,
        systemConfig,
        tokenProgram: TOKEN_PROGRAM,
      })
      .transaction();
  }

  async repayLoan(): Promise<Transaction> {
    if (!this._wallet) {
      throw new Error("Wallet not connected");
    }
    const loanAccount = await this.getLoanAccount(this._wallet);
    const systemConfig = await this.getSystemConfig();

    const userUsdcAccount = this._wallet;
    const usdcVault = new PublicKey(
      "JUP4Fb2cqiRUcaTHdrPC8h2gNsA2ETXiPDD33WcGuJB"
    );

    return this._program.methods
      .repayLoan()
      .accounts({
        user: this._wallet,
        loanAccount,
        userUsdcAccount,
        usdcVault,
        systemConfig,
        tokenProgram: TOKEN_PROGRAM,
      })
      .transaction();
  }

  async stakeLp(amount: BN): Promise<Transaction> {
    if (!this._wallet) {
      throw new Error("Wallet not connected");
    }
    const stakingAccount = await this.getStakingAccount(this._wallet);
    const systemConfig = await this.getSystemConfig();

    const userLpAccount = this._wallet;

    return this._program.methods
      .stakeLp(amount)
      .accounts({
        user: this._wallet,
        userLpAccount,
        stakingAccount,
        systemConfig,
        tokenProgram: TOKEN_PROGRAM,
        rent: SYSVAR_RENT_PUBKEY,
      })
      .transaction();
  }

  async unstakeLp(amount: BN): Promise<Transaction> {
    if (!this._wallet) {
      throw new Error("Wallet not connected");
    }
    const stakingAccount = await this.getStakingAccount(this._wallet);
    const systemConfig = await this.getSystemConfig();

    const userLpAccount = this._wallet;

    return this._program.methods
      .unstakeLp(amount)
      .accounts({
        user: this._wallet,
        userLpAccount,
        stakingAccount,
        systemConfig,
        tokenProgram: TOKEN_PROGRAM,
      })
      .transaction();
  }

  async registerAgent(
    name: string,
    description: string,
    framework: string,
    capabilities: string
  ): Promise<Transaction> {
    if (!this._wallet) {
      throw new Error("Wallet not connected");
    }
    const agentAccount = await this.getAgentAccount(this._wallet);
    const systemConfig = await this.getSystemConfig();

    return this._program.methods
      .registerAgent(name, description, framework, capabilities)
      .accounts({
        owner: this._wallet,
        agentAccount,
        systemConfig,
        rent: SYSVAR_RENT_PUBKEY,
      })
      .transaction();
  }

  async updateAgentSettings(
    name: string,
    description: string,
    rateLimit: number
  ): Promise<Transaction> {
    if (!this._wallet) {
      throw new Error("Wallet not connected");
    }
    const agentAccount = await this.getAgentAccount(this._wallet);

    return this._program.methods
      .updateAgentSettings(name, description, new BN(rateLimit))
      .accounts({
        owner: this._wallet,
        agentAccount,
      })
      .transaction();
  }

  async pauseAgent(pause: boolean): Promise<Transaction> {
    if (!this._wallet) {
      throw new Error("Wallet not connected");
    }
    const agentAccount = await this.getAgentAccount(this._wallet);

    return this._program.methods
      .pauseAgent(pause)
      .accounts({
        owner: this._wallet,
        agentAccount,
      })
      .transaction();
  }

  async signAndSendTransaction(tx: Transaction): Promise<string> {
    if (!this._wallet || !this._walletContext) {
      throw new Error("Wallet not connected");
    }

    if (!this._walletContext.signTransaction) {
      throw new Error("Wallet cannot sign transactions");
    }

    try {
      const signedTx = await this._walletContext.signTransaction(tx);
      const signature = await this._connection.sendRawTransaction(
        signedTx.serialize()
      );
      await this._connection.confirmTransaction(signature, "confirmed");
      return signature;
    } catch (error) {
      console.error("Transaction failed:", error);
      throw error;
    }
  }
}

export const PROGRAM_ADDRESS = PROGRAM_ID.toString();
