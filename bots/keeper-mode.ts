// Ginva Keeper Dual Mode Manager
// รองรับ 2 โหมดหลัก: Full Access Mode และ Secure Scoped Mode (Solblade)

import { Connection, PublicKey } from '@solana/web3.js';
import { KeeperConfig, KeeperMode } from './types/keeper-types';
import { FullAccessKeeper } from './modes/full-access-keeper';
import { SolbladeKeeper } from './modes/solblade-keeper';

/**
 * Ginva Keeper Dual Mode Manager
 * รองรับ 2 โหมดหลักตามที่เราคุยกัน
 */
export class GinvaKeeperManager {
  private config: KeeperConfig;
  private currentKeeper: FullAccessKeeper | SolbladeKeeper | null = null;
  private connection: Connection;

  constructor(config: KeeperConfig) {
    this.config = config;
    this.connection = new Connection(config.rpcUrl, 'confirmed');
  }

  /**
   * Initialize Keeper ตามโหมดที่เลือก
   */
  async initialize(): Promise<void> {
    if (this.config.mode === KeeperMode.FULL_ACCESS) {
      this.currentKeeper = new FullAccessKeeper(this.config, this.connection);
      console.log('🔑 Ginva Keeper: Full Access Mode (Direct Private Key)');
    } 
    else if (this.config.mode === KeeperMode.SECURE_SCOPED) {
      this.currentKeeper = new SolbladeKeeper(this.config, this.connection);
      console.log('🛡️ Ginva Keeper: Secure Scoped Mode (Powered by Solblade + MCP)');
    } 
    else {
      throw new Error(`Unsupported keeper mode: ${this.config.mode}`);
    }

    await this.currentKeeper.initialize();
  }

  // === Core Keeper Functions (Unified Interface) ===

  async checkLiquidation(): Promise<any[]> {
    if (!this.currentKeeper) throw new Error('Keeper not initialized');
    return this.currentKeeper.checkLiquidation();
  }

  async triggerLiquidation(loanPubkey: PublicKey): Promise<string> {
    if (!this.currentKeeper) throw new Error('Keeper not initialized');
    return this.currentKeeper.triggerLiquidation(loanPubkey);
  }

  async executeStorefrontBuy(collateralPubkey: PublicKey, discountPercent: number): Promise<string> {
    if (!this.currentKeeper) throw new Error('Keeper not initialized');
    return this.currentKeeper.executeStorefrontBuy(collateralPubkey, discountPercent);
  }

  async finalizeLiquidation(txSignature: string): Promise<void> {
    if (!this.currentKeeper) throw new Error('Keeper not initialized');
    return this.currentKeeper.finalizeLiquidation(txSignature);
  }

  // Utility
  getMode(): KeeperMode {
    return this.config.mode;
  }

  getConfig(): KeeperConfig {
    return { ...this.config };
  }
  
  // Cleanup
  async cleanup(): Promise<void> {
    if (this.currentKeeper) {
      // If there's a cleanup method on the keeper, call it
      if (typeof (this.currentKeeper as any).cleanup === 'function') {
        await (this.currentKeeper as any).cleanup();
      }
    }
  }
}

// Export สำหรับใช้งานง่าย
export { KeeperMode } from './types/keeper-types';