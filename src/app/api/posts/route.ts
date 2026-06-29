import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const brand = searchParams.get("brand");
  const clubId = searchParams.get("clubId");
  const category = searchParams.get("category");
  const take = parseInt(searchParams.get("take") || "200");
  const skip = parseInt(searchParams.get("skip") || "0");

  const where: Record<string, unknown> = {};
  if (brand) where.club = { brand };
  if (clubId) where.clubId = clubId;
  if (category) where.club = { ...(where.club as Record<string, unknown> || {}), category };

  const [posts, total] = await Promise.all([
    prisma.clubPost.findMany({
      where,
      orderBy: { publishedAt: "desc" },
      take,
      skip,
      include: {
        club: {
          select: { id: true, name: true, brand: true, slug: true },
        },
      },
    }),
    prisma.clubPost.count({ where }),
  ]);

  return NextResponse.json({ posts, total });
}
