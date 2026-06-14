import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const post = await prisma.clubPost.findUnique({ where: { id } });
  return NextResponse.json(post);
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await req.json();
  const updateData: Record<string, unknown> = {};
  if (data.title !== undefined) updateData.title = data.title;
  if (data.content !== undefined) updateData.content = data.content;
  if (data.images !== undefined) updateData.images = data.images;
  if (data.videoUrl !== undefined) updateData.videoUrl = data.videoUrl || null;
  if (data.sourceUrl !== undefined) updateData.sourceUrl = data.sourceUrl || null;
  if (data.sourcePlatform !== undefined) updateData.sourcePlatform = data.sourcePlatform || null;
  if (data.publishedAt !== undefined) updateData.publishedAt = new Date(data.publishedAt);

  const post = await prisma.clubPost.update({ where: { id }, data: updateData });
  return NextResponse.json(post);
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await prisma.clubPost.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
