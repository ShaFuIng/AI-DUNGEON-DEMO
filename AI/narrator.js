function getStylePrompt() {
  return [
    "你是一位地下遺跡文字冒險遊戲的旁白生成器。",
    "請使用繁體中文。",
    "你的任務只有一個：把程式給你的事件結果改寫成 2 到 4 句有氣氛的遊戲旁白。",
    "不要輸出思考過程。",
    "不要說明你如何理解規則。",
    "不要使用「首先、接著、因此、我需要、使用者要求」這類分析語氣。",
    "不要輸出 JSON。",
    "不要輸出條列式清單。",
    "不要列出可用指令。",
    "不要照抄原文。",
    "不能改變玩家 HP、MP、背包、位置或怪物血量。",
    "不能新增不存在的道具、敵人或房間。",
    "不能替玩家決定下一步行動。",
    "只輸出最終遊戲旁白文字。",
  ].join("\n");
}

async function narrate(gameState, eventResult) {
  const provider = (process.env.AI_PROVIDER || "mock").toLowerCase();
    console.log("Narrator provider =", provider);

  try {
    if (provider === "mock") {
      return mockNarrator(gameState, eventResult);
    }

    if (provider === "ollama") {
      return await ollamaNarrator(gameState, eventResult);
    }

    if (provider === "gemini") {
      return fallbackNarration(eventResult);
    }

    return fallbackNarration(eventResult);
    } catch (error) {
    console.error("Narrator error:", error.message);
    return "[FALLBACK：Ollama 呼叫失敗]\n" + fallbackNarration(eventResult);
    }
}

