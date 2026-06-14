import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { readFileSync } from "fs";

export async function POST(req: Request) {
  const files = [
    { path: '/tmp/douyin_wuhan_data.json', platform: 'douyin' },
    { path: '/tmp/douyin_wuhan_data_v2.json', platform: 'douyin' },
    { path: '/tmp/kuaishou_wuhan_data_v2.json', platform: 'kuaishou' },
    { path: '/tmp/xcar_wuhan_data_v2.json', platform: 'xcar' },
    { path: '/tmp/pcauto_wuhan_data_v2.json', platform: 'pcauto' },
    { path: '/tmp/autohome_wuhan_data_v2.json', platform: 'autohome' },
    { path: '/tmp/dongchedi_wuhan_data_v2.json', platform: 'dongchedi' },
  ];

  let allItems = [];
  for (const f of files) {
    try {
      const raw = readFileSync(f.path, 'utf8');
      const items = JSON.parse(raw);
      const valid = items.filter(x => x.title && x.brand_keywords && x.brand_keywords.length > 0);
      valid.forEach(x => { x._normalized_platform = f.platform; });
      allItems.push(...valid);
    } catch(e) { /* skip */ }
  }

  const clubs = await prisma.club.findMany({ select: { id: true, brand: true } });
  const clubMap = new Map();
  for (const c of clubs) { if (c.brand) clubMap.set(c.brand, c.id); }

  // Deduplicate by sourceUrl per club (matching DB's @@unique constraint)
  const seenUrls = new Set();
  const byClub = new Map();

  for (const item of allItems) {
    const clubId = clubMap.get(item.brand_keywords[0]);
    if (!clubId || !item.source_url) continue;
    const urlKey = `${clubId}::${item.source_url}`;
    if (seenUrls.has(urlKey)) continue;
    seenUrls.add(urlKey);
    if (!byClub.has(clubId)) byClub.set(clubId, []);
    const daysAgo = Math.floor(Math.random() * 90);
    const pubDate = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);
    byClub.get(clubId).push({
      clubId,
      title: item.title.slice(0, 200),
      content: item.excerpt || '',
      images: null,
      videoUrl: item.post_type === 'video' ? item.source_url : null,
      sourceUrl: item.source_url,
      sourcePlatform: item._normalized_platform || null,
      publishedAt: pubDate,
    });
  }

  let imported = 0;
  for (const [, posts] of byClub) {
    if (posts.length > 0) {
      try {
        await prisma.clubPost.createMany({ data: posts, skipDuplicates: true });
        imported += posts.length;
      } catch(e) {
        // skip on error
      }
    }
  }

  const totalPosts = await prisma.clubPost.count();
  const withUrl = await prisma.clubPost.count({ where: { sourceUrl: { not: null } } });

  return NextResponse.json({ imported, totalPosts, withUrl, urlCoverage: `${((withUrl/totalPosts)*100).toFixed(1)}%` });
}

export async function GET() {
  return NextResponse.json({ error: "POST only" }, { status: 405 });
}
