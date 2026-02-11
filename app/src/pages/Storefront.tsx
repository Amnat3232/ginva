import {
  Container,
  Card,
  Button,
  Row,
  Col,
  Badge,
  Form,
  ProgressBar,
  Alert,
  Spinner,
} from "react-bootstrap";
import {
  FiShoppingBag,
  FiTag,
  FiClock,
  FiActivity,
  FiZap,
  FiShield,
  FiCheckCircle,
  FiAlertTriangle,
  FiLock,
  FiRefreshCw,
  FiExternalLink,
} from "react-icons/fi";
import { useState, useEffect } from "react";

// Types for our Pawn Shop
interface PawnItem {
  id: string;
  ticketId: number;
  assetType: string;
  assetName: string;
  collateralAmount: string;
  marketValueUSD: number;
  forfeitedAt: Date; // Timestamp when it dropped
  image: string;
  securityVerified: boolean; // Security check passed
  flashLoanProtected: boolean; // Flash loan protection active
  lastSecurityCheck: Date; // Last security validation
}

interface SecurityStatus {
  reentrancyGuard: boolean;
  flashLoanProtection: boolean;
  mevProtection: boolean;
  auditStatus: "passed" | "pending" | "failed";
  lastSecurityUpdate: Date;
  blockHeight: number;
  protocolPaused: boolean;
}

