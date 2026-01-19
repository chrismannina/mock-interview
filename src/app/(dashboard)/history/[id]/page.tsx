"use client";

import { useState, useEffect, use } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Clock,
  ChevronDown,
  ChevronUp,
  Loader2,
  Target,
  TrendingUp,
  AlertCircle,
} from "lucide-react";

interface Message {
  id: string;
  role: string;
  content: string;
  timestamp: string;
}

interface QuestionFeedback {
  question: string;
  userAnswer: string;
  feedback: string;
  betterAnswer?: string;
  score: number;
}

interface Feedback {
  id: string;
  overallScore: number;
  strengths: string[];
  areasToImprove: string[];
  questionFeedback: QuestionFeedback[];
  summary: string;
  createdAt: string;
}

interface InterviewSession {
  id: string;
  roleType: string;
  jobDescription?: string;
  status: string;
  startedAt: string;
  endedAt?: string;
  messages: Message[];
  feedback?: Feedback;
}

const roleLabels: Record<string, string> = {
  "director-pharmacy-analytics": "Director of Pharmacy Analytics",
  "software-engineer": "Software Engineer",
  "product-manager": "Product Manager",
  "data-analyst": "Data Analyst",
  general: "General Interview",
};

export default function HistoryDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { data: authSession, status } = useSession();
  const router = useRouter();
  const [session, setSession] = useState<InterviewSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedQuestions, setExpandedQuestions] = useState<Set<number>>(
    new Set()
  );

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login?callbackUrl=/history");
    }
  }, [status, router]);

  useEffect(() => {
    if (authSession?.user && id) {
      fetchSession();
    }
  }, [authSession, id]);

  const fetchSession = async () => {
    try {
      const res = await fetch(`/api/interview/${id}`);
      if (!res.ok) {
        if (res.status === 404) {
          setError("Interview session not found");
        } else {
          throw new Error("Failed to fetch session");
        }
        return;
      }
      const data = await res.json();
      setSession(data.session);
    } catch {
      setError("Failed to load interview session");
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const toggleQuestion = (index: number) => {
    const newExpanded = new Set(expandedQuestions);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedQuestions(newExpanded);
  };

  const getScoreColor = (score: number) => {
    if (score >= 8) return "text-green-400";
    if (score >= 6) return "text-yellow-400";
    return "text-red-400";
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 8) return "bg-green-500/20 border-green-500/30";
    if (score >= 6) return "bg-yellow-500/20 border-yellow-500/30";
    return "bg-red-500/20 border-red-500/30";
  };

  if (status === "loading" || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 mx-auto text-red-500 mb-4" />
          <h2 className="text-xl font-semibold mb-2">
            {error || "Session not found"}
          </h2>
          <Link
            href="/history"
            className="text-blue-400 hover:text-blue-300 transition-colors"
          >
            Back to history
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      {/* Header */}
      <header className="border-b border-slate-700 px-4 py-4">
        <div className="container mx-auto max-w-4xl">
          <div className="flex items-center gap-4">
            <Link
              href="/history"
              className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="flex-1">
              <h1 className="text-2xl font-bold">
                {roleLabels[session.roleType] || session.roleType}
              </h1>
              <div className="flex items-center gap-3 text-sm text-slate-400">
                <span className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4" />
                  {formatDate(session.startedAt)}
                </span>
                <span
                  className={`px-2 py-0.5 rounded text-xs font-medium ${
                    session.status === "completed"
                      ? "bg-green-500/20 text-green-400"
                      : "bg-yellow-500/20 text-yellow-400"
                  }`}
                >
                  {session.status === "completed" ? "Completed" : "In Progress"}
                </span>
              </div>
            </div>
            {session.feedback && (
              <div
                className={`px-4 py-2 rounded-lg border ${getScoreBgColor(
                  session.feedback.overallScore
                )}`}
              >
                <div className="text-xs text-slate-400 mb-0.5">Score</div>
                <div
                  className={`text-2xl font-bold ${getScoreColor(
                    session.feedback.overallScore
                  )}`}
                >
                  {session.feedback.overallScore}/10
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="container mx-auto max-w-4xl px-4 py-8">
        {/* Job Description */}
        {session.jobDescription && (
          <div className="mb-8 bg-slate-800/50 border border-slate-700 rounded-lg p-4">
            <h3 className="text-sm font-medium text-slate-400 mb-2">
              Job Description
            </h3>
            <p className="text-slate-200 whitespace-pre-wrap">
              {session.jobDescription}
            </p>
          </div>
        )}

        {/* Feedback Section */}
        {session.feedback && (
          <div className="mb-8 space-y-6">
            {/* Summary */}
            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Summary</h3>
              <p className="text-slate-300 whitespace-pre-wrap">
                {session.feedback.summary}
              </p>
            </div>

            {/* Strengths & Areas to Improve */}
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-green-400" />
                  Strengths
                </h3>
                <ul className="space-y-2">
                  {session.feedback.strengths.map((strength, i) => (
                    <li key={i} className="flex items-start gap-2 text-slate-300">
                      <span className="text-green-400 mt-1">+</span>
                      {strength}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Target className="w-5 h-5 text-yellow-400" />
                  Areas to Improve
                </h3>
                <ul className="space-y-2">
                  {session.feedback.areasToImprove.map((area, i) => (
                    <li key={i} className="flex items-start gap-2 text-slate-300">
                      <span className="text-yellow-400 mt-1">-</span>
                      {area}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Question-by-Question Feedback */}
            {session.feedback.questionFeedback.length > 0 && (
              <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4">
                  Question-by-Question Breakdown
                </h3>
                <div className="space-y-4">
                  {session.feedback.questionFeedback.map((qf, i) => (
                    <div
                      key={i}
                      className="border border-slate-600 rounded-lg overflow-hidden"
                    >
                      <button
                        onClick={() => toggleQuestion(i)}
                        className="w-full px-4 py-3 flex items-center justify-between bg-slate-700/50 hover:bg-slate-700 transition-colors text-left"
                      >
                        <div className="flex-1 pr-4">
                          <span className="font-medium">Q{i + 1}: </span>
                          <span className="text-slate-300">{qf.question}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span
                            className={`px-2 py-1 rounded text-sm font-medium ${getScoreBgColor(
                              qf.score
                            )} ${getScoreColor(qf.score)}`}
                          >
                            {qf.score}/10
                          </span>
                          {expandedQuestions.has(i) ? (
                            <ChevronUp className="w-5 h-5 text-slate-400" />
                          ) : (
                            <ChevronDown className="w-5 h-5 text-slate-400" />
                          )}
                        </div>
                      </button>
                      {expandedQuestions.has(i) && (
                        <div className="px-4 py-4 space-y-4 bg-slate-800/30">
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
                              <h4 className="text-sm font-medium text-green-400 mb-1">
                                Suggested Better Answer
                              </h4>
                              <p className="text-slate-300">{qf.betterAnswer}</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Transcript */}
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Full Transcript</h3>
          <div className="space-y-4">
            {session.messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${
                  message.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[80%] rounded-lg p-4 ${
                    message.role === "user"
                      ? "bg-blue-600/20 border border-blue-500/30"
                      : "bg-slate-700/50 border border-slate-600"
                  }`}
                >
                  <div className="text-xs text-slate-400 mb-1">
                    {message.role === "user" ? "You" : "Interviewer"}
                  </div>
                  <p className="whitespace-pre-wrap text-slate-200">
                    {message.content}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-8 flex justify-center gap-4">
          <Link
            href="/setup"
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition-colors"
          >
            Practice Again
          </Link>
          <Link
            href="/history"
            className="px-6 py-3 bg-slate-700 hover:bg-slate-600 rounded-lg font-medium transition-colors"
          >
            Back to History
          </Link>
        </div>
      </main>
    </div>
  );
}
