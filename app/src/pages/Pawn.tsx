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
  Spinner,
} from "react-bootstrap";
import {
  FiTrendingUp,
  FiClock,
  FiShield,
  FiAlertTriangle,
} from "react-icons/fi";
import { useWallet } from "@solana/wallet-adapter-react";
import { usePawn } from "../hooks/page";
import { useSyncedUser } from "../hooks/useWalletSync";
import { useGinvaProgram } from "../hooks/useGinvaProgram";
import { usePythPrice } from "../hooks/usePythPrice";
import { showSuccess, showError } from "../utils/helpers";
import { useConnection } from "@solana/wallet-adapter-react";
import * as anchor from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";
import { getAssociatedTokenAddress } from "@solana/spl-token";
import { Loading } from "../components/ui/Loading";
import { GlassCard } from "../components/ui/GlassCard";
import { ErrorBoundary } from "../components/ui/ErrorBoundary";
import { Notification } from "../components/ui/Notification";

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
  {
    symbol: "SOL",
    name: "Solana",
    decimals: 9,
    mint: new PublicKey("So11111111111111111111111111111111111111112"),
    feedId: "native",
  },
  {
    symbol: "USDC",
    name: "USD Coin",
    decimals: 6,
    mint: new PublicKey("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"),
    feedId: "usdc",
  },
];

