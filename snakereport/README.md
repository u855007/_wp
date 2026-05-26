# 🐍 AI 輔助貪吃蛇遊戲學習專案

這是一個綜合性網頁遊戲學習專案，結合 Node.js 後端、HTML5 Canvas 遊戲開發和 AI 輔助程式開發工具。

## 🏗️ 專案架構

```
peter_wp/
├── server-node/          # Node.js + Express 後端（遊戲 API）
├── snake-game/           # 貪吃蛇遊戲（HTML5 Canvas）
├── server-fastapi/        # FastAPI (Python) 後端
├── search-engine-rust/   # Rust 搜尋引擎核心
├── web-frontend/         # Next.js 前端
├── docs/                 # 報告和學習筆記
└── README.md
```

## 🛠️ 技術棧

| 層 | 技術 | 用途 |
|---|------|------|
| 遊戲前端 | HTML5 Canvas + JavaScript | 遊戲渲染與邏輯 |
| 後端 API | Node.js + Express | 遊戲排行榜 API |
| AI 輔助 | ChatGPT / Claude | 程式開發輔助 |
| 可選擴展 | FastAPI / Rust / Next.js | 進階學習 |

## 🚀 快速開始（貪吃蛇遊戲）

```bash
# 1. 啟動 Node.js 後端
cd server-node && npm install
npm run dev

# 2. 開啟遊戲
# 直接用瀏覽器打開 snake-game/index.html
# 或訪問 http://localhost:4000/snake-game/index.html
```

## 🎮 遊戲操作

| 按鍵 | 功能 |
|-----|------|
| ↑ / W | 向上移動 |
| ↓ / S | 向下移動 |
| ← / A | 向左移動 |
| → / D | 向右移動 |
| 空格 | 暫停/繼續 |

## 🤖 AI 輔助工具

本專案使用以下 AI 工具輔助開發：

| AI 工具 | 功能 |
|--------|------|
| **ChatGPT** | 程式碼生成、除錯輔助 |
| **Claude** | 程式碼審查、優化建議 |

### AI 輔助使用技巧

1. **清楚描述需求**：指定技術棧、功能需求
2. **驗證程式碼**：理解每行程式碼用途
3. **持續學習**：比較 AI 方案與自己的想法

## 📚 學習目標

- [x] 掌握 Node.js REST API 開發
- [x] 學習 HTML5 Canvas 遊戲開發
- [x] 使用 AI 輔助程式開發
- [ ] 學習 FastAPI 和 Python 异步编程
- [ ] 理解 Rust 性能和内存管理
- [ ] 實踐 Next.js 全端開發

## 📝 AI 功能說明

本專案使用的 AI 工具：

### AI 輔助開發
- ChatGPT: 程式碼生成、除錯輔助
- Claude: 程式碼審查、優化建議

### AI 提問技巧

```markdown
# 好的提問
"請用 HTML5 Canvas 寫貪吃蛇遊戲：
- 20x20 網格
- 方向鍵控制
- 等級和速度系統
- 請註解說明"
```

## 📄 報告和筆記

參考 `docs/` 目錄:
- `docs/技術報告.md` - 詳細技術架構說明（含 AI 工具應用）
- `docs/學習筆記.md` - 學習心得和踩坑記錄
- `docs/API文檔.md` - API 接口文檔

## 🔗 API 端口

| 服務 | 端口 | 路徑 |
|------|------|------|
| Next.js | 3000 | http://localhost:3000 |
| Node.js | 4000 | http://localhost:4000/api |
| FastAPI | 8000 | http://localhost:8000 |

## 📚 學習資源

- Node.js: https://nodejs.org/docs/
- FastAPI: https://fastapi.tiangolo.com/
- Rust: https://doc.rust-lang.org/
- Next.js: https://nextjs.org/docs
- OpenAI: https://platform.openai.com/docs

## License

MIT