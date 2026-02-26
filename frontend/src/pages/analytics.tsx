import React from "react";
import Layout from "../components/Layout";
import Card from "../components/Card";
import Icon from "../components/Icon";
import { useAnalytics } from "../hooks/useAnalytics";

export default function AnalyticsPage() {
  const { loading, error, stats, historicalData, topCollateral } =
    useAnalytics();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatPercent = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  return (
    <Layout title="Analytics - GINVA">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-display font-bold mb-1">
            Platform Analytics
          </h1>
          <p className="text-ginva-silver">
            Real-time insights into GINVA protocol performance
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-ginva-cyan"></div>
          </div>
        ) : error ? (
          <div className="bg-ginva-red/10 border border-ginva-red/30 rounded-xl p-6 text-center">
            <p className="text-ginva-red">
              Error loading analytics: {error.message}
            </p>
          </div>
        ) : (
          <>
            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <Card>
                <div className="text-center">
                  <div className="text-ginva-silver text-sm mb-1">
                    Total Value Locked
                  </div>
                  <div className="text-2xl font-mono font-bold text-ginva-cyan">
                    {stats ? formatCurrency(stats.tvl) : "$0"}
                  </div>
                </div>
              </Card>
              <Card>
                <div className="text-center">
                  <div className="text-ginva-silver text-sm mb-1">
                    Active Loans
                  </div>
                  <div className="text-2xl font-mono font-bold text-ginva-gold">
                    {stats?.activeLoans || 0}
                  </div>
                </div>
              </Card>
              <Card>
                <div className="text-center">
                  <div className="text-ginva-silver text-sm mb-1">
                    Total Borrowers
                  </div>
                  <div className="text-2xl font-mono font-bold">
                    {stats?.totalBorrowers || 0}
                  </div>
                </div>
              </Card>
              <Card>
                <div className="text-center">
                  <div className="text-ginva-silver text-sm mb-1">
                    Supporter APY
                  </div>
                  <div className="text-2xl font-mono font-bold text-ginva-green">
                    {stats ? formatPercent(stats.supporterApy) : "0%"}
                  </div>
                </div>
              </Card>
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
              {/* TVL Chart */}
              <Card>
                <h2 className="text-xl font-semibold mb-4">TVL Growth</h2>
                <div className="bg-ginva-slate/30 rounded-xl p-4">
                  <div className="flex items-end justify-between h-48 gap-2">
                    {historicalData.map((item, index) => (
                      <div
                        key={item.date}
                        className="flex-1 flex flex-col items-center"
                      >
                        <div
                          className="w-full bg-ginva-cyan rounded-t-lg transition-all hover:bg-ginva-cyan/80"
                          style={{
                            height: `${
                              (item.tvl /
                                Math.max(...historicalData.map((d) => d.tvl))) *
                              100
                            }%`,
                            minHeight: "20px",
                          }}
                        ></div>
                        <div className="text-xs text-ginva-silver mt-2">
                          {item.date}
                        </div>
                        <div className="text-xs font-mono">
                          {formatCurrency(item.tvl)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>

              {/* Collateral Distribution */}
              <Card>
                <h2 className="text-xl font-semibold mb-4">
                  Collateral Distribution
                </h2>
                <div className="space-y-4">
                  {topCollateral.length === 0 ? (
                    <p className="text-ginva-silver text-center py-8">
                      No collateral data
                    </p>
                  ) : (
                    topCollateral.map((item) => (
                      <div key={item.type}>
                        <div className="flex justify-between mb-1">
                          <span className="font-medium">{item.type}</span>
                          <span className="font-mono text-ginva-cyan">
                            {formatPercent(item.percentage)}
                          </span>
                        </div>
                        <div className="w-full bg-ginva-slate rounded-full h-3">
                          <div
                            className="bg-gradient-to-r from-ginva-cyan to-ginva-gold h-3 rounded-full"
                            style={{ width: `${item.percentage}%` }}
                          ></div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </Card>

              {/* Loans Count Chart */}
              <Card>
                <h2 className="text-xl font-semibold mb-4">
                  Active Loans Over Time
                </h2>
                <div className="bg-ginva-slate/30 rounded-xl p-4">
                  <div className="flex items-end justify-between h-48 gap-2">
                    {historicalData.map((item) => (
                      <div
                        key={item.date}
                        className="flex-1 flex flex-col items-center"
                      >
                        <div
                          className="w-full bg-ginva-gold rounded-t-lg transition-all hover:bg-ginva-gold/80"
                          style={{
                            height: `${
                              (item.loans /
                                Math.max(
                                  ...historicalData.map((d) => d.loans)
                                )) *
                              100
                            }%`,
                            minHeight: "20px",
                          }}
                        ></div>
                        <div className="text-xs text-ginva-silver mt-2">
                          {item.date}
                        </div>
                        <div className="text-xs font-mono">
                          {item.loans} loans
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>

              {/* Market Stats */}
              <Card>
                <h2 className="text-xl font-semibold mb-4">Market Overview</h2>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-ginva-slate/30 rounded-lg">
                    <span className="text-ginva-silver">Protocol Health</span>
                    <span className="text-ginva-cyan font-bold flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-ginva-cyan inline-block" />
                      Excellent
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-ginva-slate/30 rounded-lg">
                    <span className="text-ginva-silver">Avg. Loan Size</span>
                    <span className="font-mono">
                      {stats?.activeLoans
                        ? formatCurrency(stats.tvl / stats.activeLoans)
                        : "$0"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-ginva-slate/30 rounded-lg">
                    <span className="text-ginva-silver">
                      Liquidation Threshold
                    </span>
                    <span className="font-mono">80% LTV</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-ginva-slate/30 rounded-lg">
                    <span className="text-ginva-silver">Interest Rate</span>
                    <span className="font-mono text-ginva-gold">1% APR</span>
                  </div>
                </div>
              </Card>
            </div>
          </>
        )}
      </div>
    </Layout>
  );
}
