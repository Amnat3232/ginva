// Borrow Page Component
import { useState, useMemo } from "react";
import {
  LOANS,
  BORROWER_METRICS,
  COLLATERAL_ASSETS,
  LTV_OPTIONS,
} from "../data/mock";
import {
  FiAlertTriangle,
  FiLock,
  FiBarChart2,
  FiTrendingUp,
  FiSearch,
} from "react-icons/fi";

interface BorrowProps {
  showToast: (msg: string) => void;
  connected: boolean;
}

export function Borrow({ showToast, connected }: BorrowProps) {
  const [collateral, setCollateral] = useState("SOL");
  const [amount, setAmount] = useState("2.5");
  const [ltv, setLtv] = useState("40");
  const [tab, setTab] = useState("new");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const prices = { SOL: 182.4, BTC: 84210, ETH: 3820 };

  // Validate and calculate values with error handling
  const calculations = useMemo(() => {
    setError(null);

    // Validate amount
    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      setError("Invalid collateral amount");
      return { colValue: 0, borrowAmt: 0, hf: 0 };
    }

    // Validate LTV
    const ltvNum = parseFloat(ltv);
    if (isNaN(ltvNum) || ltvNum < 20 || ltvNum > 60) {
      setError("Invalid LTV percentage");
      return { colValue: 0, borrowAmt: 0, hf: 0 };
    }

    // Calculate collateral value
    const price = prices[collateral as keyof typeof prices];
    const colValue = amountNum * price;

    // Calculate borrow amount
    const borrowAmt = colValue * (ltvNum / 100);

    // Calculate health factor (simplified)
    const hf = ltvNum === 20 ? 250 : ltvNum === 40 ? 150 : 102;

    return { colValue, borrowAmt, hf };
  }, [amount, collateral, ltv, prices]);

  const { colValue, borrowAmt, hf } = calculations;

  return (
    <div className="page-content dashboard">
      <div className="container">
        <div className="dash-header">
          <div className="dash-title">
            Borrower{" "}
            <em style={{ fontStyle: "italic", color: "var(--green)" }}>
              Dashboard
            </em>
          </div>
          <div className="dash-sub">Wallet: 7xK2...mR9P · Devnet</div>
        </div>

        {/* Summary metrics */}
        <div className="grid-auto" style={{ marginBottom: 24 }}>
          {BORROWER_METRICS.map((m, i) => (
            <div className="card" key={i}>
              <div className="metric-label">{m.label}</div>
              <div className="metric-value" style={{ fontSize: "1.8rem" }}>
                {m.value}
              </div>
              <div
                style={{
                  fontSize: "0.75rem",
                  color: "var(--muted)",
                  marginTop: 4,
                }}
              >
                {m.sub}
              </div>
            </div>
          ))}
        </div>

        <div className="grid-2">
          {/* New Loan */}
          <div className="card">
            <div className="tabs">
              <button
                className={`tab ${tab === "new" ? "active" : ""}`}
                onClick={() => setTab("new")}
              >
                New Loan
              </button>
              <button
                className={`tab ${tab === "repay" ? "active" : ""}`}
                onClick={() => setTab("repay")}
              >
                Repay
              </button>
            </div>

            {tab === "new" && (
              <>
                <div className="input-group">
                  <label className="input-label">Collateral Asset</label>
                  <div className="asset-btns">
                    {COLLATERAL_ASSETS.map((a) => (
                      <button
                        key={a}
                        className={`asset-btn ${
                          collateral === a ? "selected" : ""
                        }`}
                        onClick={() => setCollateral(a)}
                      >
                        {a === "SOL" ? "◎" : a === "BTC" ? "₿" : "Ξ"} {a}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="input-group">
                  <label className="input-label">Amount</label>
                  <div className="input-wrap">
                    <input
                      className="input-field"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      type="number"
                      step="0.01"
                    />
                    <span
                      className="input-max"
                      onClick={() => setAmount("5.0")}
                      style={{ cursor: "pointer" }}
                    >
                      MAX
                    </span>
                    <span className="input-suffix">{collateral}</span>
                  </div>
                </div>

                <div className="input-group">
                  <label className="input-label">LTV Level</label>
                  <div className="ltv-levels">
                    {LTV_OPTIONS.map(([v, n]) => (
                      <div
                        key={v}
                        className={`ltv-level ${ltv === v ? "selected" : ""}`}
                        onClick={() => setLtv(v)}
                      >
                        <div className="ltv-level-pct">{v}%</div>
                        <div className="ltv-level-name">{n}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="divider" />

                <div style={{ marginBottom: 16 }}>
                  {[
                    ["Collateral Value", `$${colValue.toFixed(2)}`],
                    ["You Receive", `$${borrowAmt.toFixed(2)} USDC`],
                    ["Interest Rate", "8.00% APR Fixed"],
                    [
                      "Daily Interest",
                      `$${((borrowAmt * 0.08) / 365).toFixed(4)}`,
                    ],
                    ["Health Factor", `${hf}%`],
                  ].map(([k, v]) => (
                    <div className="detail-row" key={k}>
                      <span className="detail-key">{k}</span>
                      <span
                        className="detail-val"
                        style={
                          k === "Health Factor"
                            ? {
                                color:
                                  hf > 150
                                    ? "var(--green)"
                                    : hf > 110
                                    ? "var(--yellow)"
                                    : "var(--red)",
                              }
                            : {}
                        }
                      >
                        {v}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Error Display */}
                {error && (
                  <div className="error-message">
                    <FiAlertTriangle className="error-icon" />
                    {error}
                  </div>
                )}

                {/* Risk Banner */}
                <div className="risk-banner">
                  <div className="risk-header">
                    <span className="risk-title">
                      <FiAlertTriangle className="me-1" /> DeFi Risk Warning
                    </span>
                    <span className="risk-badge">
                      <FiLock className="trust-icon" />
                      Verified Program
                    </span>
                  </div>
                  <p className="risk-desc">
                    GINVA is a decentralized protocol. Your collateral may be
                    liquidated if health factor drops below 100%. Past
                    performance does not guarantee future results. Use at your
                    own risk.
                  </p>
                  <div className="trust-badges">
                    <span className="trust-badge">
                      <FiBarChart2 className="trust-icon" />
                      Pyth Oracle
                    </span>
                    <span className="trust-badge">
                      <FiTrendingUp className="trust-icon" />
                      8% APR Fixed
                    </span>
                    <span className="trust-badge">
                      <FiSearch className="trust-icon" />
                      <a
                        href="https://explorer.solana.com/address/2SiG...WKou?cluster=devnet"
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          color: "var(--green)",
                          textDecoration: "none",
                        }}
                      >
                        View on Explorer
                      </a>
                    </span>
                  </div>
                </div>

                <button
                  className="action-btn"
                  disabled={loading || !!error || !connected}
                  onClick={() => {
                    if (!connected) {
                      showToast("Please connect wallet first");
                      return;
                    }
                    setLoading(true);
                    setTimeout(() => {
                      setLoading(false);
                      showToast("✓ Loan initiated on Devnet");
                    }, 2000);
                  }}
                >
                  {loading ? (
                    <span className="btn-spinner"></span>
                  ) : !connected ? (
                    "Connect Wallet to Borrow"
                  ) : error ? (
                    "Fix Input Errors"
                  ) : (
                    `Borrow ${
                      borrowAmt > 0 ? `$${borrowAmt.toFixed(2)}` : ""
                    } USDC`
                  )}
                </button>
              </>
            )}

            {tab === "repay" && (
              <>
                <div style={{ marginBottom: 16 }}>
                  {LOANS.map((l) => (
                    <div
                      key={l.id}
                      style={{
                        background: "var(--surface2)",
                        borderRadius: 8,
                        padding: "14px 16px",
                        marginBottom: 8,
                      }}
                    >
                      <div className="row-between" style={{ marginBottom: 8 }}>
                        <span className="mono" style={{ fontSize: "0.8rem" }}>
                          {l.id}
                        </span>
                        <span className="badge active">Active</span>
                      </div>
                      <div className="row-between">
                        <span style={{ fontSize: "0.85rem" }}>
                          {l.collateral} · {l.borrowed}
                        </span>
                        <button
                          className="action-btn"
                          style={{
                            width: "auto",
                            padding: "6px 16px",
                            margin: 0,
                            fontSize: "0.8rem",
                          }}
                          onClick={() => showToast(`✓ Repaid ${l.id}`)}
                        >
                          Repay
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Active loans */}
          <div>
            <div className="card" style={{ marginBottom: 16 }}>
              <div className="card-title">Health Monitor</div>
              {LOANS.map((l) => (
                <div key={l.id} style={{ marginBottom: 16 }}>
                  <div className="row-between" style={{ marginBottom: 6 }}>
                    <span className="mono" style={{ fontSize: "0.8rem" }}>
                      {l.id} · {l.collateral}
                    </span>
                    <div
                      style={{
                        position: "relative",
                        width: 80,
                        height: 80,
                      }}
                    >
                      <svg
                        width="80"
                        height="80"
                        style={{ transform: "rotate(-90deg)" }}
                      >
                        <circle
                          cx="40"
                          cy="40"
                          r="34"
                          fill="none"
                          stroke="var(--surface2)"
                          strokeWidth="5"
                        />
                        <circle
                          cx="40"
                          cy="40"
                          r="34"
                          fill="none"
                          stroke="var(--green)"
                          strokeWidth="5"
                          strokeDasharray={2 * Math.PI * 34}
                          strokeDashoffset={2 * Math.PI * 34 * (1 - l.hf / 300)}
                          strokeLinecap="round"
                          style={{ transition: "stroke-dashoffset 1s ease" }}
                        />
                      </svg>
                      <div
                        style={{
                          position: "absolute",
                          inset: 0,
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <span
                          style={{
                            fontFamily: "var(--font-mono)",
                            fontSize: "0.9rem",
                            fontWeight: 700,
                            color: "var(--green)",
                          }}
                        >
                          {l.hf}%
                        </span>
                        <span
                          style={{ fontSize: "0.55rem", color: "var(--muted)" }}
                        >
                          HF
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="prog-bar">
                    <div
                      className="prog-fill green"
                      style={{ width: `${Math.min(l.hf / 3, 100)}%` }}
                    />
                  </div>
                  <div className="row-between">
                    <span
                      style={{ fontSize: "0.75rem", color: "var(--muted)" }}
                    >
                      LTV {l.ltv}
                    </span>
                    <span
                      style={{ fontSize: "0.75rem", color: "var(--muted)" }}
                    >
                      Matures {l.maturity}
                    </span>
                  </div>
                  {l.id !== "LN-003" && (
                    <div className="divider" style={{ margin: "12px 0" }} />
                  )}
                </div>
              ))}
            </div>

            <div className="card">
              <div className="card-title">Protocol Parameters</div>
              {[
                ["Interest Rate", "8% APR · Fixed · Immutable"],
                ["Grace Period", "72 hours after maturity"],
                ["LTV Max", "60% · Immediate liquidation if HF < 100%"],
                ["Oracle", "Pyth + Switchboard · Dual Validation"],
                ["Circuit Breaker", "Active · 5% deviation threshold"],
                ["Network", "Solana Devnet"],
              ].map(([k, v]) => (
                <div className="detail-row" key={k}>
                  <span className="detail-key">{k}</span>
                  <span
                    style={{
                      fontSize: "0.78rem",
                      color: "var(--text)",
                      textAlign: "right",
                      maxWidth: "60%",
                    }}
                  >
                    {v}
                  </span>
                </div>
              ))}

              {/* Security Status Indicators */}
              <div style={{ marginTop: 16, paddingTop: 16, borderTop: "1px solid var(--border)" }}>
                <div style={{ fontSize: "0.75rem", color: "var(--muted)", marginBottom: 8 }}>
                  Security Status
                </div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <span className="badge active" style={{ fontSize: "0.7rem" }}>
                    Multi-Oracle
                  </span>
                  <span className="badge active" style={{ fontSize: "0.7rem" }}>
                    Circuit Breaker
                  </span>
                </div>
              </div>
            </div>

            {/* Supply Cap Status Card */}
            <div className="card" style={{ marginTop: 16 }}>
              <div className="card-title" style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--green)" strokeWidth="2">
                  <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                </svg>
                Supply Capacity
              </div>

              {/* SOL Supply */}
              <div style={{ marginBottom: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <span style={{ fontSize: "0.8rem", color: "var(--text)" }}>
                    <span style={{ color: "var(--green)" }}>◎</span> SOL Pool
                  </span>
                  <span style={{ fontSize: "0.75rem", color: "var(--muted)" }}>
                    125,000 / 1,000,000 SOL
                  </span>
                </div>
                <div style={{ height: 8, background: "var(--surface2)", borderRadius: 4, overflow: "hidden" }}>
                  <div style={{
                    width: "12.5%",
                    height: "100%",
                    background: "linear-gradient(90deg, var(--green), var(--green-light, #00ff88))",
                    borderRadius: 4,
                    transition: "width 0.5s ease",
                  }} />
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
                  <span style={{ fontSize: "0.7rem", color: "var(--green)" }}>12.5% Used</span>
                  <span style={{ fontSize: "0.7rem", color: "var(--muted)" }}>875,000 SOL Available</span>
                </div>
              </div>

              {/* USDC Supply */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <span style={{ fontSize: "0.8rem", color: "var(--text)" }}>
                    <span style={{ color: "#2775ca" }}>$</span> USDC Lending Pool
                  </span>
                  <span style={{ fontSize: "0.75rem", color: "var(--muted)" }}>
                    $2,450,000 / $10,000,000
                  </span>
                </div>
                <div style={{ height: 8, background: "var(--surface2)", borderRadius: 4, overflow: "hidden" }}>
                  <div style={{
                    width: "24.5%",
                    height: "100%",
                    background: "linear-gradient(90deg, #2775ca, #4a9eff)",
                    borderRadius: 4,
                    transition: "width 0.5s ease",
                  }} />
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
                  <span style={{ fontSize: "0.7rem", color: "#4a9eff" }}>24.5% Utilized</span>
                  <span style={{ fontSize: "0.7rem", color: "var(--muted)" }}>$7,550,000 Available</span>
                </div>
              </div>

              <div style={{
                marginTop: 12,
                padding: "8px 12px",
                background: "rgba(0, 230, 118, 0.1)",
                borderRadius: 6,
                border: "1px solid rgba(0, 230, 118, 0.2)",
                fontSize: "0.72rem",
                color: "var(--green)",
              }}>
                ✓ Supply caps protect against inflation attacks. New deposits/reborrows rejected when 100% reached.
              </div>
            </div>

            {/* Circuit Breaker Status Card */}
            <div className="card" style={{ marginTop: 16 }}>
              <div className="card-title" style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--green)" strokeWidth="2">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                </svg>
                Oracle Circuit Breaker
              </div>

              <div style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 12,
                marginBottom: 12,
              }}>
                {/* Pyth Oracle */}
                <div style={{
                  padding: "12px",
                  background: "var(--surface2)",
                  borderRadius: 8,
                  border: "1px solid var(--border)",
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                    <div style={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      background: "var(--green)",
                      boxShadow: "0 0 8px var(--green)",
                    }} />
                    <span style={{ fontSize: "0.75rem", fontWeight: 600 }}>Pyth Network</span>
                  </div>
                  <div style={{ fontSize: "0.7rem", color: "var(--muted)", marginBottom: 4 }}>SOL/USD</div>
                  <div style={{ fontSize: "1rem", fontWeight: 600, color: "var(--text)" }}>$182.40</div>
                  <div style={{ fontSize: "0.65rem", color: "var(--green)", marginTop: 2 }}>Updated 3s ago</div>
                </div>

                {/* Switchboard Oracle */}
                <div style={{
                  padding: "12px",
                  background: "var(--surface2)",
                  borderRadius: 8,
                  border: "1px solid var(--border)",
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                    <div style={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      background: "var(--green)",
                      boxShadow: "0 0 8px var(--green)",
                    }} />
                    <span style={{ fontSize: "0.75rem", fontWeight: 600 }}>Switchboard</span>
                  </div>
                  <div style={{ fontSize: "0.7rem", color: "var(--muted)", marginBottom: 4 }}>SOL/USD</div>
                  <div style={{ fontSize: "1rem", fontWeight: 600, color: "var(--text)" }}>$182.38</div>
                  <div style={{ fontSize: "0.65rem", color: "var(--green)", marginTop: 2 }}>Updated 5s ago</div>
                </div>
              </div>

              {/* Deviation Monitor */}
              <div style={{
                padding: "12px",
                background: "var(--surface2)",
                borderRadius: 8,
                marginBottom: 12,
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <span style={{ fontSize: "0.75rem", color: "var(--muted)" }}>Price Deviation</span>
                  <span style={{
                    fontSize: "0.7rem",
                    padding: "2px 8px",
                    borderRadius: 4,
                    background: "rgba(0, 230, 118, 0.15)",
                    color: "var(--green)",
                  }}>
                    Normal
                  </span>
                </div>
                <div style={{ height: 6, background: "var(--surface1)", borderRadius: 3, position: "relative" }}>
                  {/* Threshold line at 5% */}
                  <div style={{
                    position: "absolute",
                    left: "5%",
                    top: 0,
                    bottom: 0,
                    width: 2,
                    background: "var(--red)",
                    borderRadius: 1,
                  }} />
                  {/* Current deviation */}
                  <div style={{
                    width: "0.01%",
                    height: "100%",
                    background: "var(--green)",
                    borderRadius: 3,
                    position: "relative",
                  }}>
                    <div style={{
                      position: "absolute",
                      right: -4,
                      top: "50%",
                      transform: "translateY(-50%)",
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      background: "var(--green)",
                      border: "2px solid var(--surface2)",
                    }} />
                  </div>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
                  <span style={{ fontSize: "0.65rem", color: "var(--muted)" }}>0%</span>
                  <span style={{ fontSize: "0.65rem", color: "var(--red)" }}>5% THRESHOLD</span>
                  <span style={{ fontSize: "0.65rem", color: "var(--muted)" }}>10%</span>
                </div>
              </div>

              {/* Status Info */}
              <div style={{
                padding: "10px 12px",
                background: "rgba(0, 230, 118, 0.08)",
                borderRadius: 6,
                border: "1px solid rgba(0, 230, 118, 0.15)",
                fontSize: "0.72rem",
                color: "var(--green)",
              }}>
                ✓ Protocol active. If oracle prices diverge &gt;5%, borrowing auto-pauses until resolution.
              </div>
            </div>
          </div>
        </div>

        {/* Loan history */}
        <div className="card" style={{ marginTop: 24 }}>
          <div className="card-title">Active Loans</div>
          {connected ? (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Loan ID</th>
                  <th>Collateral</th>
                  <th>Value</th>
                  <th>Borrowed</th>
                  <th>Health Factor</th>
                  <th>LTV</th>
                  <th>Matures</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {LOANS.map((l) => (
                  <tr key={l.id}>
                    <td className="mono green-text">{l.id}</td>
                    <td className="mono">{l.collateral}</td>
                    <td className="mono">{l.value}</td>
                    <td className="mono">{l.borrowed}</td>
                    <td>
                      <span
                        className={`badge ${
                          l.hf > 150
                            ? "active"
                            : l.hf > 110
                            ? "warning"
                            : "danger"
                        }`}
                      >
                        {l.hf}%
                      </span>
                    </td>
                    <td className="mono">{l.ltv}</td>
                    <td className="muted-text">{l.maturity}</td>
                    <td>
                      <button
                        style={{
                          padding: "5px 14px",
                          borderRadius: 6,
                          border: "1px solid var(--border)",
                          background: "transparent",
                          color: "var(--muted)",
                          fontSize: "0.78rem",
                          cursor: "pointer",
                        }}
                        onClick={() => showToast("✓ Loan extended")}
                      >
                        Extend
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="skeleton-table">
              <div className="skeleton-row header">
                <div className="skeleton-cell">Loan ID</div>
                <div className="skeleton-cell">Collateral</div>
                <div className="skeleton-cell">Value</div>
                <div className="skeleton-cell">Borrowed</div>
                <div className="skeleton-cell">Health Factor</div>
                <div className="skeleton-cell">LTV</div>
                <div className="skeleton-cell">Matures</div>
                <div className="skeleton-cell">Action</div>
              </div>
              {[1, 2, 3].map((i) => (
                <div className="skeleton-row" key={i}>
                  <div className="skeleton-cell">
                    <div className="skeleton-bar"></div>
                  </div>
                  <div className="skeleton-cell">
                    <div className="skeleton-bar"></div>
                  </div>
                  <div className="skeleton-cell">
                    <div className="skeleton-bar"></div>
                  </div>
                  <div className="skeleton-cell">
                    <div className="skeleton-bar"></div>
                  </div>
                  <div className="skeleton-cell">
                    <div className="skeleton-bar"></div>
                  </div>
                  <div className="skeleton-cell">
                    <div className="skeleton-bar"></div>
                  </div>
                  <div className="skeleton-cell">
                    <div className="skeleton-bar"></div>
                  </div>
                  <div className="skeleton-cell">
                    <div className="skeleton-bar"></div>
                  </div>
                </div>
              ))}
              <div className="skeleton-msg">
                Connect wallet to view active loans
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Borrow;
