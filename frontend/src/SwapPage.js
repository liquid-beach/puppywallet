import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ethers } from 'ethers';

const ALCHEMY_URL = `https://eth-mainnet.g.alchemy.com/v2/${process.env.REACT_APP_ALCHEMY_KEY}`;
const FEE_RECIPIENT = '0x9811d968C1cc272392781561780935bAdb09B742';
const SWAP_ROUTER_ADDRESS = '0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45';
const WETH_ADDRESS = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2';
const QUOTER_ADDRESS = '0xb27308f9F90D607463bb33eA1BeBb41C27CE5AB6';
const V2_ROUTER = '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D';
const V2_ROUTER_ADDRESS = '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D';

const TOKENS = {
  ETH:   { address: 'ETH',                                          decimals: 18, symbol: 'ETH',  name: 'Ethereum'   },
  USDC:  { address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', decimals: 6,  symbol: 'USDC', name: 'USD Coin'    },
  USDT:  { address: '0xdAC17F958D2ee523a2206206994597C13D831ec7', decimals: 6,  symbol: 'USDT', name: 'Tether'      },
  DAI:   { address: '0x6B175474E89094C44Da98b954EedeAC495271d0F', decimals: 18, symbol: 'DAI',  name: 'Dai'         },
  WBTC:  { address: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599', decimals: 8,  symbol: 'WBTC', name: 'Wrapped BTC' },
  WETH:  { address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', decimals: 18, symbol: 'WETH', name: 'Wrapped ETH' },
  NEIRO: { address: '0x812ba41e071c7b7fa4ebcfb62df5f45f6fa853ee', decimals: 9,  symbol: 'NEIRO', name: 'Neiro'       },
};

const ERC20_ABI = [
  'function approve(address spender, uint256 amount) external returns (bool)',
  'function allowance(address owner, address spender) external view returns (uint256)',
  'function balanceOf(address owner) external view returns (uint256)',
  'function decimals() external view returns (uint8)',
  'function symbol() external view returns (string)',
  'function name() external view returns (string)',
  'function transfer(address to, uint256 amount) external returns (bool)',
];

const V3_ROUTER_ABI = [
  'function exactInputSingle((address tokenIn, address tokenOut, uint24 fee, address recipient, uint256 amountIn, uint256 amountOutMinimum, uint160 sqrtPriceLimitX96)) external payable returns (uint256 amountOut)',
];

const V2_ROUTER_ABI = [
  'function getAmountsOut(uint256 amountIn, address[] calldata path) external view returns (uint256[] memory amounts)',
  'function swapExactETHForTokens(uint256 amountOutMin, address[] calldata path, address to, uint256 deadline) external payable returns (uint256[] memory amounts)',
  'function swapExactTokensForETH(uint256 amountIn, uint256 amountOutMin, address[] calldata path, address to, uint256 deadline) external returns (uint256[] memory amounts)',
  'function swapExactTokensForTokens(uint256 amountIn, uint256 amountOutMin, address[] calldata path, address to, uint256 deadline) external returns (uint256[] memory amounts)',
];

const QUOTER_ABI = [
  'function quoteExactInputSingle(address tokenIn, address tokenOut, uint24 fee, uint256 amountIn, uint160 sqrtPriceLimitX96) external returns (uint256 amountOut)',
];

// Try V3 across all fee tiers, then fall back to V2
async function fetchUniswapQuote(fromToken, toToken, amountWei) {
  const provider = new ethers.JsonRpcProvider(ALCHEMY_URL);
  const tokenIn  = fromToken.address === 'ETH' ? WETH_ADDRESS : fromToken.address;
  const tokenOut = toToken.address   === 'ETH' ? WETH_ADDRESS : toToken.address;

  // V3: try 0.3%, 1%, 0.05%
  const quoter = new ethers.Contract(QUOTER_ADDRESS, QUOTER_ABI, provider);
  for (const fee of [3000, 10000, 500]) {
    try {
      const amountOut = await quoter.quoteExactInputSingle.staticCall(
        tokenIn, tokenOut, fee, amountWei, 0
      );
      if (amountOut && amountOut > 0n) {
        return { amountOut, version: 'v3', fee };
      }
    } catch { continue; }
  }

  // V2 fallback
  try {
    const v2Router = new ethers.Contract(V2_ROUTER, V2_ROUTER_ABI, provider);
    const amounts = await v2Router.getAmountsOut(amountWei, [tokenIn, tokenOut]);
    if (amounts && amounts[1] > 0n) {
      return { amountOut: amounts[1], version: 'v2', fee: null };
    }
  } catch { }

  return null;
}

function SwapPage() {
  const [privateKey, setPrivateKey]           = useState('');
  const [showKey, setShowKey]                 = useState(false);
  const [wallet, setWallet]                   = useState(null);
  const [provider, setProvider]               = useState(null);
  const [fromToken, setFromToken]             = useState('ETH');
  const [toToken, setToToken]                 = useState('USDC');
  const [amount, setAmount]                   = useState('');
  const [status, setStatus]                   = useState('');
  const [isLoading, setIsLoading]             = useState(false);
  const [quote, setQuote]                     = useState(null);
  const [quoteFetching, setQuoteFetching]     = useState(false);
  const [balances, setBalances]               = useState({});
  const [balanceFetching, setBalanceFetching] = useState(false);
  const [customToken, setCustomToken]         = useState('');
  const [customTokens, setCustomTokens]       = useState({});
  const [customError, setCustomError]         = useState('');
  const quoteTimer = useRef(null);

  const allTokens = { ...TOKENS, ...customTokens };

  // ── Fetch balances ──────────────────────────────────────────────────────────
  const fetchBalances = useCallback(async (w, prov) => {
    if (!w || !prov) return;
    setBalanceFetching(true);
    const result = {};
    try {
      const ethBal = await prov.getBalance(w.address);
      result['ETH'] = ethers.formatEther(ethBal);
      const tokens = { ...TOKENS, ...customTokens };
      const erc20Keys = Object.keys(tokens).filter(k => tokens[k].address !== 'ETH');
      await Promise.all(erc20Keys.map(async (key) => {
        try {
          const contract = new ethers.Contract(tokens[key].address, ERC20_ABI, prov);
          const bal = await contract.balanceOf(w.address);
          result[key] = ethers.formatUnits(bal, tokens[key].decimals);
        } catch {
          result[key] = '0';
        }
      }));
      setBalances(result);
    } catch (e) {
      console.error('Balance fetch error:', e);
    } finally {
      setBalanceFetching(false);
    }
  }, [customTokens]);

  // ── Connect wallet ──────────────────────────────────────────────────────────
  const connectWallet = async () => {
    try {
      let key = privateKey.trim();
      if (key.startsWith('0x')) key = key.slice(2);
      if (!key.match(/^[0-9a-fA-F]{64}$/)) {
        setStatus('❌ Invalid private key (must be 64 hex chars).');
        return;
      }
      const prov = new ethers.JsonRpcProvider(ALCHEMY_URL);
      const connected = new ethers.Wallet('0x' + key, prov);
      setWallet(connected);
      setProvider(prov);
      setStatus('✅ Wallet connected: ' + connected.address);
      fetchBalances(connected, prov);
    } catch (err) {
      setStatus('❌ ' + err.message);
    }
  };

  // ── Add custom token ────────────────────────────────────────────────────────
  const addCustomToken = async () => {
    setCustomError('');
    const addr = customToken.trim();
    if (!ethers.isAddress(addr)) { setCustomError('❌ Invalid address'); return; }
    if (!provider) { setCustomError('❌ Connect wallet first'); return; }
    try {
      const contract = new ethers.Contract(addr, ERC20_ABI, provider);
      const [sym, dec, nam] = await Promise.all([
        contract.symbol(), contract.decimals(), contract.name(),
      ]);
      const key = sym.toUpperCase();
      const newToken = { address: addr, decimals: Number(dec), symbol: sym, name: nam };
      setCustomTokens(prev => ({ ...prev, [key]: newToken }));
      setCustomToken('');
      if (wallet) {
        const bal = await contract.balanceOf(wallet.address);
        setBalances(prev => ({ ...prev, [key]: ethers.formatUnits(bal, Number(dec)) }));
      }
    } catch (e) {
      setCustomError('❌ Could not load token: ' + e.message);
    }
  };

  // ── Live quote ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (quoteTimer.current) clearTimeout(quoteTimer.current);
    setQuote(null);
    if (!amount || isNaN(amount) || Number(amount) <= 0) return;
    if (fromToken === toToken) return;

    quoteTimer.current = setTimeout(async () => {
      setQuoteFetching(true);
      try {
        const from = allTokens[fromToken];
        const to   = allTokens[toToken];
        if (!from || !to) return;
        const totalAmount = ethers.parseUnits(amount, from.decimals);
        const feeAmount   = totalAmount / 100n;
        const swapAmount  = totalAmount - feeAmount;

        const result = await fetchUniswapQuote(from, to, swapAmount);
        if (result !== null) {
          const outFormatted = ethers.formatUnits(result.amountOut, to.decimals);
          const rate = parseFloat(outFormatted) / parseFloat(amount);
          setQuote({
            buyAmount: outFormatted,
            price: rate.toString(),
            estimatedGas: '~150,000',
            version: result.version,
          });
        } else {
          setQuote({ error: 'Quote unavailable — no liquidity pool found for this pair' });
        }
      } finally {
        setQuoteFetching(false);
      }
    }, 600);
  }, [amount, fromToken, toToken]);

  // ── Execute swap ────────────────────────────────────────────────────────────
  const executeSwap = async () => {
    if (!wallet) { setStatus('❌ Connect your wallet first.'); return; }
    if (!amount || isNaN(amount) || Number(amount) <= 0) { setStatus('❌ Enter a valid amount.'); return; }
    if (fromToken === toToken) { setStatus('❌ Select different tokens.'); return; }

    try {
      setIsLoading(true);
      const prov   = new ethers.JsonRpcProvider(ALCHEMY_URL);
      const signer = new ethers.Wallet(wallet.privateKey, prov);

      const from = allTokens[fromToken];
      const to   = allTokens[toToken];
      const tokenIn  = from.address === 'ETH' ? WETH_ADDRESS : from.address;
      const tokenOut = to.address   === 'ETH' ? WETH_ADDRESS : to.address;
      const isETHIn  = from.address === 'ETH';
      const isETHOut = to.address   === 'ETH';

      const totalAmount = ethers.parseUnits(amount, from.decimals);
      const feeAmount   = totalAmount / 100n;
      const swapAmount  = totalAmount - feeAmount;

      // Find best route
      setStatus('⏳ Finding best pool...');
      const quoteResult = await fetchUniswapQuote(from, to, swapAmount);
      if (!quoteResult) {
        setStatus('❌ No liquidity pool found for this pair.');
        setIsLoading(false);
        return;
      }

      const deadline = Math.floor(Date.now() / 1000) + 60 * 20; // 20 min

      // Handle fee + approval for ERC20 input
      if (!isETHIn) {
        setStatus('⏳ Approving token...');
        const tokenContract = new ethers.Contract(from.address, ERC20_ABI, signer);
        const spender = quoteResult.version === 'v2' ? V2_ROUTER_ADDRESS : SWAP_ROUTER_ADDRESS;
        const allowance = await tokenContract.allowance(signer.address, spender);
        if (allowance < swapAmount) {
          const approveTx = await tokenContract.approve(spender, ethers.MaxUint256);
          await approveTx.wait();
        }
        setStatus('⏳ Sending fee...');
        const feeTx = await tokenContract.transfer(FEE_RECIPIENT, feeAmount);
        await feeTx.wait();
      }

      setStatus(`⏳ Executing swap via Uniswap ${quoteResult.version.toUpperCase()}...`);

      let txResponse;

      if (quoteResult.version === 'v2') {
        const v2Router = new ethers.Contract(V2_ROUTER_ADDRESS, V2_ROUTER_ABI, signer);
        const path = [tokenIn, tokenOut];

        if (isETHIn) {
          // Send ETH fee first
          await signer.sendTransaction({ to: FEE_RECIPIENT, value: feeAmount });
          txResponse = await v2Router.swapExactETHForTokens(
            0, path, signer.address, deadline, { value: swapAmount, gasLimit: 300000 }
          );
        } else if (isETHOut) {
          txResponse = await v2Router.swapExactTokensForETH(
            swapAmount, 0, path, signer.address, deadline, { gasLimit: 300000 }
          );
        } else {
          txResponse = await v2Router.swapExactTokensForTokens(
            swapAmount, 0, path, signer.address, deadline, { gasLimit: 300000 }
          );
        }
      } else {
        // V3
        const v3Router = new ethers.Contract(SWAP_ROUTER_ADDRESS, V3_ROUTER_ABI, signer);
        const params = {
          tokenIn, tokenOut,
          fee: quoteResult.fee,
          recipient: signer.address,
          amountIn: swapAmount,
          amountOutMinimum: 0,
          sqrtPriceLimitX96: 0,
        };

        if (isETHIn) {
          await signer.sendTransaction({ to: FEE_RECIPIENT, value: feeAmount });
          txResponse = await v3Router.exactInputSingle(params, { value: swapAmount, gasLimit: 300000 });
        } else {
          txResponse = await v3Router.exactInputSingle(params, { gasLimit: 300000 });
        }
      }

      setStatus('⏳ Waiting for confirmation...');
      await txResponse.wait();
      setStatus(`✅ Swapped ${amount} ${fromToken} → ${toToken}!\nTx: ${txResponse.hash}`);
      fetchBalances(wallet, prov);
    } catch (err) {
      console.error(err);
      setStatus('❌ Swap failed: ' + (err.reason || err.message));
    } finally {
      setIsLoading(false);
    }
  };

  // ── Styles ──────────────────────────────────────────────────────────────────
  const card = {
    padding: '2rem', fontFamily: "'Comic Sans MS', cursive", maxWidth: '500px',
    margin: '0 auto', background: '#fff9f9', borderRadius: '16px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
  };
  const inputStyle = {
    width: '100%', padding: '12px', fontSize: '15px', border: '2px solid #ccc',
    borderRadius: '8px', marginBottom: '1rem', boxSizing: 'border-box', fontFamily: 'inherit',
  };
  const selectStyle = {
    width: '100%', padding: '10px', fontSize: '15px', borderRadius: '8px',
    border: '1px solid #ccc', marginBottom: '0.5rem', backgroundColor: '#fff', fontFamily: 'inherit',
  };
  const btnPrimary = {
    width: '100%', padding: '12px', fontSize: '16px', backgroundColor: '#ffb6b6',
    border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold',
    marginBottom: '1rem', fontFamily: 'inherit',
  };
  const btnSwap = (disabled) => ({
    ...btnPrimary,
    backgroundColor: disabled ? '#ccc' : '#90ee90',
    cursor: disabled ? 'not-allowed' : 'pointer',
  });
  const balancePill = {
    display: 'inline-block', fontSize: '0.75rem', color: '#888', background: '#f0f0f0',
    borderRadius: '999px', padding: '2px 10px', marginBottom: '0.4rem', marginLeft: '6px',
  };
  const quoteBox = {
    background: '#fff0f0', borderRadius: '10px', padding: '0.75rem 1rem',
    marginBottom: '1rem', fontSize: '0.85rem', color: '#555', textAlign: 'center',
  };
  const formatBal = (key) => {
    const b = balances[key];
    if (b === undefined) return '';
    const n = parseFloat(b);
    if (isNaN(n)) return '';
    return n.toFixed(n < 0.001 ? 6 : 4);
  };

  return (
    <div style={card}>
      <h1 style={{ textAlign: 'center', color: '#ff9900', marginTop: 0 }}>🐶 Puppy Swap</h1>
      <p style={{ textAlign: 'center', fontSize: '0.82rem', color: '#aaa', marginTop: '-0.5rem' }}>
        Powered by Uniswap v2/v3 · 1% fee supports Puppy Wallet 🐾
      </p>

      {/* ── Private key input ── */}
      <div style={{ position: 'relative', marginBottom: '1rem' }}>
        <input
          type={showKey ? 'text' : 'password'}
          placeholder="Enter your private key"
          value={privateKey}
          onChange={(e) => setPrivateKey(e.target.value)}
          autoComplete="off"
          style={{ ...inputStyle, marginBottom: 0, paddingRight: '80px' }}
        />
        <button
          onClick={() => setShowKey(v => !v)}
          style={{
            position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)',
            background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.8rem',
            color: '#888', padding: '4px 8px', fontFamily: 'inherit', marginTop: 0,
          }}
        >
          {showKey ? '🙈 Hide' : '👁 Show'}
        </button>
      </div>

      <button onClick={connectWallet} style={btnPrimary}>🔐 Connect Wallet</button>

      {/* ── Balances ── */}
      {wallet && (
        <div style={{
          background: '#fff0f0', borderRadius: '10px', padding: '0.75rem 1rem',
          marginBottom: '1rem', fontSize: '0.82rem', color: '#555',
        }}>
          <strong>💰 Balances</strong>
          {balanceFetching
            ? <p style={{ margin: '0.5rem 0 0', color: '#aaa' }}>Fetching balances...</p>
            : (
              <div style={{ marginTop: '0.5rem', display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {Object.keys(allTokens).map(key => (
                  <span key={key} style={{
                    background: '#ffe8e8', borderRadius: '999px', padding: '3px 12px',
                    fontSize: '0.78rem', color: '#555',
                  }}>
                    <strong>{key}</strong> {formatBal(key) || '0'}
                  </span>
                ))}
              </div>
            )
          }
          <button
            onClick={() => fetchBalances(wallet, provider)}
            style={{
              marginTop: '0.5rem', fontSize: '0.75rem', background: 'none',
              border: '1px solid #ccc', borderRadius: '6px', padding: '3px 10px',
              cursor: 'pointer', color: '#888', fontFamily: 'inherit',
            }}
          >
            🔄 Refresh
          </button>
        </div>
      )}

      {/* ── From ── */}
      <label><strong>From</strong>
        {wallet && balances[fromToken] !== undefined && (
          <span style={balancePill}>Balance: {formatBal(fromToken)} {fromToken}</span>
        )}
      </label>
      <select value={fromToken} onChange={(e) => setFromToken(e.target.value)} style={selectStyle}>
        {Object.keys(allTokens).map(t => (
          <option key={t} value={t}>{allTokens[t].symbol} — {allTokens[t].name}</option>
        ))}
      </select>

      {/* ── To ── */}
      <label style={{ marginTop: '0.5rem', display: 'block' }}><strong>To</strong>
        {wallet && balances[toToken] !== undefined && (
          <span style={balancePill}>Balance: {formatBal(toToken)} {toToken}</span>
        )}
      </label>
      <select value={toToken} onChange={(e) => setToToken(e.target.value)} style={{ ...selectStyle, marginBottom: '1rem' }}>
        {Object.keys(allTokens).map(t => (
          <option key={t} value={t}>{allTokens[t].symbol} — {allTokens[t].name}</option>
        ))}
      </select>

      {/* ── Amount ── */}
      <input
        type="text"
        placeholder={`Amount in ${fromToken}`}
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        style={inputStyle}
      />

      {/* ── Live quote ── */}
      {(quoteFetching || quote) && (
        <div style={quoteBox}>
          {quoteFetching && <span>⏳ Fetching live quote...</span>}
          {!quoteFetching && quote && !quote.error && (
            <>
              <div>📊 Estimated output: <strong>{parseFloat(quote.buyAmount).toLocaleString(undefined, { maximumFractionDigits: 2 })} {toToken}</strong></div>
              {quote.price && (
                <div style={{ marginTop: '4px', color: '#999', fontSize: '0.78rem' }}>
                  Rate: 1 {fromToken} ≈ {parseFloat(quote.price).toLocaleString(undefined, { maximumFractionDigits: 2 })} {toToken}
                </div>
              )}
              <div style={{ color: '#bbb', fontSize: '0.75rem' }}>
                Est. gas: {quote.estimatedGas} units · via Uniswap {quote.version?.toUpperCase()}
              </div>
              <div style={{ color: '#ffaaaa', fontSize: '0.75rem', marginTop: '4px' }}>
                🐾 Includes 1% Puppy Wallet fee
              </div>
            </>
          )}
          {!quoteFetching && quote?.error && (
            <span style={{ color: '#cc7777' }}>⚠️ {quote.error}</span>
          )}
        </div>
      )}

      <button onClick={executeSwap} disabled={isLoading} style={btnSwap(isLoading)}>
        {isLoading ? '⏳ Swapping...' : '🔄 Swap'}
      </button>

      {status && (
        <p style={{
          textAlign: 'center', fontSize: '0.85rem', color: '#444', wordBreak: 'break-all',
          background: '#fff0f0', padding: '1rem', borderRadius: '8px', whiteSpace: 'pre-line',
        }}>
          {status}
        </p>
      )}

      {/* ── Custom token ── */}
      <div style={{ marginTop: '1.5rem', borderTop: '1px solid #eee', paddingTop: '1rem' }}>
        <p style={{ fontSize: '0.8rem', color: '#888', marginBottom: '0.5rem' }}>
          ➕ Add any ERC-20 token by contract address:
        </p>
        <div style={{ display: 'flex', gap: '8px' }}>
          <input
            type="text"
            placeholder="0x... contract address"
            value={customToken}
            onChange={(e) => setCustomToken(e.target.value)}
            style={{ ...inputStyle, marginBottom: 0, flex: 1 }}
          />
          <button
            onClick={addCustomToken}
            style={{
              padding: '10px 14px', fontSize: '14px', backgroundColor: '#ffcc00',
              border: 'none', borderRadius: '8px', cursor: 'pointer',
              fontWeight: 'bold', fontFamily: 'inherit',
            }}
          >
            Add
          </button>
        </div>
        {customError && <p style={{ color: 'red', fontSize: '0.8rem', marginTop: '4px' }}>{customError}</p>}
      </div>

      <p style={{ marginTop: '1.5rem', fontSize: '0.72rem', color: '#bbb', textAlign: 'center' }}>
        ⚠️ Your private key is never stored or transmitted. Swaps execute directly on-chain via Uniswap.
      </p>
    </div>
  );
}

export default SwapPage;
