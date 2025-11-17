# API 文档

## 基础信息

- **Base URL**: `http://localhost:3000/api`
- **Content-Type**: `application/json`
- **响应格式**: JSON

## 通用响应格式

### 成功响应

```json
{
  "data": [...],
  "total": 100
}
```

### 错误响应

```json
{
  "error": "错误描述",
  "code": "ERROR_CODE"
}
```

## HTTP 状态码

- `200 OK` - 请求成功
- `400 Bad Request` - 请求参数无效
- `404 Not Found` - 资源不存在
- `500 Internal Server Error` - 服务器内部错误

---

## 新闻接口

### 获取新闻列表

获取聚合的新闻列表，支持按平台、时间范围和分页查询。

**请求**

```
GET /api/news
```

**查询参数**

| 参数 | 类型 | 必填 | 说明 | 示例 |
|------|------|------|------|------|
| `platforms` | string | 否 | 平台 ID 列表，逗号分隔 | `weibo,zhihu,baidu` |
| `startTime` | string | 否 | 开始时间 (ISO 8601 格式) | `2024-01-01T00:00:00Z` |
| `endTime` | string | 否 | 结束时间 (ISO 8601 格式) | `2024-01-02T00:00:00Z` |
| `limit` | number | 否 | 返回数量，默认 50，最大 100 | `50` |
| `offset` | number | 否 | 偏移量，默认 0 | `0` |

**请求示例**

```bash
# 获取所有平台的最新 50 条新闻
curl "http://localhost:3000/api/news"

# 获取微博和知乎的新闻
curl "http://localhost:3000/api/news?platforms=weibo,zhihu"

# 分页获取新闻（第二页，每页 20 条）
curl "http://localhost:3000/api/news?limit=20&offset=20"

# 获取指定时间范围的新闻
curl "http://localhost:3000/api/news?startTime=2024-01-01T00:00:00Z&endTime=2024-01-02T00:00:00Z"
```

**响应示例**

```json
{
  "data": [
    {
      "id": 1,
      "title": "某某事件引发热议",
      "url": "https://weibo.com/...",
      "platform_id": "weibo",
      "publish_time": "2024-01-01T12:00:00.000Z",
      "hot_score": 1234567,
      "crawl_time": "2024-01-01T08:00:00.000Z"
    },
    {
      "id": 2,
      "title": "如何学习编程？",
      "url": "https://www.zhihu.com/question/...",
      "platform_id": "zhihu",
      "publish_time": "2024-01-01T11:30:00.000Z",
      "hot_score": 5000,
      "crawl_time": "2024-01-01T08:00:00.000Z"
    }
  ],
  "total": 150
}
```

**字段说明**

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | number | 新闻 ID |
| `title` | string | 新闻标题 |
| `url` | string | 新闻链接 |
| `platform_id` | string | 平台 ID |
| `publish_time` | string | 发布时间 (ISO 8601) |
| `hot_score` | number | 热度分数（可能为 null） |
| `crawl_time` | string | 爬取时间 (ISO 8601) |
| `total` | number | 符合条件的总记录数 |

---

## 平台接口

### 获取平台列表

获取所有已配置的新闻平台信息。

**请求**

```
GET /api/platforms
```

**请求示例**

```bash
curl "http://localhost:3000/api/platforms"
```

**响应示例**

