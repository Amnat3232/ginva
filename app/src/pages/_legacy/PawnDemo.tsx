import { useState, useEffect, useCallback } from "react";
import {
  Container,
  Card,
  Button,
  Stack,
  Form,
  Row,
  Col,
  Alert,
  Badge,
  ProgressBar,
} from "react-bootstrap";
import { FiTrendingUp, FiClock, FiShield, FiAlertTriangle, FiCheck, FiX, FiRefreshCw } from "react-icons/fi";
import { useWallet } from "@solana/wallet-adapter-react";
import { useDemoMode, DemoLoan } from "../hooks/useDemoMode";
import { showSuccess, showError } from "../utils/helpers";
import { GlassCard } from "../components/ui/GlassCard";
import { DemoBanner } from "../components/DemoMode";

const LTV_OPTIONS = [
  { value: 1, label: "Safe (20%)", description: "Low risk, lower borrowing power", ltv: 0.2 },
  { value: 2, label: "Standard (40%)", description: "Balanced risk and borrowing power", ltv: 0.4 },
  { value: 3, label: "Max (60%)", description: "Higher risk, maximum borrowing power", ltv: 0.6 },
];

const DURATION_OPTIONS = [
  { value: 30, label: "30 Days", interest: 0.03 },
  { value: 60, label: "60 Days", interest: 0.05 },
  { value: 90, label: "90 Days", interest: 0.07 },
];

const COLLATERAL_PRICES: Record<string, number> = {
  SOL: 175,
  USDC: 1,
};

