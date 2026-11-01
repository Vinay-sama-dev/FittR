import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const dbUrl = process.env.DATABASE_URL || "NOT_SET";
    const maskedUrl = dbUrl.replace(/:([^@]+)@/, ":****@");

    // Test raw query
    await prisma.$queryRaw`SELECT 1`;

    return NextResponse.json({
      status: "ok",
      database: "connected",
      databaseUrlMasked: maskedUrl,
      time: new Date().toISOString(),
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        status: "error",
        errorName: err?.name,
        errorMessage: err?.message,
        errorCode: err?.code,
        databaseUrlMasked: (process.env.DATABASE_URL || "NOT_SET").replace(/:([^@]+)@/, ":****@"),
      },
      { status: 500 }
    );
  }
}

