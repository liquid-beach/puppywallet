# 🐶 Puppy Wallet

Puppy Wallet is a simple, browser-based Ethereum wallet that allows users to create wallets, access existing wallets using a private key, view ETH and token balances, send ETH, and swap tokens — all without relying on MetaMask or any browser extension.

## 🚀 Features

- 🔐 Generate new Ethereum wallets client-side
- 📈 View ETH balance in real-time via Alchemy RPC
- 💸 Send ETH to any address directly from the app
- 🔄 Swap any ERC-20 token via Uniswap V2/V3 with live quotes
- 💰 View token balances for ETH, USDC, USDT, DAI, WBTC, WETH, NEIRO and more
- ➕ Add any custom ERC-20 token by contract address
- 📵 Private key is never stored or transmitted — held only in memory during your session
- 📱 Mobile-friendly and responsive UI
- 🐾 Clean, fun, lightweight Ethereum interface

## ⚠️ Critical Security Warnings

> ‼️ This app is intended for high-level users who understand the risks.
> By using this app, you agree to take full responsibility for your funds and private key security.

**You should NOT use this wallet if:**
- You are unsure how Ethereum private keys work
- You store significant amounts of ETH without a hardware wallet
- You click on links from untrusted sources or use a compromised device
- You expect support or a recovery process — there is none

## 🔐 Private Key Handling

- The private key is never saved, logged, or sent anywhere
- It is held only in memory during your session and cleared when you leave or refresh the page
- If you leave or refresh the page, you must re-enter your key

## 🔄 Swap Page

Puppy Swap is powered by Uniswap V2 and V3. It automatically finds the best available liquidity pool for your trade and routes accordingly. A 1% fee is collected on each swap to support the Puppy Wallet project.

Supported tokens out of the box: ETH, USDC, USDT, DAI, WBTC, WETH, NEIRO. Any ERC-20 token can be added by pasting its contract address.

## 📡 RPC Usage

This app connects to the Ethereum blockchain using Alchemy's RPC endpoint. If Alchemy is down or throttled, wallet access, balance checks, and swaps will fail. All transactions are signed locally in your browser using ethers.js.

## ⚙️ How It Works

1. **Create Wallet** — generates a new Ethereum keypair locally in your browser
2. **Access Wallet** — paste your private key to connect and view your balance
3. **Send ETH** — enter a recipient address and amount to broadcast a transaction
4. **Swap** — connect with your private key, select tokens, enter an amount, and swap via Uniswap

## 🔧 Developer Setup

### 📁 Project Structure

```
puppy-wallet/
├── frontend/        # React web app
├── .gitignore
└── README.md
```

### ⚙️ Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env.local` file in the `frontend/` directory:
   ```
   REACT_APP_ALCHEMY_KEY=your_alchemy_api_key_here
   ```

4. Start the development server:
   ```bash
   npm start
   ```
   App will open at: http://localhost:3000

### 🚀 Deployment

This app is deployed via Vercel. To deploy your own instance:

1. Push your code to GitHub
2. Import the repo into Vercel
3. Set the **Root Directory** to `frontend`
4. Add `REACT_APP_ALCHEMY_KEY` as an Environment Variable in Vercel project settings
5. Deploy

## 🛡️ Disclaimer & Liability

Puppy Wallet is provided "as is", without warranty of any kind. By using this application, you accept the following terms:

The authors, contributors, and maintainers of Puppy Wallet are not liable for any loss of funds, unauthorized transactions, or damage resulting from the use or misuse of this software.

This is an experimental, open-source interface built for educational and high-risk users only. No guarantee is made as to the accuracy, reliability, or security of this app.

> 🧠 You are responsible for keeping your private key safe. If you lose it, paste it into a fake app, or expose it in any way, your funds are likely gone.

## 💡 Notes

- No wallets or data are saved — it's 100% ephemeral and runs in your browser
- Swaps route automatically through Uniswap V2 or V3 depending on available liquidity

## 🐾 Donations

If you would like to support the project, donations can be made to:

```
0x9811d968C1cc272392781561780935bAdb09B742
```

## 🌐 Live Site

🔗 https://puppywallet.xyz

## 📄 License

This project is licensed under the AGPL-3.0 License. See the LICENSE file for full terms.

If you are a business or developer interested in using Puppy Wallet commercially or integrating it into a closed-source product, please contact the author to obtain a commercial license.

© 2025 liquid-beach. All rights reserved.  
Contact: wildagogo@proton.me
