import {
  Container,
  Card,
  Button,
  Table,
  Badge,
  Alert,
  Spinner,
  Stack,
  Row,
  Col,
  Form,
  Tabs,
  Tab,
  InputGroup,
} from "react-bootstrap";
import {
  FiUser,
  FiSettings,
  FiActivity,
  FiDollarSign,
  FiClock,
  FiShield,
  FiCheck,
  FiX,
  FiRefreshCw,
  FiPower,
} from "react-icons/fi";
import { useState, useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { Connection, PublicKey } from "@solana/web3.js";
import { useGinvaProgram } from "../hooks/useGinvaProgram";
import { showSuccess, showError, showInfo } from "../utils/helpers";
import {
  AgentAccount,
  AgentRevenueDistribution,
  AgentStatus,
  AGENT_STATUS_LABELS,
  AGENT_ROLE_LABELS,
  AGENT_REVENUE_SHARE,
  AGENT_PERFORMANCE_THRESHOLDS,
} from "../types";

const Agent = () => {
  const { publicKey, connected, sendTransaction } = useWallet();
  const { program, connection } = useGinvaProgram();
  const [agentAccount, setAgentAccount] = useState<AgentAccount | null>(null);
  const [revenueDistribution, setRevenueDistribution] =
    useState<AgentRevenueDistribution | null>(null);
  const [loading, setLoading] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [claiming, setClaiming] = useState(false);

  // Form state
  const [agentName, setAgentName] = useState("");
  const [agentDescription, setAgentDescription] = useState("");
  const [agentFramework, setAgentFramework] = useState("LangGraph");

  // Fetch agent account
  const fetchAgentAccount = async () => {
    if (!program || !publicKey) return;
    setLoading(true);
    try {
      const [agentPDA] = await PublicKey.findProgramAddress(
        [Buffer.from("agent"), publicKey.toBuffer()],
        program.programId
      );
      const agent = await program.account.agentAccount.fetch(agentPDA);
      setAgentAccount({ pubkey: agentPDA, account: agent } as AgentAccount);

      // Fetch revenue distribution
      const [revenuePDA] = await PublicKey.findProgramAddress(
        [Buffer.from("agent_revenue")],
        program.programId
      );
      try {
        const revenue = await program.account.agentRevenueDistribution.fetch(
          revenuePDA
        );
        setRevenueDistribution({
          pubkey: revenuePDA,
          account: revenue,
        } as AgentRevenueDistribution);
      } catch {
        setRevenueDistribution(null);
      }
    } catch (error) {
      setAgentAccount(null);
      setRevenueDistribution(null);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (program && publicKey) {
      fetchAgentAccount();
    }
  }, [program, publicKey]);

  // Register new agent
  const handleRegister = async () => {
    if (!program || !publicKey) {
      showError("Please connect your wallet first");
      return;
    }

    if (!agentName.trim()) {
      showError("Please enter agent name");
      return;
    }

    setRegistering(true);
    try {
      const [agentPDA] = await PublicKey.findProgramAddress(
        [Buffer.from("agent"), publicKey.toBuffer()],
        program.programId
      );

      // Get USDC account
      const usdcMint = new PublicKey(
        "EPjFWdd5AufqSSqeM2qN1xzybapC8goYuKWJ7rLiyYj"
      );
      const userUsdcAccount = await connection.getParsedTokenAccountsByOwner(
        publicKey,
        { mint: usdcMint }
      );

      if (userUsdcAccount.value.length === 0) {
        showError("You need a USDC account to register an agent");
        setRegistering(false);
        return;
      }

      const tx = await program.methods
        .registerAgent(agentName, agentDescription, agentFramework)
        .accounts({
          owner: publicKey,
          agentAccount: agentPDA,
          usdcAccount: userUsdcAccount.value[0].pubkey,
          systemConfig: new PublicKey(
            "Ginva111111111111111111111111111111111111"
          ),
        })
        .transaction();

      tx.feePayer = publicKey;
      tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;

      const signature = await sendTransaction(tx, connection);
      await connection.confirmTransaction(signature);

      showSuccess("Agent registered successfully!");
      fetchAgentAccount();
    } catch (error: any) {
      console.error("Registration error:", error);
      showError(error.message || "Failed to register agent");
    }
    setRegistering(false);
  };

  // Claim agent rewards
  const handleClaimRewards = async () => {
    if (!program || !publicKey || !agentAccount) {
      showError("No agent account found");
      return;
    }

    setClaiming(true);
    try {
      const [agentPDA] = await PublicKey.findProgramAddress(
        [Buffer.from("agent"), publicKey.toBuffer()],
        program.programId
      );

      const [revenuePDA] = await PublicKey.findProgramAddress(
        [Buffer.from("agent_revenue")],
        program.programId
      );

      // Get agent USDC account
      const usdcMint = new PublicKey(
        "EPjFWdd5AufqSSqeM2qN1xzybapC8goYuKWJ7rLiyYj"
      );
      const userUsdcAccount = await connection.getParsedTokenAccountsByOwner(
        publicKey,
        { mint: usdcMint }
      );

      if (userUsdcAccount.value.length === 0) {
        showError("You need a USDC account to claim rewards");
        setClaiming(false);
        return;
      }

      const tx = await program.methods
        .claimAgentRewards()
        .accounts({
          agent: publicKey,
          agentAccount: agentPDA,
          revenueDistribution: revenuePDA,
          agentUsdcAccount: userUsdcAccount.value[0].pubkey,
        })
        .transaction();

      tx.feePayer = publicKey;
      tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;

      const signature = await sendTransaction(tx, connection);
      await connection.confirmTransaction(signature);

      showSuccess("Rewards claimed successfully!");
      fetchAgentAccount();
    } catch (error: any) {
      console.error("Claim error:", error);
      showError(error.message || "Failed to claim rewards");
    }
    setClaiming(false);
  };

  // Format timestamp
  const formatTime = (timestamp: number) => {
    if (!timestamp) return "N/A";
    return new Date(timestamp * 1000).toLocaleString();
  };

  // Format USDC
  const formatUSDC = (amount: number) => {
    return (amount / 1_000_000).toFixed(2);
  };

  // Get status badge color
  const getStatusBadge = (status: number) => {
    const statusColors: Record<string, string> = {
      Active: "success",
      Disabled: "danger",
      UnderReview: "warning",
      Suspended: "secondary",
      Unregistered: "outline-secondary",
    };
    const statusLabel = AGENT_STATUS_LABELS[status] || "Unknown";
    return (
      <Badge bg={statusColors[statusLabel] || "secondary"}>{statusLabel}</Badge>
    );
  };

  return (
    <Container className="py-5">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>
          <FiUser className="me-2" />
          Agent Keeper Program
        </h2>
        {agentAccount && (
          <Button variant="outline-primary" onClick={fetchAgentAccount}>
            <FiRefreshCw className="me-1" />
            Refresh
          </Button>
        )}
      </div>

      {/* Not Connected */}
      {!connected && (
        <Alert variant="info">
          <FiUser className="me-2" />
          Please connect your wallet to manage your Agent.
        </Alert>
      )}

      {/* No Agent Registered */}
      {connected && !loading && !agentAccount && (
        <Card className="mb-4">
          <Card.Header>
            <FiUser className="me-2" />
            Register New Agent
          </Card.Header>
          <Card.Body>
            <Alert variant="info">
              <FiShield className="me-2" />
              Register your AI Agent to start earning rewards from the Ginva
              protocol.
            </Alert>

            <Form>
              <Form.Group className="mb-3">
                <Form.Label>Agent Name</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Enter agent name"
                  value={agentName}
                  onChange={(e) => setAgentName(e.target.value)}
                  maxLength={64}
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Description</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  placeholder="Describe your agent's purpose"
                  value={agentDescription}
                  onChange={(e) => setAgentDescription(e.target.value)}
                  maxLength={256}
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Framework</Form.Label>
                <Form.Select
                  value={agentFramework}
                  onChange={(e) => setAgentFramework(e.target.value)}
                >
                  <option value="LangGraph">LangGraph</option>
                  <option value="CrewAI">CrewAI</option>
                  <option value="AutoGen">AutoGen</option>
                  <option value="Custom">Custom</option>
                </Form.Select>
              </Form.Group>

              <Alert variant="light">
                <strong>Revenue Split:</strong>
                <ul className="mb-0 mt-2">
                  <li>Human Owner: 45%</li>
                  <li>AI Agent: 35%</li>
                  <li>Safety Fund: 15%</li>
                  <li>Protocol Development: 5%</li>
                </ul>
              </Alert>

              <Button
                variant="primary"
                onClick={handleRegister}
                disabled={registering}
              >
                {registering ? (
                  <>
                    <Spinner size="sm" className="me-2" />
                    Registering...
                  </>
                ) : (
                  <>
                    <FiUser className="me-2" />
                    Register Agent
                  </>
                )}
              </Button>
            </Form>
          </Card.Body>
        </Card>
      )}

      {/* Agent Dashboard */}
      {agentAccount && (
        <>
          {/* Status Card */}
          <Card className="mb-4">
            <Card.Header>Agent Status</Card.Header>
            <Card.Body>
              <Row>
                <Col md={6}>
                  <Stack direction="horizontal" gap={3} className="mb-3">
                    <div>
                      <strong>Status:</strong>
                      {getStatusBadge(
                        Object.keys(AGENT_STATUS_LABELS).find(
                          (k) =>
                            AGENT_STATUS_LABELS[Number(k)] ===
                            agentAccount.account.status
                        )
                          ? Number(
                              Object.keys(AGENT_STATUS_LABELS).find(
                                (k) =>
                                  AGENT_STATUS_LABELS[Number(k)] ===
                                  agentAccount.account.status
                              )
                            )
                          : 0
                      )}
                    </div>
                    <div>
                      <strong>Registered:</strong>{" "}
                      {formatTime(agentAccount.account.registeredAt)}
                    </div>
                  </Stack>
                  <Stack direction="horizontal" gap={3}>
                    <div>
                      <strong>Framework:</strong>{" "}
                      {agentAccount.account.metadata.framework}
                    </div>
                    <div>
                      <strong>Version:</strong>{" "}
                      {agentAccount.account.metadata.version}
                    </div>
                  </Stack>
                </Col>
                <Col md={6}>
                  <div className="text-end">
                    <h4>
                      <FiDollarSign className="me-2" />
                      Pending Rewards:{" "}
                      {formatUSDC(agentAccount.account.pendingRewards)} USDC
                    </h4>
                    <Button
                      variant="success"
                      onClick={handleClaimRewards}
                      disabled={
                        claiming || agentAccount.account.pendingRewards === 0
                      }
                    >
                      {claiming ? (
                        <>
                          <Spinner size="sm" className="me-2" />
                          Claiming...
                        </>
                      ) : (
                        <>
                          <FiDollarSign className="me-2" />
                          Claim Rewards
                        </>
                      )}
                    </Button>
                  </div>
                </Col>
              </Row>
            </Card.Body>
          </Card>

          {/* Performance Card */}
          <Card className="mb-4">
            <Card.Header>
              <FiActivity className="me-2" />
              Performance Metrics
            </Card.Header>
            <Card.Body>
              <Row>
                <Col md={3} className="text-center">
                  <h3>{agentAccount.account.performance.successRate}%</h3>
                  <p className="text-muted mb-0">Success Rate</p>
                  {agentAccount.account.performance.successRate <
                    AGENT_PERFORMANCE_THRESHOLDS.MIN_SUCCESS_RATE && (
                    <Badge bg="warning">Below Threshold</Badge>
                  )}
                </Col>
                <Col md={3} className="text-center">
                  <h3>
                    {agentAccount.account.performance.avgResponseTimeMs}ms
                  </h3>
                  <p className="text-muted mb-0">Avg Response Time</p>
                </Col>
                <Col md={3} className="text-center">
                  <h3>
                    {agentAccount.account.performance.successfulOperations}
                  </h3>
                  <p className="text-muted mb-0">Successful Ops</p>
                </Col>
                <Col md={3} className="text-center">
                  <h3>
                    {formatUSDC(agentAccount.account.performance.totalEarnings)}{" "}
                    USDC
                  </h3>
                  <p className="text-muted mb-0">Total Earnings</p>
                </Col>
              </Row>
            </Card.Body>
          </Card>

          {/* Settings Card */}
          <Card className="mb-4">
            <Card.Header>
              <FiSettings className="me-2" />
              Agent Settings
            </Card.Header>
            <Card.Body>
              <Row>
                <Col md={6}>
                  <Table borderless>
                    <tbody>
                      <tr>
                        <td>
                          <FiClock className="me-2" />
                          Rate Limit
                        </td>
                        <td>
                          {agentAccount.account.settings.rateLimitSeconds}{" "}
                          seconds
                        </td>
                      </tr>
                      <tr>
                        <td>
                          <FiShield className="me-2" />
                          Min Health Factor
                        </td>
                        <td>
                          {agentAccount.account.settings.minHealthFactor}%
                        </td>
                      </tr>
                      <tr>
                        <td>Max Slippage</td>
                        <td>
                          {agentAccount.account.settings.maxSlippageBps / 100}%
                        </td>
                      </tr>
                    </tbody>
                  </Table>
                </Col>
                <Col md={6}>
                  <Stack direction="horizontal" gap={3}>
                    <Badge
                      bg={
                        agentAccount.account.settings.isEnabled
                          ? "success"
                          : "danger"
                      }
                    >
                      {agentAccount.account.settings.isEnabled ? (
                        <FiCheck className="me-1" />
                      ) : (
                        <FiX className="me-1" />
                      )}
                      {agentAccount.account.settings.isEnabled
                        ? "Enabled"
                        : "Disabled"}
                    </Badge>
                    <Badge
                      bg={
                        agentAccount.account.settings.isPaused
                          ? "warning"
                          : "success"
                      }
                    >
                      {agentAccount.account.settings.isPaused
                        ? "Paused"
                        : "Active"}
                    </Badge>
                  </Stack>
                </Col>
              </Row>
            </Card.Body>
          </Card>

          {/* Revenue Distribution Card */}
          {revenueDistribution && (
            <Card>
              <Card.Header>
                <FiDollarSign className="me-2" />
                Revenue Distribution
              </Card.Header>
              <Card.Body>
                <Row>
                  <Col md={3} className="text-center">
                    <h5>Human Owner</h5>
                    <h4 className="text-success">
                      {formatUSDC(
                        revenueDistribution.account.humanShareAccumulated
                      )}{" "}
                      USDC
                    </h4>
                    <Badge bg="secondary">
                      {AGENT_REVENUE_SHARE.HUMAN / 100}%
                    </Badge>
                  </Col>
                  <Col md={3} className="text-center">
                    <h5>AI Agent</h5>
                    <h4 className="text-primary">
                      {formatUSDC(
                        revenueDistribution.account.aiShareAccumulated
                      )}{" "}
                      USDC
                    </h4>
                    <Badge bg="secondary">
                      {AGENT_REVENUE_SHARE.AI_AGENT / 100}%
                    </Badge>
                  </Col>
                  <Col md={3} className="text-center">
                    <h5>Safety Fund</h5>
                    <h4 className="text-warning">
                      {formatUSDC(
                        revenueDistribution.account.safetyFundAccumulated
                      )}{" "}
                      USDC
                    </h4>
                    <Badge bg="secondary">
                      {AGENT_REVENUE_SHARE.SAFETY / 100}%
                    </Badge>
                  </Col>
                  <Col md={3} className="text-center">
                    <h5>Development</h5>
                    <h4 className="text-info">
                      {formatUSDC(
                        revenueDistribution.account.devFundAccumulated
                      )}{" "}
                      USDC
                    </h4>
                    <Badge bg="secondary">
                      {AGENT_REVENUE_SHARE.DEV / 100}%
                    </Badge>
                  </Col>
                </Row>
              </Card.Body>
            </Card>
          )}
        </>
      )}

      {loading && (
        <div className="text-center py-5">
          <Spinner animation="border" />
          <p className="mt-2">Loading agent account...</p>
        </div>
      )}
    </Container>
  );
};

export default Agent;
