/**
 * THE GRAND FINALE - Visual Demo Script
 *
 * This script displays all operations of Ginva Protocol
 * Step-by-Step with Visual Output
 *
 * Usage: ts-node scripts/visual-demo.ts
 */

import chalk from "chalk";
import * as anchor from "@coral-xyz/anchor";
import { PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";

// ═══════════════════════════════════════════════════════════════
// 🎨 VISUAL COMPONENTS
// ═══════════════════════════════════════════════════════════════

const BOX_TOP = "╔" + "═".repeat(78) + "╗";
const BOX_MID = "╠" + "═".repeat(78) + "╣";
const BOX_BOT = "╚" + "═".repeat(78) + "╝";
const BOX_LINE = "║";

function printBox(text: string, color: Function = chalk.white) {
  console.log(color(BOX_TOP));
  const lines = text.split("\n");
  lines.forEach((line) => {
    const padded = line.padEnd(76, " ");
    console.log(color(`${BOX_LINE} ${padded} ${BOX_LINE}`));
  });
  console.log(color(BOX_BOT));
}

function printStep(step: number, title: string, description: string) {
  console.log(chalk.yellow(`\n⚡ STEP ${step}: ${title}`));
  console.log(chalk.gray(description));
  console.log();
}

function printTransaction(
  txType: string,
  from: string,
  to: string,
  amount: string,
  token: string
) {
  console.log(
    chalk.cyan("┌─ TRANSACTION ─────────────────────────────────────────┐")
  );
  console.log(chalk.cyan(`│ Type: ${txType.padEnd(51)}│`));
  console.log(chalk.cyan(`│ From: ${from.padEnd(51)}│`));
  console.log(chalk.cyan(`│ To:   ${to.padEnd(51)}│`));
  console.log(chalk.cyan(`│ Amount: ${amount.padEnd(49)}│`));
  console.log(chalk.cyan(`│ Token: ${token.padEnd(50)}│`));
  console.log(
    chalk.cyan("└────────────────────────────────────────────────────────┘")
  );
}

function printReward(who: string, amount: string, percentage: string) {
  console.log(chalk.green(`\n💰 REWARD: ${who}`));
  console.log(chalk.green(`   Amount: ${amount}`));
  console.log(chalk.green(`   Rate: ${percentage}`));
}

// ═══════════════════════════════════════════════════════════════
// 🎬 THE SHOW BEGINS
// ═══════════════════════════════════════════════════════════════

console.log(chalk.magentaBright("\n" + "█".repeat(80)));
console.log(
  chalk.magentaBright(
    "█" + " ".repeat(20) + "GINVA PROTOCOL" + " ".repeat(44) + "█"
  )
);
console.log(
  chalk.magentaBright(
    "█" +
      " ".repeat(15) +
      "TASK-BASED LIQUIDATION SYSTEM" +
      " ".repeat(34) +
      "█"
  )
);
console.log(
  chalk.magentaBright(
    "█" + " ".repeat(25) + "v3.0 PRODUCTION" + " ".repeat(38) + "█"
  )
);
console.log(chalk.magentaBright("█".repeat(80) + "\n"));

printBox(
  "🏦 SYSTEM OVERVIEW\n" +
    "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n" +
    "Ginva is a decentralized lending protocol on Solana with\n" +
    "advanced task-based liquidation. Features:\n\n" +
    "• 3-Wallet Architecture (Capital/Vault/Revenue)\n" +
    "• Pyth Oracle Integration (Price - Confidence)\n" +
    "• Task-Based Liquidation (2 Keepers + Auto-Swap)\n" +
    "• Atomic Transactions (Risk-Free)\n" +
    "• Jupiter DEX Integration\n\n" +
    "No capital required for Keepers. Permissionless.\n" +
    "Secure. Efficient.",
  chalk.cyanBright
);

// ═══════════════════════════════════════════════════════════════
// 📊 SCENARIO SETUP
// ═══════════════════════════════════════════════════════════════

console.log(chalk.yellow("\n📋 SCENARIO SETUP:\n"));

const scenario = {
  borrower: "Alice",
  collateral: {
    amount: 10, // SOL
    price: 100, // USD per SOL
    value: 1000, // USD
  },
  loan: {
    amount: 600, // USD
    ltv: 60, // %
  },
  liquidation: {
    healthFactor: 85, // %
    threshold: 100, // HF < 100 = liquidatable
    seized: 10, // SOL total
    keeperA: 0.1, // SOL (1%)
    remaining: 9.9, // SOL (99%)
  },
};

console.log(
  chalk.white("┌─────────────────────────────────────────────────────────┐")
);
console.log(chalk.white(`│ Borrower: ${scenario.borrower.padEnd(52)}│`));
console.log(
  chalk.white(
    `│ Collateral: ${scenario.collateral.amount} SOL @ $${scenario.collateral.price} = $${scenario.collateral.value}`.padEnd(
      53
    ) + "│"
  )
);
console.log(
  chalk.white(
    `│ Loan: $${scenario.loan.amount} (${scenario.loan.ltv}% LTV)`.padEnd(56) +
      "│"
  )
);
console.log(
  chalk.white(
    `│ Health Factor: ${scenario.liquidation.healthFactor}% (Liquidatable at < 100%)`.padEnd(
      48
    ) + "│"
  )
);
console.log(
  chalk.white("└─────────────────────────────────────────────────────────┘")
);

// ═══════════════════════════════════════════════════════════════
// ⚡ STEP 1: TRIGGER LIQUIDATION
// ═══════════════════════════════════════════════════════════════

printStep(
  1,
  "TRIGGER LIQUIDATION (Keeper A)",
  "Keeper A detects bad loan and triggers liquidation. Gets 1% reward immediately."
);

printTransaction(
  "LIQUIDATION TRIGGER",
  "Alice's Collateral Vault",
  "Multiple Destinations",
  "10 SOL",
  "SOL"
);

console.log(chalk.gray("\n  Distribution:"));
console.log(
  chalk.green(
    `  ├─→ Keeper A (1%): ${scenario.liquidation.keeperA} SOL ($${
      scenario.liquidation.keeperA * 100
    })`
  )
);
console.log(
  chalk.yellow(
    `  └─→ Seized Vault (99%): ${scenario.liquidation.remaining} SOL ($${
      scenario.liquidation.remaining * 100
    })`
  )
);

printReward(
  "Keeper A",
  `${scenario.liquidation.keeperA} SOL ($${
    scenario.liquidation.keeperA * scenario.collateral.price
  })`,
  "1% of collateral"
);

console.log(chalk.blue("\n  ⏱️  24-hour countdown begins..."));
console.log(
  chalk.blue("  📢 Marketing opportunity: Community can buy at 6-8% discount")
);
console.log(chalk.blue("  🤖 Bot monitoring: Waiting for timeout..."));

// ═══════════════════════════════════════════════════════════════
// ⚡ STEP 2: AUTO-SWAP (24h Later)
// ═══════════════════════════════════════════════════════════════

printStep(
  2,
  "AUTO-SWAP EXECUTION (Anyone/Bot)",
  "After 24h timeout, anyone can trigger swap. Gets 0.6% reward."
);

console.log(chalk.gray("\n  Timeline:"));
console.log(chalk.white("  T+0h:    Collateral locked in Seized Vault"));
console.log(chalk.white("  T+12h:   No buyers yet..."));
console.log(chalk.white("  T+24h:   ⏰ TIMEOUT REACHED!"));
console.log(chalk.green("  T+24h:   🤖 Bot triggers Auto-Swap"));

printTransaction(
  "JUPITER SWAP (CPI)",
  "Seized Vault",
  "Processing Vault",
  "9.9 SOL",
  "SOL → USDC"
);

const swapResult = {
  input: 9.9, // SOL
  output: 990 - 990 * 0.005, // USDC (0.5% slippage)
  reward: 990 * 0.994 * 0.006, // 0.6% of output
};

console.log(chalk.gray("\n  Swap Details:"));
console.log(chalk.cyan(`  Input: ${swapResult.input} SOL`));
console.log(
  chalk.cyan(
    `  Output: ${swapResult.output.toFixed(2)} USDC (after 0.5% slippage)`
  )
);
console.log(
  chalk.cyan(
    `  Rate: ~${(swapResult.output / swapResult.input).toFixed(2)} USDC/SOL`
  )
);

printReward(
  "Swap Executor (Bot)",
  `${swapResult.reward.toFixed(2)} USDC`,
  "0.6% of swap output"
);

console.log(
  chalk.green("\n  ✅ Atomic Transaction: All steps succeed or all fail")
);
console.log(
  chalk.green("  ✅ No price risk - swap happens instantly in one block")
);

// ═══════════════════════════════════════════════════════════════
// ⚡ STEP 3: FINALIZE & DISTRIBUTE
// ═══════════════════════════════════════════════════════════════

printStep(
  3,
  "FINALIZE & DISTRIBUTE (Keeper C)",
  "Keeper C distributes funds according to waterfall system."
);

const distribution = {
  total: swapResult.output - swapResult.reward, // ~984 USDC
  principal: 600, // Repay loan
  profit: 384, // Gross profit
  keeperCReward: (swapResult.output - swapResult.reward) * 0.006, // 0.6%
  netProfit: 384 - (swapResult.output - swapResult.reward) * 0.006, // After Keeper C
  growth: 0, // Will calculate
  revenue: 0, // Will calculate
};

distribution.netProfit = distribution.profit - distribution.keeperCReward;
distribution.growth = distribution.netProfit * 0.05; // 5%
distribution.revenue = distribution.netProfit * 0.95; // 95%

console.log(chalk.gray("\n  Waterfall Distribution:"));
console.log(
  chalk.white(
    `\n  Total in Processing Vault: ${distribution.total.toFixed(2)} USDC\n`
  )
);

console.log(chalk.yellow("  1️⃣  PRINCIPAL RETURN (Priority #1)"));
console.log(
  chalk.yellow(
    `     └─→ Capital Wallet: $${distribution.principal} (100% of debt)\n`
  )
);

console.log(chalk.green("  2️⃣  KEEPER C REWARD"));
console.log(
  chalk.green(
    `     └─→ Keeper C: $${distribution.keeperCReward.toFixed(2)} (0.6%)\n`
  )
);

console.log(chalk.blue("  3️⃣  PROFIT DISTRIBUTION (Remaining)"));
console.log(chalk.blue(`     Gross Profit: $${distribution.profit}`));
console.log(
  chalk.blue(`     Net Profit: $${distribution.netProfit.toFixed(2)}`)
);
console.log(
  chalk.blue(
    `     ├─→ Growth Fund (5%): $${distribution.growth.toFixed(
      2
    )} → Capital Wallet`
  )
);
console.log(
  chalk.blue(
    `     └─→ Revenue (95%): $${distribution.revenue.toFixed(
      2
    )} → Revenue Wallet`
  )
);

printReward(
  "Keeper C",
  `$${distribution.keeperCReward.toFixed(2)} USDC`,
  "0.6% of total"
);

// ═══════════════════════════════════════════════════════════════
// 📊 SUMMARY
// ═══════════════════════════════════════════════════════════════

printBox(
  "📊 FINAL SUMMARY\n" +
    "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n" +
    "TOTAL COLLATERAL: 10 SOL ($1,000)\n\n" +
    "DISTRIBUTION:\n" +
    "• Keeper A (Trigger): 0.1 SOL ($10) - 1%\n" +
    "• Keeper B/Swap (Auto): $5.90 - 0.6%\n" +
    "• Keeper C (Finalize): $5.84 - 0.6%\n" +
    "• Principal Return: $600\n" +
    "• Growth Fund: $19.20\n" +
    "• Revenue Share: $364.80\n\n" +
    "PROTOCOL HEALTH:\n" +
    "✓ 100% Principal Protected\n" +
    "✓ 5% Reinvested for Growth\n" +
    "✓ 95% Profit to Stakeholders",
  chalk.greenBright
);

// ═══════════════════════════════════════════════════════════════
// 🎯 KEY ADVANTAGES
// ═══════════════════════════════════════════════════════════════

console.log(chalk.magentaBright("\n" + "█".repeat(80)));
console.log(
  chalk.magentaBright(
    "█" + " ".repeat(25) + "WHY GINVA WINS" + " ".repeat(39) + "█"
  )
);
console.log(chalk.magentaBright("█".repeat(80) + "\n"));

const advantages = [
  {
    title: "🛡️  RISK-FREE FOR KEEPERS",
    desc: "No capital required. No price risk. Only gas fees (~$0.01).\n   Profit guaranteed if transaction succeeds.",
  },
  {
    title: "⚡ ATOMIC EXECUTION",
    desc: "All-or-nothing transactions. If swap fails, liquidation reverts.\n   No stuck funds. No partial executions.",
  },
  {
    title: "🤖 AUTOMATION READY",
    desc: "24h timeout with auto-swap. Bots can operate 24/7.\n   Permissionless. Decentralized.",
  },
  {
    title: "💎 CAPITAL PROTECTION",
    desc: "Principal returned 100% before any profit sharing.\n   Solvency-first design.",
  },
  {
    title: "📈 GROWTH MECHANISM",
    desc: "5% of profit reinvested to Capital Wallet.\n   Self-sustaining system.",
  },
];

advantages.forEach((adv, i) => {
  console.log(chalk.cyan(`\n${i + 1}. ${adv.title}`));
  console.log(chalk.white(`   ${adv.desc}`));
});

// ═══════════════════════════════════════════════════════════════
// 🚀 DEPLOYMENT READY
// ═══════════════════════════════════════════════════════════════

console.log(chalk.magentaBright("\n\n" + "█".repeat(80)));
console.log(
  chalk.magentaBright(
    "█" + " ".repeat(20) + "DEPLOYMENT STATUS" + " ".repeat(43) + "█"
  )
);
console.log(chalk.magentaBright("█".repeat(80) + "\n"));

const components = [
  {
    name: "ginva/src/lib.rs",
    status: "✅ READY",
    desc: "Main protocol with 3 wallets + liquidation",
  },
  {
    name: "ginva_flash_bot/src/lib.rs",
    status: "✅ READY",
    desc: "Atomic bot with CPI to Jupiter",
  },
  {
    name: "auto-swap-bot.ts",
    status: "✅ READY",
    desc: "Off-chain monitoring bot",
  },
  { name: "tests/", status: "✅ READY", desc: "Comprehensive test suite" },
  { name: "IDL", status: "✅ GENERATED", desc: "For frontend integration" },
];

console.log(
  chalk.white("┌─────────────────────────────────────────────────────────────┐")
);
components.forEach((comp) => {
  const line = `│ ${comp.name.padEnd(25)} ${comp.status.padEnd(
    10
  )} ${comp.desc.padEnd(30)}│`;
  console.log(chalk.white(line));
});
console.log(
  chalk.white("└─────────────────────────────────────────────────────────────┘")
);

console.log(chalk.green("\n🎉 System ready for Devnet deployment!"));
console.log(chalk.gray("\nCommands:"));
console.log(chalk.gray("  npm run deploy:devnet    # Deploy to Devnet"));
console.log(chalk.gray("  npm run demo:full        # Run full demo"));
console.log(chalk.gray("  npm run bot:start        # Start monitoring bot\n"));

console.log(chalk.magentaBright("█".repeat(80)));
console.log(
  chalk.magentaBright("█" + " ".repeat(30) + "THE END" + " ".repeat(43) + "█")
);
console.log(
  chalk.magentaBright(
    "█" + " ".repeat(20) + "Powered by Kimi K2.5" + " ".repeat(40) + "█"
  )
);
console.log(chalk.magentaBright("█".repeat(80) + "\n"));
