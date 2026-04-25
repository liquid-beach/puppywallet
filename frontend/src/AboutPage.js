import React from 'react';

function AboutPage() {
  return (
    <div style={{
      padding: 'clamp(1rem, 4vw, 2rem)',
      fontFamily: 'Arial, sans-serif',
      maxWidth: '600px',
      width: '100%',
      boxSizing: 'border-box',
      margin: '0 auto',
      background: '#fff9f9',
      borderRadius: '16px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
      textAlign: 'left',
      wordWrap: 'normal',
      wordBreak: 'normal',
    }}>
      <h1 style={{ textAlign: 'center', fontSize: '2rem', marginBottom: '0.5rem' }}>
        🐶 About Puppy Wallet
      </h1>
      <p style={{ textAlign: 'center', color: '#888', marginBottom: '2rem', fontSize: '1rem' }}>
        Simple, private, no-nonsense Ethereum wallet tools
      </p>

      <section style={{ marginBottom: '1.75rem' }}>
        <h2 style={{ color: '#ff9900', fontSize: '1.25rem', marginBottom: '0.5rem' }}>What is Puppy Wallet?</h2>
        <p style={{ lineHeight: '1.7', color: '#444' }}>
          Puppy Wallet is a lightweight, browser-based Ethereum wallet app. It lets you generate
          a new wallet, access an existing one with your private key, check your ETH balance,
          send transactions, and swap tokens — all without installing anything or creating an account.
        </p>
      </section>

      <section style={{ marginBottom: '1.75rem' }}>
        <h2 style={{ color: '#ff9900', fontSize: '1.25rem', marginBottom: '0.5rem' }}>Why use it?</h2>
        <ul style={{ lineHeight: '2', color: '#444', paddingLeft: '1.25rem' }}>
          <li><strong>No sign-up required</strong> — just bring your private key and go</li>
          <li><strong>Your key never leaves your browser</strong> — nothing is stored or transmitted</li>
          <li><strong>No extensions, no downloads</strong> — works in any modern browser</li>
          <li><strong>Token swaps built in</strong> — swap ETH and ERC-20 tokens via live quotes</li>
          <li><strong>Open and transparent</strong> — simple code, no hidden magic</li>
        </ul>
      </section>

      <section style={{ marginBottom: '1.75rem' }}>
        <h2 style={{ color: '#ff9900', fontSize: '1.25rem', marginBottom: '0.5rem' }}>What can I do here?</h2>
        <ul style={{ lineHeight: '2', color: '#444', paddingLeft: '1.25rem' }}>
          <li>🐶 <strong>Create Wallet</strong> — generate a fresh Ethereum address and private key</li>
          <li>🔐 <strong>Access Wallet</strong> — load your wallet to view balance and send ETH</li>
          <li>🔄 <strong>Swap</strong> — swap tokens using live V2/V3 routing quotes</li>
        </ul>
      </section>

      <section style={{ marginBottom: '1.75rem' }}>
        <h2 style={{ color: '#ff9900', fontSize: '1.25rem', marginBottom: '0.5rem' }}>Who is it for?</h2>
        <p style={{ lineHeight: '1.7', color: '#444' }}>
          Anyone who wants a fast, no-frills way to interact with Ethereum without spinning up
          MetaMask or connecting to a dApp. Great for quickly checking a wallet, sending ETH,
          or grabbing a fresh address on the fly.
        </p>
      </section>

      <div style={{
        background: '#fff0f0',
        borderRadius: '10px',
        padding: '1rem 1.25rem',
        marginTop: '1.5rem',
      }}>
        <p style={{ color: '#888', fontSize: '0.85rem', margin: 0, lineHeight: '1.6' }}>
          ⚠️ <strong>Security reminder:</strong> Puppy Wallet never stores or transmits your private key.
          It lives only in your browser session. Close the tab and it's gone. Never share your private key
          with anyone.
        </p>
      </div>

      <p style={{ marginTop: '1.5rem', fontSize: '0.8rem', color: '#bbb', textAlign: 'center' }}>
        🔗 <a href="https://puppywallet.xyz" style={{ color: '#aaa' }}>puppywallet.xyz</a>
      </p>
    </div>
  );
}

export default AboutPage;
