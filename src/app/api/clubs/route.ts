import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const city = searchParams.get("city");
  const brand = searchParams.get("brand");
  const category = searchParams.get("category");

  const where: Record<string, unknown> = { status: "active" };
  if (city) where.city = city;
  if (brand) where.brand = brand;
  if (category) where.category = category;

  const clubs = await prisma.club.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: { posts: { orderBy: { publishedAt: "desc" }, take: 3 } },
  });
  return NextResponse.json(clubs);
}
