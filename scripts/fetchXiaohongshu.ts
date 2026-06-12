/**
 * 小红书笔记采集器
 * 通过关键词搜索获取小红书笔记列表
 * 
 * 用法: npx tsx scripts/fetchXiaohongshu.ts --keyword "关键词" [--limit 10]
 *   或: npx tsx scripts/fetchXiaohongshu.ts --url "笔记链接"
 * 输出: scripts/data/xiaohongshu_notes.json
 */

import * as fs from "fs";
import * as path from "path";

interface Note {
  title: string;
  coverImage: string;
  author: string;
  publishTime: string;
  sourceUrl: string;
  content: string;
}

interface FetchResult {
  keyword: string;
  notes: Note[];
  fetchedAt: string;
}

const OUTPUT_DIR = path.join(__dirname, "data");
const OUTPUT_FILE = path.join(OUTPUT_DIR, "xiaohongshu_notes.json");

function parseArgs(): { keyword?: string; url?: string; limit: number } {
  const args = process.argv.slice(2);
  let keyword: string | undefined;
  let url: string | undefined;
  let limit = 10;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--keyword" && args[i + 1]) {
      keyword = args[++i];
    } else if (args[i] === "--url" && args[i + 1]) {
      url = args[++i];
    } else if (args[i] === "--limit" && args[i + 1]) {
      limit = parseInt(args[++i], 10) || 10;
    }
  }

  return { keyword, url, limit };
}

async function fetchNoteByUrl(url: string): Promise<Note | null> {
  console.log(`[小红书] 获取笔记: ${url}`);

  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8",
      },
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
      console.error(`[小红书] 请求失败: ${response.status}`);
      return null;
    }

    const html = await response.text();

    // 尝试从页面提取笔记信息
    // 小红书页面通常包含 JSON-LD 或初始状态数据
    let title = "";
    let content = "";
    let coverImage = "";
    let author = "";

    // 从 script 标签中提取初始状态
    const stateMatch = html.match(/window\.__INITIAL_STATE__\s*=\s*({[\s\S]*?})\s*<\/script>/);
    if (stateMatch) {
      try {
        const state = JSON.parse(stateMatch[1]);
        const noteData = state?.note?.noteDetailMap;
        if (noteData) {
          const firstKey = Object.keys(noteData)[0];
          const note = noteData[firstKey]?.note;
          if (note) {
            title = note.title || "";
            content = note.desc || "";
            author = note.user?.nickname || "";
            coverImage = note.imageList?.[0]?.urlDefault || note.imageList?.[0]?.url || "";
          }
        }
      } catch {
        console.log("[小红书] JSON解析失败，尝试HTML解析");
      }
    }

    // 回退到HTML解析
    if (!title) {
      const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/);
      title = titleMatch ? titleMatch[1].replace(/ - 小红书$/, "").trim() : "";
    }
    if (!coverImage) {
      const imgMatch = html.match(/<meta[^>]*property="og:image"[^>]*content="([^"]*)"/);
      coverImage = imgMatch ? imgMatch[1] : "";
    }
    if (!content) {
      const descMatch = html.match(/<meta[^>]*property="og:description"[^>]*content="([^"]*)"/);
      content = descMatch ? descMatch[1] : "";
    }

    return {
      title,
      coverImage,
      author,
      publishTime: new Date().toISOString().split("T")[0],
      sourceUrl: url,
      content,
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error(`[小红书] 采集失败: ${errorMsg}`);
    return null;
  }
}

async function searchNotes(keyword: string, limit: number): Promise<Note[]> {
  console.log(`[小红书] 搜索关键词: ${keyword}, 限制: ${limit}条`);

  const notes: Note[] = [];

  try {
    // 使用小红书搜索页面
    const searchUrl = `https://www.xiaohongshu.com/search_result?keyword=${encodeURIComponent(keyword)}&source=web_search_result_note`;

    console.log(`[小红书] 搜索URL: ${searchUrl}`);

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
      console.error(`[小红书] 搜索请求失败: ${response.status}`);
      return notes;
    }

    const html = await response.text();
    console.log(`[小红书] 响应长度: ${html.length} 字符`);

    // 尝试从搜索结果提取笔记
    const stateMatch = html.match(/window\.__INITIAL_STATE__\s*=\s*({[\s\S]*?})\s*<\/script>/);
    if (stateMatch) {
      try {
        const state = JSON.parse(stateMatch[1]);
        const feeds = state?.search?.feeds || [];
        for (const feed of feeds) {
          if (notes.length >= limit) break;
          const note = feed?.noteCard || feed;
          if (note) {
            notes.push({
              title: note.displayTitle || note.title || "",
              coverImage: note.cover?.urlDefault || note.cover?.url || "",
              author: note.user?.nickname || "",
              publishTime: note.time || new Date().toISOString().split("T")[0],
              sourceUrl: `https://www.xiaohongshu.com/explore/${note.noteId}`,
              content: note.desc || "",
            });
          }
        }
      } catch {
        console.log("[小红书] 搜索结果JSON解析失败");
      }
    }

    console.log(`[小红书] 搜索到 ${notes.length} 条笔记`);
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error(`[小红书] 搜索失败: ${errorMsg}`);
  }

  return notes;
}

async function main() {
  const { keyword, url, limit } = parseArgs();

  if (!keyword && !url) {
    console.log("用法:");
    console.log("  npx tsx scripts/fetchXiaohongshu.ts --keyword \"比亚迪汉\" --limit 10");
    console.log("  npx tsx scripts/fetchXiaohongshu.ts --url \"https://www.xiaohongshu.com/explore/xxxxx\"");
    process.exit(1);
  }

  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  const results: FetchResult[] = [];

  if (url) {
    const note = await fetchNoteByUrl(url);
    if (note) {
      results.push({
        keyword: url,
        notes: [note],
        fetchedAt: new Date().toISOString(),
      });
    }
  }

  if (keyword) {
    const notes = await searchNotes(keyword, limit);
    results.push({
      keyword,
      notes,
      fetchedAt: new Date().toISOString(),
    });
  }

  const totalNotes = results.reduce((sum, r) => sum + r.notes.length, 0);
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(results, null, 2), "utf-8");

  console.log(`\n[小红书] 采集完成!`);
  console.log(`[小红书] 共 ${totalNotes} 条笔记`);
  console.log(`[小红书] 结果已保存到: ${OUTPUT_FILE}`);
}

main().catch(console.error);
