import { useState } from "react";
import { Button, Badge } from "react-bootstrap";
import { FiPlay, FiPower } from "react-icons/fi";

interface DemoModeToggleProps {
  isDemoMode: boolean;
  onToggle: () => void;
  disabled?: boolean;
}

export const DemoModeToggle: React.FC<DemoModeToggleProps> = ({
  isDemoMode,
  onToggle,
  disabled = false,
}) => {
  return (
    <div className="d-flex align-items-center gap-2 mb-3">
      <Button
        variant={isDemoMode ? "success" : "outline-secondary"}
        size="sm"
        onClick={onToggle}
        disabled={disabled}
        className="d-flex align-items-center gap-2"
      >
        {isDemoMode ? <FiPower size={14} /> : <FiPlay size={14} />}
        {isDemoMode ? "Demo Mode ON" : "Demo Mode"}
      </Button>
      {isDemoMode && (
        <Badge bg="success" className="ms-2">
          SIMULATION
        </Badge>
      )}
    </div>
  );
};

interface DemoBannerProps {
  onEnableDemo?: () => void;
}

export const DemoBanner: React.FC<DemoBannerProps> = ({ onEnableDemo }) => {
  return (
    <div
      className="alert alert-info d-flex align-items-center justify-content-between"
      style={{
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        border: "none",
        color: "white",
      }}
    >
      <div>
        <strong>🎮 Demo Mode Active</strong>
        <p className="mb-0 small opacity-75">
          This is a simulation. No real transactions will occur.
        </p>
      </div>
      {onEnableDemo && (
        <Button
          variant="light"
          size="sm"
          onClick={onEnableDemo}
        >
          Switch to Real Mode
        </Button>
      )}
    </div>
  );
};