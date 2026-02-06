/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_GINVA_PROGRAM_ID: string;
  readonly VITE_SOLANA_RPC_ENDPOINT: string;
  readonly VITE_SOLANA_NETWORK: string;
  readonly VITE_APP_TITLE: string;
  readonly VITE_APP_DESCRIPTION: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
