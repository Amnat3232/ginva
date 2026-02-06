import { Container, Card, Button, Stack, Row, Col } from "react-bootstrap";
import { FiPlus, FiDollarSign } from "react-icons/fi";

const Deposit = () => {
  return (
    <Container>
      <Stack direction="vertical" gap={3} className="mb-4">
        <h1>Deposit Collateral</h1>
        <p className="text-muted">
          Deposit assets to earn yield and provide borrowing power
        </p>
      </Stack>

      <Row>
        <Col md={8} lg={6}>
          <Card>
            <Card.Header>
              <h4>Deposit Assets</h4>
            </Card.Header>
            <Card.Body>
              <Stack gap={3}>
                <div>
                  <label className="form-label">Select Asset</label>
                  <select className="form-select">
                    <option>SOL</option>
                    <option>USDC</option>
                  </select>
                </div>

                <div>
                  <label className="form-label">Amount</label>
                  <input
                    type="number"
                    className="form-control"
                    placeholder="0.00"
                  />
                </div>

                <div className="d-grid">
                  <Button variant="success" size="lg">
                    <FiPlus className="me-2" />
                    Deposit
                  </Button>
                </div>
              </Stack>
            </Card.Body>
          </Card>
        </Col>

        <Col md={4} lg={6}>
          <Card>
            <Card.Header>
              <h5>Deposit Stats</h5>
            </Card.Header>
            <Card.Body>
              <Stack gap={2}>
                <div className="d-flex justify-content-between">
                  <span>Current APY:</span>
                  <strong>0%</strong>
                </div>
                <div className="d-flex justify-content-between">
                  <span>Total Deposited:</span>
                  <strong>$0</strong>
                </div>
                <div className="d-flex justify-content-between">
                  <span>Earned Interest:</span>
                  <strong>$0</strong>
                </div>
              </Stack>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default Deposit;
