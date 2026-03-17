import React, { Component, ReactNode } from "react";
import { Alert, Button, Card } from "react-bootstrap";
import { FiAlertTriangle } from "react-icons/fi";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("ErrorBoundary caught:", error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="container py-5">
          <Card className="border-danger">
            <Card.Header className="bg-danger text-white">
              <h5 className="mb-0">
                <FiAlertTriangle style={{ marginRight: 8 }} /> Something went
                wrong
              </h5>
            </Card.Header>
            <Card.Body>
              <Alert variant="danger">
                <Alert.Heading>Error Details</Alert.Heading>
                <p className="mb-0">
                  {this.state.error?.message || "An unexpected error occurred"}
                </p>
              </Alert>
              <div className="d-flex gap-2">
                <Button variant="primary" onClick={this.handleRetry}>
                  Try Again
                </Button>
                <Button
                  variant="outline-secondary"
                  onClick={() => window.location.reload()}
                >
                  Reload Page
                </Button>
              </div>
            </Card.Body>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
