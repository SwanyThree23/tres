// ──────────────────────────────────────────────────────────────────────────────
// CYLive — Multi-Language Translation Engine
// Language detection via franc + Translation via Anthropic Claude
// Redis caching for repeated translations
// ──────────────────────────────────────────────────────────────────────────────

import Anthropic from "@anthropic-ai/sdk";
import { franc } from "franc";
import { createHash } from "crypto";
import { getCachedTranslation, setCachedTranslation } from "./redis";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || "",
});

// ── Supported Languages ─────────────────────────────────────────────────────

export const SUPPORTED_LANGUAGES = {
  en: "English",
  es: "Spanish",
  fr: "French",
  de: "German",
  pt: "Portuguese",
  ja: "Japanese",
  ko: "Korean",
  zh: "Chinese",
  ar: "Arabic",
  hi: "Hindi",
  ru: "Russian",
  tr: "Turkish",
} as const;

export type LanguageCode = keyof typeof SUPPORTED_LANGUAGES;

// franc ISO 639-3 to our ISO 639-1 mapping
const FRANC_TO_ISO: Record<string, LanguageCode> = {
  eng: "en",
  spa: "es",
  fra: "fr",
  deu: "de",
  por: "pt",
  jpn: "ja",
  kor: "ko",
  cmn: "zh",
  zho: "zh",
  ara: "ar",
  hin: "hi",
  rus: "ru",
  tur: "tr",
};

// ── Language Detection ──────────────────────────────────────────────────────

/**
 * Detect the language of a text string.
 * Returns the ISO 639-1 code or 'en' as fallback.
 */
export function detectLanguage(text: string): LanguageCode {
  if (text.length < 10) return "en"; // Too short to detect reliably

  const detected = franc(text, { minLength: 10 });

  if (detected === "und") return "en"; // Undetermined

  return FRANC_TO_ISO[detected] || "en";
}

// ── Translation ─────────────────────────────────────────────────────────────

/**
 * Hash a string for cache key generation.
 */
function hashText(text: string): string {
  return createHash("sha256").update(text).digest("hex").substring(0, 16);
}

/**
 * Translate a message to a target language.
 * Uses Redis cache — if the same text→lang pair exists, returns cached version.
 * Falls back to Claude API for new translations.
 */
export async function translateMessage(
  text: string,
  targetLang: LanguageCode,
): Promise<string> {
  const sourceLang = detectLanguage(text);

  // Don't translate if already in target language
  if (sourceLang === targetLang) return text;

  // Check cache first
  const textHash = hashText(text);
  const cached = await getCachedTranslation(textHash, targetLang);
  if (cached) return cached;

  // Call Claude for translation (lightweight call, not a full Aura call)
  try {
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 300,
      system: `You are a translation engine. Translate the following text to ${SUPPORTED_LANGUAGES[targetLang]}. Return ONLY the translated text with no explanations, no quotes, no additional commentary.`,
      messages: [
        {
          role: "user",
          content: text,
        },
      ],
    });

    const textBlock = response.content.find((b) => b.type === "text");
    const translation = textBlock?.text || text;

    // Cache the translation (24h TTL)
    await setCachedTranslation(textHash, targetLang, translation);

    return translation;
  } catch (error) {
    console.error("[Translate] API Error:", error);
    return text; // Return original on failure
  }
}

/**
 * Translate a message to all supported languages (batch).
 * Returns a Record keyed by language code.
 * This is used when storing translated_content in the messages table.
 */
export async function translateToAll(
  text: string,
  sourceLang: LanguageCode,
): Promise<Record<string, string>> {
  const translations: Record<string, string> = {};

  // Only translate to languages different from source
  const targetLangs = Object.keys(SUPPORTED_LANGUAGES).filter(
    (lang) => lang !== sourceLang,
  ) as LanguageCode[];

  // Translate in parallel (batched to avoid rate limits)
  const batchSize = 4;
  for (let i = 0; i < targetLangs.length; i += batchSize) {
    const batch = targetLangs.slice(i, i + batchSize);
    const results = await Promise.allSettled(
      batch.map((lang) => translateMessage(text, lang)),
    );

    results.forEach((result, idx) => {
      if (result.status === "fulfilled") {
        translations[batch[idx]] = result.value;
      }
    });
  }

  return translations;
}
