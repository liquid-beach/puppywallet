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
        throw new Error('private key must be 64 hex characters.');
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
        setTxStatus('❌ invalid recipient address.');
        return;
      }

      const tx = {
        to: recipient,
        value: ethers.parseEther(amount),
      };

      const txResponse = await wallet.sendTransaction(tx);
      setTxStatus('⏳ waiting for confirmation...');
      await txResponse.wait();
      setTxStatus(`✅ sent ${amount} eth to ${recipient}`);

      const newBalance = await wallet.provider.getBalance(wallet.address);
      setBalance(ethers.formatEther(newBalance));
      setAmount('');
      setRecipient('');
    } catch (err) {
      console.error(err);
      setTxStatus('❌ transaction failed: ' + (err.reason || err.message));
    }
  };

  return (
    <div className="page">
      <div className="section-header">{'// access wallet'}</div>

      <div className="field-group">
        <span className="term-label">private key</span>
        <div className="term-row">
          <input
            type={showKey ? 'text' : 'password'}
            placeholder="enter 64 hex chars..."
            value={privateKey}
            onChange={(e) => setPrivateKey(e.target.value)}
            autoComplete="off"
            className="term-input"
          />
          <button className="btn" onClick={() => setShowKey(v => !v)}>
            {showKey ? '[ hide ]' : '[ show ]'}
          </button>
        </div>
      </div>

      <button
        className="btn primary btn-full"
        onClick={connectWallet}
        disabled={isLoading}
      >
        {isLoading ? '[ connecting... ]' : '[ connect wallet ]'}
      </button>

      {isLoading && (
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${progress}%` }} />
        </div>
      )}

      {error && (
        <div className="status-line error">! {error}</div>
      )}

      {wallet && (
        <div className="term-box" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="field-group">
            <span className="term-label">address</span>
            <div className="address-display">{wallet.address}</div>
          </div>

          <div className="field-group">
            <span className="term-label">eth balance</span>
            <div className="stat-value" style={{ padding: '0.4rem 0' }}>{balance} ETH</div>
          </div>

          <div className="divider" style={{ padding: '0' }}>+────────────+</div>

          <div className="field-group">
            <span className="term-label">recipient address</span>
            <input
              type="text"
              placeholder="0x..."
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              className="term-input"
            />
          </div>

          <div className="field-group">
            <span className="term-label">amount (eth)</span>
            <input
              type="text"
              placeholder="0.0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="term-input"
            />
          </div>

          <button className="btn primary btn-full" onClick={sendTransaction}>
            [ send eth ]
          </button>

          {txStatus && (
            <div className="status-line">{txStatus}</div>
          )}

          <button className="btn btn-full" onClick={forgetWallet}>
            [ forget wallet ]
          </button>
        </div>
      )}

      <div className="warn-box">
        ⚠ this app does not store or transmit your private key anywhere. if you refresh or
        leave the page, you will need to re-enter your key.
      </div>
    </div>
  );
}

export default WalletPage;
