# 部署文档

本文档介绍如何部署热点新闻聚合系统到生产环境。

## 目录

- [环境要求](#环境要求)
- [配置说明](#配置说明)
- [部署方式](#部署方式)
  - [Docker 部署（推荐）](#docker-部署推荐)
  - [传统部署](#传统部署)
- [生产环境优化](#生产环境优化)
- [监控和维护](#监控和维护)

## 环境要求

### 最低要求

- Node.js 18.x 或更高版本
- npm 9.x 或更高版本
- 2GB RAM
- 10GB 磁盘空间

### 推荐配置

- Node.js 18.x LTS
- 4GB RAM
- 20GB SSD
- Ubuntu 20.04 LTS 或更高版本

## 配置说明

### 环境变量

#### 后端环境变量 (backend/.env)

```bash
# 服务器端口
PORT=3000

# 数据库路径
DATABASE_PATH=./data/news.db

# 爬虫调度时间 (cron 格式)
# 默认: 每天 8:00 和 20:00 执行
CRAWL_SCHEDULE="0 8,20 * * *"

# 日志级别 (debug, info, warn, error)
LOG_LEVEL=info

# 数据保留天数（backend/src/index.ts 读取 DAYS_TO_KEEP）
DAYS_TO_KEEP=7
```

#### 前端环境变量 (frontend/.env.production)

```bash
# API 基础 URL
VITE_API_BASE_URL=/api

# 环境标识
VITE_ENV=production
```

## 部署方式

### Docker 部署（推荐）

Docker 部署是最简单和推荐的方式，可以确保环境一致性。

#### 1. 安装 Docker 和 Docker Compose

```bash
# Ubuntu/Debian
sudo apt-get update
sudo apt-get install docker.io docker-compose-plugin

# 启动 Docker 服务
sudo systemctl start docker
sudo systemctl enable docker
```

#### 2. 克隆项目

```bash
git clone <repository-url>
cd news-aggregator
```

#### 3. 配置环境变量

编辑 `docker-compose.yml` 中的环境变量（如需要）。

#### 4. 构建和启动

```bash
# 构建镜像
docker compose build

# 启动服务
docker compose up -d

# 查看日志
docker compose logs -f

# 停止服务
docker compose down
```

#### 5. 访问应用

打开浏览器访问 `http://your-server-ip:3000`

### 传统部署

如果不使用 Docker，可以按照以下步骤手动部署。

#### 1. 安装依赖

本项目使用 npm workspaces，`package-lock.json` 位于仓库根目录；请在根目录执行 `npm ci`，不要在 `backend/` 或 `frontend/` 子目录单独运行 `npm ci`。

```bash
# 在仓库根目录安装根项目和所有 workspace 依赖
npm ci
```

#### 2. 构建项目

```bash
# 构建后端和前端
npm run build

# 或分别构建
npm run build --workspace=backend
npm run build --workspace=frontend
```

#### 3. 配置环境变量

```bash
# 复制环境变量模板
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.production

# 编辑环境变量
nano backend/.env
nano frontend/.env.production
```

#### 4. 启动服务（平台数据自动导入）

后端首次启动时会自动从 `backend/src/config/platforms.json` 导入默认平台配置（幂等操作）。
如需手动导入或更新平台：

```bash
npm run import-platforms --workspace=backend
```

#### 5. 使用 PM2 管理进程

```bash
# 安装 PM2
npm install -g pm2

# 启动后端服务（在仓库根目录执行）
pm2 start backend/dist/index.js --name news-aggregator

# 设置开机自启
pm2 startup
pm2 save

# 查看日志
pm2 logs news-aggregator

# 重启服务
pm2 restart news-aggregator

# 停止服务
pm2 stop news-aggregator
```

#### 6. 配置 Nginx（可选）

如果需要使用域名和 HTTPS，可以配置 Nginx 作为反向代理。

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # 前端静态文件
    location / {
        root /path/to/frontend/dist;
        try_files $uri $uri/ /index.html;
    }

    # API 代理
    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

启用配置：

```bash
sudo ln -s /etc/nginx/sites-available/news-aggregator /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## 生产环境优化

### 1. 性能优化

- **启用 Gzip 压缩**: 在 Nginx 中启用 gzip 压缩
- **CDN 加速**: 将静态资源部署到 CDN
- **数据库优化**: 定期清理旧数据，保持数据库性能

### 2. 安全配置

```bash
# 设置文件权限
chmod 600 backend/.env
chmod 755 backend/data

# 配置防火墙
sudo ufw allow 3000/tcp
sudo ufw enable
```

### 3. 备份策略

```bash
# 创建备份脚本
cat > backup.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/backup/news-aggregator"
DATE=$(date +%Y%m%d_%H%M%S)

# 备份数据库
mkdir -p $BACKUP_DIR
cp backend/data/news.db $BACKUP_DIR/news_$DATE.db

# 保留最近 7 天的备份
find $BACKUP_DIR -name "news_*.db" -mtime +7 -delete
EOF

chmod +x backup.sh

# 添加到 crontab (每天凌晨 2 点备份)
crontab -e
# 添加: 0 2 * * * /path/to/backup.sh
```

## 监控和维护

### 1. 日志管理

```bash
# 查看后端日志
pm2 logs news-aggregator

# 或使用 Docker
docker compose logs -f news-aggregator

# 日志轮转配置 (使用 logrotate)
sudo nano /etc/logrotate.d/news-aggregator
```

### 2. 健康检查

容器和编排层使用 `/health` 做轻量 liveness 检查；平台数据是否已自动导入则用 `/api/platforms` 做 smoke test。不要把这两类检查混在一起：数据库短暂不可用时，`/api/platforms` 失败可以提示数据面问题，但不一定代表进程已经退出。

```bash
# 检查进程存活（与 Dockerfile / docker-compose.yml 的 healthcheck 一致）
curl http://localhost:3000/health

# 检查平台数据已导入并可读
curl http://localhost:3000/api/platforms

# 使用 PM2 监控
pm2 monit

# Docker 健康检查
# healthy 表示 /health 通过；如需验证数据导入，请再执行上面的 /api/platforms smoke test。
docker compose ps
```

### 3. 性能监控

推荐使用以下工具：

- **PM2 Plus**: 应用性能监控
- **Prometheus + Grafana**: 系统监控
- **New Relic / DataDog**: APM 监控

### 4. 常见问题

#### 爬虫不工作

```bash
# 检查定时任务
pm2 logs news-aggregator | grep "Crawler"

# 手动触发爬虫
curl -X POST http://localhost:3000/api/crawl/trigger
```

#### 数据库锁定

```bash
# 重启服务
pm2 restart news-aggregator

# 或使用 Docker
docker compose restart
```

#### 内存占用过高

```bash
# 清理旧数据
# 数据会自动清理，也可以手动清理
sqlite3 backend/data/news.db "DELETE FROM news WHERE crawl_time < datetime('now', '-7 days');"
```

## 更新部署

### Docker 更新

```bash
# 拉取最新代码
git pull

# 重新构建和启动
docker compose down
docker compose build
docker compose up -d
```

### 传统部署更新

```bash
# 拉取最新代码
git pull

# 重新构建
npm run build

# 重启服务
pm2 restart news-aggregator
```

## 扩展性考虑

### 水平扩展

如果需要处理更大的流量，可以考虑：

1. **负载均衡**: 使用 Nginx 或 HAProxy 进行负载均衡
2. **数据库分离**: 将 SQLite 迁移到 PostgreSQL 或 MySQL
3. **缓存层**: 添加 Redis 缓存热门数据
4. **消息队列**: 使用 RabbitMQ 或 Kafka 处理爬虫任务

### 高可用部署

```
┌─────────────┐
│   Nginx LB  │
└──────┬──────┘
       │
   ┌───┴───┐
   │       │
┌──▼──┐ ┌──▼──┐
│ App1│ │ App2│
└──┬──┘ └──┬──┘
   │       │
   └───┬───┘
       │
  ┌────▼────┐
  │Database │
  └─────────┘
```

## 支持

如有问题，请查看：

- 项目 README.md
- GitHub Issues
- 技术文档

---

最后更新: 2026-07-14
