import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import fs from "fs";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const brandToSlug: Record<string, string> = {
  "长城": "rv-club",
  "上汽大通": "rv-club",
  "金冠": "rv-club",
  "宇通": "rv-club",
  "江铃旅居": "rv-club",
  "旌航": "rv-club",
  "法美瑞": "rv-club",
  "戴德": "rv-club",
  "览众": "rv-club",
  "新星": "rv-club",
  "房车通用": "rv-club",
};

export async function POST() {
  try {
    const raw = fs.readFileSync("/tmp/merge_v9_data.json", "utf8");
    const data = JSON.parse(raw);
    let inserted = 0, skipped = 0, noClub = 0;

    const club = await prisma.club.findUnique({ where: { slug: "rv-club" } });
    if (!club) return NextResponse.json({ ok: false, error: "rv-club not found" });

    const existing = await prisma.clubPost.findMany({
      where: { clubId: club.id },
      select: { sourceUrl: true },
    });
    const existingSet = new Set(existing.map((e) => e.sourceUrl));

    for (const item of data) {
      const slug = brandToSlug[item.brand as string];
      if (!slug) { noClub++; continue; }
      const key = item.sourceUrl || "";
      if (existingSet.has(key)) { skipped++; continue; }
      await prisma.clubPost.create({
        data: {
          clubId: club.id,
          title: item.title || "无标题",
          content: item.summary || null,
          images: null,
          videoUrl: null,
          sourceUrl: item.sourceUrl || null,
          sourcePlatform: item.sourcePlatform || null,
          publishedAt: item.publishedAt ? new Date(item.publishedAt) : new Date(),
        },
      });
      inserted++;
      existingSet.add(key);
    }

    const total = await prisma.clubPost.count();
    return NextResponse.json({ ok: true, inserted, skipped, noClub, total });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
