import { prisma } from "@/lib/prisma";
import MonthSelector from "./MonthSelector";
import TypeSelector from "./TypeSelector";
import Image from "next/image";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "销量榜单",
  description: "中国汽车月度销量排行榜，数据综合分析权威行业数据。",
};

function formatSales(n: number | null) {
  if (!n) return "—";
  if (n >= 10000) return `${(n / 10000).toFixed(1)}万`;
  return n.toLocaleString("zh-CN");
}

function formatPrice(min: number | null, max: number | null) {
  if (!min && !max) return "暂无报价";
  if (min && max && min === max) return `${min}万`;
  if (min && max) return `${min}-${max}万`;
  if (min) return `${min}万起`;
  return `${max}万`;
}

function RankChange({ change }: { change: number | null }) {
  if (change === null || change === 0) {
    return <span className="text-gray-300 text-xs">—</span>;
  }
  if (change > 0) {
    return (
      <span className="inline-flex items-center text-orange-500 text-xs font-medium">
        <svg className="w-3 h-3 mr-0.5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L10 6.414l-3.293 3.293a1 1 0 01-1.414 0z" clipRule="evenodd" />
        </svg>
        升{Math.abs(change)}位
      </span>
    );
  }
  return (
    <span className="inline-flex items-center text-green-500 text-xs font-medium">
      <svg className="w-3 h-3 mr-0.5" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M14.707 10.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L10 13.586l3.293-3.293a1 1 0 011.414 0z" clipRule="evenodd" />
      </svg>
      降{Math.abs(change)}位
    </span>
  );
}

function RankBadge({ rank, change }: { rank: number; change: number | null }) {
  const colors = ["bg-yellow-400", "bg-gray-300", "bg-amber-600"];
  return (
    <div className="flex flex-col items-center gap-0.5">
      <span className={`inline-flex items-center justify-center w-9 h-9 rounded-full text-white font-bold text-base shadow ${colors[rank - 1] || "bg-gray-100 text-gray-500"}`}>
        {rank}
      </span>
      <RankChange change={change} />
    </div>
  );
}

