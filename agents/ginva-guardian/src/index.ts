/**
 * GINVA GUARDIAN - Entry Point
 * =============================
 * Cloudflare Workers entry point
 */

import { GuardianAgent } from './guardian';

export interface Env {
  GINVA_DB: D1Database;
}

// Singleton agent instance
let guardianAgent: GuardianAgent | null = null;

function getGuardianAgent(db: D1Database): GuardianAgent {
  if (!guardianAgent) {
    guardianAgent = new GuardianAgent();
    guardianAgent.setDb(db);
  }
  return guardianAgent;
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    // Health check
    if (url.pathname === '/health') {
      return new Response(JSON.stringify({ status: 'ok', service: 'ginva-guardian' }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Register position
    if (url.pathname === '/guardian/register' && request.method === 'POST') {
      try {
        const body = await request.json();
        const agent = getGuardianAgent(env.GINVA_DB);
        const result = await agent.registerPosition(body);
        return new Response(JSON.stringify(result), {
          headers: { 'Content-Type': 'application/json' },
        });
      } catch (e) {
        return new Response(JSON.stringify({ error: 'Invalid request' }), { status: 400 });
      }
    }

    // Check health
    if (url.pathname === '/guardian/health' && request.method === 'GET') {
      const address = url.searchParams.get('address');
      if (!address) {
        return new Response(JSON.stringify({ error: 'Missing address' }), { status: 400 });
      }
      const agent = getGuardianAgent(env.GINVA_DB);
      const result = await agent.checkHealth(address);
      return new Response(JSON.stringify(result), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Get stats
    if (url.pathname === '/guardian/stats' && request.method === 'GET') {
      const agent = getGuardianAgent(env.GINVA_DB);
      const result = await agent.getStats();
      return new Response(JSON.stringify(result), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Unregister position
    if (url.pathname === '/guardian/unregister' && request.method === 'POST') {
      try {
        const body = await request.json();
        const agent = getGuardianAgent(env.GINVA_DB);
        const result = await agent.unregisterPosition(body.userAddress);
        return new Response(JSON.stringify(result), {
          headers: { 'Content-Type': 'application/json' },
        });
      } catch (e) {
        return new Response(JSON.stringify({ error: 'Invalid request' }), { status: 400 });
      }
    }

    // Get alerts
    if (url.pathname === '/guardian/alerts' && request.method === 'GET') {
      const address = url.searchParams.get('address');
      if (!address) {
        return new Response(JSON.stringify({ error: 'Missing address' }), { status: 400 });
      }
      const limit = parseInt(url.searchParams.get('limit') || '10');
      const agent = getGuardianAgent(env.GINVA_DB);
      const result = await agent.getAlerts(address, limit);
      return new Response(JSON.stringify(result), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Create alert (for testing)
    if (url.pathname === '/guardian/alert' && request.method === 'POST') {
      try {
        const body = await request.json();
        const agent = getGuardianAgent(env.GINVA_DB);
        const result = await agent.createAlert(body);
        return new Response(JSON.stringify(result), {
          headers: { 'Content-Type': 'application/json' },
        });
      } catch (e) {
        return new Response(JSON.stringify({ error: 'Invalid request' }), { status: 400 });
      }
    }

    // 404 for other routes
    return new Response('Not Found', { status: 404 });
  },
};