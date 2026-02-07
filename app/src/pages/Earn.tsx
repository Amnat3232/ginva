import { useState, useEffect } from "react";
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
import { FiTrendingUp, FiShield, FiAlertCircle, FiLock } from "react-icons/fi";
import { useWallet } from "@solana/wallet-adapter-react";
import { useGinvaProgram } from "../hooks/useGinvaProgram";
import { showSuccess, showError } from "../utils/helpers";

const Earn = () => {
  const { publicKey } = useWallet();
  const { program } = useGinvaProgram();

  const [activeTab, setActiveTab] = useState("deposit");
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);

  // State สำหรับข้อมูลจริง
  const [poolStats, setPoolStats] = useState({
    tvl: 0,
    apy: 12.5, // Mock APY (คำนวณจริงจาก Utilization)
    myStake: 0,
    pendingReward: 0,
    isBootstrapping: true, // ดึงจาก Smart Contract
    targetReserves: 500000,
  });

  const [userSafety, setUserSafety] = useState({
    depositTime: 0,
    daysStaked: 0,
    isSafe: false, // True = ถอนฟรี, False = โดน 5%
  });

  // 1️⃣ จำลองการดึงข้อมูล (Replace with real RPC calls)
  const fetchData = async () => {
    if (!program || !publicKey) return;
    try {
      // TODO: เรียก account.systemConfig และ account.userStake
      // const config = await program.account.systemConfig.fetch(configPda);
      // const userStake = await program.account.userStake.fetch(userPda);

      // Mock Data เพื่อให้เห็นภาพ
      setPoolStats((prev) => ({ ...prev, tvl: 125000.5, myStake: 1000 }));
      setUserSafety({
        depositTime: Date.now() / 1000 - 5 * 86400, // ฝากมาแล้ว 5 วัน
        daysStaked: 5,
        isSafe: false, // ยังไม่ครบ 15 วัน
      });
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchData();
  }, [program, publicKey]);

  // 2️⃣ ฟังก์ชันฝากเงิน (Stake)
  const handleDeposit = async () => {
    if (!amount) return;
    setLoading(true);
    try {
      // const tx = await program.methods.stakeLp(new BN(amount * 1e6)).rpc();
      showSuccess("Deposit Successful", `You staked ${amount} USDC`);
      setAmount("");
      fetchData();
    } catch (err: any) {
      showError("Deposit Failed", err.message);
    } finally {
      setLoading(false);
    }
  };

  // 3️⃣ ฟังก์ชันถอนเงิน (Unstake)
  const handleWithdraw = async () => {
    if (!amount) return;
    setLoading(true);
    try {
      // const tx = await program.methods.unstakeLp(new BN(amount * 1e6)).rpc();
      showSuccess("Withdrawal Successful", `Received ${amount} USDC`);
      setAmount("");
      fetchData();
    } catch (err: any) {
      showError("Withdrawal Failed", err.message);
    } finally {
      setLoading(false);
    }
  };

  // 4️⃣ ฟังก์ชันกดรับรางวัล (Claim)
  const handleClaim = async () => {
    setLoading(true);
    try {
      // const tx = await program.methods.claimStakingRewards().rpc();
      showSuccess("Rewards Claimed!", "Check your wallet.");
    } catch (err: any) {
      showError("Claim Failed", err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className="py-5">
      <Row className="justify-content-center">
        <Col md={8} lg={6}>
          {/* Header */}
          <div className="text-center mb-4">
            <h1 className="fw-bold">
              <FiShield className="text-success me-2" /> Liquidity Vault
            </h1>
            <p className="text-muted">
              Provide liquidity to earn passive income from borrower interest.
            </p>
          </div>

          {/* Stats Cards */}
          <Row className="g-3 mb-4">
            <Col xs={6}>
              <Card className="text-center h-100 border-0 shadow-sm bg-light">
                <Card.Body>
                  <small className="text-muted text-uppercase fw-bold">
                    Current APY
                  </small>
                  <h3 className="text-success fw-bold mb-0">
                    {poolStats.apy}%
                  </h3>
                  <small className="text-success">
                    <FiTrendingUp /> Dynamic Rate
                  </small>
                </Card.Body>
              </Card>
            </Col>
            <Col xs={6}>
              <Card className="text-center h-100 border-0 shadow-sm bg-light">
                <Card.Body>
                  <small className="text-muted text-uppercase fw-bold">
                    Total Liquidity
                  </small>
                  <h3 className="text-primary fw-bold mb-0">
                    ${poolStats.tvl.toLocaleString()}
                  </h3>
                  <small className="text-muted">USDC Locked</small>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* Main Action Card */}
          <Card className="shadow-lg border-0 rounded-4 overflow-hidden">
            <Tabs
              activeKey={activeTab}
              onSelect={(k) => setActiveTab(k || "deposit")}
              className="nav-justified border-bottom"
              variant="pills"
            >
              <Tab eventKey="deposit" title="⬇️ Deposit (Earn)">
                <Card.Body className="p-4">
                  <Form.Group className="mb-3">
                    <Form.Label className="d-flex justify-content-between">
                      <span>Amount to Deposit</span>
                      <span className="text-muted">Balance: 5,000 USDC</span>
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
                        onClick={() => setAmount("5000")}
                      >
                        MAX
                      </Button>
                    </InputGroup>
                  </Form.Group>

                  {/* Info Box */}
                  <Alert
                    variant="info"
                    className="d-flex align-items-center small py-2"
                  >
                    <FiLock className="me-2" />
                    <div>
                      <strong>Shield Logic Active:</strong> Deposits &lt; 15
                      days are subject to a 5% exit fee if withdrawn early.
                    </div>
                  </Alert>

                  <Button
                    variant="primary"
                    size="lg"
                    className="w-100 mt-2 fw-bold"
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
                  {/* --- Shield Fee Warning Logic --- */}
                  {poolStats.isBootstrapping && !userSafety.isSafe && (
                    <Alert
                      variant="warning"
                      className="border-warning bg-warning-subtle"
                    >
                      <div className="d-flex">
                        <FiAlertCircle className="fs-1 me-3 align-self-center" />
                        <div>
                          <h6 className="fw-bold mb-1">
                            Early Withdrawal Fee Active!
                          </h6>
                          <p className="mb-0 small">
                            You have staked for only{" "}
                            <strong>{userSafety.daysStaked} days</strong>.
                            Withdrawing now will incur a{" "}
                            <strong>5% Shield Fee</strong>.
                            <br />
                            <span className="fw-bold text-dark">
                              Wait {15 - userSafety.daysStaked} more days for 0%
                              fee.
                            </span>
                          </p>
                        </div>
                      </div>
                    </Alert>
                  )}

                  <Form.Group className="mb-3">
                    <Form.Label className="d-flex justify-content-between">
                      <span>Amount to Withdraw</span>
                      <span className="text-muted">
                        Staked: {poolStats.myStake} USDC
                      </span>
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
                        onClick={() => setAmount(poolStats.myStake.toString())}
                      >
                        MAX
                      </Button>
                    </InputGroup>
                  </Form.Group>

                  <Button
                    variant={!userSafety.isSafe ? "warning" : "success"} // เปลี่ยนสีปุ่มถ้าไม่ safe
                    size="lg"
                    className="w-100 mt-2 fw-bold"
                    onClick={handleWithdraw}
                    disabled={loading || !amount}
                  >
                    {loading ? (
                      <Spinner size="sm" animation="border" />
                    ) : !userSafety.isSafe ? (
                      "Withdraw Anyway (Pay 5% Fee)"
                    ) : (
                      "Confirm Withdraw (Free)"
                    )}
                  </Button>
                </Card.Body>
              </Tab>
            </Tabs>

            {/* Claim Rewards Footer */}
            <div className="bg-light p-3 border-top d-flex justify-content-between align-items-center">
              <div>
                <small className="text-muted d-block">Unclaimed Rewards</small>
                <span className="fw-bold text-success fs-5">
                  +{poolStats.pendingReward} USDC
                </span>
              </div>
              <Button
                variant="outline-success"
                size="sm"
                onClick={handleClaim}
                disabled={poolStats.pendingReward <= 0}
              >
                Claim Rewards
              </Button>
            </div>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default Earn;
