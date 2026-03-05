import {
  Container,
  Card,
  Button,
  Form,
  Row,
  Col,
  Alert,
  Badge,
  Tabs,
  Tab,
  Table,
  Spinner,
  Modal,
  Stack,
} from "react-bootstrap";
import {
  FiShield,
  FiSettings,
  FiPercent,
  FiDollarSign,
  FiAlertTriangle,
  FiCheckCircle,
  FiPause,
  FiPlay,
  FiUser,
  FiActivity,
} from "react-icons/fi";
import { useState, useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useGinvaProgram } from "../hooks/useGinvaProgram";
import { showSuccess, showError } from "../utils/helpers";
import * as anchor from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";

interface SystemStats {
  totalBorrowed: number;
  totalCollateral: number;
  totalStaked: number;
  depositFeeBps: number;
  baseInterestRate: number;
  maxInterestRate: number;
  ltvSafe: number;
  ltvStandard: number;
  ltvMax: number;
  isPaused: boolean;
  pausedAt: number;
  opsResumeAt: number;
  liquidationTimeout: number;
  autoSwapReward: number;
}

const Admin = () => {
  const { publicKey, connected } = useWallet();
  const { program } = useGinvaProgram();
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [showPauseModal, setShowPauseModal] = useState(false);

  // Form states
  const [protocolConfig, setProtocolConfig] = useState({
    liquidationTimeout: 259200,
    autoSwapRewardBps: 800,
    distributeRewardBps: 100,
    minLoanSize: 1000000,
    maxLoanSize: 1000000000000,
  });

  const [opsWallet, setOpsWallet] = useState("");

  const [newAsset, setNewAsset] = useState({
    mint: "",
    feedId: "",
    maxLtv: 60,
    liquidationThreshold: 70,
  });

  // Fetch system stats
  useEffect(() => {
    const fetchStats = async () => {
      if (!program) return;
      try {
        const systemConfigPda = PublicKey.findProgramAddressSync(
          [Buffer.from("config")],
          program.programId
        )[0];
        const protocolConfigPda = PublicKey.findProgramAddressSync(
          [Buffer.from("protocol_config")],
          program.programId
        )[0];

        const systemConfig = await program.account.systemConfig.fetch(
          systemConfigPda
        );
        const protocolConfig = await program.account.protocolConfig.fetch(
          protocolConfigPda
        );

        setStats({
          totalBorrowed: systemConfig.totalBorrowed.toNumber(),
          totalCollateral: systemConfig.totalCollateral.toNumber(),
          totalStaked: systemConfig.totalStaked.toNumber(),
          depositFeeBps: systemConfig.depositFeeBps,
          baseInterestRate: systemConfig.baseInterestRateBps,
          maxInterestRate: systemConfig.maxInterestRateBps,
          ltvSafe: systemConfig.ltvSafePercentage,
          ltvStandard: systemConfig.ltvStandardPercentage,
          ltvMax: systemConfig.ltvMaxPercentage,
          isPaused: systemConfig.isPaused,
          pausedAt: systemConfig.pausedAt.toNumber(),
          opsResumeAt: systemConfig.opsResumeAt.toNumber(),
          liquidationTimeout: protocolConfig.liquidationTimeout.toNumber(),
          autoSwapReward: protocolConfig.autoSwapRewardBps.toNumber(),
        });

        // Update form values
        setProtocolConfig({
          liquidationTimeout: protocolConfig.liquidationTimeout.toNumber(),
          autoSwapRewardBps: protocolConfig.autoSwapRewardBps.toNumber(),
          distributeRewardBps: protocolConfig.distributeRewardBps.toNumber(),
          minLoanSize: protocolConfig.minLoanSize.toNumber(),
          maxLoanSize: protocolConfig.maxLoanSize.toNumber(),
        });

        setOpsWallet(systemConfig.opsWallet.toString());
      } catch (error) {
        console.error("Error fetching stats:", error);
      }
    };

    fetchStats();
  }, [program]);

  // Update Protocol Config
  const handleUpdateProtocolConfig = async () => {
    if (!connected || !program || !publicKey) {
      showError("Wallet Not Connected");
      return;
    }

    setLoading(true);
    try {
      const protocolConfigPda = PublicKey.findProgramAddressSync(
        [Buffer.from("protocol_config")],
        program.programId
      )[0];

      await program.methods
        .updateProtocolConfig(
          new anchor.BN(protocolConfig.liquidationTimeout),
          new anchor.BN(protocolConfig.autoSwapRewardBps),
          new anchor.BN(protocolConfig.distributeRewardBps),
          new anchor.BN(protocolConfig.minLoanSize),
          new anchor.BN(protocolConfig.maxLoanSize)
        )
        .accounts({
          admin: publicKey,
          protocolConfig: protocolConfigPda,
        })
        .rpc();

      showSuccess("Protocol Config Updated!");
    } catch (error: any) {
      showError("Update Failed", error.message);
    } finally {
      setLoading(false);
    }
  };

  // Validate Solana address format
  const isValidSolanaAddress = (address: string): boolean => {
    try {
      new PublicKey(address);
      return true;
    } catch {
      return false;
    }
  };

  // Update Ops Wallet
  const handleUpdateOpsWallet = async () => {
    if (!connected || !program || !publicKey) {
      showError("Wallet Not Connected");
      return;
    }

    if (!opsWallet || !isValidSolanaAddress(opsWallet)) {
      showError(
        "Invalid Address",
        "Please enter a valid Solana wallet address"
      );
      return;
    }

    setLoading(true);
    try {
      const systemConfigPda = PublicKey.findProgramAddressSync(
        [Buffer.from("config")],
        program.programId
      )[0];

      await program.methods
        .updateOpsWallet(new PublicKey(opsWallet))
        .accounts({
          admin: publicKey,
          systemConfig: systemConfigPda,
        })
        .rpc();

      showSuccess("Ops Wallet Updated!");
    } catch (error: any) {
      showError("Update Failed", error.message);
    } finally {
      setLoading(false);
    }
  };

  // Emergency Pause
  const handleEmergencyPause = async () => {
    if (!connected || !program || !publicKey) {
      showError("Wallet Not Connected");
      return;
    }

    setLoading(true);
    try {
      const systemConfigPda = PublicKey.findProgramAddressSync(
        [Buffer.from("config")],
        program.programId
      )[0];

      await program.methods
        .emergencyPause()
        .accounts({
          admin: publicKey,
          systemConfig: systemConfigPda,
        })
        .rpc();

      showSuccess("Protocol Paused!", "All transactions are now blocked.");
      setShowPauseModal(false);
      // Refresh stats
      window.location.reload();
    } catch (error: any) {
      showError("Pause Failed", error.message);
    } finally {
      setLoading(false);
    }
  };

  // Emergency Resume
  const handleEmergencyResume = async () => {
    if (!connected || !program || !publicKey) {
      showError("Wallet Not Connected");
      return;
    }

    setLoading(true);
    try {
      const systemConfigPda = PublicKey.findProgramAddressSync(
        [Buffer.from("config")],
        program.programId
      )[0];

      await program.methods
        .emergencyResume()
        .accounts({
          admin: publicKey,
          systemConfig: systemConfigPda,
        })
        .rpc();

      showSuccess(
        "Protocol Resumed!",
        "Operations will resume after 48-hour timelock."
      );
      // Refresh stats
      window.location.reload();
    } catch (error: any) {
      showError("Resume Failed", error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className="py-4">
      {/* Header */}
      <Stack direction="vertical" gap={3} className="mb-4">
        <div className="d-flex justify-content-between align-items-center">
          <h1>
            <FiShield className="me-2 text-danger" />
            Admin Dashboard
          </h1>
          <Badge bg="danger" className="fs-6">
            <FiUser className="me-1" />
            Admin Access
          </Badge>
        </div>
        <p className="text-muted">
          Manage protocol parameters, interest rates, and emergency controls.
          Use with caution.
        </p>

        {/* Protocol Status */}
        {stats && (
          <Alert
            variant={stats.isPaused ? "danger" : "success"}
            className="mb-0"
          >
            <div className="d-flex align-items-center justify-content-between">
              <div>
                <strong>Protocol Status:</strong>{" "}
                {stats.isPaused ? (
                  <span className="text-danger">
                    <FiPause className="me-1" />
                    PAUSED
                  </span>
                ) : (
                  <span className="text-success">
                    <FiPlay className="me-1" />
                    ACTIVE
                  </span>
                )}
              </div>
              <div>
                {stats.isPaused ? (
                  <Button
                    variant="success"
                    size="sm"
                    onClick={handleEmergencyResume}
                    disabled={loading}
                  >
                    <FiPlay className="me-1" />
                    Resume Protocol
                  </Button>
                ) : (
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => setShowPauseModal(true)}
                    disabled={loading}
                  >
                    <FiPause className="me-1" />
                    Emergency Pause
                  </Button>
                )}
              </div>
            </div>
          </Alert>
        )}
      </Stack>

      {/* Stats Overview */}
      {stats && (
        <Row className="mb-4 g-3">
          <Col md={3}>
            <Card className="h-100">
              <Card.Body>
                <div className="d-flex align-items-center justify-content-between">
                  <div>
                    <h6 className="text-muted">Total Borrowed</h6>
                    <h3 className="mb-0">
                      {(stats.totalBorrowed / 1e6).toFixed(2)} USDC
                    </h3>
                  </div>
                  <FiDollarSign size={32} className="text-primary" />
                </div>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="h-100">
              <Card.Body>
                <div className="d-flex align-items-center justify-content-between">
                  <div>
                    <h6 className="text-muted">Total Collateral</h6>
                    <h3 className="mb-0">
                      {(stats.totalCollateral / 1e9).toFixed(4)} SOL
                    </h3>
                  </div>
                  <FiActivity size={32} className="text-success" />
                </div>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="h-100">
              <Card.Body>
                <div className="d-flex align-items-center justify-content-between">
                  <div>
                    <h6 className="text-muted">Total Staked</h6>
                    <h3 className="mb-0">
                      {(stats.totalStaked / 1e6).toFixed(2)} USDC
                    </h3>
                  </div>
                  <FiPercent size={32} className="text-info" />
                </div>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="h-100">
              <Card.Body>
                <div className="d-flex align-items-center justify-content-between">
                  <div>
                    <h6 className="text-muted">Deposit Fee</h6>
                    <h3 className="mb-0">
                      {(stats.depositFeeBps / 100).toFixed(2)}%
                    </h3>
                  </div>
                  <FiSettings size={32} className="text-warning" />
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}

      {/* Management Tabs */}
      <Card>
        <Card.Header>
          <Tabs
            activeKey={activeTab}
            onSelect={(k) => setActiveTab(k || "overview")}
            className="border-0"
          >
            <Tab eventKey="overview" title="Current Settings" />
            <Tab eventKey="protocol" title="Protocol Config" />
            <Tab eventKey="wallet" title="Ops Wallet" />
            <Tab eventKey="assets" title="Asset Management" />
          </Tabs>
        </Card.Header>
        <Card.Body>
          {/* Overview Tab */}
          {activeTab === "overview" && stats && (
            <Table striped bordered hover>
              <thead>
                <tr>
                  <th>Parameter</th>
                  <th>Current Value</th>
                  <th>Description</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Base Interest Rate</td>
                  <td>
                    <Badge bg="primary">
                      {(stats.baseInterestRate / 100).toFixed(2)}%
                    </Badge>
                  </td>
                  <td>Current borrowing rate for all loans</td>
                </tr>
                <tr>
                  <td>Max Interest Rate</td>
                  <td>
                    <Badge bg="warning" text="dark">
                      {(stats.maxInterestRate / 100).toFixed(2)}%
                    </Badge>
                  </td>
                  <td>Maximum allowed interest rate</td>
                </tr>
                <tr>
                  <td>LTV Safe</td>
                  <td>
                    <Badge bg="success">{stats.ltvSafe}%</Badge>
                  </td>
                  <td>Safe borrowing level (Low risk)</td>
                </tr>
                <tr>
                  <td>LTV Standard</td>
                  <td>
                    <Badge bg="info">{stats.ltvStandard}%</Badge>
                  </td>
                  <td>Standard borrowing level</td>
                </tr>
                <tr>
                  <td>LTV Max</td>
                  <td>
                    <Badge bg="danger">{stats.ltvMax}%</Badge>
                  </td>
                  <td>Maximum borrowing level (High risk)</td>
                </tr>
                <tr>
                  <td>Liquidation Timeout</td>
                  <td>{(stats.liquidationTimeout / 3600).toFixed(0)} hours</td>
                  <td>Protection period before liquidation</td>
                </tr>
                <tr>
                  <td>Auto Swap Reward</td>
                  <td>{(stats.autoSwapReward / 100).toFixed(2)}%</td>
                  <td>Discount for storefront buyers</td>
                </tr>
                <tr>
                  <td>Ops Wallet</td>
                  <td>
                    <code className="small">
                      {opsWallet.slice(0, 12)}...{opsWallet.slice(-12)}
                    </code>
                  </td>
                  <td>Team operations wallet</td>
                </tr>
              </tbody>
            </Table>
          )}

          {/* Protocol Config Tab */}
          {activeTab === "protocol" && (
            <Form>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Liquidation Timeout (seconds)</Form.Label>
                    <Form.Control
                      type="number"
                      value={protocolConfig.liquidationTimeout}
                      onChange={(e) =>
                        setProtocolConfig({
                          ...protocolConfig,
                          liquidationTimeout: parseInt(e.target.value),
                        })
                      }
                    />
                    <Form.Text className="text-muted">
                      Default: 259200 (72 hours)
                    </Form.Text>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Auto Swap Reward (bps)</Form.Label>
                    <Form.Control
                      type="number"
                      value={protocolConfig.autoSwapRewardBps}
                      onChange={(e) =>
                        setProtocolConfig({
                          ...protocolConfig,
                          autoSwapRewardBps: parseInt(e.target.value),
                        })
                      }
                    />
                    <Form.Text className="text-muted">
                      Default: 800 (8%). Max: 10000 (100%)
                    </Form.Text>
                  </Form.Group>
                </Col>
              </Row>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Distribute Reward (bps)</Form.Label>
                    <Form.Control
                      type="number"
                      value={protocolConfig.distributeRewardBps}
                      onChange={(e) =>
                        setProtocolConfig({
                          ...protocolConfig,
                          distributeRewardBps: parseInt(e.target.value),
                        })
                      }
                    />
                    <Form.Text className="text-muted">
                      Default: 100 (1%). Max: 10000 (100%)
                    </Form.Text>
                  </Form.Group>
                </Col>
              </Row>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>
                      Min Loan Size (USDC units, 6 decimals)
                    </Form.Label>
                    <Form.Control
                      type="number"
                      value={protocolConfig.minLoanSize}
                      onChange={(e) =>
                        setProtocolConfig({
                          ...protocolConfig,
                          minLoanSize: parseInt(e.target.value),
                        })
                      }
                    />
                    <Form.Text className="text-muted">
                      Default: 1000000 (1 USDC)
                    </Form.Text>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>
                      Max Loan Size (USDC units, 6 decimals)
                    </Form.Label>
                    <Form.Control
                      type="number"
                      value={protocolConfig.maxLoanSize}
                      onChange={(e) =>
                        setProtocolConfig({
                          ...protocolConfig,
                          maxLoanSize: parseInt(e.target.value),
                        })
                      }
                    />
                    <Form.Text className="text-muted">
                      Default: 1000000000000 (1M USDC)
                    </Form.Text>
                  </Form.Group>
                </Col>
              </Row>
              <Button
                variant="primary"
                onClick={handleUpdateProtocolConfig}
                disabled={loading}
              >
                {loading ? (
                  <Spinner animation="border" size="sm" className="me-2" />
                ) : (
                  <FiCheckCircle className="me-2" />
                )}
                Update Protocol Config
              </Button>
            </Form>
          )}

          {/* Ops Wallet Tab */}
          {activeTab === "wallet" && (
            <Form>
              <Alert variant="warning">
                <FiAlertTriangle className="me-2" />
                Warning: Changing the ops wallet will redirect all fees to the
                new address. Make sure you have control of this wallet.
              </Alert>
              <Form.Group className="mb-3">
                <Form.Label>Operations Wallet Address</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Enter Solana wallet address"
                  value={opsWallet}
                  onChange={(e) => setOpsWallet(e.target.value)}
                />
                <Form.Text className="text-muted">
                  Current: {opsWallet.slice(0, 20)}...{opsWallet.slice(-20)}
                </Form.Text>
              </Form.Group>
              <Button
                variant="warning"
                onClick={handleUpdateOpsWallet}
                disabled={loading || !opsWallet}
              >
                {loading ? (
                  <Spinner animation="border" size="sm" className="me-2" />
                ) : (
                  <FiCheckCircle className="me-2" />
                )}
                Update Ops Wallet
              </Button>
            </Form>
          )}

          {/* Asset Management Tab */}
          {activeTab === "assets" && (
            <div>
              <Alert variant="info">
                <FiSettings className="me-2" />
                Asset management allows you to add new collateral types or
                update existing ones.
              </Alert>
              <Card className="mb-3">
                <Card.Header>Add New Asset</Card.Header>
                <Card.Body>
                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Asset Mint Address</Form.Label>
                        <Form.Control
                          type="text"
                          placeholder="Token mint address"
                          value={newAsset.mint}
                          onChange={(e) =>
                            setNewAsset({ ...newAsset, mint: e.target.value })
                          }
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Pyth Feed ID (hex)</Form.Label>
                        <Form.Control
                          type="text"
                          placeholder="0x..."
                          value={newAsset.feedId}
                          onChange={(e) =>
                            setNewAsset({ ...newAsset, feedId: e.target.value })
                          }
                        />
                      </Form.Group>
                    </Col>
                  </Row>
                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Max LTV (%)</Form.Label>
                        <Form.Control
                          type="number"
                          value={newAsset.maxLtv}
                          onChange={(e) =>
                            setNewAsset({
                              ...newAsset,
                              maxLtv: parseInt(e.target.value),
                            })
                          }
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Liquidation Threshold (%)</Form.Label>
                        <Form.Control
                          type="number"
                          value={newAsset.liquidationThreshold}
                          onChange={(e) =>
                            setNewAsset({
                              ...newAsset,
                              liquidationThreshold: parseInt(e.target.value),
                            })
                          }
                        />
                      </Form.Group>
                    </Col>
                  </Row>
                  <Button variant="primary" disabled>
                    <FiCheckCircle className="me-2" />
                    Add Asset (Coming Soon)
                  </Button>
                </Card.Body>
              </Card>
            </div>
          )}
        </Card.Body>
      </Card>

      {/* Emergency Pause Modal */}
      <Modal show={showPauseModal} onHide={() => setShowPauseModal(false)}>
        <Modal.Header closeButton className="bg-danger text-white">
          <Modal.Title>
            <FiAlertTriangle className="me-2" />
            Emergency Protocol Pause
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Alert variant="danger">
            <strong>Warning:</strong> This will immediately pause all protocol
            operations. Only use in emergency situations such as:
            <ul className="mt-2">
              <li>Detected security vulnerability</li>
              <li>Oracle manipulation attack</li>
              <li>Smart contract bug</li>
              <li>Other critical issues</li>
            </ul>
          </Alert>
          <p>
            All transactions including deposits, borrows, and liquidations will
            be blocked until you manually resume the protocol.
          </p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowPauseModal(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleEmergencyPause}>
            <FiPause className="me-2" />
            Confirm Pause
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default Admin;
