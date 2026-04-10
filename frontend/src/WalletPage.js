// src/WalletPage.js
import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';

function WalletPage() {
  const [privateKey, setPrivateKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [wallet, setWallet] = useState(null);
  const [balance, setBalance] = useState(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [txStatus, setTxStatus] = useState('');

  useEffect(() => {
    return () => {
      setPrivateKey('');
      setWallet(null);
      setBalance(null);
    };
  }, []);

  const connectWallet = async () => {
    try {
      setError('');
      setIsLoading(true);
      setProgress(10);

      let key = privateKey.trim();
      if (key.startsWith('0x')) key = key.slice(2);
      if (!key.match(/^[0-9a-fA-F]{64}$/)) {
        throw new Error('Private key must be 64 hex characters.');
      }

      setProgress(30);
      const userWallet = new ethers.Wallet('0x' + key);
      const provider = new ethers.JsonRpcProvider(
        `https://eth-mainnet.g.alchemy.com/v2/${process.env.REACT_APP_ALCHEMY_KEY}`
      );
      const connectedWallet = userWallet.connect(provider);

      setProgress(60);
      const balanceBigInt = await provider.getBalance(connectedWallet.address);
      const balanceInEth = ethers.formatEther(balanceBigInt);

      setWallet(connectedWallet);
      setBalance(balanceInEth);
      setProgress(100);
    } catch (err) {
      console.error(err);
      setError(err.message);
      setProgress(0);
    } finally {
      setTimeout(() => setIsLoading(false), 700);
    }
  };

  const forgetWallet = () => {
    setPrivateKey('');
    setWallet(null);
    setBalance(null);
    setError('');
    setRecipient('');
    setAmount('');
    setTxStatus('');
    setProgress(0);
    setShowKey(false);
  };

  const sendTransaction = async () => {
    try {
      setTxStatus('');
      if (!ethers.isAddress(recipient)) {
        setTxStatus('❌ Invalid recipient address.');
        return;
      }

      const tx = {
        to: recipient,
        value: ethers.parseEther(amount),
      };

      const txResponse = await wallet.sendTransaction(tx);
      setTxStatus('⏳ Waiting for confirmation...');
      await txResponse.wait();
      setTxStatus(`✅ Sent ${amount} ETH to ${recipient}`);

      const newBalance = await wallet.provider.getBalance(wallet.address);
      setBalance(ethers.formatEther(newBalance));
      setAmount('');
      setRecipient('');
    } catch (err) {
      console.error(err);
      setTxStatus('❌ Transaction failed: ' + (err.reason || err.message));
    }
  };

  return (
    <div style={{
      padding: '2rem',
      fontFamily: 'Arial, sans-serif',
      maxWidth: '500px',
      margin: '0 auto',
      background: '#fff9f9',
      borderRadius: '16px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
    }}>
      <h1 style={{ textAlign: 'center', fontSize: '2rem', marginBottom: '1.5rem' }}>
        🐶 Access Your Puppy Wallet
      </h1>

      {/* ── Private key input with show/hide ── */}
      <div style={{ position: 'relative', marginBottom: '1rem' }}>
        <input
          type={showKey ? 'text' : 'password'}
          placeholder="Enter your private key"
          value={privateKey}
          onChange={(e) => setPrivateKey(e.target.value)}
          autoComplete="off"
          style={{
            width: '100%',
            padding: '12px',
            paddingRight: '80px',
            fontSize: '16px',
            border: '2px solid #ccc',
            borderRadius: '8px',
            boxSizing: 'border-box',
          }}
        />
        <button
          onClick={() => setShowKey(v => !v)}
          style={{
            position: 'absolute',
            right: '8px',
            top: '50%',
            transform: 'translateY(-50%)',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontSize: '0.8rem',
            color: '#888',
            padding: '4px 8px',
            marginTop: 0,
          }}
        >
          {showKey ? '🙈 Hide' : '👁 Show'}
        </button>
      </div>

      <button
        onClick={connectWallet}
        style={{
          width: '100%',
          padding: '12px',
          fontSize: '16px',
          backgroundColor: '#ffb6b6',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer',
          fontWeight: 'bold'
        }}
        disabled={isLoading}
      >
        {isLoading ? 'Connecting...' : 'Connect Wallet 🔐'}
      </button>

      {isLoading && (
        <div style={{
          marginTop: '20px', height: '10px', background: '#eee',
          borderRadius: '5px', overflow: 'hidden'
        }}>
          <div style={{
            width: `${progress}%`, height: '100%',
            background: '#ff6b6b', transition: 'width 0.4s ease'
          }} />
        </div>
      )}

      {error && (
        <p style={{ color: 'red', marginTop: '1rem', textAlign: 'center' }}>{error}</p>
      )}

      {wallet && (
        <div style={{
          marginTop: '2rem', background: '#fff0f0', borderRadius: '12px',
          padding: '1rem', wordBreak: 'break-word', textAlign: 'center'
        }}>
          <p><strong>Address:</strong><br />{wallet.address}</p>
          <p><strong>ETH Balance:</strong> {balance} ETH</p>

          <input
            type="text"
            placeholder="Recipient address"
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            style={{
              width: '100%', padding: '10px', fontSize: '14px',
              border: '1px solid #ccc', borderRadius: '8px', marginTop: '1rem',
              boxSizing: 'border-box',
            }}
          />
          <input
            type="text"
            placeholder="Amount in ETH"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            style={{
              width: '100%', padding: '10px', fontSize: '14px',
              border: '1px solid #ccc', borderRadius: '8px', marginTop: '0.5rem',
              boxSizing: 'border-box',
            }}
          />
          <button
            onClick={sendTransaction}
            style={{
              width: '100%', padding: '12px', fontSize: '16px',
              backgroundColor: '#90ee90', border: 'none', borderRadius: '8px',
              cursor: 'pointer', fontWeight: 'bold', marginTop: '1rem'
            }}
          >
            🚀 Send ETH
          </button>

          {txStatus && (
            <p style={{ marginTop: '1rem', color: '#444', fontSize: '0.9rem' }}>
              {txStatus}
            </p>
          )}

          <button
            onClick={forgetWallet}
            style={{
              marginTop: '1.5rem', padding: '10px 20px', fontSize: '14px',
              borderRadius: '8px', border: 'none', backgroundColor: '#ff6b6b',
              color: '#fff', cursor: 'pointer'
            }}
          >
            🔐 Forget Wallet
          </button>
        </div>
      )}

      <p style={{ marginTop: '2rem', fontSize: '0.8rem', color: '#999', textAlign: 'center' }}>
        ⚠️ This wallet app does <strong>NOT</strong> store or transmit your private key anywhere.
        Keep it safe! If you refresh or leave the page, you'll need to re-enter your key.
      </p>
      <p style={{ marginTop: '1rem', fontSize: '0.8rem', color: '#999', textAlign: 'center' }}>
        🔗 Official Site: <a href="https://puppywallet.xyz" style={{ color: '#666' }}>puppywallet.xyz</a>
      </p>
    </div>
  );
}

export default WalletPage;
