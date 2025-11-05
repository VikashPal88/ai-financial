// lib/translate.ts
export const LIBRE_TRANSLATE_URL = "https://libretranslate.com/translate";

/**
 * Translate text from `source` to `target`. Uses LibreTranslate public endpoint.
 * Returns translated text or original text on failure.
 */
export async function translateText(
    text: string,
    source = "auto",
    target = "en"
): Promise<string> {
    if (!text) return text;
    try {
        const res = await fetch(LIBRE_TRANSLATE_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                q: text,
                source,
                target,
                format: "text",
            }),
        });

        if (!res.ok) {
            console.warn("translateText failed", res.status, await res.text());
            return text;
        }

        const data = await res.json();
        if (data && data.translatedText) return data.translatedText;
        return text;
    } catch (err) {
        console.warn("translateText error", err);
        return text;
    }
}
