"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import {
  ArrowLeft,
  Send,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Loader2,
  StopCircle,
  Bot,
  Play,
  Square,
} from "lucide-react";
import { Message, InterviewConfig, RoleType } from "@/types/interview";
import { useSpeechRecognition, useSpeechSynthesis } from "@/hooks/useSpeech";

function InterviewContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: authSession } = useSession();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isInterviewComplete, setIsInterviewComplete] = useState(false);
  const [autoSpeak, setAutoSpeak] = useState(false);
  const [demoMode, setDemoMode] = useState(false);
  const [autoRunning, setAutoRunning] = useState(false);
  const [interviewSessionId, setInterviewSessionId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const autoRunRef = useRef(false);
  const sessionInitializedRef = useRef(false);

  const {
    isListening,
    transcript,
    startListening,
    stopListening,
    resetTranscript,
    isSupported: speechRecognitionSupported,
  } = useSpeechRecognition();

  const {
    isSpeaking,
    speak,
    stop: stopSpeaking,
    isSupported: speechSynthesisSupported,
  } = useSpeechSynthesis();

  const config: InterviewConfig = {
    roleType: (searchParams.get("role") as RoleType) || "general",
    jobDescription: searchParams.get("jd")
      ? decodeURIComponent(searchParams.get("jd")!)
      : undefined,
  };

  // Check for demo mode in URL
  useEffect(() => {
    if (searchParams.get("demo") === "true") {
      setDemoMode(true);
    }
  }, [searchParams]);

  // Update input with transcript
  useEffect(() => {
    if (transcript) {
      setInputValue(transcript);
    }
  }, [transcript]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Start interview on mount
  useEffect(() => {
    if (!sessionInitializedRef.current) {
      sessionInitializedRef.current = true;
      startInterview();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handle auto-run mode
  useEffect(() => {
    autoRunRef.current = autoRunning;
  }, [autoRunning]);

  const createInterviewSession = async (): Promise<string | null> => {
    if (!authSession?.user) return null;

    try {
      const response = await fetch("/api/interview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roleType: config.roleType,
          jobDescription: config.jobDescription,
        }),
      });

      if (!response.ok) return null;

      const data = await response.json();
      return data.sessionId;
    } catch (error) {
      console.error("Failed to create interview session:", error);
      return null;
    }
  };

  const startInterview = async () => {
    setIsLoading(true);
    try {
      // Create interview session for authenticated users
      let sessionId = null;
      if (authSession?.user) {
        sessionId = await createInterviewSession();
        if (sessionId) {
          setInterviewSessionId(sessionId);
        }
      }

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [], config, sessionId }),
      });

      if (!response.ok) throw new Error("Failed to start interview");

      const data = await response.json();
      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: data.message,
        timestamp: new Date(),
      };

      setMessages([assistantMessage]);

      if (autoSpeak && speechSynthesisSupported) {
        speak(data.message);
      }
    } catch (error) {
      console.error("Failed to start interview:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = async (content?: string) => {
    const messageContent = content || inputValue.trim();
    if (!messageContent || isLoading) return;

    // Stop listening if active
    if (isListening) {
      stopListening();
    }

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: messageContent,
      timestamp: new Date(),
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInputValue("");
    resetTranscript();
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages, config, sessionId: interviewSessionId }),
      });

      if (!response.ok) throw new Error("Failed to get response");

      const data = await response.json();
      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: data.message,
        timestamp: new Date(),
      };

      const updatedMessages = [...newMessages, assistantMessage];
      setMessages(updatedMessages);

      if (data.isComplete) {
        setIsInterviewComplete(true);
        setAutoRunning(false);
      } else if (autoRunRef.current) {
        // Continue auto-run after a short delay
        setTimeout(() => {
          if (autoRunRef.current) {
            generateDemoResponse(updatedMessages);
          }
        }, 1000);
      }

      if (autoSpeak && speechSynthesisSupported) {
        speak(data.message);
      }
    } catch (error) {
      console.error("Failed to send message:", error);
      setAutoRunning(false);
    } finally {
      setIsLoading(false);
    }
  };

  const generateDemoResponse = async (currentMessages?: Message[]) => {
    const msgs = currentMessages || messages;
    if (isInterviewComplete) return;

    try {
      const response = await fetch("/api/demo-response", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: msgs, config }),
      });

      if (!response.ok) throw new Error("Failed to generate demo response");

      const data = await response.json();
      if (data.response) {
        // Directly handle the message sending here instead of calling sendMessage
        // to avoid the isLoading check conflict
        const userMessage: Message = {
          id: crypto.randomUUID(),
          role: "user",
          content: data.response,
          timestamp: new Date(),
        };

        const newMessages = [...msgs, userMessage];
        setMessages(newMessages);
        setIsLoading(true);

        const chatResponse = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: newMessages, config, sessionId: interviewSessionId }),
        });

        if (!chatResponse.ok) throw new Error("Failed to get interviewer response");

        const chatData = await chatResponse.json();
        const assistantMessage: Message = {
          id: crypto.randomUUID(),
          role: "assistant",
          content: chatData.message,
          timestamp: new Date(),
        };

        const updatedMessages = [...newMessages, assistantMessage];
        setMessages(updatedMessages);
        setIsLoading(false);

        if (chatData.isComplete) {
          setIsInterviewComplete(true);
          setAutoRunning(false);
        } else if (autoRunRef.current) {
          // Continue auto-run after a delay
          setTimeout(() => {
            if (autoRunRef.current) {
              generateDemoResponse(updatedMessages);
            }
          }, 1500);
        }

        if (autoSpeak && speechSynthesisSupported) {
          speak(chatData.message);
        }
      }
    } catch (error) {
      console.error("Failed to generate demo response:", error);
      setAutoRunning(false);
      setIsLoading(false);
    }
  };

  const toggleAutoRun = () => {
    if (autoRunning) {
      setAutoRunning(false);
    } else {
      setAutoRunning(true);
      generateDemoResponse();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const toggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      resetTranscript();
      setInputValue("");
      startListening();
    }
  };

  const handleEndInterview = () => {
    setAutoRunning(false);
    // Store session data in sessionStorage for feedback page
    sessionStorage.setItem(
      "interviewSession",
      JSON.stringify({
        messages,
        config,
        sessionId: interviewSessionId,
        completedAt: new Date().toISOString(),
      })
    );
    router.push("/feedback");
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 text-white flex flex-col">
      {/* Header */}
      <header className="border-b border-slate-700 px-4 py-3">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/setup"
              className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="font-semibold">Interview Session</h1>
              {demoMode && (
                <p className="text-sm text-slate-400">Demo Mode</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Demo Mode Toggle */}
            <button
              onClick={() => setDemoMode(!demoMode)}
              className={`p-2 rounded-lg transition-colors ${
                demoMode
                  ? "bg-purple-600 text-white"
                  : "bg-slate-700 text-slate-400"
              }`}
              title={demoMode ? "Demo mode on" : "Demo mode off"}
            >
              <Bot className="w-5 h-5" />
            </button>
            {speechSynthesisSupported && (
              <button
                onClick={() => {
                  if (isSpeaking) {
                    stopSpeaking();
                  }
                  setAutoSpeak(!autoSpeak);
                }}
                className={`p-2 rounded-lg transition-colors ${
                  autoSpeak
                    ? "bg-blue-600 text-white"
                    : "bg-slate-700 text-slate-400"
                }`}
                title={autoSpeak ? "Voice responses on" : "Voice responses off"}
              >
                {autoSpeak ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
              </button>
            )}
            <button
              onClick={handleEndInterview}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 rounded-lg font-medium transition-colors"
            >
              {isInterviewComplete ? "View Feedback" : "End Interview"}
            </button>
          </div>
        </div>
      </header>

      {/* Demo Mode Banner */}
      {demoMode && (
        <div className="bg-purple-900/50 border-b border-purple-700 px-4 py-2">
          <div className="container mx-auto flex items-center justify-between">
            <p className="text-sm text-purple-200">
              <Bot className="w-4 h-4 inline mr-2" />
              Demo Mode: AI generates candidate responses for testing
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => generateDemoResponse()}
                disabled={isLoading || isInterviewComplete}
                className="px-3 py-1 bg-purple-600 hover:bg-purple-700 rounded text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Generate Response
              </button>
              <button
                onClick={toggleAutoRun}
                disabled={isInterviewComplete}
                className={`px-3 py-1 rounded text-sm font-medium flex items-center gap-1 ${
                  autoRunning
                    ? "bg-red-600 hover:bg-red-700"
                    : "bg-green-600 hover:bg-green-700"
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {autoRunning ? (
                  <>
                    <Square className="w-3 h-3" /> Stop
                  </>
                ) : (
                  <>
                    <Play className="w-3 h-3" /> Auto-Run
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto chat-container p-4">
        <div className="container mx-auto max-w-3xl space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${
                message.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-[80%] rounded-lg p-4 ${
                  message.role === "user"
                    ? "bg-blue-600 text-white"
                    : "bg-slate-700 text-white"
                }`}
              >
                {message.role === "assistant" && (
                  <div className="text-xs text-slate-400 mb-1 font-medium">
                    Interviewer
                  </div>
                )}
                <p className="whitespace-pre-wrap">{message.content}</p>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-slate-700 rounded-lg p-4">
                <Loader2 className="w-5 h-5 animate-spin" />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="border-t border-slate-700 p-4">
        <div className="container mx-auto max-w-3xl">
          {isInterviewComplete && (
            <div className="mb-4 p-4 bg-emerald-900/50 border border-emerald-700 rounded-lg text-center">
              <p className="font-medium">Interview Complete!</p>
              <p className="text-sm text-slate-300">
                Click &quot;View Feedback&quot; to see your detailed performance analysis.
              </p>
            </div>
          )}
          <div className="flex items-end gap-2">
            <div className="flex-1 relative">
              <textarea
                ref={inputRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={
                  isListening
                    ? "Listening... speak now"
                    : "Type your response or click the mic to speak..."
                }
                disabled={isLoading || isInterviewComplete}
                className="w-full p-3 pr-12 rounded-lg bg-slate-800 border border-slate-600 text-white placeholder-slate-500 resize-none focus:outline-none focus:border-blue-500 min-h-[48px] max-h-32"
                rows={1}
                style={{
                  height: "auto",
                  minHeight: "48px",
                }}
                onInput={(e) => {
                  const target = e.target as HTMLTextAreaElement;
                  target.style.height = "auto";
                  target.style.height = Math.min(target.scrollHeight, 128) + "px";
                }}
              />
              {isSpeaking && (
                <button
                  onClick={stopSpeaking}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-red-400 hover:text-red-300"
                  title="Stop speaking"
                >
                  <StopCircle className="w-5 h-5" />
                </button>
              )}
            </div>
            {speechRecognitionSupported && (
              <button
                onClick={toggleListening}
                disabled={isLoading || isInterviewComplete}
                className={`p-3 rounded-lg transition-colors ${
                  isListening
                    ? "bg-red-600 text-white animate-pulse-recording"
                    : "bg-slate-700 text-slate-300 hover:bg-slate-600"
                } disabled:opacity-50 disabled:cursor-not-allowed`}
                title={isListening ? "Stop listening" : "Start voice input"}
              >
                {isListening ? (
                  <MicOff className="w-5 h-5" />
                ) : (
                  <Mic className="w-5 h-5" />
                )}
              </button>
            )}
            <button
              onClick={() => sendMessage()}
              disabled={!inputValue.trim() || isLoading || isInterviewComplete}
              className="p-3 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Send message"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function InterviewPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 text-white flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      }
    >
      <InterviewContent />
    </Suspense>
  );
}
