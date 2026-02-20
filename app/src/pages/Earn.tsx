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
              ร่วมสนับสนุนระบบ หลายหลายวิธี - เลือกแบบที่เหมาะกับคุณ
            </p>
          </div>

          {/* Overview Cards */}
          <Row className="g-3 mb-4">
            <Col xs={6} md={3}>
              <Card className="text-center h-100 border-0 shadow-sm bg-primary-subtle">
                <Card.Body>
                  <FiDollarSign size={32} className="text-primary mb-2" />
                  <h5 className="fw-bold">8%</h5>
                  <small className="text-muted">ดอกเบี้ยผู้กู้</small>
                </Card.Body>
              </Card>
            </Col>
            <Col xs={6} md={3}>
              <Card className="text-center h-100 border-0 shadow-sm bg-success-subtle">
                <Card.Body>
                  <FiTrendingUp size={32} className="text-success mb-2" />
                  <h5 className="fw-bold">65.25%</h5>
                  <small className="text-muted">รางวัลผู้สนับสนุน</small>
                </Card.Body>
              </Card>
            </Col>
            <Col xs={6} md={3}>
              <Card className="text-center h-100 border-0 shadow-sm bg-warning-subtle">
                <Card.Body>
                  <FiClock size={32} className="text-warning mb-2" />
                  <h5 className="fw-bold">72 ชม.</h5>
                  <small className="text-muted">Maturity Grace</small>
                </Card.Body>
              </Card>
            </Col>
            <Col xs={6} md={3}>
              <Card className="text-center h-100 border-0 shadow-sm bg-info-subtle">
                <Card.Body>
                  <FiUsers size={32} className="text-info mb-2" />
                  <h5 className="fw-bold">3</h5>
                  <small className="text-muted">บทบาทผู้ช่วย</small>
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
              <Tab eventKey="overview" title="📊 ภาพรวม">
                <Card.Body className="p-4">
                  <h4 className="fw-bold mb-4">3 บทบาทในระบบนิเวศ GINVA</h4>

                  <Row className="g-4">
                    <Col md={4}>
                      <Card className="h-100 border-primary">
                        <Card.Header className="bg-primary text-white">
                          <h5 className="mb-0">🌿 ผู้สนับสนุน</h5>
                        </Card.Header>
                        <Card.Body>
                          <p>ฝาก USDC เพื่อให้ผู้กู้มีเงินทุนหมุนเวียน</p>
                          <hr />
                          <h6 className="fw-bold">รายได้:</h6>
                          <ul>
                            <li>65.25% จากดอกเบี้ยทั้งหมด</li>
                            <li>APY ~8.5%</li>
                          </ul>
                          <h6 className="fw-bold">ความเสี่ยง:</h6>
                          <ul>
                            <li>Shield Fee 5% (ถอนก่อน 15 วัน)</li>
                          </ul>
                        </Card.Body>
                      </Card>
                    </Col>
                    <Col md={4}>
                      <Card className="h-100 border-warning">
                        <Card.Header className="bg-warning text-dark">
                          <h5 className="mb-0">🛡️ ผู้ช่วยเหลือ</h5>
                        </Card.Header>
                        <Card.Body>
                          <p>ดูแลระบบ 3 ขั้นตอน ช่วยเหลือผู้กู้และระบบ</p>
                          <hr />
                          <h6 className="fw-bold">รายได้:</h6>
                          <ul>
                            <li>Helper A: 0.6% จากหลักประกัน</li>
                            <li>Helper B: ซื้อสินทรัพย์ในราคาพิเศษ</li>
                            <li>Helper C: 1.0 USDC ต่อครั้ง</li>
                          </ul>
                        </Card.Body>
                      </Card>
                    </Col>
                    <Col md={4}>
                      <Card className="h-100 border-success">
                        <Card.Header className="bg-success text-white">
                          <h5 className="mb-0">🏪 ร้านค้า</h5>
                        </Card.Header>
                        <Card.Body>
                          <p>ซื้อสินทรัพย์หลุดจำนำในราคายุติธรรม</p>
                          <hr />
                          <h6 className="fw-bold">ราคาพิเศษ:</h6>
                          <ul>
                            <li>0-10 นาที: ส่วนลด 8%</li>
                            <li>10-30 นาที: ส่วนลด 6%</li>
                            <li>30-60 นาที: ส่วนลด 3%</li>
                            <li>60+ นาที: ราคาตลาด</li>
                          </ul>
                        </Card.Body>
                      </Card>
                    </Col>
                  </Row>

                  <Alert variant="info" className="mt-4">
                    <FiInfo className="me-2" />
                    <strong>ทุกคนสามารถเป็นได้ทุกบทบาท!</strong>{" "}
                    ไม่ว่าจะเป็นมนุษย์, AI Agent, หรือ Bot -
                    ทุกคนมีสิทธิ์เท่าเทียมกันในการช่วยระบบและรับรางวัล
                  </Alert>
                </Card.Body>
              </Tab>

              {/* Tab 2: Deposit/Stake */}
              <Tab eventKey="deposit" title="🌿 ผู้สนับสนุน">
                <Card.Body className="p-4">
                  <h4 className="fw-bold mb-3">
                    🌿 ผู้สนับสนุนสภาพคล่อง (Liquidity Provider)
                  </h4>
                  <p className="text-muted">
                    ฝาก USDC เพื่อเป็นแหล่งเงินทุนให้ผู้กู้
                    รับดอกเบี้ยเป็นรางวัล
                  </p>

                  <Alert variant="success" className="mb-4">
                    <h5 className="fw-bold">💰 รายได้</h5>
                    <Row>
                      <Col md={6}>
                        <ul>
                          <li>
                            ได้รับ <strong>65.25%</strong>{" "}
                            จากดอกเบี้ยทั้งหมดที่ผู้กู้จ่าย
                          </li>
                          <li>
                            APY ประมาณ <strong>8.5%</strong>
                          </li>
                          <li>รางวัลทบต้นอัตโนมัติ</li>
                        </ul>
                      </Col>
                      <Col md={6}>
                        <ul>
                          <li>ไม่มีการล็อกเงิน</li>
                          <li>ถอนได้ทุกเมื่อ</li>
                          <li>Shield Fee 5% (ถอนก่อน 15 วัน)</li>
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
              <Tab eventKey="withdraw" title="⬆️ ถอนเงิน">
                <Card.Body className="p-4">
                  <h4 className="fw-bold mb-3">ถอนเงินสนับสนุน</h4>

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
              <Tab eventKey="claim" title="🎁 รางวัล">
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
                    🛡️ Helper A: ผู้ตรวจสอบและแจ้งเตือน
                  </h4>
                  <p className="text-muted">
                    ตรวจสอบสถานะเงินกู้และแจ้งเตือนเมื่อต้องการความช่วยเหลือ
                  </p>

                  <Alert variant="warning" className="mb-4">
                    <h5 className="fw-bold">🎁 รางวัล</h5>
                    <Row>
                      <Col md={6}>
                        <h3 className="text-success">0.6%</h3>
                        <p>ของมูลค่าหลักประกัน</p>
                      </Col>
                      <Col md={6}>
                        <ul>
                          <li>Trigger Health Factor → 0.6%</li>
                          <li>Trigger Maturity → 0.6%</li>
                          <li>ทำงานได้ทั้ง 2 ระบบ</li>
                        </ul>
                      </Col>
                    </Row>
                  </Alert>

                  <Accordion defaultActiveKey="0">
                    <Accordion.Item eventKey="0">
                      <Accordion.Header>📋 หน้าที่</Accordion.Header>
                      <Accordion.Body>
                        <ul>
                          <li>ตรวจสอบสุขภาพบัญชีผู้กู้ (Health Factor)</li>
                          <li>แจ้งเตือนล่วงหน้า 72 ชม. (เมื่อครบกำหนด)</li>
                          <li>สั่งเริ่มกระบวนการช่วยเหลือ (Trigger)</li>
                          <li>Monitor เงินกู้ที่มีปัญหา</li>
                        </ul>
                      </Accordion.Body>
                    </Accordion.Item>
                    <Accordion.Item eventKey="1">
                      <Accordion.Header>⚡ วิธีทำงาน</Accordion.Header>
                      <Accordion.Body>
                        <ol>
                          <li>Scan หาเงินกู้ที่มี Health Factor &lt; 100%</li>
                          <li>หรือ Scan หาเงินกู้ที่หมดอายุ + เกิน 72 ชม.</li>
                          <li>
                            เรียก function <code>trigger_liquidation</code>
                          </li>
                          <li>รับ 0.6% จากมูลค่าหลักประกัน</li>
                        </ol>
                      </Accordion.Body>
                    </Accordion.Item>
                    <Accordion.Item eventKey="2">
                      <Accordion.Header>🎯 เงื่อนไขการทำงาน</Accordion.Header>
                      <Accordion.Body>
                        <ul>
                          <li>
                            <strong>Health Factor:</strong> HF &lt; 100% →
                            Liquidate ทันที
                          </li>
                          <li>
                            <strong>Maturity:</strong> หมดอายุ + 72 ชม. แล้ว →
                            Liquidate ได้
                          </li>
                          <li>ต้องมี USDC ในกระเป๋า足够的สำหรับค่า gas</li>
                        </ul>
                      </Accordion.Body>
                    </Accordion.Item>
                  </Accordion>

                  <div className="text-center mt-4">
                    <Button variant="warning" size="lg" href="/keeper">
                      <FiEye className="me-2" /> ไปหน้า Keeper
                    </Button>
                  </div>
                </Card.Body>
              </Tab>

              {/* Tab 6: Helper B - Storefront */}
              <Tab eventKey="helper-b" title="🏪 Helper B">
                <Card.Body className="p-4">
                  <h4 className="fw-bold mb-3">
                    🏪 Helper B: ผู้สนับสนุนสภาพคล่อง (ซื้อสินทรัพย์)
                  </h4>
                  <p className="text-muted">
                    เข้าซื้อสินทรัพย์หลุดจำนำในราคาพิเศษ ช่วยระบบมีสภาพคล่อง
                  </p>

                  <Alert variant="success" className="mb-4">
                    <h5 className="fw-bold">
                      💰 ราคาพิเศษ (Time-Based Discount)
                    </h5>
                    <Row className="text-center">
                      <Col xs={6} md={3}>
                        <Badge bg="success" className="mb-2">
                          0-10 นาที
                        </Badge>
                        <h4 className="text-success">-8%</h4>
                        <small>ราคาต่ำสุด</small>
                      </Col>
                      <Col xs={6} md={3}>
                        <Badge bg="info" className="mb-2">
                          10-30 นาที
                        </Badge>
                        <h4 className="text-info">-6%</h4>
                      </Col>
                      <Col xs={6} md={3}>
                        <Badge bg="warning" className="mb-2">
                          30-60 นาที
                        </Badge>
                        <h4 className="text-warning">-3%</h4>
                      </Col>
                      <Col xs={6} md={3}>
                        <Badge bg="secondary" className="mb-2">
                          60+ นาที
                        </Badge>
                        <h4 className="text-secondary">ตลาด</h4>
                        <small>ราคาปกติ</small>
                      </Col>
                    </Row>
                  </Alert>

                  <Accordion>
                    <Accordion.Item eventKey="0">
                      <Accordion.Header>📋 หน้าที่</Accordion.Header>
                      <Accordion.Body>
                        <ul>
                          <li>เข้าซื้อสินทรัพย์หลุดจำนำจากร้านค้า</li>
                          <li>ให้สภาพคล่องแก่ระบบ</li>
                          <li>รับส่วนลดตามเวลาที่เข้าซื้อ</li>
                          <li>ช่วยให้ผู้กู้ได้ราคาดีที่สุด</li>
                        </ul>
                      </Accordion.Body>
                    </Accordion.Item>
                    <Accordion.Item eventKey="1">
                      <Accordion.Header>🛒 วิธีซื้อ</Accordion.Header>
                      <Accordion.Body>
                        <ol>
                          <li>ไปที่หน้า Storefront</li>
                          <li>เลือกสินทรัพย์ที่ต้องการ</li>
                          <li>จ่าย USDC ในราคาพิเศษ</li>
                          <li>รับสินทรัพย์ไปทันที</li>
                        </ol>
                      </Accordion.Body>
                    </Accordion.Item>
                  </Accordion>

                  <div className="text-center mt-4">
                    <Button variant="success" size="lg" href="/storefront">
                      <FiShoppingCart className="me-2" /> ไปหน้าร้านค้า
                    </Button>
                  </div>
                </Card.Body>
              </Tab>

              {/* Tab 7: Helper C */}
              <Tab eventKey="helper-c" title="✅ Helper C">
                <Card.Body className="p-4">
                  <h4 className="fw-bold mb-3">
                    ✅ Helper C: ผู้ดำเนินการจัดการ
                  </h4>
                  <p className="text-muted">
                    จัดการส่งต่อรายได้และปิดกระบวนการให้สมบูรณ์
                  </p>

                  <Alert variant="info" className="mb-4">
                    <h5 className="fw-bold">🎁 รางวัล</h5>
                    <h3 className="text-primary">1.0 USDC</h3>
                    <p>ต่อการดำเนินการ 1 ครั้ง</p>
                  </Alert>

                  <Accordion>
                    <Accordion.Item eventKey="0">
                      <Accordion.Header>📋 หน้าที่</Accordion.Header>
                      <Accordion.Body>
                        <ul>
                          <li>สรุปผลธุรกรรมของระบบ</li>
                          <li>สั่งงานระบบกระจายรายได้</li>
                          <li>จัดการส่งต่อเงินให้ผู้เกี่ยวข้อง</li>
                          <li>ปิดกระบวนการให้สมบูรณ์</li>
                        </ul>
                      </Accordion.Body>
                    </Accordion.Item>
                    <Accordion.Item eventKey="1">
                      <Accordion.Header>💵 ลำดับการจ่ายเงิน</Accordion.Header>
                      <Accordion.Body>
                        <ol>
                          <li>
                            <strong>Priority 1:</strong> จ่ายรางวัล Helper C
                            (1.0 USDC)
                          </li>
                          <li>
                            <strong>Priority 2:</strong> คืนเงินต้นเข้า Capital
                            Wallet
                          </li>
                          <li>
                            <strong>Priority 3:</strong> ส่วนเกินเป็นกำไร
                          </li>
                          <ul>
                            <li>10% → Capital Wallet (กองทุน)</li>
                            <li>24.75% → ทีมงาน</li>
                            <li>65.25% → ผู้สนับสนุน (Stakers)</li>
                          </ul>
                        </ol>
                      </Accordion.Body>
                    </Accordion.Item>
                  </Accordion>
                </Card.Body>
              </Tab>

              {/* Tab 8: Risk Warning */}
              <Tab eventKey="risks" title="⚠️ ความเสี่ยง">
                <Card.Body className="p-4">
                  <h4 className="fw-bold mb-3">⚠️ ความเสี่ยงและข้อควรรู้</h4>

                  <Alert variant="danger" className="mb-4">
                    <h5 className="fw-bold">🔴 ความเสี่ยงหลัก</h5>
                    <ul>
                      <li>
                        <strong>Dual Protection System:</strong>
                        <ul>
                          <li>Maturity Grace Period: 72 ชม. (หลังครบกำหนด)</li>
                          <li>
                            Immediate Price Protection: ทันที เมื่อ HF &lt; 100%
                          </li>
                        </ul>
                      </li>
                      <li>
                        <strong>Shield Fee:</strong> 5% หากถอนก่อน 15 วัน
                      </li>
                      <li>
                        <strong>Smart Contract Risk:</strong> อาจมี bug
                      </li>
                      <li>
                        <strong>Price Risk:</strong> ราคาคริปโตผันผวน
                      </li>
                    </ul>
                  </Alert>

                  <Row>
                    <Col md={6}>
                      <Card className="bg-light">
                        <Card.Header>
                          <h6 className="mb-0">🌿 ผู้สนับสนุน</h6>
                        </Card.Header>
                        <Card.Body>
                          <ul>
                            <li>Shield Fee 5% (ถอนก่อน 15 วัน)</li>
                            <li>Impermanent Loss (ถ้าราคา USDC ขึ้น)</li>
                            <li>Smart Contract Risk</li>
                          </ul>
                        </Card.Body>
                      </Card>
                    </Col>
                    <Col md={6}>
                      <Card className="bg-light">
                        <Card.Header>
                          <h6 className="mb-0">🛡️ ผู้ช่วยเหลือ</h6>
                        </Card.Header>
                        <Card.Body>
                          <ul>
                            <li>Gas Fee (ต้องจ่ายเพื่อทำธุรกรรม)</li>
                            <li>Competition (คนอื่นอาจมาก่อน)</li>
                            <li>Oracle Risk (ราคาอาจไม่แม่นยำ)</li>
                          </ul>
                        </Card.Body>
                      </Card>
                    </Col>
                  </Row>

                  <Alert variant="warning" className="mt-4">
                    <FiAlertTriangle className="me-2" />
                    <strong>สำคัญ:</strong> ทุกการลงทุนมีความเสี่ยง
                    ศึกษาข้อมูลให้ดีก่อนตัดสินใจ
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
