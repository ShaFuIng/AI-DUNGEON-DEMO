require("dotenv").config();

const express = require("express");
const path = require("path");
const { getGameDataSource, loadGameData } = require("./data/loadGameData");
const defaultGameData = loadGameData();
const {
  createInitialGameState,
  getPublicGameState,
  handleCommand,
  getRuntimeGameData,
  setRuntimeGameData,
} = require("./engine/gameEngine");
const { narrate } = require("./AI/narrator");
const { generateCharacterPreview } = require("./AI/characterPreviewGenerator");
const { buildAdventurePreview, generateRuntimeAdventure } = require("./AI/runtimeAdventureGenerator");
const { formatGeneratedJsonError } = require("./AI/utils/parseGeneratedJson");

const app = express();
const PORT = 3000;

let currentGameData = defaultGameData;
setRuntimeGameData(currentGameData);

// 建立目前遊戲狀態（文字冒險 demo 的核心 state）
let gameState = createInitialGameState(currentGameData);

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
    runtimeGameData: currentGameData === defaultGameData ? "default" : "generated",
  });
});

// 取得遊戲資料 API
app.get("/api/game-data", (req, res) => {
  res.json(getRuntimeGameData());
});

// 取得目前遊戲公開狀態
app.get("/api/state", (req, res) => {
  res.json(getPublicGameState(gameState));
});

app.post("/api/character/preview", async (req, res) => {
  try {
    const {
      apiKey,
      model = "gemini-2.5-flash-lite",
      genre = "奇幻遺跡",
      characterPrompt = "",
      difficulty = 4,
    } = req.body || {};

    const character = await generateCharacterPreview({
      apiKey,
      model,
      genre,
      characterPrompt,
      difficulty,
    });

    res.json({ character });
  } catch (error) {
    console.error("Character preview generation failed:", error.message);
    res.status(422).json({
      error: "character_preview_failed",
      message: "角色預覽生成失敗，請調整角色設定或稍後再試。",
      details: getPublicErrorDetails(error),
    });
  }
});

app.post("/api/adventure/preview", async (req, res) => {
  try {
    const {
      apiKey,
      model = "gemini-2.5-flash-lite",
      genre = "奇幻遺跡",
      characterPrompt = "",
      adventurePrompt = "",
      roomCount = 5,
      difficulty = 4,
      confirmedCharacter = null,
    } = req.body || {};

    const { gameData: previewGameData, generationSummary } =
      await generateRuntimeAdventure({
        apiKey,
        model,
        genre,
        characterPrompt,
        adventurePrompt,
        roomCount,
        difficulty,
        confirmedCharacter,
        label: "adventure preview",
      });
    const previewState = createInitialGameState(previewGameData);
    const publicPreviewState = getPublicGameState(previewState);
    currentGameData = previewGameData;
    setRuntimeGameData(currentGameData);
    gameState = previewState;

    res.json({
      state: publicPreviewState,
      gameData: previewGameData,
      generationSummary,
      preview: buildAdventurePreview(previewGameData, generationSummary),
    });
  } catch (error) {
    console.error("Adventure preview generation failed:", error.message);
    setRuntimeGameData(currentGameData);
    res.status(422).json({
      error: "adventure_preview_failed",
      message: "冒險預覽生成失敗，請調整 prompt 或稍後再試。",
      details: getPublicErrorDetails(error),
    });
  }
});

app.post("/api/adventure/generate", async (req, res) => {
  try {
    const {
      apiKey,
      model = "gemini-2.5-flash-lite",
      genre = "奇幻遺跡",
      characterPrompt = "",
      adventurePrompt = "",
      roomCount = 5,
      difficulty = 4,
      confirmedCharacter = null,
    } = req.body || {};

    const { gameData: generatedGameData, generationSummary } =
      await generateRuntimeAdventure({
        apiKey,
        model,
        genre,
        characterPrompt,
        adventurePrompt,
        roomCount,
        difficulty,
        confirmedCharacter,
        label: "runtime adventure",
      });

    currentGameData = generatedGameData;
    setRuntimeGameData(currentGameData);
    gameState = createInitialGameState(currentGameData);

    res.json({
      state: getPublicGameState(gameState),
      gameData: currentGameData,
      generationSummary,
    });
  } catch (error) {
    console.error("Runtime adventure generation failed:", error.message);
    currentGameData = defaultGameData;
    setRuntimeGameData(currentGameData);
    gameState = createInitialGameState(currentGameData);

    res.status(422).json({
      error: "generation_failed",
      message: "冒險生成失敗，已保留預設 Demo。",
      details: getPublicErrorDetails(error),
      state: getPublicGameState(gameState),
      gameData: currentGameData,
    });
  }
});

async function handleCommandRequest(req, res) {
  const command = req.body.command || "";

  const eventResult = handleCommand(gameState, command);

  if (eventResult.type === "reset") {
    gameState = createInitialGameState(currentGameData);
  }

  const publicState = getPublicGameState(gameState);
  const narration = await narrate(publicState, eventResult);

  res.json({
    eventResult,
    narration,
    state: publicState,
  });
}

// 執行玩家指令
app.post("/api/game/command", handleCommandRequest);

// 重置遊戲狀態
app.post("/api/reset", (req, res) => {
  const useDefault = req.body?.mode === "default";

  if (useDefault) {
    currentGameData = defaultGameData;
    setRuntimeGameData(currentGameData);
  }

  gameState = createInitialGameState(currentGameData);
  res.json(getPublicGameState(gameState));
});

function getPublicErrorDetails(error) {
  if (error?.code === "GENERATED_JSON_PARSE_FAILED") {
    return formatGeneratedJsonError(error);
  }

  return error?.message || "Unknown error.";
}

// 啟動伺服器
app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});
