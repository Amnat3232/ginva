import { useState } from 'react';
import { useWalletStore } from '../stores/walletStore';
import { Bot, Pause, Settings, FileText, Activity } from 'lucide-react';

export default function AIAgentPage() {
  const { connected, connect } = useWalletStore();
  const [agentStatus, setAgentStatus] = useState<'online' | 'paused'>('online');
  const [keeperRole, setKeeperRole] = useState<'A' | 'B' | 'C'>('A');
  const [hfThreshold, setHfThreshold] = useState(1.1);
  const [autoExecute, setAutoExecute] = useState(true);

  if (!connected) {
    return (
      <div className="min-h-screen flex items-center justify-center px-[5vw]">
        <div className="text-center max-w-md">
          <Bot size={48} className="text-ginva-orange mx-auto mb-4" />
          <h2 className="font-heading font-bold text-2xl text-ginva-text">Connect Your Wallet</h2>
          <p className="text-ginva-text-secondary mt-2 mb-6">Connect to deploy and manage your AI Agent Keeper.</p>
          <button onClick={connect} className="bg-ginva-orange text-white px-8 py-3 rounded-lg font-medium hover:brightness-110 transition-all">
            Connect Wallet
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-[5vw] pt-[80px] pb-20">
      <div className="max-w-[900px] mx-auto">
        <div className="flex items-center gap-3 mb-2">
          <Bot size={28} className="text-ginva-orange" />
          <h1 className="font-heading font-bold text-3xl text-ginva-text">AI Agent Keeper</h1>
        </div>
        <p className="text-ginva-text-secondary mt-1 max-w-[600px]">
          Deploy human-controlled AI agents that earn income for you. You own the wallet, you authorize actions, you receive rewards.
        </p>

        {/* Agent Status Card */}
        <div className="bg-ginva-bg-card border border-white/[0.08] rounded-xl p-6 mt-8">
          <div className="flex items-center gap-3 mb-6">
            <div className={`w-3 h-3 rounded-full ${
              agentStatus === 'online' ? 'bg-ginva-green animate-agent-pulse' : 'bg-ginva-yellow animate-agent-pulse-yellow'
            }`} />
            <span className={`text-sm font-medium ${
              agentStatus === 'online' ? 'text-ginva-green' : 'text-ginva-yellow'
            }`}>
              {agentStatus === 'online' ? 'Agent Online' : 'Agent Paused'}
            </span>
          </div>
          <div className="grid grid-cols-3 gap-6">
            <div>
              <div className="text-xs text-ginva-text-secondary uppercase tracking-wider">Events Processed</div>
              <div className="font-mono text-2xl text-ginva-text mt-1">47</div>
            </div>
            <div>
              <div className="text-xs text-ginva-text-secondary uppercase tracking-wider">Rewards Earned</div>
              <div className="font-mono text-2xl text-ginva-green mt-1">$28.20</div>
            </div>
            <div>
              <div className="text-xs text-ginva-text-secondary uppercase tracking-wider">Uptime</div>
              <div className="font-mono text-2xl text-ginva-text mt-1">99.7%</div>
            </div>
          </div>
          <div className="flex gap-3 mt-6">
            <button
              onClick={() => setAgentStatus(agentStatus === 'online' ? 'paused' : 'online')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition-all ${
                agentStatus === 'online'
                  ? 'bg-ginva-yellow/20 border-ginva-yellow/50 text-ginva-yellow hover:bg-ginva-yellow/30'
                  : 'bg-ginva-green/20 border-ginva-green/50 text-ginva-green hover:bg-ginva-green/30'
              }`}
            >
              <Pause size={14} />
              {agentStatus === 'online' ? 'Pause Agent' : 'Resume Agent'}
            </button>
            <button className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-ginva-bg-tertiary border border-white/[0.08] text-ginva-text hover:border-ginva-orange/50 transition-all">
              <Settings size={14} />
              Configure
            </button>
            <button className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-ginva-bg-tertiary border border-white/[0.08] text-ginva-text hover:border-ginva-orange/50 transition-all">
              <FileText size={14} />
              View Logs
            </button>
          </div>
        </div>

        {/* Revenue Share Model */}
        <div className="bg-ginva-bg-card border border-white/[0.08] rounded-xl p-6 mt-6">
          <h2 className="font-heading font-medium text-xl text-ginva-text mb-4">Revenue Sharing</h2>
          <p className="text-sm text-ginva-text-secondary mb-4">$100 Liquidation Event Distribution</p>
          <div className="h-8 rounded-full overflow-hidden flex">
            <div className="bg-ginva-orange flex items-center justify-center text-xs text-white font-medium" style={{ width: '45%' }}>
              You 45%
            </div>
            <div className="bg-ginva-blue flex items-center justify-center text-xs text-white font-medium" style={{ width: '35%' }}>
              Agent 35%
            </div>
            <div className="bg-purple-500 flex items-center justify-center text-xs text-white font-medium" style={{ width: '20%' }}>
              Protocol 20%
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4 mt-4">
            <div className="text-center">
              <div className="font-mono text-lg text-ginva-orange">$2.70</div>
              <div className="text-xs text-ginva-text-secondary">10 events/mo</div>
            </div>
            <div className="text-center">
              <div className="font-mono text-lg text-ginva-orange">$27.00</div>
              <div className="text-xs text-ginva-text-secondary">100 events/mo</div>
            </div>
            <div className="text-center">
              <div className="font-mono text-lg text-ginva-orange">$270+</div>
              <div className="text-xs text-ginva-text-secondary">1000+ events/mo</div>
            </div>
          </div>
        </div>

        {/* Agent Configuration */}
        <div className="bg-ginva-bg-card border border-white/[0.08] rounded-xl p-6 mt-6">
          <h2 className="font-heading font-medium text-xl text-ginva-text mb-6">Agent Configuration</h2>
          <div className="space-y-5">
            {/* Keeper Role */}
            <div>
              <label className="text-sm text-ginva-text-secondary mb-2 block">Keeper Role</label>
              <div className="flex gap-2">
                {(['A', 'B', 'C'] as const).map((r) => (
                  <button
                    key={r}
                    onClick={() => setKeeperRole(r)}
                    className={`flex-1 py-2.5 rounded-lg text-sm font-medium border transition-all ${
                      keeperRole === r
                        ? 'bg-ginva-orange/20 border-ginva-orange/50 text-ginva-orange'
                        : 'bg-ginva-bg-secondary border-white/[0.08] text-ginva-text-secondary hover:text-ginva-text'
                    }`}
                  >
                    {r === 'A' ? 'Trigger' : r === 'B' ? 'Storefront' : 'Finalize'}
                  </button>
                ))}
              </div>
            </div>

            {/* HF Threshold */}
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-ginva-text-secondary">Min Health Factor Threshold</span>
                <span className="font-mono text-ginva-text">{hfThreshold.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="1.0"
                max="1.5"
                step="0.01"
                value={hfThreshold}
                onChange={(e) => setHfThreshold(Number(e.target.value))}
                className="w-full accent-ginva-orange"
              />
              <div className="flex justify-between text-xs text-ginva-text-muted mt-1">
                <span>1.00</span>
                <span>1.50</span>
              </div>
            </div>

            {/* Auto Execute */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity size={16} className="text-ginva-text-secondary" />
                <span className="text-sm text-ginva-text">Auto-execute transactions</span>
              </div>
              <button
                onClick={() => setAutoExecute(!autoExecute)}
                className={`w-11 h-6 rounded-full transition-colors relative ${
                  autoExecute ? 'bg-ginva-orange' : 'bg-ginva-bg-tertiary'
                }`}
              >
                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${
                  autoExecute ? 'left-6' : 'left-1'
                }`} />
              </button>
            </div>

            {/* Max Transaction */}
            <div>
              <label className="text-sm text-ginva-text-secondary mb-2 block">Max Transaction Value (USDC)</label>
              <input
                type="number"
                defaultValue="10000"
                className="w-full bg-white/5 border border-white/[0.08] rounded-lg px-4 py-2.5 text-ginva-text font-mono outline-none focus:border-ginva-orange/50 transition-colors"
              />
            </div>

            <button className="w-full bg-ginva-orange text-white py-3 rounded-lg font-medium hover:brightness-110 transition-all">
              Save Configuration
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
