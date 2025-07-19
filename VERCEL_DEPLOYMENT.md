# Vercel 部署指南

## 环境变量配置

在 Vercel 项目设置中，你需要配置以下环境变量：

### 必需的环境变量
- `NODE_ENV=production`
- `POSTGRES_DB_URL` - 你的 PostgreSQL 数据库连接字符串
- `REDIS_URL` - 你的 Redis 连接字符串
- `GRAPHQL_ENDPOINT` - GraphQL 端点 URL
- `API_KEYS` - API 密钥（逗号分隔）
- `ADMIN_API_KEYS` - 管理员 API 密钥（逗号分隔）

### 可选的环境变量
- `RATE_LIMIT_WINDOW_MS=900000` (15分钟)
- `RATE_LIMIT_MAX_REQUESTS=100`
- `ALLOWED_ORIGINS` - 允许的跨域来源（逗号分隔）

## 部署步骤

1. 确保所有环境变量在 Vercel 项目设置中已配置
2. 推送代码到 Git 仓库
3. Vercel 会自动构建和部署

## 注意事项

- 数据库和 Redis 需要使用外部服务（如 Supabase、Upstash 等）
- 定时任务在 serverless 环境中可能需要额外配置
- 日志会输出到 Vercel 的函数日志中