import { Container, Card, Button, Stack, Form } from "react-bootstrap";
import { FiTrendingUp } from "react-icons/fi";

const Pawn = () => {
  return (
    <Container>
      <Stack direction="vertical" gap={3} className="mb-4">
        <h1>Pawn Your Assets</h1>
        <p className="text-muted">
          Get instant USDC by pawning your digital assets. No credit checks,
          just your collateral.
        </p>
      </Stack>

      <Card>
        <Card.Header>
          <h4>Create Pawn Ticket</h4>
        </Card.Header>
        <Card.Body>
          <Stack gap={3}>
            <div>
              <label className="form-label">Pledged Asset Available</label>
              <div className="form-control-plaintext">$0.00 (0 SOL)</div>
            </div>

            <div>
              <label className="form-label">Pawn Amount</label>
              <input
                type="number"
                className="form-control"
                placeholder="0.00 USDC"
              />
              <Form.Text className="text-muted">
                Enter the amount of USDC you want to receive
              </Form.Text>
            </div>

            <div>
              <label className="form-label">Interest Rate</label>
              <div className="form-control-plaintext">0% APR</div>
              <Form.Text className="text-muted">
                Fixed rate for the duration of your pawn ticket
              </Form.Text>
            </div>

            <div className="alert alert-info">
              <strong>Asset Coverage:</strong> N/A
              <br />
              <small>
                The value of your pledged asset vs amount pawned. Above 100% is
                safe.
              </small>
            </div>

            <div className="d-grid">
              <Button variant="primary" size="lg">
                <FiTrendingUp className="me-2" />
                Pawn Now
              </Button>
            </div>
          </Stack>
        </Card.Body>
      </Card>

      <Card className="mt-4">
        <Card.Header>
          <h5>How It Works</h5>
        </Card.Header>
        <Card.Body>
          <Stack gap={2}>
            <div className="d-flex align-items-start gap-3">
              <div
                className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center"
                style={{ width: "32px", height: "32px", minWidth: "32px" }}
              >
                1
              </div>
              <div>
                <strong>Pledge Your Asset</strong>
                <p className="text-muted small mb-0">
                  Deposit SOL or supported tokens as collateral
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
                <strong>Receive Your Ticket</strong>
                <p className="text-muted small mb-0">
                  Get instant USDC and a Smart Pawn Ticket
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
                <strong>Redeem Anytime</strong>
                <p className="text-muted small mb-0">
                  Pay the amount due to get your asset back
                </p>
              </div>
            </div>
          </Stack>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default Pawn;
