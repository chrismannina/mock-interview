"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { ROLE_OPTIONS, RoleType } from "@/types/interview";

export default function SetupPage() {
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState<RoleType | null>(null);
  const [jobDescription, setJobDescription] = useState("");

  const handleStartInterview = () => {
    if (!selectedRole) return;

    const params = new URLSearchParams({
      role: selectedRole,
    });
    if (jobDescription.trim()) {
      params.set("jd", encodeURIComponent(jobDescription.trim()));
    }

    router.push(`/interview?${params.toString()}`);
  };

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
            Back
          </Link>
          <h1 className="text-2xl font-bold">Interview Setup</h1>
        </div>

        <div className="max-w-3xl mx-auto space-y-8">
          {/* Role Selection */}
          <section>
            <h2 className="text-xl font-semibold mb-4">Select Role Type</h2>
            <div className="grid gap-3">
              {ROLE_OPTIONS.map((role) => (
                <button
                  key={role.id}
                  onClick={() => setSelectedRole(role.id)}
                  className={`p-4 rounded-lg border text-left transition-all ${
                    selectedRole === role.id
                      ? "border-blue-500 bg-blue-500/20"
                      : "border-slate-600 bg-slate-800/50 hover:border-slate-500"
                  }`}
                >
                  <div className="font-medium">{role.label}</div>
                  <div className="text-sm text-slate-400">{role.description}</div>
                </button>
              ))}
            </div>
          </section>

          {/* Job Description */}
          <section>
            <h2 className="text-xl font-semibold mb-2">Job Description (Optional)</h2>
            <p className="text-sm text-slate-400 mb-4">
              Paste a job description to get questions tailored to the specific role.
            </p>
            <textarea
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Paste the job description here..."
              className="w-full h-48 p-4 rounded-lg bg-slate-800 border border-slate-600 text-white placeholder-slate-500 resize-none focus:outline-none focus:border-blue-500"
            />
          </section>

          {/* Start Button */}
          <div className="flex justify-end">
            <button
              onClick={handleStartInterview}
              disabled={!selectedRole}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-colors ${
                selectedRole
                  ? "bg-blue-600 hover:bg-blue-700 text-white"
                  : "bg-slate-700 text-slate-400 cursor-not-allowed"
              }`}
            >
              Start Interview <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
