import { Pool } from "pg";
import fs from "fs";

const pool = new Pool({
  connectionString: "postgresql://cheyou:cheyou2026@localhost:5432/cheyou",
});

// ========== 1. 读取并合并6个JSON ==========
const dataDir = "/app/data/所有对话/主对话/车友荟";
const files = [
  { path: `${dataDir}/autohome_wuhan_data.json`, fileTag: "autohome" },
  { path: `${dataDir}/dongchedi_wuhan_data.json`, fileTag: "dongchedi" },
  { path: `${dataDir}/xcar_pcauto_wuhan_data.json`, fileTag: "xcar_pcauto" },
  { path: `${dataDir}/xiaohongshu_wuhan_data.json`, fileTag: "xiaohongshu" },
  { path: `${dataDir}/bilibili_wuhan_data.json`, fileTag: "bilibili" },
  { path: `${dataDir}/xcar_wuhan_data.json`, fileTag: "xcar" },
];

let allRecords = [];
for (const f of files) {
  const raw = JSON.parse(fs.readFileSync(f.path, "utf-8"));
  for (const r of raw) {
    allRecords.push({
      brand: r.brand,
      club_name: r.club_name || "",
      title: r.title,
      summary: r.summary || "",
      source_url: r.source_url || "",
      source_platform: r.source_platform || "",
      published_date: r.published_date || null,
      images: r.images || [],
      file_tag: f.fileTag,
    });
  }
}
console.log(`[合并] 共读取 ${allRecords.length} 条素材记录`);

// 去重（同brand+source_url只保留一条）
const seen = new Set();
const dedupedRecords = [];
for (const r of allRecords) {
  const key = `${r.brand}||${r.source_url}`;
  if (!seen.has(key)) {
    seen.add(key);
    dedupedRecords.push(r);
  }
}
console.log(`[去重] 去重后 ${dedupedRecords.length} 条（按 brand+source_url）`);

