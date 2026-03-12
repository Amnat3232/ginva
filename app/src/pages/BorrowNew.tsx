// Borrow Page Component
import { useState, useMemo } from "react";
import {
  LOANS,
  BORROWER_METRICS,
  COLLATERAL_ASSETS,
  LTV_OPTIONS,
} from "../data/mock";

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
                    <span className="error-icon">⚠️</span>
                    {error}
                  </div>
                )}

                {/* Risk Banner */}
                <div className="risk-banner">
                  <div className="risk-header">
                    <span className="risk-title">⚠️ DeFi Risk Warning</span>
                    <span className="risk-badge">
                      <span className="trust-icon">🔒</span>
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
                      <span className="trust-icon">📊</span>
                      Pyth Oracle
                    </span>
                    <span className="trust-badge">
                      <span className="trust-icon">📈</span>
                      8% APR Fixed
                    </span>
                    <span className="trust-badge">
                      <span className="trust-icon">🔍</span>
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
                  disabled={loading || error || !connected}
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
                ["Oracle", "Pyth Network · 15s stale threshold"],
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
