"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Clock,
  MessageSquare,
  TrendingUp,
  ChevronRight,
  Loader2,
  FileText,
} from "lucide-react";

interface InterviewSessionSummary {
  id: string;
  roleType: string;
  jobDescription?: string;
  status: string;
  startedAt: string;
  endedAt?: string;
  messageCount: number;
  overallScore?: number;
}

const roleLabels: Record<string, string> = {
  "director-pharmacy-analytics": "Director of Pharmacy Analytics",
  "software-engineer": "Software Engineer",
  "product-manager": "Product Manager",
  "data-analyst": "Data Analyst",
  general: "General Interview",
};

export default function HistoryPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [sessions, setSessions] = useState<InterviewSessionSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login?callbackUrl=/history");
    }
  }, [status, router]);

  useEffect(() => {
    if (session?.user) {
      fetchSessions();
    }
  }, [session]);

  const fetchSessions = async () => {
    try {
      const res = await fetch("/api/interview");
      if (!res.ok) throw new Error("Failed to fetch sessions");
      const data = await res.json();
      setSessions(data.sessions);
    } catch {
      setError("Failed to load interview history");
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const getScoreColor = (score: number) => {
    if (score >= 8) return "text-green-400";
    if (score >= 6) return "text-yellow-400";
    return "text-red-400";
  };

  if (status === "loading" || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      {/* Header */}
      <header className="border-b border-slate-700 px-4 py-4">
        <div className="container mx-auto max-w-4xl">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold">Interview History</h1>
              <p className="text-slate-400 text-sm">
                Review your past interviews and feedback
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="container mx-auto max-w-4xl px-4 py-8">
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/50 rounded-lg text-red-400">
            {error}
          </div>
        )}

        {sessions.length === 0 ? (
          <div className="text-center py-16">
            <FileText className="w-16 h-16 mx-auto text-slate-600 mb-4" />
            <h2 className="text-xl font-semibold mb-2">No interviews yet</h2>
            <p className="text-slate-400 mb-6">
              Start practicing to build your interview history
            </p>
            <Link
              href="/setup"
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition-colors"
            >
              Start Practicing
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {sessions.map((s) => (
              <Link
                key={s.id}
                href={`/history/${s.id}`}
                className="block bg-slate-800/50 border border-slate-700 rounded-lg p-5 hover:bg-slate-800 hover:border-slate-600 transition-all group"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-lg">
                        {roleLabels[s.roleType] || s.roleType}
                      </h3>
                      <span
                        className={`px-2 py-0.5 rounded text-xs font-medium ${
                          s.status === "completed"
                            ? "bg-green-500/20 text-green-400"
                            : "bg-yellow-500/20 text-yellow-400"
                        }`}
                      >
                        {s.status === "completed" ? "Completed" : "In Progress"}
                      </span>
                    </div>

                    {s.jobDescription && (
                      <p className="text-slate-400 text-sm mb-3 line-clamp-2">
                        {s.jobDescription}
                      </p>
                    )}

                    <div className="flex items-center gap-6 text-sm text-slate-400">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-4 h-4" />
                        {formatDate(s.startedAt)}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <MessageSquare className="w-4 h-4" />
                        {s.messageCount} messages
                      </div>
                      {s.overallScore !== undefined && (
                        <div className="flex items-center gap-1.5">
                          <TrendingUp className="w-4 h-4" />
                          <span className={getScoreColor(s.overallScore)}>
                            Score: {s.overallScore}/10
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <ChevronRight className="w-5 h-5 text-slate-500 group-hover:text-white transition-colors" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
