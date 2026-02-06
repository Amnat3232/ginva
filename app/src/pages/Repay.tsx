import { Container, Card, Button, Stack } from "react-bootstrap";
import { FiCheckCircle, FiDollarSign } from "react-icons/fi";

const Repay = () => {
  return (
    <Container>
      <Stack direction="vertical" gap={3} className="mb-4">
        <h1>Repay Loans</h1>
        <p className="text-muted">
          Reay your borrowed USDC to improve health factor
        </p>
      </Stack>

      <Card>
        <Card.Header>
          <h4>Your Active Loans</h4>
        </Card.Header>
        <Card.Body className="text-center py-5">
          <p className="text-muted">No active loans to repay.</p>
        </Card.Body>
      </Card>

      <Card className="mt-4">
        <Card.Header>
          <h4>Make a Repayment</h4>
        </Card.Header>
        <Card.Body>
          <Stack gap={3}>
            <div>
              <label className="form-label">Outstanding Debt</label>
              <div className="form-control-plaintext">0.00 USDC</div>
            </div>

            <div>
              <label className="form-label">Repayment Amount</label>
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
                Repay Loan
              </Button>
            </div>
          </Stack>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default Repay;
