import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const clubs = await prisma.club.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { posts: true } } },
  });
  return NextResponse.json(clubs);
}

export async function POST(req: Request) {
  const data = await req.json();
  const slug = data.slug || generateSlug(data.name);
  const club = await prisma.club.create({
    data: {
      name: data.name,
      slug,
      city: data.city || null,
      brand: data.brand || null,
      sourcePlatform: data.sourcePlatform || null,
      sourceUrl: data.sourceUrl || null,
      sourceId: data.sourceId || null,
      avatar: data.avatar || null,
      description: data.description || null,
      status: data.status || "active",
      isAutoCreated: data.isAutoCreated || false,
    },
  });
  return NextResponse.json(club, { status: 201 });
}

function generateSlug(name: string): string {
  const base = name
    .replace(/[\s\-–—]+/g, "-")
    .replace(/[^\w\-\u4e00-\u9fff]/g, "")
    .toLowerCase();
  const rand = Math.random().toString(36).substring(2, 6);
  return `${base}-${rand}`;
}
