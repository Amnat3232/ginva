import { useState, useEffect } from 'react';
import { useWalletContext, Network, NETWORKS } from '../context/WalletProvider';

export function NetworkSwitcher() {
  const { network, setNetwork, connected } = useWalletContext();
  const [isOpen, setIsOpen] = useState(false);
  const [isChanging, setIsChanging] = useState(false);

  const handleNetworkChange = async (newNetwork: Network) => {
    if (newNetwork === network) {
      setIsOpen(false);
      return;
    }

    setIsChanging(true);
    setIsOpen(false);

    // Disconnect first if connected
    if (connected) {
      // The network will change automatically when setNetwork is called
      // The wallet will need to reconnect on the new network
    }

    setNetwork(newNetwork);

    // Small delay for UI feedback
    setTimeout(() => {
      setIsChanging(false);
    }, 500);
  };

  const getNetworkColor = (net: Network) => {
    switch (net) {
      case 'mainnet':
        return '#00e676';
      case 'devnet':
        return '#ffd740';
      case 'testnet':
        return '#ff7043';
      default:
        return '#81c784';
    }
  };

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => !isChanging && setIsOpen(!isOpen)}
        disabled={isChanging}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '6px 12px',
          background: 'rgba(15, 23, 42, 0.8)',
          border: `1px solid ${getNetworkColor(network)}40`,
          borderRadius: '8px',
          color: getNetworkColor(network),
          fontSize: '0.8rem',
          fontWeight: 600,
          cursor: isChanging ? 'wait' : 'pointer',
          transition: 'all 0.2s ease',
          fontFamily: "'IBM Plex Sans', sans-serif",
        }}
      >
        <span
          style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            background: getNetworkColor(network),
            boxShadow: `0 0 8px ${getNetworkColor(network)}`,
            animation: isChanging ? 'pulse 1s infinite' : 'none',
          }}
        />
        {isChanging ? 'Switching...' : NETWORKS[network].name}
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          style={{
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0)',
            transition: 'transform 0.2s ease',
          }}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            right: 0,
            marginTop: '8px',
            background: 'rgba(15, 23, 42, 0.98)',
            border: '1px solid rgba(245, 158, 11, 0.2)',
            borderRadius: '12px',
            padding: '8px',
            minWidth: '140px',
            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.5)',
            zIndex: 1000,
          }}
        >
          {(Object.keys(NETWORKS) as Network[]).map((net) => (
            <button
              key={net}
              onClick={() => handleNetworkChange(net)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                width: '100%',
                padding: '10px 14px',
                borderRadius: '8px',
                border: 'none',
                background: network === net ? 'rgba(245, 158, 11, 0.15)' : 'transparent',
                color: network === net ? '#F59E0B' : '#F8FAFC',
                fontSize: '0.85rem',
                fontWeight: network === net ? 600 : 400,
                fontFamily: "'IBM Plex Sans', sans-serif",
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                if (network !== net) {
                  e.currentTarget.style.background = 'rgba(245, 158, 11, 0.1)';
                }
              }}
              onMouseLeave={(e) => {
                if (network !== net) {
                  e.currentTarget.style.background = 'transparent';
                }
              }}
            >
              <span
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: getNetworkColor(net),
                  boxShadow: `0 0 6px ${getNetworkColor(net)}`,
                }}
              />
              {NETWORKS[net].name}
            </button>
          ))}
        </div>
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}

export default NetworkSwitcher;