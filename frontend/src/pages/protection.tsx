import React, { useState, useEffect } from "react";
import Layout from "../components/Layout";
import Button from "../components/Button";
import Card from "../components/Card";
import Icon from "../components/Icon";

export default function ProtectionPage() {
  // Mock data - will come from API in the future
  const [timeRemaining, setTimeRemaining] = useState(68 * 3600 + 42 * 60 + 15); // 68:42:15
  const [currentPrice, setCurrentPrice] = useState(89.5);
  const [liquidationPrice] = useState(95.0);
  const [ltv, setLtv] = useState(78);
  const collateral = { amount: 5.5, symbol: "SOL", value: 467.5 };
  const borrowed = 330;

  // Calculate time display
  const hours = Math.floor(timeRemaining / 3600);
  const minutes = Math.floor((timeRemaining % 3600) / 60);
  const seconds = timeRemaining % 60;

  // Progress percentage (72 hours = 100%)
  const progressPercent = ((72 - hours) / 72) * 100;

  // Determine status color based on remaining time
  const getStatusColor = () => {
    if (hours > 48) return "bg-ginva-cyan"; // 0-24h: Green
    if (hours > 24) return "bg-ginva-amber"; // 24-48h: Yellow
    return "bg-orange-500"; // 48-72h: Orange
  };

  const getStatusText = () => {
    if (hours > 48)
      return { text: "Safe Zone", color: "text-ginva-cyan", emoji: "🟢" };
    if (hours > 24)
      return { text: "Caution Zone", color: "text-ginva-amber", emoji: "🟡" };
    return { text: "Warning Zone", color: "text-orange-500", emoji: "🟠" };
  };

  const status = getStatusText();

  // Countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeRemaining((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Calculate gap
  const gap = currentPrice - liquidationPrice;
  const gapPercent = ((gap / liquidationPrice) * 100).toFixed(1);

  return (
    <Layout title="Protection Mode - GINVA">
      {/* Alert Banner */}
      <div className="bg-ginva-amber/20 border-b border-ginva-amber/50 py-3 px-4">
        <div className="max-w-4xl mx-auto flex items-center justify-center space-x-2">
          <span className="text-ginva-amber">⚠️</span>
          <span className="text-ginva-amber font-medium">
            Protection Mode Active - You have {hours}:
            {minutes.toString().padStart(2, "0")}:
            {seconds.toString().padStart(2, "0")} to act
          </span>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Back Button */}
        <button className="text-ginva-silver hover:text-ginva-gold mb-6 flex items-center">
          ← Back to Dashboard
        </button>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-display font-bold mb-2">
            🛡️ 72-Hour Protection System
          </h1>
          <p className="text-ginva-silver">
            Your assets are protected, you have time to act
          </p>
        </div>

        {/* Countdown Timer */}
        <Card className="mb-6 text-center">
          <div className="relative pt-6">
            {/* Circular Progress */}
            <div className="relative w-48 h-48 mx-auto mb-6">
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="96"
                  cy="96"
                  r="88"
                  stroke="currentColor"
                  strokeWidth="12"
                  fill="transparent"
                  className="text-ginva-slate"
                />
                <circle
                  cx="96"
                  cy="96"
                  r="88"
                  stroke="currentColor"
                  strokeWidth="12"
                  fill="transparent"
                  strokeDasharray={2 * Math.PI * 88}
                  strokeDashoffset={
                    2 * Math.PI * 88 * (1 - progressPercent / 100)
                  }
                  className={`${getStatusColor()} transition-all duration-1000`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-4xl font-mono font-bold text-ginva-gold">
                  {hours.toString().padStart(2, "0")}:
                  {minutes.toString().padStart(2, "0")}:
                  {seconds.toString().padStart(2, "0")}
                </span>
                <span className="text-sm text-ginva-silver mt-1">
                  remaining
                </span>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-ginva-slate rounded-full h-4 mb-2 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-1000 ${getStatusColor()}`}
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <div className="flex justify-between text-sm text-ginva-silver">
              <span>Hour {72 - hours} of 72</span>
              <span>
                {status.emoji} {status.text}
              </span>
            </div>
          </div>
        </Card>

        {/* Current Status */}
        <Card className="mb-6">
          <h2 className="text-xl font-semibold mb-4">Current Status</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-ginva-slate/50 rounded-lg">
              <p className="text-sm text-ginva-silver mb-1">
                Current SOL Price
              </p>
              <p
                className={`text-2xl font-mono font-bold ${
                  currentPrice < liquidationPrice
                    ? "text-ginva-red"
                    : "text-ginva-gold"
                }`}
              >
                ${currentPrice.toFixed(2)}
              </p>
              {currentPrice < liquidationPrice && (
                <p className="text-sm text-ginva-red">🔴 {gapPercent}%</p>
              )}
            </div>
            <div className="p-4 bg-ginva-slate/50 rounded-lg">
              <p className="text-sm text-ginva-silver mb-1">
                Your Liquidation Price
              </p>
              <p className="text-2xl font-mono font-bold text-ginva-silver">
                ${liquidationPrice.toFixed(2)}
              </p>
            </div>
          </div>

          <div className="mt-4 p-4 bg-ginva-slate/50 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="text-ginva-silver">Gap:</span>
              <span
                className={`font-mono font-bold ${
                  gap < 0 ? "text-ginva-red" : "text-ginva-cyan"
                }`}
              >
                {gap >= 0 ? "+" : ""}${gap.toFixed(2)} ({gapPercent}%)
              </span>
            </div>
            <div className="mt-2 flex justify-between items-center">
              <span className="text-ginva-silver">Current LTV:</span>
              <span className={`font-mono font-bold ${status.color}`}>
                {ltv}% ({status.text} {status.emoji})
              </span>
            </div>
          </div>

          <button className="mt-4 text-ginva-cyan hover:underline text-sm">
            View Price Chart →
          </button>
        </Card>

        {/* Recommended Actions */}
        <h2 className="text-xl font-semibold mb-4">Recommended Actions</h2>

        {/* Option 1: Add Collateral */}
        <Card className="mb-4 border-l-4 border-l-ginva-cyan">
          <div className="flex items-start space-x-4">
            <div className="text-3xl">💚</div>
            <div className="flex-1">
              <h3 className="font-semibold text-ginva-cyan mb-1">
                Recommended: Add Collateral
              </h3>
              <p className="text-sm text-ginva-silver mb-3">
                Add 0.5 SOL ($44.75) → LTV drops to 65% (Safe Zone 🟢) → Cancel
                protection immediately
              </p>
              <Button variant="primary" size="sm">
                Add Collateral →
              </Button>
            </div>
          </div>
        </Card>

        {/* Option 2: Repay Partial */}
        <Card className="mb-4 border-l-4 border-l-ginva-amber">
          <div className="flex items-start space-x-4">
            <div className="text-3xl">💛</div>
            <div className="flex-1">
              <h3 className="font-semibold text-ginva-amber mb-1">
                Alternative: Repay Partially
              </h3>
              <p className="text-sm text-ginva-silver mb-3">
                Repay 50 USDC → LTV drops to 68% (Safe Zone 🟢) → Next month's
                interest decreases
              </p>
              <Button variant="outline" size="sm">
                Repay Partially →
              </Button>
            </div>
          </div>
        </Card>

        {/* Option 3: Wait */}
        <Card className="mb-6 border-l-4 border-l-orange-500">
          <div className="flex items-start space-x-4">
            <div className="text-3xl">🧡</div>
            <div className="flex-1">
              <h3 className="font-semibold text-orange-500 mb-1">
                Wait and See
              </h3>
              <p className="text-sm text-ginva-silver mb-3">
                Do nothing now → Will enter rescue phase → Rescue helpers will
                help protect assets → You may receive partial refund if there's
                excess
              </p>
              <Button
                variant="outline"
                size="sm"
                className="border-orange-500 text-orange-500 hover:bg-orange-500/10"
              >
                Continue Waiting
              </Button>
            </div>
          </div>
        </Card>

        {/* Timeline */}
        <Card>
          <h3 className="font-semibold mb-4 flex items-center">
            <span className="mr-2">📊</span> Protection Timeline
          </h3>
          <div className="space-y-4">
            <div
              className={`flex items-start space-x-3 ${
                hours <= 72 ? "opacity-100" : "opacity-50"
              }`}
            >
              <div className="w-8 h-8 rounded-full bg-ginva-cyan flex items-center justify-center text-ginva-navy font-bold text-sm flex-shrink-0">
                0
              </div>
              <div>
                <p className="font-medium">Hour 0</p>
                <p className="text-sm text-ginva-silver">
                  🔔 Alert: Your collateral needs attention
                </p>
                <p className="text-xs text-ginva-silver">
                  You have 72 hours to act
                </p>
              </div>
            </div>

            <div
              className={`flex items-start space-x-3 ${
                hours <= 48 ? "opacity-100" : "opacity-50"
              }`}
            >
              <div className="w-8 h-8 rounded-full bg-ginva-amber flex items-center justify-center text-ginva-navy font-bold text-sm flex-shrink-0">
                24
              </div>
              <div>
                <p className="font-medium">Hour 24</p>
                <p className="text-sm text-ginva-silver">
                  🟡 Alert: 48 hours remaining
                </p>
                {hours <= 48 && hours > 24 && (
                  <p className="text-xs text-ginva-amber">← Currently here</p>
                )}
              </div>
            </div>

            <div
              className={`flex items-start space-x-3 ${
                hours <= 24 ? "opacity-100" : "opacity-50"
              }`}
            >
              <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                48
              </div>
              <div>
                <p className="font-medium">Hour 48</p>
                <p className="text-sm text-ginva-silver">
                  🟠 Alert: Last 24 hours remaining
                </p>
                {hours <= 24 && hours > 0 && (
                  <p className="text-xs text-orange-500">← Currently here</p>
                )}
              </div>
            </div>

            <div
              className={`flex items-start space-x-3 ${
                hours === 0 ? "opacity-100" : "opacity-50"
              }`}
            >
              <div className="w-8 h-8 rounded-full bg-ginva-red flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                72
              </div>
              <div>
                <p className="font-medium">Hour 72</p>
                <p className="text-sm text-ginva-silver">
                  🔴 Protection period ends - Rescue phase begins
                </p>
              </div>
            </div>
          </div>
        </Card>

        {/* Info Footer */}
        <Card className="mt-6 bg-ginva-navy/30">
          <h3 className="font-semibold mb-3 flex items-center">
            <span className="mr-2">ℹ️</span> More Information
          </h3>
          <ul className="space-y-2 text-sm text-ginva-silver">
            <li>• System will alert you every 12 hours</li>
            <li>• You can act anytime during the 72 hours</li>
            <li>• If no action is taken, assets will enter rescue phase</li>
            <li>• All actions require your approval</li>
          </ul>
          <div className="mt-4 flex space-x-4">
            <button className="text-ginva-cyan hover:underline text-sm">
              📞 Contact Support
            </button>
            <button className="text-ginva-cyan hover:underline text-sm">
              📚 Help Center
            </button>
          </div>
        </Card>
      </div>
    </Layout>
  );
}
