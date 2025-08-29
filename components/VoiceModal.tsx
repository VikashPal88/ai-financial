import React, { useEffect, useMemo, useState } from "react";
import SpeechRecognition, {
  useSpeechRecognition,
} from "react-speech-recognition";
import { FaMicrophone, FaRegPauseCircle, FaRegSave } from "react-icons/fa";
import { FaRegCirclePlay } from "react-icons/fa6";
import { MdDelete } from "react-icons/md";

type ExpenseCategory =
  | "Food"
  | "Travel"
  | "Bills"
  | "Groceries"
  | "Shopping"
  | "Health"
  | "Entertainment"
  | "Utilities"
  | "Education"
  | "Other";

export interface ParsedExpense {
  amount: number | null;
  category: ExpenseCategory;
  note: string;
  currency: "INR" | "USD" | "EUR";
  occurredAt: Date;
  raw: string; // original transcript
}

interface VoiceExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveExpense: (expense: ParsedExpense) => Promise<void>; // plug into your DB/update charts
  defaultLanguage?: string; // e.g. "en-IN" | "hi-IN" | "en-US"
}

const LANGUAGES = [
  { code: "en-IN", name: "English (India)" },
  { code: "hi-IN", name: "Hindi (India)" },
  { code: "en-US", name: "English (US)" },
  { code: "en-GB", name: "English (UK)" },
];

const CATEGORY_KEYWORDS: Record<ExpenseCategory, string[]> = {
  Food: [
    "food",
    "dinner",
    "lunch",
    "breakfast",
    "snack",
    "restaurant",
    "dining",
    "pizza",
    "burger",
  ],
  Travel: [
    "travel",
    "cab",
    "uber",
    "ola",
    "bus",
    "train",
    "flight",
    "auto",
    "taxi",
  ],
  Bills: [
    "bill",
    "bills",
    "rent",
    "electricity",
    "internet",
    "phone",
    "gas",
    "water",
    "recharge",
  ],
  Groceries: ["grocery", "groceries", "kirana", "vegetables", "fruits", "milk"],
  Shopping: ["shopping", "clothes", "shoes", "amazon", "flipkart", "myntra"],
  Health: ["health", "medicine", "pharmacy", "doctor", "hospital"],
  Entertainment: [
    "entertainment",
    "movie",
    "netflix",
    "spotify",
    "prime",
    "game",
  ],
  Utilities: ["utility", "utilities", "dth", "broadband"],
  Education: ["education", "course", "udemy", "coursera", "fees", "book"],
  Other: [],
};

// ---------- parsing helpers ----------
function normalizeNumber(s: string): number | null {
  // handles "₹300", "300 rupees", "300rs", "300", "1,200", "1200.50"
  const cleaned = s
    .replace(/[^\d.,]/g, "")
    .replace(/,/g, "")
    .trim();
  if (!cleaned) return null;
  const n = Number(cleaned);
  return isFinite(n) ? n : null;
}

function wordToNumber(s: string): number | null {
  const wordMap: Record<string, number> = {
    zero: 0,
    one: 1,
    two: 2,
    three: 3,
    four: 4,
    five: 5,
    six: 6,
    seven: 7,
    eight: 8,
    nine: 9,
    ten: 10,
    eleven: 11,
    twelve: 12,
    thirteen: 13,
    fourteen: 14,
    fifteen: 15,
    sixteen: 16,
    seventeen: 17,
    eighteen: 18,
    nineteen: 19,
    twenty: 20,
    thirty: 30,
    forty: 40,
    fifty: 50,
    sixty: 60,
    seventy: 70,
    eighty: 80,
    ninety: 90,
    hundred: 100,
    thousand: 1000,
    lakh: 100000, // for INR
    million: 1000000,
  };

  const words = s.toLowerCase().split(/\s+/);
  let total = 0;
  let current = 0;
  for (const word of words) {
    if (word in wordMap) {
      const val = wordMap[word];
      if (val >= 100) {
        current = current ? current * val : val;
        if (val >= 1000) {
          total += current;
          current = 0;
        }
      } else {
        current += val;
      }
    }
  }
  total += current;
  return total || null;
}

function guessCategory(text: string): ExpenseCategory {
  const t = text.toLowerCase();
  for (const [cat, words] of Object.entries(CATEGORY_KEYWORDS)) {
    if (words.some((w) => t.includes(w))) return cat as ExpenseCategory;
  }
  // short fallbacks like: "food 400", "travel 200" direct match
  const direct = Object.keys(CATEGORY_KEYWORDS).find((c) =>
    t.includes(c.toLowerCase())
  );
  return (direct as ExpenseCategory) || "Other";
}

