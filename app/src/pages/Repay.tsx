import { Container, Card, Stack } from "react-bootstrap";

const Repay = () => {
  return (
    <Container>
      <Stack direction="vertical" gap={4} className="mb-4">
        <h1>Repay Loan</h1>
        <p className="text-muted">Repay your loan and reclaim collateral</p>

        <Card>
          <Card.Body className="text-center py-5">
            <Stack direction="vertical" gap={3}>
              <h3>🚧 Coming Soon...</h3>
              <p className="text-muted">
                Repay interface is under development. Check back soon!
              </p>
              <p className="text-muted small">
                • Calculate remaining balance • Partial repayment support •
                Collateral recovery
              </p>
            </Stack>
          </Card.Body>
        </Card>
      </Stack>
    </Container>
  );
};

export default Repay;
