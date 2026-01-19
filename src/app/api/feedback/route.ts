import { NextRequest, NextResponse } from "next/server";
import { AzureOpenAI } from "openai";
import { Message, InterviewConfig, InterviewFeedback } from "@/types/interview";

const FEEDBACK_SYSTEM_PROMPT = `You are an expert interview coach analyzing a mock interview. Provide constructive feedback in JSON format.`;

function getFeedbackPrompt(config: InterviewConfig, messages: Message[]): string {
  const conversation = messages
    .map((msg) => `${msg.role === "assistant" ? "Interviewer" : "Candidate"}: ${msg.content}`)
    .join("\n\n");

  const roleLabel =
    config.roleType === "director-pharmacy-analytics"
      ? "Director of Pharmacy Analytics"
      : config.roleType === "software-engineer"
      ? "Software Engineer"
      : config.roleType === "product-manager"
      ? "Product Manager"
      : config.roleType === "data-analyst"
      ? "Data Analyst"
      : "General";

  return `Analyze this ${roleLabel} mock interview and provide feedback.

INTERVIEW TRANSCRIPT:
${conversation}

Respond with a JSON object containing:
- overallScore: number 1-10
- strengths: array of 3-5 specific strengths shown
- areasToImprove: array of 3-5 areas needing improvement
- questionFeedback: array with objects containing question, userAnswer (summary), feedback, betterAnswer, score (1-10)
- summary: 2-3 paragraph overall assessment

Output only valid JSON, starting with { and ending with }`;
}

function extractJSON(content: string): object | null {
  if (!content || content.trim().length === 0) {
    return null;
  }

  // Try direct parse first
  try {
    return JSON.parse(content.trim());
  } catch {
    // Continue to other methods
  }

  // Try to extract from markdown code blocks
  const codeBlockMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlockMatch) {
    try {
      return JSON.parse(codeBlockMatch[1].trim());
    } catch {
      // Continue
    }
  }

  // Try to find JSON object in the content
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    try {
      return JSON.parse(jsonMatch[0]);
    } catch {
      // Continue
    }
  }

  return null;
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

    if (!messages || messages.length === 0) {
      return NextResponse.json(
        { error: "No interview messages to analyze" },
        { status: 400 }
      );
    }

    const client = new AzureOpenAI({
      endpoint,
      apiKey,
      apiVersion: process.env.AZURE_OPENAI_API_VERSION || "2024-02-15-preview",
      organization: organization || undefined,
    });

    const userPrompt = getFeedbackPrompt(config, messages);
    console.log("Feedback request - messages count:", messages.length);

    const response = await client.chat.completions.create({
      model: deploymentName,
      messages: [
        { role: "system", content: FEEDBACK_SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
      max_completion_tokens: 4000,
      temperature: 0.5,
    });

    // Log full response details for debugging
    console.log("Feedback API response details:", {
      finishReason: response.choices[0]?.finish_reason,
      contentLength: response.choices[0]?.message?.content?.length || 0,
      hasRefusal: !!response.choices[0]?.message?.refusal,
      usage: response.usage,
    });

    const content = response.choices[0]?.message?.content || "";
    const refusal = response.choices[0]?.message?.refusal;

    if (refusal) {
      console.error("Model refused to respond:", refusal);
      return NextResponse.json({
        overallScore: 5,
        strengths: ["Interview completed"],
        areasToImprove: ["Feedback temporarily unavailable"],
        questionFeedback: [],
        summary: "The AI was unable to generate feedback at this time. Please try again.",
      });
    }

    if (!content || content.trim().length === 0) {
      console.error("Empty response from model. Finish reason:", response.choices[0]?.finish_reason);
      return NextResponse.json({
        overallScore: 5,
        strengths: ["Interview completed"],
        areasToImprove: ["Feedback generation returned empty response"],
        questionFeedback: [],
        summary: "The feedback service returned an empty response. This may be a temporary issue - please try again.",
      });
    }

    // Log the first 500 chars for debugging
    console.log("Feedback content (first 500 chars):", content.substring(0, 500));

    // Try to parse the JSON response
    let feedback: InterviewFeedback;
    const parsed = extractJSON(content);

    if (parsed && typeof parsed === "object") {
      feedback = parsed as InterviewFeedback;
      // Ensure required fields exist
      feedback.overallScore = feedback.overallScore || 5;
      feedback.strengths = feedback.strengths || [];
      feedback.areasToImprove = feedback.areasToImprove || [];
      feedback.questionFeedback = feedback.questionFeedback || [];
      feedback.summary = feedback.summary || "Feedback generated successfully.";
      console.log("Successfully parsed feedback JSON");
    } else {
      console.error("Failed to parse feedback JSON. Raw content:", content.substring(0, 1000));
      // Return the raw content as summary so user can see what was generated
      feedback = {
        overallScore: 5,
        strengths: ["Interview completed"],
        areasToImprove: ["Feedback format was unexpected"],
        questionFeedback: [],
        summary: content.length > 0 ? content : "Feedback generation encountered an error. Please try again.",
      };
    }

    return NextResponse.json(feedback);
  } catch (error) {
    console.error("Feedback API error:", error);
    return NextResponse.json(
      { error: "Failed to generate feedback" },
      { status: 500 }
    );
  }
}