function extractAmountAndCurrency(text: string): {
  amount: number | null;
  currency: ParsedExpense["currency"];
  matchedStr: string;
} {
  const t = text.trim();
  let currency: ParsedExpense["currency"] = "INR"; // default
  let matchedStr = ""; // to remove from note later

  // Digit patterns for all currencies
  const digitPatterns = [
    { regex: /₹\s*([\d.,]+)/i, currency: "INR" },
    { regex: /rs\.?\s*([\d.,]+)/i, currency: "INR" },
    { regex: /rupees?\s*([\d.,]+)/i, currency: "INR" },
    { regex: /([\d.,]+)\s*(?:rupees?|rs\.?)/i, currency: "INR" },
    { regex: /$\s*([\d.,]+)/i, currency: "USD" },
    { regex: /dollars?\s*([\d.,]+)/i, currency: "USD" },
    { regex: /([\d.,]+)\s*(?:dollars?|usd)/i, currency: "USD" },
    { regex: /€\s*([\d.,]+)/i, currency: "EUR" },
    { regex: /euros?\s*([\d.,]+)/i, currency: "EUR" },
    { regex: /([\d.,]+)\s*(?:euros?|eur)/i, currency: "EUR" },
    { regex: /(^|\s)([\d.,]+)($|\s)/, currency: "INR" }, // plain number, default INR
  ];

  for (const { regex, currency: curr } of digitPatterns) {
    const m = t.match(regex);
    if (m) {
      matchedStr = m[0]; // full matched string for removal
      const numStr = m[m.length - 1];
      const n = normalizeNumber(numStr);
      if (n !== null) {
        currency = curr;
        return { amount: n, currency, matchedStr };
      }
    }
  }

  // Word patterns for all currencies (up to ~5 words for the number part)
  const wordPatterns = [
    { regex: /₹\s*([\w\s]{1,50})/i, currency: "INR" },
    { regex: /rs\.?\s*([\w\s]{1,50})/i, currency: "INR" },
    { regex: /rupees?\s*([\w\s]{1,50})/i, currency: "INR" },
    { regex: /([\w\s]{1,50})\s*(?:rupees?|rs\.?)/i, currency: "INR" },
    { regex: /$\s*([\w\s]{1,50})/i, currency: "USD" },
    { regex: /dollars?\s*([\w\s]{1,50})/i, currency: "USD" },
    { regex: /([\w\s]{1,50})\s*(?:dollars?|usd)/i, currency: "USD" },
    { regex: /€\s*([\w\s]{1,50})/i, currency: "EUR" },
    { regex: /euros?\s*([\w\s]{1,50})/i, currency: "EUR" },
    { regex: /([\w\s]{1,50})\s*(?:euros?|eur)/i, currency: "EUR" },
    { regex: /(^|\s)([\w\s]{1,50})($|\s)/, currency: "INR" }, // plain, default INR
  ];

  for (const { regex, currency: curr } of wordPatterns) {
    const m = t.match(regex);
    if (m) {
      matchedStr = m[0]; // full matched string for removal
      const wordStr = m[m.length - 1].trim();
      const n = wordToNumber(wordStr);
      if (n !== null) {
        currency = curr;
        return { amount: n, currency, matchedStr };
      }
    }
  }

  return { amount: null, currency: "INR", matchedStr: "" };
}

function parseExpenseCommand(raw: string): ParsedExpense {
  const text = raw.trim();
  const { amount, currency, matchedStr } = extractAmountAndCurrency(text);
  const category = guessCategory(text);
  // remove keywords, currency, and the matched amount string to form a cleaner note
  const cleanedNote = text
    .replace(/(add|spent|spend|log|pay|paid|purchase|bought)/gi, "")
    .replace(/(₹|rs\.?|rupees?|\$|dollars?|€|euros?)/gi, "")
    .replace(matchedStr, "")
    .trim();

  return {
    amount,
    category,
    note: cleanedNote || "Voice entry",
    currency,
    occurredAt: new Date(),
    raw,
  };
}

