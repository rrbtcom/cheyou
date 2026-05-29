import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const sources = await prisma.carSource.findMany({ orderBy: { createdAt: "desc" }, include: { model: { include: { brand: true } }, seller: true } });
  return NextResponse.json(sources);
}

export async function POST(req: Request) {
  const data = await req.json();
  const source = await prisma.carSource.create({ data: { ...data, status: "active", publishedAt: new Date() } });
  return NextResponse.json(source, { status: 201 });
}
