const fs = require("fs/promises");
const path = require("path");

const DEFAULT_COMFY_BASE_URL = "http://127.0.0.1:8188";
const COMFY_STATUS_TIMEOUT_MS = 3000;
const COMFY_PROMPT_TIMEOUT_MS = 10000;
const COMFY_HISTORY_TIMEOUT_MS = 5000;
const COMFY_GENERATION_TIMEOUT_MS = 60000;
const COMFY_POLL_INTERVAL_MS = 1000;
const DEFAULT_PORTRAIT_WIDTH = 512;
const DEFAULT_PORTRAIT_HEIGHT = 768;
const DEFAULT_FILENAME_PREFIX = "character_portrait";
const WORKFLOW_PATH = path.join(
  __dirname,
  "workflows",
  "character_portrait_api.json"
);
const PUBLIC_COMFY_DIR = path.join(
  __dirname,
  "..",
  "..",
  "public",
  "generated",
  "comfy"
);

function getComfyBaseUrl() {
  const configuredUrl = process.env.COMFYUI_BASE_URL?.trim();
  const baseUrl = configuredUrl || DEFAULT_COMFY_BASE_URL;

  return baseUrl.replace(/\/+$/, "");
}

async function checkComfyStatus() {
  const baseUrl = getComfyBaseUrl();

  if (typeof fetch !== "function") {
    return buildFailure(baseUrl, "fetch unavailable");
  }

  const controller =
    typeof AbortController === "function" ? new AbortController() : null;
  const timeout = controller
    ? setTimeout(() => controller.abort(), COMFY_STATUS_TIMEOUT_MS)
    : null;

  try {
    const response = await fetch(`${baseUrl}/system_stats`, {
      signal: controller?.signal,
    });

    if (!response.ok) {
      return buildFailure(baseUrl, `HTTP ${response.status}`);
    }

    const system = await response.json();

    return {
      ok: true,
      baseUrl,
      message: "ComfyUI connected",
      system,
    };
  } catch (error) {
    return buildFailure(baseUrl, getShortError(error));
  } finally {
    if (timeout) {
      clearTimeout(timeout);
    }
  }
}

async function loadCharacterPortraitWorkflow() {
  try {
    const workflowJson = await fs.readFile(WORKFLOW_PATH, "utf8");
    return JSON.parse(workflowJson);
  } catch (error) {
    const isMissing = error?.code === "ENOENT";
    const workflowError = new Error(
      isMissing
        ? "Character portrait workflow not found"
        : "Character portrait workflow is invalid"
    );
    workflowError.code = isMissing
      ? "CHARACTER_PORTRAIT_WORKFLOW_NOT_FOUND"
      : "CHARACTER_PORTRAIT_WORKFLOW_INVALID";
    throw workflowError;
  }
}

async function buildCharacterPortraitWorkflow(options = {}) {
  const workflow = await loadCharacterPortraitWorkflow();
  validateCharacterPortraitWorkflow(workflow);

  const positive = String(options.positive || "").trim();
  if (!positive) {
    const error = new Error("positive prompt is required");
    error.code = "POSITIVE_PROMPT_REQUIRED";
    throw error;
  }

  const width = normalizeDimension(options.width, DEFAULT_PORTRAIT_WIDTH);
  const height = normalizeDimension(options.height, DEFAULT_PORTRAIT_HEIGHT);
  const seed = normalizeSeed(options.seed);
  const filenamePrefix = sanitizeFilenamePrefix(
    options.filenamePrefix || DEFAULT_FILENAME_PREFIX
  );

  const clonedWorkflow = structuredCloneSafe(workflow);

  clonedWorkflow["26:24"].inputs.value = positive;
  if (typeof options.negative === "string" && options.negative.trim()) {
    clonedWorkflow["25:24"].inputs.value = options.negative.trim();
  }
  clonedWorkflow["13"].inputs.width = width;
  clonedWorkflow["13"].inputs.height = height;
  clonedWorkflow["3"].inputs.seed = seed;
  clonedWorkflow["9"].inputs.filename_prefix = filenamePrefix;

  return {
    workflow: clonedWorkflow,
    seed,
    width,
    height,
    filenamePrefix,
  };
}

async function queuePrompt(workflow) {
  const baseUrl = getComfyBaseUrl();
  const response = await fetchJsonWithTimeout(
    `${baseUrl}/prompt`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt: workflow }),
    },
    COMFY_PROMPT_TIMEOUT_MS
  );

  const promptId = response?.prompt_id;
  if (!promptId) {
    const error = new Error("ComfyUI did not return prompt_id");
    error.code = "COMFY_PROMPT_ID_MISSING";
    throw error;
  }

  return promptId;
}

async function waitForPromptResult(promptId) {
  const baseUrl = getComfyBaseUrl();
  const startedAt = Date.now();
  let lastHistory = null;

  while (Date.now() - startedAt < COMFY_GENERATION_TIMEOUT_MS) {
    lastHistory = await fetchJsonWithTimeout(
      `${baseUrl}/history/${encodeURIComponent(promptId)}`,
      {},
      COMFY_HISTORY_TIMEOUT_MS
    );

    const result = lastHistory?.[promptId];
    if (result?.outputs) {
      return result;
    }

    if (result?.status?.status_str === "error") {
      const error = new Error("ComfyUI image generation failed");
      error.code = "COMFY_GENERATION_FAILED";
      throw error;
    }

    if (result?.status?.completed) {
      const error = new Error("Generated image was not found in ComfyUI history");
      error.code = "COMFY_IMAGE_NOT_FOUND";
      throw error;
    }

    await delay(COMFY_POLL_INTERVAL_MS);
  }

  const timeoutError = new Error("ComfyUI generation timed out");
  timeoutError.code = "COMFY_GENERATION_TIMEOUT";
  timeoutError.history = lastHistory;
  throw timeoutError;
}

