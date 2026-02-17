import {
  Container,
  Card,
  Button,
  Table,
  Badge,
  Alert,
  Spinner,
  Stack,
  Row,
  Col,
  Form,
  Tabs,
  Tab,
} from "react-bootstrap";
import {
  FiZap,
  FiAlertTriangle,
  FiClock,
  FiActivity,
  FiShield,
  FiTrendingDown,
  FiCalendar,
} from "react-icons/fi";
import { useState, useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useGinvaProgram } from "../hooks/useGinvaProgram";
import { showSuccess, showError } from "../utils/helpers";
import * as anchor from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";

interface LoanItem {
  id: number;
  publicKey: PublicKey;
  borrower: PublicKey;
  asset: string;
  collateralAmount: number;
  loanAmount: number;
  healthFactor: number;
  maturityAt: number;
  status: string;
  ltvOption: number;
  interestRateBps: number;
  collateralMint: PublicKey;
}

const Keeper = () => {
  const { publicKey, connected } = useWallet();
  const { program } = useGinvaProgram();
  const [activeLoans, setActiveLoans] = useState<LoanItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [triggeringLoan, setTriggeringLoan] = useState<number | null>(null);
  const [currentTime, setCurrentTime] = useState(Date.now());
  const [filter, setFilter] = useState<string>("eligible");
  const [activeTab, setActiveTab] = useState("health-factor");

  // Update current time every second for countdown
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Fetch all active loans
  useEffect(() => {
    const fetchActiveLoans = async () => {
      if (!program) return;
      setLoading(true);
      try {
        const allLoans = await program.account.loanAccount.all([
          {
            memcmp: {
              offset: 73, // status field offset (after borrower, loan_id, collateral_mint, created_at, etc.)
              bytes: "1", // Active status = 1
            },
          },
        ]);

        const loanData: LoanItem[] = await Promise.all(
          allLoans.map(async (loan: { publicKey: PublicKey; account: any }) => {
            const account = loan.account;
            const isSol = account.collateralMint
              .toString()
              .endsWith("So11111111111111111111111111111112");
            const asset = isSol ? "SOL" : "USDC";
            const decimals = isSol ? 9 : 6;

            let healthFactor = 1000; // Default safe
            try {
              // Try to fetch price and calculate health factor
              // Mock calculation for now - in production would fetch from oracle
              const collateralValue =
                (account.collateralAmount.toNumber() / Math.pow(10, decimals)) *
                (isSol ? 100 : 1);
              const loanValue = account.loanAmount.toNumber() / 1e6;
              healthFactor =
                loanValue > 0
                  ? Math.floor(((collateralValue * 0.85) / loanValue) * 100)
                  : 1000;
            } catch (e: any) {
              console.log(
                "Could not calculate health factor for loan",
                account.loanId
              );
            }

            return {
              id: account.loanId,
              publicKey: loan.publicKey,
              borrower: account.borrower,
              asset,
              collateralAmount:
                account.collateralAmount.toNumber() / Math.pow(10, decimals),
              loanAmount: account.loanAmount.toNumber() / 1e6,
              healthFactor,
              maturityAt: account.maturityAt.toNumber(),
              status: "active",
              ltvOption: account.ltvOption,
              interestRateBps: account.interestRateBps,
              collateralMint: account.collateralMint,
            };
          })
        );

        setActiveLoans(loanData);
      } catch (error: any) {
        console.error("Error fetching loans:", error);
        showError("Failed to fetch loans", error.message || "Unknown error");
      } finally {
        setLoading(false);
      }
    };

    fetchActiveLoans();
  }, [program]);

  // Check if loan is eligible for liquidation
  const isEligibleForHealthFactor = (loan: LoanItem) => {
    return loan.healthFactor < 100;
  };

  const isEligibleForMaturity = (loan: LoanItem) => {
    const protectionEnd = loan.maturityAt + 72 * 3600; // 72 hours after maturity
    return currentTime / 1000 > protectionEnd;
  };

  const isInProtectionPeriod = (loan: LoanItem) => {
    const protectionEnd = loan.maturityAt + 72 * 3600;
    return (
      currentTime / 1000 > loan.maturityAt &&
      currentTime / 1000 <= protectionEnd
    );
  };

  // Format countdown
  const formatCountdown = (targetTime: number) => {
    const remaining = targetTime - currentTime / 1000;
    if (remaining <= 0) return "00:00:00";

    const hours = Math.floor(remaining / 3600);
    const minutes = Math.floor((remaining % 3600) / 60);
    const seconds = Math.floor(remaining % 60);

    return `${hours}h ${minutes}m ${seconds}s`;
  };

  // Trigger liquidation by health factor
  const triggerHealthFactorLiquidation = async (loan: LoanItem) => {
    if (!connected || !program || !publicKey) {
      showError("Wallet Not Connected", "Please connect your wallet first");
      return;
    }

    setTriggeringLoan(loan.id);
    try {
      const systemConfigPda = PublicKey.findProgramAddressSync(
        [Buffer.from("config")],
        program.programId
      )[0];
      const assetConfigPda = PublicKey.findProgramAddressSync(
        [Buffer.from("asset_config"), loan.collateralMint.toBuffer()],
        program.programId
      )[0];
      const liquidationProcessPda = PublicKey.findProgramAddressSync(
        [Buffer.from("liquidation"), loan.publicKey.toBuffer()],
        program.programId
      )[0];
      const vaultAuthorityPda = PublicKey.findProgramAddressSync(
        [Buffer.from("vault_auth")],
        program.programId
      )[0];
      const seizedAssetsVaultPda = PublicKey.findProgramAddressSync(
        [Buffer.from("seized_vault"), loan.publicKey.toBuffer()],
        program.programId
      )[0];
      const vaultCollateralPda = PublicKey.findProgramAddressSync(
        [Buffer.from("collateral_vault"), loan.collateralMint.toBuffer()],
        program.programId
      )[0];
      const pythPriceFeed = new PublicKey(
        "H6ARHf6YXhGYeQfUzQNGk6rDNnLBQKrenN712K4AQJEG"
      ); // SOL/USD devnet

      await program.methods
        .liquidateByHealthFactor()
        .accounts({
          keeperA: publicKey,
          loanAccount: loan.publicKey,
          systemConfig: systemConfigPda,
          liquidationProcess: liquidationProcessPda,
          vaultAuthority: vaultAuthorityPda,
          vaultCollateralAccount: vaultCollateralPda,
          seizedAssetsVault: seizedAssetsVaultPda,
          assetConfig: assetConfigPda,
          pythPriceFeed: pythPriceFeed,
          tokenProgram: anchor.utils.token.TOKEN_PROGRAM_ID,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .rpc();

      showSuccess(
        "Liquidation Triggered!",
        `Loan #${loan.id} is now in liquidation process. You will receive 0.6% reward.`
      );

      // Remove loan from list
      setActiveLoans((prev) => prev.filter((l) => l.id !== loan.id));
    } catch (error: any) {
      console.error("Error triggering liquidation:", error);
      showError("Trigger Failed", error.message);
    } finally {
      setTriggeringLoan(null);
    }
  };

  // Trigger liquidation by maturity
  const triggerMaturityLiquidation = async (loan: LoanItem) => {
    if (!connected || !program || !publicKey) {
      showError("Wallet Not Connected", "Please connect your wallet first");
      return;
    }

    setTriggeringLoan(loan.id);
    try {
      const systemConfigPda = PublicKey.findProgramAddressSync(
        [Buffer.from("config")],
        program.programId
      )[0];
      const liquidationProcessPda = PublicKey.findProgramAddressSync(
        [Buffer.from("liquidation"), loan.publicKey.toBuffer()],
        program.programId
      )[0];
      const vaultAuthorityPda = PublicKey.findProgramAddressSync(
        [Buffer.from("vault_auth")],
        program.programId
      )[0];
      const seizedAssetsVaultPda = PublicKey.findProgramAddressSync(
        [Buffer.from("seized_vault"), loan.publicKey.toBuffer()],
        program.programId
      )[0];
      const vaultCollateralPda = PublicKey.findProgramAddressSync(
        [Buffer.from("collateral_vault"), loan.collateralMint.toBuffer()],
        program.programId
      )[0];

      await program.methods
        .liquidateByMaturity()
        .accounts({
          keeperA: publicKey,
          loanAccount: loan.publicKey,
          systemConfig: systemConfigPda,
          liquidationProcess: liquidationProcessPda,
          vaultAuthority: vaultAuthorityPda,
          vaultCollateralAccount: vaultCollateralPda,
          seizedAssetsVault: seizedAssetsVaultPda,
          tokenProgram: anchor.utils.token.TOKEN_PROGRAM_ID,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .rpc();

      showSuccess(
        "Liquidation Triggered!",
        `Loan #${loan.id} (overdue) is now in liquidation process. You will receive 0.6% reward.`
      );

      // Remove loan from list
      setActiveLoans((prev) => prev.filter((l) => l.id !== loan.id));
    } catch (error: any) {
      console.error("Error triggering liquidation:", error);
      showError("Trigger Failed", error.message);
    } finally {
      setTriggeringLoan(null);
    }
  };

  // Filter loans based on selected filter
  const filteredLoans = activeLoans.filter((loan) => {
    if (filter === "all") return true;
    if (filter === "eligible") {
      if (activeTab === "health-factor") {
        return isEligibleForHealthFactor(loan);
      } else {
        return isEligibleForMaturity(loan);
      }
    }
    if (filter === "protection") {
      return isInProtectionPeriod(loan);
    }
    return true;
  });

  return (
    <Container className="py-4">
      {/* Header */}
      <Stack direction="vertical" gap={3} className="mb-4">
        <div className="d-flex justify-content-between align-items-center">
          <h1>
            <FiZap className="me-2" />
            Keeper Dashboard
          </h1>
          <Badge bg="warning" text="dark" className="fs-6">
            <FiShield className="me-1" />
            Keeper A Mode
          </Badge>
        </div>
        <p className="text-muted">
          Trigger liquidations to earn 0.6% rewards. Monitor loans and act when
          conditions are met.
        </p>
      </Stack>

      {/* Stats Cards */}
      <Row className="mb-4 g-3">
        <Col md={3}>
          <Card className="border-danger h-100">
            <Card.Body>
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <h6 className="text-danger">Health Factor &lt; 100%</h6>
                  <h3 className="mb-0 text-danger">
                    {activeLoans.filter(isEligibleForHealthFactor).length}
                  </h3>
                  <small className="text-muted">Immediate liquidation</small>
                </div>
                <FiTrendingDown size={32} className="text-danger" />
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="border-warning h-100">
            <Card.Body>
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <h6 className="text-warning">Overdue (Past 72h)</h6>
                  <h3 className="mb-0 text-warning">
                    {activeLoans.filter(isEligibleForMaturity).length}
                  </h3>
                  <small className="text-muted">Ready for liquidation</small>
                </div>
                <FiCalendar size={32} className="text-warning" />
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="border-info h-100">
            <Card.Body>
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <h6 className="text-info">In Protection Period</h6>
                  <h3 className="mb-0 text-info">
                    {activeLoans.filter(isInProtectionPeriod).length}
                  </h3>
                  <small className="text-muted">Wait for countdown</small>
                </div>
                <FiClock size={32} className="text-info" />
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="h-100">
            <Card.Body>
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <h6 className="text-muted">Total Active Loans</h6>
                  <h3 className="mb-0">{activeLoans.length}</h3>
                  <small className="text-muted">Being monitored</small>
                </div>
                <FiActivity size={32} className="text-primary" />
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Tabs for liquidation types */}
      <Card className="mb-4">
        <Card.Header>
          <Tabs
            activeKey={activeTab}
            onSelect={(k) => setActiveTab(k || "health-factor")}
            className="border-0"
          >
            <Tab
              eventKey="health-factor"
              title={
                <span>
                  <FiTrendingDown className="me-1" />
                  Health Factor Liquidation
                </span>
              }
            />
            <Tab
              eventKey="maturity"
              title={
                <span>
                  <FiCalendar className="me-1" />
                  Maturity Liquidation
                </span>
              }
            />
          </Tabs>
        </Card.Header>
        <Card.Body>
          {/* Info Alert */}
          {activeTab === "health-factor" ? (
            <Alert variant="danger" className="mb-3">
              <FiAlertTriangle className="me-2" />
              <strong>Health Factor Liquidation:</strong> Trigger when
              collateral value drops below loan value (Health Factor &lt; 100%).
              This is an immediate liquidation to protect investor funds. No
              72-hour protection period applies.
            </Alert>
          ) : (
            <Alert variant="warning" className="mb-3">
              <FiClock className="me-2" />
              <strong>Maturity Liquidation:</strong> Trigger when loan is
              overdue AND past the 72-hour protection period. The borrower has
              already had 72 hours to repay or extend.
            </Alert>
          )}

          {/* Filter */}
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h5 className="mb-0">
              {activeTab === "health-factor"
                ? "Undercollateralized Loans"
                : "Overdue Loans"}
            </h5>
            <Form.Select
              style={{ width: "200px" }}
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            >
              <option value="eligible">
                {activeTab === "health-factor"
                  ? "Eligible (HF < 100%)"
                  : "Eligible (Past 72h)"}
              </option>
              <option value="all">All Active Loans</option>
              {activeTab === "maturity" && (
                <option value="protection">In Protection Period</option>
              )}
            </Form.Select>
          </div>

          {/* Loans Table */}
          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" />
              <p className="mt-2 text-muted">Loading loans...</p>
            </div>
          ) : filteredLoans.length === 0 ? (
            <div className="text-center py-5">
              <FiShield size={48} className="text-muted mb-3" />
              <p className="text-muted">
                {filter === "eligible"
                  ? activeTab === "health-factor"
                    ? "No undercollateralized loans found. All loans are healthy!"
                    : "No overdue loans past 72-hour protection period."
                  : "No active loans found."}
              </p>
            </div>
          ) : (
            <Table responsive hover>
              <thead>
                <tr>
                  <th>Loan ID</th>
                  <th>Borrower</th>
                  <th>Asset</th>
                  <th>Collateral</th>
                  <th>Loan Amount</th>
                  {activeTab === "health-factor" ? (
                    <th>Health Factor</th>
                  ) : (
                    <th>Status</th>
                  )}
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredLoans.map((loan) => {
                  const isEligible =
                    activeTab === "health-factor"
                      ? isEligibleForHealthFactor(loan)
                      : isEligibleForMaturity(loan);
                  const inProtection = isInProtectionPeriod(loan);

                  return (
                    <tr key={loan.id}>
                      <td>#{loan.id}</td>
                      <td>
                        <code className="small">
                          {loan.borrower.toString().slice(0, 8)}...
                          {loan.borrower.toString().slice(-8)}
                        </code>
                      </td>
                      <td>
                        <strong>{loan.asset}</strong>
                      </td>
                      <td>
                        {loan.collateralAmount.toFixed(4)} {loan.asset}
                      </td>
                      <td>{loan.loanAmount.toFixed(2)} USDC</td>
                      {activeTab === "health-factor" ? (
                        <td>
                          <Badge
                            bg={loan.healthFactor < 100 ? "danger" : "success"}
                          >
                            {loan.healthFactor}%
                          </Badge>
                          {loan.healthFactor < 100 && (
                            <div className="small text-danger mt-1">
                              <FiAlertTriangle className="me-1" />
                              Critical!
                            </div>
                          )}
                        </td>
                      ) : (
                        <td>
                          {inProtection ? (
                            <div>
                              <Badge bg="info">Protection Period</Badge>
                              <div className="small text-info mt-1">
                                <FiClock className="me-1" />
                                {formatCountdown(loan.maturityAt + 72 * 3600)}
                              </div>
                            </div>
                          ) : currentTime / 1000 > loan.maturityAt ? (
                            <Badge bg="warning" text="dark">
                              Ready to Liquidate
                            </Badge>
                          ) : (
                            <Badge bg="success">Active</Badge>
                          )}
                        </td>
                      )}
                      <td>
                        {isEligible ? (
                          <Button
                            variant="danger"
                            size="sm"
                            disabled={triggeringLoan === loan.id}
                            onClick={() =>
                              activeTab === "health-factor"
                                ? triggerHealthFactorLiquidation(loan)
                                : triggerMaturityLiquidation(loan)
                            }
                          >
                            {triggeringLoan === loan.id ? (
                              <>
                                <Spinner
                                  as="span"
                                  animation="border"
                                  size="sm"
                                  className="me-1"
                                />
                                Processing...
                              </>
                            ) : (
                              <>
                                <FiZap className="me-1" />
                                Trigger
                              </>
                            )}
                          </Button>
                        ) : inProtection ? (
                          <Button variant="secondary" size="sm" disabled>
                            <FiClock className="me-1" />
                            Wait...
                          </Button>
                        ) : (
                          <Button
                            variant="outline-secondary"
                            size="sm"
                            disabled
                          >
                            Not Eligible
                          </Button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>

      {/* How It Works */}
      <Card>
        <Card.Header>
          <h5>How Keeper Liquidation Works</h5>
        </Card.Header>
        <Card.Body>
          <Row>
            <Col md={6}>
              <h6 className="text-danger">
                <FiTrendingDown className="me-2" />
                System A: Health Factor
              </h6>
              <ol className="text-muted">
                <li>Monitor loans with Health Factor &lt; 100%</li>
                <li>Click "Trigger" to start liquidation</li>
                <li>Receive 0.6% of collateral as reward</li>
                <li>Asset moves to Storefront for sale</li>
              </ol>
              <Alert variant="danger" className="small">
                <strong>Immediate Action:</strong> No waiting period. Protects
                investor funds from sudden price drops.
              </Alert>
            </Col>
            <Col md={6}>
              <h6 className="text-warning">
                <FiCalendar className="me-2" />
                System B: Maturity
              </h6>
              <ol className="text-muted">
                <li>Monitor overdue loans past 72-hour protection</li>
                <li>Click "Trigger" to start liquidation</li>
                <li>Receive 0.6% of collateral as reward</li>
                <li>Asset moves to Storefront for sale</li>
              </ol>
              <Alert variant="warning" className="small">
                <strong>After Protection:</strong> Borrower has 72 hours to
                repay/extend before you can trigger.
              </Alert>
            </Col>
          </Row>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default Keeper;
