import { Card, Container, Row, Col, Badge, Button } from "react-bootstrap";
import {
  FiDollarSign,
  FiTrendingUp,
  FiShield,
  FiArrowRight,
  FiCreditCard,
} from "react-icons/fi";
import { useWallet } from "@solana/wallet-adapter-react";
import { useState, useEffect } from "react";
import { useGinvaProgram } from "../hooks/useGinvaProgram";
import { usePythPrice, formatPrice } from "../hooks/usePythPrice";
import {
  useCoinGecko,
  formatPrice as formatCryptoPrice,
} from "../hooks/useCoinGecko";
import { useConnection } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";

const glassCardStyle = {
  background: "rgba(15, 23, 42, 0.6)",
  backdropFilter: "blur(20px)",
  border: "1px solid rgba(16, 185, 129, 0.15)",
  borderRadius: "16px",
  boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)",
};

const Dashboard = () => {
  const { connected, publicKey } = useWallet();
  const { program } = useGinvaProgram();
  const { connection } = useConnection();
  const [data, setData] = useState({
    tvl: 0,
    activeLoans: 0,
    userActiveLoans: 0,
    userCollateral: 0,
  });
  const [activeTab, setActiveTab] = useState<
    "tokens" | "nfts" | "collectibles"
  >("tokens");

  const {
    price: solPrice,
    loading: solLoading,
    lastUpdate: solUpdate,
  } = usePythPrice("sol", connection, true);
  const { price: btcPrice, loading: btcLoading } = usePythPrice(
    "btc",
    connection,
    true
  );
  const { price: ethPrice, loading: ethLoading } = usePythPrice(
    "eth",
    connection,
    true
  );

  // CoinGecko prices (auto-refresh every 30 seconds)
  const {
    prices: cgPrices,
    loading: cgLoading,
    lastUpdate: cgUpdate,
  } = useCoinGecko(30000);

  useEffect(() => {
    const fetchData = async () => {
      if (!program) return;
      try {
        const systemConfigPda = PublicKey.findProgramAddressSync(
          [Buffer.from("config")],
          program.programId
        )[0];
        const systemConfig = await program.account.systemConfig.fetch(
          systemConfigPda
        );

        const tvl =
          systemConfig.totalBorrowed.toNumber() / 1e6 +
          (systemConfig.totalCollateral.toNumber() / 1e9) * 100;

        let activeLoans = 0;
        let userActiveLoans = 0;
        let userCollateral = 0;

        if (publicKey) {
          const userLoans = await program.account.loanAccount.all([
            { memcmp: { offset: 8, bytes: publicKey.toBase58() } },
          ]);
          const activeUserLoans = userLoans.filter(
            (loan: any) => loan.account.status === 1
          );
          userActiveLoans = activeUserLoans.length;
          userCollateral = activeUserLoans.reduce(
            (sum: number, loan: any) =>
              sum + loan.account.collateralAmount.toNumber(),
            0
          );

          const allLoans = await program.account.loanAccount.all();
          activeLoans = allLoans.filter(
            (loan: any) => loan.account.status === 1
          ).length;
        }

        setData({ tvl, activeLoans, userActiveLoans, userCollateral });
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      }
    };
    fetchData();
  }, [program, publicKey]);

  const statCards = [
    {
      label: "Total Value Locked",
      value: `$${data.tvl.toFixed(2)}`,
      subValue: "0 USDC",
      icon: <FiDollarSign size={24} />,
      color: "#10b981",
    },
    {
      label: "Active Loans",
      value: data.userActiveLoans.toString(),
      subValue:
        data.userActiveLoans > 0
          ? `${data.userActiveLoans} Active`
          : "No Active Loans",
      icon: <FiTrendingUp size={24} />,
      color: "#3b82f6",
    },
    {
      label: "Your Collateral",
      value:
        data.userCollateral > 0
          ? `◎ ${(data.userCollateral / 1e9).toFixed(4)}`
          : "0 SOL",
      subValue: connected ? "Deposited" : "Connect to view",
      icon: <FiCreditCard size={24} />,
      color: "#8b5cf6",
    },
    {
      label: "Protection",
      value: "Dual Layer",
      subValue: "72h + Immediate",
      icon: <FiShield size={24} />,
      color: "#f59e0b",
    },
  ];

  const sampleTokens = [
    {
      symbol: "SOL",
      name: "Solana",
      amount: 0,
      value: 0,
      icon: "◎",
      color: "#10b981",
    },
    {
      symbol: "USDC",
      name: "USD Coin",
      amount: 0,
      value: 0,
      icon: "$",
      color: "#2775ca",
    },
  ];

  return (
    <Container fluid className="px-3 py-4" style={{ minHeight: "100vh" }}>
      {/* Header */}
      <div className="mb-4">
        <h2
          style={{
            color: "white",
            fontFamily: "'Exo 2', sans-serif",
            fontWeight: 700,
            marginBottom: "8px",
          }}
        >
          Portfolio
        </h2>
        <p
          style={{
            color: "rgba(255,255,255,0.5)",
            fontSize: "14px",
            margin: 0,
          }}
        >
          {connected ? (
            <span>
              {publicKey?.toString().slice(0, 8)}...
              {publicKey?.toString().slice(-8)}
            </span>
          ) : (
            "Connect your wallet to view portfolio"
          )}
        </p>
      </div>

      {/* Portfolio Value Card */}
      <Card
        style={{ ...glassCardStyle, marginBottom: "24px", padding: "20px" }}
      >
        <div className="d-flex justify-content-between align-items-center mb-3">
          <div>
            <small
              style={{
                color: "rgba(255,255,255,0.5)",
                textTransform: "uppercase",
                fontSize: "12px",
                letterSpacing: "1px",
              }}
            >
              Total Balance
            </small>
            <h1
              style={{
                color: "white",
                fontFamily: "'Exo 2', sans-serif",
                fontWeight: 700,
                fontSize: "36px",
                margin: 0,
              }}
            >
              $0.00
            </h1>
          </div>
          <div style={{ textAlign: "right" }}>
            <Badge
              bg="success"
              style={{
                background: "rgba(16, 185, 129, 0.2)",
                color: "#10b981",
                padding: "6px 12px",
              }}
            >
              Devnet
            </Badge>
          </div>
        </div>
        <div className="d-flex gap-2">
          <Button
            href="/pawn"
            style={{
              background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
              border: "none",
              borderRadius: "8px",
              padding: "10px 20px",
              fontWeight: 600,
              fontFamily: "'Exo 2', sans-serif",
            }}
          >
            Borrow USDC
          </Button>
          <Button
            href="/earn"
            variant="outline-light"
            style={{
              border: "1px solid rgba(255,255,255,0.2)",
              borderRadius: "8px",
              color: "white",
              padding: "10px 20px",
              fontWeight: 600,
              fontFamily: "'Exo 2', sans-serif",
              background: "transparent",
            }}
          >
            Earn Yield
          </Button>
        </div>
      </Card>

      {/* Stats Grid */}
      <Row xs={2} lg={4} className="g-3 mb-4">
        {statCards.map((stat, idx) => (
          <Col key={idx}>
            <Card style={{ ...glassCardStyle, height: "100%" }}>
              <Card.Body style={{ padding: "16px" }}>
                <div className="d-flex justify-content-between align-items-start mb-2">
                  <div>
                    <small
                      style={{
                        color: "rgba(255,255,255,0.5)",
                        fontSize: "11px",
                        textTransform: "uppercase",
                      }}
                    >
                      {stat.label}
                    </small>
                    <h4
                      style={{
                        color: "white",
                        fontFamily: "'Exo 2', sans-serif",
                        fontWeight: 700,
                        margin: "4px 0",
                      }}
                    >
                      {stat.value}
                    </h4>
                    <small
                      style={{
                        color: "rgba(255,255,255,0.4)",
                        fontSize: "12px",
                      }}
                    >
                      {stat.subValue}
                    </small>
                  </div>
                  <div style={{ color: stat.color, opacity: 0.8 }}>
                    {stat.icon}
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>

      {/* Live Prices */}
      <Card style={{ ...glassCardStyle, marginBottom: "24px" }}>
        <Card.Body>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h6
              style={{
                color: "white",
                fontFamily: "'Exo 2', sans-serif",
                fontWeight: 600,
                margin: 0,
              }}
            >
              Market Prices
            </h6>
            <small style={{ color: "rgba(255,255,255,0.4)", fontSize: "11px" }}>
              {solUpdate && `Updated ${solUpdate.toLocaleTimeString()}`}
            </small>
          </div>
          <Row className="text-center">
            {[
              {
                symbol: "SOL",
                price: solPrice,
                loading: solLoading,
                color: "#10b981",
              },
              {
                symbol: "BTC",
                price: btcPrice,
                loading: btcLoading,
                color: "#f7931a",
              },
              {
                symbol: "ETH",
                price: ethPrice,
                loading: ethLoading,
                color: "#627eea",
              },
            ].map((item, idx) => (
              <Col key={idx} className="py-2">
                <div
                  style={{
                    color: "rgba(255,255,255,0.5)",
                    fontSize: "12px",
                    marginBottom: "4px",
                  }}
                >
                  {item.symbol}
                </div>
                <div
                  style={{
                    color: item.color,
                    fontSize: "18px",
                    fontWeight: 600,
                    fontFamily: "'Exo 2', sans-serif",
                  }}
                >
                  {item.loading
                    ? "..."
                    : `$${formatPrice(
                        item.price,
                        item.symbol === "SOL" ? 2 : 0
                      )}`}
                </div>
              </Col>
            ))}
          </Row>
          {/* CoinGecko Market Overview */}
          <div
            style={{
              marginTop: "16px",
              paddingTop: "16px",
              borderTop: "1px solid rgba(255,255,255,0.1)",
            }}
          >
            <div className="d-flex justify-content-between align-items-center mb-3">
              <span
                style={{
                  color: "rgba(255,255,255,0.6)",
                  fontSize: "11px",
                  textTransform: "uppercase",
                  letterSpacing: "1px",
                }}
              >
                Market Overview
              </span>
              <small
                style={{ color: "rgba(255,255,255,0.4)", fontSize: "10px" }}
              >
                {cgUpdate && `Updated ${cgUpdate.toLocaleTimeString()}`}
              </small>
            </div>
            {cgLoading ? (
              <div className="text-center py-2">
                <small style={{ color: "rgba(255,255,255,0.4)" }}>
                  Loading market data...
                </small>
              </div>
            ) : (
              <Row className="g-2">
                {cgPrices
                  .filter((p) =>
                    ["solana", "bitcoin", "ethereum", "usd-coin"].includes(p.id)
                  )
                  .map((coin) => (
                    <Col key={coin.id} xs={6} md={3} className="mb-2">
                      <div
                        style={{
                          background: "rgba(255,255,255,0.03)",
                          borderRadius: "8px",
                          padding: "10px",
                        }}
                      >
                        <div
                          style={{
                            color: "rgba(255,255,255,0.5)",
                            fontSize: "11px",
                            fontWeight: 600,
                          }}
                        >
                          {coin.symbol.toUpperCase()}
                        </div>
                        <div
                          style={{
                            color: "white",
                            fontSize: "14px",
                            fontWeight: 600,
                            fontFamily: "'Exo 2', sans-serif",
                          }}
                        >
                          ${coin.usd ? formatCryptoPrice(coin.usd) : "--"}
                        </div>
                      </div>
                    </Col>
                  ))}
              </Row>
            )}
          </div>
        </Card.Body>
      </Card>

      {/* Portfolio Tabs */}
      <Card style={{ ...glassCardStyle, marginBottom: "24px" }}>
        <Card.Body style={{ padding: 0 }}>
          {/* Tabs */}
          <div
            className="d-flex border-bottom"
            style={{ borderColor: "rgba(255,255,255,0.1) !important" }}
          >
            {(["tokens", "nfts", "collectibles"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  flex: 1,
                  padding: "14px",
                  background:
                    activeTab === tab
                      ? "rgba(16, 185, 129, 0.1)"
                      : "transparent",
                  border: "none",
                  borderBottom:
                    activeTab === tab
                      ? "2px solid #10b981"
                      : "2px solid transparent",
                  color:
                    activeTab === tab ? "#10b981" : "rgba(255,255,255,0.5)",
                  fontFamily: "'Exo 2', sans-serif",
                  fontWeight: 600,
                  fontSize: "14px",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  textTransform: "capitalize",
                }}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div style={{ padding: "16px" }}>
            {activeTab === "tokens" && (
              <div className="text-center py-4">
                {connected ? (
                  <div>
                    {sampleTokens.map((token, idx) => (
                      <div
                        key={idx}
                        className="d-flex justify-content-between align-items-center py-3"
                        style={{
                          borderBottom:
                            idx < sampleTokens.length - 1
                              ? "1px solid rgba(255,255,255,0.1)"
                              : "none",
                        }}
                      >
                        <div className="d-flex align-items-center gap-3">
                          <div
                            style={{
                              width: "40px",
                              height: "40px",
                              borderRadius: "50%",
                              background: token.color,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              color: "white",
                              fontWeight: 700,
                              fontSize: "16px",
                            }}
                          >
                            {token.icon}
                          </div>
                          <div>
                            <div style={{ color: "white", fontWeight: 600 }}>
                              {token.symbol}
                            </div>
                            <div
                              style={{
                                color: "rgba(255,255,255,0.5)",
                                fontSize: "12px",
                              }}
                            >
                              {token.name}
                            </div>
                          </div>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <div style={{ color: "white", fontWeight: 600 }}>
                            ${token.value.toFixed(2)}
                          </div>
                          <div
                            style={{
                              color: "rgba(255,255,255,0.5)",
                              fontSize: "12px",
                            }}
                          >
                            {token.amount} {token.symbol}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div>
                    <FiCreditCard
                      size={40}
                      color="rgba(255,255,255,0.3)"
                      style={{ marginBottom: "12px" }}
                    />
                    <p
                      style={{
                        color: "rgba(255,255,255,0.5)",
                        marginBottom: "16px",
                      }}
                    >
                      Connect wallet to see tokens
                    </p>
                  </div>
                )}
              </div>
            )}
            {activeTab === "nfts" && (
              <div className="text-center py-5">
                <p style={{ color: "rgba(255,255,255,0.5)" }}>No NFTs found</p>
              </div>
            )}
            {activeTab === "collectibles" && (
              <div className="text-center py-5">
                <p style={{ color: "rgba(255,255,255,0.5)" }}>
                  No collectibles found
                </p>
              </div>
            )}
          </div>
        </Card.Body>
      </Card>

      {/* Quick Actions */}
      <Row xs={1} md={2} className="g-3">
        <Col>
          <Card
            style={{ ...glassCardStyle, cursor: "pointer" }}
            className="h-100"
          >
            <Card.Body
              className="d-flex align-items-center gap-3"
              style={{ padding: "20px" }}
            >
              <div
                style={{
                  width: "48px",
                  height: "48px",
                  borderRadius: "12px",
                  background:
                    "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <FiDollarSign size={24} color="white" />
              </div>
              <div style={{ flex: 1 }}>
                <h6
                  style={{
                    color: "white",
                    fontFamily: "'Exo 2', sans-serif",
                    fontWeight: 600,
                    margin: 0,
                  }}
                >
                  Create Loan
                </h6>
                <small style={{ color: "rgba(255,255,255,0.5)" }}>
                  Borrow USDC against your SOL
                </small>
              </div>
              <FiArrowRight size={20} color="#10b981" />
            </Card.Body>
          </Card>
        </Col>
        <Col>
          <Card
            style={{ ...glassCardStyle, cursor: "pointer" }}
            className="h-100"
          >
            <Card.Body
              className="d-flex align-items-center gap-3"
              style={{ padding: "20px" }}
            >
              <div
                style={{
                  width: "48px",
                  height: "48px",
                  borderRadius: "12px",
                  background:
                    "linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <FiShield size={24} color="white" />
              </div>
              <div style={{ flex: 1 }}>
                <h6
                  style={{
                    color: "white",
                    fontFamily: "'Exo 2', sans-serif",
                    fontWeight: 600,
                    margin: 0,
                  }}
                >
                  Dual Protection
                </h6>
                <small style={{ color: "rgba(255,255,255,0.5)" }}>
                  72h grace + instant liquidation
                </small>
              </div>
              <FiArrowRight size={20} color="#8b5cf6" />
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Footer */}
      <div className="text-center mt-4">
        <span style={{ color: "rgba(255,255,255,0.3)", fontSize: "12px" }}>
          GINVA v2.0.0 • Protected Lending
        </span>
      </div>
    </Container>
  );
};

export default Dashboard;
