require("dotenv").config();

const express = require("express");
const path = require("path");
const gameData = require("./data/gameData");
const {
  createInitialGameState,
  getPublicGameState,
  handleCommand,
} = require("./engine/gameEngine");
const { narrate } = require("./AI/narrator");

const app = express();
const PORT = 3000;

// 目前先用單人 demo，所以只存一份遊戲狀態在記憶體中
let gameState = createInitialGameState();

// 讓 Express 可以讀取 JSON 格式的請求
app.use(express.json());

// 讓 Express 可以讀取 public 資料夾裡的靜態檔案
app.use(express.static(path.join(__dirname, "public")));

// 測試用 API
app.get("/api/health", (req, res) => {
  res.json({
    ok: true,
    message: "AI Dungeon Demo server is running!",
    aiProvider: process.env.AI_PROVIDER || "mock",
  });
});

// 遊戲資料 API
app.get("/api/game-data", (req, res) => {
  res.json(gameData);
});

// 取得目前遊戲狀態
app.get("/api/state", (req, res) => {
  res.json(getPublicGameState(gameState));
});

// 處理玩家指令
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