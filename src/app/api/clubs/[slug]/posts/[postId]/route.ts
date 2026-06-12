import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ slug: string; postId: string }> }
) {
  const { slug, postId } = await params;
  const post = await prisma.clubPost.findUnique({
    where: { id: postId },
    include: { club: { where: { slug, status: "active" } } },
  });
  if (!post || !post.club || (post.club as unknown as { slug: string }).slug !== slug) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(post);
}
