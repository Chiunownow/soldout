# PWA 销售记账与库存统计应用 / PWA Sales & Inventory Management App

这是一个轻量级的渐进式网络应用 (PWA)，旨在为小型销售场景提供简单的销售记账、库存跟踪和统计功能。它为移动设备优先设计，并支持完全离线运行。

This is a lightweight Progressive Web App (PWA) designed for small-scale sales scenarios, providing simple sales recording, inventory tracking, and analytics. It is mobile-first and fully functional offline.

---

## 核心功能 / Core Features

*   **产品管理 (Product Management):**
    *   添加和编辑产品（SKU），包括名称、价格和描述。
    *   为产品添加完全自定义的“键-值”对属性（例如：颜色、尺寸）。
*   **库存管理 (Inventory Management):**
    *   在创建产品时设置初始库存。
    *   支持为具有不同属性组合的产品（规格）分别设置库存。
*   **订单记录 (Order Recording):**
    *   从产品列表中选择商品快速创建订单。
    *   支持将订单中的商品标记为赠品。
*   **离线优先 (Offline First):**
    *   所有数据都存储在设备本地的 IndexedDB 中，无需网络连接即可运行。

## 技术栈 / Tech Stack

*   **核心框架 (Core Framework):** [React](https://react.dev/) (with [Vite](https://vitejs.dev/))
*   **UI 库 (UI Library):** [Material-UI (MUI)](https://mui.com/)
*   **数据持久化 (Data Persistence):** [IndexedDB](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API) (with [Dexie.js](https://dexie.org/))
*   **状态管理 (State Management):** React Context API

## 本地开发 / Getting Started

1.  **克隆仓库 (Clone the repository)**
    ```bash
    git clone <repository-url>
    cd app
    ```

2.  **安装依赖 (Install dependencies)**
    ```bash
    npm install
    ```

3.  **启动开发服务器 (Start the development server)**
    ```bash
    npm run dev
    ```

4.  在浏览器中打开 `http://localhost:5173`（或 Vite 提示的其他端口）。
    
    Open `http://localhost:5173` (or the port specified by Vite) in your browser.