// ---------- component ----------
const VoiceExpenseModal: React.FC<VoiceExpenseModalProps> = ({
  isOpen,
  onClose,
  onSaveExpense,
  defaultLanguage = "en-IN",
}) => {
  const [language, setLanguage] = useState(defaultLanguage);
  const [isRecording, setIsRecording] = useState(false);
  const [manual, setManual] = useState<ParsedExpense>({
    amount: null,
    category: "Other",
    note: "",
    currency: "INR",
    occurredAt: new Date(),
    raw: "",
  });

  const { transcript, resetTranscript, browserSupportsSpeechRecognition } =
    useSpeechRecognition();

  const parsed = useMemo(() => parseExpenseCommand(transcript), [transcript]);

  useEffect(() => {
    if (!isOpen) {
      SpeechRecognition.stopListening();
      setIsRecording(false);
      resetTranscript();
    }
  }, [isOpen, resetTranscript]);

  useEffect(() => {
    // keep manual fields in sync with parsed (user can still edit)
    setManual((prev) => ({
      ...prev,
      amount: parsed.amount ?? prev.amount,
      category: parsed.category ?? prev.category,
      note: parsed.note || prev.note,
      currency: parsed.currency ?? prev.currency,
      raw: parsed.raw,
      occurredAt: new Date(),
    }));
  }, [parsed]);

  if (!isOpen) return null;

  if (!browserSupportsSpeechRecognition) {
    return (
      <div className="fixed inset-0 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-lg p-6 md:w-96 w-80 text-center">
          <p className="text-red-600">
            Your browser doesn&apos;t support speech recognition.
          </p>
          <button
            onClick={onClose}
            className="mt-4 px-4 py-2 rounded bg-gray-200 hover:bg-gray-300"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  const startRecording = () => {
    SpeechRecognition.startListening({
      continuous: true,
      interimResults: true,
      language,
    });
    setIsRecording(true);
  };

  const stopRecording = () => {
    SpeechRecognition.stopListening();
    setIsRecording(false);
  };

  const clearAll = () => {
    resetTranscript();
    setManual({
      amount: null,
      category: "Other",
      note: "",
      currency: "INR",
      occurredAt: new Date(),
      raw: "",
    });
  };

  const canSave = manual.amount !== null && manual.amount > 0;

  const handleSave = async () => {
    if (!canSave) return;
    await onSaveExpense({
      ...manual,
      occurredAt: new Date(),
    });
    clearAll();
    onClose();
  };

  return (
    <div>
      {/* Blur Background */}
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 mt-5" />
      {/* Modal */}
      <div className="fixed inset-0 flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl shadow-lg p-6 md:w-[28rem] w-80">
          <div className="text-center">
            <FaMicrophone className="text-gray-700 mx-auto md:text-7xl text-5xl bg-green-400 rounded-full p-4" />

            {/* Transcript */}
            <p className="text-gray-700 bg-gray-100 p-3 rounded-md h-24 overflow-y-auto mt-4 text-sm">
              {transcript || "Say: “add dinner ₹300” or “spent 200 on travel”"}
            </p>

            {/* Language Selector */}
            <select
              className="mt-3 p-2 w-full border rounded-md"
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
            >
              {LANGUAGES.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.name}
                </option>
              ))}
            </select>

            {/* Wave Animation */}
            {isRecording && (
              <div className="flex justify-center gap-1 mt-3">
                {[...Array(5)].map((_, i) => (
                  <div
                    key={i}
                    className="w-2 h-6 bg-green-500 rounded animate-pulse"
                    style={{
                      animationDelay: `${i * 120}ms`,
                    }}
                  />
                ))}
              </div>
            )}

            {/* Parsed Preview + Manual Edit */}
            <div className="mt-4 grid grid-cols-2 gap-3 text-left">
              <div className="col-span-1">
                <label className="text-xs text-gray-600">
                  Amount ({manual.currency})
                </label>
                <input
                  type="number"
                  className="w-full border rounded-md p-2"
                  value={manual.amount ?? ""}
                  onChange={(e) =>
                    setManual((m) => ({
                      ...m,
                      amount: e.target.value ? Number(e.target.value) : null,
                    }))
                  }
                  placeholder="e.g. 300"
                />
              </div>

              <div className="col-span-1">
                <label className="text-xs text-gray-600">Category</label>
                <select
                  className="w-full border rounded-md p-2"
                  value={manual.category}
                  onChange={(e) =>
                    setManual((m) => ({
                      ...m,
                      category: e.target.value as ExpenseCategory,
                    }))
                  }
                >
                  {(Object.keys(CATEGORY_KEYWORDS) as ExpenseCategory[]).map(
                    (c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    )
                  )}
                </select>
              </div>

              <div className="col-span-2">
                <label className="text-xs text-gray-600">Note</label>
                <input
                  className="w-full border rounded-md p-2"
                  value={manual.note}
                  onChange={(e) =>
                    setManual((m) => ({ ...m, note: e.target.value }))
                  }
                  placeholder="Short description (optional)"
                />
              </div>
            </div>

            {/* Controls */}
            <div className="mt-5 flex gap-3 justify-center">
              <button
                onClick={isRecording ? stopRecording : startRecording}
                className={`px-4 py-4 text-2xl rounded-full text-white ${
                  isRecording
                    ? "bg-red-500 hover:bg-red-600"
                    : "bg-green-500 hover:bg-green-600"
                }`}
                aria-label={isRecording ? "Stop Recording" : "Start Recording"}
                title={isRecording ? "Stop Recording" : "Start Recording"}
              >
                {isRecording ? <FaRegPauseCircle /> : <FaRegCirclePlay />}
              </button>

              <button
                onClick={handleSave}
                disabled={!canSave}
                className={`px-4 py-4 rounded-full text-2xl ${
                  canSave
                    ? "bg-blue-500 hover:bg-blue-600 text-white"
                    : "bg-gray-300 text-gray-500"
                }`}
                aria-label="Save Expense"
                title="Save Expense"
              >
                <FaRegSave />
              </button>

              <button
                onClick={() => {
                  stopRecording();
                  clearAll();
                  onClose();
                }}
                className="px-4 py-4 text-2xl rounded-full bg-gray-500 hover:bg-gray-600 text-white"
                aria-label="Discard"
                title="Discard"
              >
                <MdDelete />
              </button>
            </div>

            {/* Tiny helper */}
            <p className="text-[11px] text-gray-500 mt-3">
              Examples: “add dinner ₹300”, “spent 200 on travel”, “groceries
              450”, “add ₹150 coffee”.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VoiceExpenseModal;
