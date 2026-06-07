/**
 * LLM client config — OpenAI-compatible LM Studio endpoint.
 *
 * Server A (default) is ~3.8x faster than the ai.softfact.com fallback.
 * Values come from VITE_LLM_* env vars (see .env.example / .env.local).
 *
 * SECURITY: VITE_* values are inlined into the client bundle, so the token
 * is visible to anyone loading the app. For production, proxy these calls
 * through the 4D backend (which holds the token server-side) rather than
 * exposing VITE_LLM_TOKEN. This module is intended for trusted/internal use.
 */

export interface LlmEndpoint {
  baseUrl: string
  token: string
}

export const llmConfig = {
  /** Default/primary endpoint (Server A). */
  primary: {
    baseUrl: import.meta.env.VITE_LLM_BASE_URL ?? 'http://212.186.251.28:1234/v1',
    token: import.meta.env.VITE_LLM_TOKEN ?? '',
  } satisfies LlmEndpoint,
  /** Fallback endpoint (Server B, ai.softfact.com). */
  fallback: {
    baseUrl: import.meta.env.VITE_LLM_FALLBACK_BASE_URL ?? 'https://ai.softfact.com/v1',
    token: import.meta.env.VITE_LLM_FALLBACK_TOKEN ?? '',
  } satisfies LlmEndpoint,
  chatModel: import.meta.env.VITE_LLM_MODEL ?? 'google/gemma-4-e4b',
  embeddingModel:
    import.meta.env.VITE_LLM_EMBEDDING_MODEL ?? 'text-embedding-nomic-embed-text-v1.5',
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

/**
 * Minimal chat-completion call against the LLM endpoint (default: Server A).
 * gemma-4-e4b is a reasoning model — keep maxTokens high (>=512) or the budget
 * is spent on reasoning and the returned content can be empty.
 */
export async function llmChat(
  messages: ChatMessage[],
  options: { endpoint?: LlmEndpoint; model?: string; maxTokens?: number; temperature?: number } = {},
): Promise<string> {
  const endpoint = options.endpoint ?? llmConfig.primary
  const res = await fetch(`${endpoint.baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${endpoint.token}`,
    },
    body: JSON.stringify({
      model: options.model ?? llmConfig.chatModel,
      messages,
      max_tokens: options.maxTokens ?? 512,
      temperature: options.temperature ?? 0.3,
    }),
  })
  if (!res.ok) {
    throw new Error(`LLM request failed: ${res.status} ${await res.text()}`)
  }
  const data = await res.json()
  return data.choices?.[0]?.message?.content ?? ''
}
