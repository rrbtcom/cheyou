import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { readFileSync } from 'fs';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

// Load all new source files
const files = [
  { path: '/tmp/douyin_wuhan_data.json', platform: 'douyin' },
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
    // Normalize platform to actual source
    valid.forEach(x => { x._normalized_platform = f.platform; });
    allItems.push(...valid);
    console.log(`[${f.platform}] loaded ${valid.length} valid items`);
  } catch(e) {
    console.log(`[${f.platform}] load failed: ${e.message}`);
  }
}
console.log(`Total new items: ${allItems.length}`);

// Group by brand keyword (first keyword)
const brandMap = new Map();
for (const item of allItems) {
  const brand = item.brand_keywords[0];
  if (!brandMap.has(brand)) brandMap.set(brand, []);
  brandMap.get(brand).push(item);
}
console.log(`Brands with data: ${brandMap.size}`);

// Get existing clubs
const clubs = await prisma.club.findMany({ select: { id: true, brand: true, slug: true, name: true } });
const clubMap = new Map();
for (const c of clubs) {
  if (c.brand) clubMap.set(c.brand, c);
}
console.log(`Existing clubs: ${clubs.length}`);

// Deduplicate within each brand group
function normalize(str) {
  return str.replace(/[#\s\-_]/g, '').toLowerCase().slice(0, 30);
}

const toImport = [];
const seenTitles = new Set();

for (const [brand, items] of brandMap) {
  const club = clubMap.get(brand);
  if (!club) {
    console.log(`  [${brand}] no club found, skipping ${items.length} items`);
    continue;
  }

  // Get existing post titles for this club
  const existing = await prisma.clubPost.findMany({
    where: { clubId: club.id },
    select: { title: true }
  });
  const existingTitles = new Set(existing.map(p => normalize(p.title)));

  for (const item of items) {
    const norm = normalize(item.title);
    if (existingTitles.has(norm)) continue;
    if (seenTitles.has(norm)) continue;
    seenTitles.add(norm);

    // Generate publish date within last 90 days
    const daysAgo = Math.floor(Math.random() * 90);
    const pubDate = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);

    toImport.push({
      clubId: club.id,
      title: item.title,
      content: item.excerpt || '',
      images: null,
      videoUrl: item.post_type === 'video' ? item.source_url : null,
      sourceUrl: item.source_url || null,
      sourcePlatform: item._normalized_platform || item.source_platform || null,
      publishedAt: pubDate,
      status: 'published',
    });
  }
}

console.log(`\nTotal new posts to import: ${toImport.length}`);

if (toImport.length > 0) {
  await prisma.clubPost.createMany({ data: toImport });
  console.log('Import complete!');
}

// Summary
const totalPosts = await prisma.clubPost.count();
const withUrl = await prisma.clubPost.count({ where: { sourceUrl: { not: null } } });
const byPlatform = await prisma.clubPost.groupBy({
  by: ['sourcePlatform'],
  _count: true,
  orderBy: { _count: { sourcePlatform: 'desc' } }
});

console.log(`\n=== Database Summary ===`);
console.log(`Total posts: ${totalPosts}`);
console.log(`With sourceUrl: ${withUrl} (${(withUrl/totalPosts*100).toFixed(1)}%)`);
console.log(`\nBy platform:`);
for (const p of byPlatform) {
  console.log(`  ${p.sourcePlatform || 'null'}: ${p._count}`);
}

await prisma.$disconnect();
