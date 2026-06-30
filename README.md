# CredVault — Stellar Skill Attestation & Micro-Payments

> Turn every XLM payment into a verifiable career credential

## The Problem

Freelancers get paid for gigs, but have zero verifiable proof they received payment *for that specific skill*. Fiverr receipts are centralized and can be deleted. LinkedIn endorsements are fake. GitHub commits don't prove payment.

CredVault uses Stellar's native memo field to tag every XLM payment with a skill category, creating a **permanent, on-chain proof of work** that lives at the freelancer's Stellar address. No intermediary. No centralized platform. Pure blockchain.

## How It Works

1. **Connect Wallet** — Link your Freighter wallet to CredVault
2. **Send Payment** — Pay someone in XLM and tag it with a skill (UI/UX, Backend, etc.)
3. **Earn Credential** — The transaction becomes a verifiable skill credential on Stellar Testnet, visible to anyone who checks your address

## Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Frontend | Next.js (App Router) | 14 |
| Styling | TailwindCSS | 3.4 |
| Language | TypeScript | 5+ |
| Animations | Framer Motion | 11+ |
| Blockchain | Stellar Testnet (Horizon) | — |
| Wallet | Freighter | Latest |
| SDK | @stellar/stellar-sdk | Latest |
| Icons | Lucide React | Latest |
| Date Formatting | date-fns | Latest |
| Confetti | canvas-confetti | Latest |

## Setup Instructions

### Prerequisites

- Node.js 18+
- npm or yarn
- [Freighter wallet](https://freighter.app) browser extension installed

### Installation

```bash
# Clone the repository
git clone <repo-url>
cd credvault

# Install dependencies
npm install

# Run development server
npm run dev

# Open http://localhost:3000
```

### Environment Variables

No `.env` file needed. The app uses the public Stellar Testnet Horizon endpoint and Friendbot (public faucet).

- **Horizon API**: `https://horizon-testnet.stellar.org`
- **Friendbot**: `https://friendbot.stellar.org`

## Getting Testnet XLM

1. Install [Freighter wallet](https://freighter.app) extension
2. Create a new wallet or import an existing one
3. Switch to **Testnet** in Freighter settings
4. Connect your wallet to CredVault
5. Your account will be auto-funded via Friendbot (10,000 XLM)

## Screenshots

> [Placeholder: Wallet Connected State]

> [Placeholder: Balance Display + Credibility Score]

> [Placeholder: Successful Transaction with Credential Card]

> [Placeholder: Credential History Feed]

## Deployed URL

> [Placeholder: Live demo URL on Vercel]

## Building for Production

```bash
npm run build
npm run lint
npm start
```

## Architecture

```
/src
├── app/
│   ├── layout.tsx              Root layout, fonts, providers
│   ├── page.tsx                Main page (hero + dashboard)
│   ├── toast-provider.tsx      Client-side toast provider
│   └── globals.css             TailwindCSS + custom design tokens
│
├── components/
│   ├── Navbar.tsx              Top nav (logo + network badge + wallet)
│   ├── HeroSection.tsx         Landing section (wallet disconnected)
│   ├── WalletConnect.tsx       Connect/disconnect wallet button
│   ├── BalanceCard.tsx         XLM balance + Credibility Score
│   ├── PaymentForm.tsx         Send credentialed payment form
│   ├── CredentialCard.tsx      Post-payment success modal + confetti
│   ├── HistoryFeed.tsx         Last 20 txns as credential badges
│   ├── TransactionSkeleton.tsx Loading skeleton for history
│   └── Toast.tsx               Toast notification system
│
├── lib/
│   ├── stellar.ts              All Stellar SDK & Horizon API logic
│   ├── freighter.ts            Freighter wallet API wrapper
│   ├── memo.ts                 Memo encoding/decoding + skill map
│   └── errors.ts               Typed error classes
│
├── hooks/
│   ├── useWallet.ts            Wallet connection + localStorage
│   ├── useBalance.ts           XLM balance + credibility score
│   ├── useTransactions.ts      Transaction history + memo parsing
│   ├── useToast.ts             Toast notifications
│   └── useAsync.ts             Generic async state
│
├── providers/
│   └── WalletProvider.tsx      React Context for wallet state
│
└── types/
    └── index.ts                TypeScript interfaces + skill map
```

## Key Features

- ✅ Real-time wallet connection with localStorage persistence
- ✅ Live XLM balance with auto-refresh (30s interval)
- ✅ Credibility score (transaction count)
- ✅ Skill-tagged payments with CV:{SKILL}:{note} memo encoding
- ✅ Real-time address validation (StrKey)
- ✅ Balance sufficiency checking
- ✅ Transaction history with 20 credential badges
- ✅ Typed error handling for all Stellar failure cases
- ✅ New account creation support (createAccount op)
- ✅ Confetti animation on successful credential
- ✅ Dark theme with glassmorphism UI
- ✅ Responsive design (mobile-first)
- ✅ Reduced motion support
- ✅ Toast notifications for all actions

## Memo Format

CredVault encodes skill tags into Stellar's `MEMO_TEXT` field:

```
CV:{SKILL_CODE}:{NOTE}
```

| Code | Skill |
|------|-------|
| UIUX | UI/UX Design |
| BACKEND | Backend Development |
| FRONTEND | Frontend Development |
| SMART | Smart Contract Dev |
| COPY | Copywriting |
| DATA | Data Analysis |
| VIDEO | Video Editing |
| OTHER | Other |

Example: `CV:UIUX:Logo redesign`

## License

MIT
