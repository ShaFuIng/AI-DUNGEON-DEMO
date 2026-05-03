const { spawnSync } = require('child_process');

function buildPrompt(input = {}) {
  const theme = input.theme || '冰封遺跡';
  const difficulty = input.difficulty || 5;
  const roomCount = input.roomCount || 4;

  return [
    '你是 Content Designer Agent。',
    '請根據 input 產生 generatedArea JSON。',
    '使用繁體中文 name / description。',
    'id 必須 snake_case。',
    'exits 只能 north / south / east / west。',
    'exits 必須雙向一致。',
    '所有房間必須可從第一個房間抵達。',
    'items 只能使用：torch, rusty_key, small_potion, ancient_core。',
    'monster 只能使用：skeleton_guard, ruin_guardian 或 null。',
    'root 必須包含：id, name, theme, narrativeHook, difficulty, rooms。',
    'room 必須包含：id, name, description, exits, items, monster。',
    `difficulty 使用 ${difficulty}。`,
    `roomCount 使用 ${roomCount}。`,
    `theme 使用 ${theme}。`,
    '只輸出 JSON object。',
    '不要 markdown code block。',
    '不要前後解釋。'
  ].join('\n');
}

function generateRawArea(input = {}) {
  const apiKey = process.env.GEMINI_API_KEY;
  const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash-lite';

  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is required for gemini provider.');
  }

  const prompt = buildPrompt(input);
  const workerScript = `
const apiKey = process.env.GEMINI_API_KEY;
const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash-lite';
const prompt = process.env.GEMINI_PROMPT || '';
const url = 'https://generativelanguage.googleapis.com/v1beta/models/' + encodeURIComponent(model) + ':generateContent?key=' + encodeURIComponent(apiKey);

try {
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      contents: [
        {
          role: 'user',
          parts: [{ text: prompt }]
        }
      ],
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 2048
      }
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error('Gemini API request failed: ' + response.status + ' ' + errorText);
  }

  const data = await response.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;

  if (typeof text !== 'string') {
    throw new Error('Gemini API response did not include text output.');
  }

  process.stdout.write(text.trim());
} catch (error) {
  const message = error && error.message ? error.message : String(error);
  process.stderr.write(message);
  process.exit(1);
}
`;

  const result = spawnSync(process.execPath, ['--input-type=module', '--eval', workerScript], {
    encoding: 'utf8',
    maxBuffer: 10 * 1024 * 1024,
    env: {
      ...process.env,
      GEMINI_API_KEY: apiKey,
      GEMINI_MODEL: model,
      GEMINI_PROMPT: prompt
    }
  });

  if (result.status !== 0) {
    const errorMessage = (result.stderr || result.stdout || '').trim();
    throw new Error(errorMessage || 'Gemini API request failed: unknown error');
  }

  return (result.stdout || '').trim();
}

module.exports = {
  generateRawArea
};
