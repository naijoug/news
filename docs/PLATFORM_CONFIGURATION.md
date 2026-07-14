# 平台配置指南

本文档详细说明如何添加新的新闻平台到聚合系统中。

## 目录

- [配置文件位置](#配置文件位置)
- [配置结构](#配置结构)
- [爬虫类型](#爬虫类型)
- [配置示例](#配置示例)
- [添加新平台步骤](#添加新平台步骤)
- [测试平台配置](#测试平台配置)
- [常见问题](#常见问题)

---

## 配置文件位置

平台配置文件位于：

```
backend/src/config/platforms.json
```

该文件包含所有平台的配置数组。

---

## 配置结构

每个平台配置包含以下字段：

```typescript
{
  "id": string,              // 平台唯一标识（小写字母和连字符）
  "name": string,            // 平台显示名称
  "icon_url": string,        // 平台图标路径
  "enabled": boolean,        // 是否启用该平台
  "config": {
    "type": "static" | "dynamic" | "api",  // 爬虫类型
    "url": string,           // 目标 URL
    "timeout": number,       // 超时时间（毫秒），可选
    "rateLimit": number,     // 请求间隔（毫秒），可选
    // ... 其他配置根据爬虫类型而定
  }
}
```

---

## 爬虫类型

系统支持三种爬虫类型：

### 1. Static（静态页面爬虫）

适用于服务端渲染的静态 HTML 页面，使用 Cheerio 解析。

**配置字段：**

```json
{
  "type": "static",
  "url": "https://example.com/hot",
  "selector": ".news-item", // CSS 选择器，选择新闻列表项
  "parser": {
    "title": ".title", // 标题选择器
    "url": "a@href", // 链接选择器（@attr 表示提取属性）
    "time": ".time", // 时间选择器（可选）
    "hotScore": ".score" // 热度选择器（可选）
  }
}
```

**选择器语法：**

- CSS 选择器：`.class`, `#id`, `tag`, `parent > child`
- 属性提取：`selector@attribute`（如 `a@href`, `img@src`）
- 文本提取：直接使用选择器（如 `.title`）

### 2. Dynamic（动态页面爬虫）

适用于需要 JavaScript 渲染的动态页面，使用 Puppeteer。

**配置字段：**

```json
{
  "type": "dynamic",
  "url": "https://example.com/trending",
  "waitFor": ".news-list", // 等待元素出现
  "selector": ".news-item",
  "parser": {
    "title": ".title",
    "url": "a@href",
    "time": ".time",
    "hotScore": ".score"
  }
}
```

**注意：** 动态爬虫消耗更多资源，仅在必要时使用。

### 3. API（API 爬虫）

适用于提供 REST API 或 GraphQL 接口的平台。

**配置字段：**

```json
{
  "type": "api",
  "url": "https://api.example.com/trending",
  "apiConfig": {
    "endpoint": "https://api.example.com/trending",
    "method": "GET", // GET 或 POST
    "headers": {
      // 请求头（可选）
      "Authorization": "Bearer {{API_TOKEN}}",
      "Content-Type": "application/json"
    },
    "params": {
      // 查询参数（可选）
      "limit": 50,
      "sort": "hot"
    },
    "body": {
      // 请求体（POST 时使用，可选）
      "query": "..."
    },
    "dataPath": "data.items" // 数据在响应中的路径（JSONPath）
  },
  "parser": {
    "title": "title", // JSON 字段路径
    "url": "url",
    "time": "created_at",
    "hotScore": "score"
  }
}
```

**JSONPath 语法：**

- 根对象：`$`
- 字段访问：`data.items`, `user.name`
- 数组访问：`items[0]`, `items[*]`（所有元素）
- 嵌套访问：`data.items[*].title`

---

## 配置示例

### 示例 1：微博热搜（静态页面）

```json
{
  "id": "weibo",
  "name": "微博热搜",
  "icon_url": "/icons/weibo.svg",
  "enabled": true,
  "config": {
    "type": "static",
    "url": "https://s.weibo.com/top/summary",
    "selector": "#pl_top_realtimehot table tbody tr",
    "parser": {
      "title": "td:nth-child(2) a",
      "url": "td:nth-child(2) a@href",
      "hotScore": "td:nth-child(2) span"
    },
    "timeout": 10000
  }
}
```

### 示例 2：知乎热榜（静态页面）

```json
{
  "id": "zhihu",
  "name": "知乎热榜",
  "icon_url": "/icons/zhihu.svg",
  "enabled": true,
  "config": {
    "type": "static",
    "url": "https://www.zhihu.com/hot",
    "selector": ".HotItem",
    "parser": {
      "title": ".HotItem-title",
      "url": ".HotItem-title a@href",
      "hotScore": ".HotItem-metrics"
    }
  }
}
```

### 示例 3：GitHub Trending（API）

```json
{
  "id": "github",
  "name": "GitHub Trending",
  "icon_url": "/icons/github.svg",
  "enabled": true,
  "config": {
    "type": "api",
    "url": "https://api.github.com/search/repositories",
    "apiConfig": {
      "endpoint": "https://api.github.com/search/repositories",
      "method": "GET",
      "params": {
        "q": "created:>2024-01-01",
        "sort": "stars",
        "order": "desc"
      },
      "headers": {
        "Accept": "application/vnd.github.v3+json"
      },
      "dataPath": "items"
    },
    "parser": {
      "title": "full_name",
      "url": "html_url",
      "hotScore": "stargazers_count",
      "time": "created_at"
    }
  }
}
```

### 示例 4：Hacker News（API，多步骤）

```json
{
  "id": "hackernews",
  "name": "Hacker News",
  "icon_url": "/icons/hackernews.svg",
  "enabled": true,
  "config": {
    "type": "api",
    "url": "https://hacker-news.firebaseio.com/v0/topstories.json",
    "apiConfig": {
      "endpoint": "https://hacker-news.firebaseio.com/v0/topstories.json",
      "method": "GET",
      "dataPath": "$"
    },
    "parser": {
      "itemEndpoint": "https://hacker-news.firebaseio.com/v0/item/{{id}}.json",
      "title": "title",
      "url": "url",
      "hotScore": "score",
      "time": "time"
    },
    "rateLimit": 100
  }
}
```

### 示例 5：V2EX（静态页面）

```json
{
  "id": "v2ex",
  "name": "V2EX",
  "icon_url": "/icons/v2ex.svg",
  "enabled": true,
  "config": {
    "type": "static",
    "url": "https://www.v2ex.com/?tab=hot",
    "selector": ".cell.item",
    "parser": {
      "title": ".item_title a",
      "url": ".item_title a@href",
      "time": ".topic_info .topic_info_date"
    }
  }
}
```

---

## 添加新平台步骤

### 步骤 1：准备平台图标

1. 准备 SVG 格式的平台图标
2. 将图标放置在 `frontend/public/icons/` 目录
3. 命名格式：`{platform_id}.svg`

### 步骤 2：编写配置

1. 打开 `backend/src/config/platforms.json`
2. 在数组中添加新的平台配置对象
3. 根据平台特点选择合适的爬虫类型
4. 填写必要的字段

### 步骤 3：验证配置格式

运行配置验证脚本：

```bash
cd backend
npm run validate-config
```

### 步骤 4：导入配置到数据库

```bash
npm run import-platforms --workspace=backend
```

### 步骤 5：测试爬虫

使用测试脚本验证爬虫是否正常工作：

```bash
npm run test-crawler --workspace=backend -- --platform={platform_id}
```

或通过 API 测试：

```bash
curl -X POST http://localhost:3000/api/platforms/{platform_id}/test
```

### 步骤 6：启用平台

如果测试成功，确保配置中 `enabled` 字段为 `true`，然后重新导入配置。

---

## 测试平台配置

### 使用命令行测试

```bash
# 测试单个平台
npm run test-crawler --workspace=backend -- --platform=weibo

# 测试所有平台
npm run test-crawler --workspace=backend
```

### 使用 API 测试

```bash
# 测试单个平台
curl -X POST http://localhost:3000/api/platforms/weibo/test

# 查看测试结果
# 返回示例数据和爬取统计
```

### 使用前端界面测试

1. 启动前端应用
2. 进入平台管理页面
3. 点击"测试"按钮
4. 查看实时爬取结果

---

## 常见问题

### Q1: 如何处理需要登录的平台？

**A:** 对于需要登录的平台，可以：

1. 使用 Cookie 或 Token 认证：

```json
{
  "apiConfig": {
    "headers": {
      "Cookie": "session=xxx",
      "Authorization": "Bearer {{API_TOKEN}}"
    }
  }
}
```

2. 在环境变量中配置敏感信息：

```bash
# .env
WEIBO_COOKIE=your_cookie_here
```

3. 在配置中使用占位符：

```json
{
  "headers": {
    "Cookie": "{{WEIBO_COOKIE}}"
  }
}
```

### Q2: 如何处理反爬虫机制？

**A:** 建议采取以下措施：

1. 设置合理的请求间隔：

```json
{
  "rateLimit": 1000, // 每次请求间隔 1 秒
  "timeout": 10000
}
```

2. 使用动态爬虫模拟真实浏览器：

```json
{
  "type": "dynamic",
  "userAgent": "Mozilla/5.0 ..."
}
```

3. 使用代理（需要额外配置）

### Q3: 如何提取嵌套的 JSON 数据？

**A:** 使用 JSONPath 语法：

```json
{
  "parser": {
    "title": "data.items[*].content.title",
    "url": "data.items[*].links.web"
  }
}
```

### Q4: 如何处理相对 URL？

**A:** 系统会自动将相对 URL 转换为绝对 URL，基于配置中的 `url` 字段。

### Q5: 如何调试爬虫配置？

**A:**

1. 查看后端日志：

```bash
cd backend
npm run dev
# 查看控制台输出
```

2. 使用测试脚本：

```bash
npm run test-crawler --workspace=backend -- --platform=your_platform --verbose
```

3. 检查数据库：

```bash
sqlite3 data/news.db
SELECT * FROM news WHERE platform_id = 'your_platform' ORDER BY crawl_time DESC LIMIT 10;
```

### Q6: 平台配置更新后需要重启服务吗？

**A:** 不需要。配置更新后，只需重新运行导入脚本：

```bash
npm run import-platforms --workspace=backend
```

下次爬取任务执行时会自动使用新配置。

### Q7: 如何禁用某个平台？

**A:** 有两种方式：

1. 在配置文件中设置 `enabled: false`，然后重新导入
2. 通过 API 更新：

```bash
curl -X PUT http://localhost:3000/api/platforms/weibo \
  -H "Content-Type: application/json" \
  -d '{"enabled": false}'
```

---

## 高级配置

### 自定义数据转换

如果需要对爬取的数据进行自定义转换，可以在 `backend/src/crawlers/utils/DataExtractor.ts` 中添加转换函数。

### 添加新的爬虫类型

如果现有的三种爬虫类型不满足需求，可以：

1. 在 `backend/src/crawlers/` 目录创建新的爬虫类
2. 继承 `BaseCrawler` 抽象类
3. 实现 `fetch()` 和 `parse()` 方法
4. 在 `CrawlerFactory.ts` 中注册新类型

---

## 贡献平台配置

如果你成功配置了新的平台，欢迎提交 Pull Request 分享给社区！

提交前请确保：

1. ✅ 配置格式正确
2. ✅ 爬虫测试通过
3. ✅ 包含平台图标
4. ✅ 遵守平台的服务条款
5. ✅ 不包含敏感信息（如 Token、Cookie）

---

## 参考资源

- [Cheerio 文档](https://cheerio.js.org/)
- [Puppeteer 文档](https://pptr.dev/)
- [JSONPath 语法](https://goessner.net/articles/JsonPath/)
- [CSS 选择器参考](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Selectors)
