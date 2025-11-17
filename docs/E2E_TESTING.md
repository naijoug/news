# 端到端测试文档

本项目使用 Playwright 进行端到端测试。

## 安装

```bash
cd frontend

# 安装 Playwright
npm install -D @playwright/test

# 安装浏览器
npx playwright install
```

## 运行测试

```bash
# 运行所有测试
npm run test:e2e

# 运行测试并显示浏览器
npm run test:e2e -- --headed

# 运行特定测试文件
npm run test:e2e -- app.spec.ts

# 调试模式
npm run test:e2e -- --debug

# 生成测试报告
npm run test:e2e -- --reporter=html
```

## 测试覆盖

### 核心功能测试

1. **应用加载**
   - ✅ 显示应用标题
   - ✅ 加载并显示新闻列表
   - ✅ 显示平台筛选器

2. **平台筛选**
   - ✅ 按平台筛选新闻
   - ✅ 多选平台
   - ✅ 全选/取消全选

3. **新闻交互**
   - ✅ 点击新闻在新标签页打开
   - ✅ 刷新新闻列表
   - ✅ 无限滚动加载更多

### 响应式设计测试

1. **桌面端 (> 1024px)**
   - ✅ 时间线居中显示
   - ✅ 筛选器固定在顶部
   - ✅ 完整布局显示

2. **平板端 (768px - 1024px)**
   - ✅ 自适应布局
   - ✅ 筛选器可见

3. **移动端 (< 768px)**
   - ✅ 筛选器改为抽屉式
   - ✅ 触摸友好的交互
   - ✅ 方向改变时重新布局

### 错误处理测试

1. **网络错误**
   - ✅ API 失败时显示错误消息
   - ✅ 提供重试功能

2. **离线状态**
   - ✅ 检测离线状态
   - ✅ 显示离线提示

## 测试配置

测试配置位于 `playwright.config.ts`：

- **测试目录**: `./e2e`
- **基础 URL**: `http://localhost:5173`
- **浏览器**: Chrome, Mobile Chrome, Mobile Safari
- **重试次数**: CI 环境 2 次，本地 0 次
- **截图**: 仅失败时
- **追踪**: 首次重试时

## 编写新测试

### 基本结构

```typescript
import { test, expect } from '@playwright/test';

test.describe('Feature Name', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should do something', async ({ page }) => {
    // 测试逻辑
    await expect(page.locator('selector')).toBeVisible();
  });
});
```

### 最佳实践

1. **使用语义化选择器**
   ```typescript
   // 好
   page.locator('[role="article"]')
   page.locator('button[aria-label="刷新新闻"]')
   
   // 避免
   page.locator('.css-class-123')
   ```

2. **等待元素加载**
   ```typescript
   await page.waitForSelector('[role="article"]', { timeout: 10000 });
   ```

3. **处理响应式设计**
   ```typescript
   const isMobile = await page.viewportSize()?.width! < 768;
   if (isMobile) {
     // 移动端特定逻辑
   }
   ```

4. **测试用户流程**
   - 模拟真实用户操作
   - 验证预期结果
   - 处理异步操作

## CI/CD 集成

### GitHub Actions 示例

```yaml
name: E2E Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      
      - name: Install dependencies
        run: |
          npm ci
          cd frontend && npm ci
          cd ../backend && npm ci
      
      - name: Install Playwright
        run: cd frontend && npx playwright install --with-deps
      
      - name: Start backend
        run: cd backend && npm run build && npm start &
      
      - name: Run E2E tests
        run: cd frontend && npm run test:e2e
      
      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-report
          path: frontend/playwright-report/
```

## 调试技巧

### 1. 使用 Playwright Inspector

```bash
npm run test:e2e -- --debug
```

### 2. 查看测试报告

```bash
npx playwright show-report
```

### 3. 截图和视频

测试失败时会自动截图，配置中可以启用视频录制：

```typescript
use: {
  video: 'retain-on-failure',
  screenshot: 'only-on-failure',
}
```

### 4. 慢速执行

```bash
npm run test:e2e -- --slow-mo=1000
```

## 常见问题

### 测试超时

增加超时时间：
```typescript
test('long running test', async ({ page }) => {
  test.setTimeout(60000); // 60 秒
  // ...
});
```

### 元素未找到

使用更可靠的选择器：
```typescript
// 使用 data-testid
<button data-testid="refresh-button">刷新</button>

// 在测试中
await page.click('[data-testid="refresh-button"]');
```

### 网络请求失败

模拟 API 响应：
```typescript
await page.route('**/api/news', route => {
  route.fulfill({
    status: 200,
    body: JSON.stringify({ data: [], total: 0 })
  });
});
```

## 性能测试

### 测量加载时间

```typescript
test('should load quickly', async ({ page }) => {
  const start = Date.now();
  await page.goto('/');
  await page.waitForSelector('[role="article"]');
  const loadTime = Date.now() - start;
  
  expect(loadTime).toBeLessThan(3000); // 3 秒内加载
});
```

## 维护建议

1. **定期更新依赖**
   ```bash
   npm update @playwright/test
   npx playwright install
   ```

2. **保持测试简洁**
   - 每个测试只验证一个功能
   - 避免测试之间的依赖

3. **使用 Page Objects**
   - 封装页面交互逻辑
   - 提高测试可维护性

4. **监控测试稳定性**
   - 识别不稳定的测试
   - 修复或重写不可靠的测试

## 参考资源

- [Playwright 官方文档](https://playwright.dev/)
- [最佳实践指南](https://playwright.dev/docs/best-practices)
- [API 参考](https://playwright.dev/docs/api/class-playwright)
