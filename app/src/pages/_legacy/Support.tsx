// Supporter (LP) Page Component
import { useState } from "react";
import { POOL_DATA, SUPPORTER_POOL_STATS } from "../data/mock";
import { FiAlertTriangle, FiShield, FiActivity } from "react-icons/fi";

interface SupportProps {
  showToast: (msg: string) => void;
}

export function Support({ showToast }: SupportProps) {
  const [depositAmt, setDepositAmt] = useState("1000");
  const [tab, setTab] = useState("deposit");

  const daysLeft = Math.max(0, 15 - POOL_DATA.depositAge);
  const shieldActive = POOL_DATA.depositAge < 15;

  return (
    <div className="page-content dashboard">
      <div className="container">
        <div className="dash-header">
          <div className="dash-title">
            Supporter{" "}
            <em style={{ fontStyle: "italic", color: "var(--green)" }}>
              Panel
            </em>
          </div>
          <div className="dash-sub">
            Provide liquidity · Earn from borrower interest
          </div>
        </div>

        {/* Pool overview */}
        <div className="grid-auto" style={{ marginBottom: 24 }}>
          {SUPPORTER_POOL_STATS.map((m, i) => (
            <div className="card" key={i}>
              <div className="metric-label">{m.label}</div>
              <div className="metric-value" style={{ fontSize: "1.7rem" }}>
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
          {/* Deposit/Withdraw */}
          <div className="card">
            <div className="tabs">
              <button
                className={`tab ${tab === "deposit" ? "active" : ""}`}
                onClick={() => setTab("deposit")}
              >
                Deposit
              </button>
              <button
                className={`tab ${tab === "withdraw" ? "active" : ""}`}
                onClick={() => setTab("withdraw")}
              >
                Withdraw
              </button>
            </div>

            {tab === "deposit" && (
              <>
                <div className="input-group">
                  <label className="input-label">Amount (USDC)</label>
                  <div className="input-wrap">
                    <input
                      className="input-field"
                      value={depositAmt}
                      onChange={(e) => setDepositAmt(e.target.value)}
                      type="number"
                    />
                    <span
                      className="input-max"
                      onClick={() => setDepositAmt("10000")}
                      style={{ cursor: "pointer" }}
                    >
                      MAX
                    </span>
                    <span className="input-suffix">USDC</span>
                  </div>
                </div>

                <div
                  style={{
                    background: "var(--surface2)",
                    borderRadius: 8,
                    padding: 16,
                    marginBottom: 16,
                  }}
                >
                  <div
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: "0.68rem",
                      color: "var(--muted)",
                      marginBottom: 10,
                      letterSpacing: "0.1em",
                      textTransform: "uppercase",
                    }}
                  >
                    Projected Returns
                  </div>
                  {[
                    [
                      "Daily",
                      `$${(
                        ((parseFloat(depositAmt) || 0) * 0.072) /
                        365
                      ).toFixed(4)}`,
                    ],
                    [
                      "Monthly",
                      `$${(
                        ((parseFloat(depositAmt) || 0) * 0.072) /
                        12
                      ).toFixed(2)}`,
                    ],
                    [
                      "Annual",
                      `$${((parseFloat(depositAmt) || 0) * 0.072).toFixed(2)}`,
                    ],
                    ["APY Rate", `${POOL_DATA.apy}%`],
                  ].map(([k, v]) => (
                    <div className="detail-row" key={k}>
                      <span className="detail-key">{k}</span>
                      <span className="detail-val green-text">{v}</span>
                    </div>
                  ))}
                </div>

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    background: "rgba(0,230,118,0.05)",
                    border: "1px solid var(--green-dim)",
                    borderRadius: 8,
                    padding: "10px 14px",
                    marginBottom: 16,
                    fontSize: "0.8rem",
                    color: "var(--muted)",
                  }}
                >
                  <FiActivity style={{ color: "var(--green)" }} />
                  No shield fee after 15 days. Withdraw freely once stable.
                </div>

                <button
                  className="action-btn"
                  onClick={() =>
                    showToast("✓ Deposit confirmed · Shield timer started")
                  }
                >
                  Deposit{" "}
                  {depositAmt
                    ? `$${parseFloat(depositAmt).toLocaleString()}`
                    : ""}{" "}
                  USDC
                </button>
              </>
            )}

            {tab === "withdraw" && (
              <>
                {shieldActive && (
                  <div
                    style={{
                      background: "rgba(255,215,64,0.08)",
                      border: "1px solid rgba(255,215,64,0.3)",
                      borderRadius: 8,
                      padding: "14px 16px",
                      marginBottom: 16,
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        fontSize: "0.82rem",
                        fontWeight: 500,
                        color: "var(--yellow)",
                        marginBottom: 6,
                      }}
                    >
                      <FiAlertTriangle style={{ color: "var(--yellow)" }} />
                      Shield Fee Active
                    </div>
                    <div style={{ fontSize: "0.78rem", color: "#b8860b" }}>
                      Deposited {POOL_DATA.depositAge} days ago. Withdrawing
                      before day 15 incurs a 5% shield fee.
                      {daysLeft > 0 && ` ${daysLeft} days remaining.`}
                    </div>
                  </div>
                )}

                <div className="input-group">
                  <label className="input-label">Withdraw Amount (USDC)</label>
                  <div className="input-wrap">
                    <input
                      className="input-field"
                      defaultValue="5000"
                      type="number"
                    />
                    <span className="input-max">MAX</span>
                    <span className="input-suffix">USDC</span>
                  </div>
                </div>

                {[
                  ["My Balance", POOL_DATA.myDeposit],
                  ["Earned Interest", POOL_DATA.myEarned],
                  [
                    "Shield Fee",
                    shieldActive ? "5% (Early withdrawal)" : "0% (Free)",
                  ],
                  ["You Receive", shieldActive ? "~$4,750" : "$5,000"],
                ].map(([k, v]) => (
                  <div className="detail-row" key={k}>
                    <span className="detail-key">{k}</span>
                    <span
                      className="detail-val"
                      style={
                        k === "Shield Fee" && shieldActive
                          ? { color: "var(--yellow)" }
                          : {}
                      }
                    >
                      {v}
                    </span>
                  </div>
                ))}

                <button
                  className={`action-btn ${shieldActive ? "danger" : ""}`}
                  style={{ marginTop: 16 }}
                  onClick={() =>
                    showToast(
                      shieldActive
                        ? "Withdrawn with 5% shield fee"
                        : "Withdrawn successfully"
                    )
                  }
                >
                  {shieldActive ? "Withdraw (5% fee)" : "Withdraw Free"}
                </button>
              </>
            )}
          </div>

          {/* Pool stats + shield */}
          <div>
            <div className="card" style={{ marginBottom: 16 }}>
              <div className="card-title">Pool Utilization</div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 24,
                  marginBottom: 16,
                }}
              >
                <div style={{ position: "relative", width: 120, height: 120 }}>
                  <svg
                    width="120"
                    height="120"
                    style={{ transform: "rotate(-90deg)" }}
                  >
                    <circle
                      cx="60"
                      cy="60"
                      r="50"
                      fill="none"
                      stroke="var(--surface2)"
                      strokeWidth="10"
                    />
                    <circle
                      cx="60"
                      cy="60"
                      r="50"
                      fill="none"
                      stroke="var(--green)"
                      strokeWidth="10"
                      strokeDasharray={2 * Math.PI * 50}
                      strokeDashoffset={
                        2 * Math.PI * 50 * (1 - POOL_DATA.utilization / 100)
                      }
                      strokeLinecap="round"
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
                        fontFamily: "var(--font-display)",
                        fontSize: "1.6rem",
                        fontWeight: 600,
                        color: "var(--green)",
                      }}
                    >
                      {POOL_DATA.utilization}%
                    </span>
                    <span
                      style={{ fontSize: "0.65rem", color: "var(--muted)" }}
                    >
                      Utilized
                    </span>
                  </div>
                </div>
                <div style={{ flex: 1 }}>
                  {[
                    {
                      label: "Lent Out",
                      value: `$${((2412840 * 0.68) / 1000000).toFixed(2)}M`,
                      color: "var(--green)",
                    },
                    {
                      label: "Available",
                      value: `$${((2412840 * 0.32) / 1000000).toFixed(2)}M`,
                      color: "var(--muted)",
                    },
                    {
                      label: "Reserve Fund",
                      value: "$142,400",
                      color: "#40c4ff",
                    },
                  ].map((s) => (
                    <div key={s.label} style={{ marginBottom: 12 }}>
                      <div className="row-between" style={{ marginBottom: 4 }}>
                        <span
                          style={{ fontSize: "0.78rem", color: "var(--muted)" }}
                        >
                          {s.label}
                        </span>
                        <span
                          style={{
                            fontFamily: "var(--font-mono)",
                            fontSize: "0.82rem",
                            color: s.color,
                          }}
                        >
                          {s.value}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="card" style={{ marginBottom: 16 }}>
              <div className="card-title">My Position</div>
              <div style={{ marginBottom: 16 }}>
                <div
                  style={{
                    fontSize: "0.78rem",
                    color: "var(--muted)",
                    marginBottom: 6,
                  }}
                >
                  Shield Status
                </div>
                <div
                  style={{
                    height: 8,
                    background: "var(--surface2)",
                    borderRadius: 4,
                    overflow: "hidden",
                    marginBottom: 6,
                  }}
                >
                  <div
                    style={{
                      height: "100%",
                      width: `${(POOL_DATA.depositAge / 15) * 100}%`,
                      background:
                        "linear-gradient(90deg, var(--yellow), var(--green))",
                      borderRadius: 4,
                      transition: "width 1s",
                    }}
                  />
                </div>
                <div className="row-between">
                  <span style={{ fontSize: "0.72rem", color: "var(--muted)" }}>
                    Day 0
                  </span>
                  <span
                    style={{
                      fontSize: "0.72rem",
                      color: shieldActive ? "var(--yellow)" : "var(--green)",
                      fontFamily: "var(--font-mono)",
                    }}
                  >
                    {shieldActive
                      ? `${daysLeft}d to free withdrawal`
                      : "✓ Free to withdraw"}
                  </span>
                  <span style={{ fontSize: "0.72rem", color: "var(--muted)" }}>
                    Day 15
                  </span>
                </div>
              </div>

              {[
                ["Deposited", `Day ${POOL_DATA.depositAge} ago`, "var(--text)"],
                ["My Share", "0.52%", "var(--green)"],
                ["Earned Today", "$12.84", "var(--green)"],
                ["Next Payout", "Continuous", "var(--muted)"],
              ].map(([k, v, c]) => (
                <div className="detail-row" key={k}>
                  <span className="detail-key">{k}</span>
                  <span className="detail-val" style={{ color: c }}>
                    {v}
                  </span>
                </div>
              ))}
            </div>

            <div className="card">
              <div className="card-title">Safety Accumulation Rules</div>
              <div
                style={{
                  fontSize: "0.82rem",
                  lineHeight: 1.7,
                  color: "#5a8a5c",
                }}
              >
                <div
                  style={{
                    marginBottom: 8,
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <FiShield style={{ color: "var(--green)" }} />
                  <span>
                    <strong style={{ color: "var(--text)" }}>Stable</strong> —
                    Unlimited time, 0% fee
                  </span>
                </div>
                <div
                  style={{
                    marginBottom: 8,
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <FiShield style={{ color: "var(--green)" }} />
                  <span>
                    <strong style={{ color: "var(--text)" }}>
                      Accumulated
                    </strong>{" "}
                    — After 15 days, 0% fee
                  </span>
                </div>
                <div
                  style={{
                    marginBottom: 8,
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <FiAlertTriangle style={{ color: "var(--yellow)" }} />
                  <span>
                    <strong style={{ color: "var(--yellow)" }}>Early</strong> —
                    Before 15 days, 5% shield fee
                  </span>
                </div>
                <div
                  style={{
                    fontSize: "0.75rem",
                    color: "var(--faint)",
                    marginTop: 12,
                  }}
                >
                  Fee goes to Reserve Fund (insurance pool)
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Support;