function extractGeneratedImage(result) {
  const saveImageOutput = result?.outputs?.["9"];
  const image =
    saveImageOutput?.images?.[0] ||
    Object.values(result?.outputs || {})
      .flatMap((output) => output?.images || [])
      .find(Boolean);

  if (!image?.filename) {
    const error = new Error("Generated image was not found in ComfyUI history");
    error.code = "COMFY_IMAGE_NOT_FOUND";
    throw error;
  }

  return {
    filename: image.filename,
    subfolder: image.subfolder || "",
    type: image.type || "output",
  };
}

async function generateCharacterPortrait(options = {}) {
  const { workflow, seed, width, height } =
    await buildCharacterPortraitWorkflow(options);
  const promptId = await queuePrompt(workflow);
  const result = await waitForPromptResult(promptId);
  const image = extractGeneratedImage(result);
  const publicImage = await saveGeneratedImageFromComfy(image);

  return {
    ok: true,
    imageUrl: publicImage.imageUrl,
    filename: publicImage.filename,
    seed,
    width,
    height,
  };
}

function buildFailure(baseUrl, error) {
  return {
    ok: false,
    baseUrl,
    message: "ComfyUI is not reachable",
    error,
  };
}

function validateCharacterPortraitWorkflow(workflow) {
  const requiredNodes = ["26:24", "25:24", "13", "3", "9"];
  const isValid = requiredNodes.every((nodeId) => workflow?.[nodeId]?.inputs);

  if (!isValid) {
    const error = new Error("Character portrait workflow is invalid");
    error.code = "CHARACTER_PORTRAIT_WORKFLOW_INVALID";
    throw error;
  }
}

async function saveGeneratedImageFromComfy(image) {
  const baseUrl = getComfyBaseUrl();
  const params = new URLSearchParams({
    filename: image.filename,
    subfolder: image.subfolder || "",
    type: image.type || "output",
  });
  const response = await fetchWithTimeout(
    `${baseUrl}/view?${params.toString()}`,
    {},
    COMFY_PROMPT_TIMEOUT_MS
  );

  if (!response.ok) {
    const error = new Error(`ComfyUI image view failed: HTTP ${response.status}`);
    error.code = "COMFY_IMAGE_VIEW_FAILED";
    throw error;
  }

  const imageBuffer = Buffer.from(await response.arrayBuffer());
  const filename = path.basename(image.filename);
  const outputPath = path.join(PUBLIC_COMFY_DIR, filename);

  await fs.mkdir(PUBLIC_COMFY_DIR, { recursive: true });
  await fs.writeFile(outputPath, imageBuffer);

  return {
    filename,
    imageUrl: `/generated/comfy/${encodeURIComponent(filename)}`,
  };
}

function structuredCloneSafe(value) {
  return JSON.parse(JSON.stringify(value));
}

function normalizeDimension(value, fallback) {
  const number = Number(value);
  if (!Number.isFinite(number) || number <= 0) {
    return fallback;
  }

  return Math.max(64, Math.min(2048, Math.round(number)));
}

function normalizeSeed(value) {
  const number = Number(value);
  if (Number.isFinite(number) && number >= 0) {
    return Math.floor(number);
  }

  return Math.floor(Math.random() * 1000000000000000);
}

function sanitizeFilenamePrefix(value) {
  const prefix = String(value || DEFAULT_FILENAME_PREFIX)
    .trim()
    .replace(/[^a-zA-Z0-9_-]+/g, "_")
    .replace(/^_+|_+$/g, "");

  return prefix || DEFAULT_FILENAME_PREFIX;
}

async function fetchJsonWithTimeout(url, options, timeoutMs) {
  const response = await fetchWithTimeout(url, options, timeoutMs);

  if (!response.ok) {
    const error = new Error(`ComfyUI request failed: HTTP ${response.status}`);
    error.code = "COMFY_REQUEST_FAILED";
    throw error;
  }

  return response.json();
}

async function fetchWithTimeout(url, options = {}, timeoutMs = 5000) {
  if (typeof fetch !== "function") {
    const error = new Error("fetch unavailable");
    error.code = "FETCH_UNAVAILABLE";
    throw error;
  }

  const controller =
    typeof AbortController === "function" ? new AbortController() : null;
  const timeout = controller
    ? setTimeout(() => controller.abort(), timeoutMs)
    : null;

  try {
    return await fetch(url, {
      ...options,
      signal: controller?.signal,
    });
  } catch (error) {
    if (error?.name === "AbortError") {
      const timeoutError = new Error("timeout");
      timeoutError.code = "TIMEOUT";
      throw timeoutError;
    }

    throw error;
  } finally {
    if (timeout) {
      clearTimeout(timeout);
    }
  }
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getShortError(error) {
  if (error?.name === "AbortError") {
    return "timeout";
  }

  const shortMessage =
    error?.cause?.code ||
    error?.code ||
    error?.message ||
    "fetch failed";

  return String(shortMessage).slice(0, 80);
}

module.exports = {
  getComfyBaseUrl,
  checkComfyStatus,
  loadCharacterPortraitWorkflow,
  buildCharacterPortraitWorkflow,
  queuePrompt,
  waitForPromptResult,
  extractGeneratedImage,
  generateCharacterPortrait,
};
