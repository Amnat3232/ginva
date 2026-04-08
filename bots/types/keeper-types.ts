// Types for Ginva Keeper Dual Mode System

/**
 * Keeper Mode Enumeration
 * Defines the two operational modes for Ginva Keeper
 */
export enum KeeperMode {
  FULL_ACCESS = "full_access", // AI holds private key directly (fastest)
  SECURE_SCOPED = "secure_scoped", // Uses Solblade + MCP (highest security)
}

/**
 * Keeper Configuration Interface
 * Contains all configuration options for both modes
 */
export interface KeeperConfig {
  mode: KeeperMode;
  rpcUrl: string;
  programId: string;

  // Full Access Mode Configuration
  privateKey?: string; // Base58 encoded private key (Full Access only)

  // Secure Scoped Mode Configuration (Solblade + MCP)
  solbladeMcpCommand?: string; // Command to start Solblade MCP server (e.g., "bunx solblade mcp serve")
  solbladeWalletName?: string; // Wallet name in Solblade
  spendLimitPerTx?: number; // Maximum SOL per transaction
  spendLimitPerSession?: number; // Maximum SOL per session
  requireHumanConfirmation?: boolean; // Whether to require human confirmation for transactions
  allowlist?: string[]; // List of allowed program IDs/public keys

  // Common Configuration
  keeperRewardPercentage?: number; // Percentage of liquidation reward for keeper (e.g., 0.6 = 60%)
  maxLiquidationAttempts?: number; // Maximum attempts before giving up on a liquidation
  healthFactorThreshold?: number; // Health factor threshold to trigger liquidation
  triggerMinProfit?: number; // Minimum profit in SOL to trigger liquidation
  hunterMinDiscount?: number; // Minimum discount percentage for hunter bot
  hunterMaxInvestment?: number; // Maximum SOL to invest per hunter opportunity
  priorityFee?: number; // Priority fee in microlamports
}
