#!/usr/bin/env node
/**
 * 🤖 GINVA AGENT BOT INTEGRATION
 *
 * This module adds Agent Keeper Program integration to the existing bots:
 * - Agent Registration
 * - Agent Operation Recording
 * - Agent Rewards Claiming
 *
 * Run: ts-node bots/agent-integration.ts
 */

import * as anchor from "@coral-xyz/anchor";
import { Program, Wallet } from "@coral-xyz/anchor";
import { Connection, PublicKey, Keypair } from "@solana/web3.js";
import { getAssociatedTokenAddress } from "@solana/spl-token";
import * as dotenv from "dotenv";
import * as fs from "fs";

// Load environment
dotenv.config();

// ═══════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════

const RPC_URL = process.env.RPC_URL || "https://api.devnet.solana.com";
const PROGRAM_ID = new PublicKey(
  process.env.PROGRAM_ID || "9BRKxrDaC6D7XLVqwZSMeqkNPhYHdpogwxC5Dph4F9Hf"
);

// Agent Configuration
const AGENT_CONFIG = {
  name: "Ginva Keeper Bot",
  description: "Automated liquidation bot for Ginva Protocol",
  framework: "Custom",
  rateLimitSeconds: 15,
  minHealthFactor: 80,
  maxSlippageBps: 2000,
};

// Revenue Share Constants (must match contract)
const REVENUE_SHARE = {
  HUMAN: 4500, // 45%
  AI_AGENT: 3500, // 35%
  SAFETY: 1500, // 15%
  DEV: 500, // 5%
};

// Operation Types
const OPERATION_TYPES = {
  LIQUIDATE: 1,
  BUY: 2,
  FINALIZE: 3,
};

// ═══════════════════════════════════════════════════════════
// UTILITY FUNCTIONS
// ═══════════════════════════════════════════════════════════

/**
 * Find Agent PDA address
 */
async function findAgentPDA(
  program: Program,
  owner: PublicKey
): Promise<PublicKey> {
  const [agentPDA] = await PublicKey.findProgramAddress(
    [Buffer.from("agent"), owner.toBuffer()],
    program.programId
  );
  return agentPDA;
}

/**
 * Find Agent Revenue Distribution PDA
 */
async function findRevenuePDA(program: Program): Promise<PublicKey> {
  const [revenuePDA] = await PublicKey.findProgramAddress(
    [Buffer.from("agent_revenue")],
    program.programId
  );
  return revenuePDA;
}

/**
 * Calculate revenue shares
 */
function calculateRevenueShares(amount: number): {
  human: number;
  aiAgent: number;
  safety: number;
  dev: number;
} {
  return {
    human: Math.floor((amount * REVENUE_SHARE.HUMAN) / 10000),
    aiAgent: Math.floor((amount * REVENUE_SHARE.AI_AGENT) / 10000),
    safety: Math.floor((amount * REVENUE_SHARE.SAFETY) / 10000),
    dev: Math.floor((amount * REVENUE_SHARE.DEV) / 10000),
  };
}

/**
 * Register a new Agent
 */
async function registerAgent(
  program: Program,
  owner: PublicKey,
  usdcAccount: PublicKey
): Promise<boolean> {
  try {
    const agentPDA = await findAgentPDA(program, owner);

    // Check if already registered
    try {
      const existingAgent = await program.account.agentAccount.fetch(agentPDA);
      if (existingAgent && existingAgent.agentPubkey.equals(owner)) {
        console.log("Agent already registered");
        return false;
      }
    } catch {
      // Agent doesn't exist, proceed with registration
    }

    const tx = await program.methods
      .registerAgent(
        AGENT_CONFIG.name,
        AGENT_CONFIG.description,
        AGENT_CONFIG.framework
      )
      .accounts({
        owner: owner,
        agentAccount: agentPDA,
        usdcAccount: usdcAccount,
      })
      .rpc();

    console.log("Agent registered successfully!");
    console.log("Transaction:", tx);
    return true;
  } catch (error) {
    console.error("Failed to register agent:", error);
    return false;
  }
}

/**
 * Record an Agent operation for rewards
 */
