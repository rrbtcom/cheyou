import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim() || "";

  const where = q
    ? {
        status: "active" as const,
        OR: [
          { name: { contains: q, mode: "insensitive" as const } },
          { brand: { name: { contains: q, mode: "insensitive" as const } } },
        ],
      }
    : { status: "active" as const };

  const models = await prisma.model.findMany({
    where,
    include: { brand: true },
    take: 30,
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(models);
}
