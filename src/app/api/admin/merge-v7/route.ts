import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import fs from "fs";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});
const prisma = new PrismaClient({ adapter });

const brandToSlug: Record<string, string | null> = {
  "比亚迪": "比亚迪车友会-szrh",
  "吉利": "吉利车友会-fmdg",
  "坦克": "坦克车友会-869c",
  "领克": "领克车友会-fa04",
  "蔚来": "蔚来车友会-y6qw",
  "小鹏": "小鹏车友会-pcrc",
  "理想": "理想车友会-uqsw",
  "传祺": "传祺车友会-tv02",
  "五菱": "五菱车友会-uogo",
  "长安": "长安车友会-sf32",
  "本田": "本田车友会-7err",
  "丰田": "丰田车友会-y2fs",
  "日产": "日产车友会-h9jj",
  "大众": "大众车友会-3zz5",
  "奥迪": "奥迪车友会-d4ep",
  "宝马": "宝马车友会-n4fh",
  "奔驰": "奔驰车友会-e6ue",
  "保时捷": "保时捷车友会-6d9d",
  "凯迪拉克": "凯迪拉克车友会-3f5d",
  "Jeep": "Jeep车友会-5e9a",
  "标致": "标致车友会-2ge4",
  "雪铁龙": "雪铁龙车友会-bcg6",
  "东风风神": "东风风神车友会-647f",
  "英菲尼迪": "英菲尼迪车友会-6d0d",
  "起亚": "起亚车友会-4m43",
  "现代": "现代车友会-yc3r",
  "三菱": "三菱车友会-wsw2",
  "福特": "福特车友会-6w40",
  "雪佛兰": "雪佛兰车友会-38fl",
  "别克": "别克车友会-n14u",
  "马自达": "马自达车友会-5bmp",
  "斯巴鲁": "斯巴鲁车友会-743a",
  "魏牌": "魏牌车友会-h0ig",
  "奕派": "奕派车友会-4ce6",
  "岚图": "岚图车友会-ihd7",
  "埃安": "埃安车友会-4qqi",
  "零跑": "零跑车友会-ujj2",
  "哪吒": "哪吒车友会-bxzh",
  "极氪": "极氪车友会-7909",
  "小米": "小米车友会-l30m",
  "阿维塔": "阿维塔车友会-wteg",
  "智己": "智己车友会-d270",
  "深蓝": "深蓝车友会-l1a2",
  "红旗": "红旗车友会-bcrq",
  "沃尔沃": "沃尔沃车友会-1394",
  "捷豹": "捷豹车友会-ef50",
  "特斯拉": null,
};

export async function POST() {
  try {
    const raw = fs.readFileSync("/tmp/merge_v7_data.json", "utf8");
    const data = JSON.parse(raw);
    let inserted = 0, skipped = 0, noClub = 0;
    const errors = [];
    const clubs = await prisma.club.findMany();
    const slugToClub: Record<string, typeof clubs[0]> = {};
    for (const c of clubs) { slugToClub[c.slug] = c; }
    const existing = await prisma.clubPost.findMany({ select: { clubId: true, sourceUrl: true } });
    const existingSet = new Set<string>();
    for (const e of existing) { existingSet.add(`${e.clubId}|${e.sourceUrl}`); }
    for (const item of data) {
      const slug = brandToSlug[item.brand as string];
      if (!slug) { noClub++; continue; }
      const club = slugToClub[slug];
      if (!club) { noClub++; continue; }
      const key = `${club.id}|${item.sourceUrl}`;
      if (existingSet.has(key)) { skipped++; continue; }
      try {
        await prisma.clubPost.create({
          data: {
            clubId: club.id,
            title: item.title || "无标题",
            content: item.summary || null,
            images: null,
            videoUrl: null,
            sourceUrl: item.sourceUrl,
            sourcePlatform: item.sourcePlatform || null,
            publishedAt: item.publishedAt ? new Date(item.publishedAt) : new Date(),
          },
        });
        inserted++;
        existingSet.add(key);
      } catch (e: any) {
        errors.push({ title: item.title.substring(0, 50), error: e.message.substring(0, 100) });
      }
    }
    const total = await prisma.clubPost.count();
    return NextResponse.json({ ok: true, inserted, skipped, noClub, errors: errors.slice(0, 5), total });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
