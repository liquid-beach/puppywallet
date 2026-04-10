import React, { useState } from 'react';
import { ethers } from 'ethers';
import { QRCodeSVG } from 'qrcode.react';
import './App.css';

function WalletGenerator() {
  const [wallet, setWallet] = useState(null);
  const [showPrivateKey, setShowPrivateKey] = useState(false);

  const bark = new Audio("/bark.wav");

  const generateWallet = () => {
    const privateKey = ethers.hexlify(ethers.randomBytes(32));
    const newWallet = new ethers.Wallet(privateKey);
    setWallet({
      address: newWallet.address,
      privateKey: newWallet.privateKey,
    });
    setShowPrivateKey(false);
    bark.play();
  };

  const togglePrivateKey = () => {
    setShowPrivateKey(!showPrivateKey);
    bark.play();
  };

  const downloadWallet = () => {
    const element = document.createElement("a");
    const file = new Blob(
      [`Address: ${wallet.address}\nPrivate Key: ${wallet.privateKey}`],
      { type: "text/plain" }
    );
    element.href = URL.createObjectURL(file);
    element.download = "puppy_wallet.txt";
    document.body.appendChild(element);
    element.click();
    bark.play();
  };

  return (
    <div className="App">
      <h1>🐶 Puppy Wallet 🐶</h1>

      <button className="create-wallet" onClick={generateWallet}>
        🐾 Create a New ETH Wallet
      </button>

      {wallet && (
        <>
          <p><strong>Address:</strong><br />{wallet.address}</p>

          <QRCodeSVG value={wallet.address} size={200} />

          <div className="private-key">
            <strong>Private Key:</strong><br />
            {showPrivateKey ? wallet.privateKey : '••••••••••••••••••••••••••••'}
            <br />
            <button onClick={togglePrivateKey}>
              {showPrivateKey ? "Hide 🔒" : "Reveal 🔓"}
            </button>
          </div>

          <button className="download" onClick={downloadWallet}>
            ⬇️ Download Wallet
          </button>
        </>
      )}

      <div className="donation" style={{ marginTop: '40px', fontSize: '14px', color: '#555' }}>
        <p>
          🐾 If you would like to support the project,<br />
          donations can be made to:<br />
          <code>0x9811d968C1cc272392781561780935bAdb09B742</code>
        </p>
      </div>
    </div>
  );
}

export default WalletGenerator;
