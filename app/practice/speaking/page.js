"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Mic, Square, ArrowLeft, Send, RotateCcw, Play, Pause } from "lucide-react";
import { readingPrompts } from "@/lib/reading-prompts";
import { convertToWav } from "@/lib/audio-utils";

export default function SpeakingPracticePage() {
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [scores, setScores] = useState(null);
  const [recognizedText, setRecognizedText] = useState(null);
  const [currentPrompt] = useState(
    readingPrompts[Math.floor(Math.random() * readingPrompts.length)]
  );

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const audioPlayerRef = useRef(null);
  const recordingTimerRef = useRef(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: 16000,
        }
      });

      // Try to use audio/wav if supported, otherwise fall back to webm
      let mimeType = 'audio/webm';
      if (MediaRecorder.isTypeSupported('audio/wav')) {
        mimeType = 'audio/wav';
      } else if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
        mimeType = 'audio/webm;codecs=opus';
      }

      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        setAudioBlob(audioBlob);
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);

        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);

      // Auto-stop recording after 7 seconds
      recordingTimerRef.current = setTimeout(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
          stopRecording();
        }
      }, 7000);
    } catch (error) {
      console.error("Error accessing microphone:", error);
      alert("Could not access microphone. Please grant permission.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);

      // Clear the timer if manually stopped
      if (recordingTimerRef.current) {
        clearTimeout(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }
    }
  };

  const handleRecord = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const togglePlayback = () => {
    if (audioPlayerRef.current) {
      if (isPlaying) {
        audioPlayerRef.current.pause();
      } else {
        audioPlayerRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const resetRecording = () => {
    setAudioBlob(null);
    setAudioUrl(null);
    setFeedback(null);
    setScores(null);
    setRecognizedText(null);
    setIsPlaying(false);
    if (audioPlayerRef.current) {
      audioPlayerRef.current.pause();
      audioPlayerRef.current.currentTime = 0;
    }
    // Clear any pending timer
    if (recordingTimerRef.current) {
      clearTimeout(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
  };

  const sendToAnalyze = async () => {
    if (!audioBlob) return;

    setIsAnalyzing(true);
    try {
      // Convert audio to WAV format for Azure Speech Service
      const wavBlob = await convertToWav(audioBlob);

      // Convert WAV blob to base64
      const base64Audio = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result.split(",")[1]);
        reader.onerror = reject;
        reader.readAsDataURL(wavBlob);
      });

      const response = await fetch("/api/analyze-speech", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          audioBase64: base64Audio,
          originalText: currentPrompt,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setFeedback(data.feedback);
        setScores(data.scores);
        setRecognizedText(data.recognizedText);
      } else {
        alert("Failed to analyze speech: " + (data.error || "Unknown error") + (data.details ? "\n" + data.details : ""));
      }
    } catch (error) {
      console.error("Error sending audio:", error);
      alert("Failed to send audio for analysis: " + error.message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  useEffect(() => {
    if (audioPlayerRef.current) {
      audioPlayerRef.current.onended = () => setIsPlaying(false);
    }
  }, [audioUrl]);

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
            Speaking Practice
          </h1>
          <p className="text-slate-500 font-light">
            Read the text aloud and record yourself
          </p>
        </div>

        <div className="max-w-2xl mx-auto space-y-12">
          {/* Reading Prompt */}
          <div className="border-2 border-slate-200 p-12 bg-slate-50">
            <p className="text-2xl font-light text-center leading-relaxed text-slate-800">
              {currentPrompt}
            </p>
          </div>

          {/* Record Button */}
          <div className="flex flex-col items-center gap-6">
            <Button
              onClick={handleRecord}
              size="lg"
              disabled={audioBlob !== null}
              className={`w-24 h-24 rounded-full transition-all duration-300 ${
                isRecording
                  ? "bg-red-600 hover:bg-red-700"
                  : "bg-black hover:bg-slate-800"
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {isRecording ? (
                <Square className="w-8 h-8" strokeWidth={1.5} />
              ) : (
                <Mic className="w-8 h-8" strokeWidth={1.5} />
              )}
            </Button>
            <p className="text-sm font-light text-slate-500">
              {isRecording ? "Recording..." : audioBlob ? "Recording complete" : "Press to record"}
            </p>
          </div>

          {/* Audio Playback */}
          {audioUrl && (
            <div className="border-2 border-slate-200 p-8 space-y-6">
              <audio ref={audioPlayerRef} src={audioUrl} className="hidden" />

              <div className="flex items-center justify-center gap-4">
                <Button
                  onClick={togglePlayback}
                  variant="outline"
                  size="lg"
                  className="border-2 border-black hover:bg-slate-100"
                >
                  {isPlaying ? (
                    <Pause className="w-5 h-5 mr-2" strokeWidth={1.5} />
                  ) : (
                    <Play className="w-5 h-5 mr-2" strokeWidth={1.5} />
                  )}
                  {isPlaying ? "Pause" : "Play Recording"}
                </Button>

                <Button
                  onClick={resetRecording}
                  variant="outline"
                  size="lg"
                  className="border-2 border-slate-300 hover:bg-slate-100"
                >
                  <RotateCcw className="w-5 h-5 mr-2" strokeWidth={1.5} />
                  Retry
                </Button>
              </div>

              {!feedback && (
                <div className="flex justify-center">
                  <Button
                    onClick={sendToAnalyze}
                    disabled={isAnalyzing}
                    size="lg"
                    className="bg-black hover:bg-slate-800 disabled:opacity-70"
                  >
                    {isAnalyzing ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Analyzing...
                      </div>
                    ) : (
                      <>
                        <Send className="w-5 h-5 mr-2" strokeWidth={1.5} />
                        Send for Analysis
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Feedback Section */}
          {feedback && (
            <div className="space-y-6">
              {/* Scores */}
              {scores && (
                <div className="border-2 border-slate-200 p-8 bg-slate-50">
                  <h3 className="text-lg font-light text-black mb-6">Your Scores</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-3xl font-light text-black mb-1">
                        {Math.round(scores.pronunciationScore)}
                      </div>
                      <div className="text-xs font-light text-slate-600">Overall</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-light text-black mb-1">
                        {Math.round(scores.accuracyScore)}
                      </div>
                      <div className="text-xs font-light text-slate-600">Accuracy</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-light text-black mb-1">
                        {Math.round(scores.fluencyScore)}
                      </div>
                      <div className="text-xs font-light text-slate-600">Fluency</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-light text-black mb-1">
                        {Math.round(scores.completenessScore)}
                      </div>
                      <div className="text-xs font-light text-slate-600">Completeness</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Recognized Text */}
              {recognizedText && (
                <div className="border-2 border-slate-200 p-6 bg-slate-50">
                  <h3 className="text-sm font-light text-slate-600 mb-2">What we heard:</h3>
                  <p className="text-base font-light text-slate-800 italic">
                    "{recognizedText}"
                  </p>
                </div>
              )}

              {/* AI Feedback */}
              <div className="border-2 border-black p-8 bg-slate-50 space-y-4">
                <h3 className="text-xl font-light text-black mb-4">Feedback</h3>
                <div className="prose prose-slate max-w-none">
                  <p className="text-slate-700 font-light leading-relaxed whitespace-pre-line">
                    {feedback}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
