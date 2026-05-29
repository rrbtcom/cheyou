import { prisma } from "@/lib/prisma";
import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "销量榜单",
  description: "2025年中国汽车销量排行榜，涵盖总榜、新能源榜、轿车榜、SUV榜，数据来源于乘联会及中汽协。",
};

type Tab = "all" | "ev" | "sedan" | "suv";

function s(v: unknown) {
  if (v == null) return null;
  const num = Number(v);
  if (isNaN(num)) return String(v);
  return String(Math.round(num * 100) / 100);
}

function formatSales(n: number | null) {
  if (!n) return "—";
  if (n >= 10000) return `${(n / 10000).toFixed(1)}万`;
  return n.toLocaleString("zh-CN");
}

function SalesBadge({ rank }: { rank: number }) {
  if (rank === 1) return <span className="inline-block w-7 h-7 leading-7 text-center rounded-full bg-yellow-400 text-white font-bold text-sm">1</span>;
  if (rank === 2) return <span className="inline-block w-7 h-7 leading-7 text-center rounded-full bg-gray-300 text-white font-bold text-sm">2</span>;
  if (rank === 3) return <span className="inline-block w-7 h-7 leading-7 text-center rounded-full bg-amber-600 text-white font-bold text-sm">3</span>;
  return <span className="inline-block w-7 h-7 leading-7 text-center rounded-full bg-gray-100 text-gray-500 font-medium text-sm">{rank}</span>;
}

function EvTypeBadge({ type }: { type: string | null }) {
  if (!type) return null;
  const colors: Record<string, string> = {
    "纯电": "bg-green-50 text-green-700",
    "插混": "bg-blue-50 text-blue-700",
    "增程": "bg-purple-50 text-purple-700",
    "燃油": "bg-gray-100 text-gray-600",
  };
  return <span className={`text-xs px-1.5 py-0.5 rounded ${colors[type] || "bg-gray-50 text-gray-500"}`}>{type}</span>;
}

export default async function RankingPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab = "all" } = await searchParams;
  const activeTab = tab as Tab;

  // Build where clause based on tab
  const where = {
    status: "active" as const,
    salesVolume2025: { not: null as unknown as number },
    ...(activeTab === "ev" ? { evType: { not: "燃油" } } : {}),
    ...(activeTab === "sedan" ? { level: "轿车" } : {}),
    ...(activeTab === "suv" ? { level: "SUV" } : {}),
  };

  const models = await prisma.model.findMany({
    where,
    include: { brand: true },
    orderBy: { salesVolume2025: "desc" },
    take: 100,
  });

  const tabs: { key: Tab; label: string; icon: string }[] = [
    { key: "all", label: "销量总榜", icon: "🏆" },
    { key: "ev", label: "新能源榜", icon: "⚡" },
    { key: "sedan", label: "轿车榜", icon: "🚗" },
    { key: "suv", label: "SUV榜", icon: "🚙" },
  ];

  // Stats
  const totalSales = models.reduce((sum, m) => sum + (m.salesVolume2025 || 0), 0);
  const evCount = models.filter((m) => m.evType !== "燃油").length;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* 标题 */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">销量榜单</h1>
        <p className="text-gray-500 mt-1">2025年中国汽车销量排行 · 数据来源：乘联会/中汽协</p>
      </div>

      {/* Tab */}
      <div className="flex gap-2 mb-6 border-b pb-3">
        {tabs.map((t) => (
          <Link
            key={t.key}
            href={`/ranking?tab=${t.key}`}
            className={`px-4 py-2.5 text-sm font-medium rounded-t-lg transition ${
              activeTab === t.key
                ? "bg-blue-600 text-white"
                : "text-gray-500 hover:text-blue-600 hover:bg-blue-50"
            }`}
          >
            <span className="mr-1">{t.icon}</span>
            {t.label}
          </Link>
        ))}
      </div>

      {/* 统计 */}
      {models.length > 0 && (
        <div className="flex gap-4 mb-6 text-sm text-gray-500">
          <span>共 <strong className="text-gray-900">{models.length}</strong> 款车型</span>
          <span>总销量 <strong className="text-gray-900">{formatSales(totalSales)}</strong></span>
          {activeTab === "all" && (
            <span>新能源占比 <strong className="text-green-600">{models.length > 0 ? Math.round((evCount / models.length) * 100) : 0}%</strong></span>
          )}
        </div>
      )}

      {/* 榜单列表 */}
      {models.length > 0 ? (
        <div className="bg-white border rounded-lg overflow-hidden">
          {/* 表头 */}
          <div className="grid grid-cols-12 gap-2 px-4 py-3 bg-gray-50 text-xs text-gray-500 font-medium border-b">
            <div className="col-span-1 text-center">排名</div>
            <div className="col-span-4">车型</div>
            <div className="col-span-2 text-center">类型</div>
            <div className="col-span-2 text-right">指导价</div>
            <div className="col-span-3 text-right">2025年销量</div>
          </div>

          {/* 数据行 */}
          {models.map((m, idx) => (
            <Link
              key={m.id}
              href={`/new-cars/${m.slug}`}
              className={`grid grid-cols-12 gap-2 px-4 py-3 items-center border-b last:border-b-0 hover:bg-blue-50/50 transition ${
                idx < 3 ? "bg-yellow-50/30" : ""
              }`}
            >
              <div className="col-span-1 flex justify-center">
                <SalesBadge rank={idx + 1} />
              </div>
              <div className="col-span-4 flex items-center gap-3">
                <div className="w-12 h-8 bg-gray-50 rounded shrink-0 relative overflow-hidden">
                  {m.imageUrl ? (
                    <Image src={m.imageUrl} alt={m.name} fill className="object-cover" sizes="48px" />
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-300 text-xs">🚗</div>
                  )}
                </div>
                <div className="min-w-0">
                  <div className="font-medium text-sm truncate">{m.brand.name} {m.name}</div>
                  <div className="text-xs text-gray-400">{m.level}</div>
                </div>
              </div>
              <div className="col-span-2 flex justify-center gap-1">
                <EvTypeBadge type={m.evType} />
              </div>
              <div className="col-span-2 text-right text-sm text-gray-600">
                {m.priceMin && m.priceMax ? `${s(m.priceMin)}-${s(m.priceMax)}万` : "暂无报价"}
              </div>
              <div className="col-span-3 text-right">
                <span className="font-bold text-gray-900">{formatSales(m.salesVolume2025)}</span>
                <span className="text-xs text-gray-400 ml-1">辆</span>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 text-gray-400">
          <div className="text-5xl mb-4">📊</div>
          <p>暂无销量数据</p>
        </div>
      )}
    </div>
  );
}
