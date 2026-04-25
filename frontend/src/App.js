import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import WalletGenerator from './WalletGenerator';
import WalletPage from './WalletPage';
import SwapPage from './SwapPage';
import AboutPage from './AboutPage';

function App() {
  return (
    <Router>
      <div className="App" style={{ padding: '20px' }}>
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
