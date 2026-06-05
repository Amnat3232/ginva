/**
 * GINVA GUARDIAN AGENT
 * ====================
 * Monitors user positions 24/7
 * Checks health factors
 * Sends alerts when positions are at risk
 *
 * "ทหารยามเฝ้าประตู เป็นปราการปกป้องโปรโตคอล"
 */

import { callable } from 'agents';
import type { AgentsServer } from 'agents';

export interface Position {
  userAddress: string;
  collateralAmount: number;
  collateralMint: string;
  borrowedAmount: number;
  healthFactor: number;
  liquidationThreshold: number;
  lastUpdate: number;
  isActive: boolean;
  gracePeriodEnd: number;
}

export interface GuardianConfig {
  checkIntervalSeconds: number;
  warningThreshold: number;
  criticalThreshold: number;
  emergencyThreshold: number;
}

export interface Alert {
  id: string;
  userAddress: string;
  type: 'warning' | 'critical' | 'emergency';
  healthFactor: number;
  message: string;
  timestamp: number;
  acknowledged: boolean;
}

export interface AgentStats {
  totalWatched: number;
  warnings: number;
  criticals: number;
  emergencies: number;
  lastCheck: number;
}

// Use D1Database from Cloudflare types (any for simplicity)
type D1Database = any;

/**
 * Guardian Agent - Main Agent for monitoring Ginva positions
 * Uses D1 for persistence
 */
export class GuardianAgent {
  id: string = 'ginva-guardian-' + Math.random().toString(36).slice(2, 8);
  private _db: D1Database | null = null;

  private _config: GuardianConfig = {
    checkIntervalSeconds: 60,
    warningThreshold: 1.3,
    criticalThreshold: 1.1,
    emergencyThreshold: 1.0,
  };

  setDb(db: D1Database) {
    this._db = db;
  }

  private get db(): D1Database {
    if (!this._db) {
      throw new Error('D1 database not initialized. Call setDb() first.');
    }
    return this._db;
  }

  /**
   * Register a user position to be monitored
   */
  @callable()
  async registerPosition(position: Position): Promise<{
    success: boolean;
    agentId: string;
    message: string;
  }> {
    if (!position.userAddress || position.healthFactor <= 0) {
      return { success: false, agentId: '', message: 'Invalid position data' };
    }

    const now = Date.now();

    // Upsert position
    await this.db.prepare(`
      INSERT INTO positions (user_address, collateral_amount, collateral_mint, borrowed_amount, health_factor, liquidation_threshold, is_active, grace_period_end, last_update, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(user_address) DO UPDATE SET
        collateral_amount = excluded.collateral_amount,
        collateral_mint = excluded.collateral_mint,
        borrowed_amount = excluded.borrowed_amount,
        health_factor = excluded.health_factor,
        liquidation_threshold = excluded.liquidation_threshold,
        is_active = excluded.is_active,
        grace_period_end = excluded.grace_period_end,
        last_update = excluded.last_update,
        updated_at = excluded.updated_at
    `).bind(
      position.userAddress,
      position.collateralAmount,
      position.collateralMint || '',
      position.borrowedAmount,
      position.healthFactor,
      position.liquidationThreshold,
      position.isActive ? 1 : 0,
      position.gracePeriodEnd || null,
      now,
      now,
      now
    ).run();

    console.log(`[Guardian] Registered position for ${position.userAddress.slice(0, 8)}...`);

    return {
      success: true,
      agentId: this.id,
      message: 'Position registered successfully. Guardian will monitor 24/7.',
    };
  }

