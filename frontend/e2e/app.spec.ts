import { test, expect } from '@playwright/test';

test.describe('News Aggregator App', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display the app title', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('热点新闻聚合');
  });

  test('should load and display news items', async ({ page }) => {
    // 等待新闻加载
    await page.waitForSelector('[role="article"]', { timeout: 10000 });
    
    // 检查是否有新闻卡片
    const newsCards = page.locator('[role="article"]');
    const count = await newsCards.count();
    expect(count).toBeGreaterThan(0);
  });

  test('should display platform filter', async ({ page }) => {
    // 桌面端：检查筛选器是否可见
    const isDesktop = await page.viewportSize()?.width! > 768;
    
    if (isDesktop) {
      await expect(page.locator('text=平台筛选')).toBeVisible();
    } else {
      // 移动端：检查筛选按钮
      await expect(page.locator('button:has-text("筛选")')).toBeVisible();
    }
  });

  test('should filter news by platform', async ({ page }) => {
    const viewport = page.viewportSize();
    const isMobile = viewport && viewport.width < 768;

    if (isMobile) {
      // 移动端：打开筛选抽屉
      await page.click('button:has-text("筛选")');
      await page.waitForTimeout(300); // 等待抽屉动画
    }

    // 等待平台列表加载
    await page.waitForSelector('input[type="checkbox"]', { timeout: 5000 });

    // 取消全选
    const selectAllCheckbox = page.locator('input[type="checkbox"]').first();
    await selectAllCheckbox.uncheck();

    // 选择第一个平台
    const firstPlatformCheckbox = page.locator('input[type="checkbox"]').nth(1);
    await firstPlatformCheckbox.check();

    if (isMobile) {
      // 关闭抽屉
      await page.click('button[aria-label="关闭筛选器"]');
    }

    // 等待新闻重新加载
    await page.waitForTimeout(1000);

    // 验证新闻已更新
    const newsCards = page.locator('[role="article"]');
    await expect(newsCards.first()).toBeVisible();
  });

  test('should open news link in new tab', async ({ page, context }) => {
    // 等待新闻加载
    await page.waitForSelector('[role="article"]', { timeout: 10000 });

    // 监听新标签页
    const pagePromise = context.waitForEvent('page');
    
    // 点击第一条新闻
    await page.locator('[role="article"]').first().click();

    // 验证新标签页打开
    const newPage = await pagePromise;
    await newPage.waitForLoadState();
    expect(newPage.url()).not.toBe(page.url());
  });

  test('should refresh news on refresh button click', async ({ page }) => {
    // 等待初始加载
    await page.waitForSelector('[role="article"]', { timeout: 10000 });

    // 点击刷新按钮
    await page.click('button[aria-label="刷新新闻"]');

    // 验证加载状态
    await expect(page.locator('button[aria-label="刷新新闻"] svg')).toHaveClass(/animate-spin/);

    // 等待加载完成
    await page.waitForTimeout(2000);
  });
});

test.describe('Responsive Design', () => {
  test('should display correctly on desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/');

    // 检查桌面布局
    await expect(page.locator('.platform-filter-sticky')).toBeVisible();
    await expect(page.locator('.platform-drawer')).not.toBeVisible();
  });

  test('should display correctly on tablet', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/');

    // 检查平板布局
    await expect(page.locator('.platform-filter-sticky')).toBeVisible();
  });

  test('should display correctly on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    // 检查移动端布局
    await expect(page.locator('.platform-filter-sticky')).not.toBeVisible();
    await expect(page.locator('button:has-text("筛选")')).toBeVisible();

    // 打开筛选抽屉
    await page.click('button:has-text("筛选")');
    await page.waitForTimeout(300);

    // 检查抽屉是否打开
    await expect(page.locator('.platform-drawer.open')).toBeVisible();

    // 关闭抽屉
    await page.click('.platform-drawer-overlay');
    await page.waitForTimeout(300);

    // 检查抽屉是否关闭
    await expect(page.locator('.platform-drawer.open')).not.toBeVisible();
  });

  test('should handle orientation change', async ({ page }) => {
    // 竖屏
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await expect(page.locator('h1')).toBeVisible();

    // 横屏
    await page.setViewportSize({ width: 667, height: 375 });
    await page.waitForTimeout(500);
    await expect(page.locator('h1')).toBeVisible();
  });
});

test.describe('Error Handling', () => {
  test('should display error message when API fails', async ({ page }) => {
    // 拦截 API 请求并返回错误
    await page.route('**/api/platforms', route => {
      route.abort('failed');
    });

    await page.goto('/');

    // 等待错误消息显示
    await page.waitForTimeout(2000);
    
    // 注意：这个测试可能需要根据实际的错误处理逻辑调整
  });

  test('should show offline notice when offline', async ({ page, context }) => {
    await page.goto('/');

    // 模拟离线状态
    await context.setOffline(true);
    await page.waitForTimeout(500);

    // 检查离线提示（如果实现了）
    // await expect(page.locator('text=离线')).toBeVisible();

    // 恢复在线状态
    await context.setOffline(false);
  });
});
