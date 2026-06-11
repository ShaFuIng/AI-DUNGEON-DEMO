const DEFAULT_COMFY_BASE_URL = "http://127.0.0.1:8188";
const COMFY_STATUS_TIMEOUT_MS = 3000;

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

function buildFailure(baseUrl, error) {
  return {
    ok: false,
    baseUrl,
    message: "ComfyUI is not reachable",
    error,
  };
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
};
