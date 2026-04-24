import { useEffect, useState } from "react";

import { validateApiKey } from "../services/api";

const STORAGE_KEY = "linguistai_gemini_api_key";
const STATUS_KEY = "linguistai_gemini_api_key_status";
const MESSAGE_KEY = "linguistai_gemini_api_key_message";

export function useSessionApiKey() {
  throw new Error("useSessionApiKey is provided by ApiKeyProvider.");
}

export function useSessionApiKeyState() {
  const [apiKey, setApiKey] = useState(() => sessionStorage.getItem(STORAGE_KEY) || "");
  const [status, setStatus] = useState(() => sessionStorage.getItem(STATUS_KEY) || "idle");
  const [message, setMessage] = useState(() => sessionStorage.getItem(MESSAGE_KEY) || "No Gemini API key loaded.");

  useEffect(() => {
    if (apiKey) {
      sessionStorage.setItem(STORAGE_KEY, apiKey);
    } else {
      sessionStorage.removeItem(STORAGE_KEY);
      sessionStorage.setItem(STATUS_KEY, "idle");
      sessionStorage.setItem(MESSAGE_KEY, "No Gemini API key loaded.");
      setStatus("idle");
      setMessage("No Gemini API key loaded.");
    }
  }, [apiKey]);

  useEffect(() => {
    if (!apiKey || apiKey.trim().length < 20) {
      return undefined;
    }

    setStatus("checking");
    setMessage("Checking Gemini API key...");

    const timeout = setTimeout(async () => {
      try {
        const result = await validateApiKey(apiKey.trim());
        setStatus(result.status || "approved");
        setMessage(result.message || "Gemini API key approved.");
        sessionStorage.setItem(STATUS_KEY, result.status || "approved");
        sessionStorage.setItem(MESSAGE_KEY, result.message || "Gemini API key approved.");
      } catch (error) {
        const nextMessage = error.message || "Gemini API key validation failed.";
        setStatus("invalid");
        setMessage(nextMessage);
        sessionStorage.setItem(STATUS_KEY, "invalid");
        sessionStorage.setItem(MESSAGE_KEY, nextMessage);
      }
    }, 700);

    return () => clearTimeout(timeout);
  }, [apiKey]);

  return {
    apiKey,
    setApiKey,
    apiKeyStatus: status,
    apiKeyMessage: message
  };
}
