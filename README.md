# Enhanced Dex Aggregator

Enhanced Dex Aggregator is a small hybrid DApp for comparing token swap quotes across several decentralised exchanges. It has a React frontend, a small Express backend, MetaMask wallet connection, a swap flow, and a latest transaction log.

<img width="1708" height="979" alt="image" src="https://github.com/user-attachments/assets/2670c902-d580-48c6-8f31-e7c9bda6abea" />


## Features

- Connect a wallet with MetaMask
- Compare swap quotes across supported DEXs
- Show estimated output values for a token pair
- Try a token swap from the frontend
- Log swap attempts and failed or cancelled swaps to the backend
- Show the latest logged transaction in the UI
- Support multiple EVM networks from the project config

## Tech Stack

### Frontend

- React
- ethers.js
- Redux Toolkit
- React Bootstrap
- Material UI

### Backend

- Node.js
- Express
- Simple JSON file storage for transaction logs

### Blockchain and Tooling

- MetaMask
- Solidity interface files
- Brownie scripts

## Project Structure

```text
Enhanced-Dex-aggregator/
├── backend/
│   ├── data/
│   ├── package.json
│   └── server.js
├── build/
├── front-end/
│   ├── public/
│   ├── src/
│   └── package.json
├── interfaces/
├── scripts/
├── brownie-config.yaml
└── README.md
```

## Installation

1. Clone the repo:

```bash
git clone https://github.com/samkdgit/Enhanced-Dex-aggregator.git
cd Enhanced-Dex-aggregator
```

2. Install frontend dependencies:

```bash
cd front-end
yarn install
cd ..
```

3. Install backend dependencies:

```bash
cd backend
npm install
cd ..
```

## Run the App

Start the backend first:

```bash
cd backend
npm start
```

Backend runs on:

```text
http://localhost:5001
```

Start the frontend in a second terminal:

```bash
cd front-end
yarn start
```

Frontend runs on:

```text
http://localhost:3000
```

## How to Use

1. Start the backend.
2. Start the frontend.
3. Open `http://localhost:3000` in your browser.
4. Connect your wallet with MetaMask.
5. Make sure you are on a supported network.
6. Choose the token you want to swap from and the token you want to swap to.
7. Enter an amount.
8. Check the quote comparison table.
9. Click `Swap` to try the swap flow.
10. Check the Latest Transaction panel to see the newest logged entry.

## API Routes

### GET /api/health

Returns a simple server status and timestamp.

### GET /api/project-info

Returns simple project information such as the project name and supported networks.

### POST /api/transaction-log

Saves a transaction log entry sent from the frontend.

Example JSON body:

```json
{
  "network": "Polygon Mainnet",
  "walletAddress": "0x123...",
  "fromToken": "USDC",
  "toToken": "DAI",
  "amountIn": 10,
  "amountOutEstimated": 9.98,
  "exchange": "SushiSwap",
  "txHash": null,
  "status": "failed",
  "errorMessage": "Swap cancelled by user.",
  "timestamp": "2026-04-22T12:00:00.000Z"
}
```

### GET /api/transaction-log/latest

Returns the latest saved transaction log entry.

## Limitations

- You need a wallet with the right network and enough funds for a real on-chain swap.
- Cancelled and failed swap attempts can still be logged and shown in the UI.
- The backend uses a simple local JSON file, not a database.
- Supported networks and tokens come from the current project config.

## Acknowledgement

This project is based on the original open-source repo: [kaymen99/Dex-aggregator](https://github.com/kaymen99/Dex-aggregator)

## License

MIT License. See `LICENSE` for more information.
