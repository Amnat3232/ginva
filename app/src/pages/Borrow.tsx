import { Container, Card, Button, Stack } from "react-bootstrap";
import { FiTrendingUp, FiDollarSign } from "react-icons/fi";

const Borrow = () => {
  return (
    <Container>
      <Stack direction="vertical" gap={3} className="mb-4">
        <h1>Borrow Assets</h1>
        <p className="text-muted">
          Borrow USDC against your deposited collateral
        </p>
      </Stack>

      <Card>
        <Card.Header>
          <h4>Borrow USDC</h4>
        </Card.Header>
        <Card.Body>
          <Stack gap={3}>
            <div>
              <label className="form-label">Collateral Available</label>
              <div className="form-control-plaintext">$0.00 (0 SOL)</div>
            </div>

            <div>
              <label className="form-label">Borrow Amount</label>
              <input
                type="number"
                className="form-control"
                placeholder="0.00 USDC"
              />
            </div>

            <div>
              <label className="form-label">Borrow APY</label>
              <div className="form-control-plaintext">0%</div>
            </div>

            <div className="alert alert-info">
              <strong>Health Factor:</strong> N/A
            </div>

            <div className="d-grid">
              <Button variant="primary" size="lg">
                <FiTrendingUp className="me-2" />
                Borrow USDC
              </Button>
            </div>
          </Stack>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default Borrow;
