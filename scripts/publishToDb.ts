/**
 * 发布采集结果到数据库
 * 读取采集结果JSON，创建/更新 Club 和 ClubPost 记录
 * 
 * 用法: npx tsx scripts/publishToDb.ts --source wechat|xiaohongshu --input scripts/data/wechat_articles.json
 */

import * as fs from "fs";
import * as path from "path";

// We need to use Prisma directly
// Since this runs as a standalone script, we import from the compiled Prisma client

interface WechatArticle {
  title: string;
  coverImage: string;
  summary: string;
  publishDate: string;
  sourceUrl: string;
  author: string;
}

interface WechatFetchResult {
  accountName: string;
  articles: WechatArticle[];
  fetchedAt: string;
}

interface XhsNote {
  title: string;
  coverImage: string;
  author: string;
  publishTime: string;
  sourceUrl: string;
  content: string;
}

interface XhsFetchResult {
  keyword: string;
  notes: XhsNote[];
  fetchedAt: string;
}

function generateSlug(name: string): string {
  const base = name
    .replace(/[\s\-–—]+/g, "-")
    .replace(/[^\w\-\u4e00-\u9fff]/g, "")
    .toLowerCase();
  const rand = Math.random().toString(36).substring(2, 6);
  return `${base}-${rand}`;
}

function parseArgs(): { source: string; input: string } {
  const args = process.argv.slice(2);
  let source = "";
  let input = "";

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--source" && args[i + 1]) {
      source = args[++i];
    } else if (args[i] === "--input" && args[i + 1]) {
      input = args[++i];
    }
  }

  return { source, input };
}

async function main() {
  const { source, input } = parseArgs();

  if (!source || !input) {
    console.log("用法: npx tsx scripts/publishToDb.ts --source wechat|xiaohongshu --input <json文件路径>");
    console.log("示例: npx tsx scripts/publishToDb.ts --source wechat --input scripts/data/wechat_articles.json");
    process.exit(1);
  }

  if (!fs.existsSync(input)) {
    console.error(`[发布] 文件不存在: ${input}`);
    process.exit(1);
  }

  // Import Prisma dynamically
  const { PrismaClient } = await import("@prisma/client");
  const { PrismaPg } = await import("@prisma/adapter-pg");
  
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
  const prisma = new PrismaClient({ adapter });

  const rawData = fs.readFileSync(input, "utf-8");
  const data = JSON.parse(rawData);

  let clubsCreated = 0;
  let clubsSkipped = 0;
  let postsCreated = 0;
  let postsSkipped = 0;

  if (source === "wechat") {
    const results: WechatFetchResult[] = data;

    for (const result of results) {
      const clubName = result.accountName;

      // Create or find club
      let club = await prisma.club.findFirst({
        where: { name: clubName, sourcePlatform: "wechat" },
      });

      if (!club) {
        club = await prisma.club.create({
          data: {
            name: clubName,
            slug: generateSlug(clubName),
            sourcePlatform: "wechat",
            status: "pending",
            isAutoCreated: true,
            description: `来自微信公众号「${clubName}」的车友会`,
          },
        });
        clubsCreated++;
        console.log(`[发布] 创建车友会: ${clubName} (id: ${club.id})`);
      } else {
        clubsSkipped++;
        console.log(`[发布] 车友会已存在: ${clubName} (id: ${club.id})`);
      }

      // Create posts
      for (const article of result.articles) {
        if (!article.sourceUrl) continue;

        // Check if post already exists
        const existing = await prisma.clubPost.findUnique({
          where: { clubId_sourceUrl: { clubId: club.id, sourceUrl: article.sourceUrl } },
        });

        if (existing) {
          postsSkipped++;
          continue;
        }

        const images: string[] = article.coverImage ? [article.coverImage] : [];
        
        await prisma.clubPost.create({
          data: {
            clubId: club.id,
            title: article.title || "无标题",
            content: article.summary || null,
            images: images.length > 0 ? images : null,
            sourceUrl: article.sourceUrl,
            sourcePlatform: "wechat",
            publishedAt: article.publishDate ? new Date(article.publishDate) : null,
          },
        });
        postsCreated++;
        console.log(`[发布] 创建文章: ${article.title}`);
      }
    }
  } else if (source === "xiaohongshu") {
    const results: XhsFetchResult[] = data;

    for (const result of results) {
      const keyword = result.keyword;

      // Use keyword as club name for search results
      let club = await prisma.club.findFirst({
        where: { name: keyword, sourcePlatform: "xiaohongshu" },
      });

      if (!club) {
        club = await prisma.club.create({
          data: {
            name: `${keyword}车友会`,
            slug: generateSlug(keyword),
            sourcePlatform: "xiaohongshu",
            status: "pending",
            isAutoCreated: true,
            description: `来自小红书「${keyword}」的车友会`,
          },
        });
        clubsCreated++;
        console.log(`[发布] 创建车友会: ${keyword} (id: ${club.id})`);
      } else {
        clubsSkipped++;
        console.log(`[发布] 车友会已存在: ${keyword} (id: ${club.id})`);
      }

      // Create posts
      for (const note of result.notes) {
        if (!note.sourceUrl) continue;

        const existing = await prisma.clubPost.findUnique({
          where: { clubId_sourceUrl: { clubId: club.id, sourceUrl: note.sourceUrl } },
        });

        if (existing) {
          postsSkipped++;
          continue;
        }

        const images: string[] = note.coverImage ? [note.coverImage] : [];

        await prisma.clubPost.create({
          data: {
            clubId: club.id,
            title: note.title || "无标题",
            content: note.content || null,
            images: images.length > 0 ? images : null,
            sourceUrl: note.sourceUrl,
            sourcePlatform: "xiaohongshu",
            publishedAt: note.publishTime ? new Date(note.publishTime) : null,
          },
        });
        postsCreated++;
        console.log(`[发布] 创建笔记: ${note.title}`);
      }
    }
  } else {
    console.error(`[发布] 不支持的来源: ${source}`);
    process.exit(1);
  }

  await prisma.$disconnect();

  console.log(`\n[发布] 发布完成!`);
  console.log(`[发布] 车友会: ${clubsCreated} 创建, ${clubsSkipped} 已存在`);
  console.log(`[发布] 文章: ${postsCreated} 创建, ${postsSkipped} 已存在`);
}

main().catch(console.error);
