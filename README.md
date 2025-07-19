# Solana Mint Price Line API

A RESTful API service for retrieving Solana Token Mint price data and OHLC chart data.

## Features

- 📊 OHLC (Open-High-Low-Close) data retrieval
- 💰 Transaction data queries
- 🔍 Mint address management
- ⚡ Redis cache optimization
- 🔐 API key authentication
- 📈 Multiple time period support (5m, 15m, 30m, 1h, 4h, 1d)
- 🚀 Manual data trigger functionality

## Quick Start

### Environment Setup

1. Copy the environment variables file:
```bash
cp .env.example .env
```

### Install Dependencies

```bash
yarn install
```

### Start the Service

```bash
# Development mode
yarn dev

# Production mode
yarn start

# Using Docker
yarn docker:up
```

The service will start at `http://localhost:9090`.

## API Documentation

### Authentication

All API requests require a valid API key in the request header:

```
x-api-key: API_KEY
```

### API Endpoints

In the following examples, the Mint address is `FpuSjtzgiFKADiyPzW8EiayvmtYdqdQqoNYQS4Uz3PKR`

The dev-api-key is `wZdY5cFq3Qoqd2SaEr2Y2AMQbkZc1Glj`

#### Check API Health Status
**GET** `/api/v1/status/health`

```bash
curl -X GET "http://localhost:9090/api/v1/status/health" \
  -H "x-api-key: wZdY5cFq3Qoqd2SaEr2Y2AMQbkZc1Glj" \
  -H "Content-Type: application/json"
```

#### Check Data Fetching Service Status
**GET** `/api/v1/status/scheduler`

```bash
curl -X GET "http://localhost:9090/api/v1/status/scheduler" \
  -H "x-api-key: wZdY5cFq3Qoqd2SaEr2Y2AMQbkZc1Glj" \
  -H "Content-Type: application/json"
```

#### Manually Rebuild OHLC Data for a Single Mint:
```bash
# Rebuild all period OHLC data for a specific mint
curl -X POST http://localhost:9090/api/v1/ohlc/rebuild/FpuSjtzgiFKADiyPzW8EiayvmtYdqdQqoNYQS4Uz3PKR \
  -H "x-api-key: wZdY5cFq3Qoqd2SaEr2Y2AMQbkZc1Glj"

# Rebuild specific period OHLC data for a specific mint
curl -X POST http://localhost:9090/api/v1/ohlc/rebuild/FpuSjtzgiFKADiyPzW8EiayvmtYdqdQqoNYQS4Uz3PKR \
  -H "x-api-key: wZdY5cFq3Qoqd2SaEr2Y2AMQbkZc1Glj" \
  -H "Content-Type: application/json" \
  -d '{"period": "1d"}'
```

#### Rebuild OHLC Data for All Mints:
```bash
curl -X POST http://localhost:9090/api/v1/ohlc/rebuild-all -H "x-api-key: wZdY5cFq3Qoqd2SaEr2Y2AMQbkZc1Glj"
```

#### Get OHLC Data

**GET** `/api/v1/ohlc/{mintAddress}`

Retrieve OHLC (Open-High-Low-Close) data for a specified Mint address.

**Parameters:**
- `period` (required): Time period - `5m`, `15m`, `30m`, `1h`, `4h`, `1d`
- `from` (optional): Start timestamp
- `to` (optional): End timestamp
- `limit` (optional): Response limit (1-1000, default 100)

**Examples:**
```bash
curl -X GET "http://localhost:9090/api/v1/ohlc/FpuSjtzgiFKADiyPzW8EiayvmtYdqdQqoNYQS4Uz3PKR?period=1d&limit=50" \
  -H "x-api-key: wZdY5cFq3Qoqd2SaEr2Y2AMQbkZc1Glj" \
  -H "Content-Type: application/json"

curl -X GET "http://localhost:9090/api/v1/ohlc/FpuSjtzgiFKADiyPzW8EiayvmtYdqdQqoNYQS4Uz3PKR?period=1h&limit=50&from=1752519966&to=1752692766" \
  -H "x-api-key: wZdY5cFq3Qoqd2SaEr2Y2AMQbkZc1Glj" \
  -H "Content-Type: application/json"
```

#### Get Transaction Data

**GET** `/api/v1/transactions/{mintAddress}`

Retrieve transaction data for a specified Mint address.

**Parameters:**
- `from` (optional): Start timestamp
- `to` (optional): End timestamp
- `limit` (optional): Response limit (1-1000, default 100)

**Example:**
```bash
curl -X GET "http://localhost:9090/api/v1/transactions/FpuSjtzgiFKADiyPzW8EiayvmtYdqdQqoNYQS4Uz3PKR?limit=100" \
  -H "x-api-key: wZdY5cFq3Qoqd2SaEr2Y2AMQbkZc1Glj" \
  -H "Content-Type: application/json"
```

#### Get All Mint Addresses

**GET** `/api/v1/mints`

Retrieve a list of all available Mint addresses in the system.

**Example:**
```bash
curl -X GET "http://localhost:9090/api/v1/mints" \
  -H "x-api-key: wZdY5cFq3Qoqd2SaEr2Y2AMQbkZc1Glj" \
  -H "Content-Type: application/json"
```

#### Manually Trigger Data Fetching

**POST** `/api/v1/transaction/fetch/{mintAddress}`

Manually trigger data fetching for a specified Mint address (for debugging/management).

**Example:**
```bash
curl -X POST "http://localhost:9090/api/v1/transaction/fetch/FpuSjtzgiFKADiyPzW8EiayvmtYdqdQqoNYQS4Uz3PKR" \
  -H "x-api-key: wZdY5cFq3Qoqd2SaEr2Y2AMQbkZc1Glj" \
  -H "Content-Type: application/json"
```