const Storefront = () => {
  const [filter, setFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("newest");
  const [now, setNow] = useState<Date>(new Date());
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [selectedAsset, setSelectedAsset] = useState<PawnItem | null>(null);
  const [showSecurityModal, setShowSecurityModal] = useState<boolean>(false);

  // Mock security status from backend
  const securityStatus: SecurityStatus = {
    reentrancyGuard: true,
    flashLoanProtection: true,
    mevProtection: true,
    auditStatus: "passed",
    lastSecurityUpdate: new Date(),
    blockHeight: 12345,
    protocolPaused: false,
  };

  // Real-time ticker effect
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Mock data - จำลองว่าเพิ่ง Drop เมื่อไม่กี่นาที่ที่ผ่านมา
  const pawnItems: PawnItem[] = [
    {
      id: "drop-001",
      ticketId: 1042,
      assetType: "SOL",
      assetName: "Solana",
      collateralAmount: "25.5 SOL",
      marketValueUSD: 5100.0,
      forfeitedAt: new Date(Date.now() - 1000 * 60 * 5), // 5 mins ago (Golden Hour!)
      image: "🔷",
      securityVerified: true,
      flashLoanProtected: true,
      lastSecurityCheck: new Date(),
    },
    {
      id: "drop-002",
      ticketId: 1038,
      assetType: "USDC",
      assetName: "USD Coin",
      collateralAmount: "1,000 USDC",
      marketValueUSD: 1000.0,
      forfeitedAt: new Date(Date.now() - 1000 * 60 * 15), // 15 mins ago (Silver Tier)
      image: "💵",
      securityVerified: true,
      flashLoanProtected: true,
      lastSecurityCheck: new Date(),
    },
    {
      id: "drop-003",
      ticketId: 995,
      assetType: "BONK",
      assetName: "Bonk",
      collateralAmount: "5M BONK",
      marketValueUSD: 850.0,
      forfeitedAt: new Date(Date.now() - 1000 * 60 * 45), // 45 mins ago (Bronze Tier)
      image: "🐕",
      securityVerified: true,
      flashLoanProtected: true,
      lastSecurityCheck: new Date(),
    },
    {
      id: "drop-004",
      ticketId: 1102,
      assetType: "SOL",
      assetName: "Solana",
      collateralAmount: "100 SOL",
      marketValueUSD: 20000.0,
      forfeitedAt: new Date(Date.now() - 1000 * 60 * 2), // 2 mins ago (FRESH DROP!)
      image: "🔥",
      securityVerified: true,
      flashLoanProtected: true,
      lastSecurityCheck: new Date(),
    },
  ];

  // 📉 The Greed Engine: Calculate dynamic price based on time elapsed
  const calculatePricing = (forfeitedAt: Date) => {
    const elapsedSeconds = (now.getTime() - forfeitedAt.getTime()) / 1000;

    let discountPercent = 0;
    let tierName = "Market Price";
    let tierColor = "secondary";
    let nextTierTime = 0;

    if (elapsedSeconds <= 600) {
      // 0-10 mins
      discountPercent = 8;
      tierName = "Golden Hour";
      tierColor = "warning"; // Gold/Yellow
      nextTierTime = 600 - elapsedSeconds;
    } else if (elapsedSeconds <= 1800) {
      // 10-30 mins
      discountPercent = 6;
      tierName = "Silver Tier";
      tierColor = "secondary"; // Silver/Grey
      nextTierTime = 1800 - elapsedSeconds;
    } else if (elapsedSeconds <= 3600) {
      // 30-60 mins
      discountPercent = 3;
      tierName = "Bronze Tier";
      tierColor = "danger"; // Bronze/Reddish
      nextTierTime = 3600 - elapsedSeconds;
    } else {
      discountPercent = 0;
      tierName = "Expired";
      tierColor = "dark";
    }

    return {
      elapsedSeconds,
      discountPercent,
      tierName,
      tierColor,
      nextTierTime,
    };
  };

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(val);

  const formatTime = (seconds: number) => {
    if (seconds <= 0) return "00:00";
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  // Security validation functions
  const handleSecurityCheck = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setShowSecurityModal(true);
    }, 2000);
  };

  const handlePurchase = (item: PawnItem) => {
    if (!item.securityVerified || !item.flashLoanProtected) {
      alert("⚠️ Security check failed. This asset cannot be purchased yet.");
      return;
    }

    setSelectedAsset(item);
    setIsLoading(true);
    // Simulate blockchain transaction
    setTimeout(() => {
      setIsLoading(false);
      setSelectedAsset(null);
      alert("✅ Purchase successful! Asset secured to your wallet.");
    }, 3000);
  };

  // Filter & Sort Logic
  const filteredItems = pawnItems.filter((item) => {
    if (filter === "all") return true;
    return item.assetType.toLowerCase() === filter.toLowerCase();
  });

  const sortedItems = [...filteredItems].sort((a, b) => {
    const pricingA = calculatePricing(a.forfeitedAt);
    const pricingB = calculatePricing(b.forfeitedAt);

    switch (sortBy) {
      case "discount":
        return pricingB.discountPercent - pricingA.discountPercent;
      case "price-high":
        return b.marketValueUSD - a.marketValueUSD;
      case "newest":
      default:
        return b.forfeitedAt.getTime() - a.forfeitedAt.getTime();
    }
  });

  return (
    <Container className="py-4">
      {/* 🛡️ Security Status Bar */}
      <Alert
        variant={
          securityStatus.auditStatus === "passed" ? "success" : "warning"
        }
        className="mb-4 d-flex align-items-center justify-content-between"
      >
        <div className="d-flex align-items-center gap-2">
          <FiShield
            className={
              securityStatus.auditStatus === "passed"
                ? "text-success"
                : "text-warning"
            }
          />
          <div>
            <strong>
              GINVA Protocol{" "}
              {securityStatus.auditStatus === "passed"
                ? "Secured"
                : "Under Review"}
            </strong>
            <div className="small">
              Block #{securityStatus.blockHeight} • Last Check:{" "}
              {securityStatus.lastSecurityUpdate.toLocaleTimeString()}
            </div>
          </div>
        </div>
        <div className="d-flex gap-2">
          <Badge bg="info" className="fs-6">
            🔒 Reentrancy Guard
          </Badge>
          <Badge bg="info" className="fs-6">
            ⚡ Flash Loan Protection
          </Badge>
          <Badge bg="info" className="fs-6">
            🛡️ MEV Resistance
          </Badge>
          <Button
            variant="outline-info"
            size="sm"
            onClick={handleSecurityCheck}
          >
            <FiRefreshCw /> Check Status
          </Button>
        </div>
      </Alert>

      {/* Hero Section */}
      <div className="mb-5 text-center">
        <h1 className="display-4 fw-bold">GINVA Pawn Shop</h1>
        <p className="lead text-muted">
          The On-Chain Distressed Asset Exchange.{" "}
          <span className="text-danger fw-bold">Seize the Edge.</span>
        </p>
        <div className="d-flex justify-content-center gap-3 mt-3">
          <Badge bg="warning" text="dark" className="px-3 py-2 fs-6">
            ⚡ 0-10m: 8% Edge
          </Badge>
          <Badge bg="secondary" text="dark" className="px-3 py-2 fs-6">
            🥈 10-30m: 6% Edge
          </Badge>
          <Badge bg="danger" text="dark" className="px-3 py-2 fs-6">
            🥉 30-60m: 3% Edge
          </Badge>
        </div>
      </div>

      {/* Stats Bar */}
      <Row className="mb-4 g-3">
        <Col md={4}>
          <Card className="border-0 shadow-sm bg-primary text-white h-100">
            <Card.Body className="d-flex align-items-center justify-content-between">
              <div>
                <h6 className="mb-1 opacity-75">Active Drops</h6>
                <h2 className="mb-0 fw-bold">{pawnItems.length} Lots</h2>
              </div>
              <FiActivity size={32} className="opacity-50" />
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="border-0 shadow-sm h-100">
            <Card.Body className="d-flex align-items-center justify-content-between">
              <div>
                <h6 className="mb-1 text-muted">Total Value Locked</h6>
                <h2 className="mb-0 text-primary">$28,950</h2>
              </div>
              <FiTag size={32} className="text-primary opacity-50" />
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="border-0 shadow-sm h-100">
            <Card.Body className="d-flex align-items-center justify-content-between">
              <div>
                <h6 className="mb-1 text-muted">Next Drop In</h6>
                <h2 className="mb-0 text-danger">~12m 30s</h2>
              </div>
              <FiClock size={32} className="text-danger opacity-50" />
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Controls */}
      <Row className="mb-4 align-items-center">
        <Col md={6}>
          <h4 className="mb-0 fw-bold">🔥 Live Pawn Drops</h4>
        </Col>
        <Col md={6}>
          <div className="d-flex gap-2 justify-content-end">
            <Form.Select
              style={{ width: "auto" }}
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            >
              <option value="all">All Assets</option>
              <option value="SOL">SOL Only</option>
              <option value="USDC">USDC Only</option>
            </Form.Select>
            <Form.Select
              style={{ width: "auto" }}
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="newest">Newest Drops</option>
              <option value="discount">Highest Edge</option>
              <option value="price-high">Highest Value</option>
            </Form.Select>
          </div>
        </Col>
      </Row>

      {/* Grid */}
      <Row xs={1} md={2} lg={3} className="g-4">
        {sortedItems.map((item) => {
          const { discountPercent, tierName, tierColor, nextTierTime } =
            calculatePricing(item.forfeitedAt);
          const discountPrice =
            item.marketValueUSD * (1 - discountPercent / 100);
          const profit = item.marketValueUSD - discountPrice;

          // Calculate progress for the current tier (visual flair)
          let progressValue = 100;
          let maxTime = 600;
          if (discountPercent === 8) {
            maxTime = 600;
            progressValue = (nextTierTime / maxTime) * 100;
          } else if (discountPercent === 6) {
            maxTime = 1200;
            progressValue = (nextTierTime / maxTime) * 100;
          } else if (discountPercent === 3) {
            maxTime = 1800;
            progressValue = (nextTierTime / maxTime) * 100;
          } else {
            progressValue = 0;
          }

          return (
            <Col key={item.id}>
              <Card className="h-100 shadow-sm border-0 position-relative overflow-hidden hover-card">
                {/* Security Status */}
                <div className="position-absolute top-0 start-0 m-3 d-flex gap-1">
                  {item.securityVerified && (
                    <Badge
                      bg="success"
                      className="fs-6 shadow-sm"
                      title="Security Verified"
                    >
                      <FiCheckCircle /> ✓
                    </Badge>
                  )}
                  {item.flashLoanProtected && (
                    <Badge
                      bg="info"
                      className="fs-6 shadow-sm"
                      title="Flash Loan Protected"
                    >
                      <FiLock /> 🛡️
                    </Badge>
                  )}
                </div>

                {/* Status Badge */}
                <div className="position-absolute top-0 end-0 m-3">
                  <Badge bg={tierColor} className="fs-6 shadow-sm">
                    {tierName} (-{discountPercent}%)
                  </Badge>
                </div>

                <Card.Body className="pt-4">
                  <div className="text-center mb-3">
                    <div style={{ fontSize: "3.5rem" }} className="mb-2">
                      {item.image}
                    </div>
                    <h5 className="fw-bold mb-0">{item.assetName}</h5>
                    <small className="text-muted">
                      Ticket #{item.ticketId}
                    </small>
                  </div>

                  <div className="bg-light p-3 rounded mb-3">
                    <div className="d-flex justify-content-between mb-2">
                      <span className="text-muted small">Collateral</span>
                      <span className="fw-bold">{item.collateralAmount}</span>
                    </div>
                    <div className="d-flex justify-content-between align-items-center">
                      <span className="text-muted small">Market Value</span>
                      <span className="text-decoration-line-through">
                        {formatCurrency(item.marketValueUSD)}
                      </span>
                    </div>
                  </div>

                  <div className="text-center mb-3">
                    <div className="text-success small fw-bold text-uppercase mb-1">
                      Your Price
                    </div>
                    <h2 className="fw-bold text-success mb-0">
                      {formatCurrency(discountPrice)}
                    </h2>
                    {profit > 0 && (
                      <Badge
                        bg="success"
                        className="bg-opacity-10 text-success border border-success mt-2"
                      >
                        Potential Profit: +{formatCurrency(profit)}
                      </Badge>
                    )}
                  </div>

                  {/* Time Decay Visual */}
                  {discountPercent > 0 ? (
                    <div className="mb-3">
                      <div className="d-flex justify-content-between small mb-1">
                        <span className="text-danger fw-bold">
                          <FiZap /> Price Increasing in:
                        </span>
                        <span className="text-danger fw-bold font-monospace">
                          {formatTime(nextTierTime)}
                        </span>
                      </div>
                      <ProgressBar
                        variant={tierColor}
                        now={progressValue}
                        style={{ height: "6px" }}
                        animated={discountPercent === 8}
                      />
                    </div>
                  ) : (
                    <Alert
                      variant="secondary"
                      className="py-2 small text-center mb-3"
                    >
                      Listing expired. Moving to DEX...
                    </Alert>
                  )}

                  <Button
                    variant={discountPercent > 0 ? "primary" : "secondary"}
                    size="lg"
                    className="w-100 fw-bold"
                    disabled={discountPercent === 0 || isLoading}
                    onClick={() => handlePurchase(item)}
                  >
                    {isLoading && selectedAsset?.id === item.id ? (
                      <>
                        <Spinner as="span" animation="border" size="sm" />{" "}
                        Processing...
                      </>
                    ) : discountPercent > 0 ? (
                      "⚡ SEIZE ASSET"
                    ) : (
                      "View on DEX"
                    )}
                  </Button>
                </Card.Body>
              </Card>
            </Col>
          );
        })}
      </Row>

      {/* Security Modal */}
      <div
        className={`modal fade ${showSecurityModal ? "show d-block" : ""}`}
        style={{
          display: showSecurityModal ? "block" : "none",
          backgroundColor: "rgba(0,0,0,0.5)",
        }}
      >
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">
                <FiShield className="text-success me-2" />
                Security Status
              </h5>
              <button
                type="button"
                className="btn-close"
                onClick={() => setShowSecurityModal(false)}
              ></button>
            </div>
            <div className="modal-body">
              <div className="row g-3">
                <div className="col-md-6">
                  <h6>🔒 Reentrancy Guard</h6>
                  <Badge bg="success">ACTIVE</Badge>
                  <p className="small text-muted">Prevents recursive calls</p>
                </div>
                <div className="col-md-6">
                  <h6>⚡ Flash Loan Protection</h6>
                  <Badge bg="success">ACTIVE</Badge>
                  <p className="small text-muted">100 blocks minimum hold</p>
                </div>
                <div className="col-md-6">
                  <h6>🛡️ MEV Resistance</h6>
                  <Badge bg="success">ACTIVE</Badge>
                  <p className="small text-muted">
                    Protected against front-running
                  </p>
                </div>
                <div className="col-md-6">
                  <h6>📋 Audit Status</h6>
                  <Badge bg="success">PASSED</Badge>
                  <p className="small text-muted">
                    All critical vulnerabilities fixed
                  </p>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <Button
                variant="secondary"
                onClick={() => setShowSecurityModal(false)}
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Container>
  );
};

export default Storefront;
