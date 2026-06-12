/**
 * 微信公众号文章采集器
 * 通过搜狗微信搜索获取公众号文章列表
 * 
 * 用法: npx tsx scripts/fetchWechat.ts "公众号名称1" "公众号名称2" ...
 * 输出: scripts/data/wechat_articles.json
 */

import * as fs from "fs";
import * as path from "path";

interface Article {
  title: string;
  coverImage: string;
  summary: string;
  publishDate: string;
  sourceUrl: string;
  author: string;
}

interface FetchResult {
  accountName: string;
  articles: Article[];
  fetchedAt: string;
}

const OUTPUT_DIR = path.join(__dirname, "data");
const OUTPUT_FILE = path.join(OUTPUT_DIR, "wechat_articles.json");

function extractArticles(html: string, accountName: string): Article[] {
  const articles: Article[] = [];

  // 搜狗微信搜索结果页面结构解析
  const itemRegex = /<div class="news-box"[^>]*>([\s\S]*?)<\/div>\s*<\/div>/g;
  let match: RegExpExecArray | null;

  // 尝试提取每条新闻
  const titleRegex = /<h3[^>]*><a[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a><\/h3>/g;
  const imgRegex = /<img[^>]*src="([^"]*)"[^>]*>/;
  const summaryRegex = /<p class="txt-info"[^>]*>([\s\S]*?)<\/p>/;
  const dateRegex = /<span class="s2"[^>]*>([\s\S]*?)<\/span>/;
  const authorRegex = /<a[^>]*class="account-name"[^>]*>([\s\S]*?)<\/a>/;

  let titleMatch: RegExpExecArray | null;
  while ((titleMatch = titleRegex.exec(html)) !== null) {
    const url = titleMatch[1];
    const title = titleMatch[2].replace(/<[^>]*>/g, "").trim();

    // 获取该条目周围的上下文
    const contextStart = titleMatch.index;
    const contextEnd = Math.min(contextStart + 3000, html.length);
    const context = html.substring(contextStart, contextEnd);

    const imgMatch = imgRegex.exec(context);
    const summaryMatch = summaryRegex.exec(context);
    const dateMatch = dateRegex.exec(context);
    const authorMatch = authorRegex.exec(context);

    articles.push({
      title,
      coverImage: imgMatch ? imgMatch[1] : "",
      summary: summaryMatch ? summaryMatch[1].replace(/<[^>]*>/g, "").trim() : "",
      publishDate: dateMatch ? dateMatch[1].replace(/<[^>]*>/g, "").trim() : "",
      sourceUrl: url.startsWith("http") ? url : `https://weixin.sogou.com${url}`,
      author: authorMatch ? authorMatch[1].replace(/<[^>]*>/g, "").trim() : accountName,
    });
  }

  return articles;
}

async function fetchSogouWechat(accountName: string): Promise<Article[]> {
  const searchUrl = `https://weixin.sogou.com/weixin?type=1&query=${encodeURIComponent(accountName)}&ie=utf8`;

  console.log(`[搜狗微信] 搜索公众号: ${accountName}`);
  console.log(`[搜狗微信] URL: ${searchUrl}`);

  try {
    const response = await fetch(searchUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8",
      },
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
      console.error(`[搜狗微信] 请求失败: ${response.status} ${response.statusText}`);
      return [];
    }

    const html = await response.text();
    console.log(`[搜狗微信] 响应长度: ${html.length} 字符`);

    const articles = extractArticles(html, accountName);
    console.log(`[搜狗微信] 解析到 ${articles.length} 篇文章`);

    return articles;
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error(`[搜狗微信] 采集失败: ${errorMsg}`);
    return [];
  }
}

async function main() {
  const accountNames = process.argv.slice(2);

  if (accountNames.length === 0) {
    console.log("用法: npx tsx scripts/fetchWechat.ts <公众号名称1> [公众号名称2] ...");
    console.log("示例: npx tsx scripts/fetchWechat.ts \"比亚迪汽车\" \"特斯拉\"");
    process.exit(1);
  }

  console.log(`[微信采集] 开始采集 ${accountNames.length} 个公众号`);
  console.log(`[微信采集] 目标: ${accountNames.join(", ")}`);

  const results: FetchResult[] = [];

  for (const name of accountNames) {
    const articles = await fetchSogouWechat(name);
    results.push({
      accountName: name,
      articles,
      fetchedAt: new Date().toISOString(),
    });
    // 间隔2秒，避免被反爬
    if (accountNames.indexOf(name) < accountNames.length - 1) {
      console.log("[微信采集] 等待2秒...");
      await new Promise((r) => setTimeout(r, 2000));
    }
  }

  // 保存结果
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  const totalArticles = results.reduce((sum, r) => sum + r.articles.length, 0);
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(results, null, 2), "utf-8");

  console.log(`\n[微信采集] 采集完成!`);
  console.log(`[微信采集] 共 ${results.length} 个公众号, ${totalArticles} 篇文章`);
  console.log(`[微信采集] 结果已保存到: ${OUTPUT_FILE}`);
}

main().catch(console.error);
