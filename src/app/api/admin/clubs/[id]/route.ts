import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const data = await req.json();
  const club = await prisma.club.update({
    where: { id },
    data,
  });
  return NextResponse.json(club);
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  // Delete posts first
  await prisma.clubPost.deleteMany({ where: { clubId: id } });
  await prisma.club.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
