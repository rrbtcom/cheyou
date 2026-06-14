import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const clubId = searchParams.get("clubId");
  const limit = parseInt(searchParams.get("limit") || "100");
  const offset = parseInt(searchParams.get("offset") || "0");

  const where = clubId ? { clubId } : {};
  const [posts, total] = await Promise.all([
    prisma.clubPost.findMany({
      where,
      include: { club: { select: { name: true, city: true, brand: true } } },
      orderBy: { publishedAt: "desc" },
      take: limit,
      skip: offset,
    }),
    prisma.clubPost.count({ where }),
  ]);

  return NextResponse.json({ posts, total });
}

export async function POST(req: Request) {
  const data = await req.json();
  const post = await prisma.clubPost.create({
    data: {
      clubId: data.clubId,
      title: data.title,
      content: data.content,
      images: data.images || [],
      videoUrl: data.videoUrl || null,
      sourceUrl: data.sourceUrl || null,
      sourcePlatform: data.sourcePlatform || null,
      publishedAt: data.publishedAt ? new Date(data.publishedAt) : new Date(),
    },
  });
  return NextResponse.json(post, { status: 201 });
}