// ========== 2. 建立品牌→clubId映射 ==========
const client = await pool.connect();
try {
  const clubsRes = await client.query("SELECT id, name, brand FROM clubs");
  const brandToClub = new Map();
  for (const c of clubsRes.rows) {
    if (c.brand) {
      brandToClub.set(c.brand, { id: c.id, name: c.name });
    }
  }
  console.log(`[映射] 数据库中共 ${clubsRes.rows.length} 个车友会，有品牌映射 ${brandToClub.size} 个`);

  // 按品牌分组素材
  const brandMaterials = new Map();
  for (const r of dedupedRecords) {
    if (!brandMaterials.has(r.brand)) brandMaterials.set(r.brand, []);
    brandMaterials.get(r.brand).push(r);
  }

  // 统计品牌素材数
  let mappedBrandCount = 0;
  for (const [brand, materials] of brandMaterials) {
    if (brandToClub.has(brand)) mappedBrandCount++;
  }
  console.log(`[素材] ${brandMaterials.size} 个品牌有素材，其中 ${mappedBrandCount} 个可映射到车友会`);

  // ========== 3. 获取所有现有帖子 ==========
  const postsRes = await client.query(
    `SELECT id, "clubId", title, content, "sourceUrl", "sourcePlatform" FROM club_posts ORDER BY id`
  );
  const posts = postsRes.rows;
  console.log(`[帖子] 数据库中共 ${posts.length} 篇帖子`);

  // 建立 clubId → brand 映射
  const clubIdToBrand = new Map();
  for (const [brand, club] of brandToClub) {
    clubIdToBrand.set(club.id, brand);
  }

  // ========== 4. 标题关键词匹配函数 ==========
  function extractKeywords(title) {
    const stopWords = new Set([
      "的", "了", "在", "是", "我", "有", "和", "就", "不", "人", "都", "一", "一个",
      "上", "也", "很", "到", "说", "要", "去", "你", "会", "着", "没有", "看", "好",
      "自己", "这", "他", "她", "它", "们", "那", "些", "什么", "怎么", "如何", "可以",
      "还是", "或者", "但", "但是", "还", "又", "与", "及", "等", "之", "从", "被", "把",
      "让", "向", "对", "而", "则", "且", "更", "最", "已", "以", "为", "因", "由",
      "提问", "回复", "分享", "推荐", "讨论", "体验", "交流", "帮助", "请问",
    ]);
    const cnWords = title.match(/[\u4e00-\u9fa5]{2,}/g) || [];
    const alnumWords = title.match(/[a-zA-Z0-9]{2,}/gi) || [];
    const all = [...cnWords, ...alnumWords];
    return all.filter(w => !stopWords.has(w));
  }

  function titleSimilarity(postTitle, materialTitle) {
    const kw1 = new Set(extractKeywords(postTitle));
    const kw2 = new Set(extractKeywords(materialTitle));
    if (kw1.size === 0 || kw2.size === 0) return 0;
    let overlap = 0;
    for (const k of kw1) {
      if (kw2.has(k)) overlap++;
    }
    return overlap / Math.min(kw1.size, kw2.size);
  }

  // ========== Step 1: 标题关键词匹配更新sourceUrl ==========
  console.log(`\n===== Step 1: 标题关键词匹配 =====`);

  let matchAttempted = 0;
  const usedUrlsByClub = new Map(); // clubId -> Set<sourceUrl>

  // 先收集现有已用的URL（用于避免冲突）
  for (const post of posts) {
    if (post.sourceUrl) {
      if (!usedUrlsByClub.has(post.clubId)) usedUrlsByClub.set(post.clubId, new Set());
      usedUrlsByClub.get(post.clubId).add(post.sourceUrl);
    }
  }

  const updateBatch = []; // { postId, clubId, sourceUrl, sourcePlatform, score }

  for (const post of posts) {
    const brand = clubIdToBrand.get(post.clubId);
    if (!brand) continue;
    const materials = brandMaterials.get(brand);
    if (!materials || materials.length === 0) continue;

    matchAttempted++;
    let bestMatch = null;
    let bestScore = 0;

    for (const mat of materials) {
      if (!mat.source_url) continue;
      const usedSet = usedUrlsByClub.get(post.clubId);
      if (usedSet && usedSet.has(mat.source_url)) continue;

      const score = titleSimilarity(post.title, mat.title);
      if (score > bestScore) {
        bestScore = score;
        bestMatch = mat;
      }
    }

    // 阈值：至少0.3的重叠度才算匹配成功
    if (bestMatch && bestScore >= 0.3) {
      updateBatch.push({
        postId: post.id,
        clubId: post.clubId,
        sourceUrl: bestMatch.source_url,
        sourcePlatform: bestMatch.source_platform,
        score: bestScore,
      });
      // 标记该URL已被该club使用
      if (!usedUrlsByClub.has(post.clubId)) usedUrlsByClub.set(post.clubId, new Set());
      usedUrlsByClub.get(post.clubId).add(bestMatch.source_url);
    }
  }

  console.log(`[匹配] 尝试匹配 ${matchAttempted} 篇帖子`);
  console.log(`[匹配] 成功匹配 ${updateBatch.length} 篇（阈值≥0.3）`);

  // 批量更新Step 1的结果
  let step1Updated = 0;
  for (const item of updateBatch) {
    try {
      await client.query(
        `UPDATE club_posts SET "sourceUrl" = $1, "sourcePlatform" = $2 WHERE id = $3`,
        [item.sourceUrl, item.sourcePlatform, item.postId]
      );
      step1Updated++;
    } catch (e) {
      console.log(`[跳过] 帖子 ${item.postId} 更新失败: ${e.message}`);
    }
  }
  console.log(`[Step1] 成功更新 sourceUrl: ${step1Updated} 篇`);

  // ========== Step 2: 补充缺失来源的帖子 ==========
  console.log(`\n===== Step 2: 补充缺失来源 =====`);

  // 重新查询当前状态
  const posts2Res = await client.query(
    `SELECT id, "clubId", title, "sourceUrl", "sourcePlatform" FROM club_posts ORDER BY id`
  );
  const posts2 = posts2Res.rows;

  // 重新收集已用URL
  const usedUrls2 = new Map();
  for (const post of posts2) {
    if (post.sourceUrl) {
      if (!usedUrls2.has(post.clubId)) usedUrls2.set(post.clubId, new Set());
      usedUrls2.get(post.clubId).add(post.sourceUrl);
    }
  }

  // 找出sourceUrl为空的帖子
  const emptyPosts = posts2.filter(p => !p.sourceUrl || p.sourceUrl.trim() === "");
  console.log(`[Step2] sourceUrl为空的帖子: ${emptyPosts.length} 篇`);

  function shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  let step2Updated = 0;
  for (const post of emptyPosts) {
    const brand = clubIdToBrand.get(post.clubId);
    if (!brand) continue;

    const materials = brandMaterials.get(brand) || [];
    const used = usedUrls2.get(post.clubId) || new Set();
    const available = materials.filter(m => m.source_url && !used.has(m.source_url));

    if (available.length === 0) continue;

    // 随机选一条
    const chosen = shuffle(available)[0];

    try {
      await client.query(
        `UPDATE club_posts SET "sourceUrl" = $1, "sourcePlatform" = $2 WHERE id = $3`,
        [chosen.source_url, chosen.source_platform, post.id]
      );
      step2Updated++;
      // 标记已用
      if (!usedUrls2.has(post.clubId)) usedUrls2.set(post.clubId, new Set());
      usedUrls2.get(post.clubId).add(chosen.source_url);
    } catch (e) {
      console.log(`[跳过] 帖子 ${post.id} Step2更新失败: ${e.message}`);
    }
  }
  console.log(`[Step2] 成功补充 sourceUrl: ${step2Updated} 篇`);

  // ========== 5. 输出统计 ==========
  console.log(`\n===== 最终统计 =====`);
  console.log(`总素材条数: ${allRecords.length}`);
  console.log(`去重后素材条数: ${dedupedRecords.length}`);

  let brandMapped = 0;
  for (const [brand] of brandMaterials) {
    if (brandToClub.has(brand)) brandMapped++;
  }
  console.log(`品牌→clubId映射成功数: ${brandMapped}/${brandMaterials.size}`);
  console.log(`Step1 标题匹配更新: ${step1Updated} 篇`);
  console.log(`Step2 随机补充更新: ${step2Updated} 篇`);

  const finalRes = await client.query(
    `SELECT count(*) as total, count("sourceUrl") as has_url, count(CASE WHEN "sourceUrl" IS NULL OR "sourceUrl" = '' THEN 1 END) as no_url FROM club_posts`
  );
  const f = finalRes.rows[0];
  console.log(`最终有sourceUrl的帖子: ${f.has_url}/${f.total} (${(Number(f.has_url) / Number(f.total) * 100).toFixed(1)}%)`);
  console.log(`仍无sourceUrl的帖子: ${f.no_url}`);

  const platformRes = await client.query(
    `SELECT "sourcePlatform", count(*) as cnt FROM club_posts GROUP BY "sourcePlatform" ORDER BY cnt DESC`
  );
  console.log(`\n按来源平台统计:`);
  for (const row of platformRes.rows) {
    console.log(`  ${row.sourcePlatform || "(空)"}: ${row.cnt}`);
  }

  const brandRes = await client.query(
    `SELECT c.brand, c.name, count(cp.id) as total, count(cp."sourceUrl") as has_url
     FROM clubs c LEFT JOIN club_posts cp ON cp."clubId" = c.id
     GROUP BY c.brand, c.name ORDER BY has_url ASC, c.brand`
  );
  console.log(`\n按品牌sourceUrl覆盖率（低→高）:`);
  for (const row of brandRes.rows) {
    const t = Number(row.total);
    const h = Number(row.has_url);
    const pct = t > 0 ? (h / t * 100).toFixed(0) : 0;
    console.log(`  ${row.brand}(${row.name}): ${h}/${t} (${pct}%)`);
  }

} finally {
  client.release();
  await pool.end();
}
