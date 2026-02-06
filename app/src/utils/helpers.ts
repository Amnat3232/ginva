import { PublicKey, Connection } from "@solana/web3.js";
import { PROGRAM_ID, CLUSTER, RPC_ENDPOINT } from "./constants";

export { PROGRAM_ID, CLUSTER, RPC_ENDPOINT };

export const GINVA_PROGRAM_ID = new PublicKey(PROGRAM_ID);

export const getConnection = () => {
  return new Connection(RPC_ENDPOINT);
};

export const formatNumber = (num: number, decimals = 2): string => {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(num);
};

export const formatCurrency = (num: number, currency = "USD"): string => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
};

export const formatAddress = (address: string, chars = 4): string => {
  if (address.length <= chars * 2) return address;
  return `${address.slice(0, chars)}...${address.slice(-chars)}`;
};

export const shortenAddress = (address: string): string => {
  return formatAddress(address);
};

export const sleep = (ms: number): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};
