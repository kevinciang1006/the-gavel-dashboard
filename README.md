# The Gavel - DeFi Lending Demo

A fully functional demo of The Gavel's oracle-free DeFi lending protocol, rebuilt with modern Web3 integration.

## 🔗 Live Demo

https://gavel-demo-554446678762.us-central1.run.app

## 🎥 Video Walkthrough

[Video Walkthrough](https://www.loom.com/share/c69a43ecfc834caf9027b03468593167)

## ✨ Features

- **Wallet Connection**: MetaMask support via RainbowKit
- **Auction System**: Create auctions with ERC-20 or NFT collateral
- **Competitive Bidding**: Lenders compete to offer best rates
- **Loan Management**: Track active loans, repay, or claim collateral
- **Secondary Marketplace**: Trade loan positions before maturity
- **NFT Lending**: Same auction mechanism for NFT collateral
- **Analytics Dashboard**: Protocol metrics and yield curves

## 🛠️ Tech Stack

- React 19
- TypeScript
- Vite
- Tailwind CSS
- shadcn/ui
- wagmi v2
- viem
- RainbowKit
- Zustand (state management)
- Google Analytics 4

## 🚀 Run Locally

```bash
# Clone repo
git clone [your-repo-url]

# Install dependencies
npm install

# Add environment variables
cp .env.example .env
# Add your WalletConnect Project ID and GA Measurement ID

# Run dev server
npm run dev
```

## 📝 About

Built as a job application demo for The Gavel's Frontend Developer role.

The original testnet demo had wallet connection issues, so I rebuilt the entire interface with working Web3 integration and additional features.

## 👤 Author

Kevin Ciang - [LinkedIn](https://linkedin.com/in/kevinciang1006)
