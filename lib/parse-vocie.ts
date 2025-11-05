// lib/voice-parser.ts
import * as chrono from "chrono-node";

type ParseResult = {
    raw: string;
    amount: number | null;
    date: Date | null;
    type: "EXPENSE" | "INCOME";
    category: string | null;
    description: string | null;
};

/**
 * small helper to convert common Hindi/Hinglish number words into number
 * covers common tokens (ek, do, sau, hazaar, lakh) and simple combos.
 * returns null if cannot detect.
 */
function hinWordsToNumber(text: string): number | null {
    if (!text) return null;
    const map: Record<string, number> = {
        shunya: 0,
        ek: 1,
        do: 2,
        teen: 3,
        char: 4,
        paanch: 5,
        chhe: 6,
        saat: 7,
        aath: 8,
        nau: 9,
        das: 10,
        gyarah: 11,
        barah: 12,
        treh: 13,
        chaudah: 14,
        pandrah: 15,
        solah: 16,
        satrah: 17,
        atharah: 18,
        unnis: 19,
        bees: 20,
        tees: 30,
        chaalis: 40,
        pachaas: 50,
        saath: 60,
        sattar: 70,
        assi: 80,
        nabbe: 90,
        sau: 100,
        hazaar: 1000,
        lakh: 100000,
        thousand: 1000,
        hundred: 100,
        k: 1000,
    };

    const tokens = text
        .toLowerCase()
        .replace(/₹/g, "")
        .replace(/rs\.?/g, "")
        .replace(/rupees?|rupay|rupee/gi, "")
        .replace(/,/g, " ")
        .split(/\s+/)
        .filter(Boolean);

    // if token is numeric, return that first
    for (const t of tokens) {
        if (/^\d+(\.\d+)?$/.test(t)) return parseFloat(t);
        if (/^\d+k$/i.test(t)) return parseInt(t.replace(/k/i, "")) * 1000;
    }

    let total = 0;
    let current = 0;

    for (const t of tokens) {
        if (map[t] !== undefined) {
            const val = map[t];
            if (val >= 100) {
                current = Math.max(1, current) * val;
                total += current;
                current = 0;
            } else {
                current += val;
            }
        }
    }

    const final = total + current;
    return final || null;
}

/**
 * parseVoiceText: expects an English transcript. If transcript contains Hindi numerals/words
 * it uses hinWordsToNumber fallback.
 */
export function parseVoiceText(transcript: string): ParseResult {
    const raw = transcript.trim();
    const lc = raw.toLowerCase();

    // 1) amount detection: numeric first
    let amount: number | null = null;
    const numericMatch = lc.match(/(?:rs|rupee|rupees|₹)?\s*([0-9,.]+k?)/i);
    if (numericMatch) {
        let a = numericMatch[1].toLowerCase().replace(/,/g, "");
        if (a.endsWith("k")) {
            amount = parseFloat(a.replace("k", "")) * 1000;
        } else {
            amount = parseFloat(a);
        }
    } else {
        // fallback: detect hindi words near rupee tokens or detect number words
        const rupeeSegmentMatch = lc.match(/(?:rupee|rupees|rs|₹)\s*([^\s]+)/i);
        if (rupeeSegmentMatch) amount = hinWordsToNumber(rupeeSegmentMatch[1]);
        else {
            const possibleNumberWords = lc.match(
                /(ek|do|teen|paanch|pachaas|sau|hazaar|lakh|one|two|three|four|five|ten|hundred|thousand|k)(?:[\s-]+(ek|do|teen|paanch|pachaas|sau|hazaar|lakh|one|two|three|four|five|ten|hundred|thousand|k))*/i
            );
            if (possibleNumberWords) amount = hinWordsToNumber(possibleNumberWords[0]);
        }
    }

    // 2) date parsing using chrono-node
    let date: Date | null = null;
    const parsedDates = chrono.parse(raw, new Date(), { forwardDate: true });
    if (parsedDates && parsedDates.length) date = parsedDates[0].start.date();

    // 3) type detection
    let type: "EXPENSE" | "INCOME" = "EXPENSE";
    const incomeKeywords = ["received", "got", "salary", "income", "credited"];
    if (incomeKeywords.some((k) => lc.includes(k))) type = "INCOME";

    // 4) category heuristic
    const categoriesMap: Record<string, string[]> = {
        groceries: ["grocery", "groceries", "vegetable", "kirana", "supermarket"],
        transport: ["uber", "ola", "taxi", "cab", "bus", "train", "fuel", "petrol"],
        dining: ["dinner", "lunch", "restaurant", "cafe", "food", "coffee"],
        rent: ["rent", "apartment", "house rent"],
        salary: ["salary", "pay"],
        shopping: ["amazon", "flipkart", "shopping", "clothes", "shirt", "shoe"],
        utilities: ["electricity", "water", "internet", "wifi", "bill"],
    };

    let category: string | null = null;
    for (const [cat, keywords] of Object.entries(categoriesMap)) {
        if (keywords.some((kw) => lc.includes(kw))) {
            category = cat;
            break;
        }
    }

    // 5) description - remove amount & date phrases
    let description = raw;
    if (numericMatch && numericMatch[0]) description = description.replace(numericMatch[0], "");
    if (parsedDates && parsedDates.length) description = description.replace(parsedDates[0].text, "");
    description = description.replace(/\s+/g, " ").trim();

    return {
        raw,
        amount: amount != null && !Number.isNaN(amount) ? amount : null,
        date: date || null,
        type,
        category,
        description: description || null,
    };
}
