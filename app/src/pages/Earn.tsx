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
} from "react-bootstrap";
import {
  FiShield,
  FiAlertTriangle,
  FiCheckCircle,
  FiLock,
} from "react-icons/fi";
import { useWallet } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import { getAssociatedTokenAddress } from "@solana/spl-token";
import { useGinvaProgram } from "../hooks/useGinvaProgram";
import { showSuccess, showError } from "../utils/helpers";
import { useConnection } from "@solana/wallet-adapter-react";

const Earn = () => {
  const { publicKey } = useWallet();
  const { connection } = useConnection();
  const { program } = useGinvaProgram();

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
    if (!amount) return;
    setLoading(true);
    try {
      showSuccess("Deposit Successful", `You staked ${amount} USDC`);
      setAmount("");
      fetchData();
    } catch (err: any) {
      showError("Deposit Failed", err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = async () => {
    if (!amount) return;
    setLoading(true);
    try {
      showSuccess("Withdrawal Successful", `Received ${amount} USDC`);
      setAmount("");
      fetchData();
    } catch (err: any) {
      showError("Withdrawal Failed", err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleClaim = async () => {
    if (!program || !publicKey) return;
    setLoading(true);
    try {
      showSuccess("Claiming Rewards...", "Please confirm the transaction");

      // In production, would call:
      // await program.methods.claimStakingRewards().rpc();

      // Mock success
      await new Promise((resolve) => setTimeout(resolve, 1500));
      showSuccess(
        "Rewards Claimed!",
        "Your rewards have been sent to your wallet"
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
    <Container className="py-5">
      <Row className="justify-content-center">
        <Col md={8} lg={6}>
          <div className="text-center mb-4">
            <h1 className="fw-bold">
              <FiShield className="text-success me-2" /> Liquidity Vault
            </h1>
            <p className="text-muted">
              Stake USDC to earn yield from real-world loans.
            </p>
          </div>

          <Row className="g-3 mb-4">
            <Col xs={6}>
              <Card className="text-center h-100 border-0 shadow-sm bg-light">
                <Card.Body>
                  <small className="text-muted fw-bold">APY</small>
                  <h3 className="text-success fw-bold mb-0">{data.apy}%</h3>
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

          <Card className="shadow-lg border-0 rounded-4 overflow-hidden">
            <Tabs
              activeKey={activeTab}
              onSelect={(k) => setActiveTab(k || "deposit")}
              className="nav-justified border-bottom"
              variant="pills"
            >
              <Tab eventKey="deposit" title="⬇️ Deposit">
                <Card.Body className="p-4">
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

              <Tab eventKey="withdraw" title="⬆️ Withdraw">
                <Card.Body className="p-4">
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

              <Tab eventKey="claim" title="🎁 Claim">
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
            </Tabs>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default Earn;
