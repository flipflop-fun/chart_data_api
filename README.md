# Solana Mint Price Line API

一个用于获取 Solana Token Mint 价格数据和 OHLC 图表数据的 RESTful API 服务。

## 功能特性

- 📊 OHLC (开高低收) 数据获取
- 💰 交易数据查询
- 🔍 Mint 地址管理
- ⚡ Redis 缓存优化
- 🔐 API 密钥认证
- 📈 多时间周期支持 (5m, 15m, 30m, 1h, 4h, 1d)
- 🚀 手动数据触发功能

## 快速开始

### 环境配置

1. 复制环境变量文件：
```bash
cp .env.example .env
```

### 安装依赖

```bash
yarn install
```

### 启动服务

```bash
# 开发模式
yarn dev

# 生产模式
yarn start

# 使用 Docker
yarn docker:up
```

服务将在 `http://localhost:9090` 启动。

## API 文档

### 认证

所有 API 请求都需要在请求头中包含有效的 API 密钥：

```
x-api-key: API_KEY
```

### API 端点

以下示例中，Mint 地址为 `FpuSjtzgiFKADiyPzW8EiayvmtYdqdQqoNYQS4Uz3PKR`

dev-api-key 为 `wZdY5cFq3Qoqd2SaEr2Y2AMQbkZc1Glj`

#### 检查API健康状态
**GET** `/api/v1/status/health`

```bash
curl -X GET "http://localhost:9090/api/v1/status/health" \
  -H "x-api-key: wZdY5cFq3Qoqd2SaEr2Y2AMQbkZc1Glj" \
  -H "Content-Type: application/json"
```

#### 检查数据抓取服务状态
**GET** `/api/v1/status/scheduler`

```bash
curl -X GET "http://localhost:9090/api/v1/status/scheduler" \
  -H "x-api-key: wZdY5cFq3Qoqd2SaEr2Y2AMQbkZc1Glj" \
  -H "Content-Type: application/json"
```

#### 手动重建单个mint的OHLC数据：
```bash
# 重建特定mint的所有周期OHLC数据
curl -X POST http://localhost:9090/api/v1/ohlc/rebuild/FpuSjtzgiFKADiyPzW8EiayvmtYdqdQqoNYQS4Uz3PKR \
  -H "x-api-key: wZdY5cFq3Qoqd2SaEr2Y2AMQbkZc1Glj"

# 重建特定mint的特定周期OHLC数据
curl -X POST http://localhost:9090/api/v1/ohlc/rebuild/FpuSjtzgiFKADiyPzW8EiayvmtYdqdQqoNYQS4Uz3PKR \
  -H "x-api-key: wZdY5cFq3Qoqd2SaEr2Y2AMQbkZc1Glj" \
  -H "Content-Type: application/json" \
  -d '{"period": "1d"}'
```

#### 重建所有mint的OHLC数据：
```bash
curl -X POST http://localhost:9090/api/v1/ohlc/rebuild-all -H "x-api-key: wZdY5cFq3Qoqd2SaEr2Y2AMQbkZc1Glj"
```

#### 获取 OHLC 数据

**GET** `/api/v1/ohlc/{mintAddress}`

获取指定 Mint 地址的 OHLC (开高低收) 数据。

**参数：**
- `period` (必需): 时间周期 - `5m`, `15m`, `30m`, `1h`, `4h`, `1d`
- `from` (可选): 开始时间戳
- `to` (可选): 结束时间戳
- `limit` (可选): 返回数量限制 (1-1000，默认100)

**示例：**
```bash
curl -X GET "http://localhost:9090/api/v1/ohlc/FpuSjtzgiFKADiyPzW8EiayvmtYdqdQqoNYQS4Uz3PKR?period=1d&limit=50" \
  -H "x-api-key: wZdY5cFq3Qoqd2SaEr2Y2AMQbkZc1Glj" \
  -H "Content-Type: application/json"

curl -X GET "http://localhost:9090/api/v1/ohlc/FpuSjtzgiFKADiyPzW8EiayvmtYdqdQqoNYQS4Uz3PKR?period=1h&limit=50&from=1752519966&to=1752692766" \
  -H "x-api-key: wZdY5cFq3Qoqd2SaEr2Y2AMQbkZc1Glj" \
  -H "Content-Type: application/json"
```

#### 获取交易数据

**GET** `/api/v1/transactions/{mintAddress}`

获取指定 Mint 地址的交易数据。

**参数：**
- `from` (可选): 开始时间戳
- `to` (可选): 结束时间戳
- `limit` (可选): 返回数量限制 (1-1000，默认100)

**示例：**
```bash
curl -X GET "http://localhost:9090/api/v1/transactions/FpuSjtzgiFKADiyPzW8EiayvmtYdqdQqoNYQS4Uz3PKR?limit=100" \
  -H "x-api-key: wZdY5cFq3Qoqd2SaEr2Y2AMQbkZc1Glj" \
  -H "Content-Type: application/json"
```

#### 获取所有 Mint 列表

**GET** `/api/v1/mints`

获取系统中所有可用的 Mint 地址列表。

**示例：**
```bash
curl -X GET "http://localhost:9090/api/v1/mints" \
  -H "x-api-key: wZdY5cFq3Qoqd2SaEr2Y2AMQbkZc1Glj" \
  -H "Content-Type: application/json"
```

#### 手动触发数据获取

**POST** `/api/v1/transaction/fetch/{mintAddress}`

手动触发指定 Mint 地址的数据获取（用于调试/管理）。

**示例：**
```bash
curl -X POST "http://localhost:9090/api/v1/transaction/fetch/FpuSjtzgiFKADiyPzW8EiayvmtYdqdQqoNYQS4Uz3PKR" \
  -H "x-api-key: wZdY5cFq3Qoqd2SaEr2Y2AMQbkZc1Glj" \
  -H "Content-Type: application/json"
```
