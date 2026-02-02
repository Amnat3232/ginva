import { Connection, PublicKey, clusterApiUrl } from "@solana/web3.js";
import { Program, AnchorProvider, web3, BN } from "@project-serum/anchor";
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import { PhantomWalletAdapter } from "@solana/wallet-adapter-phantom";
import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom/client";

// Program ID
const PROGRAM_ID = "2QB6u5RVJv4ta9ZDDB7T7DXsDeNP3WXpt3mUgcBQGWw7";

// Network configuration
const network = WalletAdapterNetwork.Devnet;
const endpoint = clusterApiUrl(network);

// Main App Component
const App = () => {
  const [wallet, setWallet] = useState(null);
  const [connected, setConnected] = useState(false);
  const [provider, setProvider] = useState(null);
  const [program, setProgram] = useState(null);
  const [balance, setBalance] = useState(null);
  const [message, setMessage] = useState("");

  // Initialize connection
  const connection = new Connection(endpoint, "confirmed");

  // Connect wallet
  const connectWallet = async () => {
    try {
      const phantom = new PhantomWalletAdapter();
      await phantom.connect();
      setWallet(phantom);
      setConnected(true);

      const anchorProvider = new AnchorProvider(connection, phantom, {
        preflightCommitment: "confirmed",
      });
      setProvider(anchorProvider);

      // Create program instance
      const program = new Program(
        // IDL would go here - for now we'll create a basic one
        {
          version: "0.1.0",
          name: "ginva",
          instructions: [
            {
              name: "initialize",
              accounts: [],
              args: [],
            },
          ],
        },
        PROGRAM_ID,
        anchorProvider
      );
      setProgram(program);

      setMessage("✅ Wallet connected successfully!");
    } catch (error) {
      setMessage(`❌ Error: ${error.message}`);
    }
  };

  // Disconnect wallet
  const disconnectWallet = async () => {
    try {
      if (wallet) {
        await wallet.disconnect();
      }
      setWallet(null);
      setConnected(false);
      setProvider(null);
      setProgram(null);
      setBalance(null);
      setMessage("✅ Disconnected successfully");
    } catch (error) {
      setMessage(`❌ Error: ${error.message}`);
    }
  };

  // Check balance
  const checkBalance = async () => {
    if (wallet && connected) {
      try {
        const balance = await connection.getBalance(wallet.publicKey);
        setBalance((balance / 1e9).toFixed(4));
      } catch (error) {
        setMessage(`❌ Unable to check balance: ${error.message}`);
      }
    }
  };

  // Initialize program
  const initializeProgram = async () => {
    if (!program || !provider) {
      setMessage("❌ Please connect wallet first");
      return;
    }

    try {
      // Create a new account for the program state
      const programStateAccount = web3.Keypair.generate();

      const tx = await program.methods
        .initialize()
        .accounts({
          authority: provider.wallet.publicKey,
          stateAccount: programStateAccount.publicKey,
          systemProgram: web3.SystemProgram.programId,
        })
        .signers([programStateAccount])
        .rpc();

      setMessage(`✅ Initialize successful! Transaction: ${tx}`);
    } catch (error) {
      setMessage(`❌ Initialize failed: ${error.message}`);
    }
  };

  // Check program
  const checkProgram = async () => {
    try {
      const programInfo = await connection.getAccountInfo(
        new PublicKey(PROGRAM_ID)
      );
      if (programInfo) {
        setMessage(
          `✅ Program found on devnet! Owner: ${programInfo.owner.toString()}`
        );
      } else {
        setMessage("❌ Program not found on devnet");
      }
    } catch (error) {
      setMessage(`❌ Program check failed: ${error.message}`);
    }
  };

  // Auto-update balance when connected
  useEffect(() => {
    if (connected && wallet) {
      checkBalance();
      const interval = setInterval(checkBalance, 5000); // Update every 5 seconds
      return () => clearInterval(interval);
    }
  }, [connected, wallet]);

  return (
    <div>
      {/* Wallet Section */}
      <div style={{ marginBottom: "20px" }}>
        <h3>📱 Wallet Status</h3>
        {!connected ? (
          <button onClick={connectWallet}>Connect Wallet</button>
        ) : (
          <div>
            <button onClick={disconnectWallet}>Disconnect</button>
            {wallet && (
              <div style={{ marginTop: "10px" }}>
                <p>
                  <strong>Address:</strong> {wallet.publicKey.toString()}
                </p>
                <p>
                  <strong>Balance:</strong> {balance} SOL
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Program Section */}
      <div style={{ marginBottom: "20px" }}>
        <h3>📋 Program Actions</h3>
        <button onClick={initializeProgram} disabled={!connected}>
          Initialize Program
        </button>
        <button onClick={checkProgram}>Check Program</button>
      </div>

      {/* Messages */}
      {message && (
        <div
          style={{
            padding: "10px",
            borderRadius: "5px",
            marginTop: "20px",
            backgroundColor: message.includes("✅") ? "#e7ffe7" : "#ffe7e7",
            color: message.includes("✅") ? "#006600" : "#cc0000",
          }}
        >
          {message}
        </div>
      )}

      {/* Program Info */}
      <div
        style={{
          backgroundColor: "#e7f3ff",
          padding: "10px",
          borderRadius: "5px",
          marginTop: "20px",
        }}
      >
        <h4>📊 Program Info</h4>
        <p>
          <strong>Program ID:</strong> {PROGRAM_ID}
        </p>
        <p>
          <strong>Network:</strong> Devnet
        </p>
        <p>
          <strong>Status:</strong>{" "}
          {connected ? "🟢 Connected" : "🔴 Disconnected"}
        </p>
      </div>
    </div>
  );
};

// Render the app
const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App />);