  /**
   * Check health factor for a specific user
   */
  @callable()
  async checkHealth(userAddress: string): Promise<{
    status: 'healthy' | 'warning' | 'critical' | 'emergency';
    healthFactor: number;
    recommendation: string;
    position: Position | null;
  }> {
    const result = await this.db.prepare(
      'SELECT * FROM positions WHERE user_address = ? AND is_active = 1'
    ).bind(userAddress).first();

    if (!result) {
      return {
        status: 'healthy',
        healthFactor: 100,
        recommendation: 'No active position found',
        position: null,
      };
    }

    const healthFactor = result.health_factor;
    let status: 'healthy' | 'warning' | 'critical' | 'emergency';
    let recommendation: string;

    // Health: >= 1.3, Warning: 1.1-1.29, Critical: 1.0-1.09, Emergency: < 1.0
    if (healthFactor >= 1.3) {
      status = 'healthy';
      recommendation = 'Your position is safe. No action needed.';
    } else if (healthFactor >= 1.1) {
      status = 'warning';
      recommendation = 'Health factor is low. Consider adding collateral to be safe.';
    } else if (healthFactor >= 1.0) {
      status = 'critical';
      recommendation = 'URGENT: Add collateral or repay NOW to avoid liquidation. 72h grace period active.';
    } else {
      status = 'emergency';
      recommendation = 'LIQUIDATION IMMINENT. Protocol will liquidate soon. Add collateral immediately!';
    }

    // Update stats counters
    if (status === 'warning') {
      await this.db.prepare('UPDATE stats SET warnings = warnings + 1 WHERE id = 1').run();
    } else if (status === 'critical') {
      await this.db.prepare('UPDATE stats SET criticals = criticals + 1 WHERE id = 1').run();
    } else if (status === 'emergency') {
      await this.db.prepare('UPDATE stats SET emergencies = emergencies + 1 WHERE id = 1').run();
    }

    const position: Position = {
      userAddress: result.user_address,
      collateralAmount: result.collateral_amount,
      collateralMint: result.collateral_mint,
      borrowedAmount: result.borrowed_amount,
      healthFactor: result.health_factor,
      liquidationThreshold: result.liquidation_threshold,
      lastUpdate: result.last_update,
      isActive: result.is_active === 1,
      gracePeriodEnd: result.grace_period_end,
    };

    return { status, healthFactor, recommendation, position };
  }

  /**
   * Check all positions (for scheduled runs)
   */
  @callable()
  async checkAllPositions(): Promise<{
    checked: number;
    warnings: number;
    criticals: number;
    emergencies: number;
  }> {
    const positions = await this.db.prepare(
      'SELECT * FROM positions WHERE is_active = 1'
    ).all();

    const results = { checked: 0, warnings: 0, criticals: 0, emergencies: 0 };

    for (const row of positions.results || []) {
      const health = await this.checkHealth(row.user_address);

      if (health.status === 'warning') results.warnings++;
      if (health.status === 'critical') results.criticals++;
      if (health.status === 'emergency') results.emergencies++;
      results.checked++;

      // Update position timestamp
      await this.db.prepare(
        'UPDATE positions SET last_update = ? WHERE user_address = ?'
      ).bind(Date.now(), row.user_address).run();
    }

    await this.db.prepare(
      'UPDATE stats SET last_check = ? WHERE id = 1'
    ).bind(Date.now()).run();

    console.log(`[Guardian] Checked ${results.checked} positions`);

    return results;
  }

  /**
   * Unregister a position (when user repays fully)
   */
  @callable()
  async unregisterPosition(userAddress: string): Promise<{
    success: boolean;
    message: string;
  }> {
    const existing = await this.db.prepare(
      'SELECT id FROM positions WHERE user_address = ?'
    ).bind(userAddress).first();

    if (!existing) {
      return { success: false, message: 'Position not found' };
    }

    await this.db.prepare(
      'UPDATE positions SET is_active = 0, updated_at = ? WHERE user_address = ?'
    ).bind(Date.now(), userAddress).run();

    console.log(`[Guardian] Unregistered position for ${userAddress.slice(0, 8)}...`);

    return {
      success: true,
      message: 'Position unregistered. Guardian will no longer monitor.',
    };
  }

  /**
   * Get alerts for a user
   */
  @callable()
  async getAlerts(userAddress: string, limit: number = 10): Promise<Alert[]> {
    const result = await this.db.prepare(`
      SELECT * FROM alerts
      WHERE user_address = ?
      ORDER BY timestamp DESC
      LIMIT ?
    `).bind(userAddress, limit).all();

    return (result.results || []).map((row: any) => ({
      id: String(row.id),
      userAddress: row.user_address,
      type: row.type,
      healthFactor: row.health_factor,
      message: row.message,
      timestamp: row.timestamp,
      acknowledged: row.acknowledged === 1,
    }));
  }