```json
{
  "data": [
    {
      "id": "weibo",
      "name": "微博热搜",
      "icon_url": "/icons/weibo.svg",
      "enabled": true,
      "created_at": "2024-01-01T00:00:00.000Z",
      "updated_at": "2024-01-01T00:00:00.000Z"
    },
    {
      "id": "zhihu",
      "name": "知乎热榜",
      "icon_url": "/icons/zhihu.svg",
      "enabled": true,
      "created_at": "2024-01-01T00:00:00.000Z",
      "updated_at": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

**字段说明**

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | string | 平台唯一标识 |
| `name` | string | 平台显示名称 |
| `icon_url` | string | 平台图标 URL |
| `enabled` | boolean | 是否启用 |
| `created_at` | string | 创建时间 |
| `updated_at` | string | 更新时间 |

### 添加新平台

添加一个新的新闻平台配置。

**请求**

```
POST /api/platforms
```

**请求体**

```json
{
  "id": "reddit",
  "name": "Reddit",
  "icon_url": "/icons/reddit.svg",
  "enabled": true,
  "config": {
    "type": "api",
    "url": "https://www.reddit.com/r/popular.json",
    "apiConfig": {
      "endpoint": "https://www.reddit.com/r/popular.json",
      "method": "GET",
      "dataPath": "data.children"
    },
    "parser": {
      "title": "data.title",
      "url": "data.url",
      "hotScore": "data.score",
      "time": "data.created_utc"
    }
  }
}
```

**响应示例**

```json
{
  "data": {
    "id": "reddit",
    "name": "Reddit",
    "icon_url": "/icons/reddit.svg",
    "enabled": true
  }
}
```

### 更新平台配置

更新现有平台的配置信息。

**请求**

```
PUT /api/platforms/:id
```

**路径参数**

| 参数 | 类型 | 说明 |
|------|------|------|
| `id` | string | 平台 ID |

**请求体**

```json
{
  "name": "Reddit 热门",
  "enabled": false
}
```

**响应示例**

```json
{
  "data": {
    "id": "reddit",
    "name": "Reddit 热门",
    "icon_url": "/icons/reddit.svg",
    "enabled": false
  }
}
```

### 删除平台

删除指定的平台配置。

**请求**

```
DELETE /api/platforms/:id
```

**路径参数**

| 参数 | 类型 | 说明 |
|------|------|------|
| `id` | string | 平台 ID |

**响应示例**

```json
{
  "data": {
    "message": "平台删除成功"
  }
}
```

### 测试平台爬虫

测试指定平台的爬虫配置是否正常工作。

**请求**

```
POST /api/platforms/:id/test
```

**路径参数**

| 参数 | 类型 | 说明 |
|------|------|------|
| `id` | string | 平台 ID |

**请求示例**

```bash
curl -X POST "http://localhost:3000/api/platforms/weibo/test"
```

**响应示例**

```json
{
  "data": {
    "success": true,
    "itemCount": 50,
    "samples": [
      {
        "title": "测试新闻标题",
        "url": "https://...",
        "platform_id": "weibo",
        "publish_time": "2024-01-01T12:00:00.000Z",
        "hot_score": 1000000
      }
    ]
  }
}
```

---

## 爬虫接口

### 手动触发爬取

手动触发所有启用平台的新闻爬取任务。

**请求**

```
POST /api/crawl/trigger
```

**请求示例**

```bash
curl -X POST "http://localhost:3000/api/crawl/trigger"
```

**响应示例**

```json
{
  "data": {
    "message": "爬取任务已触发",
    "timestamp": "2024-01-01T12:00:00.000Z"
  }
}
```

---

## 错误代码

| 错误代码 | 说明 |
|---------|------|
| `INVALID_PARAMS` | 请求参数无效 |
| `PLATFORM_NOT_FOUND` | 平台不存在 |
| `PLATFORM_EXISTS` | 平台已存在 |
| `INVALID_CONFIG` | 平台配置无效 |
| `CRAWLER_ERROR` | 爬虫执行错误 |
| `DATABASE_ERROR` | 数据库操作错误 |
| `INTERNAL_ERROR` | 服务器内部错误 |

---

## 缓存策略

- 新闻列表接口缓存 5 分钟
- 平台列表接口缓存 10 分钟
- 缓存基于完整的请求 URL（包括查询参数）

---

## 限流

目前未实施限流策略，建议在生产环境中添加适当的限流措施。

---

## 示例：使用 JavaScript 调用 API

```javascript
// 获取新闻列表
async function getNews(platforms = [], limit = 50, offset = 0) {
  const params = new URLSearchParams();
  if (platforms.length > 0) {
    params.append('platforms', platforms.join(','));
  }
  params.append('limit', limit);
  params.append('offset', offset);

  const response = await fetch(`http://localhost:3000/api/news?${params}`);
  const data = await response.json();
  return data;
}

// 获取平台列表
async function getPlatforms() {
  const response = await fetch('http://localhost:3000/api/news');
  const data = await response.json();
  return data;
}

// 手动触发爬取
async function triggerCrawl() {
  const response = await fetch('http://localhost:3000/api/crawl/trigger', {
    method: 'POST'
  });
  const data = await response.json();
  return data;
}
```

---

## 示例：使用 Python 调用 API

```python
import requests

# 获取新闻列表
def get_news(platforms=None, limit=50, offset=0):
    params = {
        'limit': limit,
        'offset': offset
    }
    if platforms:
        params['platforms'] = ','.join(platforms)
    
    response = requests.get('http://localhost:3000/api/news', params=params)
    return response.json()

# 获取平台列表
def get_platforms():
    response = requests.get('http://localhost:3000/api/platforms')
    return response.json()

# 手动触发爬取
def trigger_crawl():
    response = requests.post('http://localhost:3000/api/crawl/trigger')
    return response.json()
```
