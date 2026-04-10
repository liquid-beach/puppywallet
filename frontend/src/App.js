import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import WalletGenerator from './WalletGenerator'; // This is your current code from App.js
import WalletPage from './WalletPage'; // The new interactive page
import SwapPage from './SwapPage';

function App() {
  return (
    <Router>
      <div className="App" style={{ padding: '20px' }}>
        <nav style={{ marginBottom: '20px' }}>
          <Link to="/" style={{ marginRight: '10px' }}>🐶 Create Wallet</Link>
          <Link to="/wallet">🔐 Access Wallet</Link>
          <Link to="/swap">🔄 Swap</Link>
        </nav>

        <Routes>
          <Route path="/" element={<WalletGenerator />} />
          <Route path="/wallet" element={<WalletPage />} />
          <Route path="/swap" element={<SwapPage />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
