import { NextRequest, NextResponse } from "next/server";
import { AzureOpenAI } from "openai";
import { Message, InterviewConfig } from "@/types/interview";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function getSystemPrompt(config: InterviewConfig): string {
  const roleContext = getRoleContext(config.roleType);
  const jobContext = config.jobDescription
    ? `\n\nThe candidate is applying for a position with the following job description:\n${config.jobDescription}`
    : "";

  return `You are an experienced interviewer conducting a job interview. ${roleContext}${jobContext}

Guidelines:
- Start with a brief introduction and a warm-up question
- Ask follow-up questions based on the candidate's responses
- Mix behavioral, situational, and role-specific questions
- Be professional but conversational
- Conduct 5-7 questions total
- Ask ONE question at a time, then wait for the response

IMPORTANT - Ending the interview:
- When you ask your FINAL question, just ask the question and wait for the response
- Do NOT say "this concludes the interview" or similar when asking a question
- Only AFTER the candidate has answered the final question, in your NEXT response, thank them and conclude
- Add "[INTERVIEW_COMPLETE]" ONLY in the response where you're thanking them and ending (not when asking questions)

Begin the interview with a friendly introduction.`;
}

function getRoleContext(roleType: string): string {
  const contexts: Record<string, string> = {
    "director-pharmacy-analytics":
      "You are interviewing for a Director of Pharmacy Analytics position. Focus on healthcare analytics experience, leadership skills, pharmacy operations knowledge, data-driven decision making, and team management.",
    "software-engineer":
      "You are interviewing for a Software Engineer position. Focus on coding skills, system design, problem-solving abilities, collaboration, and technical knowledge relevant to the role.",
    "product-manager":
      "You are interviewing for a Product Manager position. Focus on product strategy, user research, stakeholder management, prioritization frameworks, and cross-functional leadership.",
    "data-analyst":
      "You are interviewing for a Data Analyst position. Focus on data analysis skills, SQL/Python proficiency, visualization experience, business acumen, and communication of insights.",
    general:
      "You are conducting a general interview. Focus on common behavioral questions, situational scenarios, and assessing the candidate's overall communication and problem-solving skills.",
  };
  return contexts[roleType] || contexts.general;
}

export async function POST(request: NextRequest) {
  try {
    const { messages, config, sessionId } = (await request.json()) as {
      messages: Message[];
      config: InterviewConfig;
      sessionId?: string;
    };

    // Get auth session for potential message persistence
    const authSession = await auth();

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

    const systemPrompt = getSystemPrompt(config);

    const chatMessages = [
      { role: "system" as const, content: systemPrompt },
      ...messages.map((msg) => ({
        role: msg.role as "assistant" | "user",
        content: msg.content,
      })),
    ];

    const response = await client.chat.completions.create({
      model: deploymentName,
      messages: chatMessages,
      max_completion_tokens: 1000,
      temperature: 0.7,
    });

    const assistantMessage = response.choices[0]?.message?.content || "";
    const isComplete = assistantMessage.includes("[INTERVIEW_COMPLETE]");
    const cleanedMessage = assistantMessage.replace("[INTERVIEW_COMPLETE]", "").trim();

    // Save messages to database if user is authenticated and sessionId is provided
    if (authSession?.user?.id && sessionId) {
      try {
        // Get the last user message (if any) and the new assistant message
        const lastUserMessage = messages.length > 0 ? messages[messages.length - 1] : null;

        // Create messages to save (only the latest exchange)
        const messagesToSave = [];

        if (lastUserMessage && lastUserMessage.role === "user") {
          messagesToSave.push({
            sessionId,
            role: "user",
            content: lastUserMessage.content,
            timestamp: new Date(lastUserMessage.timestamp),
          });
        }

        messagesToSave.push({
          sessionId,
          role: "assistant",
          content: cleanedMessage,
          timestamp: new Date(),
        });

        await prisma.interviewMessage.createMany({
          data: messagesToSave,
        });

        // If interview is complete, update the session status
        if (isComplete) {
          await prisma.interviewSession.update({
            where: { id: sessionId },
            data: {
              status: "completed",
              endedAt: new Date(),
            },
          });
        }
      } catch (dbError) {
        // Log but don't fail the request if DB save fails
        console.error("Failed to save messages to database:", dbError);
      }
    }

    return NextResponse.json({
      message: cleanedMessage,
      isComplete,
    });
  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      { error: "Failed to generate response" },
      { status: 500 }
    );
  }
}