async function recordAgentOperation(
  program: Program,
  agent: PublicKey,
  loanAccount: PublicKey,
  operationType: number,
  rewardAmount: number,
  success: boolean,
  responseTimeMs: number
): Promise<boolean> {
  try {
    const agentPDA = await findAgentPDA(program, agent);
    const revenuePDA = await findRevenuePDA(program);

    const tx = await program.methods
      .recordAgentOperation(
        loanAccount,
        operationType,
        rewardAmount,
        success,
        responseTimeMs
      )
      .accounts({
        agent: agent,
        agentAccount: agentPDA,
        revenueDistribution: revenuePDA,
      })
      .rpc();

    // Log revenue shares
    const shares = calculateRevenueShares(rewardAmount);
    console.log("Operation recorded successfully!");
    console.log("Revenue shares:", {
      human: shares.human / 1000000,
      aiAgent: shares.aiAgent / 1000000,
      safety: shares.safety / 1000000,
      dev: shares.dev / 1000000,
    });

    return true;
  } catch (error) {
    console.error("Failed to record operation:", error);
    return false;
  }
}

/**
 * Claim Agent rewards
 */
async function claimAgentRewards(
  program: Program,
  agent: PublicKey,
  agentUsdcAccount: PublicKey
): Promise<number> {
  try {
    const agentPDA = await findAgentPDA(program, agent);
    const revenuePDA = await findRevenuePDA(program);

    // Check pending rewards first
    const agentAccount = await program.account.agentAccount.fetch(agentPDA);
    const pendingRewards = agentAccount.pendingRewards as number;

    if (pendingRewards === 0) {
      console.log("No pending rewards to claim");
      return 0;
    }

    const tx = await program.methods
      .claimAgentRewards()
      .accounts({
        agent: agent,
        agentAccount: agentPDA,
        revenueDistribution: revenuePDA,
        agentUsdcAccount: agentUsdcAccount,
      })
      .rpc();

    console.log(`Claimed ${pendingRewards / 1000000} USDC in rewards!`);
    console.log("Transaction:", tx);

    return pendingRewards;
  } catch (error) {
    console.error("Failed to claim rewards:", error);
    return 0;
  }
}

/**
 * Update Agent settings
 */
async function updateAgentSettings(
  program: Program,
  owner: PublicKey,
  settings: {
    rateLimitSeconds?: number;
    minHealthFactor?: number;
    maxSlippageBps?: number;
  }
): Promise<boolean> {
  try {
    const agentPDA = await findAgentPDA(program, owner);

    const tx = await program.methods
      .updateAgentSettings(
        undefined, // maxConcurrentOps
        settings.rateLimitSeconds,
        settings.minHealthFactor,
        settings.maxSlippageBps
      )
      .accounts({
        owner: owner,
        agentAccount: agentPDA,
      })
      .rpc();

    console.log("Agent settings updated!");
    console.log("Transaction:", tx);
    return true;
  } catch (error) {
    console.error("Failed to update settings:", error);
    return false;
  }
}

/**
 * Get Agent account info
 */
async function getAgentInfo(
  program: Program,
  owner: PublicKey
): Promise<{
  status: string;
  pendingRewards: number;
  successRate: number;
  totalEarnings: number;
} | null> {
  try {
    const agentPDA = await findAgentPDA(program, owner);
    const agent = await program.account.agentAccount.fetch(agentPDA);

    const statusMap: Record<number, string> = {
      0: "Active",
      1: "Disabled",
      2: "UnderReview",
      3: "Suspended",
      4: "Unregistered",
    };

    return {
      status: statusMap[agent.status as number] || "Unknown",
      pendingRewards: (agent.pendingRewards as number) / 1000000,
      successRate: (agent.performance.successRate as number) / 100,
      totalEarnings: (agent.performance.totalEarnings as number) / 1000000,
    };
  } catch (error) {
    return null;
  }
}

// ═══════════════════════════════════════════════════════════
// MAIN FUNCTIONS
// ═══════════════════════════════════════════════════════════

/**
 * Initialize Agent (call once)
 */
async function initializeAgent() {
  console.log("🤖 Initializing Ginva Agent...");

  // Setup connection and program
  const connection = new Connection(RPC_URL, "confirmed");

  // Load wallet (implement based on your setup)
  // const wallet = loadWallet();
  // const program = loadProgram(wallet, connection);

  console.log("Agent initialization complete!");
  console.log("Configuration:", AGENT_CONFIG);
}

/**
 * Run Agent with operation recording
 */
async function runAgentWithRecording() {
  console.log("🤖 Running Agent with operation recording...");

  // This would be called by the main keeper bot
  // after each liquidation operation
}

// Export functions for use by keeper bots
export {
  registerAgent,
  recordAgentOperation,
  claimAgentRewards,
  updateAgentSettings,
  getAgentInfo,
  findAgentPDA,
  findRevenuePDA,
  calculateRevenueShares,
  OPERATION_TYPES,
  REVENUE_SHARE,
};

// Run if executed directly
if (require.main === module) {
  initializeAgent().catch(console.error);
}
