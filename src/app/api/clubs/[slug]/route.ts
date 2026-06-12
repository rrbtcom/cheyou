import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const club = await prisma.club.findUnique({
    where: { slug, status: "active" },
    include: { posts: { orderBy: { publishedAt: "desc" } } },
  });
  if (!club) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(club);
}
