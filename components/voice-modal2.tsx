// components/VoiceModal.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import SpeechRecognition, {
  useSpeechRecognition,
} from "react-speech-recognition";
import { FaMicrophone, FaRegPauseCircle, FaRegSave } from "react-icons/fa";
import { FaRegCirclePlay } from "react-icons/fa6";
import { MdDelete } from "react-icons/md";
import { translateText } from "@/lib/translate";
import { parseVoiceText } from "@/lib/parse-vocie";
import { toast } from "sonner";

type ExpenseCategory =
  | "groceries"
  | "transport"
  | "dining"
  | "rent"
  | "salary"
  | "shopping"
  | "utilities"
  | "other";

const CATEGORY_KEYWORDS: Record<ExpenseCategory, string[]> = {
  groceries: ["grocery", "groceries", "kirana", "vegetable", "supermarket"],
  transport: ["uber", "ola", "taxi", "cab", "bus", "train", "petrol", "fuel"],
  dining: ["dinner", "lunch", "restaurant", "cafe", "coffee", "food"],
  rent: ["rent", "apartment", "house rent"],
  salary: ["salary", "pay", "income"],
  shopping: ["amazon", "flipkart", "shopping", "clothes", "shirt", "shoe"],
  utilities: ["electricity", "water", "internet", "wifi", "bill"],
  other: [],
};

const LANGUAGES = [
  { code: "en-IN", name: "English (India)" },
  { code: "hi-IN", name: "Hindi (Devanagari/Roman)" },
  { code: "auto", name: "Auto-detect" },
];

type ManualState = {
  amount: number | null;
  currency: string;
  category: ExpenseCategory;
  note: string;
};

type VoiceModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSave: (payload: {
    amount: number;
    category: ExpenseCategory;
    note?: string;
    rawTranscript?: string;
    englishTranscript?: string;
  }) => void;
  defaultCurrency?: string;
};

export default function VoiceModal2({
  isOpen,
  onClose,
  onSave,
  defaultCurrency = "INR",
}: VoiceModalProps) {
  const {
    transcript,
    interimTranscript,
    listening,
    browserSupportsSpeechRecognition,
    resetTranscript,
  } = useSpeechRecognition();

  const [language, setLanguage] = useState<string>("en-IN");
  const [isRecording, setIsRecording] = useState(false);
  const [englishTranscript, setEnglishTranscript] = useState<string>("");
  const [rawTranscript, setRawTranscript] = useState<string>("");
  const [manual, setManual] = useState<ManualState>({
    amount: null,
    currency: defaultCurrency,
    category: "other",
    note: "",
  });

  useEffect(() => {
    if (!isOpen) {
      // cleanup when modal closed
      stopRecording();
      clearAll();
    }
  }, [isOpen]);

  useEffect(() => {
    // update raw transcript as we listen
    setRawTranscript(transcript || "");
  }, [transcript]);

  // Start recording with chosen language hint
  const startRecording = () => {
    if (!browserSupportsSpeechRecognition) {
      toast.error(
        "Voice input not supported in this browser. Use Chrome or Edge."
      );
      return;
    }
    try {
      setIsRecording(true);
      // use continuous so user can speak a full phrase
      SpeechRecognition.startListening({
        continuous: true,
        language: language === "auto" ? "en-IN" : language,
      });
    } catch (e) {
      console.error(e);
      toast.error("Could not start microphone. Check permissions.");
    }
  };

  // Stop recording, translate transcript to English, parse, populate manual state
  const stopRecording = async () => {
    try {
      SpeechRecognition.stopListening();
    } catch (e) {
      // ignore
    }
    setIsRecording(false);

    const finalRaw = (transcript || interimTranscript || "").trim();
    if (!finalRaw) {
      toast.error("No speech detected. Try again.");
      return;
    }

    setRawTranscript(finalRaw);

    // ALWAYS translate to English (source auto)
    let english = finalRaw;
    try {
      english = await translateText(finalRaw, "auto", "en");
    } catch (e) {
      console.warn("translate failed", e);
    }
    setEnglishTranscript(english);

    // parse english into structured fields
    try {
      const parsed = parseVoiceText(english);

      // Set manual preview values (fall back to parsed.raw values if missing)
      setManual((m) => ({
        ...m,
        amount: parsed.amount ?? m.amount,
        category: (parsed.category as ExpenseCategory) ?? m.category,
        note: parsed.description ?? m.note,
      }));

      toast.success("Voice parsed to English. Review before saving.");
    } catch (e) {
      console.error("parse failed", e);
      toast.error("Could not parse input. Please edit manually.");
    }
  };

  const clearAll = () => {
    setRawTranscript("");
    setEnglishTranscript("");
    resetTranscript();
    setManual({
      amount: null,
      currency: defaultCurrency,
      category: "other",
      note: "",
    });
  };

  const canSave = useMemo(() => {
    return (
      manual.amount != null && !Number.isNaN(manual.amount) && manual.amount > 0
    );
  }, [manual]);

  const handleSave = () => {
    if (!canSave) {
      toast.error("Please provide a valid amount.");
      return;
    }
    // Build payload and send to parent
    onSave({
      amount: manual.amount as number,
      category: manual.category,
      note: manual.note || undefined,
      rawTranscript: rawTranscript || undefined,
      englishTranscript: englishTranscript || undefined,
    });
    // cleanup & close
    clearAll();
    onClose();
  };

  if (!isOpen) return null;

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
            <p className="text-gray-700 bg-gray-100 p-3 rounded-md h-24 overflow-y-auto mt-4 text-sm text-left">
              {rawTranscript ? (
                <>
                  <strong>Detected:</strong> {rawTranscript}
                  <br />
                  {englishTranscript && (
                    <>
                      <strong>English:</strong> {englishTranscript}
                    </>
                  )}
                </>
              ) : (
                "Say: “add dinner ₹300” or “spent 200 on travel”"
              )}
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
                onClick={() => {
                  if (isRecording) stopRecording();
                  else startRecording();
                }}
                className={`px-4 py-4 text-2xl rounded-full text-white ${isRecording ? "bg-red-500 hover:bg-red-600" : "bg-green-500 hover:bg-green-600"}`}
                aria-label={isRecording ? "Stop Recording" : "Start Recording"}
                title={isRecording ? "Stop Recording" : "Start Recording"}
              >
                {isRecording ? <FaRegPauseCircle /> : <FaRegCirclePlay />}
              </button>

              <button
                onClick={handleSave}
                disabled={!canSave}
                className={`px-4 py-4 rounded-full text-2xl ${canSave ? "bg-blue-500 hover:bg-blue-600 text-white" : "bg-gray-300 text-gray-500"}`}
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
}
