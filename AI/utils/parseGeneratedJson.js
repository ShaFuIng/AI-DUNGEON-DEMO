function extractJsonObjectText(rawText) {
  const text = String(rawText || "").trim();

  if (!text) {
    throw new Error("Generated response was empty.");
  }

  const fencedMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fencedMatch ? fencedMatch[1].trim() : text;
  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");

  if (start === -1 || end === -1 || end <= start) {
    throw new Error("Generated response did not contain a JSON object.");
  }

  return candidate.slice(start, end + 1);
}

function sanitizeInvalidJsonEscapes(jsonText) {
  return String(jsonText || "").replace(/\\(?!["\\/bfnrt]|u[0-9a-fA-F]{4})/g, "\\\\");
}

function parseGeneratedJson(rawText, label = "generated JSON") {
  const jsonText = extractJsonObjectText(rawText);

  try {
    return JSON.parse(jsonText);
  } catch (originalError) {
    const sanitizedText = sanitizeInvalidJsonEscapes(jsonText);

    try {
      const parsed = JSON.parse(sanitizedText);
      console.warn(`Generated JSON required escape sanitization. label=${label}`);
      return parsed;
    } catch (sanitizedError) {
      const position = getJsonErrorPosition(originalError.message) ?? getJsonErrorPosition(sanitizedError.message);
      const context = getErrorContext(jsonText, position);
      const message = [
        `${label} JSON parse failed`,
        position !== null ? `near position ${position}` : "at unknown position",
        `original error: ${originalError.message}`,
        `sanitized error: ${sanitizedError.message}`,
        `context: ${context}`,
      ].join("; ");

      const error = new Error(message);
      error.code = "GENERATED_JSON_PARSE_FAILED";
      error.label = label;
      error.position = position;
      error.context = context;
      error.originalMessage = originalError.message;
      error.sanitizedMessage = sanitizedError.message;
      throw error;
    }
  }
}

function getJsonErrorPosition(message) {
  const match = String(message || "").match(/position\s+(\d+)/i);
  return match ? Number(match[1]) : null;
}

function getErrorContext(text, position, radius = 150) {
  if (position === null || !Number.isFinite(position)) {
    return String(text || "").slice(0, radius * 2);
  }

  const start = Math.max(0, position - radius);
  const end = Math.min(text.length, position + radius);
  return text.slice(start, end);
}

function formatGeneratedJsonError(error) {
  if (error?.code !== "GENERATED_JSON_PARSE_FAILED") {
    return error?.message || "Generated JSON parse failed.";
  }

  const location = error.position !== null ? `near position ${error.position}` : "at unknown position";
  return `JSON parse failed ${location}: ${error.originalMessage}`;
}

module.exports = {
  extractJsonObjectText,
  sanitizeInvalidJsonEscapes,
  parseGeneratedJson,
  formatGeneratedJsonError,
};
