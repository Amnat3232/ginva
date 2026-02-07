import { Container, Card, Button, Stack } from "react-bootstrap";
import { FiCheckCircle } from "react-icons/fi";

const Redeem = () => {
  return (
    <Container>
      <Stack direction="vertical" gap={3} className="mb-4">
        <h1>Redeem Your Assets</h1>
        <p className="text-muted">
          Redeem your pledged assets by paying the amount due before your pawn
          ticket expires.
        </p>
      </Stack>

      <Card>
        <Card.Header>
          <h4>Your Active Pawn Tickets</h4>
        </Card.Header>
        <Card.Body className="text-center py-5">
          <p className="text-muted">No active pawn tickets to redeem.</p>
        </Card.Body>
      </Card>

      <Card className="mt-4">
        <Card.Header>
          <h4>Redeem Pawn Ticket</h4>
        </Card.Header>
        <Card.Body>
          <Stack gap={3}>
            <div>
              <label className="form-label">Amount Due</label>
              <div className="form-control-plaintext">0.00 USDC</div>
              <small className="text-muted">Principal + Accrued Interest</small>
            </div>

            <div>
              <label className="form-label">Pledged Asset</label>
              <div className="form-control-plaintext">-</div>
            </div>

            <div>
              <label className="form-label">Redemption Amount</label>
              <input
                type="number"
                className="form-control"
                placeholder="0.00 USDC"
                disabled
              />
            </div>

            <div className="d-grid">
              <Button variant="success" size="lg" disabled>
                <FiCheckCircle className="me-2" />
                Redeem Asset
              </Button>
            </div>
          </Stack>
        </Card.Body>
      </Card>

      <Card className="mt-4">
        <Card.Header>
          <h5>Extend Your Ticket (Optional)</h5>
        </Card.Header>
        <Card.Body>
          <p className="text-muted">
            Can't redeem yet? Pay the interest due to extend your pawn ticket
            for another term.
          </p>
          <Button variant="outline-primary" disabled>
            Extend Ticket (Pay Interest)
          </Button>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default Redeem;
