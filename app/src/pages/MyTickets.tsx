import {
  Container,
  Card,
  Button,
  Stack,
  Table,
  Badge,
  Row,
  Col,
} from "react-bootstrap";
import {
  FiClipboard,
  FiDollarSign,
  FiCalendar,
  FiShield,
} from "react-icons/fi";
import { useState, useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useGinvaProgram } from "../hooks/useGinvaProgram";

interface Ticket {
  id: number;
  asset: string;
  collateralAmount: string;
  loanAmount: string;
  interestRate: string;
  status: string;
  maturityDate: string;
  assetCoverage: string;
}

const MyTickets = () => {
  const { publicKey } = useWallet();
  const { program } = useGinvaProgram();
  const [selectedTicket, setSelectedTicket] = useState<number | null>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTickets = async () => {
      if (!program || !publicKey) return;
      setLoading(true);
      try {
        const allLoans = await program.account.loanAccount.all([
          {
            memcmp: {
              offset: 8, // borrower starts at offset 8
              bytes: publicKey.toBase58(),
            },
          },
        ]);

        const ticketData = allLoans.map(
          (loan: { publicKey: any; account: any }) => ({
            id: loan.account.loanId,
            asset: loan.account.collateralMint
              .toString()
              .endsWith("So11111111111111111111111111111112")
              ? "SOL"
              : "USDC", // Mock, adjust as needed
            collateralAmount: `${(
              loan.account.collateralAmount.toNumber() / 1e9
            ).toFixed(4)} ${
              loan.account.collateralMint
                .toString()
                .endsWith("So11111111111111111111111111111112")
                ? "SOL"
                : "USDC"
            }`,
            loanAmount: `${(loan.account.loanAmount.toNumber() / 1e6).toFixed(
              2
            )} USDC`,
            interestRate: `${(loan.account.interestRateBps / 100).toFixed(1)}%`,
            status:
              loan.account.status === 1
                ? "active"
                : loan.account.status === 2
                ? "overdue"
                : "liquidated",
            maturityDate: new Date(
              loan.account.maturityAt.toNumber() * 1000
            ).toLocaleDateString(),
            assetCoverage: "145%", // Mock, calculate from oracle
          })
        );

        setTickets(ticketData);
      } catch (error) {
        console.error("Error fetching tickets:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTickets();
  }, [program, publicKey]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge bg="success">Active</Badge>;
      case "redeemed":
        return <Badge bg="info">Repaid</Badge>;
      case "forfeited":
        return <Badge bg="warning">Assisted</Badge>;
      default:
        return <Badge bg="secondary">Unknown</Badge>;
    }
  };

  return (
    <Container>
      <Stack direction="vertical" gap={3} className="mb-4">
        <h1>My Loans</h1>
        <p className="text-muted">
          View and manage all your loans. Each loan is protected with our
          72-hour protection system.
        </p>
      </Stack>

      <Row className="mb-4">
        <Col md={4}>
          <Card className="h-100">
            <Card.Body>
              <Stack direction="vertical" gap={2}>
                <div>
                  <h5 className="text-muted">Total Tickets</h5>
                  <h3 className="mb-1" style={{ color: "#16a34a" }}>
                    {tickets.length}
                  </h3>
                </div>
                <div className="text-end">
                  <FiClipboard size={24} color="#16a34a" />
                </div>
              </Stack>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="h-100">
            <Card.Body>
              <Stack direction="vertical" gap={2}>
                <div>
                  <h5 className="text-muted">Active Tickets</h5>
                  <h3 className="mb-1" style={{ color: "#0d6efd" }}>
                    {tickets.filter((t) => t.status === "active").length}
                  </h3>
                </div>
                <div className="text-end">
                  <FiShield size={24} color="#0d6efd" />
                </div>
              </Stack>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="h-100">
            <Card.Body>
              <Stack direction="vertical" gap={2}>
                <div>
                  <h5 className="text-muted">Total Pawned Value</h5>
                  <h3 className="mb-1" style={{ color: "#6f42c1" }}>
                    500.00 USDC
                  </h3>
                </div>
                <div className="text-end">
                  <FiDollarSign size={24} color="#6f42c1" />
                </div>
              </Stack>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Card>
        <Card.Header>
          <h4>All Pawn Tickets</h4>
        </Card.Header>
        <Card.Body>
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          ) : tickets.length === 0 ? (
            <div className="text-center py-5">
              <p className="text-muted">No pawn tickets yet.</p>
              <Button variant="primary" href="/pawn">
                Create Your First Pawn Ticket
              </Button>
            </div>
          ) : (
            <Table responsive hover>
              <thead>
                <tr>
                  <th>Ticket ID</th>
                  <th>Asset</th>
                  <th>Collateral</th>
                  <th>Loan Amount</th>
                  <th>Interest Rate</th>
                  <th>Asset Coverage</th>
                  <th>Maturity</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {tickets.map((ticket) => (
                  <tr
                    key={ticket.id}
                    className={
                      selectedTicket === ticket.id ? "table-primary" : ""
                    }
                    onClick={() => setSelectedTicket(ticket.id)}
                    style={{ cursor: "pointer" }}
                  >
                    <td>#{ticket.id}</td>
                    <td>
                      <strong>{ticket.asset}</strong>
                    </td>
                    <td>{ticket.collateralAmount}</td>
                    <td>{ticket.loanAmount}</td>
                    <td>{ticket.interestRate}</td>
                    <td>
                      <Badge bg="success">{ticket.assetCoverage}</Badge>
                    </td>
                    <td>
                      <FiCalendar className="me-1" />
                      {ticket.maturityDate}
                    </td>
                    <td>{getStatusBadge(ticket.status)}</td>
                    <td>
                      {ticket.status === "active" && (
                        <Stack direction="horizontal" gap={2}>
                          <Button
                            variant="outline-primary"
                            size="sm"
                            href={`/redeem?ticket=${ticket.id}`}
                          >
                            Redeem
                          </Button>
                          <Button
                            variant="outline-secondary"
                            size="sm"
                            href={`/extend?ticket=${ticket.id}`}
                          >
                            Extend
                          </Button>
                        </Stack>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>

      <Card className="mt-4">
        <Card.Header>
          <h5>How Multi-Ticket Works</h5>
        </Card.Header>
        <Card.Body>
          <Stack gap={3}>
            <div className="d-flex align-items-start gap-3">
              <div
                className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center"
                style={{ width: "32px", height: "32px", minWidth: "32px" }}
              >
                1
              </div>
              <div>
                <strong>Isolated Margin</strong>
                <p className="text-muted small mb-0">
                  Each ticket is separate. If one asset forfeits, it doesn't
                  affect your other tickets.
                </p>
              </div>
            </div>
            <div className="d-flex align-items-start gap-3">
              <div
                className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center"
                style={{ width: "32px", height: "32px", minWidth: "32px" }}
              >
                2
              </div>
              <div>
                <strong>Flexible Management</strong>
                <p className="text-muted small mb-0">
                  Redeem or extend each ticket independently. You're in full
                  control.
                </p>
              </div>
            </div>
            <div className="d-flex align-items-start gap-3">
              <div
                className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center"
                style={{ width: "32px", height: "32px", minWidth: "32px" }}
              >
                3
              </div>
              <div>
                <strong>Clear Overview</strong>
                <p className="text-muted small mb-0">
                  Track all your pledged assets in one place. Each ticket shows
                  its own status and coverage.
                </p>
              </div>
            </div>
          </Stack>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default MyTickets;
