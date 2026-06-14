import { Pool } from "pg";
import fs from "fs";

const DB_CONFIG = {
  host: "localhost",
  port: 5432,
  database: "cheyou",
  user: "cheyou",
  password: "cheyou2026",
};

const DATA_FILE = "/app/data/所有对话/主对话/车友荟/wuhan_clubs_data.json";

// 品牌英中别名映射
const BRAND_ALIASES = {
  "Mercedes": "奔驰",
  "HONDA": "本田",
  "Honda": "本田",
  "Jeep": "吉普",
};

async function main() {
  const pool = new Pool(DB_CONFIG);
  const client = await pool.connect();

  try {
    const rawData = JSON.parse(fs.readFileSync(DATA_FILE, "utf-8"));
    const records = rawData.filter(
      (r) =>
        r["素材来源URL"] &&
        r["素材来源URL"].trim() !== "" &&
        !r["文章标题"].startsWith("[INFO_GAP]")
    );
    console.log(`[信息] 调研数据共 ${rawData.length} 条，有URL的有效记录 ${records.length} 条`);

    const clubsResult = await client.query('SELECT id, slug, name FROM clubs');
    const brandToClubId = {};
    for (const club of clubsResult.rows) {
      const brand = club.name.replace(/车友会$/, "");
      brandToClubId[brand] = club.id;
    }
    console.log(`[信息] 数据库中有 ${clubsResult.rows.length} 个俱乐部`);

    const postsResult = await client.query(
      'SELECT id, "clubId", title, "sourceUrl" FROM club_posts'
    );
    const allPosts = postsResult.rows;
    console.log(`[信息] 数据库中有 ${allPosts.length} 条帖子`);

    const existingPairs = new Set();
    for (const p of allPosts) {
      if (p.sourceUrl && p.sourceUrl.trim() !== "") {
        existingPairs.add(`${p.clubId}|||${p.sourceUrl}`);
      }
    }

    let updatedCount = 0;
    let noMatchCount = 0;
    let noClubCount = 0;
    let duplicateSkip = 0;
    const unmatchedRecords = [];
    const updatedPosts = new Set();

    for (const record of records) {
      const brand = record["品牌名称"];
      const researchTitle = record["文章标题"];
      const sourceUrl = record["素材来源URL"].trim();

      const clubId = brandToClubId[brand];
      if (!clubId) {
        console.log(`[跳过] 品牌 "${brand}" 在数据库中无对应俱乐部`);
        noClubCount++;
        unmatchedRecords.push({ brand, title: researchTitle, reason: "无对应俱乐部" });
        continue;
      }

      const pairKey = `${clubId}|||${sourceUrl}`;
      if (existingPairs.has(pairKey)) {
        duplicateSkip++;
        continue;
      }

      const clubPosts = allPosts.filter(
        (p) => p.clubId === clubId && !updatedPosts.has(p.id) && (!p.sourceUrl || p.sourceUrl.trim() === "")
      );

      // 替换标题中的英文品牌名为中文
      let normalizedTitle = researchTitle;
      for (const [en, cn] of Object.entries(BRAND_ALIASES)) {
        normalizedTitle = normalizedTitle.replace(new RegExp(en, "g"), cn);
      }

      const matchedPost = findBestMatch(normalizedTitle, clubPosts, brand);

      if (!matchedPost) {
        console.log(`[未匹配] ${brand} | 调研: "${researchTitle}" | 可更新: ${clubPosts.length}`);
        noMatchCount++;
        unmatchedRecords.push({ brand, title: researchTitle, reason: "标题无匹配" });
        continue;
      }

      try {
        const updateResult = await client.query(
          'UPDATE club_posts SET "sourceUrl" = $1 WHERE id = $2 AND ("sourceUrl" IS NULL OR "sourceUrl" = \'\')',
          [sourceUrl, matchedPost.id]
        );

        if (updateResult.rowCount > 0) {
          console.log(
            `[更新成功] ${brand} | 调研: "${researchTitle}" → 帖子: "${matchedPost.title}" | URL: ${sourceUrl}`
          );
          updatedCount++;
          updatedPosts.add(matchedPost.id);
          existingPairs.add(pairKey);
        }
      } catch (err) {
        if (err.code === "23505") {
          console.log(`[唯一约束冲突] ${brand} | URL ${sourceUrl}`);
          duplicateSkip++;
        } else {
          throw err;
        }
      }
    }

    console.log("\n========== 统计 ==========");
    console.log(`有效调研记录: ${records.length}`);
    console.log(`更新成功: ${updatedCount}`);
    console.log(`唯一约束冲突跳过: ${duplicateSkip}`);
    console.log(`标题无匹配: ${noMatchCount}`);
    console.log(`无对应俱乐部: ${noClubCount}`);
    console.log(`============================\n`);

    if (unmatchedRecords.length > 0) {
      console.log("===== 未匹配记录详情 =====");
      for (const r of unmatchedRecords) {
        console.log(`  [${r.reason}] ${r.brand} | ${r.title}`);
      }
    }
  } catch (err) {
    console.error("执行出错:", err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

const STOP_WORDS = new Set([
  "武汉", "车友会", "车主", "活动", "分享", "体验", "感受", "实测",
  "用车", "自驾", "自驾游", "聚会", "俱乐部", "用户", "品牌", "汽车",
  "首次", "组织", "举办", "参加", "湖北", "中国", "系列", "真实", "详细",
  "第一", "位", "地区", "故事",
]);

/**
 * 找最佳匹配帖子
 * 综合策略：关键词匹配 + LCS公共子串 + 反向匹配
 */
function findBestMatch(researchTitle, clubPosts, brand) {
  if (clubPosts.length === 0) return null;

  // 精确匹配
  const exactMatch = clubPosts.find((p) => p.title === researchTitle);
  if (exactMatch) return exactMatch;

  const keywords = extractKeywords(researchTitle, brand);
  let candidates = [];

  for (const post of clubPosts) {
    let score = 0;
    const postTitle = post.title;

    // 策略A: 关键词匹配
    for (const kw of keywords) {
      if (postTitle.includes(kw)) {
        if (STOP_WORDS.has(kw)) {
          score += 0.5;
        } else if (/\d/.test(kw) && kw.length <= 6) {
          score += 15;
        } else if (/\d/.test(kw)) {
          score += 10;
        } else if (kw.length >= 4) {
          score += 8;
        } else if (kw.length >= 3) {
          score += 5;
        } else {
          score += 3; // 2字符关键词也给分
        }
      }
    }

    // 策略B: LCS匹配（降低阈值到2）
    const lcsResult = findAllCommonSubstrings(researchTitle, postTitle, 2);
    for (const { str, len } of lcsResult) {
      // 过滤纯数字的LCS（如"000"是假匹配）
      if (/^\d+$/.test(str)) continue;
      if (STOP_WORDS.has(str)) {
        score += len * 0.3;
      } else if (len >= 5) {
        score += len * 5;
      } else if (len >= 3) {
        score += len * 3;
      } else if (len === 2) {
        score += 2; // 2字符LCS也给分
      }
    }

    // 策略C: 反向匹配 - DB帖子标题中的关键词出现在调研标题中
    const postKeywords = extractKeywords(postTitle, brand);
    for (const pkw of postKeywords) {
      if (pkw.length >= 2 && researchTitle.includes(pkw) && !STOP_WORDS.has(pkw)) {
        const revScore = /\d/.test(pkw) ? 12 : pkw.length >= 3 ? 5 : 2;
        score += revScore;
      }
    }

    if (score > 0) {
      candidates.push({ post, score });
    }
  }

  candidates.sort((a, b) => b.score - a.score);

  if (candidates.length > 0 && candidates[0].score >= 2) {
    return candidates[0].post;
  }

  return null;
}

/**
 * 找到两个字符串之间所有不重叠的公共子串（长度>=minLen）
 */
function findAllCommonSubstrings(a, b, minLen = 2) {
  const results = [];
  const seen = new Set();

  // 简化方法：用滑动窗口找公共子串
  for (let len = Math.min(a.length, b.length); len >= minLen; len--) {
    for (let i = 0; i <= a.length - len; i++) {
      const sub = a.substring(i, i + len);
      if (seen.has(sub)) continue;
      if (b.includes(sub)) {
        results.push({ str: sub, len });
        seen.add(sub);
        // 只保留前几个最长的，避免太多
        if (results.length >= 5) return results;
      }
    }
    // 找到一些匹配后就可以返回了
    if (results.length >= 2) return results;
  }

  return results;
}

/**
 * 提取关键词
 */
function extractKeywords(title, brand) {
  const keywords = new Set();

  // 1. 按分隔符拆分
  const segments = title.split(/[·\-\|&\s，、：:！!？?—""''（）()+]+/).filter((s) => s.length >= 2);
  for (const seg of segments) {
    keywords.add(seg);
    // 在中文→数字边界处拆分
    const parts = seg.match(/[\u4e00-\u9fa5]{2,4}\d{1,4}[A-Za-z]{0,3}|[\u4e00-\u9fa5]+|\d+[A-Za-z]*|[A-Za-z]+\d*[A-Za-z]*/g);
    if (parts) {
      for (const p of parts) {
        if (p.length >= 2) keywords.add(p);
      }
    }
  }

  // 2. 车型名模式
  const patterns = [
    /[\u4e00-\u9fa5]{1,3}\d{1,4}[A-Za-z]{0,3}/g,
    /[A-Za-z]{1,5}\d{1,4}[A-Za-z]{0,3}/g,
    /[A-Za-z]+-\d+[A-Za-z]*/g,
    /\d{3,}[A-Za-z]{0,2}/g,
  ];

  for (const pattern of patterns) {
    const matches = title.match(pattern);
    if (matches) {
      for (const m of matches) {
        if (m.length >= 2) keywords.add(m);
      }
    }
  }

  // 3. 数字+单位
  const numPhrases = title.match(/\d+[公里天人年月日辆车次位元万度]+/g);
  if (numPhrases) {
    for (const p of numPhrases) {
      if (p.length >= 3) keywords.add(p);
    }
  }

  // 4. 过滤
  const stopWords = new Set([
    "武汉", "车友会", "车主", "活动", "分享", "体验", "感受", "实测",
    "用车", "自驾", "自驾游", "聚会", "俱乐部", "用户", "品牌", "汽车",
    "首次", "组织", "举办", "参加", "湖北", "中国", "系列", "真实", "详细",
    "第一", "位", "地区", "故事", brand, brand + "车友会",
  ]);

  return [...keywords].filter((k) => k.length >= 2 && !stopWords.has(k));
}

main();
