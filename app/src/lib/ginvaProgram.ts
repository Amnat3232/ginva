import {
  Connection,
  PublicKey,
  Transaction,
  SYSVAR_RENT_PUBKEY,
} from "@solana/web3.js";
import { AnchorProvider, Program, BN, web3 } from "@coral-xyz/anchor";
import idl from "../idl/ginva.json";

const PROGRAM_ID = new PublicKey(
  "6U1QUPxGuWLU9jizzcJiLsKzZU6LT95FzihaVzLsk8xU"
);
const TOKEN_PROGRAM = new PublicKey(
  "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
);

const GINVA_IDL = idl as any;

let programInstance: GinvaProgram | null = null;

export class GinvaProgram {
  private program: Program;
  private connection: Connection;

  private constructor(connection: Connection, program: Program) {
    this.connection = connection;
    this.program = program;
  }

  static async initialize(
    connection: Connection,
    wallet: unknown
  ): Promise<GinvaProgram> {
    const walletAdapter = wallet as {
      publicKey: PublicKey | null;
      signTransaction?: (tx: Transaction) => Promise<Transaction>;
      signAllTransactions?: (txs: Transaction[]) => Promise<Transaction[]>;
    };

    if (
      programInstance &&
      programInstance.wallet?.publicKey?.toString() ===
        walletAdapter.publicKey?.toString()
    ) {
      return programInstance;
    }

    const provider = new AnchorProvider(
      connection,
      {
        publicKey: walletAdapter.publicKey || web3.PublicKey.default,
        signTransaction: async (tx: Transaction) => {
          if (!walletAdapter.signTransaction)
            throw new Error("Wallet not connected");
          return walletAdapter.signTransaction(tx);
        },
        signAllTransactions: async (txs: Transaction[]) => {
          if (!walletAdapter.signAllTransactions)
            throw new Error("Wallet not connected");
          return walletAdapter.signAllTransactions(txs);
        },
      },
      AnchorProvider.defaultOptions()
    );

    const program = new Program(GINVA_IDL, PROGRAM_ID, provider);
    programInstance = new GinvaProgram(connection, program);
    return programInstance;
  }

  get wallet(): unknown {
    return (this.program.provider as unknown as { wallet: unknown }).wallet;
  }

  getProvider(): AnchorProvider {
    return this.program.provider as AnchorProvider;
  }

  getProgram(): Program {
    return this.program;
  }

  getUserPublicKey(): PublicKey | null {
    return this.wallet?.publicKey || null;
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

  async depositCollateral(amount: BN, loanId?: BN): Promise<Transaction> {
    const user = this.wallet!.publicKey!;
    const loanAccount = await this.getLoanAccount(user);
    const systemConfig = await this.getSystemConfig();

    const collateralVault = new PublicKey(
      "JUP4Fb2cqiRUcaTHdrPC8h2gNsA2ETXiPDD33WcGuJB"
    );
    const userTokenAccount = user;

    return this.program.methods
      .depositCollateral(amount)
      .accounts({
        user,
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
    const user = this.wallet!.publicKey!;
    const loanAccount = await this.getLoanAccount(user);
    const systemConfig = await this.getSystemConfig();

    const userUsdcAccount = user;
    const usdcVault = new PublicKey(
      "JUP4Fb2cqiRUcaTHdrPC8h2gNsA2ETXiPDD33WcGuJB"
    );

    return this.program.methods
      .borrowUsdc(new BN(loanId), new BN(ltvOption), new BN(durationDays))
      .accounts({
        user,
        loanAccount,
        userUsdcAccount,
        usdcVault,
        systemConfig,
        tokenProgram: TOKEN_PROGRAM,
      })
      .transaction();
  }

  async repayLoan(): Promise<Transaction> {
    const user = this.wallet!.publicKey!;
    const loanAccount = await this.getLoanAccount(user);
    const systemConfig = await this.getSystemConfig();

    const userUsdcAccount = user;
    const usdcVault = new PublicKey(
      "JUP4Fb2cqiRUcaTHdrPC8h2gNsA2ETXiPDD33WcGuJB"
    );

    return this.program.methods
      .repayLoan()
      .accounts({
        user,
        loanAccount,
        userUsdcAccount,
        usdcVault,
        systemConfig,
        tokenProgram: TOKEN_PROGRAM,
      })
      .transaction();
  }

  async stakeLp(amount: BN): Promise<Transaction> {
    const user = this.wallet!.publicKey!;
    const stakingAccount = await this.getStakingAccount(user);
    const systemConfig = await this.getSystemConfig();

    const userLpAccount = user;

    return this.program.methods
      .stakeLp(amount)
      .accounts({
        user,
        userLpAccount,
        stakingAccount,
        systemConfig,
        tokenProgram: TOKEN_PROGRAM,
        rent: SYSVAR_RENT_PUBKEY,
      })
      .transaction();
  }

  async unstakeLp(amount: BN): Promise<Transaction> {
    const user = this.wallet!.publicKey!;
    const stakingAccount = await this.getStakingAccount(user);
    const systemConfig = await this.getSystemConfig();

    const userLpAccount = user;

    return this.program.methods
      .unstakeLp(amount)
      .accounts({
        user,
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
    const owner = this.wallet!.publicKey!;
    const agentAccount = await this.getAgentAccount(owner);
    const systemConfig = await this.getSystemConfig();

    return this.program.methods
      .registerAgent(name, description, framework, capabilities)
      .accounts({
        owner,
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
    const owner = this.wallet!.publicKey!;
    const agentAccount = await this.getAgentAccount(owner);

    return this.program.methods
      .updateAgentSettings(name, description, new BN(rateLimit))
      .accounts({
        owner,
        agentAccount,
      })
      .transaction();
  }

  async pauseAgent(pause: boolean): Promise<Transaction> {
    const owner = this.wallet!.publicKey!;
    const agentAccount = await this.getAgentAccount(owner);

    return this.program.methods
      .pauseAgent(pause)
      .accounts({
        owner,
        agentAccount,
      })
      .transaction();
  }

  async signAndSendTransaction(tx: Transaction): Promise<string> {
    const wallet = this.wallet!;
    if (!wallet.signTransaction) {
      throw new Error("Wallet cannot sign transactions");
    }

    const signedTx = await wallet.signTransaction(tx);
    const signature = await this.connection.sendRawTransaction(
      signedTx.serialize()
    );
    await this.connection.confirmTransaction(signature, "confirmed");
    return signature;
  }
}

export const PROGRAM_ADDRESS = PROGRAM_ID.toString();
