import {
  Card,
  Container,
  Row,
  Col,
  Badge,
  Stack,
  Button,
  Alert,
} from "react-bootstrap";
import { FiDollarSign, FiTrendingUp, FiUsers, FiShield } from "react-icons/fi";
import { useWallet } from "@solana/wallet-adapter-react";
import { useState, useEffect } from "react";
import { useGinvaProgram } from "../hooks/useGinvaProgram";
import { PublicKey } from "@solana/web3.js";

const Dashboard = () => {
  const { connected, publicKey } = useWallet();
  const { program } = useGinvaProgram();
  const [data, setData] = useState({
    tvl: 0,
    activeLoans: 0,
    userActiveLoans: 0,
  });

  useEffect(() => {
    const fetchData = async () => {
      if (!program) return;

      try {
        const systemConfigPda = PublicKey.findProgramAddressSync(
          [Buffer.from("config")],
          program.programId
        )[0];
        const systemConfig = await program.account.systemConfig.fetch(
          systemConfigPda
        );

        const tvl =
          systemConfig.totalBorrowed.toNumber() / 1e6 +
          (systemConfig.totalCollateral.toNumber() / 1e9) * 100; // Approximate TVL

        let activeLoans = 0;
        let userActiveLoans = 0;

        if (publicKey) {
          const userLoans = await program.account.loanAccount.all([
            {
              memcmp: {
                offset: 8,
                bytes: publicKey.toBase58(),
              },
            },
          ]);
          userActiveLoans = userLoans.filter(
            (loan: { account: any }) => loan.account.status === 1
          ).length;

          // For global active loans
          const allLoans = await program.account.loanAccount.all();
          activeLoans = allLoans.filter(
            (loan: { account: any }) => loan.account.status === 1
          ).length;
        }

        setData({
          tvl,
          activeLoans,
          userActiveLoans,
        });
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      }
    };

    fetchData();
  }, [program, publicKey]);
  return (
    <Container>
      <Stack direction="vertical" gap={3} className="mb-4">
        <h1>Your Dashboard</h1>
        <p className="text-muted">
          Welcome to GINVA - Borrow USDC instantly using your crypto as
          collateral.
          <strong> Dual Protection System included.</strong>
        </p>
      </Stack>

      <Row xs={1} md={2} lg={4} className="g-4">
        <Col className="mb-3">
          <Card className="h-100">
            <Card.Body>
              <Stack direction="vertical" gap={2}>
                <div>
                  <h5 className="text-muted">Total Value Locked</h5>
                  <h3 className="mb-1" style={{ color: "#16a34a" }}>
                    ${data.tvl.toFixed(2)}
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
                  <h5 className="text-muted">Active Loans</h5>
                  <h3 className="mb-1" style={{ color: "#0d6efd" }}>
                    {data.userActiveLoans}
                  </h3>
                  <p className="text-muted small">
                    {data.userActiveLoans > 0
                      ? `${data.userActiveLoans} Active Loans`
                      : "No Active Loans"}
                  </p>
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
                  <h5 className="text-muted">Protection Status</h5>
                  <h3 className="mb-1" style={{ color: "#fd7e14" }}>
                    Dual Layer
                  </h3>
                  <p className="text-muted small">
                    Maturity: 72h | Price: Immediate
                  </p>
                </div>
                <div className="text-end">
                  <FiShield size={24} color="#fd7e14" />
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
                {data.userActiveLoans > 0
                  ? `You have ${data.userActiveLoans} active loan(s). Manage them in My Tickets.`
                  : "No active loans. Start by depositing your assets as collateral and receive instant USDC."}
              </p>
              {data.userActiveLoans === 0 && (
                <Button variant="primary" href="/pawn">
                  Create Loan
                </Button>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Card className="mb-4 bg-light">
        <Card.Body>
          <h5 className="mb-3">🛡️ Dual Protection System</h5>
          <Alert variant="warning" className="mb-3">
            <strong>⚠️ Important:</strong> If your Health Factor drops below
            100%, immediate liquidation may occur without the 72-hour grace
            period.
          </Alert>
          <Stack gap={3}>
            <div className="d-flex align-items-start gap-3">
              <div
                className="bg-success text-white rounded-circle d-flex align-items-center justify-content-center"
                style={{ width: "32px", height: "32px", minWidth: "32px" }}
              >
                1
              </div>
              <div>
                <strong>Layer 1: Maturity Grace Period (72 hours)</strong>
                <p className="text-muted small mb-0">
                  After your loan expires, you have 72 hours to repay, extend,
                  or add collateral
                </p>
              </div>
            </div>
            <div className="d-flex align-items-start gap-3">
              <div
                className="bg-danger text-white rounded-circle d-flex align-items-center justify-content-center"
                style={{ width: "32px", height: "32px", minWidth: "32px" }}
              >
                2
              </div>
              <div>
                <strong>Layer 2: Immediate Price Protection</strong>
                <p className="text-muted small mb-0">
                  If Health Factor &lt; 100%, immediate liquidation occurs to
                  protect investor funds - no grace period
                </p>
              </div>
            </div>
            <div className="d-flex align-items-start gap-3">
              <div
                className="bg-info text-white rounded-circle d-flex align-items-center justify-content-center"
                style={{ width: "32px", height: "32px", minWidth: "32px" }}
              >
                3
              </div>
              <div>
                <strong>Monitor Your Health Factor</strong>
                <p className="text-muted small mb-0">
                  Keep your Health Factor above 100% by adding collateral or
                  repaying loan
                </p>
              </div>
            </div>
          </Stack>
        </Card.Body>
      </Card>

      <div className="text-center mt-4">
        <Badge bg="success" text="light" className="me-2">
          Devnet
        </Badge>
        <span className="text-muted small">
          GINVA v2.0.0 - Protected Lending
        </span>
      </div>
    </Container>
  );
};

export default Dashboard;
