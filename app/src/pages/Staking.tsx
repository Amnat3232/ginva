import {
  Container,
  Card,
  Button,
  Stack,
  Row,
  Col,
  Badge,
  Alert,
  ProgressBar,
} from "react-bootstrap";
import {
  FiTrendingUp,
  FiTrendingDown,
  FiShield,
  FiAlertTriangle,
  FiClock,
} from "react-icons/fi";
import { useState } from "react";

const Staking = () => {
  const [activeTab, setActiveTab] = useState<"stake" | "unstake">("stake");
  const [stakeAmount, setStakeAmount] = useState("");
  const [unstakeAmount, setUnstakeAmount] = useState("");

  // Mock data - ในอนาคตจะดึงจาก Smart Contract
  const stakingData = {
    userStaked: 10000,
    availableToUnstake: 10000,
    currentAPY: 8.5,
    earnedRewards: 125.5,
    lastDepositTime: Date.now() - 10 * 24 * 60 * 60 * 1000, // 10 วันที่แล้ว
    systemReserves: 350000, // 350K USDC (ยังไม่ถึง 500K)
    targetReserves: 500000,
    protectionPeriod: 15, // 15 วัน
    exitFeeBps: 500, // 5%
  };

  // คำนวณเวลาที่เหลือก่อนฟรี
  const calculateTimeRemaining = () => {
    const now = Date.now();
    const depositTime = stakingData.lastDepositTime;
    const protectionMs = stakingData.protectionPeriod * 24 * 60 * 60 * 1000;
    const endTime = depositTime + protectionMs;
    const remaining = endTime - now;

    if (remaining <= 0) return { days: 0, hours: 0, isFree: true };

    const days = Math.floor(remaining / (1000 * 60 * 60 * 24));
    const hours = Math.floor(
      (remaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
    );

    return { days, hours, isFree: false };
  };

  const timeRemaining = calculateTimeRemaining();
  const isSystemSafe = stakingData.systemReserves >= stakingData.targetReserves;

  // คำนวณค่าธรรมเนียม
  const calculateFee = () => {
    const amount = parseFloat(unstakeAmount) || 0;
    if (isSystemSafe || timeRemaining.isFree) return 0;
    return amount * (stakingData.exitFeeBps / 10000);
  };

  const feeAmount = calculateFee();
  const receiveAmount = (parseFloat(unstakeAmount) || 0) - feeAmount;
  const progressPercent =
    (stakingData.systemReserves / stakingData.targetReserves) * 100;

  return (
    <Container>
      <Stack direction="vertical" gap={3} className="mb-4">
        <div className="d-flex justify-content-between align-items-center">
          <div>
            <h1>Ginva Staking</h1>
            <p className="text-muted">
              Stake USDC to earn yield and support the protocol
            </p>
          </div>
          <Badge bg="success" className="fs-6 px-3 py-2">
            <FiTrendingUp className="me-2" />
            {stakingData.currentAPY}% APY
          </Badge>
        </div>
      </Stack>

      {/* Shield Fee Status Card */}
      <Card className="mb-4 border-warning">
        <Card.Header className="bg-warning bg-opacity-10">
          <h5 className="mb-0">
            <FiShield className="me-2 text-warning" />
            🛡️ Shield Fee Protection Status
          </h5>
        </Card.Header>
        <Card.Body>
          <Row>
            <Col md={6}>
              <div className="mb-3">
                <small className="text-muted">System Reserves Progress</small>
                <ProgressBar
                  now={progressPercent}
                  variant={isSystemSafe ? "success" : "warning"}
                  className="mt-2"
                  style={{ height: "25px" }}
                />
                <div className="d-flex justify-content-between mt-1">
                  <small>
                    {stakingData.systemReserves.toLocaleString()} USDC
                  </small>
                  <small>
                    Target: {stakingData.targetReserves.toLocaleString()} USDC
                  </small>
                </div>
              </div>
            </Col>
            <Col md={6}>
              <div className="d-flex justify-content-between align-items-center h-100">
                <div>
                  <small className="text-muted">Current Status</small>
                  <div className="mt-1">
                    {isSystemSafe ? (
                      <Badge bg="success" className="fs-6">
                        <FiShield className="me-1" />
                        Freedom Mode - 0% Fee
                      </Badge>
                    ) : (
                      <Badge bg="warning" className="fs-6 text-dark">
                        <FiAlertTriangle className="me-1" />
                        Bootstrapping Phase - 5% Early Exit Fee
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </Col>
          </Row>

          <Alert variant="info" className="mt-3 mb-0">
            <small>
              <strong>How Shield Fee Works:</strong> If you unstake within 15
              days of your last deposit while reserves are below 500K USDC, a 5%
              fee will be charged to the Reserve Pool. This protects the
              protocol during bootstrapping phase.
            </small>
          </Alert>
        </Card.Body>
      </Card>

      {/* Main Staking Interface */}
      <Row>
        <Col lg={8}>
          <Card>
            <Card.Header>
              <div className="d-flex gap-2">
                <Button
                  variant={
                    activeTab === "stake" ? "primary" : "outline-primary"
                  }
                  onClick={() => setActiveTab("stake")}
                  className="flex-fill"
                >
                  <FiTrendingUp className="me-2" />
                  Stake
                </Button>
                <Button
                  variant={
                    activeTab === "unstake" ? "primary" : "outline-primary"
                  }
                  onClick={() => setActiveTab("unstake")}
                  className="flex-fill"
                >
                  <FiTrendingDown className="me-2" />
                  Unstake
                </Button>
              </div>
            </Card.Header>
            <Card.Body>
              {activeTab === "stake" ? (
                <Stack gap={3}>
                  <div>
                    <label className="form-label">Amount to Stake (USDC)</label>
                    <input
                      type="number"
                      className="form-control form-control-lg"
                      placeholder="0.00"
                      value={stakeAmount}
                      onChange={(e) => setStakeAmount(e.target.value)}
                    />
                    <small className="text-muted">Available: 50,000 USDC</small>
                  </div>

                  <div className="bg-light p-3 rounded">
                    <div className="d-flex justify-content-between mb-2">
                      <span>Current APY:</span>
                      <strong className="text-success">
                        {stakingData.currentAPY}%
                      </strong>
                    </div>
                    <div className="d-flex justify-content-between">
                      <span>Estimated Daily Reward:</span>
                      <strong>
                        {stakeAmount
                          ? (
                              (parseFloat(stakeAmount) *
                                stakingData.currentAPY) /
                              100 /
                              365
                            ).toFixed(2)
                          : "0.00"}{" "}
                        USDC
                      </strong>
                    </div>
                  </div>

                  <Alert variant="info" className="d-flex align-items-center">
                    <FiShield className="me-2 flex-shrink-0" />
                    <small>
                      Your deposit will be protected by the Shield Fee
                      mechanism. If you unstake within 15 days while reserves
                      are below 500K, a 5% fee applies.
                    </small>
                  </Alert>

                  <Button variant="success" size="lg">
                    <FiTrendingUp className="me-2" />
                    Stake USDC
                  </Button>
                </Stack>
              ) : (
                <Stack gap={3}>
                  <div>
                    <label className="form-label">
                      Amount to Unstake (USDC)
                    </label>
                    <input
                      type="number"
                      className="form-control form-control-lg"
                      placeholder="0.00"
                      value={unstakeAmount}
                      onChange={(e) => setUnstakeAmount(e.target.value)}
                      max={stakingData.availableToUnstake}
                    />
                    <small className="text-muted">
                      Available:{" "}
                      {stakingData.availableToUnstake.toLocaleString()} USDC
                    </small>
                  </div>

                  {/* Shield Fee Warning */}
                  {!isSystemSafe && !timeRemaining.isFree && (
                    <Alert variant="danger" className="border-danger border-2">
                      <div className="d-flex align-items-start">
                        <FiAlertTriangle
                          className="me-2 mt-1 flex-shrink-0"
                          size={24}
                        />
                        <div>
                          <strong
                            className="d-block mb-1"
                            style={{ fontSize: "1.1rem" }}
                          >
                            ⚠️ ถอนตอนนี้โดนปรับ 5%!
                          </strong>
                          <p className="mb-2">
                            คุณจะถูกหักค่าธรรมเนียม{" "}
                            <strong>{feeAmount.toFixed(2)} USDC</strong> (5%)
                            เข้ากองทุนสำรอง เพราะ:
                          </p>
                          <ul className="mb-2">
                            <li>
                              ระบบกำลังอยู่ในช่วง Bootstrapping (Reserves
                              ยังไม่ถึง 500K)
                            </li>
                            <li>
                              คุณฝากมายังไม่ครบ 15 วัน (เหลืออีก{" "}
                              {timeRemaining.days} วัน {timeRemaining.hours}{" "}
                              ชั่วโมง)
                            </li>
                          </ul>
                          <div className="bg-white bg-opacity-25 p-2 rounded mt-2">
                            <small>
                              <strong>💡 คำแนะนำ:</strong> รออีก{" "}
                              {timeRemaining.days} วัน {timeRemaining.hours}{" "}
                              ชั่วโมง จะถอนฟรี 0%!
                            </small>
                          </div>
                        </div>
                      </div>
                    </Alert>
                  )}

                  {/* Free Withdrawal Notice */}
                  {(isSystemSafe || timeRemaining.isFree) && unstakeAmount && (
                    <Alert variant="success">
                      <FiShield className="me-2" />
                      <strong>ถอนฟรี 0%!</strong>
                      {isSystemSafe
                        ? " ระบบอยู่ใน Freedom Mode (Reserves ≥ 500K)"
                        : " คุณอยู่ครบ 15 วันแล้ว"}
                    </Alert>
                  )}

                  <div className="bg-light p-3 rounded">
                    <div className="d-flex justify-content-between mb-2">
                      <span>Amount to Unstake:</span>
                      <strong>{parseFloat(unstakeAmount) || 0} USDC</strong>
                    </div>
                    <div className="d-flex justify-content-between mb-2 text-danger">
                      <span>Shield Fee (5%):</span>
                      <strong>-{feeAmount.toFixed(2)} USDC</strong>
                    </div>
                    <hr />
                    <div className="d-flex justify-content-between">
                      <span className="fs-5">You Will Receive:</span>
                      <strong className="fs-5 text-success">
                        {receiveAmount.toFixed(2)} USDC
                      </strong>
                    </div>
                  </div>

                  <Button
                    variant={feeAmount > 0 ? "warning" : "success"}
                    size="lg"
                    className={feeAmount > 0 ? "text-dark" : ""}
                  >
                    <FiTrendingDown className="me-2" />
                    {feeAmount > 0
                      ? `Unstake (Pay ${feeAmount.toFixed(2)} USDC Fee)`
                      : "Unstake (No Fee)"}
                  </Button>
                </Stack>
              )}
            </Card.Body>
          </Card>
        </Col>

        <Col lg={4}>
          <Card className="mb-3">
            <Card.Header>
              <h5>Your Staking Stats</h5>
            </Card.Header>
            <Card.Body>
              <Stack gap={3}>
                <div className="d-flex justify-content-between align-items-center">
                  <span className="text-muted">Total Staked</span>
                  <strong className="fs-5">
                    {stakingData.userStaked.toLocaleString()} USDC
                  </strong>
                </div>
                <div className="d-flex justify-content-between align-items-center">
                  <span className="text-muted">Earned Rewards</span>
                  <strong className="text-success">
                    +{stakingData.earnedRewards} USDC
                  </strong>
                </div>
                <div className="d-flex justify-content-between align-items-center">
                  <span className="text-muted">Current APY</span>
                  <Badge bg="success">{stakingData.currentAPY}%</Badge>
                </div>
                <hr />
                <div>
                  <small className="text-muted d-block mb-1">
                    Last Deposit
                  </small>
                  <div className="d-flex align-items-center">
                    <FiClock className="me-2 text-muted" />
                    <span>10 days ago</span>
                  </div>
                  {!timeRemaining.isFree && (
                    <div className="mt-2 p-2 bg-warning bg-opacity-10 rounded">
                      <small className="text-warning">
                        <FiAlertTriangle className="me-1" />
                        Shield Fee active for {timeRemaining.days} more days
                      </small>
                    </div>
                  )}
                </div>
              </Stack>
            </Card.Body>
          </Card>

          <Card className="bg-light">
            <Card.Header>
              <h6 className="mb-0">📚 How Shield Fee Works</h6>
            </Card.Header>
            <Card.Body>
              <Stack gap={2} className="small">
                <div className="d-flex gap-2">
                  <Badge bg="success">1</Badge>
                  <span>
                    <strong>Freedom Mode:</strong> When reserves ≥ 500K USDC,
                    unstake is always free 0%
                  </span>
                </div>
                <div className="d-flex gap-2">
                  <Badge bg="warning" text="dark">
                    2
                  </Badge>
                  <span>
                    <strong>Protection Period:</strong> During bootstrapping,
                    wait 15 days after deposit to avoid fee
                  </span>
                </div>
                <div className="d-flex gap-2">
                  <Badge bg="danger">3</Badge>
                  <span>
                    <strong>Early Exit Fee:</strong> 5% fee applies if you
                    unstake early during bootstrapping
                  </span>
                </div>
                <div className="d-flex gap-2">
                  <Badge bg="info">4</Badge>
                  <span>
                    <strong>Fee Usage:</strong> All fees go to Reserve Pool (not
                    dev wallet) to strengthen protocol
                  </span>
                </div>
              </Stack>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default Staking;
