import { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabase";
import type { Alert } from "../types";

interface UseAlertsResult {
  loading: boolean;
  error: Error | null;
  alerts: Alert[];
  toggleAlert: (id: string, enabled: boolean) => Promise<void>;
  createAlert: (type: Alert["type"], threshold?: number) => Promise<void>;
  deleteAlert: (id: string) => Promise<void>;
  refetch: () => Promise<void>;
}

export function useAlerts(
  userId: string | null,
  filterType?: Alert["type"]
): UseAlertsResult {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);

  const fetchAlerts = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let query = supabase.from("alerts").select("*").eq("user_id", userId);

      if (filterType) {
        query = query.eq("type", filterType);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) {
        throw new Error(fetchError.message);
      }

      setAlerts((data as Alert[]) || []);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Unknown error"));
    } finally {
      setLoading(false);
    }
  }, [userId, filterType]);

  const toggleAlert = useCallback(async (id: string, enabled: boolean) => {
    try {
      const { error: updateError } = await supabase
        .from("alerts")
        .update({ enabled })
        .eq("id", id);

      if (updateError) {
        throw new Error(updateError.message);
      }

      setAlerts((prev) =>
        prev.map((alert) => (alert.id === id ? { ...alert, enabled } : alert))
      );
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Unknown error"));
    }
  }, []);

  const createAlert = useCallback(
    async (type: Alert["type"], threshold?: number) => {
      if (!userId) return;

      try {
        const { data, error: insertError } = await supabase
          .from("alerts")
          .insert({
            user_id: userId,
            type,
            threshold,
            enabled: true,
          })
          .select()
          .single();

        if (insertError) {
          throw new Error(insertError.message);
        }

        if (data) {
          setAlerts((prev) => [...prev, data as Alert]);
        }
      } catch (err) {
        setError(err instanceof Error ? err : new Error("Unknown error"));
      }
    },
    [userId]
  );

  const deleteAlert = useCallback(async (id: string) => {
    try {
      const { error: deleteError } = await supabase
        .from("alerts")
        .delete()
        .eq("id", id);

      if (deleteError) {
        throw new Error(deleteError.message);
      }

      setAlerts((prev) => prev.filter((alert) => alert.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Unknown error"));
    }
  }, []);

  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  return {
    loading,
    error,
    alerts,
    toggleAlert,
    createAlert,
    deleteAlert,
    refetch: fetchAlerts,
  };
}
