"use client";

import Link from "next/link";
import { ArrowRight, Mic, MessageSquare, BarChart3, Users } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 text-white">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <nav className="flex justify-between items-center mb-16">
          <h1 className="text-2xl font-bold">Round Zero</h1>
        </nav>

        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-5xl font-bold mb-6 bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
            Ace Your Next Interview
          </h2>
          <p className="text-xl text-slate-300 mb-8 max-w-2xl mx-auto">
            Practice with an AI interviewer that adapts to your role. Get realistic questions,
            real-time conversation, and actionable feedback to land your dream job.
          </p>
          <Link
            href="/setup"
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-lg text-lg font-semibold transition-colors"
          >
            Start Practicing <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </div>

      {/* Features Section */}
      <div className="container mx-auto px-4 py-16">
        <h3 className="text-3xl font-bold text-center mb-12">How It Works</h3>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
          <FeatureCard
            icon={<Users className="w-8 h-8" />}
            title="Choose Your Role"
            description="Select from various job types or paste a specific job description for tailored questions."
          />
          <FeatureCard
            icon={<MessageSquare className="w-8 h-8" />}
            title="Real Interview Flow"
            description="Experience a realistic interview with follow-up questions based on your responses."
          />
          <FeatureCard
            icon={<Mic className="w-8 h-8" />}
            title="Voice Conversation"
            description="Speak naturally with voice input and listen to AI responses for a realistic experience."
          />
          <FeatureCard
            icon={<BarChart3 className="w-8 h-8" />}
            title="Detailed Feedback"
            description="Get specific feedback on each answer with suggestions for improvement."
          />
        </div>
      </div>

      {/* CTA Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-3xl mx-auto bg-slate-800/50 rounded-2xl p-8 text-center border border-slate-700">
          <h3 className="text-2xl font-bold mb-4">Ready to Practice?</h3>
          <p className="text-slate-300 mb-6">
            No sign-up required. Start your mock interview in seconds.
          </p>
          <Link
            href="/setup"
            className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
          >
            Begin Interview Setup <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-8 border-t border-slate-700">
        <p className="text-center text-slate-400">
          Round Zero - AI-Powered Interview Practice
        </p>
      </footer>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700 hover:border-slate-600 transition-colors">
      <div className="text-blue-400 mb-4">{icon}</div>
      <h4 className="text-lg font-semibold mb-2">{title}</h4>
      <p className="text-slate-400 text-sm">{description}</p>
    </div>
  );
}
