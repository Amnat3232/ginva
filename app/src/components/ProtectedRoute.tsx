import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useWallet } from "@solana/wallet-adapter-react";
import { Loading } from "./ui/Loading";

interface ProtectedRouteProps {
  children: ReactNode;
  requireAdmin?: boolean;
  adminWallet?: string;
  keeperWallet?: string;
}

export function ProtectedRoute({
  children,
  requireAdmin = false,
  adminWallet,
  keeperWallet,
}: ProtectedRouteProps) {
  const { connected, publicKey } = useWallet();

  if (!connected || !publicKey) {
    return <Navigate to="/" replace />;
  }

  if (requireAdmin && adminWallet) {
    const userAddress = publicKey.toString();
    const isAdmin = userAddress === adminWallet;
    const isKeeper = keeperWallet ? userAddress === keeperWallet : false;

    if (!isAdmin && !isKeeper) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white">
          <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
          <p className="text-gray-400">
            You do not have permission to access this page.
          </p>
        </div>
      );
    }
  }

  return <>{children}</>;
}
