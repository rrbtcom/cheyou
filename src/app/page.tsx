import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/prisma";

export default async function Home() {
  const [models, carSources, articles] = await Promise.all([
    prisma.model.findMany({
      where: { status: "active" },
      include: { brand: true },
      orderBy: { createdAt: "desc" },
      take: 8,
    }),
    prisma.carSource.findMany({
      where: { status: "active" },
      include: { model: { include: { brand: true } } },
      orderBy: { publishedAt: "desc" },
      take: 6,
    }),
    prisma.article.findMany({
      where: { publishedAt: { not: null } },
      orderBy: { publishedAt: "desc" },
      take: 5,
    }),
  ]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Hero */}
      <section className="text-center py-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">选好车，买好车</h1>
        <p className="text-lg text-gray-500 mb-8">专注新能源车的新车资讯与二手车信息撮合平台</p>
        <div className="flex justify-center gap-4">
          <Link href="/new-cars" className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            浏览新车
          </Link>
          <Link href="/used-cars" className="px-6 py-3 bg-white text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50">
            找二手车
          </Link>
        </div>
      </section>

      {/* 热门新能源车型 */}
      <section className="py-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">热门新能源车型</h2>
          <Link href="/new-cars" className="text-blue-600 text-sm hover:underline">查看更多 →</Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {models.map((m) => (
            <Link
              key={m.id}
              href={`/new-cars/${m.slug}`}
              className="border rounded-lg p-4 hover:shadow-md transition"
            >
              <div className="h-32 bg-gray-50 rounded mb-3 flex items-center justify-center overflow-hidden relative">
                {m.imageUrl ? (
                  <Image src={m.imageUrl} alt={`${m.brand.name} ${m.name}`} fill className="object-cover" sizes="(max-width: 768px) 100vw, 25vw" />
                ) : (
                  <span className="text-gray-300 text-sm">{m.brand.name} {m.name}</span>
                )}
              </div>
              <div className="text-xs text-blue-600 mb-1">{m.evType} · {m.level}</div>
              <h3 className="font-medium">{m.brand.name} {m.name}</h3>
              <p className="text-sm text-gray-500 mt-1">
                {m.priceMin && m.priceMax
                  ? `${m.priceMin}-${m.priceMax}万`
                  : "暂无报价"}
              </p>
            </Link>
          ))}
        </div>
      </section>

      {/* 最新车源 */}
      <section className="py-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">最新二手车源</h2>
          <Link href="/used-cars" className="text-blue-600 text-sm hover:underline">查看更多 →</Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {carSources.map((cs) => (
            <Link
              key={cs.id}
              href={`/used-cars/${cs.id}`}
              className="border rounded-lg overflow-hidden hover:shadow-md transition"
            >
              <div className="h-40 bg-gray-50 relative">
                {cs.model.imageUrl ? (
                  <Image src={cs.model.imageUrl} alt={`${cs.model.brand.name} ${cs.model.name}`} fill className="object-cover" sizes="(max-width: 768px) 100vw, 33vw" />
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-300 text-sm">{cs.model.brand.name} {cs.model.name}</div>
                )}
              </div>
              <div className="p-4">
              <h3 className="font-semibold">
                {cs.model.brand.name} {cs.model.name}
              </h3>
              <div className="flex gap-2 mt-2 text-xs text-gray-500">
                <span>{cs.year}年</span>
                <span>{String(cs.mileage)}万公里</span>
                <span>{cs.city}</span>
              </div>
              <p className="text-red-600 font-bold text-lg mt-2">{String(cs.price)}万</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* 精选资讯 */}
      <section className="py-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">精选资讯</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {articles.map((a) => (
            <Link
              key={a.id}
              href={`/news/${a.slug}`}
              className="block bg-white border border-gray-100 rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
            >
              <div className="h-36 bg-gray-100 relative overflow-hidden">
                {a.coverImage ? (
                  <Image src={a.coverImage} alt={a.title} fill className="object-cover" sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw" />
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-300">
                    <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                    </svg>
                  </div>
                )}
              </div>
              <div className="p-4">
                <span className="inline-block text-xs px-2 py-0.5 bg-blue-50 text-blue-600 rounded mb-2">
                  {a.type === "news" ? "新闻" : a.type === "review" ? "评测" : "导购"}
                </span>
                <h3 className="font-medium text-gray-900 line-clamp-2 leading-snug">{a.title}</h3>
                <span className="text-xs text-gray-400 mt-2 block">
                  {a.publishedAt?.toLocaleDateString("zh-CN")}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
