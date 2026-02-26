import React, { useState } from "react";
import Layout from "../components/Layout";
import Card from "../components/Card";
import Button from "../components/Button";
import Icon from "../components/Icon";

interface BotConfig {
  id: string;
  name: string;
  description: string;
  status: "active" | "paused" | "error";
  lastRun: string;
  triggers: number;
  executions: number;
  profit: number;
}

const mockBots: BotConfig[] = [
  {
    id: "1",
    name: "Liquidation Keeper",
    description:
      "Monitors health factors and executes liquidation when loans become unsafe",
    status: "active",
    lastRun: "2 min ago",
    triggers: 156,
    executions: 23,
    profit: 45.5,
  },
  {
    id: "2",
    name: "Auto-Top Up",
    description: "Automatically adds collateral when LTV approaches threshold",
    status: "active",
    lastRun: "15 min ago",
    triggers: 89,
    executions: 12,
    profit: 0,
  },
  {
    id: "3",
    name: "Interest Optimizer",
    description: "Monitors interest rate changes and notifies users",
    status: "paused",
    lastRun: "1 hour ago",
    triggers: 234,
    executions: 0,
    profit: 0,
  },
];

export default function BotsPage() {
  const [bots] = useState<BotConfig[]>(mockBots);
  const [activeTab, setActiveTab] = useState<"all" | "active" | "paused">(
    "all"
  );

  const filteredBots = bots.filter((bot) => {
    if (activeTab === "all") return true;
    if (activeTab === "active") return bot.status === "active";
    if (activeTab === "paused") return bot.status === "paused";
    return true;
  });

  const getStatusBadge = (status: BotConfig["status"]) => {
    switch (status) {
      case "active":
        return (
          <span className="px-3 py-1 bg-ginva-cyan/20 text-ginva-cyan rounded-full text-sm font-medium">
            ● Active
          </span>
        );
      case "paused":
        return (
          <span className="px-3 py-1 bg-ginva-amber/20 text-ginva-amber rounded-full text-sm font-medium">
            ◐ Paused
          </span>
        );
      case "error":
        return (
          <span className="px-3 py-1 bg-ginva-red/20 text-ginva-red rounded-full text-sm font-medium">
            ● Error
          </span>
        );
    }
  };

  return (
    <Layout title="Bot Controls - GINVA">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-display font-bold mb-1">Bot Controls</h1>
          <p className="text-ginva-silver">
            Manage automated bots and keepers for your loans
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card>
            <div className="text-center">
              <div className="text-ginva-silver text-sm mb-1">Active Bots</div>
              <div className="text-2xl font-mono font-bold text-ginva-cyan">
                {bots.filter((b) => b.status === "active").length}
              </div>
            </div>
          </Card>
          <Card>
            <div className="text-center">
              <div className="text-ginva-silver text-sm mb-1">
                Total Executions
              </div>
              <div className="text-2xl font-mono font-bold">
                {bots.reduce((sum, b) => sum + b.executions, 0)}
              </div>
            </div>
          </Card>
          <Card>
            <div className="text-center">
              <div className="text-ginva-silver text-sm mb-1">Triggers</div>
              <div className="text-2xl font-mono font-bold">
                {bots.reduce((sum, b) => sum + b.triggers, 0)}
              </div>
            </div>
          </Card>
          <Card>
            <div className="text-center">
              <div className="text-ginva-silver text-sm mb-1">Total Profit</div>
              <div className="text-2xl font-mono font-bold text-ginva-gold">
                ${bots.reduce((sum, b) => sum + b.profit, 0).toFixed(1)}
              </div>
            </div>
          </Card>
        </div>

        {/* Tabs */}
        <div className="flex space-x-2 mb-6">
          {(["all", "active", "paused"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === tab
                  ? "bg-ginva-cyan text-ginva-navy"
                  : "bg-ginva-slate/50 text-ginva-silver hover:bg-ginva-slate"
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Bot List */}
        <div className="space-y-4">
          {filteredBots.map((bot) => (
            <Card key={bot.id}>
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="flex items-start space-x-4">
                  <div className="w-10 h-10 text-ginva-cyan">
                    <Icon name="robot" size="lg" ariaLabel="bot" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-3 mb-1">
                      <h3 className="font-semibold text-lg">{bot.name}</h3>
                      {getStatusBadge(bot.status)}
                    </div>
                    <p className="text-ginva-silver text-sm">
                      {bot.description}
                    </p>
                    <div className="flex space-x-6 mt-3 text-sm text-ginva-silver">
                      <span>Last run: {bot.lastRun}</span>
                      <span>Triggers: {bot.triggers}</span>
                      <span>Executions: {bot.executions}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  {bot.profit > 0 && (
                    <div className="text-right mr-4">
                      <div className="text-sm text-ginva-silver">Profit</div>
                      <div className="font-mono font-bold text-ginva-gold">
                        ${bot.profit.toFixed(1)}
                      </div>
                    </div>
                  )}
                  <Button
                    variant={bot.status === "active" ? "outline" : "primary"}
                    size="sm"
                  >
                    {bot.status === "active" ? "Pause" : "Activate"}
                  </Button>
                  <Button variant="outline" size="sm" aria-label="Bot settings">
                    <Icon name="cog" size="md" ariaLabel="settings" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {filteredBots.length === 0 && (
          <Card>
            <div className="text-center py-12">
              <div className="w-12 h-12 mx-auto mb-3 text-ginva-silver">
                <Icon name="robot" size="xl" ariaLabel="no bots" />
              </div>
              <p className="text-ginva-silver">No bots in this category</p>
            </div>
          </Card>
        )}

        {/* Add Bot Section */}
        <Card className="mt-8">
          <h2 className="text-xl font-semibold mb-4">Create Custom Bot</h2>
          <p className="text-ginva-silver mb-4">
            Build your own automated bot using our Bot SDK
          </p>
          <div className="bg-ginva-slate/30 rounded-xl p-6 text-center">
            <div className="w-12 h-12 mx-auto mb-3 text-ginva-silver">
              <Icon name="cog" size="xl" ariaLabel="coming soon" />
            </div>
            <p className="text-ginva-silver mb-4">
              Bot SDK coming soon - configure automated strategies
            </p>
            <Button variant="outline" disabled>
              Coming Soon
            </Button>
          </div>
        </Card>
      </div>
    </Layout>
  );
}
