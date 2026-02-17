// Validate required environment variables
const getRequiredEnvVar = (name: string, defaultValue?: string): string => {
  const value = import.meta.env[name];
  if (!value && !defaultValue) {
    throw new Error(
      `Missing required environment variable: ${name}\n` +
        `Please check your .env file and ensure all required variables are set.`
    );
  }
  return value || defaultValue!;
};

export const PROGRAM_ID = getRequiredEnvVar("VITE_GINVA_PROGRAM_ID");
export const CLUSTER = getRequiredEnvVar("VITE_SOLANA_NETWORK", "devnet");
export const RPC_ENDPOINT = getRequiredEnvVar(
  "VITE_SOLANA_RPC_ENDPOINT",
  "https://api.devnet.solana.com"
);

export const DEFAULT_DECIMALS = 6;

export const SOLANA_EXPLORER = {
  devnet: "https://explorer.solana.com/?cluster=devnet",
  testnet: "https://explorer.solana.com/?cluster=testnet",
  mainnet: "https://explorer.solana.com",
};

export const getExplorerUrl = (
  address: string,
  type: "tx" | "address" = "address"
) => {
  const cluster = CLUSTER === "mainnet" ? "" : `?cluster=${CLUSTER}`;
  return `https://explorer.solana.com/${type}/${address}${cluster}`;
};
