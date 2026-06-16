import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import fs from "fs";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

export async function POST() {
  try {
    const raw = fs.readFileSync("/tmp/sales_rank_data.json", "utf8");
    const data = JSON.parse(raw);
    let inserted = 0, skipped = 0;

    for (const item of data) {
      const uniqueKey = `${item.period}-${item.rankType}-${item.rank}-${item.source}`;
      try {
        await prisma.salesRank.create({
          data: {
            id: uniqueKey,
            period: item.period,
            rankType: item.rankType,
            rank: item.rank,
            brand: item.brand,
            model: item.model,
            sales: item.sales,
            YoY: item.YoY ?? null,
            MoM: item.MoM ?? null,
            source: item.source,
            sourceUrl: item.sourceUrl || null,
          },
        });
        inserted++;
      } catch (e: any) {
        if (e.code === "P2002") {
          skipped++;
        } else {
          throw e;
        }
      }
    }

    const total = await prisma.salesRank.count();
    return NextResponse.json({ ok: true, inserted, skipped, total, period: data[0]?.period });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
