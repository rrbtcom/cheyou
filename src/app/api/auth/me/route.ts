import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const token = req.headers.get("cookie")?.match(/token=([^;]+)/)?.[1];
  if (!token) return NextResponse.json(null);
  const session = await prisma.session.findUnique({ where: { token }, include: { user: true } });
  if (!session || session.expiresAt < new Date()) {
    return NextResponse.json(null);
  }
  return NextResponse.json({ id: session.user.id, phone: session.user.phone, nickname: session.user.nickname, role: session.user.role, avatar: session.user.avatar });
}
