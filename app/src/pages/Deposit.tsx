import { Container, Card, Stack } from "react-bootstrap";

const Deposit = () => {
  return (
    <Container>
      <Stack direction="vertical" gap={4} className="mb-4">
        <h1>Deposit Collateral</h1>
        <p className="text-muted">Deposit SOL, BTC, or ETH as collateral</p>

        <Card>
          <Card.Body className="text-center py-5">
            <Stack direction="vertical" gap={3}>
              <h3>🚧 Coming Soon...</h3>
              <p className="text-muted">
                Deposit interface is under development. Check back soon!
              </p>
              <p className="text-muted small">
                • Support for SOL, BTC, ETH collaterals • Real-time collateral
                tracking • Automatic LTV calculation
              </p>
            </Stack>
          </Card.Body>
        </Card>
      </Stack>
    </Container>
  );
};

export default Deposit;
