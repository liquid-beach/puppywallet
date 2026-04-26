import React from 'react';

function AboutPage() {
  return (
    <div className="page">
      <div className="section-header">{'// about puppy wallet'}</div>

      <div className="term-box" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <div className="about-section">
          <h2>what is puppy wallet?</h2>
          <p>
            Puppy Wallet is a lightweight, browser-based Ethereum wallet app. It lets you generate
            a new wallet, access an existing one with your private key, check your ETH balance,
            send transactions, and swap tokens — all without installing anything or creating an account.
          </p>
        </div>

        <div className="about-section">
          <h2>why use it?</h2>
          <ul>
            <li><strong>no sign-up required</strong> — just bring your private key and go</li>
            <li><strong>your key never leaves your browser</strong> — nothing is stored or transmitted</li>
            <li><strong>no extensions, no downloads</strong> — works in any modern browser</li>
            <li><strong>token swaps built in</strong> — swap ETH and ERC-20 tokens via live quotes</li>
            <li><strong>open and transparent</strong> — simple code, no hidden magic</li>
          </ul>
        </div>

        <div className="about-section">
          <h2>what can i do here?</h2>
          <ul>
            <li><strong>create</strong> — generate a fresh Ethereum address and private key</li>
            <li><strong>access</strong> — load your wallet to view balance and send ETH</li>
            <li><strong>swap</strong> — swap tokens using live V2/V3 routing quotes</li>
          </ul>
        </div>

        <div className="about-section">
          <h2>who is it for?</h2>
          <p>
            Anyone who wants a fast, no-frills way to interact with Ethereum without spinning up
            MetaMask or connecting to a dApp. Great for quickly checking a wallet, sending ETH,
            or grabbing a fresh address on the fly.
          </p>
        </div>
      </div>

      <div className="warn-box">
        ⚠ security reminder: Puppy Wallet never stores or transmits your private key.
        it lives only in your browser session. close the tab and it's gone.
        never share your private key with anyone.
      </div>

      <div style={{ fontSize: '9px', color: '#2a2a2a', letterSpacing: '0.15em' }}>
        🔗 <a href="https://puppywallet.xyz">puppywallet.xyz</a>
      </div>
    </div>
  );
}

export default AboutPage;
