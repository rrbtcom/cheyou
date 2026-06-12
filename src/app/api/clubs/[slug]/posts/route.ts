import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const data = await req.json();

  const club = await prisma.club.findUnique({ where: { slug } });
  if (!club) {
    return NextResponse.json({ error: "车友会不存在" }, { status: 404 });
  }

  const post = await prisma.clubPost.create({
    data: {
      clubId: club.id,
      title: data.title,
      content: data.content || null,
      images: data.images || null,
      videoUrl: data.videoUrl || null,
      sourceUrl: data.sourceUrl || null,
      sourcePlatform: data.sourcePlatform || club.sourcePlatform || null,
      publishedAt: data.publishedAt ? new Date(data.publishedAt) : new Date(),
    },
  });

  return NextResponse.json(post, { status: 201 });
}
