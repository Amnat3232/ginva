declare module "@solana/spl-token" {
  export function getAssociatedTokenAddress(
    mint: any,
    owner: any,
    allowOffScreen?: boolean,
    programId?: any,
    associatedTokenProgramId?: any
  ): Promise<any>;

  export function createAssociatedTokenAccountInstruction(
    payer: any,
    associatedToken: any,
    owner: any,
    mint: any,
    programId?: any,
    associatedTokenProgramId?: any
  ): any;

  export function createMint(
    connection: any,
    payer: any,
    mintAuthority: any,
    freezeAuthority: any,
    decimals: number,
    programId?: any,
    associatedTokenProgramId?: any
  ): Promise<any>;

  export function mintTo(
    connection: any,
    payer: any,
    mint: any,
    dest: any,
    authority: any,
    amount: number,
    multiSigners?: any[],
    programId?: any,
    associatedTokenProgramId?: any
  ): Promise<any>;

  export function getOrCreateAssociatedTokenAccount(
    connection: any,
    payer: any,
    mint: any,
    owner: any,
    allowOffScreen?: boolean,
    commitment?: any,
    programId?: any,
    associatedTokenProgramId?: any
  ): Promise<any>;

  export function getAccount(
    connection: any,
    address: any,
    commitment?: any,
    programId?: any
  ): Promise<any>;
}
