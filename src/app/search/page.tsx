import { prisma } from "@/lib/prisma";
import Link from "next/link";
import Image from "next/image";
import SearchBox from "@/components/SearchBox";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "搜索",
  description: "搜索车友荟的车型、资讯和二手车源",
};

type Tab = "all" | "models" | "articles" | "used-cars";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; tab?: string }>;
}) {
  const { q = "", tab = "all" } = await searchParams;
  const query = q.trim();
  const activeTab = tab as Tab;

  let models: any[] = [];
  let articles: any[] = [];
  let carSources: any[] = [];

  if (query) {
    const words = query.split(/\s+/).filter(Boolean);

    [models, articles, carSources] = await Promise.all([
      prisma.model.findMany({
        where: {
          status: "active",
          OR: [
            { name: { contains: query, mode: "insensitive" } },
            { brand: { name: { contains: query, mode: "insensitive" } } },
            { level: { contains: query, mode: "insensitive" } },
            { evType: { contains: query, mode: "insensitive" } },
            ...(words.length > 1
              ? words.map((w) => ({ name: { contains: w, mode: "insensitive" as const } }))
              : []),
          ],
        },
        include: { brand: true },
        take: 20,
        orderBy: { createdAt: "desc" },
      }),
      prisma.article.findMany({
        where: {
          publishedAt: { not: null },
          OR: [
            { title: { contains: query, mode: "insensitive" } },
            { content: { contains: query, mode: "insensitive" } },
          ],
        },
        include: { model: { include: { brand: true } } },
        take: 20,
        orderBy: { publishedAt: "desc" },
      }),
      prisma.carSource.findMany({
        where: {
          status: "active",
          OR: [
            { model: { name: { contains: query, mode: "insensitive" } } },
            { model: { brand: { name: { contains: query, mode: "insensitive" } } } },
            { city: { contains: query, mode: "insensitive" } },
            { description: { contains: query, mode: "insensitive" } },
          ],
        },
        include: { model: { include: { brand: true } } },
        take: 20,
        orderBy: { publishedAt: "desc" },
      }),
    ]);
  }

  const totalCount = models.length + articles.length + carSources.length;

  const tabs: { key: Tab; label: string; count: number }[] = [
    { key: "all", label: "全部", count: totalCount },
    { key: "models", label: "车型", count: models.length },
    { key: "articles", label: "资讯", count: articles.length },
    { key: "used-cars", label: "二手车", count: carSources.length },
  ];

  const s = (v: unknown) => {
    const num = Number(v);
    if (isNaN(num)) return String(v);
    return String(Math.round(num * 100) / 100);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* 搜索框 */}
      <div className="max-w-2xl mx-auto mb-8">
        <SearchBox defaultValue={query} size="lg" />
      </div>

      {query ? (
        <>
          {/* 结果统计 */}
          <p className="text-gray-500 text-sm mb-6">
            搜索 &ldquo;<span className="text-gray-900 font-medium">{query}</span>&rdquo; 
            共找到 <span className="font-medium text-gray-900">{totalCount}</span> 条结果
          </p>

          {/* Tab 切换 */}
          <div className="flex gap-1 border-b mb-6">
            {tabs.map((t) => (
              <Link
                key={t.key}
                href={`/search?q=${encodeURIComponent(query)}&tab=${t.key}`}
                className={`px-4 py-2.5 text-sm font-medium border-b-2 transition ${
                  activeTab === t.key
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                {t.label}
                <span className="ml-1 text-xs text-gray-400">({t.count})</span>
              </Link>
            ))}
          </div>

          {/* 结果列表 */}
          {(activeTab === "all" || activeTab === "models") && models.length > 0 && (
            <section className="mb-8">
              {activeTab === "all" && (
                <h2 className="text-lg font-bold text-gray-900 mb-4">车型</h2>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {models.map((m) => (
                  <Link
                    key={m.id}
                    href={`/new-cars/${m.slug}`}
                    className="border rounded-lg p-4 hover:shadow-md transition"
                  >
                    <div className="h-32 bg-gray-50 rounded mb-3 flex items-center justify-center overflow-hidden relative">
                      {m.imageUrl ? (
                        <Image
                          src={m.imageUrl}
                          alt={`${m.brand.name} ${m.name}`}
                          fill
                          className="object-cover"
                          sizes="(max-width: 768px) 100vw, 25vw"
                        />
                      ) : (
                        <span className="text-gray-300 text-sm">{m.brand.name} {m.name}</span>
                      )}
                    </div>
                    <div className="text-xs text-blue-600 mb-1">{m.evType} · {m.level}</div>
                    <h3 className="font-medium">{m.brand.name} {m.name}</h3>
                    <p className="text-sm text-gray-500 mt-1">
                      {m.priceMin && m.priceMax
                        ? `${s(m.priceMin)}-${s(m.priceMax)}万`
                        : "暂无报价"}
                    </p>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {(activeTab === "all" || activeTab === "articles") && articles.length > 0 && (
            <section className="mb-8">
              {activeTab === "all" && (
                <h2 className="text-lg font-bold text-gray-900 mb-4">资讯</h2>
              )}
              <div className="space-y-3">
                {articles.map((a) => (
                  <Link
                    key={a.id}
                    href={`/news/${a.slug}`}
                    className="block p-4 border rounded-lg hover:shadow-md hover:border-blue-200 transition"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-xs px-2 py-0.5 bg-blue-50 text-blue-600 rounded">
                          {a.type === "news" ? "新闻" : a.type === "review" ? "评测" : "导购"}
                        </span>
                        <h3 className="font-medium mt-1">{a.title}</h3>
                        {a.model && (
                          <p className="text-xs text-gray-400 mt-1">
                            关联车型：{a.model.brand.name} {a.model.name}
                          </p>
                        )}
                      </div>
                      <span className="text-xs text-gray-400 whitespace-nowrap ml-4">
                        {a.publishedAt?.toLocaleDateString("zh-CN")}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 mt-2 line-clamp-2">{a.content.slice(0, 120)}...</p>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {(activeTab === "all" || activeTab === "used-cars") && carSources.length > 0 && (
            <section className="mb-8">
              {activeTab === "all" && (
                <h2 className="text-lg font-bold text-gray-900 mb-4">二手车源</h2>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {carSources.map((cs) => (
                  <Link
                    key={cs.id}
                    href={`/used-cars/${cs.id}`}
                    className="border rounded-lg overflow-hidden hover:shadow-md transition"
                  >
                    <div className="h-40 bg-gray-50 relative">
                      {cs.model.imageUrl ? (
                        <Image
                          src={cs.model.imageUrl}
                          alt={`${cs.model.brand.name} ${cs.model.name}`}
                          fill
                          className="object-cover"
                          sizes="(max-width: 768px) 100vw, 33vw"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full text-gray-300 text-sm">
                          {cs.model.brand.name} {cs.model.name}
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold">{cs.model.brand.name} {cs.model.name}</h3>
                      <div className="flex gap-2 mt-2 text-xs text-gray-500">
                        <span>{cs.year}年</span>
                        <span>{s(cs.mileage)}万公里</span>
                        <span>{cs.city}</span>
                      </div>
                      <p className="text-red-600 font-bold text-lg mt-2">{s(cs.price)}万</p>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {totalCount === 0 && (
            <div className="text-center py-16 text-gray-400">
              <div className="text-5xl mb-4">🔍</div>
              <p className="text-lg mb-2">没有找到相关结果</p>
              <p className="text-sm">试试换个关键词，比如品牌名、车型名、城市等</p>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-16 text-gray-400">
          <div className="text-5xl mb-4">🚗</div>
          <p className="text-lg">输入关键词搜索车型、资讯和二手车源</p>
        </div>
      )}
    </div>
  );
}
