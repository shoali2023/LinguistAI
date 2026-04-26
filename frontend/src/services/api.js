const API_BASE = "http://localhost:8000/api";

function getHeaders(apiKey, extra = {}) {
  return {
    "X-Gemini-API-Key": apiKey,
    ...extra
  };
}

function normalizeProviderError(message, status, errorType) {
  const raw = String(message || "");
  const lowered = raw.toLowerCase();

  if (errorType === "service_busy" || status === 503 || lowered.includes("503 unavailable") || lowered.includes("'status': 'unavailable'") || lowered.includes("temporarily under high demand")) {
    return {
      message: "Pronunciation analysis is temporarily busy on the AI side. Please wait a moment and try again.",
      errorType: errorType || "service_busy"
    };
  }

  if (errorType === "tts_quota_reached") {
    return { message: raw, errorType };
  }

  return {
    message: raw || "Request failed.",
    errorType
  };
}

async function parseResponse(response) {
  const contentType = response.headers.get("content-type") || "";
  const body = contentType.includes("application/json") ? await response.json() : await response.text();

  if (!response.ok) {
    if (typeof body === "string") {
      const normalized = normalizeProviderError(body, response.status);
      const error = new Error(normalized.message);
      error.providerStatus = response.status;
      error.errorType = normalized.errorType;
      throw error;
    }
    const normalized = normalizeProviderError(body.detail, body.provider_status, body.error_type);
    const error = new Error(normalized.message);
    error.providerStatus = body.provider_status;
    error.errorType = normalized.errorType;
    error.retryAfterSeconds = body.retry_after_seconds;
    throw error;
  }

  return body;
}

export async function validateApiKey(apiKey) {
  const response = await fetch(`${API_BASE}/auth/validate`, {
    method: "GET",
    headers: getHeaders(apiKey)
  });
  return parseResponse(response);
}

export async function requestTTS(apiKey, payload) {
  const response = await fetch(`${API_BASE}/tts`, {
    method: "POST",
    headers: getHeaders(apiKey, { "Content-Type": "application/json" }),
    body: JSON.stringify(payload)
  });
  return parseResponse(response);
}

export async function requestAudioFeedback(apiKey, payload) {
  const response = await fetch(`${API_BASE}/audio-feedback`, {
    method: "POST",
    headers: getHeaders(apiKey, { "Content-Type": "application/json" }),
    body: JSON.stringify(payload)
  });
  return parseResponse(response);
}

export async function requestSTT(apiKey, file, profile) {
  const form = new FormData();
  form.append("file", file);
  if (profile) {
    form.append("profile", JSON.stringify(profile));
  }
  const response = await fetch(`${API_BASE}/stt`, {
    method: "POST",
    headers: getHeaders(apiKey),
    body: form
  });
  return parseResponse(response);
}

export async function requestPracticeSentence(apiKey, profile, scenario) {
  const response = await fetch(`${API_BASE}/practice/generate`, {
    method: "POST",
    headers: getHeaders(apiKey, { "Content-Type": "application/json" }),
    body: JSON.stringify({ profile, scenario })
  });
  return parseResponse(response);
}

export async function requestPracticeSentenceExplanation(apiKey, profile, sentence, scenario) {
  const response = await fetch(`${API_BASE}/practice/explain`, {
    method: "POST",
    headers: getHeaders(apiKey, { "Content-Type": "application/json" }),
    body: JSON.stringify({ profile, sentence, scenario })
  });
  return parseResponse(response);
}

export async function requestPronunciationAnalysis(apiKey, targetText, file) {
  const form = new FormData();
  form.append("target_text", targetText);
  form.append("file", file);
  const response = await fetch(`${API_BASE}/pronunciation/analyze`, {
    method: "POST",
    headers: getHeaders(apiKey),
    body: form
  });
  return parseResponse(response);
}

export async function requestPronunciationAnalysisProfiled(apiKey, targetText, file, profile) {
  const form = new FormData();
  form.append("target_text", targetText);
  form.append("file", file);
  if (profile) {
    form.append("profile", JSON.stringify(profile));
  }
  const response = await fetch(`${API_BASE}/pronunciation/analyze`, {
    method: "POST",
    headers: getHeaders(apiKey),
    body: form
  });
  return parseResponse(response);
}

export async function requestScenarioGenerate(apiKey, profile, scenario) {
  const response = await fetch(`${API_BASE}/scenario/generate`, {
    method: "POST",
    headers: getHeaders(apiKey, { "Content-Type": "application/json" }),
    body: JSON.stringify({ profile, scenario })
  });
  return parseResponse(response);
}

export async function requestEvaluationResults() {
  const response = await fetch(`${API_BASE}/evaluation/results`, {
    method: "GET"
  });
  return parseResponse(response);
}

export async function requestEvaluationRun(apiKey, limit = 3) {
  const response = await fetch(`${API_BASE}/evaluation/run`, {
    method: "POST",
    headers: getHeaders(apiKey, { "Content-Type": "application/json" }),
    body: JSON.stringify({ limit })
  });
  return parseResponse(response);
}

export async function requestTranslationAnalysis(apiKey, payload) {
  const response = await fetch(`${API_BASE}/translation/analyze`, {
    method: "POST",
    headers: getHeaders(apiKey, { "Content-Type": "application/json" }),
    body: JSON.stringify(payload)
  });
  return parseResponse(response);
}

export async function requestPronunciationAnalysisWithRetry(
  apiKey,
  targetText,
  file,
  options = {}
) {
  const {
    attempts = 3,
    profile,
    onRetry = () => {}
  } = options;

  let lastError;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await requestPronunciationAnalysisProfiled(apiKey, targetText, file, profile);
    } catch (error) {
      lastError = error;
      const message = error.message || "";
      const retryable =
        message.includes("503") ||
        message.toLowerCase().includes("temporarily under high demand") ||
        message.toLowerCase().includes("overloaded") ||
        message.toLowerCase().includes("unavailable");

      if (!retryable || attempt === attempts) {
        throw error;
      }

      onRetry({ attempt, attempts, error });
      await new Promise((resolve) => setTimeout(resolve, 1200 * attempt));
    }
  }

  throw lastError;
}
