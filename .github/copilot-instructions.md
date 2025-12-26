# Copilot 指南 — Sold Out 项目

简短说明：这是一个面向现场周边销售的 PWA（React + Vite）。主要数据存储在 IndexedDB（使用 Dexie），界面基于 MUI。下面列出对 AI 编码代理在此代码库中立即有用的关键信息与示例。

- **项目概览：** 参见 [README.md](README.md)；入口为 [src/main.jsx](src/main.jsx) → `App`（[src/App.jsx](src/App.jsx)）。主要页面位于 `src/pages/`（例如 `Inventory`, `NewSale`, `Sale`）。

- **运行 / 测试：** 使用 `npm install`，`npm run dev`（启动 Vite 开发服务器），`npm run build`，`npm run test`（使用 Vitest）。相关配置见 [package.json](package.json)。

- **数据层（关键）：** 全部持久化在 Dexie / IndexedDB，模式在 [src/db.js](src/db.js) 中定义：
  - 表：`products`, `orders`, `paymentChannels`, `cart`, `productImages`, `categories`。
  - 若需添加或变更 schema：在 `db.js` 中新增 `db.version(X).stores({...})` 并（如需要）添加 `upgrade`，然后递增版本号。
  - 初始数据通过 `db.on('populate',...)` 注入（示例：默认的 `paymentChannels`）。

- **图片与二进制数据：** 产品图片保存在 `productImages` 表（`productId` 作为键），并通过 `useProductWithImage`（[src/hooks/useProductWithImage.js](src/hooks/useProductWithImage.js)）读取为 `Blob` 并用 `URL.createObjectURL` 渲染。注意释放对象 URL（库中已有 revoke）。

- **状态与上下文：** 应用使用 React Context 提供通知与购物车：`NotificationProvider` 与 `CartProvider` 在 [src/main.jsx](src/main.jsx) 被包裹。查找 `NotificationContext.jsx` 与 `CartContext.jsx` 获取使用约定。

- **UI / 组件風格：** 使用 MUI（Material UI），组件位于 `src/components/`，页面位于 `src/pages/`。常见模式：
  - 编辑/添加使用模态（`ProductModal`）并通过 props 传入 `product`（参见 [src/pages/Inventory.jsx](src/pages/Inventory.jsx)）。
  - 列表项在 `ProductListItem` 中封装，卡片视图在 `ProductCard` 中（[src/components/ProductCard.jsx](src/components/ProductCard.jsx)）。

- **实时更新模式：** 使用 `dexie-react-hooks` 的 `useLiveQuery` 直接订阅 IndexedDB 变更（见 `Inventory.jsx` 等）。当引入新表或字段时，优先使用 `useLiveQuery` 以保持 UI 自动刷新。

- **持久化与本地设置：** 局部 UI 布局与首次引导通过 `localStorage` 管理（例如：`homePageLayout`, `hasSeenWelcome`，参见 `App.jsx`）。安装提示（PWA）通过 `beforeinstallprompt` 事件处理，`Settings` 页面从 `App` 接收 `showInstallButton` / `onInstallClick`。

- **开发辅助：** `App.jsx` 支持 URL 查询参数 `?devmode=true` 开启开发专用页面（`dev` tab），便于调试图像/资源查看器。

- **测试位置：** 单元/组件测试位于 `src/*test.jsx`（示例：`src/pages/ProductModal.test.jsx`）。运行 `npm run test` 以执行 Vitest。

- **变更建议与注意事项（给 AI 代理的具体规则）：**
  1. 修改数据库结构时：先在 `db.js` 新增更高版本的 `.stores()`，并在必要时添加 `upgrade`，然后在本地运行并验证 `db.on('populate')` 行为。
  2. 添加图片处理代码：使用与现有 `useProductWithImage` 同样的 `Blob` → `URL.createObjectURL` 模式，并确保在组件卸载时 `URL.revokeObjectURL`。
  3. 添加或修改页面组件：遵循现有分层（`pages/` 负责页面逻辑，`components/` 负责可复用 UI），尽量使用 MUI 组件并保持 props 向下传递的惯例。
  4. 编辑/新增全局上下文：在 `main.jsx` 中注册提供者；修改 Context 文件时保证不破坏现有提供的 API（`useNotification()`、`CartProvider` 等）。

- **快速示例：如何新增一个表**

  1. 在 `src/db.js` 中新增 `db.version(N).stores({ newTable: '++id, foo' })`。
  2. 必要时添加 `.upgrade(async tx => { /* migration */ })` 并在代码中使用 `db.newTable`。
  3. 为新表编写一个使用示例（例如 `useLiveQuery(() => db.newTable.toArray(), [])`），并在对应页面引入展示。

如需我把这些点更正式地合并进 README、或添加示例迁移/测试用例，我可以继续实现。请指出是否还要包含更多代码片段或约束规则。
