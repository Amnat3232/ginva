import React, { useState, useEffect } from "react";
import Layout from "../components/Layout";
import Card from "../components/Card";
import Button from "../components/Button";
import Icon from "../components/Icon";
import { useAlerts } from "../hooks/useAlerts";
import { supabase } from "../lib/supabase";
import type { Alert } from "../types";

const ALERT_TYPE_LABELS: Record<Alert["type"], string> = {
  health_factor: "Health Factor Alert",
  maturity: "Maturity Alert",
  liquidation: "Liquidation Warning",
};

const ALERT_TYPE_DESCRIPTIONS: Record<Alert["type"], string> = {
  health_factor: "Get notified when your health factor drops below threshold",
  maturity: "Receive alerts before your loan matures",
  liquidation: "Warning when approaching liquidation risk",
};

export default function AlertsPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);

  useEffect(() => {
    async function getUser() {
      if (!supabase) {
        setUserId(null);
        setLoadingUser(false);
        return;
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUserId(user?.id ?? null);
      setLoadingUser(false);
    }
    getUser();
  }, []);

  const { loading, error, alerts, toggleAlert, createAlert, deleteAlert } =
    useAlerts(userId);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newAlertType, setNewAlertType] =
    useState<Alert["type"]>("health_factor");
  const [threshold, setThreshold] = useState("1.5");
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleCreateAlert = async () => {
    const parsed = parseFloat(threshold);
    if (isNaN(parsed) || parsed < 0 || parsed > 10) {
      setValidationError("Threshold must be between 0 and 10");
      return;
    }
    setValidationError(null);
    await createAlert(newAlertType, parsed);
    setShowCreateModal(false);
    setThreshold("1.5");
  };

  const getAlertIcon = (type: Alert["type"], className = "") => {
    switch (type) {
      case "health_factor":
        return (
          <Icon
            name="heart"
            size="lg"
            className={className}
            ariaLabel="health"
          />
        );
      case "maturity":
        return (
          <Icon
            name="calendar"
            size="lg"
            className={className}
            ariaLabel="maturity"
          />
        );
      case "liquidation":
        return (
          <Icon
            name="exclamation"
            size="lg"
            className={className}
            ariaLabel="warning"
          />
        );
      default:
        return (
          <Icon name="bell" size="lg" className={className} ariaLabel="alert" />
        );
    }
  };

  const getAlertColor = (type: Alert["type"]) => {
    switch (type) {
      case "health_factor":
        return "text-ginva-cyan";
      case "maturity":
        return "text-ginva-gold";
      case "liquidation":
        return "text-ginva-red";
      default:
        return "text-ginva-silver";
    }
  };

  return (
    <Layout title="Alerts - GINVA">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-display font-bold mb-1">Alerts</h1>
            <p className="text-ginva-silver">
              Manage your notification preferences
            </p>
          </div>
          <Button variant="primary" onClick={() => setShowCreateModal(true)}>
            + Add Alert
          </Button>
        </div>

        {loadingUser || loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-ginva-cyan"></div>
          </div>
        ) : !userId ? (
          <Card>
            <div className="text-center py-8">
              <div className="w-12 h-12 mx-auto mb-3 text-ginva-cyan">
                <Icon name="lock" size="xl" ariaLabel="locked" />
              </div>
              <p className="text-ginva-silver">
                Please connect your wallet to manage alerts
              </p>
            </div>
          </Card>
        ) : error ? (
          <Card>
            <div className="text-center py-8">
              <p className="text-ginva-red">
                Error loading alerts: {error.message}
              </p>
            </div>
          </Card>
        ) : (
          <>
            {/* Active Alerts */}
            <div className="mb-6">
              <h2 className="text-lg font-semibold mb-4">Active Alerts</h2>
              {alerts.filter((a) => a.enabled).length === 0 ? (
                <Card>
                  <div className="text-center py-8">
                    <div className="w-12 h-12 mx-auto mb-3 text-ginva-silver">
                      <Icon name="bell" size="xl" ariaLabel="no alerts" />
                    </div>
                    <p className="text-ginva-silver">No active alerts</p>
                    <p className="text-sm text-ginva-silver mt-1">
                      Create an alert to get notified
                    </p>
                  </div>
                </Card>
              ) : (
                <div className="space-y-4">
                  {alerts
                    .filter((alert) => alert.enabled)
                    .map((alert) => (
                      <Card key={alert.id}>
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-4">
                            <div className={getAlertColor(alert.type)}>
                              {getAlertIcon(alert.type)}
                            </div>
                            <div>
                              <h3
                                className={`font-semibold ${getAlertColor(
                                  alert.type
                                )}`}
                              >
                                {ALERT_TYPE_LABELS[alert.type]}
                              </h3>
                              <p className="text-ginva-silver text-sm mt-1">
                                {ALERT_TYPE_DESCRIPTIONS[alert.type]}
                              </p>
                              {alert.threshold && (
                                <p className="text-sm text-ginva-silver mt-2">
                                  Threshold:{" "}
                                  <span className="font-mono text-ginva-cyan">
                                    {alert.threshold}
                                  </span>
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() =>
                                toggleAlert(alert.id, !alert.enabled)
                              }
                              className="p-2 hover:bg-ginva-slate/50 rounded-lg transition-colors"
                              title={alert.enabled ? "Disable" : "Enable"}
                              aria-label={
                                alert.enabled ? "Disable alert" : "Enable alert"
                              }
                            >
                              {alert.enabled ? (
                                <Icon
                                  name="bell"
                                  size="md"
                                  ariaLabel="bell on"
                                />
                              ) : (
                                <Icon
                                  name="bell"
                                  size="md"
                                  className="text-ginva-silver"
                                  ariaLabel="bell off"
                                />
                              )}
                            </button>
                            <button
                              onClick={() => deleteAlert(alert.id)}
                              className="p-2 hover:bg-ginva-red/20 rounded-lg transition-colors text-ginva-red"
                              title="Delete"
                              aria-label="Delete alert"
                            >
                              <Icon name="trash" size="md" ariaLabel="delete" />
                            </button>
                          </div>
                        </div>
                      </Card>
                    ))}
                </div>
              )}
            </div>

            {/* Disabled Alerts */}
            {alerts.filter((a) => !a.enabled).length > 0 && (
              <div>
                <h2 className="text-lg font-semibold mb-4 text-ginva-silver">
                  Disabled Alerts
                </h2>
                <div className="space-y-4 opacity-60">
                  {alerts
                    .filter((alert) => !alert.enabled)
                    .map((alert) => (
                      <Card key={alert.id}>
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-4">
                            <div className="text-ginva-silver">
                              {getAlertIcon(alert.type)}
                            </div>
                            <div>
                              <h3 className="font-semibold text-ginva-silver">
                                {ALERT_TYPE_LABELS[alert.type]}
                              </h3>
                              <p className="text-ginva-silver text-sm mt-1">
                                {ALERT_TYPE_DESCRIPTIONS[alert.type]}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() =>
                                toggleAlert(alert.id, !alert.enabled)
                              }
                              className="p-2 hover:bg-ginva-slate/50 rounded-lg transition-colors"
                              aria-label={
                                alert.enabled ? "Disable alert" : "Enable alert"
                              }
                            >
                              <Icon
                                name="bell"
                                size="md"
                                className="text-ginva-silver"
                                ariaLabel="bell off"
                              />
                            </button>
                            <button
                              onClick={() => deleteAlert(alert.id)}
                              className="p-2 hover:bg-ginva-red/20 rounded-lg transition-colors text-ginva-red"
                              aria-label="Delete alert"
                            >
                              <Icon name="trash" size="md" ariaLabel="delete" />
                            </button>
                          </div>
                        </div>
                      </Card>
                    ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* Create Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-md">
              <h2 className="text-xl font-semibold mb-4">Create New Alert</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-ginva-silver mb-2">
                    Alert Type
                  </label>
                  <select
                    value={newAlertType}
                    onChange={(e) =>
                      setNewAlertType(e.target.value as Alert["type"])
                    }
                    className="w-full bg-ginva-slate border border-ginva-slate/50 rounded-lg px-4 py-2 focus:outline-none focus:border-ginva-cyan"
                  >
                    <option value="health_factor">Health Factor Alert</option>
                    <option value="maturity">Maturity Alert</option>
                    <option value="liquidation">Liquidation Warning</option>
                  </select>
                </div>

                {newAlertType === "health_factor" && (
                  <div>
                    <label className="block text-sm text-ginva-silver mb-2">
                      Threshold (Health Factor)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="10"
                      value={threshold}
                      onChange={(e) => setThreshold(e.target.value)}
                      className="w-full bg-ginva-slate border border-ginva-slate/50 rounded-lg px-4 py-2 focus:outline-none focus:border-ginva-cyan"
                      placeholder="e.g., 1.5"
                    />
                    {validationError && (
                      <p className="text-xs text-ginva-red mt-1">
                        {validationError}
                      </p>
                    )}
                    <p className="text-xs text-ginva-silver mt-1">
                      Alert when health factor drops below this value
                    </p>
                  </div>
                )}

                <div className="flex space-x-3 pt-4">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => setShowCreateModal(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    className="flex-1"
                    onClick={handleCreateAlert}
                  >
                    Create Alert
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
    </Layout>
  );
}
