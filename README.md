# 热点新闻聚合系统

一个从多个平台自动抓取热点新闻并以时间线形式展示的网站。

## 项目结构

```
news-aggregator/
├── backend/          # 后端服务（Node.js + Express + TypeScript）
│   ├── src/
│   │   ├── controllers/    # API 控制器
│   │   ├── services/       # 业务逻辑
│   │   ├── repositories/   # 数据访问层
│   │   ├── crawlers/       # 爬虫模块
│   │   ├── routes/         # 路由定义
│   │   ├── models/         # 数据模型
│   │   ├── types/          # TypeScript 类型定义
│   │   └── utils/          # 工具函数
│   └── data/               # SQLite 数据库文件
└── frontend/         # 前端应用（React + TypeScript + Vite）
    └── src/
        ├── components/     # React 组件
        ├── services/       # API 服务
        ├── hooks/          # 自定义 Hooks
        ├── context/        # Context 状态管理
        └── types/          # TypeScript 类型定义
```

## 技术栈

### 后端

- Node.js + Express
- TypeScript
- SQLite (`sqlite3`)
- Cheerio (静态页面爬取)
- node-cron (定时任务)

### 前端

- React 18
- TypeScript
- Vite
- Tailwind CSS
- Axios

## 快速开始

### 前置要求

- Node.js 18.x 或更高版本
- npm 9.x 或更高版本

### 安装依赖

```bash
# 安装所有依赖（根目录和子项目）
npm install
```

### 开发环境

```bash
# 同时启动前后端开发服务器
npm run dev

# 或分别启动
npm run dev:backend   # 后端运行在 http://localhost:3000
npm run dev:frontend  # 前端运行在 http://localhost:5173
```

### 环境变量

#### 后端环境变量

复制 `backend/.env.example` 到 `backend/.env` 并根据需要修改配置：

```bash
cd backend
cp .env.example .env
```

#### 前端环境变量

前端使用 Vite 的环境变量系统：

- `.env.development` - 开发环境配置
- `.env.production` - 生产环境配置

### 初始化数据

平台配置会在后端首次启动时自动导入（幂等）。如需手动导入或更新：

```bash
cd backend
npm run import-platforms
```

### 构建生产版本

```bash
# 构建前后端
npm run build

# 或分别构建
npm run build:backend
npm run build:frontend
```

### 生产环境部署

详细的部署说明请查看 [DEPLOYMENT.md](./docs/DEPLOYMENT.md)

#### 使用 Docker（推荐）

```bash
# 构建并启动
docker compose up -d

# 查看日志
docker compose logs -f

# 停止服务
docker compose down
```

#### 传统部署

```bash
# 安装 PM2
npm install -g pm2

# 启动服务
cd backend
pm2 start dist/index.js --name news-aggregator

# 查看状态
pm2 status
```

## 功能特性

- ✅ 多平台新闻聚合（微博、知乎、百度、抖音、B站、Hacker News、Product Hunt、GitHub Trending、V2EX）
- ✅ 时间线展示，按时间倒序排列
- ✅ 平台筛选，支持多选
- ✅ 响应式设计，支持桌面、平板和移动设备
- ✅ 自动定时爬取（每天 8:00 和 20:00）
- ✅ 配置化爬虫引擎，易于扩展新平台
- ✅ 数据缓存和性能优化
- ✅ 错误边界和离线检测
- ✅ 图片懒加载

## 文档

- **[API 文档](./docs/API.md)** - 完整的 REST API 接口说明
- **[平台配置指南](./docs/PLATFORM_CONFIGURATION.md)** - 如何添加和配置新的新闻平台
- **[平台管理指南](./docs/PLATFORM_MANAGEMENT.md)** - 平台管理功能说明
- **[部署指南](./docs/DEPLOYMENT.md)** - 生产环境部署说明
- **[贡献指南](./docs/CONTRIBUTING.md)** - 如何参与项目开发
- **[需求文档](./.kiro/specs/news-aggregator/requirements.md)** - 系统需求规格
- **[设计文档](./.kiro/specs/news-aggregator/design.md)** - 架构和设计决策

## API 快速参考

### 获取新闻列表

```bash
GET /api/news?platforms=weibo,zhihu&limit=50&offset=0
```

### 获取平台列表

```bash
GET /api/platforms
```

### 手动触发爬取

```bash
POST /api/crawl/trigger
```

详细的 API 文档请查看 [API.md](./docs/API.md)

## 添加新平台

添加新平台只需三步：

1. 在 `backend/src/config/platforms.json` 中添加平台配置
2. 运行 `npm run import-platforms` 导入配置
3. 使用 `npm run test-crawler -- --platform={id}` 测试

详细的配置指南请查看 [PLATFORM_CONFIGURATION.md](./docs/PLATFORM_CONFIGURATION.md)

## 开发指南

查看 `.kiro/specs/news-aggregator/` 目录下的文档：

- `requirements.md` - 需求文档
- `design.md` - 设计文档
- `tasks.md` - 实施计划

## 性能优化

- 前端使用图片懒加载和代码分割
- API 响应缓存（5 分钟）
- 数据库索引优化
- 自动清理 7 天前的旧数据
- Gzip 压缩（生产环境）

## 故障排除

### 爬虫不工作

检查日志并手动触发：

```bash
curl -X POST http://localhost:3000/api/crawl/trigger
```

### 数据库锁定

重启服务：

```bash
pm2 restart news-aggregator
```

### 前端无法连接后端

检查环境变量配置和 API 地址。

## 开发工具

项目配置了以下开发工具：

- **ESLint** - 代码质量检查
- **Prettier** - 代码格式化
- **Husky** - Git hooks 管理
- **lint-staged** - 提交前自动检查

### 代码检查和格式化

```bash
# 检查代码
npm run lint

# 自动修复
npm run lint:fix

# 格式化代码
npm run format
```

Git 提交时会自动运行代码检查和格式化。

## 贡献

欢迎提交 Issue 和 Pull Request！

在贡献代码前，请阅读 [贡献指南](./docs/CONTRIBUTING.md) 了解：

- 开发环境设置
- 代码规范
- 提交规范
- 测试要求
- Pull Request 流程

## License

MIT
