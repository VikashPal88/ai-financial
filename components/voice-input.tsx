// components/VoiceInput.tsx
"use client";

import React from "react";
import SpeechRecognition, {
  useSpeechRecognition,
} from "react-speech-recognition";
import { Mic, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { translateText } from "@/lib/translate";

type Props = {
  onResult: (englishTranscript: string) => void;
  preferLang?: string; // initial recognition hint, e.g. "en-IN"
  continuous?: boolean;
};

export function VoiceInput({
  onResult,
  preferLang = "en-IN",
  continuous = true,
}: Props) {
  const {
    transcript,
    interimTranscript,
    listening,
    browserSupportsSpeechRecognition,
  } = useSpeechRecognition();

  if (!browserSupportsSpeechRecognition) {
    return (
      <div className="text-sm text-muted-foreground">
        Voice input not supported in this browser. Use Chrome/Edge for best
        results.
      </div>
    );
  }

  const start = () => {
    SpeechRecognition.startListening({ continuous, language: preferLang });
  };

  const stopAndTranslate = async () => {
    SpeechRecognition.stopListening();
    const final = (transcript || interimTranscript || "").trim();
    if (!final) return;

    // Always translate detected text to English (source auto-detected)
    const english = await translateText(final, "auto", "en");
    onResult(english);
  };

  const toggle = () => {
    if (listening) stopAndTranslate();
    else start();
  };

  return (
    <div className="space-y-2">
      <Button
        type="button"
        onClick={toggle}
        className={`w-full ${
          listening
            ? "bg-red-600 text-white"
            : "bg-gradient-to-br from-orange-500 via-pink-500 to-purple-500 text-white"
        }`}
      >
        {listening ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Stop & Translate
          </>
        ) : (
          <>
            <Mic className="mr-2 h-4 w-4" />
            Add by Voice
          </>
        )}
      </Button>

      <div className="text-sm text-muted-foreground">
        {interimTranscript ? (
          <em>🎤 {interimTranscript}</em>
        ) : transcript ? (
          <span>🎤 {transcript}</span>
        ) : (
          <span className="opacity-80">
            Try: "Spent 250 rupees on groceries yesterday"
          </span>
        )}
      </div>
    </div>
  );
}
