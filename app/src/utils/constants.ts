export const PROGRAM_ID = import.meta.env.VITE_GINVA_PROGRAM_ID || "";
export const CLUSTER = import.meta.env.VITE_SOLANA_NETWORK || "devnet";
export const RPC_ENDPOINT =
  import.meta.env.VITE_SOLANA_RPC_ENDPOINT || "https://api.devnet.solana.com";

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