const Pawn = () => {
  const { publicKey, connected } = useWallet();
  const { user } = useSyncedUser();
  const { program } = useGinvaProgram();
  const { connection } = useConnection();

  const {
    collateralBalance,
    loanToValue,
    isLoading: pawnLoading,
    refetch: refetchPawn,
  } = usePawn();

  const [selectedAsset, setSelectedAsset] = useState(SUPPORTED_ASSETS[0]);
  const [collateralAmount, setCollateralAmount] = useState("");
  const [ltvOption, setLtvOption] = useState(2);
  const [durationDays, setDurationDays] = useState(60);
  const [loading, setLoading] = useState(false);

  const assetSymbol = selectedAsset.symbol.toLowerCase() as
    | "sol"
    | "btc"
    | "eth"
    | "usdc";
  const {
    price: currentPrice,
    loading: priceLoading,
    error: priceError,
  } = usePythPrice(assetSymbol, connection, true);

  const collateralPriceUSD =
    currentPrice ||
    (selectedAsset.symbol === "SOL"
      ? 100
      : selectedAsset.symbol === "USDC"
      ? 1
      : 2500);

  const collateralValueUSD =
    parseFloat(collateralAmount || "0") * collateralPriceUSD;
  const borrowAmountUSD =
    (collateralValueUSD * (ltvOption === 1 ? 20 : ltvOption === 2 ? 40 : 60)) /
    100;
  const borrowAmount = borrowAmountUSD.toFixed(2);

  const interestRate = 800;
  const dailyInterest =
    (parseFloat(borrowAmount || "0") * (interestRate / 10000)) / 365;
  const totalInterest = dailyInterest * durationDays;

  const [userBalance, setUserBalance] = useState(0);
  useEffect(() => {
    const fetchBalance = async () => {
      if (!publicKey || !connected) return;
      try {
        if (selectedAsset.symbol === "SOL") {
          const balance = await connection.getBalance(publicKey);
          setUserBalance(balance / Math.pow(10, 9));
        } else {
          setUserBalance(0);
        }
      } catch (e) {
        console.error("Error fetching balance:", e);
        setUserBalance(0);
      }
    };
    fetchBalance();
  }, [publicKey, connected, selectedAsset, connection]);

  const [depositFeeBps, setDepositFeeBps] = useState(0);
  useEffect(() => {
    const fetchSystemConfig = async () => {
      if (!program) return;
      try {
        const systemConfigPda = PublicKey.findProgramAddressSync(
          [Buffer.from("config")],
          program.programId
        )[0];
        const systemConfig = await program.account.systemConfig.fetch(
          systemConfigPda
        );
        setDepositFeeBps(systemConfig.depositFeeBps);
      } catch (e) {
        console.error("Error fetching system config:", e);
      }
    };
    fetchSystemConfig();
  }, [program]);

  const depositFeePercent = depositFeeBps / 100;
  const depositFeeAmount =
    parseFloat(collateralAmount || "0") * (depositFeeBps / 10000);
  const netCollateral = parseFloat(collateralAmount || "0") - depositFeeAmount;

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
      const systemConfigPda = PublicKey.findProgramAddressSync(
        [Buffer.from("config")],
        program.programId
      )[0];
      const systemConfig = await program.account.systemConfig.fetch(
        systemConfigPda
      );
      const loanId = systemConfig.ticketCounter.toNumber();

      const loanPda = PublicKey.findProgramAddressSync(
        [
          Buffer.from("loan"),
          publicKey.toBuffer(),
          new anchor.BN(loanId).toArrayLike(Buffer, "le", 4),
        ],
        program.programId
      )[0];

      const collateralLamports = new anchor.BN(
        parseFloat(collateralAmount) * Math.pow(10, selectedAsset.decimals)
      );
      const wsolAta = await getAssociatedTokenAddress(
        selectedAsset.mint,
        publicKey
      );
      const rateLimitPda = PublicKey.findProgramAddressSync(
        [Buffer.from("rate_limit"), publicKey.toBuffer()],
        program.programId
      )[0];

      showSuccess("Depositing Collateral...", "Please confirm the transaction");
      await program.methods
        .depositCollateral(collateralLamports)
        .accounts({
          borrower: publicKey,
          systemConfig: systemConfigPda,
          loanAccount: loanPda,
          wsolAta: wsolAta,
          wsolMint: selectedAsset.mint,
          borrowerRateLimit: rateLimitPda,
          tokenProgram: anchor.utils.token.TOKEN_PROGRAM_ID,
          associatedTokenProgram: anchor.utils.token.ASSOCIATED_PROGRAM_ID,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .rpc();

      const capitalWalletPda = PublicKey.findProgramAddressSync(
        [Buffer.from("capital_wallet")],
        program.programId
      )[0];
      const capitalAuthPda = PublicKey.findProgramAddressSync(
        [Buffer.from("capital_auth")],
        program.programId
      )[0];
      const userUsdcAta = await getAssociatedTokenAddress(
        new PublicKey("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"),
        publicKey
      );
      const assetConfigPda = PublicKey.findProgramAddressSync(
        [Buffer.from("asset_config"), selectedAsset.mint.toBuffer()],
        program.programId
      )[0];
      const assetConfig = await program.account.assetConfig.fetch(
        assetConfigPda
      );
      const protocolConfigPda = PublicKey.findProgramAddressSync(
        [Buffer.from("protocol_config")],
        program.programId
      )[0];

      const pythPriceFeed = assetConfig.priceFeed;

      showSuccess("Borrowing USDC...", "Please confirm the transaction");
      await program.methods
        .borrowUsdc(loanId, ltvOption, durationDays)
        .accounts({
          user: publicKey,
          systemConfig: systemConfigPda,
          loanAccount: loanPda,
          capitalWallet: capitalWalletPda,
          userUsdcAccount: userUsdcAta,
          capitalWalletAuthority: capitalAuthPda,
          pythPriceFeed: pythPriceFeed,
          assetConfig: assetConfigPda,
          protocolConfig: protocolConfigPda,
          borrowerRateLimit: rateLimitPda,
          tokenProgram: anchor.utils.token.TOKEN_PROGRAM_ID,
        })
        .rpc();

      showSuccess(
        "Loan Created Successfully!",
        "Your loan is active with protection"
      );
      setCollateralAmount("");
      refetchPawn();
    } catch (error: any) {
      console.error("Error creating ticket:", error);
      if (error.message?.includes("User rejected")) {
        showError("Transaction Cancelled", "You rejected the transaction");
      } else if (error.message?.includes("insufficient funds")) {
        showError(
          "Insufficient Funds",
          "You need more SOL for transaction fees"
        );
      } else {
        showError("Creation Failed", error.message || "Unknown error occurred");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = useCallback(() => {
    refetchPawn();
  }, [refetchPawn]);

  if (pawnLoading && collateralBalance === 0) {
    return (
      <Container className="py-4">
        <Loading text="Loading pawn data..." />
      </Container>
    );
  }

  return (
    <ErrorBoundary>
      <Notification />
      <Container className="py-4">
        <Stack direction="vertical" gap={3} className="mb-4">
          <h1>Borrow USDC</h1>
          <p className="text-muted">
            Use your crypto as collateral to get instant USDC.
          </p>
          <Alert variant="warning">
            <strong>⚠️ Important:</strong> Monitor your Health Factor!
          </Alert>
        </Stack>

        <Row xs={1} lg={2} gap={4}>
          <Col>
            <Card>
              <Card.Header>
                <h4 className="mb-0">Create Loan</h4>
              </Card.Header>
              <Card.Body>
                <Stack gap={4}>
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
                  </div>

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

          <Col>
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
                    <div className="text-end">
                      {priceLoading ? (
                        <small className="text-muted">Loading...</small>
                      ) : priceError ? (
                        <small className="text-warning">Using fallback</small>
                      ) : currentPrice ? (
                        <small className="text-success me-2">Live</small>
                      ) : null}
                      <span className="fw-bold">
                        ${collateralValueUSD.toFixed(2)}
                      </span>
                    </div>
                  </div>
                  <div className="d-flex justify-content-between text-muted">
                    <span>Deposit Fee ({depositFeePercent}%)</span>
                    <span>
                      -{depositFeeAmount.toFixed(2)} {selectedAsset.symbol}
                    </span>
                  </div>
                  <div className="d-flex justify-content-between text-success">
                    <span>Net Collateral (after fee)</span>
                    <span className="fw-bold">
                      {netCollateral.toFixed(2)} {selectedAsset.symbol}
                    </span>
                  </div>
                  <hr />
                  <div className="d-flex justify-content-between">
                    <span>LTV Ratio</span>
                    <span className="fw-bold">
                      {ltvOption === 1 ? 20 : ltvOption === 2 ? 40 : 60}%
                    </span>
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
                </Stack>
              </Card.Body>
            </Card>
          </Col>
        </Row>

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

export default Pawn;
