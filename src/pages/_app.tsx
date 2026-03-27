import type { AppProps } from "next/app";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WalletProviders } from "@/providers/WalletProvider";
import { Toaster } from "sonner";
import "../styles/globals.css";

const queryClient = new QueryClient();

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <WalletProviders>
        <Component {...pageProps} />
        <Toaster position="top-right" richColors />
      </WalletProviders>
    </QueryClientProvider>
  );
}

export default MyApp;
