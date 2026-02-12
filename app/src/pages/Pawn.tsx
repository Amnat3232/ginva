import { useState, useEffect } from "react";
import {
  Container,
  Card,
  Button,
  Stack,
  Form,
  Row,
  Col,
  Alert,
  Spinner,
} from "react-bootstrap";
import {
  FiTrendingUp,
  FiClock,
  FiShield,
  FiAlertTriangle,
} from "react-icons/fi";
import { useWallet } from "@solana/wallet-adapter-react";
import { useGinvaProgram } from "../hooks/useGinvaProgram";
import { showSuccess, showError } from "../utils/helpers";
import { useConnection } from "@solana/wallet-adapter-react";

// LTV Options from smart contract
const LTV_OPTIONS = [
  {
    value: 1,
    label: "Safe (20%)",
    description: "Low risk, lower borrowing power",
  },
  {
    value: 2,
    label: "Standard (40%)",
    description: "Balanced risk and borrowing power",
  },
  {
    value: 3,
    label: "Max (60%)",
    description: "Higher risk, maximum borrowing power",
  },
];

// Duration Options
const DURATION_OPTIONS = [
  { value: 30, label: "30 Days", description: "Short term, lower interest" },
  { value: 60, label: "60 Days", description: "Medium term" },
  { value: 90, label: "90 Days", description: "Long term, more flexibility" },
];

// Mock supported assets (in production, fetch from config)
const SUPPORTED_ASSETS = [
  { symbol: "SOL", name: "Solana", decimals: 9, feedId: "native" },
  { symbol: "USDC", name: "USD Coin", decimals: 6, feedId: "usdc" },
  { symbol: "BTC", name: "Bitcoin", decimals: 8, feedId: "btc" },
];

