import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const startSessionSchema = z.object({
  roleType: z.string(),
  jobDescription: z.string().optional(),
});

// POST /api/interview - Start a new interview session
export async function POST(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const parsed = startSessionSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input" },
        { status: 400 }
      );
    }

    const { roleType, jobDescription } = parsed.data;

    const interviewSession = await prisma.interviewSession.create({
      data: {
        userId: session.user.id,
        roleType,
        jobDescription,
        status: "active",
      },
    });

    return NextResponse.json({
      sessionId: interviewSession.id,
    });
  } catch (error) {
    console.error("Error starting interview session:", error);
    return NextResponse.json(
      { error: "Failed to start interview session" },
      { status: 500 }
    );
  }
}

// GET /api/interview - List user's interview sessions
export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const interviewSessions = await prisma.interviewSession.findMany({
      where: {
        userId: session.user.id,
      },
      include: {
        feedback: {
          select: {
            overallScore: true,
          },
        },
        _count: {
          select: {
            messages: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({
      sessions: interviewSessions.map((s) => ({
        id: s.id,
        roleType: s.roleType,
        jobDescription: s.jobDescription,
        status: s.status,
        startedAt: s.startedAt,
        endedAt: s.endedAt,
        messageCount: s._count.messages,
        overallScore: s.feedback?.overallScore,
      })),
    });
  } catch (error) {
    console.error("Error fetching interview sessions:", error);
    return NextResponse.json(
      { error: "Failed to fetch interview sessions" },
      { status: 500 }
    );
  }
}
