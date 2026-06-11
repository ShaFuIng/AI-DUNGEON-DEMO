const { buildRuntimeAdventurePrompt } = require("./prompts/buildRuntimeAdventurePrompt");
const { balanceRuntimeAdventure } = require("./balancers/balanceRuntimeAdventure");
const { normalizeRuntimeGameData } = require("./normalizers/normalizeRuntimeGameData");
const { generateRuntimeJson } = require("./runtimeProviders/geminiRuntimeProvider");
const { validateRuntimeGameData } = require("./validators/validateRuntimeGameData");

async function generateRuntimeAdventure(input = {}) {
  const prompt = buildRuntimeAdventurePrompt(input);
  const rawText = await generateRuntimeJson({
    apiKey: input.apiKey,
    model: input.model,
    prompt,
  });
  const parsedGameData = parseJsonObject(rawText);
  console.log("Runtime adventure raw summary:", summarizeGameDataShape(parsedGameData));
  const normalizedGameData = normalizeRuntimeGameData(parsedGameData);
  console.log("Runtime adventure normalized summary:", summarizeGameDataShape(normalizedGameData));
  const gameData = balanceRuntimeAdventure(normalizedGameData, input);
  console.log("Runtime adventure balanced summary:", summarizeGameDataShape(gameData));
  const validation = validateRuntimeGameData(gameData);

  if (!validation.ok) {
    console.error("Runtime adventure validation errors:", validation.errors.join("; "));
    throw new Error(`Generated adventure failed validation: ${validation.errors.join("; ")}`);
  }

  return {
    gameData,
    generationSummary: buildGenerationSummary(gameData, input),
  };
}

function summarizeGameDataShape(gameData) {
  return {
    rooms: summarizeCollection(gameData?.rooms),
    items: summarizeCollection(gameData?.items),
    monsters: summarizeCollection(gameData?.monsters),
    skills: summarizeCollection(gameData?.skills),
    playerSkills: Array.isArray(gameData?.player?.skills)
      ? gameData.player.skills.length
      : typeof gameData?.player?.skills,
    initialRoomId: gameData?.initialRoomId,
    requiredItemId: gameData?.winCondition?.requiredItemId,
  };
}

function summarizeCollection(value) {
  if (Array.isArray(value)) {
    return { type: "array", count: value.length };
  }

  if (value && typeof value === "object") {
    return { type: "object", count: Object.keys(value).length };
  }

  return { type: typeof value, count: 0 };
}

function parseJsonObject(text) {
  const trimmed = String(text || "").trim();
  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");

  if (start === -1 || end === -1 || end <= start) {
    throw new Error("Generated response did not contain a JSON object.");
  }

  return JSON.parse(trimmed.slice(start, end + 1));
}

function buildGenerationSummary(gameData, input) {
  const roomCount = Object.keys(gameData.rooms || {}).length;
  const monsterCount = Object.keys(gameData.monsters || {}).length;
  const skillCount = Object.keys(gameData.skills || {}).length;

  return [
    `${input.genre || "自訂"}冒險已生成。`,
    `房間 ${roomCount} 間，怪物 ${monsterCount} 種，技能 ${skillCount} 個。`,
  ].join(" ");
}

module.exports = {
  generateRuntimeAdventure,
};