const PawnDemo = () => {
  const { publicKey, connected } = useWallet();
  const {
    userState,
    isLoading,
    lastTx,
    error,
    depositCollateral,
    borrow,
    repay,
    extendLoan,
    liquidate,
    reset,
    clearError,
    clearTx,
    getActiveLoans,
    getLiquidatableLoans,
    getTotalHealth,
    skipDays,
    simulatedDays,
    resetSimulation,
  } = useDemoMode();

  // Demo mode works even without wallet connection
  const isDemoReady = connected || true; // Always allow demo mode

  const [selectedAsset, setSelectedAsset] = useState("SOL");
  const [collateralAmount, setCollateralAmount] = useState("");
  const [ltvOption, setLtvOption] = useState(2);
  const [durationDays, setDurationDays] = useState(60);

  const collateralPrice = COLLATERAL_PRICES[selectedAsset] || 175;
  const collateralValueUSD = parseFloat(collateralAmount || "0") * collateralPrice;
  const selectedLtv = LTV_OPTIONS.find((l) => l.value === ltvOption)?.ltv || 0.4;
  const borrowAmountUSD = collateralValueUSD * selectedLtv;
  const selectedDuration = DURATION_OPTIONS.find((d) => d.value === durationDays);
  const interestAmount = borrowAmountUSD * (selectedDuration?.interest || 0.05);

  const activeLoans = getActiveLoans();
  const liquidatableLoans = getLiquidatableLoans();
  const health = getTotalHealth();

  const handleDeposit = async () => {
    if (!collateralAmount || parseFloat(collateralAmount) <= 0) {
      showError("Invalid Amount", "Please enter a valid collateral amount");
      return;
    }
    if (parseFloat(collateralAmount) > userState.collateralBalance) {
      showError("Insufficient Balance", `You only have ${userState.collateralBalance.toFixed(4)} ${selectedAsset}`);
      return;
    }

    const tx = await depositCollateral(parseFloat(collateralAmount), selectedAsset);
    if (tx) {
      showSuccess("Collateral Deposited!", `Transaction: ${tx.slice(0, 20)}...`);
      setCollateralAmount("");
    } else if (error) {
      showError("Deposit Failed", error);
      clearError();
    }
  };

  const handleBorrow = async () => {
    if (!collateralAmount || parseFloat(collateralAmount) <= 0) {
      showError("Invalid Amount", "Please enter a valid collateral amount");
      return;
    }

    const tx = await borrow(parseFloat(collateralAmount), ltvOption, selectedAsset);
    if (tx) {
      showSuccess("Loan Created!", `Borrowed $${borrowAmountUSD.toFixed(2)} USDC`);
      setCollateralAmount("");
    } else if (error) {
      showError("Borrow Failed", error);
      clearError();
    }
  };

  const handleRepay = async (loanId: string) => {
    const tx = await repay(loanId);
    if (tx) {
      showSuccess("Loan Repaid!", "Your collateral has been returned");
    } else if (error) {
      showError("Repay Failed", error);
      clearError();
    }
  };

  const handleExtend = async (loanId: string) => {
    const tx = await extendLoan(loanId);
    if (tx) {
      showSuccess("Loan Extended!", "15 days added to your loan");
    } else if (error) {
      showError("Extend Failed", error);
      clearError();
    }
  };

  const handleLiquidate = async (loanId: string) => {
    const tx = await liquidate(loanId);
    if (tx) {
      showSuccess("Liquidation Complete!", "Collateral purchased at 10% discount");
    } else if (error) {
      showError("Liquidation Failed", error);
      clearError();
    }
  };

  const formatTime = (timestamp: number) => {
    const now = Math.floor(Date.now() / 1000);
    const remaining = timestamp - now;
    if (remaining <= 0) return "EXPIRED";
    const days = Math.floor(remaining / (24 * 60 * 60));
    const hours = Math.floor((remaining % (24 * 60 * 60)) / (60 * 60));
    return `${days}d ${hours}h`;
  };

  const getHealthColor = (h: number) => {
    if (h > 50) return "success";
    if (h > 25) return "warning";
    return "danger";
  };

  return (
    <Container className="py-4">
      <DemoBanner />
      
      {/* Time Simulation Controls */}
      <Card className="mb-4" style={{ background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)", border: "1px solid #4a5568" }}>
        <Card.Body className="d-flex flex-wrap align-items-center justify-content-between gap-3">
          <div className="d-flex align-items-center gap-2">
            <FiClock className="text-warning" size={20} />
            <span className="fw-bold text-light">Time Simulator:</span>
            <Badge bg={simulatedDays > 20 ? "danger" : simulatedDays > 10 ? "warning" : "success"}>
              Day {simulatedDays} passed
            </Badge>
          </div>
          <div className="d-flex gap-2">
            <Button variant="outline-warning" size="sm" onClick={() => skipDays(1)}>
              +1 Day
            </Button>
            <Button variant="outline-warning" size="sm" onClick={() => skipDays(7)}>
              +7 Days
            </Button>
            <Button variant="outline-warning" size="sm" onClick={() => skipDays(15)}>
              +15 Days
            </Button>
<Button variant="outline-secondary" size="sm" onClick={() => { skipDays(30); }}>
                +30 Days <FiAlertTriangle />
              </Button>
            {simulatedDays > 0 && (
              <Button variant="outline-danger" size="sm" onClick={resetSimulation}>
                Reset Time
              </Button>
            )}
          </div>
        </Card.Body>
      </Card>
      
      {isLoading && (
        <Alert variant="info" className="d-flex align-items-center">
          <FiRefreshCw className="spin me-2" />
          Processing transaction...
        </Alert>
      )}

      {lastTx && (
        <Alert variant="success" className="d-flex align-items-center">
          <FiCheck className="me-2" />
          Transaction completed: {lastTx.slice(0, 30)}...
        </Alert>
      )}

      <Stack direction="vertical" gap={3} className="mb-4">
        <h1>Borrow USDC (Demo)</h1>
        <p className="text-muted">
          Use your crypto as collateral to get instant USDC. Try the full flow without real funds.
        </p>
      </Stack>

      <Row xs={1} lg={2} gap={4}>
        <Col>
          <Card className="mb-4">
            <Card.Header>
              <h4 className="mb-0">Create Loan</h4>
            </Card.Header>
            <Card.Body>
              <Stack gap={4}>
                <div>
                  <Form.Label className="fw-bold">Your Balance</Form.Label>
                  <div className="d-flex gap-3">
                    <Badge bg="primary" className="p-2">
                      {userState.collateralBalance.toFixed(4)} SOL
                    </Badge>
                    <Badge bg="success" className="p-2">
                      ${userState.loanBalance.toFixed(2)} USDC
                    </Badge>
                  </div>
                </div>

                <div>
                  <Form.Label className="fw-bold">Collateral Amount (SOL)</Form.Label>
                  <Form.Control
                    type="number"
                    placeholder="Enter amount"
                    value={collateralAmount}
                    onChange={(e) => setCollateralAmount(e.target.value)}
                  />
                  <Form.Text className="text-muted">
                    Available: {userState.collateralBalance.toFixed(4)} SOL
                  </Form.Text>
                </div>

                <div>
                  <Form.Label className="fw-bold">LTV Option</Form.Label>
                  <Row xs={3} gap={2}>
                    {LTV_OPTIONS.map((opt) => (
                      <Col key={opt.value}>
                        <Card
                          className={`text-center p-2 cursor-pointer ${
                            ltvOption === opt.value ? "border-primary bg-primary-subtle" : ""
                          }`}
                          onClick={() => setLtvOption(opt.value)}
                          style={{ cursor: "pointer" }}
                        >
                          <div className="fw-bold">{opt.label}</div>
                          <small className="text-muted">{opt.description}</small>
                        </Card>
                      </Col>
                    ))}
                  </Row>
                </div>

                <div>
                  <Form.Label className="fw-bold">Duration</Form.Label>
                  <Row xs={3} gap={2}>
                    {DURATION_OPTIONS.map((opt) => (
                      <Col key={opt.value}>
                        <Card
                          className={`text-center p-2 cursor-pointer ${
                            durationDays === opt.value ? "border-primary bg-primary-subtle" : ""
                          }`}
                          onClick={() => setDurationDays(opt.value)}
                          style={{ cursor: "pointer" }}
                        >
                          <div className="fw-bold">{opt.label}</div>
                          <small className="text-muted">{(opt.interest * 100).toFixed(0)}% interest</small>
                        </Card>
                      </Col>
                    ))}
                  </Row>
                </div>

                {collateralAmount && parseFloat(collateralAmount) > 0 && (
                  <Alert variant="secondary">
                    <Row>
                      <Col>
                        <small>Collateral Value</small>
                        <div className="fw-bold">${collateralValueUSD.toFixed(2)}</div>
                      </Col>
                      <Col>
                        <small>Borrow Amount</small>
                        <div className="fw-bold text-success">${borrowAmountUSD.toFixed(2)} USDC</div>
                      </Col>
                      <Col>
                        <small>Interest</small>
                        <div className="fw-bold text-warning">${interestAmount.toFixed(2)}</div>
                      </Col>
                    </Row>
                  </Alert>
                )}

                <Stack direction="horizontal" gap={2}>
                  <Button
                    variant="outline-primary"
                    onClick={handleDeposit}
                    disabled={isLoading || !isDemoReady || !collateralAmount}
                  >
                    Deposit Collateral
                  </Button>
                  <Button
                    variant="primary"
                    onClick={handleBorrow}
                    disabled={isLoading || !isDemoReady || !collateralAmount}
                  >
                    Borrow USDC
                  </Button>
                </Stack>
              </Stack>
            </Card.Body>
          </Card>
        </Col>

        <Col>
          <Card className="mb-4">
            <Card.Header className="d-flex justify-content-between align-items-center">
              <h4 className="mb-0">Your Loans</h4>
              <Button variant="outline-danger" size="sm" onClick={reset}>
                Reset Demo
              </Button>
            </Card.Header>
            <Card.Body>
              {activeLoans.length === 0 && liquidatableLoans.length === 0 ? (
                <p className="text-muted text-center py-4">No active loans</p>
              ) : (
                <Stack gap={3}>
                  {activeLoans.map((loan) => (
                    <Card key={loan.id} className="bg-light">
                      <Card.Body>
                        <Row className="align-items-center">
                          <Col>
                            <div className="fw-bold">{loan.collateralAmount} SOL</div>
                            <small className="text-muted">
                              → {loan.borrowedAmount.toFixed(2)} USDC
                            </small>
                          </Col>
                          <Col className="text-center">
                            <div className="fw-bold">{loan.ltv}% LTV</div>
                            <small className="text-muted">{formatTime(loan.dueTime)}</small>
                          </Col>
                          <Col>
                            <Stack gap={1}>
                              <Button
                                variant="success"
                                size="sm"
                                onClick={() => handleRepay(loan.id)}
                                disabled={isLoading}
                              >
                                Repay
                              </Button>
                              <Button
                                variant="outline-primary"
                                size="sm"
                                onClick={() => handleExtend(loan.id)}
                                disabled={isLoading}
                              >
                                Extend +15d
                              </Button>
                            </Stack>
                          </Col>
                        </Row>
                      </Card.Body>
                    </Card>
                  ))}
                  {liquidatableLoans.map((loan) => (
                    <Card key={loan.id} className="bg-danger-subtle border-danger">
                      <Card.Body>
                        <Row className="align-items-center">
                          <Col>
                            <div className="fw-bold">{loan.collateralAmount} SOL</div>
                            <small className="text-muted">
                              → {loan.borrowedAmount.toFixed(2)} USDC
                            </small>
                          </Col>
                          <Col className="text-center">
                            <Badge bg="danger">LIQUIDATABLE</Badge>
                            <div className="small">{formatTime(loan.dueTime)}</div>
                          </Col>
                          <Col>
                            <Button
                              variant="warning"
                              size="sm"
                              onClick={() => handleLiquidate(loan.id)}
                              disabled={isLoading}
                            >
                              Liquidate
                            </Button>
                          </Col>
                        </Row>
                      </Card.Body>
                    </Card>
                  ))}
                </Stack>
              )}
            </Card.Body>
          </Card>

          <Card>
            <Card.Header>
              <h5 className="mb-0">Portfolio Summary</h5>
            </Card.Header>
            <Card.Body>
              <Stack gap={2}>
                <div className="d-flex justify-content-between">
                  <span>Total Collateral</span>
                  <span className="fw-bold">${userState.totalCollateral.toFixed(2)}</span>
                </div>
                <div className="d-flex justify-content-between">
                  <span>Total Borrowed</span>
                  <span className="fw-bold text-warning">${userState.totalBorrowed.toFixed(2)}</span>
                </div>
                <div>
                  <div className="d-flex justify-content-between mb-1">
                    <span>Health Factor</span>
                    <span className={`fw-bold text-${getHealthColor(health)}`}>
                      {health.toFixed(1)}%
                    </span>
                  </div>
                  <ProgressBar
                    now={health}
                    variant={getHealthColor(health)}
                    style={{ height: 8 }}
                  />
                </div>
              </Stack>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <style>{`
        .spin {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </Container>
  );
};

export default PawnDemo;