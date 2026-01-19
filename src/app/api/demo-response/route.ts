import { NextRequest, NextResponse } from "next/server";
import { AzureOpenAI } from "openai";
import { Message, InterviewConfig } from "@/types/interview";

const DEMO_SYSTEM_PROMPT = `You are simulating a job candidate in a mock interview. Generate realistic, thoughtful responses as if you were the candidate being interviewed.

Guidelines:
- Give substantive answers (2-4 sentences typically)
- Include specific examples when appropriate
- Sound natural and conversational
- Vary your response style - some answers can be brief, others more detailed
- For technical questions, demonstrate competence but don't be perfect
- For behavioral questions, use the STAR method loosely

Respond ONLY with what the candidate would say. No quotation marks, no "Candidate:" prefix, just the response.`;

function getContextPrompt(config: InterviewConfig): string {
  const roleContexts: Record<string, string> = {
    "director-pharmacy-analytics":
      "You are a candidate with 8+ years in healthcare analytics, experience leading teams, and expertise in pharmacy operations data.",
    "software-engineer":
      "You are a software engineer candidate with 5 years experience in Python, TypeScript, and cloud technologies.",
    "product-manager":
      "You are a product manager candidate with experience in B2B SaaS, user research, and cross-functional leadership.",
    "data-analyst":
      "You are a data analyst candidate skilled in SQL, Python, Tableau, and business intelligence.",
    general:
      "You are a professional candidate with relevant experience for the role being discussed.",
  };

  return roleContexts[config.roleType] || roleContexts.general;
}

export async function POST(request: NextRequest) {
  try {
    const { messages, config } = (await request.json()) as {
      messages: Message[];
      config: InterviewConfig;
    };

    const endpoint = process.env.AZURE_OPENAI_ENDPOINT;
    const apiKey = process.env.AZURE_OPENAI_API_KEY;
    const deploymentName = process.env.AZURE_OPENAI_DEPLOYMENT_NAME;
    const organization = process.env.AZURE_OPENAI_ORGANIZATION;

    if (!endpoint || !apiKey || !deploymentName) {
      return NextResponse.json(
        { error: "Azure OpenAI configuration is missing" },
        { status: 500 }
      );
    }

    const client = new AzureOpenAI({
      endpoint,
      apiKey,
      apiVersion: process.env.AZURE_OPENAI_API_VERSION || "2024-02-15-preview",
      organization: organization || undefined,
    });

    // Get the last interviewer message to respond to
    const lastInterviewerMessage = [...messages]
      .reverse()
      .find((m) => m.role === "assistant");

    if (!lastInterviewerMessage) {
      return NextResponse.json(
        { error: "No interviewer question to respond to" },
        { status: 400 }
      );
    }

    const contextPrompt = getContextPrompt(config);
    const conversationHistory = messages
      .map((m) => `${m.role === "assistant" ? "Interviewer" : "Candidate"}: ${m.content}`)
      .join("\n\n");

    const userPrompt = `${contextPrompt}

Interview so far:
${conversationHistory}

Generate the candidate's response to the interviewer's last message. Be natural and conversational.`;

    const response = await client.chat.completions.create({
      model: deploymentName,
      messages: [
        { role: "system", content: DEMO_SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
      max_completion_tokens: 500,
      temperature: 0.8,
    });

    const candidateResponse = response.choices[0]?.message?.content || "";

    return NextResponse.json({
      response: candidateResponse.trim(),
    });
  } catch (error) {
    console.error("Demo response API error:", error);
    return NextResponse.json(
      { error: "Failed to generate demo response" },
      { status: 500 }
    );
  }
}
