import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import WalletGenerator from './WalletGenerator';
import WalletPage from './WalletPage';
import SwapPage from './SwapPage';
import AboutPage from './AboutPage';

const wordmark = `   ___                        _      __     ____    __
  / _ \\__ _____  ___  __ __  | | /| / /__ _/ / /__ / /_
 / ___/ // / _ \\/ _ \\/ // /  | |/ |/ / _ \`/ / / -_) __/
/_/   \\_,_/ .__/ .__/\\_, /   |__/|__/\\_,_/_/_/\\__/\\__/
         /_/  /_/   /___/                               `;

function App() {
  return (
    <Router>
      <div className="App" style={{ padding: '20px', maxWidth: '100vw', overflowX: 'hidden', boxSizing: 'border-box' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '8px', overflowX: 'auto' }}>
          <pre style={{
            fontFamily: "'Courier New', monospace",
            color: '#444444',
            fontSize: 'clamp(6px, 1.5vw, 11px)',
            whiteSpace: 'pre',
            textAlign: 'left',
            background: 'transparent',
            border: 'none',
            margin: 0,
            padding: 0,
          }}>{wordmark}</pre>
        </div>
        <nav style={{ marginBottom: '20px', display: 'flex', justifyContent: 'center', gap: '20px' }}>
          <Link to="/">🐶 Create Wallet</Link>
          <Link to="/wallet">🔐 Access Wallet</Link>
          <Link to="/swap">🔄 Swap</Link>
          <Link to="/about">📖 About</Link>
        </nav>

        <Routes>
          <Route path="/" element={<WalletGenerator />} />
          <Route path="/wallet" element={<WalletPage />} />
          <Route path="/swap" element={<SwapPage />} />
          <Route path="/about" element={<AboutPage />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
