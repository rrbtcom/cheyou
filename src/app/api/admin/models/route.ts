import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const models = await prisma.model.findMany({ orderBy: { name: "asc" }, include: { brand: true, _count: { select: { articles: true, carSources: true } } } });
  return NextResponse.json(models);
}

export async function POST(req: Request) {
  const data = await req.json();
  const model = await prisma.model.create({ data });
  return NextResponse.json(model, { status: 201 });
}
