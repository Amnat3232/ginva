import { Card, Container, Row, Col, Badge, Button } from "react-bootstrap";
import {
  FiDollarSign,
  FiTrendingUp,
  FiShield,
  FiArrowRight,
  FiCreditCard,
} from "react-icons/fi";
import { useState, useCallback } from "react";
import { useDashboard } from "../hooks/page";
import { useSyncedUser } from "../hooks/useWalletSync";
import { Loading } from "../components/ui/Loading";
import { Notification } from "../components/ui/Notification";
import { ErrorBoundary } from "../components/ui/ErrorBoundary";
import { GlassCard } from "../components/ui/GlassCard";

const Dashboard = () => {
  const { user } = useSyncedUser();
  const {
    tvl,
    activeLoans,
    userActiveLoans,
    userCollateral,
    userStaked,
    userRewards,
    solPrice,
    btcPrice,
    ethPrice,
    priceChange24h,
    isLoading,
    refetch,
  } = useDashboard();

  const [activeTab, setActiveTab] = useState<
    "tokens" | "nfts" | "collectibles"
  >("tokens");

  const handleRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  // Loading state
  if (isLoading && !tvl) {
    return (
      <Container fluid className="px-3 py-4" style={{ minHeight: "100vh" }}>
        <Loading text="Loading portfolio..." />
      </Container>
    );
  }

  const statCards = [
    {
      label: "Health Factor",
      value: userActiveLoans > 0 ? "1.45" : "—",
      subValue: userActiveLoans > 0 ? "Healthy" : "No active loans",
      icon: <FiShield size={24} />,
      color: userActiveLoans > 0 ? "#10b981" : "rgba(255,255,255,0.3)",
    },
    {
      label: "Total Value Locked",
      value: `$${tvl.toFixed(2)}`,
      subValue: "0 USDC",
      icon: <FiDollarSign size={24} />,
      color: "#10b981",
    },
    {
      label: "Active Loans",
      value: userActiveLoans.toString(),
      subValue:
        userActiveLoans > 0 ? `${userActiveLoans} Active` : "No Active Loans",
      icon: <FiTrendingUp size={24} />,
      color: "#3b82f6",
    },
    {
      label: "Your Collateral",
      value: userCollateral > 0 ? `◎ ${userCollateral.toFixed(4)}` : "0 SOL",
      subValue: user ? "Deposited" : "Connect to view",
      icon: <FiCreditCard size={24} />,
      color: "#8b5cf6",
    },
    {
      label: "Protection",
      value: "Dual Layer",
      subValue: "72h + Immediate",
      icon: <FiShield size={24} />,
      color: "#00e676",
    },
  ];

  return (
    <ErrorBoundary>
      <Notification />
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
            {user?.publicKey ? (
              <span>
                {user.publicKey.slice(0, 8)}...{user.publicKey.slice(-8)}
              </span>
            ) : (
              "Connect your wallet to view portfolio"
            )}
          </p>
        </div>

        {/* Portfolio Value Card */}
        <GlassCard style={{ marginBottom: "24px", padding: "20px" }}>
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
        </GlassCard>

        {/* Stats Grid */}
        <Row xs={2} lg={4} className="g-3 mb-4">
          {statCards.map((stat, idx) => (
            <Col key={idx}>
              <GlassCard style={{ height: "100%" }}>
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
              </GlassCard>
            </Col>
          ))}
        </Row>

        {/* Footer */}
        <div className="text-center mt-4">
          <span style={{ color: "rgba(255,255,255,0.3)", fontSize: "12px" }}>
            GINVA v2.0.0 • Protected Lending •
            <button
              onClick={handleRefresh}
              style={{
                background: "none",
                border: "none",
                color: "rgba(255,255,255,0.3)",
                cursor: "pointer",
                marginLeft: "8px",
              }}
            >
              Refresh
            </button>
          </span>
        </div>
      </Container>
    </ErrorBoundary>
  );
};

export default Dashboard;
