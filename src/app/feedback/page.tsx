"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Loader2,
  CheckCircle,
  AlertCircle,
  Star,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import {
  Message,
  InterviewConfig,
  InterviewFeedback,
  QuestionFeedback,
} from "@/types/interview";

interface StoredSession {
  messages: Message[];
  config: InterviewConfig;
  sessionId?: string;
  completedAt: string;
}

export default function FeedbackPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [feedback, setFeedback] = useState<InterviewFeedback | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expandedQuestions, setExpandedQuestions] = useState<Set<number>>(new Set());

  useEffect(() => {
    const sessionData = sessionStorage.getItem("interviewSession");
    if (!sessionData) {
      setError("No interview session found. Please complete an interview first.");
      setIsLoading(false);
      return;
    }

    const session: StoredSession = JSON.parse(sessionData);
    generateFeedback(session);
  }, []);

  const generateFeedback = async (session: StoredSession) => {
    try {
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: session.messages,
          config: session.config,
          sessionId: session.sessionId,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate feedback");
      }

      const data = await response.json();
      setFeedback(data);
    } catch (err) {
      setError("Failed to generate feedback. Please try again.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleQuestion = (index: number) => {
    setExpandedQuestions((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  const getScoreColor = (score: number) => {
    if (score >= 8) return "text-emerald-400";
    if (score >= 6) return "text-yellow-400";
    return "text-red-400";
  };

  const getScoreBg = (score: number) => {
    if (score >= 8) return "bg-emerald-900/30 border-emerald-700";
    if (score >= 6) return "bg-yellow-900/30 border-yellow-700";
    return "bg-red-900/30 border-red-700";
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 text-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4" />
          <p className="text-lg">Analyzing your interview performance...</p>
          <p className="text-sm text-slate-400 mt-2">This may take a moment</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 text-white flex items-center justify-center">
        <div className="text-center max-w-md">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <p className="text-lg mb-4">{error}</p>
          <Link
            href="/setup"
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg font-medium transition-colors"
          >
            Start New Interview <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </div>
    );
  }

  if (!feedback) return null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 text-white">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link
            href="/"
            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Home
          </Link>
          <h1 className="text-2xl font-bold">Interview Feedback</h1>
        </div>

        <div className="max-w-4xl mx-auto space-y-8">
          {/* Overall Score */}
          <section
            className={`rounded-xl p-6 border ${getScoreBg(feedback.overallScore)}`}
          >
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold mb-1">Overall Score</h2>
                <p className="text-slate-400">Based on your interview performance</p>
              </div>
              <div className="text-center">
                <div
                  className={`text-5xl font-bold ${getScoreColor(
                    feedback.overallScore
                  )}`}
                >
                  {feedback.overallScore}
                </div>
                <div className="text-sm text-slate-400">out of 10</div>
              </div>
            </div>
          </section>

          {/* Strengths & Areas to Improve */}
          <div className="grid md:grid-cols-2 gap-6">
            <section className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
              <div className="flex items-center gap-2 mb-4">
                <CheckCircle className="w-5 h-5 text-emerald-400" />
                <h2 className="text-lg font-semibold">Strengths</h2>
              </div>
              <ul className="space-y-2">
                {feedback.strengths.map((strength, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <Star className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                    <span className="text-slate-300">{strength}</span>
                  </li>
                ))}
              </ul>
            </section>

            <section className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
              <div className="flex items-center gap-2 mb-4">
                <AlertCircle className="w-5 h-5 text-yellow-400" />
                <h2 className="text-lg font-semibold">Areas to Improve</h2>
              </div>
              <ul className="space-y-2">
                {feedback.areasToImprove.map((area, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-yellow-400 mt-0.5 flex-shrink-0">•</span>
                    <span className="text-slate-300">{area}</span>
                  </li>
                ))}
              </ul>
            </section>
          </div>

          {/* Question-by-Question Feedback */}
          {feedback.questionFeedback.length > 0 && (
            <section className="bg-slate-800/50 rounded-xl border border-slate-700 overflow-hidden">
              <div className="p-6 border-b border-slate-700">
                <h2 className="text-lg font-semibold">Question-by-Question Feedback</h2>
                <p className="text-sm text-slate-400 mt-1">
                  Click on each question to see detailed feedback
                </p>
              </div>
              <div className="divide-y divide-slate-700">
                {feedback.questionFeedback.map(
                  (qf: QuestionFeedback, index: number) => (
                    <div key={index}>
                      <button
                        onClick={() => toggleQuestion(index)}
                        className="w-full p-4 flex items-center justify-between hover:bg-slate-700/50 transition-colors text-left"
                      >
                        <div className="flex-1 pr-4">
                          <p className="font-medium">{qf.question}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span
                            className={`font-semibold ${getScoreColor(qf.score)}`}
                          >
                            {qf.score}/10
                          </span>
                          {expandedQuestions.has(index) ? (
                            <ChevronUp className="w-5 h-5 text-slate-400" />
                          ) : (
                            <ChevronDown className="w-5 h-5 text-slate-400" />
                          )}
                        </div>
                      </button>
                      {expandedQuestions.has(index) && (
                        <div className="p-4 bg-slate-900/50 border-t border-slate-700 space-y-4">
                          <div>
                            <h4 className="text-sm font-medium text-slate-400 mb-1">
                              Your Answer
                            </h4>
                            <p className="text-slate-300">{qf.userAnswer}</p>
                          </div>
                          <div>
                            <h4 className="text-sm font-medium text-slate-400 mb-1">
                              Feedback
                            </h4>
                            <p className="text-slate-300">{qf.feedback}</p>
                          </div>
                          {qf.betterAnswer && (
                            <div>
                              <h4 className="text-sm font-medium text-emerald-400 mb-1">
                                Example Stronger Answer
                              </h4>
                              <p className="text-slate-300 bg-emerald-900/20 p-3 rounded-lg border border-emerald-900">
                                {qf.betterAnswer}
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )
                )}
              </div>
            </section>
          )}

          {/* Summary */}
          <section className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
            <h2 className="text-lg font-semibold mb-4">Summary & Next Steps</h2>
            <div className="prose prose-invert max-w-none">
              <p className="text-slate-300 whitespace-pre-wrap">{feedback.summary}</p>
            </div>
          </section>

          {/* Actions */}
          <div className="flex flex-wrap gap-4 justify-center">
            <Link
              href="/setup"
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg font-medium transition-colors"
            >
              Practice Again <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/"
              className="inline-flex items-center gap-2 bg-slate-700 hover:bg-slate-600 px-6 py-3 rounded-lg font-medium transition-colors"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
