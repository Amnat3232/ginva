import {
  Container,
  Card,
  Button,
  Stack,
  Row,
  Col,
  Badge,
  Form,
} from "react-bootstrap";
import { FiShoppingBag, FiTag, FiClock, FiPercent } from "react-icons/fi";
import { useState } from "react";

interface ForfeitedAsset {
  id: string;
  ticketId: number;
  assetType: string;
  assetName: string;
  collateralAmount: string;
  marketValue: string;
  discountPrice: string;
  discountPercent: number;
  forfeitedAt: string;
  timeRemaining: string;
  image: string;
}

const Storefront = () => {
  const [filter, setFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("newest");

  // Mock data - ในอนาคตจะดึงจาก Smart Contract (LiquidationProcess accounts)
  const forfeitedAssets: ForfeitedAsset[] = [
    {
      id: "forfeit-001",
      ticketId: 5,
      assetType: "SOL",
      assetName: "Solana",
      collateralAmount: "25.5 SOL",
      marketValue: "$5,100.00",
      discountPrice: "$4,692.00",
      discountPercent: 8,
      forfeitedAt: "2025-02-05",
      timeRemaining: "18 hours",
      image: "🔷",
    },
    {
      id: "forfeit-002",
      ticketId: 8,
      assetType: "USDC",
      assetName: "USD Coin",
      collateralAmount: "1,000 USDC",
      marketValue: "$1,000.00",
      discountPrice: "$920.00",
      discountPercent: 8,
      forfeitedAt: "2025-02-06",
      timeRemaining: "20 hours",
      image: "💵",
    },
    {
      id: "forfeit-003",
      ticketId: 12,
      assetType: "BONK",
      assetName: "Bonk",
      collateralAmount: "5,000,000 BONK",
      marketValue: "$850.00",
      discountPrice: "$782.00",
      discountPercent: 8,
      forfeitedAt: "2025-02-06",
      timeRemaining: "22 hours",
      image: "🐕",
    },
    {
      id: "forfeit-004",
      ticketId: 15,
      assetType: "SOL",
      assetName: "Solana",
      collateralAmount: "10 SOL",
      marketValue: "$2,000.00",
      discountPrice: "$1,840.00",
      discountPercent: 8,
      forfeitedAt: "2025-02-07",
      timeRemaining: "23 hours",
      image: "🔷",
    },
  ];

  const filteredAssets = forfeitedAssets.filter((asset) => {
    if (filter === "all") return true;
    return asset.assetType.toLowerCase() === filter.toLowerCase();
  });

  const sortedAssets = [...filteredAssets].sort((a, b) => {
    switch (sortBy) {
      case "discount":
        return b.discountPercent - a.discountPercent;
      case "price-low":
        return (
          parseFloat(a.discountPrice.replace(/[$,]/g, "")) -
          parseFloat(b.discountPrice.replace(/[$,]/g, ""))
        );
      case "price-high":
        return (
          parseFloat(b.discountPrice.replace(/[$,]/g, "")) -
          parseFloat(a.discountPrice.replace(/[$,]/g, ""))
        );
      case "newest":
      default:
        return (
          new Date(b.forfeitedAt).getTime() - new Date(a.forfeitedAt).getTime()
        );
    }
  });

  return (
    <Container>
      <Stack direction="vertical" gap={3} className="mb-4">
        <div className="d-flex justify-content-between align-items-start">
          <div>
            <h1>Storefront</h1>
            <p className="text-muted">
              Browse forfeited assets available at a discount. Like a real pawn
              shop bargain bin!
            </p>
          </div>
          <Badge bg="success" className="fs-6 px-3 py-2">
            <FiPercent className="me-2" />
            8% Discount on All Items
          </Badge>
        </div>
      </Stack>

      {/* Stats */}
      <Row className="mb-4">
        <Col md={3}>
          <Card className="h-100">
            <Card.Body>
              <Stack direction="vertical" gap={2}>
                <div>
                  <h5 className="text-muted">Available Items</h5>
                  <h3 className="mb-1" style={{ color: "#16a34a" }}>
                    {forfeitedAssets.length}
                  </h3>
                </div>
                <div className="text-end">
                  <FiShoppingBag size={24} color="#16a34a" />
                </div>
              </Stack>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="h-100">
            <Card.Body>
              <Stack direction="vertical" gap={2}>
                <div>
                  <h5 className="text-muted">Total Value</h5>
                  <h3 className="mb-1" style={{ color: "#0d6efd" }}>
                    $8,950
                  </h3>
                </div>
                <div className="text-end">
                  <FiTag size={24} color="#0d6efd" />
                </div>
              </Stack>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="h-100">
            <Card.Body>
              <Stack direction="vertical" gap={2}>
                <div>
                  <h5 className="text-muted">Avg. Discount</h5>
                  <h3 className="mb-1" style={{ color: "#dc3545" }}>
                    8%
                  </h3>
                </div>
                <div className="text-end">
                  <FiPercent size={24} color="#dc3545" />
                </div>
              </Stack>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="h-100">
            <Card.Body>
              <Stack direction="vertical" gap={2}>
                <div>
                  <h5 className="text-muted">Time Left</h5>
                  <h3 className="mb-1" style={{ color: "#fd7e14" }}>
                    24h
                  </h3>
                  <small className="text-muted">Before DEX listing</small>
                </div>
                <div className="text-end">
                  <FiClock size={24} color="#fd7e14" />
                </div>
              </Stack>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Filters */}
      <Card className="mb-4">
        <Card.Body>
          <Row className="align-items-center">
            <Col md={6}>
              <Form.Group>
                <Form.Label>Filter by Asset Type</Form.Label>
                <Form.Select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                >
                  <option value="all">All Assets</option>
                  <option value="SOL">Solana (SOL)</option>
                  <option value="USDC">USD Coin (USDC)</option>
                  <option value="BONK">Bonk (BONK)</option>
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group>
                <Form.Label>Sort By</Form.Label>
                <Form.Select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                >
                  <option value="newest">Newest First</option>
                  <option value="discount">Highest Discount</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Assets Grid */}
      {sortedAssets.length === 0 ? (
        <Card>
          <Card.Body className="text-center py-5">
            <h4 className="text-muted mb-3">No forfeited assets available</h4>
            <p className="text-muted">Check back later for new bargains!</p>
          </Card.Body>
        </Card>
      ) : (
        <Row xs={1} md={2} lg={3} className="g-4">
          {sortedAssets.map((asset) => (
            <Col key={asset.id}>
              <Card className="h-100 shadow-sm">
                <Card.Header className="bg-light">
                  <div className="d-flex justify-content-between align-items-center">
                    <Badge bg="primary">{asset.assetType}</Badge>
                    <Badge bg="danger">-{asset.discountPercent}% OFF</Badge>
                  </div>
                </Card.Header>
                <Card.Body>
                  <Stack gap={3}>
                    <div className="text-center py-3">
                      <span style={{ fontSize: "4rem" }}>{asset.image}</span>
                    </div>

                    <div>
                      <h5>{asset.assetName}</h5>
                      <p className="text-muted mb-1">
                        Ticket #{asset.ticketId}
                      </p>
                      <p className="text-muted small">
                        Forfeited: {asset.forfeitedAt}
                      </p>
                    </div>

                    <div className="border-top pt-3">
                      <Row>
                        <Col xs={6}>
                          <small className="text-muted">Collateral</small>
                          <p className="mb-0 fw-bold">
                            {asset.collateralAmount}
                          </p>
                        </Col>
                        <Col xs={6}>
                          <small className="text-muted">Market Value</small>
                          <p className="mb-0 text-decoration-line-through text-muted">
                            {asset.marketValue}
                          </p>
                        </Col>
                      </Row>
                    </div>

                    <div className="bg-success bg-opacity-10 p-3 rounded">
                      <div className="d-flex justify-content-between align-items-center">
                        <div>
                          <small className="text-success">Your Price</small>
                          <h4 className="mb-0 text-success">
                            {asset.discountPrice}
                          </h4>
                        </div>
                        <div className="text-end">
                          <small className="text-muted">Save</small>
                          <p className="mb-0 text-danger fw-bold">
                            $
                            {(
                              parseFloat(
                                asset.marketValue.replace(/[$,]/g, "")
                              ) -
                              parseFloat(
                                asset.discountPrice.replace(/[$,]/g, "")
                              )
                            ).toFixed(2)}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="d-flex justify-content-between align-items-center text-muted small">
                      <span>
                        <FiClock className="me-1" />
                        {asset.timeRemaining} left
                      </span>
                      <span>24h storefront window</span>
                    </div>

                    <Button variant="success" size="lg" className="w-100">
                      <FiShoppingBag className="me-2" />
                      Buy Now
                    </Button>
                  </Stack>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      )}

      {/* How It Works */}
      <Card className="mt-5">
        <Card.Header>
          <h5>How the Storefront Works</h5>
        </Card.Header>
        <Card.Body>
          <Row>
            <Col md={4} className="mb-3">
              <Stack gap={2}>
                <div
                  className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center"
                  style={{ width: "40px", height: "40px" }}
                >
                  1
                </div>
                <h6>Assets Are Forfeited</h6>
                <p className="text-muted small">
                  When a pawn ticket expires without redemption, the pledged
                  asset becomes forfeited.
                </p>
              </Stack>
            </Col>
            <Col md={4} className="mb-3">
              <Stack gap={2}>
                <div
                  className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center"
                  style={{ width: "40px", height: "40px" }}
                >
                  2
                </div>
                <h6>24-Hour Storefront Window</h6>
                <p className="text-muted small">
                  Forfeited assets are available here at 8% discount for 24
                  hours before moving to DEX.
                </p>
              </Stack>
            </Col>
            <Col md={4} className="mb-3">
              <Stack gap={2}>
                <div
                  className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center"
                  style={{ width: "40px", height: "40px" }}
                >
                  3
                </div>
                <h6>Buy at a Discount</h6>
                <p className="text-muted small">
                  Purchase assets below market price. No bidding, no waiting -
                  instant ownership!
                </p>
              </Stack>
            </Col>
          </Row>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default Storefront;
