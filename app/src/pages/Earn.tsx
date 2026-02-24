import { useState, useEffect, startTransition } from "react";
import {
  Container,
  Card,
  Row,
  Col,
  Button,
  Form,
  InputGroup,
  Tabs,
  Tab,
  Alert,
  Spinner,
  Badge,
  Accordion,
} from "react-bootstrap";
import {
  FiShield,
  FiAlertTriangle,
  FiCheckCircle,
  FiLock,
  FiEye,
  FiShoppingCart,
  FiInfo,
  FiDollarSign,
  FiClock,
  FiUsers,
  FiTrendingUp,
} from "react-icons/fi";
import { useWallet } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import { getAssociatedTokenAddress } from "@solana/spl-token";
import { useGinvaProgram } from "../hooks/useGinvaProgram";
import { showSuccess, showError } from "../utils/helpers";
import { useConnection } from "@solana/wallet-adapter-react";
import * as anchor from "@coral-xyz/anchor";

const Earn = () => {
  const { publicKey } = useWallet();
  const { connection } = useConnection();
  const { program } = useGinvaProgram();

  const programId =
    program?.programId ||
    new PublicKey("2SiGJi9VkD96oWLNizmMkGFwFpHq1tEETVqrLCezWKou");
  const [systemConfigPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("config")],
    programId
  );
  const [capitalAuthPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("capital_auth")],
    programId
  );

  const [activeTab, setActiveTab] = useState("deposit");
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);

  const [data, setData] = useState({
    tvl: 0,
    apy: 8.5,
    myStake: 0,
    pendingReward: 0,
    walletBalance: 0,
  });

  const [loanMint, setLoanMint] = useState<PublicKey | null>(null);

  const [shieldStatus, setShieldStatus] = useState({
    isSystemSafe: false,
    daysStaked: 0,
    daysRemaining: 15,
    isUserSafe: true,
    exitFee: 0,
  });

  const fetchData = async () => {
    if (!program || !publicKey) return;

    return new Promise<void>((resolve) => {
      setTimeout(async () => {
        try {
          const [configPda] = PublicKey.findProgramAddressSync(
            [Buffer.from("config")],
            program.programId
          );
          const [userStakePda] = PublicKey.findProgramAddressSync(
            [Buffer.from("stake"), publicKey.toBuffer()],
            program.programId
          );
          const [capitalAuthPda] = PublicKey.findProgramAddressSync(
            [Buffer.from("capital_auth")],
            program.programId
          );

          const configAccount = await program.account.systemConfig.fetch(
            configPda
          );
          const targetReserves = configAccount.targetReserves.toNumber() / 1e6;
          const protectionPeriodSeconds =
            configAccount.protectionPeriod.toNumber();

          const loanMint = configAccount.loanMint;
          const capitalWalletAddr = await getAssociatedTokenAddress(
            loanMint,
            capitalAuthPda,
            true
          );

          let currentReserves = 0;
          try {
            const balanceInfo = await connection.getTokenAccountBalance(
              capitalWalletAddr
            );
            currentReserves = balanceInfo.value.uiAmount || 0;
          } catch (e) {
            console.log("Capital wallet empty or not init yet");
          }

          const isSystemSafe = currentReserves >= targetReserves;

          let myStake = 0;
          let daysStaked = 0;
          let daysRemaining = 0;
          let lastDepositTime = 0;

          try {
            const userStakeAccount = await program.account.userStake.fetch(
              userStakePda
            );
            myStake = userStakeAccount.stakedAmount.toNumber() / 1e6;
            lastDepositTime = userStakeAccount.lastDepositTime.toNumber();

            const now = Math.floor(Date.now() / 1000);
            const timeElapsed = now - lastDepositTime;

            daysStaked = Math.floor(timeElapsed / 86400);
            const remainingSeconds = protectionPeriodSeconds - timeElapsed;
            daysRemaining = Math.max(0, Math.ceil(remainingSeconds / 86400));
          } catch (e) {
            console.log("User has no stake account");
          }

          const isUserSafe = isSystemSafe || daysRemaining <= 0;

          startTransition(() => {
            setData((prev) => ({
              ...prev,
              tvl:
                currentReserves + configAccount.totalBorrowed.toNumber() / 1e6,
              myStake,
            }));

            setShieldStatus({
              isSystemSafe,
              daysStaked,
              daysRemaining,
              isUserSafe,
              exitFee: isUserSafe ? 0 : 5,
            });

            setLoanMint(configAccount.loanMint);
          });
        } catch (err) {
          console.error("Error fetching data:", err);
        } finally {
          resolve();
        }
      }, 0);
    });
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [program, publicKey]);

  const handleDeposit = async () => {
    if (!amount || !program || !publicKey || !loanMint) return;
    setLoading(true);
    try {
      const amountLamports = Math.floor(parseFloat(amount) * 1e6); // USDC 6 decimals

      const capitalWalletAddr = await getAssociatedTokenAddress(
        loanMint,
        capitalAuthPda,
        true
      );
      const userUsdcAddr = await getAssociatedTokenAddress(
        loanMint,
        publicKey,
        false
      );

      const tx = await program.methods
        .stakeLp(new anchor.BN(amountLamports))
        .accounts({
          user: publicKey,
          systemConfig: systemConfigPda,
          capitalWalletAuthority: capitalAuthPda,
          capitalWallet: capitalWalletAddr,
          userUsdcAccount: userUsdcAddr,
        })
        .rpc();

      showSuccess(
        "Deposit Successful",
        `Staked ${amount} USDC. Tx: ${tx.substring(0, 10)}...`
      );
      setAmount("");
      fetchData();
    } catch (err: any) {
      console.error("Error depositing:", err);
      showError("Deposit Failed", err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = async () => {
    if (!amount || !program || !publicKey || !loanMint) return;
    setLoading(true);
    try {
      const amountLamports = Math.floor(parseFloat(amount) * 1e6); // USDC 6 decimals

      const capitalWalletAddr = await getAssociatedTokenAddress(
        loanMint,
        capitalAuthPda,
        true
      );
      const userUsdcAddr = await getAssociatedTokenAddress(
        loanMint,
        publicKey,
        false
      );
      const [reserveAuthPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("reserve_auth")],
        programId
      );
      const reserveWalletAddr = await getAssociatedTokenAddress(
        loanMint,
        reserveAuthPda,
        true
      );

      const tx = await program.methods
        .unstakeLp(new anchor.BN(amountLamports))
        .accounts({
          user: publicKey,
          systemConfig: systemConfigPda,
          capitalWalletAuthority: capitalAuthPda,
          capitalWallet: capitalWalletAddr,
          reserveWalletAuthority: reserveAuthPda,
          reserveWallet: reserveWalletAddr,
          userUsdcAccount: userUsdcAddr,
        })
        .rpc();

      showSuccess(
        "Withdrawal Successful",
        `Received ${amount} USDC. Tx: ${tx.substring(0, 10)}...`
      );
      setAmount("");
      fetchData();
    } catch (err: any) {
      console.error("Error withdrawing:", err);
      showError("Withdrawal Failed", err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleClaim = async () => {
    if (!program || !publicKey || !loanMint) return;
    setLoading(true);
    try {
      const userUsdcAddr = await getAssociatedTokenAddress(
        loanMint,
        publicKey,
        false
      );
      const [revenueAuthPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("revenue_auth")],
        programId
      );
      const revenueWalletAddr = await getAssociatedTokenAddress(
        loanMint,
        revenueAuthPda,
        true
      );
      const [userStakePda] = PublicKey.findProgramAddressSync(
        [Buffer.from("stake"), publicKey.toBuffer()],
        programId
      );

      const tx = await program.methods
        .claimStakingRewards()
        .accounts({
          user: publicKey,
          userStake: userStakePda,
          systemConfig: systemConfigPda,
          revenueWalletAuthority: revenueAuthPda,
          revenueWallet: revenueWalletAddr,
          userUsdcAccount: userUsdcAddr,
        })
        .rpc();

      showSuccess(
        "Rewards Claimed!",
        `Your rewards have been sent to your wallet. Tx: ${tx.substring(
          0,
          10
        )}...`
      );
      fetchData();
    } catch (err: any) {
      console.error("Error claiming rewards:", err);
      showError("Claim Failed", err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className="py-4">
      <Row className="justify-content-center">
        <Col md={12} lg={12}>
          {/* Header */}
          <div className="text-center mb-4">
            <h1 className="fw-bold">
              <FiShield className="text-success me-2" /> GINVA Ecosystem
            </h1>
            <p className="text-muted">
              Support the System in Multiple Ways - Choose What's Right for You
            </p>
          </div>

          {/* Overview Cards */}
          <Row className="g-3 mb-4">
            <Col xs={6} md={3}>
              <Card className="text-center h-100 border-0 shadow-sm bg-primary-subtle">
                <Card.Body>
                  <FiDollarSign size={32} className="text-primary mb-2" />
                  <h5 className="fw-bold">8%</h5>
                  <small className="text-muted">Borrower Interest</small>
                </Card.Body>
              </Card>
            </Col>
            <Col xs={6} md={3}>
              <Card className="text-center h-100 border-0 shadow-sm bg-success-subtle">
                <Card.Body>
                  <FiTrendingUp size={32} className="text-success mb-2" />
                  <h5 className="fw-bold">65.25%</h5>
                  <small className="text-muted">Supporter Rewards</small>
                </Card.Body>
              </Card>
            </Col>
            <Col xs={6} md={3}>
              <Card className="text-center h-100 border-0 shadow-sm bg-warning-subtle">
                <Card.Body>
                  <FiClock size={32} className="text-warning mb-2" />
                  <h5 className="fw-bold">72 hours</h5>
                  <small className="text-muted">Maturity Grace</small>
                </Card.Body>
              </Card>
            </Col>
            <Col xs={6} md={3}>
              <Card className="text-center h-100 border-0 shadow-sm bg-info-subtle">
                <Card.Body>
                  <FiUsers size={32} className="text-info mb-2" />
                  <h5 className="fw-bold">3</h5>
                  <small className="text-muted">Helper Roles</small>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* Main Tabs */}
          <Card className="shadow-lg border-0 rounded-4 overflow-hidden">
            <Tabs
              activeKey={activeTab}
              onSelect={(k) => setActiveTab(k || "overview")}
              className="nav-justified border-bottom"
              variant="pills"
            >
              {/* Tab 1: Overview */}
              <Tab eventKey="overview" title="📊 Overview">
                <Card.Body className="p-4">
                  <h4 className="fw-bold mb-4">3 Roles in GINVA Ecosystem</h4>

                  <Row className="g-4">
                    <Col md={4}>
                      <Card className="h-100 border-primary">
                        <Card.Header className="bg-primary text-white">
                          <h5 className="mb-0">🌿 Supporters</h5>
                        </Card.Header>
                        <Card.Body>
                          <p>
                            Deposit USDC to provide borrowers with circulating
                            capital
                          </p>
                          <hr />
                          <h6 className="fw-bold">Income:</h6>
                          <ul>
                            <li>65.25% of all interest</li>
                            <li>APY ~8.5%</li>
                          </ul>
                          <h6 className="fw-bold">Risk:</h6>
                          <ul>
                            <li>Shield Fee 5% (withdraw before 15 days)</li>
                          </ul>
                        </Card.Body>
                      </Card>
                    </Col>
                    <Col md={4}>
                      <Card className="h-100 border-warning">
                        <Card.Header className="bg-warning text-dark">
                          <h5 className="mb-0">🛡️ Helpers</h5>
                        </Card.Header>
                        <Card.Body>
                          <p>
                            Maintain the system 3 steps, help borrowers and the
                            system
                          </p>
                          <hr />
                          <h6 className="fw-bold">Income:</h6>
                          <ul>
                            <li>Helper A: 0.6% from collateral</li>
                            <li>Helper B: Buy assets at special prices</li>
                            <li>Helper C: 1.0 USDC per execution</li>
                          </ul>
                        </Card.Body>
                      </Card>
                    </Col>
                    <Col md={4}>
                      <Card className="h-100 border-success">
                        <Card.Header className="bg-success text-white">
                          <h5 className="mb-0">🏪 Storefront</h5>
                        </Card.Header>
                        <Card.Body>
                          <p>Buy seized assets at fair prices</p>
                          <hr />
                          <h6 className="fw-bold">Special Prices:</h6>
                          <ul>
                            <li>0-10 minutes: 8% discount</li>
                            <li>10-30 minutes: 6% discount</li>
                            <li>30-60 minutes: 3% discount</li>
                            <li>60+ minutes: market price</li>
                          </ul>
                        </Card.Body>
                      </Card>
                    </Col>
                  </Row>

                  <Alert variant="info" className="mt-4">
                    <FiInfo className="me-2" />
                    <strong>Everyone can be any role!</strong> Whether human, AI
                    Agent, or Bot - everyone has equal rights to help the system
                    and earn rewards
                  </Alert>
                </Card.Body>
              </Tab>

              {/* Tab 2: Deposit/Stake */}
              <Tab eventKey="deposit" title="🌿 Supporter">
                <Card.Body className="p-4">
                  <h4 className="fw-bold mb-3">🌿 Liquidity Provider</h4>
                  <p className="text-muted">
                    Deposit USDC to provide capital for borrowers Earn interest
                    as rewards
                  </p>

                  <Alert variant="success" className="mb-4">
                    <h5 className="fw-bold">💰 Income</h5>
                    <Row>
                      <Col md={6}>
                        <ul>
                          <li>
                            Receive <strong>65.25%</strong> of all interest paid
                            by borrowers
                          </li>
                          <li>
                            APY approximately <strong>8.5%</strong>
                          </li>
                          <li>Auto-compounding rewards</li>
                        </ul>
                      </Col>
                      <Col md={6}>
                        <ul>
                          <li>No money lock-up</li>
                          <li>Withdraw anytime</li>
                          <li>Shield Fee 5% (withdraw before 15 days)</li>
                        </ul>
                      </Col>
                    </Row>
                  </Alert>

                  <Row className="g-3 mb-4">
                    <Col xs={6}>
                      <Card className="text-center h-100 border-0 shadow-sm bg-light">
                        <Card.Body>
                          <small className="text-muted fw-bold">APY</small>
                          <h3 className="text-success fw-bold mb-0">
                            {data.apy}%
                          </h3>
                        </Card.Body>
                      </Card>
                    </Col>
                    <Col xs={6}>
                      <Card className="text-center h-100 border-0 shadow-sm bg-light">
                        <Card.Body>
                          <small className="text-muted fw-bold">TVL</small>
                          <h3 className="text-primary fw-bold mb-0">
                            ${data.tvl.toLocaleString()}
                          </h3>
                        </Card.Body>
                      </Card>
                    </Col>
                  </Row>

                  <Form.Group className="mb-3">
                    <Form.Label>Amount to Deposit</Form.Label>
                    <InputGroup size="lg">
                      <Form.Control
                        type="number"
                        placeholder="0.00"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                      />
                      <InputGroup.Text>USDC</InputGroup.Text>
                    </InputGroup>
                  </Form.Group>

                  <Alert
                    variant="info"
                    className="d-flex align-items-center small py-2"
                  >
                    <FiLock className="me-2 fs-5" />
                    <div>
                      <strong>Bootstrapping Phase:</strong> New deposits are
                      subject to a 15-day protection period. Early withdrawals
                      incur a 5% fee.
                    </div>
                  </Alert>

                  <Button
                    variant="primary"
                    size="lg"
                    className="w-100 mt-2"
                    onClick={handleDeposit}
                    disabled={loading || !amount}
                  >
                    {loading ? (
                      <Spinner size="sm" animation="border" />
                    ) : (
                      "Confirm Deposit"
                    )}
                  </Button>
                </Card.Body>
              </Tab>

              {/* Tab 3: Withdraw */}
              <Tab eventKey="withdraw" title="⬆️ Withdraw">
                <Card.Body className="p-4">
                  <h4 className="fw-bold mb-3">Withdraw Support</h4>

                  {!shieldStatus.isUserSafe && (
                    <Alert
                      variant="warning"
                      className="border-warning bg-warning-subtle shadow-sm"
                    >
                      <div className="d-flex">
                        <div className="me-3 display-6 text-warning">
                          <FiAlertTriangle />
                        </div>
                        <div>
                          <h5 className="fw-bold text-danger mb-1">
                            Early Withdrawal Fee Warning!
                          </h5>
                          <p className="mb-2 small text-dark">
                            You are withdrawing during the protection period.
                          </p>
                          <div className="d-flex gap-2">
                            <span className="badge bg-secondary">
                              Staked: {shieldStatus.daysStaked} Days
                            </span>
                            <span className="badge bg-success">
                              Wait: {shieldStatus.daysRemaining} Days
                            </span>
                          </div>
                          <hr className="my-2" />
                          <p className="mb-0 fw-bold text-danger">
                            Fee: 5% (
                            {(parseFloat(amount || "0") * 0.05).toFixed(2)}{" "}
                            USDC) will be deducted.
                          </p>
                        </div>
                      </div>
                    </Alert>
                  )}

                  {shieldStatus.isUserSafe && data.myStake > 0 && (
                    <Alert
                      variant="success"
                      className="d-flex align-items-center py-2"
                    >
                      <FiCheckCircle className="me-2 fs-4" />
                      <div>
                        <strong>You are safe!</strong> No withdrawal fees apply.
                      </div>
                    </Alert>
                  )}

                  <Form.Group className="mb-3">
                    <Form.Label>
                      Amount to Withdraw (Staked: {data.myStake})
                    </Form.Label>
                    <InputGroup size="lg">
                      <Form.Control
                        type="number"
                        placeholder="0.00"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                      />
                      <InputGroup.Text>USDC</InputGroup.Text>
                      <Button
                        variant="outline-secondary"
                        onClick={() => setAmount(data.myStake.toString())}
                      >
                        MAX
                      </Button>
                    </InputGroup>
                  </Form.Group>

                  <Button
                    variant={!shieldStatus.isUserSafe ? "danger" : "success"}
                    size="lg"
                    className="w-100 mt-2 fw-bold"
                    onClick={handleWithdraw}
                    disabled={loading || !amount}
                  >
                    {loading ? (
                      <Spinner size="sm" animation="border" />
                    ) : !shieldStatus.isUserSafe ? (
                      `Withdraw Anyway (Pay 5% Fee)`
                    ) : (
                      "Confirm Withdraw"
                    )}
                  </Button>
                </Card.Body>
              </Tab>

              {/* Tab 4: Claim */}
              <Tab eventKey="claim" title="🎁 Rewards">
                <Card.Body className="p-4">
                  <div className="text-center mb-4">
                    <h4 className="fw-bold mb-2">Claim Your Rewards</h4>
                    <p className="text-muted">
                      Your staking rewards are automatically compounded. Claim
                      anytime to withdraw your earnings.
                    </p>
                  </div>

                  <Card className="bg-success-subtle border-success mb-4">
                    <Card.Body className="text-center">
                      <small className="text-success fw-bold">
                        PENDING REWARDS
                      </small>
                      <h2 className="fw-bold text-success my-2">
                        {data.pendingReward.toFixed(6)} USDC
                      </h2>
                      <small className="text-muted">Available to claim</small>
                    </Card.Body>
                  </Card>

                  <div className="d-grid">
                    <Button
                      variant="success"
                      size="lg"
                      className="fw-bold"
                      onClick={handleClaim}
                      disabled={loading || data.pendingReward <= 0}
                    >
                      {loading ? (
                        <>
                          <Spinner
                            size="sm"
                            animation="border"
                            className="me-2"
                          />
                          Claiming...
                        </>
                      ) : (
                        <>
                          <FiCheckCircle className="me-2" />
                          Claim Rewards
                        </>
                      )}
                    </Button>
                  </div>

                  <Alert variant="info" className="mt-3">
                    <FiShield className="me-2" />
                    <small>
                      <strong>How it works:</strong> Your rewards come from
                      65.25% of all interest paid by borrowers. Rewards are
                      distributed proportionally based on your stake.
                    </small>
                  </Alert>
                </Card.Body>
              </Tab>

              {/* Tab 5: Helper A - Keeper */}
              <Tab eventKey="helper-a" title="🛡️ Helper A">
                <Card.Body className="p-4">
                  <h4 className="fw-bold mb-3">
                    🛡️ Helper A: Monitor and Notify
                  </h4>
                  <p className="text-muted">
                    Check loan status and notify when assistance is needed
                  </p>

                  <Alert variant="warning" className="mb-4">
                    <h5 className="fw-bold">🎁 Reward</h5>
                    <p>0.6% of collateral value</p>
                    <ul>
                      <li>Works in both systems</li>
                    </ul>
                  </Alert>

                  <Accordion defaultActiveKey="0">
                    <Accordion.Item eventKey="0">
                      <Accordion.Header>📋 Duties</Accordion.Header>
                      <Accordion.Body>
                        <ul>
                          <li>
                            Monitor borrower account health (Health Factor)
                          </li>
                          <li>72-hour advance notification (at maturity)</li>
                          <li>Trigger assistance process</li>
                          <li>Monitor problematic loans</li>
                        </ul>
                      </Accordion.Body>
                    </Accordion.Item>
                    <Accordion.Item eventKey="1">
                      <Accordion.Header>⚡ How It Works</Accordion.Header>
                      <Accordion.Body>
                        <ol>
                          <li>Scan for loans with Health Factor &lt; 100%</li>
                          <li>Or scan for expired loans + over 72 hours</li>
                          <li>
                            Call <code>trigger_liquidation</code> function
                          </li>
                          <li>Receive 0.6% from collateral value</li>
                        </ol>
                      </Accordion.Body>
                    </Accordion.Item>
                    <Accordion.Item eventKey="2">
                      <Accordion.Header>🎯 Trigger Conditions</Accordion.Header>
                      <Accordion.Body>
                        <ul>
                          <li>
                            <strong>Health Factor:</strong> HF &lt; 100% →
                            Liquidate immediately
                          </li>
                          <li>
                            <strong>Maturity:</strong> Expired + 72 hours → Can
                            Liquidate
                          </li>
                          <li>Must have USDC in wallet for gas fees</li>
                        </ul>
                      </Accordion.Body>
                    </Accordion.Item>
                  </Accordion>

                  <div className="text-center mt-4">
                    <Button variant="warning" size="lg" href="/keeper">
                      <FiEye className="me-2" /> Go to Keeper Page
                    </Button>
                  </div>
                </Card.Body>
              </Tab>

              {/* Tab 6: Helper B - Storefront */}
              <Tab eventKey="helper-b" title="🏪 Helper B">
                <Card.Body className="p-4">
                  <h4 className="fw-bold mb-3">
                    🏪 Helper B: Liquidity Provider (Buy Assets)
                  </h4>
                  <p className="text-muted">
                    Buy seized assets at special prices, help system have
                    liquidity
                  </p>

                  <Alert variant="success" className="mb-4">
                    <h5 className="fw-bold">
                      💰 Special Prices (Time-Based Discount)
                    </h5>
                    <Row className="text-center">
                      <Col xs={6} md={3}>
                        <Badge bg="success" className="mb-2">
                          0-10 min
                        </Badge>
                        <h4 className="text-success">-8%</h4>
                        <small>Lowest price</small>
                      </Col>
                      <Col xs={6} md={3}>
                        <Badge bg="info" className="mb-2">
                          10-30 min
                        </Badge>
                        <h4 className="text-info">-6%</h4>
                      </Col>
                      <Col xs={6} md={3}>
                        <Badge bg="warning" className="mb-2">
                          30-60 min
                        </Badge>
                        <h4 className="text-warning">-3%</h4>
                      </Col>
                      <Col xs={6} md={3}>
                        <Badge bg="secondary" className="mb-2">
                          60+ min
                        </Badge>
                        <h4 className="text-secondary">Market</h4>
                        <small>Regular price</small>
                      </Col>
                    </Row>
                  </Alert>

                  <Accordion>
                    <Accordion.Item eventKey="0">
                      <Accordion.Header>📋 Duties</Accordion.Header>
                      <Accordion.Body>
                        <ul>
                          <li>Buy seized assets from storefront</li>
                          <li>Provide liquidity to system</li>
                          <li>Receive discount based on purchase time</li>
                          <li>Help borrowers get best price</li>
                        </ul>
                      </Accordion.Body>
                    </Accordion.Item>
                    <Accordion.Item eventKey="1">
                      <Accordion.Header>🛒 How to Buy</Accordion.Header>
                      <Accordion.Body>
                        <ol>
                          <li>Go to Storefront page</li>
                          <li>Select desired asset</li>
                          <li>Pay USDC at special price</li>
                          <li>Receive asset immediately</li>
                        </ol>
                      </Accordion.Body>
                    </Accordion.Item>
                  </Accordion>

                  <div className="text-center mt-4">
                    <Button variant="success" size="lg" href="/storefront">
                      <FiShoppingCart className="me-2" /> Go to Storefront
                    </Button>
                  </div>
                </Card.Body>
              </Tab>

              {/* Tab 7: Helper C */}
              <Tab eventKey="helper-c" title="✅ Helper C">
                <Card.Body className="p-4">
                  <h4 className="fw-bold mb-3">
                    ✅ Helper C: Operations Manager
                  </h4>
                  <p className="text-muted">
                    Manage income distribution and complete the process
                  </p>

                  <Alert variant="info" className="mb-4">
                    <h5 className="fw-bold">🎁 Reward</h5>
                    <h3 className="text-primary">1.0 USDC</h3>
                    <p>per execution</p>
                  </Alert>

                  <Accordion>
                    <Accordion.Item eventKey="0">
                      <Accordion.Header>📋 Duties</Accordion.Header>
                      <Accordion.Body>
                        <ul>
                          <li>Summarize system transactions</li>
                          <li>Execute income distribution</li>
                          <li>Distribute funds to relevant parties</li>
                          <li>Complete the process</li>
                        </ul>
                      </Accordion.Body>
                    </Accordion.Item>
                    <Accordion.Item eventKey="1">
                      <Accordion.Header>💵 Payment Order</Accordion.Header>
                      <Accordion.Body>
                        <ol>
                          <li>
                            <strong>Priority 1:</strong> Pay Helper C reward
                            (1.0 USDC)
                          </li>
                          <li>
                            <strong>Priority 2:</strong> Return principal to
                            Capital Wallet
                          </li>
                          <li>
                            <strong>Priority 3:</strong> Excess as profit
                          </li>
                          <ul>
                            <li>10% → Capital Wallet (Fund)</li>
                            <li>24.75% → Team</li>
                            <li>65.25% → Supporters (Stakers)</li>
                          </ul>
                        </ol>
                      </Accordion.Body>
                    </Accordion.Item>
                  </Accordion>
                </Card.Body>
              </Tab>

              {/* Tab 8: Risk Warning */}
              <Tab eventKey="risks" title="⚠️ Risks">
                <Card.Body className="p-4">
                  <h4 className="fw-bold mb-3">⚠️ Risks and Important Info</h4>

                  <Alert variant="danger" className="mb-4">
                    <h5 className="fw-bold">🔴 Main Risks</h5>
                    <ul>
                      <li>
                        <strong>Dual Protection System:</strong>
                        <ul>
                          <li>
                            Maturity Grace Period: 72 hours (after maturity)
                          </li>
                          <li>
                            Immediate Price Protection: Immediately when HF &lt;
                            100%
                          </li>
                        </ul>
                      </li>
                      <li>
                        <strong>Shield Fee:</strong> 5% if withdrawn before 15
                        days
                      </li>
                      <li>
                        <strong>Smart Contract Risk:</strong> May have bugs
                      </li>
                      <li>
                        <strong>Price Risk:</strong> Crypto prices are volatile
                      </li>
                    </ul>
                  </Alert>

                  <Row>
                    <Col md={6}>
                      <Card className="bg-light">
                        <Card.Header>
                          <h6 className="mb-0">🌿 Supporters</h6>
                        </Card.Header>
                        <Card.Body>
                          <ul>
                            <li>Shield Fee 5% (withdraw before 15 days)</li>
                            <li>Impermanent Loss (if USDC price goes up)</li>
                            <li>Smart Contract Risk</li>
                          </ul>
                        </Card.Body>
                      </Card>
                    </Col>
                    <Col md={6}>
                      <Card className="bg-light">
                        <Card.Header>
                          <h6 className="mb-0">🛡️ Helpers</h6>
                        </Card.Header>
                        <Card.Body>
                          <ul>
                            <li>Gas Fee (must pay for transactions)</li>
                            <li>Competition (others may come first)</li>
                            <li>Oracle Risk (price may be inaccurate)</li>
                          </ul>
                        </Card.Body>
                      </Card>
                    </Col>
                  </Row>

                  <Alert variant="warning" className="mt-4">
                    <FiAlertTriangle className="me-2" />
                    <strong>Important:</strong> All investments have risks Study
                    information carefully before making decisions
                  </Alert>
                </Card.Body>
              </Tab>
            </Tabs>
          </Card>

          {/* Footer Info */}
          <div className="text-center mt-4">
            <Badge bg="success" className="me-2">
              Devnet
            </Badge>
            <span className="text-muted small">
              GINVA v2.0.0 - Dual Protection System | 8% Fixed APR
            </span>
          </div>
        </Col>
      </Row>
    </Container>
  );
};

export default Earn;
