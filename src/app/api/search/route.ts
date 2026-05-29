import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim();
  if (!q || q.length < 1) {
    return NextResponse.json({ models: [], articles: [], carSources: [], brands: [] });
  }

  const words = q.split(/\s+/).filter(Boolean);

  const [models, articles, carSources, brands] = await Promise.all([
    prisma.model.findMany({
      where: {
        status: "active",
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { brand: { name: { contains: q, mode: "insensitive" } } },
          { level: { contains: q, mode: "insensitive" } },
          { evType: { contains: q, mode: "insensitive" } },
          ...(words.length > 1
            ? words.map((w) => ({ name: { contains: w, mode: "insensitive" as const } }))
            : []),
        ],
      },
      include: { brand: true },
      take: 20,
      orderBy: { createdAt: "desc" },
    }),
    prisma.article.findMany({
      where: {
        publishedAt: { not: null },
        OR: [
          { title: { contains: q, mode: "insensitive" } },
          { content: { contains: q, mode: "insensitive" } },
        ],
      },
      include: { model: { include: { brand: true } } },
      take: 20,
      orderBy: { publishedAt: "desc" },
    }),
    prisma.carSource.findMany({
      where: {
        status: "active",
        OR: [
          { model: { name: { contains: q, mode: "insensitive" } } },
          { model: { brand: { name: { contains: q, mode: "insensitive" } } } },
          { city: { contains: q, mode: "insensitive" } },
          { description: { contains: q, mode: "insensitive" } },
        ],
      },
      include: { model: { include: { brand: true } } },
      take: 20,
      orderBy: { publishedAt: "desc" },
    }),
    prisma.brand.findMany({
      where: {
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { country: { contains: q, mode: "insensitive" } },
        ],
      },
      include: { models: { where: { status: "active" }, take: 5, orderBy: { createdAt: "desc" } } },
      take: 10,
    }),
  ]);

  return NextResponse.json({ models, articles, carSources, brands });
}
