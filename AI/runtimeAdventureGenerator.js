const { buildRuntimeAdventurePrompt } = require("./prompts/buildRuntimeAdventurePrompt");
const { generateRuntimeJson } = require("./runtimeProviders/geminiRuntimeProvider");
const { validateRuntimeGameData } = require("./validators/validateRuntimeGameData");

async function generateRuntimeAdventure(input = {}) {
  const prompt = buildRuntimeAdventurePrompt(input);
  const rawText = await generateRuntimeJson({
    apiKey: input.apiKey,
    model: input.model,
    prompt,
  });
  const gameData = parseJsonObject(rawText);
  const validation = validateRuntimeGameData(gameData);

  if (!validation.ok) {
    throw new Error(`Generated adventure failed validation: ${validation.errors.join("; ")}`);
  }

  return {
    gameData,
    generationSummary: buildGenerationSummary(gameData, input),
  };
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