const Pawn = () => {
  const { publicKey, connected } = useWallet();
  const { program } = useGinvaProgram();
  const { connection } = useConnection();

  // Form state
  const [selectedAsset, setSelectedAsset] = useState(SUPPORTED_ASSETS[0]);
  const [collateralAmount, setCollateralAmount] = useState("");
  const [ltvOption, setLtvOption] = useState(2);
  const [durationDays, setDurationDays] = useState(60);
  const [loading, setLoading] = useState(false);

  // Derived state
  // const collateralLamports =
  //   parseFloat(collateralAmount) * Math.pow(10, selectedAsset.decimals);
  const ltvPercent = ltvOption === 1 ? 20 : ltvOption === 2 ? 40 : 60;

  // Mock price (in production, fetch from Pyth oracle)
  const mockPriceUSD =
    selectedAsset.symbol === "SOL"
      ? 100
      : selectedAsset.symbol === "USDC"
      ? 1
      : 45000;
  const collateralValueUSD = parseFloat(collateralAmount || "0") * mockPriceUSD;
  const borrowAmountUSD = collateralValueUSD * (ltvPercent / 100);
  const borrowAmount = borrowAmountUSD.toFixed(2);

  // Calculate interest (mock rate: 8% APR)
  const interestRate = 800; // 8% in bps
  const dailyInterest =
    (parseFloat(borrowAmount) * (interestRate / 10000)) / 365;
  const totalInterest = dailyInterest * durationDays;

  // Fetch user's token balance
  const [userBalance, setUserBalance] = useState(0);
  useEffect(() => {
    const fetchBalance = async () => {
      if (!publicKey || !connected) return;

      try {
        if (selectedAsset.symbol === "SOL") {
          const balance = await connection.getBalance(publicKey);
          setUserBalance(balance / Math.pow(10, 9));
        } else {
          // For SPL tokens, would need token account lookup
          setUserBalance(0);
        }
      } catch (e) {
        console.error("Error fetching balance:", e);
        setUserBalance(0);
      }
    };

    fetchBalance();
  }, [publicKey, connected, selectedAsset, connection]);

  const handleCreateTicket = async () => {
    if (!connected || !program || !publicKey) {
      showError("Wallet Not Connected", "Please connect your wallet first");
      return;
    }

    if (!collateralAmount || parseFloat(collateralAmount) <= 0) {
      showError("Invalid Amount", "Please enter a valid collateral amount");
      return;
    }

    if (parseFloat(collateralAmount) > userBalance) {
      showError(
        "Insufficient Balance",
        `You only have ${userBalance.toFixed(4)} ${selectedAsset.symbol}`
      );
      return;
    }

    setLoading(true);
    try {
      // Step 1: Deposit Collateral
      // In production, would need to:
      // 1. Create or get user rate limit account
      // 2. Get ticket counter
      // 3. Call deposit_collateral with loan_id

      showSuccess("Creating Loan...", "Please confirm the transaction");

      // Mock success for development
      await new Promise((resolve) => setTimeout(resolve, 2000));

      showSuccess(
        "Loan Created!",
        "Your loan is active with 72-hour protection"
      );
      setCollateralAmount("");
    } catch (error: any) {
      console.error("Error creating ticket:", error);
      showError("Creation Failed", error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className="py-4">
      <Stack direction="vertical" gap={3} className="mb-4">
        <h1>Borrow USDC</h1>
        <p className="text-muted">
          Use your crypto as collateral to get instant USDC.
          <strong> Protected with 72-hour safety net.</strong>
        </p>
      </Stack>

      <Row xs={1} lg={2} gap={4}>
        {/* Left Column - Form */}
        <Col>
          <Card>
            <Card.Header>
              <h4 className="mb-0">Create Loan</h4>
            </Card.Header>
            <Card.Body>
              <Stack gap={4}>
                {/* Asset Selection */}
                <div>
                  <Form.Label className="fw-bold">Select Asset</Form.Label>
                  <Row xs={3} gap={2}>
                    {SUPPORTED_ASSETS.map((asset) => (
                      <Col key={asset.symbol}>
                        <Card
                          className={`text-center p-3 cursor-pointer ${
                            selectedAsset.symbol === asset.symbol
                              ? "border-primary bg-primary-subtle"
                              : "bg-light"
                          }`}
                          style={{ cursor: "pointer" }}
                          onClick={() => setSelectedAsset(asset)}
                        >
                          <div className="fw-bold">{asset.symbol}</div>
                          <small className="text-muted">{asset.name}</small>
                        </Card>
                      </Col>
                    ))}
                  </Row>
                </div>

                {/* Collateral Amount */}
                <div>
                  <Form.Label className="fw-bold">
                    Collateral Amount ({selectedAsset.symbol})
                  </Form.Label>
                  <Form.Control
                    type="number"
                    placeholder={`0.00 ${selectedAsset.symbol}`}
                    value={collateralAmount}
                    onChange={(e) => setCollateralAmount(e.target.value)}
                    isInvalid={parseFloat(collateralAmount) > userBalance}
                  />
                  <Form.Text className="text-muted">
                    Available: {userBalance.toFixed(4)} {selectedAsset.symbol}
                  </Form.Text>
                  {parseFloat(collateralAmount) > userBalance && (
                    <Form.Control.Feedback type="invalid">
                      Insufficient balance
                    </Form.Control.Feedback>
                  )}
                </div>

                {/* LTV Selection */}
                <div>
                  <Form.Label className="fw-bold">
                    How Much to Borrow (LTV)
                  </Form.Label>
                  <Stack gap={2}>
                    {LTV_OPTIONS.map((option) => (
                      <Form.Check
                        key={option.value}
                        type="radio"
                        name="ltv"
                        id={`ltv-${option.value}`}
                        label={
                          <div className="d-flex justify-content-between w-100">
                            <span>{option.label}</span>
                            <small className="text-muted">
                              {option.description}
                            </small>
                          </div>
                        }
                        checked={ltvOption === option.value}
                        onChange={() => setLtvOption(option.value)}
                        className="p-2 border rounded"
                        style={{ cursor: "pointer" }}
                      />
                    ))}
                  </Stack>
                </div>

                {/* Duration Selection */}
                <div>
                  <Form.Label className="fw-bold">Loan Duration</Form.Label>
                  <Row xs={3} gap={2}>
                    {DURATION_OPTIONS.map((option) => (
                      <Col key={option.value}>
                        <Card
                          className={`text-center p-3 cursor-pointer ${
                            durationDays === option.value
                              ? "border-primary bg-primary-subtle"
                              : "bg-light"
                          }`}
                          style={{ cursor: "pointer" }}
                          onClick={() => setDurationDays(option.value)}
                        >
                          <FiClock className="mb-1" />
                          <div className="fw-bold">{option.value} Days</div>
                          <small className="text-muted">
                            {option.description}
                          </small>
                        </Card>
                      </Col>
                    ))}
                  </Row>
                </div>

                {/* Submit Button */}
                <div className="d-grid">
                  <Button
                    variant="primary"
                    size="lg"
                    onClick={handleCreateTicket}
                    disabled={
                      loading ||
                      !connected ||
                      !collateralAmount ||
                      parseFloat(collateralAmount) <= 0
                    }
                  >
                    {loading ? (
                      <>
                        <Spinner
                          as="span"
                          animation="border"
                          size="sm"
                          className="me-2"
                        />
                        Creating Loan...
                      </>
                    ) : (
                      <>
                        <FiTrendingUp className="me-2" />
                        Borrow Now
                      </>
                    )}
                  </Button>
                  {!connected && (
                    <Alert variant="warning" className="mt-2">
                      <FiAlertTriangle className="me-2" />
                      Please connect your wallet to borrow USDC
                    </Alert>
                  )}
                </div>
              </Stack>
            </Card.Body>
          </Card>
        </Col>

        {/* Right Column - Summary */}
        <Col>
          {/* Loan Summary */}
          <Card className="mb-4">
            <Card.Header>
              <h5 className="mb-0">Loan Summary</h5>
            </Card.Header>
            <Card.Body>
              <Stack gap={3}>
                <div className="d-flex justify-content-between">
                  <span>Collateral</span>
                  <span className="fw-bold">
                    {collateralAmount || "0"} {selectedAsset.symbol}
                  </span>
                </div>
                <div className="d-flex justify-content-between">
                  <span>Collateral Value (USD)</span>
                  <span className="fw-bold">
                    ${collateralValueUSD.toFixed(2)}
                  </span>
                </div>
                <hr />
                <div className="d-flex justify-content-between">
                  <span>LTV Ratio</span>
                  <span className="fw-bold">{ltvPercent}%</span>
                </div>
                <div className="d-flex justify-content-between text-primary">
                  <span>You Borrow</span>
                  <span className="fw-bold fs-4">${borrowAmount} USDC</span>
                </div>
                <hr />
                <div className="d-flex justify-content-between">
                  <span>Interest Rate</span>
                  <span className="fw-bold">8% APR</span>
                </div>
                <div className="d-flex justify-content-between">
                  <span>Duration</span>
                  <span className="fw-bold">{durationDays} Days</span>
                </div>
                <div className="d-flex justify-content-between text-warning">
                  <span>Est. Interest</span>
                  <span className="fw-bold">
                    ~${totalInterest.toFixed(2)} USDC
                  </span>
                </div>
                <Alert variant="info" className="mb-0">
                  <FiShield className="me-2" />
                  <strong>72-Hour Protection:</strong> If collateral value
                  drops, you have 72 hours to add more collateral or repay. We
                  alert you in advance.
                </Alert>
              </Stack>
            </Card.Body>
          </Card>

          {/* How It Works */}
          <Card>
            <Card.Header>
              <h5 className="mb-0">How It Works</h5>
            </Card.Header>
            <Card.Body>
              <Stack gap={3}>
                <div className="d-flex align-items-start gap-3">
                  <div
                    className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center"
                    style={{ width: "32px", height: "32px", minWidth: "32px" }}
                  >
                    1
                  </div>
                  <div>
                    <strong>Deposit Your Asset</strong>
                    <p className="text-muted small mb-0">
                      Lock your SOL, BTC, or ETH as collateral. Your assets stay
                      safe.
                    </p>
                  </div>
                </div>
                <div className="d-flex align-items-start gap-3">
                  <div
                    className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center"
                    style={{ width: "32px", height: "32px", minWidth: "32px" }}
                  >
                    2
                  </div>
                  <div>
                    <strong>Receive USDC Instantly</strong>
                    <p className="text-muted small mb-0">
                      Get cash based on your collateral value. No waiting, no
                      paperwork.
                    </p>
                  </div>
                </div>
                <div className="d-flex align-items-start gap-3">
                  <div
                    className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center"
                    style={{ width: "32px", height: "32px", minWidth: "32px" }}
                  >
                    3
                  </div>
                  <div>
                    <strong>Protected Period</strong>
                    <p className="text-muted small mb-0">
                      If prices drop, you have 72 hours to protect your assets.
                      We alert you early.
                    </p>
                  </div>
                </div>
                <div className="d-flex align-items-start gap-3">
                  <div
                    className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center"
                    style={{ width: "32px", height: "32px", minWidth: "32px" }}
                  >
                    4
                  </div>
                  <div>
                    <strong>Repay & Reclaim</strong>
                    <p className="text-muted small mb-0">
                      Pay back what you borrowed plus interest to get your
                      crypto back.
                    </p>
                  </div>
                </div>
              </Stack>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default Pawn;
