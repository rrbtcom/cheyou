import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import fs from "fs";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});
const prisma = new PrismaClient({ adapter });

// 品牌关键词到 club slug 的映射（使用DB实际slug）
const brandToSlug = {
  '比亚迪': '比亚迪车友会-szrh',
  '吉利汽车': '吉利车友会-fmdg',
  '坦克': '坦克车友会-869c',
  '领克': '领克车友会-fa04',
  '蔚来': '蔚来车友会-y6qw',
  '小鹏': '小鹏车友会-pcrc',
  '理想': '理想车友会-uqsw',
  '广汽传祺': '传祺车友会-tv02',
  '五菱宝骏': '五菱车友会-uogo',
  '长安汽车': '长安车友会-sf32',
  '东风本田': '本田车友会-7err',
  '广汽本田': '本田车友会-7err',
  '一汽丰田': '丰田车友会-y2fs',
  '广汽丰田': '丰田车友会-y2fs',
  '东风日产': '日产车友会-h9jj',
  '一汽大众': '大众车友会-3zz5',
  '上汽大众': '大众车友会-3zz5',
  '奥迪': '奥迪车友会-d4ep',
  '宝马': '宝马车友会-n4fh',
  '奔驰': '奔驰车友会-e6ue',
  '保时捷': '保时捷车友会-6d9d',
  '凯迪拉克': '凯迪拉克车友会-3f5d',
  '林肯': null,
  '捷豹': '捷豹车友会-ef50',
  '路虎': null,
  'Jeep': 'Jeep车友会-5e9a',
  '东风标致': '标致车友会-2ge4',
  '东风雪铁龙': '雪铁龙车友会-bcg6',
  '东风风神': '东风风神车友会-647f',
  '英菲尼迪': '英菲尼迪车友会-6d0d',
  '东风悦达起亚': '起亚车友会-4m43',
  '北京现代': '现代车友会-yc3r',
  '广汽三菱': '三菱车友会-wsw2',
  '福特': '福特车友会-6w40',
  '雪佛兰': '雪佛兰车友会-38fl',
  '别克': '别克车友会-n14u',
  '马自达': '马自达车友会-5bmp',
  '斯巴鲁': '斯巴鲁车友会-743a',
  '讴歌': null,
  '魏牌': '魏牌车友会-h0ig',
  '星途': null,
  '奕派': '奕派车友会-4ce6',
  '岚图': '岚图车友会-ihd7',
  '广汽埃安': '埃安车友会-4qqi',
  '零跑': '零跑车友会-ujj2',
  '哪吒': '哪吒车友会-bxzh',
  '极氪': '极氪车友会-7909',
  '小米汽车': '小米车友会-l30m',
  '阿维塔': '阿维塔车友会-wteg',
  '智己': '智己车友会-d270',
  '深蓝': '深蓝车友会-l1a2',
  '凯翼': null,
  '东风小康': null,
  '奔腾': null,
  '玛莎拉蒂': null,
  '红旗': '红旗车友会-bcrq',
  '沃尔沃': '沃尔沃车友会-1394',
};

export async function POST() {
  try {
    const raw = fs.readFileSync("/tmp/merge_v4_data.json", "utf8");
    const data = JSON.parse(raw);

    let inserted = 0;
    let skipped = 0;
    let noClub = 0;
    const errors = [];

    const clubs = await prisma.club.findMany();
    const slugToClub = {};
    for (const c of clubs) {
      slugToClub[c.slug] = c;
    }

    // 预加载已有sourceUrl
    const existing = await prisma.clubPost.findMany({
      select: { clubId: true, sourceUrl: true },
    });
    const existingSet = new Set(existing.map(e => `${e.clubId}|${e.sourceUrl}`));

    for (const item of data) {
      const slug = brandToSlug[item._brand];
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
      } catch (e) {
        errors.push({ title: item.title.substring(0, 50), error: e.message.substring(0, 100) });
      }
    }

    const total = await prisma.clubPost.count();

    return NextResponse.json({
      ok: true,
      inserted,
      skipped,
      noClub,
      errors: errors.slice(0, 5),
      total,
    });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