export default async function SalesRankPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; type?: string }>;
}) {
  const { month, type } = await searchParams;

  // 可选月份
  const allPeriods = await prisma.salesRank.findMany({
    select: { period: true },
    distinct: ["period"],
    orderBy: { period: "desc" },
  });
  const latestPeriod = allPeriods[0]?.period || null;
  const activePeriod = month || latestPeriod;
  const availableMonths = allPeriods.map((p) => p.period).slice(0, 12);

  // 上月周期（计算排名变化）
  const prevPeriod = (() => {
    if (!latestPeriod) return null;
    const [y, m] = latestPeriod.split("-").map(Number);
    const prevM = m === 1 ? 12 : m - 1;
    const prevY = m === 1 ? y - 1 : y;
    return `${prevY}-${String(prevM).padStart(2, "0")}`;
  })();

  // 查询当前月数据（综合所有来源）
  const rows = activePeriod
    ? await prisma.salesRank.findMany({
        where: activePeriod ? { period: activePeriod } : {},
        orderBy: { rank: "asc" },
        take: 200,
      })
    : [];

  // 过滤车型分类
  const filtered = type && type !== "all"
    ? rows.filter((r) => r.rankType === type)
    : rows;

  // 上月排名映射（综合）
  let prevRanks: Record<string, number> = {};
  if (prevPeriod) {
    const prevData = await prisma.salesRank.findMany({
      where: { period: prevPeriod },
      select: { model: true, brand: true, rank: true },
    });
    prevRanks = Object.fromEntries(prevData.map((p) => [`${p.brand} ${p.model}`, p.rank]));
  }

  // 关联车型详情（价格/图片/slug）
  const brandModelPairs = [...new Set(filtered.map((r) => ({ brand: r.brand, model: r.model })))];
  const modelDetails = await prisma.model.findMany({
    where: {
      OR: brandModelPairs.map((bp) => ({
        brand: { name: bp.brand },
        name: { contains: bp.model },
      })),
    },
    include: { brand: true },
    take: brandModelPairs.length,
  });
  const modelMap = new Map<string, (typeof modelDetails)[0]>();
  for (const m of modelDetails) {
    for (const bp of brandModelPairs) {
      if (m.brand.name === bp.brand && m.name.includes(bp.model)) {
        const key = `${bp.brand}::${bp.model}`;
        if (!modelMap.has(key)) modelMap.set(key, m);
      }
    }
  }

  // 合并展示（按销量降序）
  const merged = filtered
    .sort((a, b) => b.sales - a.sales)
    .slice(0, 200)
    .map((r, idx) => {
      const key = `${r.brand}::${r.model}`;
      const model = modelMap.get(key);
      const prevRank = prevRanks[`${r.brand} ${r.model}`];
      const change = prevRank ? r.rank - prevRank : null;
      return { ...r, rankNum: idx + 1, change, model };
    });

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* 标题 */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">📊 销量榜单</h1>
        <p className="text-gray-400 text-xs mt-1">数据综合分析权威行业数据，每月10日左右更新</p>
      </div>

      {/* 筛选栏 */}
      <div className="flex flex-wrap items-center gap-3 mb-6 pb-4 border-b">
        <MonthSelector availableMonths={availableMonths} activePeriod={activePeriod} />
        <div className="h-5 w-px bg-gray-200 hidden sm:block" />
        <TypeSelector activeType={type || "all"} />
      </div>

      {rows.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <div className="text-6xl mb-4">📊</div>
          <p className="text-lg">暂无销量数据</p>
          <p className="text-sm mt-1">数据每月10日左右更新</p>
        </div>
      ) : (
        <>
          {/* 概览 */}
          <div className="flex gap-3 mb-6 flex-wrap">
            <div className="border rounded-lg px-4 py-2.5 text-center min-w-[90px] bg-gray-100 text-gray-700">
              <div className="text-xs opacity-70">全部车型</div>
              <div className="text-xl font-bold">{rows.length}</div>
            </div>
          </div>

          {/* 列表 */}
          {merged.length === 0 ? (
            <div className="text-center py-12 text-gray-400 text-sm">该分类暂无数据</div>
          ) : (
            <div className="bg-white border rounded-xl overflow-hidden">
              {/* 表头 */}
              <div className="hidden md:grid grid-cols-12 gap-2 px-4 py-2.5 bg-gray-50 text-xs text-gray-400 font-medium border-b">
                <div className="col-span-1 text-center">排名</div>
                <div className="col-span-5 flex items-center gap-3">
                  <span className="w-16">车型图片</span>
                  <span>车型名称</span>
                </div>
                <div className="col-span-2 text-center">指导价</div>
                <div className="col-span-4 col-start-11 text-right">车系销量</div>
              </div>

              {merged.map((r) => (
                <div
                  key={r.id}
                  className={"grid grid-cols-12 gap-2 px-4 py-3 items-center border-b last:border-b-0 hover:bg-blue-50/40 transition" + (r.rankNum <= 3 ? " bg-yellow-50/20" : "")}
                >
                  {/* 排名+涨跌 */}
                  <div className="col-span-1 flex justify-center">
                    <RankBadge rank={r.rankNum} change={r.change} />
                  </div>

                  {/* 车型图片+名称 */}
                  <div className="col-span-5 flex items-center gap-3">
                    <div className="w-16 h-12 bg-gray-100 rounded-lg overflow-hidden relative shrink-0">
                      {r.model?.imageUrl ? (
                        <Image src={r.model.imageUrl} alt={r.model.name} fill className="object-cover" sizes="64px" />
                      ) : (
                        <div className="flex items-center justify-center h-full text-gray-300 text-xl">🚗</div>
                      )}
                    </div>
                    <div className="min-w-0">
                      {r.model?.slug ? (
                        <a href={"/new-cars/" + r.model.slug} className="font-medium text-sm text-gray-900 hover:text-blue-600 transition truncate block">
                          {r.brand} {r.model.name}
                        </a>
                      ) : (
                        <div className="font-medium text-sm text-gray-900 truncate">{r.brand} {r.model?.name || r.model}</div>
                      )}
                      <div className="text-xs text-gray-400">{r.brand}</div>
                    </div>
                  </div>

                  {/* 指导价 */}
                  <div className="col-span-3 md:col-span-2 text-center">
                    <span className="text-sm text-gray-700">
                      {formatPrice(r.model?.priceMin ?? null, r.model?.priceMax ?? null)}
                    </span>
                  </div>

                  {/* 销量+查成交价 */}
                  <div className="col-span-3 md:col-span-4 flex md:flex-col items-center md:items-end justify-between md:justify-center gap-2">
                    <div className="text-right">
                      <span className="font-bold text-gray-900">{formatSales(r.sales)}</span>
                      <span className="text-xs text-gray-400 ml-0.5">辆</span>
                    </div>
                    {r.model?.slug ? (
                      <a href={"/new-cars/" + r.model.slug} className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 transition whitespace-nowrap font-medium">
                        查成交价
                      </a>
                    ) : (
                      <span className="text-xs text-gray-300">—</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* 数据说明 */}
          <div className="mt-8 p-4 bg-gray-50 rounded-xl text-xs text-gray-500">
            <div className="pt-1">数据综合分析自中汽协、乘联会、中汽中心等权威来源 · 每月10日左右更新</div>
          </div>
        </>
      )}
    </div>
  );
}
