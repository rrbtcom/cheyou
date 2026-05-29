import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "新车资讯",
  description: "最新新能源车资讯、车型评测、导购指南，帮您全面了解新能源车市场动态。",
};

export default async function NewCarsPage() {
  const brands = await prisma.brand.findMany({ orderBy: { name: "asc" } });
  const models = await prisma.model.findMany({
    where: { status: "active" },
    include: { brand: true },
    orderBy: [{ evType: "asc" }, { priceMin: "asc" }],
  });

  const evModels = models.filter((m) => m.evType !== "燃油");
  const fuelModels = models.filter((m) => m.evType === "燃油");

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">新车资讯</h1>
      <p className="text-gray-500 mb-8">最新新能源车资讯、评测与导购指南</p>

      {/* 品牌筛选 */}
      <div className="flex gap-2 mb-8 flex-wrap">
        <span className="px-3 py-1 bg-blue-600 text-white rounded-full text-sm">全部品牌</span>
        {brands.map((b) => (
          <Link
            key={b.id}
            href={`#brand-${b.id}`}
            className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm hover:bg-blue-50 hover:text-blue-600"
          >
            {b.name}
          </Link>
        ))}
      </div>

      {/* 新能源车型 */}
      <section className="mb-10">
        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <span className="w-1 h-6 bg-green-500 rounded"></span>
          新能源车型 ({evModels.length})
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {evModels.map((m) => (
            <Link
              key={m.id}
              href={`/new-cars/${m.slug}`}
              className="border rounded-lg overflow-hidden hover:shadow-md transition"
            >
              <div className="h-40 bg-gray-50 relative">
                {m.imageUrl ? (
                  <Image src={m.imageUrl} alt={`${m.brand.name} ${m.name}`} fill className="object-cover" sizes="(max-width: 768px) 100vw, 33vw" />
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-300 text-sm">{m.brand.name} {m.name}</div>
                )}
              </div>
              <div className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-xs px-2 py-0.5 bg-green-50 text-green-700 rounded">{m.evType}</span>
                  <span className="text-xs text-gray-400">{m.level}</span>
                </div>
                <h3 className="font-semibold text-lg">
                  {m.brand.name} {m.name}
                </h3>
                <p className="text-red-600 font-medium mt-1">
                  {m.priceMin && m.priceMax ? `${m.priceMin}-${m.priceMax}万` : "暂无报价"}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* 燃油车型 */}
      {fuelModels.length > 0 && (
        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <span className="w-1 h-6 bg-gray-400 rounded"></span>
            燃油车型 ({fuelModels.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {fuelModels.map((m) => (
              <Link
                key={m.id}
                href={`/new-cars/${m.slug}`}
                className="border rounded-lg overflow-hidden hover:shadow-md transition"
              >
                <div className="h-40 bg-gray-50 relative">
                  {m.imageUrl ? (
                    <Image src={m.imageUrl} alt={`${m.brand.name} ${m.name}`} fill className="object-cover" sizes="(max-width: 768px) 100vw, 33vw" />
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-300 text-sm">{m.brand.name} {m.name}</div>
                  )}
                </div>
                <div className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded">燃油</span>
                    <span className="text-xs text-gray-400">{m.level}</span>
                  </div>
                  <h3 className="font-semibold text-lg">
                    {m.brand.name} {m.name}
                  </h3>
                  <p className="text-gray-600 font-medium mt-1">
                    {m.priceMin && m.priceMax ? `${m.priceMin}-${m.priceMax}万` : "暂无报价"}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
