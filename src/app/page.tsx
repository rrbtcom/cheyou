import { prisma } from "@/lib/prisma";
import { WaterfallGrid } from "@/components/waterfall/PostCard";

export const dynamic = "force-dynamic";

const POPULAR_BRANDS = [
  "比亚迪", "特斯拉", "小米汽车", "理想", "问界", "五菱",
  "吉利", "蔚来", "小鹏", "零跑", "领克", "坦克", "极氪",
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

async function getFeedPosts(brand?: string): Promise<PostForFeed[]> {
  const where = brand ? { club: { brand } } : {};
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

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ brand?: string }>;
}) {
  const { brand } = await searchParams;
  const posts = await getFeedPosts(brand);

  return (
    <div>
      {/* Brand filter tabs */}
      <div className="sticky top-12 z-30 bg-white/90 backdrop-blur-sm border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-3">
          <div className="flex gap-1 overflow-x-auto py-2.5 scrollbar-hide" style={{ scrollbarWidth: "none" }}>
            <a
              href="/"
              className={`shrink-0 px-3.5 py-1.5 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
                !brand
                  ? "bg-red-500 text-white shadow-sm"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              推荐
            </a>
            {POPULAR_BRANDS.map((b) => (
              <a
                key={b}
                href={`/?brand=${encodeURIComponent(b)}`}
                className={`shrink-0 px-3.5 py-1.5 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
                  brand === b
                    ? "bg-red-500 text-white shadow-sm"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {b}
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* Waterfall Feed */}
      <div className="max-w-5xl mx-auto px-3 pt-3">
        {posts.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <p className="text-5xl mb-4">🚗</p>
            <p>暂无内容，去发现更多车友吧</p>
            <a href="/clubs" className="mt-4 inline-block text-red-500 text-sm hover:underline">
              浏览俱乐部 →
            </a>
          </div>
        ) : (
          <WaterfallGrid posts={posts} gap={10} />
        )}
      </div>
    </div>
  );
}
