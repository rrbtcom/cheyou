import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const source = await prisma.carSource.findUnique({
    where: { id },
    include: { model: { include: { brand: true } } },
  });
  if (!source) return { title: "车源未找到" };

  return {
    title: `二手${source.model.brand.name} ${source.model.name} ${source.year}年 - ${String(source.price)}万`,
    description: `${source.year}年${source.model.brand.name} ${source.model.name}，${String(source.mileage)}万公里，${source.city}，售价${String(source.price)}万。${source.description || ""}`,
  };
}

export default async function CarSourceDetailPage({ params }: Props) {
  const { id } = await params;

  const source = await prisma.carSource.findUnique({
    where: { id },
    include: {
      model: { include: { brand: true } },
      seller: true,
      messages: { include: { user: true }, orderBy: { createdAt: "asc" } },
    },
  });

  if (!source) notFound();

  // 同款其他车源
  const sameModel = await prisma.carSource.findMany({
    where: { modelId: source.modelId, id: { not: source.id }, status: "active" },
    include: { model: { include: { brand: true } } },
    take: 4,
  });

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* 面包屑 */}
      <nav className="text-sm text-gray-400 mb-4">
        <Link href="/" className="hover:text-blue-600">首页</Link>
        <span className="mx-1">/</span>
        <Link href="/used-cars" className="hover:text-blue-600">二手车</Link>
        <span className="mx-1">/</span>
        <span className="text-gray-600">{source.model.brand.name} {source.model.name}</span>
      </nav>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* 左侧 - 车源信息 */}
        <div className="md:col-span-2 space-y-6">
          {/* 图片区 */}
          <div className="h-72 bg-gray-50 rounded-lg flex items-center justify-center overflow-hidden relative border">
            {source.model.imageUrl ? (
              <Image src={source.model.imageUrl} alt={`${source.model.brand.name} ${source.model.name}`} fill className="object-cover" sizes="(max-width: 768px) 100vw, 66vw" priority />
            ) : (
              <span className="text-gray-300 text-lg">{source.model.brand.name} {source.model.name}</span>
            )}
          </div>

          {/* 基本信息 */}
          <div className="bg-white border rounded-lg p-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {source.model.brand.name} {source.model.name}
            </h1>
            <div className="flex items-center gap-2 mb-4">
              <span className="text-xs px-2 py-0.5 bg-red-50 text-red-600 rounded">二手车</span>
              {source.model.evType && (
                <span className="text-xs px-2 py-0.5 bg-green-50 text-green-700 rounded">{source.model.evType}</span>
              )}
            </div>

            <div className="grid grid-cols-4 gap-4 text-center border-y py-4 mb-4">
              <div>
                <p className="text-gray-400 text-xs">上牌时间</p>
                <p className="font-medium">{source.year}年</p>
              </div>
              <div>
                <p className="text-gray-400 text-xs">表显里程</p>
                <p className="font-medium">{String(source.mileage)}万公里</p>
              </div>
              <div>
                <p className="text-gray-400 text-xs">所在城市</p>
                <p className="font-medium">{source.city}</p>
              </div>
              <div>
                <p className="text-gray-400 text-xs">车源状态</p>
                <p className="font-medium text-green-600">在售</p>
              </div>
            </div>

            {source.description && (
              <div>
                <h3 className="font-medium text-gray-900 mb-2">卖家描述</h3>
                <p className="text-gray-600 leading-relaxed">{source.description}</p>
              </div>
            )}
          </div>

          {/* 新车参考价 */}
          <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
            <h3 className="font-medium text-blue-900 mb-1">新车参考价</h3>
            <p className="text-sm text-blue-700">
              {source.model.brand.name} {source.model.name} 新车指导价：
              {source.model.priceMin && source.model.priceMax
                ? `${String(source.model.priceMin)}-${String(source.model.priceMax)}万`
                : "暂无"}
            </p>
            <Link href={`/new-cars/${source.model.slug}`} className="text-xs text-blue-600 hover:underline mt-1 inline-block">
              查看新车详情 →
            </Link>
          </div>
        </div>

        {/* 右侧 - 联系卖家 + 价格 */}
        <div className="space-y-4">
          <div className="bg-white border rounded-lg p-5 sticky top-20">
            <p className="text-3xl font-bold text-red-600 mb-1">{String(source.price)}<span className="text-lg">万</span></p>
            <p className="text-xs text-gray-400 mb-4">一口价</p>

            <div className="border-t pt-4 space-y-3">
              <div>
                <p className="text-xs text-gray-400">卖家</p>
                <p className="font-medium">{source.seller.nickname || "个人卖家"}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">联系方式</p>
                <p className="font-medium text-blue-600">{source.seller.phone}</p>
              </div>
            </div>

            <div className="mt-4 p-3 bg-yellow-50 rounded text-xs text-yellow-700">
              ⚠️ 交易提醒：见面交易，查验车辆，不轻信低价，不提前转账。
            </div>
          </div>
        </div>
      </div>

      {/* 同款车源 */}
      {sameModel.length > 0 && (
        <section className="mt-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">同款其他车源</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {sameModel.map((s) => (
              <Link
                key={s.id}
                href={`/used-cars/${s.id}`}
                className="border rounded-lg p-3 hover:shadow-md transition"
              >
                <h3 className="font-medium text-sm">{s.year}年 · {String(s.mileage)}万公里</h3>
                <p className="text-xs text-gray-400 mt-1">📍{s.city}</p>
                <p className="text-red-600 font-bold mt-1">{String(s.price)}万</p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Car",
            "name": `${source.model.brand.name} ${source.model.name}`,
            "modelDate": source.year,
            "mileageFromOdometer": { "@type": "QuantitativeValue", "value": String(source.mileage), "unitCode": "KMT" },
            "offers": { "@type": "Offer", "price": String(source.price), "priceCurrency": "CNY", "availability": "https://schema.org/InStock" },
          }),
        }}
      />
    </div>
  );
}
