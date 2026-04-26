import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink } from 'react-router-dom';
import WalletGenerator from './WalletGenerator';
import WalletPage from './WalletPage';
import SwapPage from './SwapPage';
import AboutPage from './AboutPage';
import './App.css';

const wordmark = `   ___                        _      __     ____    __
  / _ \\__ _____  ___  __ __  | | /| / /__ _/ / /__ / /_
 / ___/ // / _ \\/ _ \\/ // /  | |/ |/ / _ \`/ / / -_) __/
/_/   \\_,_/ .__/ .__/\\_, /   |__/|__/\\_,_/_/_/\\__/\\__/
         /_/  /_/   /___/`;

function App() {
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('pw-theme');
    return saved ? saved === 'dark' : true;
  });

  useEffect(() => {
    if (isDark) {
      document.body.classList.remove('light');
    } else {
      document.body.classList.add('light');
    }
    localStorage.setItem('pw-theme', isDark ? 'dark' : 'light');
  }, [isDark]);

  return (
    <Router>
      <div className="screen scanlines">
        <div className="wordmark-container">
          <pre className="wordmark">{wordmark}</pre>
        </div>

        <div className="divider">+────────────────────────────────────────────────────+</div>

        <nav className="nav">
          <div className="nav-left" />
          <div className="nav-links">
            <NavLink to="/" end className={({ isActive }) => isActive ? 'active' : ''}>[ create ]</NavLink>
            <NavLink to="/wallet" className={({ isActive }) => isActive ? 'active' : ''}>[ access ]</NavLink>
            <NavLink to="/swap" className={({ isActive }) => isActive ? 'active' : ''}>[ swap ]</NavLink>
            <NavLink to="/about" className={({ isActive }) => isActive ? 'active' : ''}>[ about ]</NavLink>
          </div>
          <div className="nav-right">
            <button className="btn nav-toggle" onClick={() => setIsDark(v => !v)}>
              {isDark ? '[ light ]' : '[ dark ]'}
            </button>
          </div>
        </nav>

        <Routes>
          <Route path="/" element={<WalletGenerator />} />
          <Route path="/wallet" element={<WalletPage />} />
          <Route path="/swap" element={<SwapPage />} />
          <Route path="/about" element={<AboutPage />} />
        </Routes>

        <div className="footer">
          puppywallet.xyz · agpl-3.0 · no keys stored · ever
        </div>
      </div>
    </Router>
  );
}

export default App;
