import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/interview/[id] - Get a specific interview session with messages and feedback
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;

    const interviewSession = await prisma.interviewSession.findUnique({
      where: {
        id,
        userId: session.user.id, // Ensure user owns this session
      },
      include: {
        messages: {
          orderBy: {
            timestamp: "asc",
          },
        },
        feedback: true,
      },
    });

    if (!interviewSession) {
      return NextResponse.json(
        { error: "Interview session not found" },
        { status: 404 }
      );
    }

    // Parse JSON fields in feedback
    let parsedFeedback = null;
    if (interviewSession.feedback) {
      parsedFeedback = {
        id: interviewSession.feedback.id,
        overallScore: interviewSession.feedback.overallScore,
        strengths: JSON.parse(interviewSession.feedback.strengths),
        areasToImprove: JSON.parse(interviewSession.feedback.areasToImprove),
        questionFeedback: JSON.parse(interviewSession.feedback.questionFeedback),
        summary: interviewSession.feedback.summary,
        createdAt: interviewSession.feedback.createdAt,
      };
    }

    return NextResponse.json({
      session: {
        id: interviewSession.id,
        roleType: interviewSession.roleType,
        jobDescription: interviewSession.jobDescription,
        status: interviewSession.status,
        startedAt: interviewSession.startedAt,
        endedAt: interviewSession.endedAt,
        messages: interviewSession.messages.map((m) => ({
          id: m.id,
          role: m.role,
          content: m.content,
          timestamp: m.timestamp,
        })),
        feedback: parsedFeedback,
      },
    });
  } catch (error) {
    console.error("Error fetching interview session:", error);
    return NextResponse.json(
      { error: "Failed to fetch interview session" },
      { status: 500 }
    );
  }
}

// PATCH /api/interview/[id] - Update interview session (e.g., mark as complete)
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;
    const body = await request.json();

    const interviewSession = await prisma.interviewSession.update({
      where: {
        id,
        userId: session.user.id,
      },
      data: {
        status: body.status,
        endedAt: body.status === "completed" ? new Date() : undefined,
      },
    });

    return NextResponse.json({
      session: interviewSession,
    });
  } catch (error) {
    console.error("Error updating interview session:", error);
    return NextResponse.json(
      { error: "Failed to update interview session" },
      { status: 500 }
    );
  }
}
