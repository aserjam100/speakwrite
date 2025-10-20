"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Send, RotateCcw } from "lucide-react";

const writingPrompts = [
  "Describe your favorite place to relax",
  "Write about a memorable meal you enjoyed",
  "What does a perfect morning look like to you?",
  "Describe the view from your window",
  "Write about your favorite season and why",
  "What brings you peace in daily life?",
];

export default function WritingPracticePage() {
  const [text, setText] = useState("");
  const [feedback, setFeedback] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentPrompt] = useState(
    writingPrompts[Math.floor(Math.random() * writingPrompts.length)]
  );

  const wordCount = text.trim().split(/\s+/).filter(Boolean).length;

  const handleSubmit = async () => {
    if (wordCount < 25) {
      alert("Please write at least 25 words before submitting.");
      return;
    }

    setIsAnalyzing(true);
    try {
      const response = await fetch("/api/analyze-writing", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: text,
          prompt: currentPrompt,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setFeedback(data.feedback);
      } else {
        alert("Failed to analyze writing: " + (data.error || "Unknown error"));
      }
    } catch (error) {
      console.error("Error analyzing writing:", error);
      alert("Failed to analyze writing: " + error.message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleReset = () => {
    setText("");
    setFeedback(null);
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-8 py-12">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-slate-600 hover:text-black transition-colors mb-12"
        >
          <ArrowLeft className="w-4 h-4" strokeWidth={1.5} />
          <span className="font-light">Back</span>
        </Link>

        <div className="text-center mb-16">
          <h1 className="text-4xl font-light tracking-tight text-black mb-2">
            Writing Practice
          </h1>
          <p className="text-slate-500 font-light">
            Write at least 25 words on the topic
          </p>
        </div>

        <div className="max-w-2xl mx-auto space-y-8">
          {/* Writing Prompt */}
          <div className="border-2 border-slate-200 p-8 bg-slate-50">
            <p className="text-xl font-light text-center text-slate-800">
              {currentPrompt}
            </p>
          </div>

          {/* Text Area */}
          <div className="space-y-4">
            <Textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Start writing here..."
              disabled={feedback !== null}
              className="min-h-[300px] text-lg font-light resize-none border-2 border-slate-200 focus:border-black transition-colors p-6 disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <div className="flex justify-between items-center">
              <p className="text-sm font-light text-slate-500">
                Word count:{" "}
                <span
                  className={
                    wordCount >= 25
                      ? "text-black font-normal"
                      : "text-slate-500"
                  }
                >
                  {wordCount}
                </span>{" "}
                / 25
              </p>
              {wordCount >= 25 && !feedback && (
                <p className="text-sm font-light text-slate-600">
                  Goal reached
                </p>
              )}
            </div>

            {/* Action Buttons */}
            {!feedback && (
              <div className="flex gap-4 justify-center pt-4">
                <Button
                  onClick={handleSubmit}
                  disabled={isAnalyzing || wordCount < 25}
                  size="lg"
                  className="bg-black hover:bg-slate-800 disabled:opacity-50"
                >
                  {isAnalyzing ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Analyzing...
                    </div>
                  ) : (
                    <>
                      <Send className="w-5 h-5 mr-2" strokeWidth={1.5} />
                      Submit for Review
                    </>
                  )}
                </Button>
                <Button
                  onClick={handleReset}
                  variant="outline"
                  size="lg"
                  className="border-2 border-slate-300 hover:bg-slate-100"
                >
                  <RotateCcw className="w-5 h-5 mr-2" strokeWidth={1.5} />
                  Reset
                </Button>
              </div>
            )}
          </div>

          {/* Feedback Section */}
          {feedback && (
            <div className="space-y-6">
              <div className="border-2 border-black p-8 bg-slate-50 space-y-4">
                <h3 className="text-xl font-light text-black mb-4">Feedback</h3>
                <div className="prose prose-slate max-w-none">
                  <p className="text-slate-700 font-light leading-relaxed whitespace-pre-line">
                    {feedback}
                  </p>
                </div>
              </div>

              {/* Reset button after feedback */}
              <div className="flex justify-center">
                <Button
                  onClick={handleReset}
                  variant="outline"
                  size="lg"
                  className="border-2 border-slate-300 hover:bg-slate-100"
                >
                  <RotateCcw className="w-5 h-5 mr-2" strokeWidth={1.5} />
                  Start New Practice
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
