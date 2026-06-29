import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { WaterfallGrid } from "@/components/waterfall/PostCard";

export const metadata: Metadata = {
  title: "二手车 - 选车导购·避坑检测·行情保值率",
  description: "二手车选购指南、检测知识、避坑攻略、保值率行情。覆盖轿车/SUV/新能源/豪华车各品类，帮你选到最值的二手车。",
};

export const dynamic = "force-dynamic";

const USED_CAR_CLUBS = [
  { slug: "ershou-daogou", name: "二手车导购", icon: "📋", desc: "选车指南·对比评测" },
  { slug: "ershou-jiaoche", name: "二手轿车精选", icon: "🚗", desc: "家用·运动·商务" },
  { slug: "ershou-suv", name: "二手SUV精选", icon: "🚙", desc: "城市SUV·硬派越野" },
  { slug: "ershou-xinnengyuan", name: "二手新能源", icon: "⚡", desc: "电池·续航·充电桩" },
  { slug: "ershou-haohua", name: "二手豪华车", icon: "💎", desc: "BBA·保时捷·雷克萨斯" },
  { slug: "5wan-nei-haoche", name: "5万内好车", icon: "💰", desc: "代步神器·练手首选" },
  { slug: "10wan-ji-haoche", name: "10万级好车", icon: "🏆", desc: "家用主力·品质之选" },
  { slug: "ershou-jiance", name: "二手车检测", icon: "🔍", desc: "验车知识·检测要点" },
  { slug: "ershou-bikeng", name: "避坑指南", icon: "🛡️", desc: "防骗·合同·过户" },
  { slug: "ershou-hangqing", name: "二手车行情", icon: "📈", desc: "保值率·价格走势" },
];

type PostForFeed = {
  id: string;
  title: string;
  content: string | null;
  images: string[] | null;
  videoUrl: string | null;
  sourceUrl: string | null;
  sourcePlatform: string | null;
  publishedAt: Date | null;
  clubId: string;
  clubName: string;
  clubBrand: string | null;
  clubSlug: string;
};

async function getUsedCarPosts(clubSlug?: string): Promise<PostForFeed[]> {
  const where: Record<string, unknown> = {};
  if (clubSlug) {
    // Find club by slug first
    const club = await prisma.club.findUnique({ where: { slug: clubSlug }, select: { id: true } });
    if (club) where.clubId = club.id;
    else return [];
  } else {
    // All used car category posts
    where.club = { category: "used_car" };
  }

  const posts = await prisma.clubPost.findMany({
    where,
    orderBy: { publishedAt: "desc" },
    take: 200,
    include: { club: { select: { id: true, name: true, brand: true, slug: true } } },
  });
  return posts.map((p) => ({
    id: p.id,
    title: p.title,
    content: p.content,
    images: p.images as string[] | null,
    videoUrl: p.videoUrl,
    sourceUrl: p.sourceUrl,
    sourcePlatform: p.sourcePlatform,
    publishedAt: p.publishedAt,
    clubId: p.club.id,
    clubName: p.club.name,
    clubBrand: p.club.brand,
    clubSlug: p.club.slug,
  }));
}

async function getClubPostCounts(): Promise<Record<string, number>> {
  const clubs = await prisma.club.findMany({
    where: { category: "used_car" },
    select: { id: true, slug: true },
  });

  const counts: Record<string, number> = {};
  for (const c of clubs) {
    const count = await prisma.clubPost.count({ where: { clubId: c.id } });
    counts[c.slug] = count;
  }
  return counts;
}

export default async function UsedCarsPage({
  searchParams,
}: {
  searchParams: Promise<{ club?: string }>;
}) {
  const { club } = await searchParams;
  const [posts, counts] = await Promise.all([
    getUsedCarPosts(club),
    getClubPostCounts(),
  ]);

  const activeClub = USED_CAR_CLUBS.find((c) => c.slug === club);

  return (
    <div className="max-w-5xl mx-auto px-3">
      {/* Header */}
      <div className="pt-4 pb-2">
        <h1 className="text-xl font-bold text-gray-900">
          {activeClub ? activeClub.name : "二手车"}
        </h1>
        <p className="text-sm text-gray-500 mt-0.5">
          {activeClub ? activeClub.desc : "选车导购 · 避坑检测 · 行情保值率"}
        </p>
      </div>

      {/* Club cards — horizontal scroll */}
      <div className="flex gap-2.5 overflow-x-auto pb-3 scrollbar-hide" style={{ scrollbarWidth: "none" }}>
        <Link
          href="/used-cars"
          className={`shrink-0 flex flex-col items-center w-[72px] p-2.5 rounded-xl transition-colors ${
            !club
              ? "bg-red-500 text-white shadow-sm"
              : "bg-gray-50 text-gray-600 hover:bg-gray-100"
          }`}
        >
          <span className="text-lg">🔥</span>
          <span className="text-[10px] font-medium mt-1 text-center leading-tight">全部</span>
          <span className={`text-[9px] mt-0.5 ${!club ? "text-red-200" : "text-gray-400"}`}>
            {Object.values(counts).reduce((a, b) => a + b, 0).toLocaleString()}
          </span>
        </Link>
        {USED_CAR_CLUBS.map((c) => {
          const isActive = club === c.slug;
          const count = counts[c.slug] || 0;
          return (
            <Link
              key={c.slug}
              href={`/used-cars?club=${c.slug}`}
              className={`shrink-0 flex flex-col items-center w-[72px] p-2.5 rounded-xl transition-colors ${
                isActive
                  ? "bg-red-500 text-white shadow-sm"
                  : "bg-gray-50 text-gray-600 hover:bg-gray-100"
              }`}
            >
              <span className="text-lg">{c.icon}</span>
              <span className="text-[10px] font-medium mt-1 text-center leading-tight">{c.name.replace("二手", "").replace("精选", "")}</span>
              <span className={`text-[9px] mt-0.5 ${isActive ? "text-red-200" : "text-gray-400"}`}>
                {count >= 10000 ? `${(count / 10000).toFixed(1)}w` : count.toLocaleString()}
              </span>
            </Link>
          );
        })}
      </div>

      {/* Posts waterfall */}
      <div className="pt-1 pb-6">
        {posts.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <p className="text-4xl mb-3">📝</p>
            <p className="text-sm">暂无内容</p>
          </div>
        ) : (
          <WaterfallGrid posts={posts} gap={10} />
        )}
      </div>
    </div>
  );
}
