import type { RecommendedModel } from "./types";

export const AI_ENDPOINT = "https://api.groq.com/openai/v1/chat/completions";
export const AI_PRIMARY_MODEL = "openai/gpt-oss-120b";
export const AI_FAST_MODEL = "openai/gpt-oss-20b";
export const REQUEST_TIMEOUT_MS = 14_000;

export const RECOMMENDED_MODELS: readonly RecommendedModel[] = [
  // Platform / Groq
  {
    contextWindow: 131_072,
    description:
      "Fast and capable open weights model hosted on Groq LPU hardware.",
    id: "openai/gpt-oss-120b",
    isDefault: true,
    name: "GPT-OSS 120B (Groq)",
    provider: "groq",
  },
  {
    contextWindow: 128_000,
    description: "High-intelligence open model with low latency.",
    id: "llama-3.3-70b-versatile",
    name: "Llama 3.3 70B (Groq)",
    provider: "groq",
  },
  {
    contextWindow: 128_000,
    description: "Ultra-fast lightweight evaluation model.",
    id: "llama-3.1-8b-instant",
    name: "Llama 3.1 8B (Groq)",
    provider: "groq",
  },
  // OpenAI
  {
    contextWindow: 128_000,
    description:
      "Flagship omni model from OpenAI with top coding intelligence.",
    id: "gpt-4o",
    name: "GPT-4o",
    provider: "openai",
  },
  {
    contextWindow: 128_000,
    description: "Affordable and fast small model from OpenAI.",
    id: "gpt-4o-mini",
    name: "GPT-4o Mini",
    provider: "openai",
  },
  // Anthropic
  {
    contextWindow: 200_000,
    description: "State-of-the-art coding and debugging model from Anthropic.",
    id: "claude-3-5-sonnet-20241022",
    name: "Claude 3.5 Sonnet",
    provider: "anthropic",
  },
  {
    contextWindow: 200_000,
    description: "High speed, cost-effective reasoning and code analysis.",
    id: "claude-3-5-haiku-20241022",
    name: "Claude 3.5 Haiku",
    provider: "anthropic",
  },
  // Google
  {
    contextWindow: 1_000_000,
    description:
      "Google flagship Flash model engineered for coding and agentic workflows.",
    id: "gemini-3.8-flash",
    name: "Gemini 3.8 Flash",
    provider: "google",
  },
  {
    contextWindow: 2_000_000,
    description: "Google frontier reasoning and advanced coding model.",
    id: "gemini-3-pro-preview",
    name: "Gemini 3 Pro",
    provider: "google",
  },
  {
    contextWindow: 1_000_000,
    description: "Next-gen ultra-fast frontier model with agentic reasoning.",
    id: "gemini-3-flash-preview",
    name: "Gemini 3 Flash",
    provider: "google",
  },
  {
    contextWindow: 1_000_000,
    description:
      "High-performance, cost-efficient model for software engineering.",
    id: "gemini-3.5-flash",
    name: "Gemini 3.5 Flash",
    provider: "google",
  },
  {
    contextWindow: 2_000_000,
    description: "Deep reasoning and STEM problem-solving over large contexts.",
    id: "gemini-2.5-pro",
    name: "Gemini 2.5 Pro",
    provider: "google",
  },
  {
    contextWindow: 1_000_000,
    description:
      "Fast multimodal model balanced for efficiency and intelligence.",
    id: "gemini-2.5-flash",
    name: "Gemini 2.5 Flash",
    provider: "google",
  },
] as const;
