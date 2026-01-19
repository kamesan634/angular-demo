# 龜三的ERP Demo - Angular 前端


![CI](https://github.com/kamesan634/angular-demo/actions/workflows/ci.yml/badge.svg)

基於 Angular 21 + PrimeNG 21 DEMO用的零售業 ERP 系統前端應用。

## 技能樹 請點以下技能

| 技能 | 版本 | 說明 |
|------|------|------|
| Angular | 21 | 前端框架 |
| TypeScript | 5.7 | 程式語言 |
| PrimeNG | 21 | UI 元件庫 |
| PrimeFlex | 4 | CSS 工具類別 |
| Chart.js | 4 | 圖表套件 |
| RxJS | 7 | 響應式程式設計 |
| Jest | 30 | 單元測試 |
| Playwright | 1.57 | E2E 測試 |
| ESLint | 9 | 程式碼檢查 |
| Prettier | 3 | 程式碼格式化 |

## 功能模組

- **auth** - 認證模組（登入、登出、JWT Token 自動刷新）
- **dashboard** - 儀表板（營業概況、即時銷售圖表、庫存警示）
- **base-data** - 基礎資料（商品、分類、客戶、供應商、門市、倉庫、員工、單位）
- **sales** - 銷售模組（POS、訂單、發票、客戶、退貨、促銷）
- **inventory** - 庫存模組（庫存查詢、調撥、調整、盤點、倉庫管理）
- **purchasing** - 採購模組（採購單、進貨、供應商、退貨）
- **reports** - 報表模組（銷售報表、庫存報表、財務報表、報表範本、排程）

## 快速開始

### 環境需求

- Node.js 20+
- npm 10+

### 安裝

```bash
# 安裝依賴
npm install

# 複製環境變數檔
cp .env.example .env
```

### 開發

```bash
# 啟動開發伺服器
npm start

# 瀏覽器開啟 http://localhost:4200
```

### 建置

```bash
# 開發版本
npm run build

# 正式版本
npm run build:prod
```

## Port

| 服務 | Port | 說明 |
|------|------|------|
| Angular Dev Server | 4200 | 開發伺服器 |
| 後端 API (FastAPI) | 8002 | REST API 服務 |

## 測試資訊

### 測試帳號

所有帳號的密碼都是：`password123`

| 帳號 | 角色 | 說明 |
|------|------|------|
| admin | 系統管理員 | 擁有所有權限 |
| manager | 門市店長 | 門市管理權限 |
| cashier | 收銀員 | 收銀台操作權限 |

### 執行測試

```bash
# 執行單元測試
npm run test

# 執行測試 (監看模式)
npm run test:watch

# 執行測試覆蓋率
npm run test:coverage

# 執行 E2E 測試
npm run e2e

# 執行 E2E 測試 (UI 模式)
npm run e2e:ui
```

### 測試覆蓋範圍

| 模組 | 測試類別 | 測試項目 |
|------|----------|----------|
| 認證 | AuthService | 登入、登出、Token 刷新、Token 過期處理 |
| 商品 | ProductService | CRUD、搜尋、分頁 |
| 訂單 | OrderService | CRUD、狀態管理、計算金額 |
| 庫存 | InventoryService | 查詢、調整、異動記錄 |
| 報表 | ReportService | 銷售報表、庫存報表、匯出 |

## 程式碼品質

```bash
# ESLint 檢查
npm run lint

# ESLint 自動修復
npm run lint:fix

# Prettier 格式化
npm run format

# Prettier 檢查
npm run format:check
```

## 專案結構

```
angular-demo/
├── src/
│   ├── app/
│   │   ├── core/                   # 核心模組
│   │   │   ├── guards/             # 路由守衛
│   │   │   ├── interceptors/       # HTTP 攔截器
│   │   │   ├── models/             # 資料模型
│   │   │   └── services/           # 核心服務
│   │   ├── shared/                 # 共用模組
│   │   │   ├── components/         # 共用元件
│   │   │   ├── directives/         # 共用指令
│   │   │   └── pipes/              # 共用管道
│   │   ├── features/               # 功能模組
│   │   │   ├── auth/               # 認證模組
│   │   │   ├── dashboard/          # 儀表板
│   │   │   ├── base-data/          # 基礎資料
│   │   │   ├── sales/              # 銷售模組
│   │   │   ├── inventory/          # 庫存模組
│   │   │   ├── purchasing/         # 採購模組
│   │   │   └── reports/            # 報表模組
│   │   └── layout/                 # 版面配置
│   ├── environments/               # 環境設定
│   └── styles.scss                 # 全域樣式
├── e2e/                            # E2E 測試
├── jest.config.js                  # Jest 設定
├── playwright.config.ts            # Playwright 設定
└── package.json
```

## 環境變數

| 變數 | 說明 | 預設值 |
|------|------|--------|
| API_URL | 後端 API 位址 | http://localhost:8002/api/v1 |
| PORT | 開發伺服器埠號 | 4200 |

## API 串接

本專案串接 `fastapi-demo` 後端 API，主要端點包括：

- 認證：`/api/v1/auth/*`
- 使用者：`/api/v1/users/*`
- 商品：`/api/v1/products/*`
- 訂單：`/api/v1/orders/*`
- 庫存：`/api/v1/inventories/*`
- 採購：`/api/v1/purchase-orders/*`
- 報表：`/api/v1/reports/*`

完整 API 文件請參考後端專案的 Swagger UI。

## JWT 自動刷新機制

系統實作 JWT Token 自動刷新機制：

1. 在 HTTP 攔截器中檢查 Token 過期時間
2. 若 Token 即將過期（剩餘 5 分鐘），自動調用 refresh API
3. 使用 RxJS BehaviorSubject 管理 Token 狀態
4. 處理並發請求時的 Token 刷新競爭問題

## 響應式設計

| 裝置 | 寬度 | 說明 |
|------|------|------|
| 桌面 | ≥1200px | 完整功能 |
| 平板 | 768px-1199px | 摺疊側邊欄 |
| 手機 | <768px | 底部導航 |

## 後端相依性

確保 fastapi-demo 後端服務已啟動：

```bash
cd ../fastapi-demo
docker-compose up -d
# 或
uvicorn app.main:app --host 0.0.0.0 --port 8002
```

健康檢查：
```bash
curl http://localhost:8002/health
```

## 常見問題

### Q: npm install 失敗？

1. 確認 Node.js 版本 20+
2. 刪除 node_modules 重新安裝：
```bash
rm -rf node_modules package-lock.json
npm install
```

### Q: 開發伺服器啟動失敗？

1. 確認 Port 4200 未被佔用
2. 查看錯誤訊息：`npm start -- --verbose`

### Q: API 請求失敗？

1. 確認後端服務已啟動
2. 確認環境變數 API_URL 設定正確
3. 檢查瀏覽器 Console 的錯誤訊息

### Q: 登入失敗？

1. 確認使用正確的帳號密碼（見測試帳號）
2. 確認後端服務正常運作
3. 清除瀏覽器 localStorage 後重試

### Q: WSL 環境 build 失敗 (esbuild 錯誤)？

這是因為 node_modules 是在 Windows 安裝的，切換到 WSL 後需要重新安裝：
```bash
rm -rf node_modules
npm install
```

### Q: PrimeNG 元件報錯？

本專案使用 PrimeNG 21，API 與舊版差異很大。請參考官方文件：
- https://primeng.org/

## License

MIT License
我一開始以為是Made In Taiwan 咧！(羞
