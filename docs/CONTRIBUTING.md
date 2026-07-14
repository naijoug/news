# 贡献指南

感谢你对本项目的关注！本文档将帮助你了解如何为项目做出贡献。

## 目录

- [开发环境设置](#开发环境设置)
- [代码规范](#代码规范)
- [提交规范](#提交规范)
- [测试](#测试)
- [Pull Request 流程](#pull-request-流程)

---

## 开发环境设置

### 前置要求

- Node.js 18.x 或更高版本
- npm 9.x 或更高版本
- Git

### 克隆仓库

```bash
git clone https://github.com/your-username/news-aggregator.git
cd news-aggregator
```

### 安装依赖

```bash
# 安装所有依赖（包括开发工具）
npm install

# 初始化 Git hooks
npm run prepare
```

### 配置环境变量

```bash
# 后端
cd backend
cp .env.example .env
# 根据需要修改 .env 文件

# 前端
cd ../frontend
cp .env.example .env.development
# 根据需要修改 .env.development 文件
```

### 初始化数据库

```bash
npm run import-platforms --workspace=backend
```

### 启动开发服务器

```bash
# 在项目根目录
npm run dev

# 或分别启动
npm run dev:backend   # 后端: http://localhost:3000
npm run dev:frontend  # 前端: http://localhost:5173
```

---

## 代码规范

本项目使用 ESLint 和 Prettier 来保持代码风格一致。

### ESLint

ESLint 配置文件：

- 后端: `backend/.eslintrc.json`
- 前端: `frontend/.eslintrc.json`

运行 ESLint：

```bash
# 检查所有代码
npm run lint

# 自动修复问题
npm run lint:fix

# 检查特定工作区
npm run lint --workspace=backend
npm run lint --workspace=frontend
```

### Prettier

Prettier 配置文件：`.prettierrc`

运行 Prettier：

```bash
# 格式化所有代码
npm run format

# 检查格式（不修改文件）
npm run format:check
```

### 代码风格指南

#### TypeScript

- 使用 TypeScript 严格模式
- 优先使用接口（interface）而非类型别名（type）
- 避免使用 `any`，使用 `unknown` 或具体类型
- 为函数参数和返回值添加类型注解

```typescript
// ✅ 好的示例
interface User {
  id: string;
  name: string;
}

function getUser(id: string): Promise<User> {
  // ...
}

// ❌ 避免
function getUser(id: any): any {
  // ...
}
```

#### React

- 使用函数组件和 Hooks
- 组件文件使用 PascalCase 命名
- Props 接口以组件名 + Props 命名

```typescript
// ✅ 好的示例
interface NewsCardProps {
  news: NewsItem;
  platform: Platform;
}

export const NewsCard: React.FC<NewsCardProps> = ({ news, platform }) => {
  // ...
};
```

#### 命名规范

- 文件名：
  - 组件：PascalCase（如 `NewsCard.tsx`）
  - 工具函数：camelCase（如 `formatDate.ts`）
  - 常量：UPPER_SNAKE_CASE（如 `API_BASE_URL`）

- 变量和函数：camelCase
- 类和接口：PascalCase
- 常量：UPPER_SNAKE_CASE

---

## 提交规范

本项目使用 [Conventional Commits](https://www.conventionalcommits.org/) 规范。

### 提交消息格式

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Type 类型

- `feat`: 新功能
- `fix`: 修复 bug
- `docs`: 文档更新
- `style`: 代码格式调整（不影响功能）
- `refactor`: 重构（既不是新功能也不是修复）
- `perf`: 性能优化
- `test`: 添加或修改测试
- `chore`: 构建过程或辅助工具的变动

### Scope 范围

- `backend`: 后端相关
- `frontend`: 前端相关
- `crawler`: 爬虫相关
- `api`: API 相关
- `ui`: UI 相关
- `docs`: 文档相关

### 示例

```bash
# 添加新功能
git commit -m "feat(crawler): 添加 Reddit 平台爬虫"

# 修复 bug
git commit -m "fix(api): 修复分页参数验证错误"

# 更新文档
git commit -m "docs: 更新 API 文档"

# 重构代码
git commit -m "refactor(backend): 优化数据库查询逻辑"
```

### Git Hooks

项目配置了 pre-commit hook，会在提交前自动：

1. 运行 lint-staged 检查暂存的文件
2. 自动格式化代码
3. 运行 ESLint 检查

如果检查失败，提交会被阻止。请修复问题后重新提交。

---

## 测试

### 后端测试

```bash
cd backend

# 运行所有测试
npm test

# 监听模式
npm run test:watch

# 测试单个文件
npm test -- repositories.test.ts
```

### 前端 E2E 测试

```bash
cd frontend

# 运行 E2E 测试
npm run test:e2e

# UI 模式
npm run test:e2e:ui

# 调试模式
npm run test:e2e:debug
```

### 测试覆盖率

```bash
# 后端
cd backend
npm test -- --coverage
```

### 编写测试

- 为新功能编写测试
- 确保测试覆盖核心逻辑
- 使用描述性的测试名称
- 遵循 AAA 模式（Arrange, Act, Assert）

```typescript
// 示例
describe('NewsRepository', () => {
  it('should save news items to database', async () => {
    // Arrange
    const newsItems = [{ title: 'Test', url: 'https://...' }];

    // Act
    await repository.saveNews(newsItems);

    // Assert
    const saved = await repository.getNews({});
    expect(saved.length).toBe(1);
  });
});
```

---

## Pull Request 流程

### 1. Fork 仓库

点击 GitHub 页面右上角的 "Fork" 按钮。

### 2. 创建分支

```bash
git checkout -b feature/your-feature-name
# 或
git checkout -b fix/your-bug-fix
```

分支命名规范：

- `feature/xxx`: 新功能
- `fix/xxx`: bug 修复
- `docs/xxx`: 文档更新
- `refactor/xxx`: 重构

### 3. 开发和提交

```bash
# 进行修改
git add .
git commit -m "feat: 添加新功能"

# 推送到你的 fork
git push origin feature/your-feature-name
```

### 4. 创建 Pull Request

1. 访问你的 fork 仓库页面
2. 点击 "New Pull Request"
3. 填写 PR 描述：
   - 说明修改的内容和原因
   - 关联相关的 Issue（如果有）
   - 添加截图（如果是 UI 变更）

### 5. PR 检查清单

在提交 PR 前，请确保：

- [ ] 代码通过所有 lint 检查
- [ ] 代码格式符合 Prettier 规范
- [ ] 所有测试通过
- [ ] 添加了必要的测试
- [ ] 更新了相关文档
- [ ] 提交消息符合规范
- [ ] 没有合并冲突

### 6. Code Review

- 维护者会审查你的代码
- 根据反馈进行修改
- 修改后推送到同一分支，PR 会自动更新

### 7. 合并

PR 被批准后，维护者会合并你的代码。

---

## 添加新平台

如果你想添加新的新闻平台，请参考 [PLATFORM_CONFIGURATION.md](./PLATFORM_CONFIGURATION.md)。

提交新平台配置的 PR 时，请确保：

1. 配置格式正确
2. 爬虫测试通过
3. 包含平台图标（SVG 格式）
4. 不包含敏感信息
5. 遵守平台的服务条款

---

## 报告问题

发现 bug 或有功能建议？请创建 Issue：

1. 访问 [Issues 页面](https://github.com/your-username/news-aggregator/issues)
2. 点击 "New Issue"
3. 选择合适的模板
4. 填写详细信息

### Bug 报告应包含

- 问题描述
- 复现步骤
- 预期行为
- 实际行为
- 环境信息（操作系统、Node.js 版本等）
- 截图或日志（如果适用）

### 功能建议应包含

- 功能描述
- 使用场景
- 预期效果
- 可能的实现方案（可选）

---

## 获取帮助

如果你在开发过程中遇到问题：

1. 查看项目文档
2. 搜索已有的 Issues
3. 在 Discussions 中提问
4. 联系维护者

---

## 行为准则

- 尊重所有贡献者
- 保持友好和专业
- 接受建设性的批评
- 关注对项目最有利的事情

---

## 许可证

通过贡献代码，你同意你的贡献将在 MIT 许可证下发布。

---

感谢你的贡献！🎉
