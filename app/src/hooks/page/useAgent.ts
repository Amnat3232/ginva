import { useMemo } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import { useQuery } from "@tanstack/react-query";
import { useConnection } from "@solana/wallet-adapter-react";

export interface AgentData {
  isRegistered: boolean;
  name: string;
  description: string;
  framework: string;
  capabilities: string;
  isPaused: boolean;
  rateLimit: number;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  lastActive: number | null;
  earnings: number;
  isLoading: boolean;
  isError: boolean;
  refetch: () => void;
}

const PROGRAM_ID = new PublicKey(
  "6U1QUPxGuWLU9jizzcJiLsKzZU6LT95FzihaVzLsk8xU"
);

export const useAgent = (): AgentData => {
  const { publicKey } = useWallet();
  const { connection } = useConnection();

  const {
    data: agentAccount,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["agent", publicKey?.toString()],
    queryFn: async () => {
      if (!publicKey || !connection) return null;

      try {
        const [agentPda] = PublicKey.findProgramAddressSync(
          [Buffer.from("agent"), publicKey.toBuffer()],
          PROGRAM_ID
        );

        const accountInfo = await connection.getParsedAccountInfo(agentPda);
        return accountInfo.value;
      } catch (error) {
        console.error("Error fetching agent account:", error);
        return null;
      }
    },
    enabled: !!publicKey && !!connection,
    staleTime: 60 * 1000,
  });

  const data = useMemo(() => {
    if (!agentAccount?.data) {
      return {
        isRegistered: false,
        name: "",
        description: "",
        framework: "",
        capabilities: "",
        isPaused: false,
        rateLimit: 0,
        totalRequests: 0,
        successfulRequests: 0,
        failedRequests: 0,
        averageResponseTime: 0,
        lastActive: null,
        earnings: 0,
      };
    }

    try {
      const parsed = agentAccount.data as any;
      return {
        isRegistered: true,
        name: parsed?.name || "",
        description: parsed?.description || "",
        framework: parsed?.framework || "",
        capabilities: parsed?.capabilities || "",
        isPaused: parsed?.isPaused || false,
        rateLimit: parsed?.rateLimit?.toNumber() || 0,
        totalRequests: parsed?.totalRequests?.toNumber() || 0,
        successfulRequests: parsed?.successfulRequests?.toNumber() || 0,
        failedRequests: parsed?.failedRequests?.toNumber() || 0,
        averageResponseTime: parsed?.averageResponseTime?.toNumber() || 0,
        lastActive: parsed?.lastActive?.toNumber()
          ? parsed.lastActive.toNumber() * 1000
          : null,
        earnings: (parsed?.earnings?.toNumber() || 0) / 1e9,
      };
    } catch {
      return {
        isRegistered: false,
        name: "",
        description: "",
        framework: "",
        capabilities: "",
        isPaused: false,
        rateLimit: 0,
        totalRequests: 0,
        successfulRequests: 0,
        failedRequests: 0,
        averageResponseTime: 0,
        lastActive: null,
        earnings: 0,
      };
    }
  }, [agentAccount]);

  return {
    ...data,
    isLoading,
    isError: false,
    refetch,
  };
};
