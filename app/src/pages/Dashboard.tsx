import { Card, Container, Row, Col, Badge, Stack } from "react-bootstrap";
import { FiDollarSign, FiTrendingUp, FiUsers, FiPercent } from "react-icons/fi";
import { useWallet } from "@solana/wallet-adapter-react";

const Dashboard = () => {
  const { connected, publicKey } = useWallet();
  return (
    <Container>
      <Stack direction="vertical" gap={3} className="mb-4">
        <h1>Ginva Protocol Dashboard</h1>
        <p className="text-muted">Overview of Ginva Protocol</p>
      </Stack>

      <Row xs={1} md={2} lg={4} className="g-4">
        <Col className="mb-3">
          <Card className="h-100">
            <Card.Body>
              <Stack direction="vertical" gap={2}>
                <div>
                  <h5 className="text-muted">Total Value Locked</h5>
                  <h3 className="mb-1" style={{ color: "#16a34a" }}>
                    $0
                  </h3>
                  <p className="text-muted small">0 USDC</p>
                </div>
                <div className="text-end">
                  <FiDollarSign size={24} color="#16a34a" />
                </div>
              </Stack>
            </Card.Body>
          </Card>
        </Col>

        <Col className="mb-3">
          <Card className="h-100">
            <Card.Body>
              <Stack direction="vertical" gap={2}>
                <div>
                  <h5 className="text-muted">Total Borrowed</h5>
                  <h3 className="mb-1" style={{ color: "#0d6efd" }}>
                    $0
                  </h3>
                  <p className="text-muted small">0 Loans</p>
                </div>
                <div className="text-end">
                  <FiTrendingUp size={24} color="#0d6efd" />
                </div>
              </Stack>
            </Card.Body>
          </Card>
        </Col>

        <Col className="mb-3">
          <Card className="h-100">
            <Card.Body>
              <Stack direction="vertical" gap={2}>
                <div>
                  <h5 className="text-muted">Active Users</h5>
                  <h3 className="mb-1" style={{ color: "#6f42c1" }}>
                    {connected ? "1" : "0"}
                  </h3>
                  <p className="text-muted small">
                    {connected ? "You are connected" : "Not connected"}
                  </p>
                </div>
                <div className="text-end">
                  <FiUsers size={24} color="#6f42c1" />
                </div>
              </Stack>
            </Card.Body>
          </Card>
        </Col>

        <Col className="mb-3">
          <Card className="h-100">
            <Card.Body>
              <Stack direction="vertical" gap={2}>
                <div>
                  <h5 className="text-muted">Health Factor</h5>
                  <h3 className="mb-1" style={{ color: "#fd7e14" }}>
                    -
                  </h3>
                  <p className="text-muted small">No Active Loans</p>
                </div>
                <div className="text-end">
                  <FiPercent size={24} color="#fd7e14" />
                </div>
              </Stack>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row className="mb-4">
        <Col>
          <Card>
            <Card.Header>
              <h4>Your Wallet</h4>
            </Card.Header>
            <Card.Body>
              <Stack gap={2}>
                <div>
                  <strong>Address:</strong>
                  <p className="font-monospace small">
                    {connected && publicKey
                      ? `${publicKey.toString().slice(0, 8)}...${publicKey
                          .toString()
                          .slice(-8)}`
                      : "Not Connected"}
                  </p>
                </div>
                <div>
                  <strong>Status:</strong>
                  <Badge
                    bg={connected ? "success" : "warning"}
                    text={connected ? "light" : "dark"}
                    className="ms-2"
                  >
                    {connected ? "Connected" : "Not Connected"}
                  </Badge>
                </div>
              </Stack>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row className="mb-4">
        <Col>
          <Card>
            <Card.Header>
              <h4>Your Loans</h4>
            </Card.Header>
            <Card.Body className="text-center py-5">
              <p className="text-muted">
                No active loans. Start by depositing collateral and borrowing
                USDC.
              </p>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <div className="text-center mt-4">
        <Badge bg="success" text="light" className="me-2">
          Devnet
        </Badge>
        <span className="text-muted small">Version 2.0.0</span>
      </div>
    </Container>
  );
};

export default Dashboard;
