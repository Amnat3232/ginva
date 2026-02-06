import { Container, Card, Stack } from "react-bootstrap";

const Borrow = () => {
  return (
    <Container>
      <Stack direction="vertical" gap={4} className="mb-4">
        <h1>Borrow USDC</h1>
        <p className="text-muted">Borrow against your deposited collateral</p>

        <Card>
          <Card.Body className="text-center py-5">
            <Stack direction="vertical" gap={3}>
              <h3>🚧 Coming Soon...</h3>
              <p className="text-muted">
                Borrow interface is under development. Check back soon!
              </p>
              <p className="text-muted small">
                • Calculate borrowing power based on LTV • Real-time interest
                rates • Flexible loan terms
              </p>
            </Stack>
          </Card.Body>
        </Card>
      </Stack>
    </Container>
  );
};

export default Borrow;
