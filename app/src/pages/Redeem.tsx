import { useState, useEffect, useMemo, useCallback } from "react";
import {
  Container,
  Card,
  Button,
  Stack,
  Alert,
  Badge,
  Spinner,
  Form,
} from "react-bootstrap";
import {
  FiCheckCircle,
  FiClock,
  FiAlertTriangle,
  FiRefreshCw,
} from "react-icons/fi";
import { useWallet } from "@solana/wallet-adapter-react";
import { useGinvaProgram } from "../hooks/useGinvaProgram";
import { showSuccess, showError } from "../utils/helpers";

const Redeem = () => {
  const { publicKey } = useWallet();
  const { program } = useGinvaProgram();

  const [tickets, setTickets] = useState<any[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  // 1️⃣ Fetch user pawn tickets
  const fetchTickets = useCallback(async () => {
    if (!program || !publicKey) return;
    setFetching(true);
    try {
      // Fetch all LoanAccounts and filter for user
      const allLoans = await program.account.loanAccount.all([
        {
          memcmp: {
            offset: 8, // Skip discriminator
            bytes: publicKey.toBase58(), // Find borrower = user
          },
        },
      ]);

      // Transform data and filter status Active (1) or Overdue (2)
      const activeTickets = allLoans
        .map((loan: { publicKey: any; account: any }) => ({
          pubkey: loan.publicKey,
          account: loan.account,
        }))
        .filter((t: any) => t.account.status === 1 || t.account.status === 2);

      setTickets(activeTickets);

      // Auto-select if only one ticket
      if (activeTickets.length === 1 && !selectedTicket) {
        setSelectedTicket(activeTickets[0]);
      }
    } catch (error) {
      console.error("Error fetching tickets:", error);
    } finally {
      setFetching(false);
    }
  }, [program, publicKey]); // Correct dependencies

  useEffect(() => {
    fetchTickets();
    // Auto-refresh interest every 60 seconds
    const interval = setInterval(fetchTickets, 60000);
    return () => clearInterval(interval);
  }, [fetchTickets]); // Dependencies changed to fetchTickets

  // 2️⃣ Calculate real-time interest (Same formula as Smart Contract)
  const calculateDebt = (ticket: any) => {
    if (!ticket) return { principal: 0, interest: 0, total: 0 };

    const principal = ticket.account.loanAmount.toNumber() / 1_000_000; // USDC decimals 6
    const rateBps = ticket.account.interestRateBps; // e.g. 800 = 8%
    const lastPayment = ticket.account.lastPaymentAt.toNumber();
    const now = Math.floor(Date.now() / 1000);

    // Duration (seconds)
    const timeElapsed = Math.max(0, now - lastPayment);
    const secondsPerYear = 31_536_000;

    // Formula: Interest = Principal * Rate * Time / (Year * 10000)
    const interest =
      (principal * rateBps * timeElapsed) / (secondsPerYear * 10000);

    return {
      principal,
      interest,
      total: principal + interest,
    };
  };

  const debtInfo = useMemo(
    () => calculateDebt(selectedTicket),
    [selectedTicket]
  );

  // 3️⃣ Redeem function
  const handleRedeem = async () => {
    if (!program || !selectedTicket) return;
    setLoading(true);
    try {
      // Call Smart Contract: repay_loan
      const tx = await program.methods
        .repayLoan(selectedTicket.account.loanId)
        .accounts({
          loanAccount: selectedTicket.pubkey,
        })
        .rpc();

      showSuccess("Redemption Successful!", `Tx: ${tx.substring(0, 10)}...`);
      fetchTickets();
      setSelectedTicket(null);
    } catch (error: any) {
      console.error(error);
      showError("Redemption Failed", error.message);
    } finally {
      setLoading(false);
    }
  };

  // 4️⃣ Extend function
  const handleExtend = async () => {
    if (!program || !selectedTicket) return;
    setLoading(true);
    try {
      await program.methods
        .extendLoan(selectedTicket.account.loanId)
        .accounts({
          loanAccount: selectedTicket.pubkey,
        })
        .rpc();

      showSuccess("Ticket Extended!", "You have paid the interest.");
      fetchTickets();
    } catch (error: any) {
      console.error(error);
      showError("Extension Failed", error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className="py-5">
      <Stack direction="vertical" gap={3} className="mb-4">
        <div className="d-flex justify-content-between align-items-center">
          <h1>🔐 Redeem Your Assets</h1>
          <Button variant="light" onClick={fetchTickets} disabled={fetching}>
            <FiRefreshCw className={fetching ? "spin" : ""} />
          </Button>
        </div>
        <p className="text-muted">
          Manage your pawn tickets. Repay the loan to get your asset back, or
          pay interest to extend the duration.
        </p>
      </Stack>

      {/* --- Ticket List Section --- */}
      <Card className="mb-4 shadow-sm">
        <Card.Header className="bg-white">
          <h5 className="mb-0">🎫 Your Active Pawn Tickets</h5>
        </Card.Header>
        <Card.Body>
          {fetching ? (
            <div className="text-center py-4">
              <Spinner animation="border" variant="primary" />
            </div>
          ) : tickets.length === 0 ? (
            <div className="text-center py-5 text-muted">
              <p>No active pawn tickets found.</p>
              <Button variant="primary" href="/pawn">
                Create New Loan
              </Button>
            </div>
          ) : (
            <Stack gap={2}>
              {tickets.map((t, idx) => (
                <div
                  key={idx}
                  className={`p-3 border rounded cursor-pointer ${
                    selectedTicket?.pubkey.equals(t.pubkey)
                      ? "border-primary bg-light"
                      : ""
                  }`}
                  style={{ cursor: "pointer" }}
                  onClick={() => setSelectedTicket(t)}
                >
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <Badge
                        bg={t.account.status === 1 ? "success" : "warning"}
                      >
                        {t.account.status === 1 ? "Active" : "Overdue"}
                      </Badge>
                      <span className="ms-2 fw-bold">
                        Loan ID: #{t.account.loanId}
                      </span>
                    </div>
                    <div className="text-end">
                      <div className="fw-bold">
                        {(t.account.loanAmount.toNumber() / 1e6).toFixed(2)}{" "}
                        USDC
                      </div>
                      <small className="text-muted">
                        Collateral:{" "}
                        {(t.account.collateralAmount.toNumber() / 1e9).toFixed(
                          4
                        )}{" "}
                        SOL
                      </small>
                    </div>
                  </div>
                </div>
              ))}
            </Stack>
          )}
        </Card.Body>
      </Card>

      {/* --- Redeem Section - shown when ticket selected --- */}
      {selectedTicket && (
        <Card className="shadow border-primary">
          <Card.Header className="bg-primary text-white d-flex justify-content-between align-items-center">
            <h4 className="mb-0">💳 Action Console</h4>
            <Badge bg="light" text="dark">
              ID: {selectedTicket.account.loanId}
            </Badge>
          </Card.Header>
          <Card.Body>
            <div className="row g-4">
              {/* Left: Debt Info */}
              <div className="col-md-6">
                <h6 className="text-muted mb-3">Debt Summary</h6>
                <Stack gap={3}>
                  <div className="d-flex justify-content-between">
                    <span>Principal:</span>
                    <span className="fw-bold">
                      {debtInfo.principal.toFixed(2)} USDC
                    </span>
                  </div>
                  <div className="d-flex justify-content-between text-warning">
                    <span>Accrued Interest:</span>
                    <span>+ {debtInfo.interest.toFixed(4)} USDC</span>
                  </div>
                  <hr />
                  <div className="d-flex justify-content-between fs-5">
                    <span>Total Due:</span>
                    <span className="fw-bold text-danger">
                      {debtInfo.total.toFixed(4)} USDC
                    </span>
                  </div>
                </Stack>
              </div>

              {/* Right: Action Buttons */}
              <div className="col-md-6 border-start ps-md-4">
                <h6 className="text-muted mb-3">Choose Action</h6>

                <div className="d-grid gap-3">
                  {/* Redeem Button */}
                  <Button
                    variant="success"
                    size="lg"
                    onClick={handleRedeem}
                    disabled={loading}
                  >
                    {loading ? (
                      <Spinner as="span" animation="border" size="sm" />
                    ) : (
                      <FiCheckCircle className="me-2" />
                    )}
                    Redeem (Pay Full)
                  </Button>
                  <Form.Text className="text-muted text-center">
                    Pay full amount to retrieve your{" "}
                    {(
                      selectedTicket.account.collateralAmount.toNumber() / 1e9
                    ).toFixed(2)}{" "}
                    SOL
                  </Form.Text>

                  <hr className="my-2" />

                  {/* Extend Button */}
                  <Button
                    variant="outline-primary"
                    onClick={handleExtend}
                    disabled={loading || debtInfo.interest < 0.0001}
                  >
                    {loading ? (
                      <Spinner as="span" animation="border" size="sm" />
                    ) : (
                      <FiClock className="me-2" />
                    )}
                    Extend Ticket (Pay Interest Only)
                  </Button>
                  <Form.Text className="text-muted text-center">
                    Pay {debtInfo.interest.toFixed(4)} USDC interest to reset
                    deadline.
                  </Form.Text>
                </div>
              </div>
            </div>
          </Card.Body>
        </Card>
      )}

      {/* --- Warning Section --- */}
      {selectedTicket?.account.status === 2 && (
        <Alert variant="danger" className="mt-4">
          <FiAlertTriangle className="me-2" />
          <strong>Warning:</strong> This ticket is OVERDUE! Please redeem or
          extend immediately to avoid liquidation.
        </Alert>
      )}
    </Container>
  );
};

export default Redeem;
