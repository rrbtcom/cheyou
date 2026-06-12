"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

type Post = {
  id: string;
  title: string;
  content: string | null;
  images: string[] | null;
  videoUrl: string | null;
  sourceUrl: string | null;
  sourcePlatform: string | null;
  publishedAt: string | null;
};

type Club = {
  id: string;
  name: string;
  slug: string;
  city: string | null;
  brand: string | null;
  sourcePlatform: string | null;
  sourceUrl: string | null;
  avatar: string | null;
  description: string | null;
  posts: Post[];
};

const platformLabel: Record<string, string> = {
  wechat: "微信公众号",
  douyin: "抖音",
  xiaohongshu: "小红书",
};
const platformColor: Record<string, string> = {
  wechat: "bg-green-100 text-green-700",
  douyin: "bg-gray-100 text-gray-700",
  xiaohongshu: "bg-red-100 text-red-700",
};

export default function ClubDetailPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [club, setClub] = useState<Club | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/clubs/${slug}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => { setClub(data); setLoading(false); })
      .catch(() => { setClub(null); setLoading(false); });
  }, [slug]);

  if (loading) return <div className="max-w-5xl mx-auto px-4 py-8">加载中...</div>;
  if (!club) return <div className="max-w-5xl mx-auto px-4 py-8 text-gray-400">车友会未找到</div>;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Club Header */}
      <div className="flex items-start gap-5 mb-8">
        {club.avatar ? (
          <img src={club.avatar} alt={club.name} className="w-20 h-20 rounded-full object-cover" />
        ) : (
          <div className="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-3xl">
            {club.name[0]}
          </div>
        )}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{club.name}</h1>
          <div className="flex gap-3 mt-2 text-sm text-gray-500">
            {club.city && <span>📍 {club.city}</span>}
            {club.brand && <span>🚗 {club.brand}</span>}
            {club.sourcePlatform && (
              <span className={`px-2 py-0.5 rounded text-xs ${platformColor[club.sourcePlatform] || ""}`}>
                {platformLabel[club.sourcePlatform] || club.sourcePlatform}
              </span>
            )}
          </div>
          {club.description && <p className="text-gray-500 mt-2">{club.description}</p>}
          {club.sourceUrl && (
            <a href={club.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-500 hover:underline mt-1 inline-block">
              原始主页 →
            </a>
          )}
        </div>
      </div>

      {/* Posts */}
      <h2 className="text-xl font-bold mb-4">全部内容 ({club.posts.length})</h2>
      {club.posts.length === 0 ? (
        <p className="text-gray-400">暂无内容</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {club.posts.map((post) => {
            const coverImage =
              post.images && Array.isArray(post.images) && post.images.length > 0
                ? post.images[0]
                : null;
            return (
              <Link
                key={post.id}
                href={`/clubs/${club.slug}/${post.id}`}
                className="border rounded-xl overflow-hidden hover:shadow-md transition group"
              >
                {coverImage ? (
                  <div className="aspect-video bg-gray-100 overflow-hidden">
                    <img src={coverImage} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                  </div>
                ) : (
                  <div className="aspect-video bg-gray-50 flex items-center justify-center text-gray-300 text-4xl">📄</div>
                )}
                <div className="p-3">
                  <h3 className="font-medium text-sm line-clamp-2 group-hover:text-blue-600">{post.title}</h3>
                  <div className="flex items-center gap-2 mt-2 text-xs text-gray-400">
                    {post.publishedAt && <span>{new Date(post.publishedAt).toLocaleDateString("zh-CN")}</span>}
                    {post.sourcePlatform && (
                      <span className={`px-1.5 py-0.5 rounded ${platformColor[post.sourcePlatform] || ""}`}>
                        {platformLabel[post.sourcePlatform] || post.sourcePlatform}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
