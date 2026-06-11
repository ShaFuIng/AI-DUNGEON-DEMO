async function generateRuntimeJson({ apiKey, model, prompt }) {
  if (!apiKey) {
    throw new Error("Gemini API key is required.");
  }

  if (typeof fetch !== "function") {
    throw new Error("Global fetch is not available in this Node.js runtime.");
  }

  const selectedModel = model || "gemini-2.5-flash-lite";
  const url =
    "https://generativelanguage.googleapis.com/v1beta/models/" +
    encodeURIComponent(selectedModel) +
    ":generateContent?key=" +
    encodeURIComponent(apiKey);

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      contents: [
        {
          role: "user",
          parts: [{ text: prompt }],
        },
      ],
      generationConfig: {
        temperature: 0.55,
        maxOutputTokens: 8192,
        responseMimeType: "application/json",
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`Gemini API request failed: ${response.status}`);
  }

  const data = await response.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;

  if (typeof text !== "string" || !text.trim()) {
    throw new Error("Gemini API response did not include JSON text.");
  }

  return text.trim();
}

module.exports = {
  generateRuntimeJson,
};
