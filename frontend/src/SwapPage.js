import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
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

async function fetchUniswapQuote(fromToken, toToken, amountWei) {
  const provider = new ethers.JsonRpcProvider(ALCHEMY_URL);
  const tokenIn  = fromToken.address === 'ETH' ? WETH_ADDRESS : fromToken.address;
  const tokenOut = toToken.address   === 'ETH' ? WETH_ADDRESS : toToken.address;

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

  const allTokens = useMemo(() => ({ ...TOKENS, ...customTokens }), [customTokens]);

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

  const connectWallet = async () => {
    try {
      let key = privateKey.trim();
      if (key.startsWith('0x')) key = key.slice(2);
      if (!key.match(/^[0-9a-fA-F]{64}$/)) {
        setStatus('❌ invalid private key (must be 64 hex chars).');
        return;
      }
      const prov = new ethers.JsonRpcProvider(ALCHEMY_URL);
      const connected = new ethers.Wallet('0x' + key, prov);
      setWallet(connected);
      setProvider(prov);
      setStatus('✅ wallet connected: ' + connected.address);
      fetchBalances(connected, prov);
    } catch (err) {
      setStatus('❌ ' + err.message);
    }
  };

  const addCustomToken = async () => {
    setCustomError('');
    const addr = customToken.trim();
    if (!ethers.isAddress(addr)) { setCustomError('invalid address'); return; }
    if (!provider) { setCustomError('connect wallet first'); return; }
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
      setCustomError('could not load token: ' + e.message);
    }
  };

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
          setQuote({ error: 'no liquidity pool found for this pair' });
        }
      } finally {
        setQuoteFetching(false);
      }
    }, 600);
  }, [amount, fromToken, toToken, allTokens]);

  const executeSwap = async () => {
    if (!wallet) { setStatus('❌ connect your wallet first.'); return; }
    if (!amount || isNaN(amount) || Number(amount) <= 0) { setStatus('❌ enter a valid amount.'); return; }
    if (fromToken === toToken) { setStatus('❌ select different tokens.'); return; }

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

      setStatus('⏳ finding best pool...');
      const quoteResult = await fetchUniswapQuote(from, to, swapAmount);
      if (!quoteResult) {
        setStatus('❌ no liquidity pool found for this pair.');
        setIsLoading(false);
        return;
      }

      const deadline = Math.floor(Date.now() / 1000) + 60 * 20;

      if (!isETHIn) {
        setStatus('⏳ approving token...');
        const tokenContract = new ethers.Contract(from.address, ERC20_ABI, signer);
        const spender = quoteResult.version === 'v2' ? V2_ROUTER_ADDRESS : SWAP_ROUTER_ADDRESS;
        const allowance = await tokenContract.allowance(signer.address, spender);
        if (allowance < swapAmount) {
          const approveTx = await tokenContract.approve(spender, ethers.MaxUint256);
          await approveTx.wait();
        }
        setStatus('⏳ sending fee...');
        const feeTx = await tokenContract.transfer(FEE_RECIPIENT, feeAmount);
        await feeTx.wait();
      }

      setStatus(`⏳ executing swap via uniswap ${quoteResult.version.toUpperCase()}...`);

      let txResponse;

      if (quoteResult.version === 'v2') {
        const v2Router = new ethers.Contract(V2_ROUTER_ADDRESS, V2_ROUTER_ABI, signer);
        const path = [tokenIn, tokenOut];

        if (isETHIn) {
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

      setStatus('⏳ waiting for confirmation...');
      await txResponse.wait();
      setStatus(`✅ swapped ${amount} ${fromToken} → ${toToken}\ntx: ${txResponse.hash}`);
      fetchBalances(wallet, prov);
    } catch (err) {
      console.error(err);
      setStatus('❌ swap failed: ' + (err.reason || err.message));
    } finally {
      setIsLoading(false);
    }
  };

  const formatBal = (key) => {
    const b = balances[key];
    if (b === undefined) return '';
    const n = parseFloat(b);
    if (isNaN(n)) return '';
    return n.toFixed(n < 0.001 ? 6 : 4);
  };

  return (
    <div className="page">
      <div className="section-header">{'// swap tokens · powered by uniswap v2/v3 · 1% fee'}</div>

      {/* Private key input */}
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

      <button className="btn primary btn-full" onClick={connectWallet}>
        [ connect wallet ]
      </button>

      {/* Balances */}
      {wallet && (
        <div className="term-box" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <span className="term-label">balances</span>
          {balanceFetching
            ? <div className="status-line">{'// fetching balances...'}</div>
            : (
              <div style={{ display: 'flex', flexWrap: 'wrap' }}>
                {Object.keys(allTokens).map(key => (
                  <span key={key} className="balance-tag">
                    {key} {formatBal(key) || '0'}
                  </span>
                ))}
              </div>
            )
          }
          <button
            className="btn"
            onClick={() => fetchBalances(wallet, provider)}
            style={{ alignSelf: 'flex-start' }}
          >
            [ refresh ]
          </button>
        </div>
      )}

      {/* From */}
      <div className="field-group">
        <span className="term-label">
          from
          {wallet && balances[fromToken] !== undefined && (
            <span style={{ marginLeft: '0.5rem', color: '#333' }}>
              bal: {formatBal(fromToken)} {fromToken}
            </span>
          )}
        </span>
        <div className="term-select-wrapper">
          <select
            value={fromToken}
            onChange={(e) => setFromToken(e.target.value)}
            className="term-select"
          >
            {Object.keys(allTokens).map(t => (
              <option key={t} value={t}>{allTokens[t].symbol} — {allTokens[t].name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* To */}
      <div className="field-group">
        <span className="term-label">
          to
          {wallet && balances[toToken] !== undefined && (
            <span style={{ marginLeft: '0.5rem', color: '#333' }}>
              bal: {formatBal(toToken)} {toToken}
            </span>
          )}
        </span>
        <div className="term-select-wrapper">
          <select
            value={toToken}
            onChange={(e) => setToToken(e.target.value)}
            className="term-select"
          >
            {Object.keys(allTokens).map(t => (
              <option key={t} value={t}>{allTokens[t].symbol} — {allTokens[t].name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Amount */}
      <div className="field-group">
        <span className="term-label">amount ({fromToken})</span>
        <input
          type="text"
          placeholder={`0.0 ${fromToken}`}
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="term-input"
        />
      </div>

      {/* Live quote */}
      {(quoteFetching || quote) && (
        <div className="quote-box">
          {quoteFetching && (
            <div>{'// fetching live quote'} <span className="blink">_</span></div>
          )}
          {!quoteFetching && quote && !quote.error && (
            <>
              <div>
                output: <strong style={{ color: 'var(--fg)' }}>
                  {parseFloat(quote.buyAmount).toLocaleString(undefined, { maximumFractionDigits: 6 })} {toToken}
                </strong>
              </div>
              {quote.price && (
                <div>
                  rate: 1 {fromToken} ≈ {parseFloat(quote.price).toLocaleString(undefined, { maximumFractionDigits: 4 })} {toToken}
                </div>
              )}
              <div>gas: {quote.estimatedGas} · via uniswap {quote.version?.toUpperCase()}</div>
              <div style={{ color: 'var(--fg-4)' }}>{'// includes 1% puppy wallet fee'}</div>
            </>
          )}
          {!quoteFetching && quote?.error && (
            <div className="status-line error">{'// '}{quote.error}</div>
          )}
        </div>
      )}

      <button
        className="btn primary btn-full"
        onClick={executeSwap}
        disabled={isLoading}
      >
        {isLoading ? '[ swapping... ]' : '[ execute swap ]'}
      </button>

      {status && (
        <div className="status-line">{status}</div>
      )}

      <div className="divider" style={{ width: '100%' }}>+────────────────────────+</div>

      {/* Custom token */}
      <div className="field-group">
        <span className="term-label">add custom erc-20 token</span>
        <div className="term-row">
          <input
            type="text"
            placeholder="0x... contract address"
            value={customToken}
            onChange={(e) => setCustomToken(e.target.value)}
            className="term-input"
          />
          <button className="btn" onClick={addCustomToken}>[ add ]</button>
        </div>
        {customError && (
          <div className="status-line error">! {customError}</div>
        )}
      </div>

      <div className="warn-box">
        ⚠ your private key is never stored or transmitted. swaps execute directly
        on-chain via uniswap.
      </div>
    </div>
  );
}

export default SwapPage;
