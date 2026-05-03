require("dotenv").config();

const express = require("express");
const path = require("path");
const { getGameDataSource, loadGameData } = require("./data/loadGameData");
const gameData = loadGameData();
const {
  createInitialGameState,
  getPublicGameState,
  handleCommand,
} = require("./engine/gameEngine");
const { narrate } = require("./AI/narrator");

const app = express();
const PORT = 3000;

// 建立目前遊戲狀態（文字冒險 demo 的核心 state）
let gameState = createInitialGameState();

// 啟用 Express 內建 JSON body parser
app.use(express.json());

// 提供 public 資料夾中的前端靜態檔案
app.use(express.static(path.join(__dirname, "public")));

// 健康檢查 API
app.get("/api/health", (req, res) => {
  res.json({
    ok: true,
    message: "AI Dungeon Demo server is running!",
    aiProvider: process.env.AI_PROVIDER || "mock",
    gameDataSource: getGameDataSource(),
  });
});

// 取得遊戲資料 API
app.get("/api/game-data", (req, res) => {
  res.json(gameData);
});

// 取得目前遊戲公開狀態
app.get("/api/state", (req, res) => {
  res.json(getPublicGameState(gameState));
});

// 執行玩家指令
app.post("/api/command", async (req, res) => {
  const command = req.body.command || "";

  const eventResult = handleCommand(gameState, command);

  if (eventResult.type === "reset") {
    gameState = createInitialGameState();
  }

  const publicState = getPublicGameState(gameState);
  const narration = await narrate(publicState, eventResult);

  res.json({
    eventResult,
    narration,
    state: publicState,
  });
});

// 重置遊戲狀態
app.post("/api/reset", (req, res) => {
  gameState = createInitialGameState();
  res.json(getPublicGameState(gameState));
});

// 啟動伺服器
app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});
