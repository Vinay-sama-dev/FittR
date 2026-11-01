import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getUserFromRequest(req);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;
    const body = await req.json();

    // Verify ownership
    const existing = await prisma.tracker.findFirst({
      where: { id, userId: session.userId },
    });

    if (!existing) {
      return NextResponse.json({ error: "Tracker not found" }, { status: 404 });
    }

    const updated = await prisma.tracker.update({
      where: { id },
      data: {
        ...(body.name !== undefined ? { name: body.name.trim() } : {}),
        ...(body.category !== undefined ? { category: body.category } : {}),
        ...(body.unit !== undefined ? { unit: body.unit } : {}),
        ...(body.targetValue !== undefined
          ? {
              targetValue:
                body.targetValue !== null && body.targetValue !== ""
                  ? parseFloat(body.targetValue)
                  : null,
            }
          : {}),
        ...(body.color !== undefined ? { color: body.color } : {}),
        ...(body.icon !== undefined ? { icon: body.icon } : {}),
        ...(body.isArchived !== undefined ? { isArchived: body.isArchived } : {}),
        ...(body.sortOrder !== undefined ? { sortOrder: body.sortOrder } : {}),
      },
    });

    return NextResponse.json({ tracker: updated });
  } catch (error) {
    console.error("Error updating tracker:", error);
    return NextResponse.json(
      { error: "Failed to update tracker" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getUserFromRequest(req);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;

    // Sandbox check: demo users cannot delete shared trackers
    if (session.isDemo) {
      return NextResponse.json(
        { error: "Trackers cannot be deleted in the shared demo environment." },
        { status: 403 }
      );
    }

    const existing = await prisma.tracker.findFirst({
      where: { id, userId: session.userId },
    });

    if (!existing) {
      return NextResponse.json({ error: "Tracker not found" }, { status: 404 });
    }

    await prisma.tracker.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Tracker deleted successfully" });
  } catch (error) {
    console.error("Error deleting tracker:", error);
    return NextResponse.json(
      { error: "Failed to delete tracker" },
      { status: 500 }
    );
  }
}

