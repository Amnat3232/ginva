import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { GinvaWalletProvider } from './context/WalletProvider'
import '@solana/wallet-adapter-react-ui/styles.css'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <BrowserRouter>
    <GinvaWalletProvider>
      <App />
    </GinvaWalletProvider>
  </BrowserRouter>
)