async function ollamaNarrator(gameState, eventResult) {
  const ollamaUrl = process.env.OLLAMA_URL || "http://localhost:11434";
  const model = process.env.OLLAMA_MODEL || "qwen3:4b";

  const prompt = buildNarrationPrompt(gameState, eventResult);

  console.log("Prompt sent to Ollama:\n", prompt);

  const response = await fetch(`${ollamaUrl}/api/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
        messages: [
        {
            role: "system",
            content: getStylePrompt(),
        },
        {
            role: "user",
            content: prompt,
        },
        ],
        stream: false,
        think: false,
        options: {
        temperature: 0.8,
        num_predict: 160,
        },
    }),
  });

  if (!response.ok) {
    throw new Error(`Ollama API error: ${response.status}`);
  }

  const data = await response.json();

  console.log("Full Ollama data:\n", data);

  const text = data.message?.content?.trim();

  console.log("Ollama response:\n", text);

  if (!text) {
    return "[FALLBACK：Ollama 沒有回傳文字]\n" + fallbackNarration(eventResult);
  }

    const cleaned = cleanNarration(text);

  if (!cleaned) {
    return "[FALLBACK：Ollama 回覆內容被清理後為空]\n" + fallbackNarration(eventResult);
  }
  return cleaned;
}

function buildNarrationPrompt(gameState, eventResult) {
  const inventory =
    gameState.player.inventory.length > 0
      ? gameState.player.inventory.join("、")
      : "空";

  const itemText =
    gameState.currentRoom.items && gameState.currentRoom.items.length > 0
      ? gameState.currentRoom.items.join("、")
      : "無";

  const monsterText = gameState.currentRoom.monster
    ? `${gameState.currentRoom.monster.name}，HP ${gameState.currentRoom.monster.hp}/${gameState.currentRoom.monster.maxHp}`
    : "無";

  const shortEvent = summarizeEventForAI(eventResult);

  return [
    "/no_think",
    "",
    "請直接輸出最終旁白，不要輸出思考過程。",
    "",
    "【玩家狀態】",
    `HP：${gameState.player.hp}/${gameState.player.maxHp}`,
    `MP：${gameState.player.mp}/${gameState.player.maxMp}`,
    `位置：${gameState.player.currentRoom}`,
    `背包：${inventory}`,
    "",
    "【目前房間資訊】",
    `房間名稱：${gameState.currentRoom.name}`,
    `房間描述：${gameState.currentRoom.description}`,
    `可見道具：${itemText}`,
    `目前敵人：${monsterText}`,
    "",
    "【這次事件】",
    shortEvent,
    "",
    "請把上面的事件改寫成 2 到 4 句繁體中文地下遺跡冒險旁白。",
    "不要列出可用行動。",
    "不要重複原文。",
    "不要分析規則。",
    "只輸出旁白。",
  ].join("\n");
}

function summarizeEventForAI(eventResult) {
  const message = eventResult.message || "";

  if (eventResult.type === "look") {
    return "玩家觀察目前所在房間。";
  }

  if (eventResult.type === "move") {
    return "玩家移動到新的房間。";
  }

  if (eventResult.type === "take") {
    return message.split("\n")[0];
  }

  if (eventResult.type === "attack" || eventResult.type === "monster_defeated") {
    return message;
  }

  if (eventResult.type === "guard") {
    return message;
  }

  if (eventResult.type === "use_item") {
    return message;
  }

  if (eventResult.type === "game_won") {
    return message;
  }

  return message
    .split("\n")
    .filter((line) => !line.includes("可用行動"))
    .filter((line) => !line.trim().startsWith("-"))
    .join("\n");
}

function cleanNarration(text) {
  let cleaned = text
    .replace(/<think>[\s\S]*?<\/think>/g, "")
    .replace(/```[\s\S]*?```/g, "")
    .replace(/^(旁白|Narration|AI Narrator)[:：]/i, "")
    .trim();

  const badStarters = [
    "首先",
    "用户要求",
    "使用者要求",
    "我需要",
    "我应该",
    "我應該",
    "根据规则",
    "根據規則",
    "目前玩家狀態",
    "目前房間",
    "程式計算出的事件結果",
  ];

  const lines = cleaned
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  const filteredLines = lines.filter((line) => {
    return !badStarters.some((starter) => line.startsWith(starter));
  });

  cleaned = filteredLines.join("\n").trim();

  if (!cleaned) {
    return "";
  }

  return cleaned;
}

function mockNarrator(gameState, eventResult) {
  const roomName = gameState.player.currentRoom;
  const baseMessage = eventResult.message;

  switch (eventResult.type) {
    case "look":
      return [
        "你停下腳步，讓眼睛慢慢適應遺跡中的幽暗光線。",
        baseMessage,
        "空氣裡傳來細微的回音，像是這座遺跡仍在等待你的選擇。",
      ].join("\n");

    case "move":
      return [
        `你踏入${roomName}，腳步聲在石牆之間來回震盪。`,
        baseMessage,
        "前方的黑暗沒有回答，只留下更多未知的道路。",
      ].join("\n");

    case "take":
      return [
        "你伸手撿起眼前的物品，冰冷的觸感讓你更加清醒。",
        baseMessage,
        "這個道具也許會在接下來的探索中派上用場。",
      ].join("\n");

    case "attack":
    case "monster_defeated":
      return [
        "戰鬥的聲響在遺跡中炸開，塵土從天花板緩緩落下。",
        baseMessage,
        "你握緊武器，確認自己仍然站著。",
      ].join("\n");

    case "guard":
      return [
        "你壓低身體，將注意力集中在敵人的動作上。",
        baseMessage,
        "下一次衝擊到來時，你已經做好準備。",
      ].join("\n");

    case "use_item":
      return [
        "你迅速翻找背包，取出能救急的補給。",
        baseMessage,
        "短暫的喘息讓你重新穩住了呼吸。",
      ].join("\n");

    case "game_won":
      return [
        "當你回到入口時，遺跡深處的低鳴聲逐漸遠去。",
        baseMessage,
        "這趟冒險結束了，但古代核心的秘密或許才剛開始。",
      ].join("\n");

    case "game_ended":
    case "game_over":
      return [
        "遺跡中的黑暗慢慢吞沒了你的視線。",
        baseMessage,
        "這次探險失敗了，但你仍可以重新開始。",
      ].join("\n");

    case "help":
    case "status":
    case "log":
      return baseMessage;

    default:
      return fallbackNarration(eventResult);
  }
}

function fallbackNarration(eventResult) {
  return eventResult.message || "事件已發生，但敘事系統暫時無法產生描述。";
}

module.exports = {
  narrate,
  getStylePrompt,
};