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

// XSS Sanitization helper
const sanitizeHtml = (str: string): string => {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
};

// Toast notification helpers
export const showSuccess = (title: string, message?: string) => {
  console.log(`[SUCCESS] ${title}: ${message}`);
  // In production, integrate with your toast library (e.g., react-toastify, chakra-ui toast)
  const safeTitle = sanitizeHtml(title);
  const safeMessage = message ? sanitizeHtml(message) : "";
  alert(`${safeTitle}${safeMessage ? `: ${safeMessage}` : ""}`);
};

export const showError = (title: string, message?: string) => {
  console.error(`[ERROR] ${title}: ${message}`);
  // In production, integrate with your toast library
  const safeTitle = sanitizeHtml(title);
  const safeMessage = message ? sanitizeHtml(message) : "";
  alert(`Error - ${safeTitle}${safeMessage ? `: ${safeMessage}` : ""}`);
};

export const showInfo = (title: string, message?: string) => {
  console.info(`[INFO] ${title}: ${message}`);
  const safeTitle = sanitizeHtml(title);
  const safeMessage = message ? sanitizeHtml(message) : "";
  alert(`${safeTitle}${safeMessage ? `: ${safeMessage}` : ""}`);
};
