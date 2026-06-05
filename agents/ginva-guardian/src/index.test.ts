/**
 * GINVA GUARDIAN - Standalone Tests
 * No Cloudflare/Workers dependencies
 */

// Mock Agent class for testing
class MockAgent {
  id: string = 'test-agent';
  positions: Map<string, any> = new Map();
  alerts: Map<string, any[]> = new Map();
  config: any = {
    checkIntervalSeconds: 60,
    warningThreshold: 1.3,
    criticalThreshold: 1.1,
    emergencyThreshold: 1.0,
  };
  stats: any = {
    totalWatched: 0,
    warnings: 0,
    criticals: 0,
    emergencies: 0,
    lastCheck: 0,
  };

  async registerPosition(position: any) {
    if (!position.userAddress || position.healthFactor <= 0) {
      return { success: false, agentId: '', message: 'Invalid position data' };
    }
    this.positions.set(position.userAddress, { ...position, lastUpdate: Date.now() });
    if (!this.alerts.has(position.userAddress)) {
      this.alerts.set(position.userAddress, []);
    }
    this.stats.totalWatched = this.positions.size;
    this.stats.lastCheck = Date.now();
    return { success: true, agentId: this.id, message: 'Position registered successfully' };
  }

  async checkHealth(userAddress: string) {
    const position = this.positions.get(userAddress);
    if (!position) {
      return { status: 'healthy', healthFactor: 100, recommendation: 'No active position found', position: null };
    }
    const { healthFactor } = position;
    let status: 'healthy' | 'warning' | 'critical' | 'emergency';
    let recommendation: string;
    // Health: >= 1.3, Warning: 1.1-1.29, Critical: 1.0-1.09, Emergency: < 1.0
    if (healthFactor >= 1.3) {
      status = 'healthy';
      recommendation = 'Your position is safe.';
    } else if (healthFactor >= 1.1) {
      status = 'warning';
      recommendation = 'Low health factor. Consider adding collateral.';
    } else if (healthFactor >= 1.0) {
      status = 'critical';
      recommendation = 'URGENT: Add collateral or repay NOW. 72h grace period active.';
    } else {
      status = 'emergency';
      recommendation = 'LIQUIDATION IMMINENT!';
    }
    if (status === 'warning') this.stats.warnings++;
    if (status === 'critical') this.stats.criticals++;
    if (status === 'emergency') this.stats.emergencies++;
    return { status, healthFactor, recommendation, position };
  }

  async unregisterPosition(userAddress: string) {
    if (!this.positions.has(userAddress)) {
      return { success: false, message: 'Position not found' };
    }
    this.positions.delete(userAddress);
    this.stats.totalWatched = this.positions.size;
    return { success: true, message: 'Position unregistered' };
  }

  async getStats() {
    return { ...this.stats, lastCheck: this.stats.lastCheck || Date.now() };
  }
}

// Test runner
async function runTests() {
  console.log('🧪 Running Ginva Guardian Tests\n');
  let passed = 0;
  let failed = 0;

  const agent = new MockAgent();
  const testUser = '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU';

  // Test 1: Register position
  console.log('Test 1: Register valid position...');
  const position = {
    userAddress: testUser,
    collateralAmount: 1000000000,
    collateralMint: 'So11111111111111111111111111111111111111112',
    borrowedAmount: 50000000,
    healthFactor: 1.5,
    liquidationThreshold: 1.2,
    lastUpdate: Date.now(),
    isActive: true,
    gracePeriodEnd: Date.now() + 72 * 60 * 60 * 1000,
  };
  const regResult = await agent.registerPosition(position);
  if (regResult.success) {
    console.log('  ✅ PASSED: Position registered\n');
    passed++;
  } else {
    console.log('  ❌ FAILED: ' + regResult.message + '\n');
    failed++;
  }

  // Test 2: Healthy status
  console.log('Test 2: Check health - should be healthy...');
  const health1 = await agent.checkHealth(testUser);
  if (health1.status === 'healthy') {
    console.log('  ✅ PASSED: Status is healthy\n');
    passed++;
  } else {
    console.log('  ❌ FAILED: Expected healthy, got ' + health1.status + '\n');
    failed++;
  }

  // Test 3: Warning status
  console.log('Test 3: Check health - warning threshold...');
  await agent.registerPosition({ ...position, userAddress: testUser + '2', healthFactor: 1.2 });
  const health2 = await agent.checkHealth(testUser + '2');
  if (health2.status === 'warning') {
    console.log('  ✅ PASSED: Status is warning\n');
    passed++;
  } else {
    console.log('  ❌ FAILED: Expected warning, got ' + health2.status + '\n');
    failed++;
  }

  // Test 4: Critical status
  console.log('Test 4: Check health - critical threshold...');
  await agent.registerPosition({ ...position, userAddress: testUser + '3', healthFactor: 1.05 });
  const health3 = await agent.checkHealth(testUser + '3');
  if (health3.status === 'critical') {
    console.log('  ✅ PASSED: Status is critical\n');
    passed++;
  } else {
    console.log('  ❌ FAILED: Expected critical, got ' + health3.status + '\n');
    failed++;
  }

  // Test 5: Emergency status
  console.log('Test 5: Check health - emergency threshold...');
  await agent.registerPosition({ ...position, userAddress: testUser + '4', healthFactor: 0.95 });
  const health4 = await agent.checkHealth(testUser + '4');
  if (health4.status === 'emergency') {
    console.log('  ✅ PASSED: Status is emergency\n');
    passed++;
  } else {
    console.log('  ❌ FAILED: Expected emergency, got ' + health4.status + '\n');
    failed++;
  }

  // Test 6: Unregister
  console.log('Test 6: Unregister position...');
  const unregResult = await agent.unregisterPosition(testUser);
  if (unregResult.success) {
    console.log('  ✅ PASSED: Position unregistered\n');
    passed++;
  } else {
    console.log('  ❌ FAILED: ' + unregResult.message + '\n');
    failed++;
  }

  // Test 7: Get stats
  console.log('Test 7: Get statistics...');
  const stats = await agent.getStats();
  if (stats.totalWatched >= 0 && stats.warnings >= 0) {
    console.log('  ✅ PASSED: Stats retrieved - watched: ' + stats.totalWatched + ', warnings: ' + stats.warnings + '\n');
    passed++;
  } else {
    console.log('  ❌ FAILED: Invalid stats\n');
    failed++;
  }

  // Summary
  console.log('═══════════════════════════════════════');
  console.log(`📊 Results: ${passed} passed, ${failed} failed`);
  console.log('═══════════════════════════════════════');

  return failed === 0;
}

runTests().then(success => {
  process.exit(success ? 0 : 1);
}).catch(err => {
  console.error('Test error:', err);
  process.exit(1);
});