  /**
   * Acknowledge an alert
   */
  @callable()
  async acknowledgeAlert(userAddress: string, alertId: string): Promise<boolean> {
    const result = await this.db.prepare(`
      UPDATE alerts SET acknowledged = 1
      WHERE id = ? AND user_address = ?
    `).bind(parseInt(alertId), userAddress).run();

    return result.success;
  }

  /**
   * Get Guardian statistics
   */
  @callable()
  async getStats(): Promise<AgentStats> {
    try {
      const result = await this.db.prepare(
        'SELECT * FROM stats WHERE id = 1'
      ).first();

      if (!result) {
        return { totalWatched: 0, warnings: 0, criticals: 0, emergencies: 0, lastCheck: 0 };
      }

      // Get active positions count
      const countResult = await this.db.prepare(
        'SELECT COUNT(*) as count FROM positions WHERE is_active = 1'
      ).first();

      return {
        totalWatched: countResult?.count || 0,
        warnings: result.warnings,
        criticals: result.criticals,
        emergencies: result.emergencies,
        lastCheck: result.last_check || Date.now(),
      };
    } catch (e: any) {
      console.error('[Guardian] getStats error:', e.message);
      return { totalWatched: 0, warnings: 0, criticals: 0, emergencies: 0, lastCheck: 0 };
    }
  }

  /**
   * Update Guardian configuration
   */
  @callable()
  async updateConfig(newConfig: Partial<GuardianConfig>): Promise<void> {
    this._config = { ...this._config, ...newConfig };
    console.log('[Guardian] Configuration updated');
  }

  /**
   * Create alert for a user
   */
  @callable()
  async createAlert(params: {
    userAddress: string;
    type: 'warning' | 'critical' | 'emergency';
    healthFactor: number;
    message: string;
  }): Promise<{ success: boolean; alertId: string }> {
    const timestamp = Date.now();
    const result = await this.db.prepare(`
      INSERT INTO alerts (user_address, type, health_factor, message, acknowledged, timestamp)
      VALUES (?, ?, ?, ?, 0, ?)
    `).bind(
      params.userAddress,
      params.type,
      params.healthFactor,
      params.message,
      timestamp
    ).run();

    return { success: result.success, alertId: String(timestamp) };
  }
}

/**
 * Notification Agent - Handles sending notifications
 * Uses D1 for persistence
 */
export class NotificationAgent {
  id: string = 'ginva-notification-' + Math.random().toString(36).slice(2, 8);
  private _db: D1Database | null = null;

  setDb(db: D1Database) {
    this._db = db;
  }

  private get db(): D1Database {
    if (!this._db) {
      throw new Error('D1 database not initialized. Call setDb() first.');
    }
    return this._db;
  }

  /**
   * Queue a notification to send
   */
  @callable()
  async queueNotification(params: {
    userAddress: string;
    type: 'email' | 'telegram' | 'push';
    subject: string;
    message: string;
    priority: 'low' | 'normal' | 'high' | 'urgent';
  }): Promise<{ success: boolean; notificationId: string }> {
    const notificationId = `notif_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    // Store notification in D1 (use alerts table for simplicity)
    await this.db.prepare(`
      INSERT INTO alerts (user_address, type, health_factor, message, acknowledged, timestamp)
      VALUES (?, ?, ?, ?, 0, ?)
    `).bind(
      params.userAddress,
      params.type,
      0, // health_factor 0 for non-alert notifications
      `[${params.type.toUpperCase()}] ${params.subject}: ${params.message}`,
      Date.now()
    ).run();

    console.log(`[Notification] Queued ${params.type} for ${params.userAddress.slice(0, 8)}...`);

    return { success: true, notificationId };
  }

  /**
   * Set user notification preferences
   */
  @callable()
  async setPreferences(userAddress: string, prefs: {
    email?: string;
    telegram?: string;
    pushEnabled?: boolean;
  }): Promise<void> {
    // Store preferences - could use a dedicated table
    console.log(`[Notification] Updated preferences for ${userAddress.slice(0, 8)}...`);
  }

  /**
   * Get user preferences
   */
  @callable()
  async getPreferences(userAddress: string): Promise<{
    email?: string;
    telegram?: string;
    pushEnabled: boolean;
  }> {
    return { pushEnabled: true };
  }
}

// Export server configuration
export const server: AgentsServer = {
  agents: {
    guardian: GuardianAgent,
    notification: NotificationAgent,
  },
};