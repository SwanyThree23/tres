/**
 * SwanyThree AI Wrapper Pro
 * Integrates: LLMLingua (Compression) + OpenRouter (Intelligence) + Wisprflow (Transcription)
 */

import axios from 'axios';

export class SwanyAIWrapper {
  private openRouterKey: string;
  private llmLinguaUrl: string;

  constructor() {
    this.openRouterKey = process.env.OPENROUTER_API_KEY!;
    this.llmLinguaUrl = process.env.LLMLINGUA_ENDPOINT || 'http://localhost:8000';
  }

  /**
   * Compress prompts via LLMLingua to save tokens/cost.
   * Falls back to uncompressed context if service is unavailable.
   */
  async compressPrompt(context: string, instruction: string): Promise<string> {
    try {
      const response = await axios.post(`${this.llmLinguaUrl}/compress`, {
        context,
        instruction,
        target_token: 300,
      });
      return response.data.compressed_prompt;
    } catch {
      return context;
    }
  }

  /**
   * Multi-Model Intelligence via OpenRouter.
   * Default model: anthropic/claude-3.5-sonnet
   */
  async chat(messages: Array<{ role: string; content: string }>, model = 'anthropic/claude-3.5-sonnet') {
    return axios.post(
      'https://openrouter.ai/api/v1/chat/completions',
      { model, messages },
      { headers: { Authorization: `Bearer ${this.openRouterKey}` } }
    );
  }

  /**
   * Wisprflow Audio Transcription (Multi-Language).
   */
  async transcribe(audioBuffer: Buffer, language: string): Promise<string> {
    const formData = new FormData();
    formData.append('file', new Blob([audioBuffer]));
    formData.append('language', language);
    const response = await axios.post('https://api.wisprflow.ai/transcribe', formData);
    return response.data.text;
  }
}
