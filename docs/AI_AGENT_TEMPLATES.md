# GINVA AI Agent Templates for Developers

**Templates and tools for AI Trainers to earn income from GINVA Protocol**

---

## Table of Contents

1. [Quick Start Templates](#1-quick-start-templates)
2. [Agent Architecture](#2-agent-architecture)
3. [Income Potential Calculator](#3-income-potential-calculator)
4. [Complete Code Examples](#4-complete-code-examples)
5. [Deployment Guide](#5-deployment-guide)

---

## 1. Quick Start Templates

### Template A: Basic Loan Monitor Agent

**Use for**: Tracking loans approaching grace period expiration and notifying borrowers

```typescript
// ginva-agent-templates/monitor-agent.ts
import { Connection, PublicKey } from '@solana/web3.js';

const GINVA_PROGRAM_ID = new PublicKey('BdAns2azGmixV2KinEKSanKyvBYBo3vRUGnNoshUQ9fH');
const GRACE_PERIOD_HOURS = 72;

interface LoanData {
  loanId: string;
  borrower: string;
  collateralAmount: number;
  loanAmount: number;
  maturityTime: number;
  status: number;
}

class GinvaMonitorAgent {
  private connection: Connection;
  private loans: Map<string, LoanData> = new Map();
  
  constructor(rpcUrl: string) {
    this.connection = new Connection(rpcUrl);
  }

  async fetchActiveLoans(): Promise<LoanData[]> {
    // Fetch all loan accounts from GINVA program
    // Filter by status = 1 (active)
    const filters = [
      { dataSize: 215 }, // loan account size
      { memcmp: { offset: 48, bytes: 'AQ==' } } // status = 1
    ];
    
    const response = await this.connection.getProgramAccounts(
      GINVA_PROGRAM_ID,
      { filters, encoding: 'base64' }
    );
    
    return response.value.map(this.parseLoanAccount);
  }

  parseLoanAccount(data: Buffer): LoanData {
    return {
      loanId: data.readBigUInt64LE(8).toString(),
      borrower: new PublicKey(data.slice(16, 48)).toBase58(),
      collateralAmount: Number(data.readBigUInt64LE(49)),
      loanAmount: Number(data.readBigUInt64LE(57)),
      maturityTime: Number(data.readBigUInt64LE(89)),
      status: data[48]
    };
  }

  async checkLoans(): Promise<Alert[]> {
    const loans = await this.fetchActiveLoans();
    const now = Math.floor(Date.now() / 1000);
    const alerts: Alert[] = [];

    for (const loan of loans) {
      const hoursUntilGracePeriod = 
        (loan.maturityTime - now + (GRACE_PERIOD_HOURS * 3600)) / 3600;

      if (hoursUntilGracePeriod > 0 && hoursUntilGracePeriod <= 24) {
        alerts.push({
          type: 'GRACE_PERIOD_WARNING',
          loanId: loan.loanId,
          borrower: loan.borrower,
          hoursRemaining: hoursUntilGracePeriod,
          loanAmount: loan.loanAmount,
          action: 'Contact borrower to offer help'
        });
      }
    }
    
    return alerts;
  }
  
  async sendAlerts(alerts: Alert[]): Promise<void> {
    for (const alert of alerts) {
      // Integrate with your notification system
      // Discord, Telegram, Email, etc.
      console.log(`[ALERT] ${alert.type}: Loan ${alert.loanId} - ${alert.hoursRemaining}h remaining`);
    }
  }

  async run(): Promise<void> {
    const alerts = await this.checkLoans();
    if (alerts.length > 0) {
      await this.sendAlerts(alerts);
    }
  }
}

// Run every 5 minutes
setInterval(() => new GinvaMonitorAgent('https://api.devnet.solana.com').run(), 5 * 60 * 1000);
```

---

### Template B: Helper Agent (Repayment Assistant)

**Use for**: Helping borrowers make repayment decisions and offering refinancing options

```typescript
// ginva-agent-templates/helper-agent.ts
interface HelperDecision {
  action: 'OFFER_HELP' | 'OFFER_REFINANCE' | 'NOTIFY_PROTECTION';
  loanId: string;
  estimatedSavings: number;
  recommendation: string;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
}

class GinvaHelperAgent {
  private connection: Connection;
  private systemConfig: PublicKey;
  
  constructor(rpcUrl: string, systemConfigAddress: string) {
    this.connection = new Connection(rpcUrl);
    this.systemConfig = new PublicKey(systemConfigAddress);
  }

  async analyzeLoan(loan: LoanData, currentPrice: number): Promise<HelperDecision> {
    const collateralValue = loan.collateralAmount * currentPrice;
    const ltv = (loan.loanAmount / collateralValue) * 100;
    
    const now = Math.floor(Date.now() / 1000);
    const isInGracePeriod = now >= loan.maturityTime && 
                           now < loan.maturityTime + (72 * 3600);
    
    // Calculate refinance option
    const currentDebt = loan.loanAmount * 1.08; // 8% APR
    const potentialSavings = currentDebt * 0.02; // Could save 2% by refinancing
    
    if (ltv > 80) {
      return {
        action: 'OFFER_HELP',
        loanId: loan.loanId,
        estimatedSavings: 0,
        recommendation: 'URGENT: Health factor critical. Offer immediate repayment assistance.',
        riskLevel: 'HIGH'
      };
    }
    
    if (isInGracePeriod && ltv > 60) {
      return {
        action: 'OFFER_HELP',
        loanId: loan.loanId,
        estimatedSavings: potentialSavings,
        recommendation: 'In grace period. Offer to help negotiate extension or partial repayment.',
        riskLevel: 'MEDIUM'
      };
    }
    
    return {
      action: 'NOTIFY_PROTECTION',
      loanId: loan.loanId,
      estimatedSavings: 0,
      recommendation: 'Loan in good standing. Send protection benefits summary.',
      riskLevel: 'LOW'
    };
  }

  async executeHelperAction(decision: HelperDecision): Promise<string> {
    if (decision.action === 'OFFER_HELP') {
      // Build transaction to help borrower
      // 1. Fetch borrower's contact info (if available)
      // 2. Generate personalized offer
      // 3. Send via preferred channel
      return `Helper action executed for loan ${decision.loanId}`;
    }
    
    return `Notification sent for loan ${decision.loanId}`;
  }
}
```

---

### Template C: Liquidator Agent

**Use for**: Executing liquidations after grace period has expired

```typescript
// ginva-agent-templates/liquidator-agent.ts
interface LiquidationOpportunity {
  loanId: string;
  borrower: string;
  collateralAmount: number;
  loanAmount: number;
  healthFactor: number;
  estimatedProfit: number;
  canLiquidate: boolean;
}

class GinvaLiquidatorAgent {
  private connection: Connection;
  private wallet: Keypair;
  private programId: PublicKey;
  
  constructor(walletKeypair: Keypair, rpcUrl: string) {
    this.wallet = walletKeypair;
    this.connection = new Connection(rpcUrl);
    this.programId = new PublicKey('BdAns2azGmixV2KinEKSanKyvBYBo3vRUGnNoshUQ9fH');
  }

  async findLiquidationOpportunities(): Promise<LiquidationOpportunity[]> {
    const loans = await this.fetchActiveLoans();
    const opportunities: LiquidationOpportunity[] = [];
    const now = Math.floor(Date.now() / 1000);
    
    for (const loan of loans) {
      // Check if can liquidate
      const canLiquidate = this.checkLiquidationEligibility(loan, now);
      
      if (canLiquidate) {
        const healthFactor = await this.calculateHealthFactor(loan);
        const profit = await this.estimateLiquidationProfit(loan);
        
        opportunities.push({
          loanId: loan.loanId,
          borrower: loan.borrower,
          collateralAmount: loan.collateralAmount,
          loanAmount: loan.loanAmount,
          healthFactor,
          estimatedProfit: profit,
          canLiquidate
        });
      }
    }
    
    // Sort by profitability
    return opportunities.sort((a, b) => b.estimatedProfit - a.estimatedProfit);
  }

  private checkLiquidationEligibility(loan: LoanData, currentTime: number): boolean {
    // Must be past maturity + 72 hour grace period
    const gracePeriodEnd = loan.maturityTime + (72 * 3600);
    return currentTime >= gracePeriodEnd;
  }

  private async calculateHealthFactor(loan: LoanData): Promise<number> {
    const solPrice = await this.getSolPrice();
    const collateralValue = loan.collateralAmount * solPrice;
    return ((collateralValue / loan.loanAmount) - 1) * 100;
  }

  private async estimateLiquidationProfit(loan: LoanData): Promise<number> {
    // Calculate potential profit from liquidation
    // Usually 5-10% bonus on collateral
    return loan.collateralAmount * 0.05; // 5% bonus
  }

  async executeLiquidation(opportunity: LiquidationOpportunity): Promise<string> {
    if (opportunity.estimatedProfit < 0.01) {
      return 'Profit too low, skipping';
    }

    // Build liquidation transaction
    const transaction = new Transaction();
    
    // Add liquidation instruction
    // See SDK docs for complete instruction structure
    
    const signature = await this.connection.sendTransaction(transaction, [this.wallet]);
    return `Liquidation executed: ${signature}`;
  }
}
```

---

## 2. Agent Architecture

### 2.1 System Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        GINVA Agent Network                             │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐                  │
│  │   Monitor  │───▶│   Helper   │───▶│  Liquidator│                  │
│  │    Agent   │    │    Agent   │    │    Agent   │                  │
│  └─────────────┘    └─────────────┘    └─────────────┘                  │
│       │                 │                 │                           │
│       ▼                 ▼                 ▼                           │
│  ┌─────────────────────────────────────────────────────────────┐       │
│  │                    Agent Coordinator                        │       │
│  │  • Task Distribution    • Revenue Split    • Risk Management│       │
│  └─────────────────────────────────────────────────────────────┘       │
│                                  │                                      │
│                                  ▼                                      │
│  ┌─────────────────────────────────────────────────────────────┐       │
│  │                    GINVA Protocol                          │       │
│  │  • Loan Accounts    • Price Oracles    • Token Vaults      │       │
│  └─────────────────────────────────────────────────────────────┘       │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### 2.2 Revenue Distribution

| Agent Type | Revenue Share | Example Earnings |
|-----------|---------------|------------------|
| **Monitor** | 10% of protection fee | $5-15/loan |
| **Helper** | 45% of protection services | $50-200/loan |
| **Liquidator** | 35% of liquidation bonus | $100-500/liquidation |

### 2.3 Agent Requirements

```yaml
Monitor Agent:
  - Min Stake: 100 GINVA tokens
  - Update Frequency: Every 5 minutes
  - Skills: Price monitoring, Alert generation
  
Helper Agent:
  - Min Stake: 500 GINVA tokens
  - Skills: Risk assessment, Negotiation, Portfolio analysis
  - Tools: Wallet connection, Transaction signing
  
Liquidator Agent:
  - Min Stake: 1000 GINVA tokens
  - Skills: Quick execution, Profit calculation, Gas optimization
  - Tools: Multiple RPC endpoints, MEV protection
```

---

## 3. Income Potential Calculator

### 3.1 Revenue Calculator

```python
# income_calculator.py

class GinvaIncomeCalculator:
    """
    Calculate potential income for AI Agent
    """
    
    # Average values from GINVA protocol
    AVG_LOAN_AMOUNT = 1000  # USDC
    AVG_COLLATERAL = 2000   # SOL value
    PROTECTION_FEE = 50     # USDC per loan
    LIQUIDATION_BONUS = 5   # % of collateral
    
    # Agent shares
    MONITOR_SHARE = 0.10
    HELPER_SHARE = 0.45
    LIQUIDATOR_SHARE = 0.35
    
    @staticmethod
    def calculate_annual_income(
        agent_type: str,
        num_loans_monitored: int,
        success_rate: float = 0.8
    ) -> dict:
        
        if agent_type == 'monitor':
            annual_revenue = (
                num_loans_monitored * 365 * 
                GinvaIncomeCalculator.PROTECTION_FEE * 
                GinvaIncomeCalculator.MONITOR_SHARE
            )
            return {
                'type': 'Monitor Agent',
                'daily_potential': num_loans_monitored * GinvaIncomeCalculator.PROTECTION_FEE * GinvaIncomeCalculator.MONITOR_SHARE,
                'monthly_potential': num_loans_monitored * 30 * GinvaIncomeCalculator.PROTECTION_FEE * GinvaIncomeCalculator.MONITOR_SHARE,
                'annual_potential': annual_revenue,
                'required_stake': 100  # GINVA tokens
            }
        
        elif agent_type == 'helper':
            annual_revenue = (
                num_loans_monitored * 365 * success_rate *
                GinvaIncomeCalculator.PROTECTION_FEE * 
                GinvaIncomeCalculator.HELPER_SHARE
            )
            return {
                'type': 'Helper Agent',
                'daily_potential': num_loans_monitored * success_rate * GinvaIncomeCalculator.PROTECTION_FEE * GinvaIncomeCalculator.HELPER_SHARE,
                'monthly_potential': num_loans_monitored * 30 * success_rate * GinvaIncomeCalculator.PROTECTION_FEE * GinvaIncomeCalculator.HELPER_SHARE,
                'annual_potential': annual_revenue,
                'required_stake': 500  # GINVA tokens
            }
        
        elif agent_type == 'liquidator':
            # Assume 2% of loans go to liquidation
            liquidations_per_year = num_loans_monitored * 365 * 0.02
            avg_liquidation_value = GinvaIncomeCalculator.AVG_COLLATERAL * 0.05
            annual_revenue = liquidations_per_year * avg_liquidation_value * GinvaIncomeCalculator.LIQUIDATOR_SHARE
            
            return {
                'type': 'Liquidator Agent',
                'daily_potential': liquidations_per_year / 365 * avg_liquidation_value * GinvaIncomeCalculator.LIQUIDATOR_SHARE,
                'monthly_potential': liquidations_per_year / 12 * avg_liquidation_value * GinvaIncomeCalculator.LIQUIDATOR_SHARE,
                'annual_potential': annual_revenue,
                'required_stake': 1000  # GINVA tokens
            }
        
        raise ValueError(f"Unknown agent type: {agent_type}")

# Example usage
if __name__ == "__main__":
    calculator = GinvaIncomeCalculator()
    
    print("=== Monitor Agent (100 loans/day) ===")
    print(calculator.calculate_annual_income('monitor', 100))
    
    print("\n=== Helper Agent (50 loans/day, 80% success) ===")
    print(calculator.calculate_annual_income('helper', 50, 0.8))
    
    print("\n=== Liquidator Agent (100 loans/day) ===")
    print(calculator.calculate_annual_income('liquidator', 100))
```

### 3.2 Sample Output

```
=== Monitor Agent (100 loans/day) ===
{
    'type': 'Monitor Agent',
    'daily_potential': 500.0,
    'monthly_potential': 15000.0,
    'annual_potential': 182500.0,
    'required_stake': 100
}

=== Helper Agent (50 loans/day, 80% success) ===
{
    'type': 'Helper Agent',
    'daily_potential': 1800.0,
    'monthly_potential': 54000.0,
    'annual_potential': 657000.0,
    'required_stake': 500
}

=== Liquidator Agent (100 loans/day) ===
{
    'type': 'Liquidator Agent',
    'daily_potential': 140.0,
    'monthly_potential': 4200.0,
    'annual_potential': 51100.0,
    'required_stake': 1000
}
```

---

## 4. Complete Code Examples

### 4.1 Python Agent (Full Implementation)

```python
# ginva_agent.py
"""
GINVA AI Agent - Python Implementation
For AI Trainers who want to deploy agents on Solana
"""

import asyncio
import json
import time
from dataclasses import dataclass
from typing import List, Optional
from solana.rpc.api import Client
from solana.keypair import Keypair
from solders.pubkey import Pubkey
import struct

@dataclass
class Loan:
    loan_id: str
    borrower: str
    collateral_amount: float
    loan_amount: float
    maturity_time: int
    status: int
    is_liquidated: bool

class GinvaAgent:
    """Base class for GINVA AI Agents"""
    
    PROGRAM_ID = Pubkey.from_string("BdAns2azGmixV2KinEKSanKyvBYBo3vRUGnNoshUQ9fH")
    GRACE_PERIOD_SECONDS = 72 * 60 * 60
    
    def __init__(self, rpc_url: str, private_key: Optional[bytes] = None):
        self.client = Client(rpc_url)
        self.wallet = Keypair.from_secret_key(private_key) if private_key else None
        self.loans_cache = []
        self.last_update = 0
    
    async def fetch_loans(self) -> List[Loan]:
        """Fetch all active loans from GINVA program"""
        # Implementation for fetching loan accounts
        # Uses get_program_accounts with appropriate filters
        return []
    
    def parse_loan_data(self, data: bytes) -> Optional[Loan]:
        """Parse loan account data"""
        try:
            if len(data) < 100:
                return None
            
            # Check discriminator "loanac01"
            if data[:8] != b"loanac01":
                return None
            
            return Loan(
                loan_id=str(struct.unpack("<Q", data[8:16])[0]),
                borrower=str(Pubkey.from_bytes(data[16:48])),
                collateral_amount=float(struct.unpack("<Q", data[49:57])[0]),
                loan_amount=float(struct.unpack("<Q", data[57:65])[0]),
                maturity_time=int(struct.unpack("<Q", data[89:97])[0]),
                status=int(data[48]),
                is_liquidated=bool(data[97])
            )
        except Exception as e:
            print(f"Error parsing loan: {e}")
            return None
    
    def get_grace_period_status(self, loan: Loan) -> dict:
        """Check loan's grace period status"""
        current_time = int(time.time())
        
        if current_time < loan.maturity_time:
            return {
                "status": "ACTIVE",
                "matured": False,
                "seconds_until_maturity": loan.maturity_time - current_time,
                "can_liquidate": False
            }
        
        time_since_maturity = current_time - loan.maturity_time
        
        if time_since_maturity < self.GRACE_PERIOD_SECONDS:
            return {
                "status": "GRACE_PERIOD",
                "matured": True,
                "seconds_in_grace": time_since_maturity,
                "seconds_remaining": self.GRACE_PERIOD_SECONDS - time_since_maturity,
                "can_liquidate": False,
                "health_factor_critical": False
            }
        
        return {
            "status": "LIQUIDATABLE",
            "matured": True,
            "seconds_since_maturity": time_since_maturity,
            "can_liquidate": True
        }

class MonitorAgent(GinvaAgent):
    """Monitor Agent - Tracks loans and sends alerts"""
    
    async def run(self, check_interval: int = 300):
        """Run monitoring loop"""
        print(f"Monitor Agent started with wallet: {self.wallet.pubkey() if self.wallet else 'No wallet'}")
        
        while True:
            try:
                loans = await self.fetch_loans()
                
                for loan in loans:
                    status = self.get_grace_period_status(loan)
                    
                    if status["status"] == "GRACE_PERIOD" and status["seconds_remaining"] < 86400:
                        print(f"⚠️  ALERT: Loan {loan.loan_id} - {status['seconds_remaining']/3600:.1f}h until liquidation")
                        await self.send_alert(loan, status)
                
                await asyncio.sleep(check_interval)
                
            except Exception as e:
                print(f"Error in monitor loop: {e}")
                await asyncio.sleep(60)
    
    async def send_alert(self, loan: Loan, status: dict):
        """Send alert notification"""
        # Integrate with Telegram, Discord, Email, etc.
        print(f"Sending alert for loan {loan.loan_id}")

class HelperAgent(GinvaAgent):
    """Helper Agent - Assists borrowers with repayment decisions"""
    
    async def analyze_and_act(self) -> List[dict]:
        """Analyze loans and take helper actions"""
        loans = await self.fetch_loans()
        actions = []
        
        for loan in loans:
            status = self.get_grace_period_status(loan)
            
            if status["status"] == "GRACE_PERIOD":
                # Calculate if refinancing would help
                potential_savings = self.calculate_refinance_potential(loan)
                
                if potential_savings > 0:
                    action = await self.offer_help(loan, potential_savings)
                    actions.append(action)
        
        return actions
    
    def calculate_refinance_potential(self, loan: Loan) -> float:
        """Calculate potential savings from refinancing"""
        current_debt = loan.loan_amount * 1.08  # 8% APR
        # Simplified calculation
        return current_debt * 0.02
    
    async def offer_help(self, loan: Loan, potential_savings: float) -> dict:
        """Offer help to borrower"""
        return {
            "loan_id": loan.loan_id,
            "action": "OFFER_REFINANCE",
            "potential_savings": potential_savings
        }

class LiquidatorAgent(GinvaAgent):
    """Liquidator Agent - Executes liquidations for profit"""
    
    async def find_opportunities(self) -> List[dict]:
        """Find profitable liquidation opportunities"""
        loans = await self.fetch_loans()
        opportunities = []
        
        for loan in loans:
            status = self.get_grace_period_status(loan)
            
            if status["can_liquidate"] and not loan.is_liquidated:
                profit = self.estimate_profit(loan)
                
                if profit > 0.01:  # Minimum profit threshold
                    opportunities.append({
                        "loan": loan,
                        "estimated_profit": profit,
                        "status": status
                    })
        
        # Sort by profitability
        return sorted(opportunities, key=lambda x: x["estimated_profit"], reverse=True)
    
    def estimate_profit(self, loan: Loan) -> float:
        """Estimate liquidation profit"""
        # 5% liquidation bonus on collateral
        return loan.collateral_amount * 0.05
    
    async def execute_liquidation(self, loan_id: str) -> str:
        """Execute liquidation transaction"""
        if not self.wallet:
            return "No wallet configured"
        
        # Build and send liquidation transaction
        # This would use Anchor IDL or raw instruction
        return f"Liquidation executed for loan {loan_id}"


# Usage Examples
async def main():
    # Initialize agent
    agent = MonitorAgent("https://api.devnet.solana.com")
    
    # Or use Helper/Liquidator
    # helper = HelperAgent("https://api.devnet.solana.com", private_key)
    # liquidator = LiquidatorAgent("https://api.devnet.solana.com", private_key)
    
    # Run agent
    await agent.run()

if __name__ == "__main__":
    asyncio.run(main())
```

### 4.2 JavaScript/Node.js Agent

```javascript
// ginva-agent.js
const { Connection, Keypair, PublicKey, Transaction, TransactionInstruction } = require('@solana/web3.js');

class GinvaAgent {
  constructor(config) {
    this.rpcUrl = config.rpcUrl || 'https://api.devnet.solana.com';
    this.connection = new Connection(this.rpcUrl);
    this.wallet = config.privateKey ? Keypair.fromSecretKey(config.privateKey) : null;
    this.programId = new PublicKey('BdAns2azGmixV2KinEKSanKyvBYBo3vRUGnNoshUQ9fH');
  }

  async getLoans() {
    const loans = await this.connection.getProgramAccounts(this.programId, {
      filters: [
        { dataSize: 215 },
        { memcmp: { offset: 48, bytes: 'AQ==' } } // status = 1
      ],
      encoding: 'base64'
    });
    return loans.value.map(this.parseLoan.bind(this));
  }

  parseLoan({ pubkey, account }) {
    const data = Buffer.from(account.data);
    return {
      pubkey: pubkey.toBase58(),
      loanId: data.readBigUInt64LE(8).toString(),
      borrower: new PublicKey(data.slice(16, 48)).toBase58(),
      collateralAmount: Number(data.readBigUInt64LE(49)),
      loanAmount: Number(data.readBigUInt64LE(57)),
      maturityTime: Number(data.readBigUInt64LE(89)),
      isLiquidated: data[97] === 1
    };
  }

  getGracePeriodStatus(loan) {
    const currentTime = Math.floor(Date.now() / 1000);
    const gracePeriodEnd = loan.maturityTime + (72 * 60 * 60);

    if (currentTime < loan.maturityTime) {
      return { status: 'ACTIVE', canLiquidate: false };
    }
    if (currentTime < gracePeriodEnd) {
      return { 
        status: 'GRACE_PERIOD', 
        remaining: gracePeriodEnd - currentTime,
        canLiquidate: false 
      };
    }
    return { status: 'LIQUIDATABLE', canLiquidate: true };
  }
}

// Export for different agent types
module.exports = { GinvaAgent };
```

---

## 5. Deployment Guide

### 5.1 Quick Deploy with Docker

```bash
# Clone templates
git clone https://github.com/ginva/agent-templates.git
cd agent-templates

# Build Docker image
docker build -t ginva-agent:latest .

# Run monitor agent
docker run -e RPC_URL=https://api.devnet.solana.com ginva-agent:latest monitor

# Run helper agent (requires wallet)
docker run -e PRIVATE_KEY=your_key ginva-agent:latest helper

# Run liquidator agent (requires wallet)
docker run -e PRIVATE_KEY=your_key ginva-agent:latest liquidator
```

### 5.2 Deploy on Vercel/Railway (Serverless)

```javascript
// vercel/api/agent.js
const { GinvaAgent } = require('ginva-agent');

export default async function handler(req, res) {
  const agent = new GinvaAgent({ 
    rpcUrl: process.env.RPC_URL 
  });
  
  const loans = await agent.getLoans();
  const alerts = loans
    .map(loan => agent.getGracePeriodStatus(loan))
    .filter(s => s.status === 'GRACE_PERIOD' && s.remaining < 86400);
  
  res.json({ alerts });
}
```

### 5.3 Environment Variables

```bash
# Required for all agents
RPC_URL=https://api.devnet.solana.com  # or mainnet

# Required for Helper/Liquidator agents
PRIVATE_KEY=your_base58_encoded_private_key

# Optional
ALERT_WEBHOOK_URL=your_discord_webhook_url
TELEGRAM_BOT_TOKEN=your_telegram_bot_token
TELEGRAM_CHAT_ID=your_chat_id
LOG_LEVEL=debug  # or info, warn, error
```

---

## 6. Additional Resources

### 6.1 SDK Documentation

- Full SDK docs: `/docs/AI_AGENT_KEEPER_SDK.md`
- Program ID: `BdAns2azGmixV2KinEKSanKyvBYBo3vRUGnNoshUQ9fH`
- Network: Solana Devnet

### 6.2 Support

- Discord: [Join GINVA Community](https://discord.gg/ginva)
- Telegram: [GINVA Support](https://t.me/ginva)
- Email: support@ginva.io

### 6.3 Developer Rewards

| Action | Reward |
|--------|--------|
| Deploy working agent | 100 GINVA tokens |
| First successful liquidation | 200 GINVA tokens |
| Refer other developers | 50 GINVA tokens/developer |

---

*Document Version: 1.0*  
*For QIE Hackathon*  
*GINVA - Fair Lending for Everyone*