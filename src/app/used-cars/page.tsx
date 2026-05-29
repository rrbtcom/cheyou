import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "二手车",
  description: "真实二手车源信息，买卖双方直接对接，无中间商赚差价。新能源二手车信息撮合平台。",
};

export default async function UsedCarsPage() {
  const carSources = await prisma.carSource.findMany({
    where: { status: "active" },
    include: { model: { include: { brand: true } } },
    orderBy: { publishedAt: "desc" },
  });

  const cities = [...new Set(carSources.map((cs) => cs.city))];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">二手车源</h1>
      <p className="text-gray-500 mb-8">真实车源，买卖直联，无中间商</p>
      <Link href="/used-cars/publish" className="inline-block px-5 py-2.5 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition mb-6">+ 发布我的车源</Link>

      {/* 筛选栏 */}
      <div className="bg-gray-50 rounded-lg p-4 mb-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <select className="border rounded-lg px-3 py-2 text-sm bg-white">
            <option>全部品牌</option>
          </select>
          <select className="border rounded-lg px-3 py-2 text-sm bg-white">
            <option>价格区间</option>
            <option>10万以下</option>
            <option>10-20万</option>
            <option>20-30万</option>
            <option>30万以上</option>
          </select>
          <select className="border rounded-lg px-3 py-2 text-sm bg-white">
            <option>全部车型</option>
            <option>轿车</option>
            <option>SUV</option>
          </select>
          <select className="border rounded-lg px-3 py-2 text-sm bg-white">
            <option>全部城市</option>
            {cities.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </div>
      </div>

      {/* 统计 */}
      <p className="text-sm text-gray-400 mb-4">共 {carSources.length} 条在售车源</p>

      {/* 车源列表 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {carSources.map((cs) => (
          <Link
            key={cs.id}
            href={`/used-cars/${cs.id}`}
            className="border rounded-lg overflow-hidden hover:shadow-md transition"
          >
            <div className="h-48 bg-gray-50 relative">
              {cs.model.imageUrl ? (
                <Image src={cs.model.imageUrl} alt={`${cs.model.brand.name} ${cs.model.name}`} fill className="object-cover" sizes="(max-width: 768px) 100vw, 33vw" />
              ) : (
                <div className="flex items-center justify-center h-full text-gray-300">{cs.model.brand.name} {cs.model.name}</div>
              )}
            </div>
            <div className="p-4">
              <h3 className="font-semibold text-lg">
                {cs.model.brand.name} {cs.model.name}
              </h3>
              <div className="flex gap-3 mt-2 text-sm text-gray-500">
                <span>{cs.year}年</span>
                <span>{String(cs.mileage)}万公里</span>
                <span>📍{cs.city}</span>
              </div>
              <div className="flex justify-between items-center mt-3">
                <span className="text-red-600 font-bold text-xl">{String(cs.price)}万</span>
                <span className="text-xs text-gray-400">直接联系卖家</span>
              </div>
              {cs.description && (
                <p className="text-sm text-gray-400 mt-2 line-clamp-2">{cs.description}</p>
              )}
            </div>
          </Link>
        ))}
      </div>

      {carSources.length === 0 && (
        <div className="text-center py-16 text-gray-400">
          <p className="text-lg">暂无在售车源</p>
          <p className="text-sm mt-2">新车源上线后将第一时间推送</p>
        </div>
      )}
    </div>
  );
}
