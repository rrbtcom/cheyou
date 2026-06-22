"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { WaterfallGrid, PostCardData } from "@/components/waterfall/PostCard";

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
  avatar: string | null;
  description: string | null;
  _count: { posts: number };
  posts: Post[];
};

export default function BrandDetailPage() {
  const params = useParams();
  const brand = decodeURIComponent(params.slug as string);
  const [clubs, setClubs] = useState<Club[]>([]);
  const [allPosts, setAllPosts] = useState<PostCardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"posts" | "clubs">("posts");

  useEffect(() => {
    fetch(`/api/clubs?brand=${encodeURIComponent(brand)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => { setClubs(data || []); setLoading(false); })
      .catch(() => { setClubs([]); setLoading(false); });

    fetch(`/api/posts?brand=${encodeURIComponent(brand)}&take=200`)
      .then((r) => r.json())
      .then((data) => {
        const posts = (data.posts || []).map((p: any) => ({
          id: p.id,
          title: p.title,
          content: p.content,
          images: p.images,
          videoUrl: p.videoUrl,
          sourceUrl: p.sourceUrl,
          sourcePlatform: p.sourcePlatform,
          publishedAt: p.publishedAt,
          clubId: p.club.id,
          clubName: p.club.name,
          clubBrand: brand,
          clubSlug: p.club.slug,
        }));
        setAllPosts(posts);
      })
      .catch(() => setAllPosts([]));
  }, [brand]);

  if (loading) return (
    <div className="max-w-5xl mx-auto px-3">
      <div className="text-center py-20 text-gray-400">加载中...</div>
    </div>
  );

  if (clubs.length === 0) return (
    <div className="max-w-5xl mx-auto px-3">
      <div className="text-center py-20 text-gray-400">暂无「{brand}」相关车友会</div>
    </div>
  );

  const allPosts: PostCardData[] = clubs.flatMap((club) =>
    club.posts.map((p) => ({
      id: p.id,
      title: p.title,
      content: p.content,
      images: p.images,
      videoUrl: p.videoUrl,
      sourceUrl: p.sourceUrl,
      sourcePlatform: p.sourcePlatform,
      publishedAt: p.publishedAt,
      clubId: club.id,
      clubName: club.name,
      clubBrand: brand,
      clubSlug: club.slug,
    }))
  );

  const totalPosts = clubs.reduce((sum, c) => sum + (c._count?.posts || c.posts.length), 0);

  return (
    <div className="max-w-5xl mx-auto px-3">
      {/* Brand Header */}
      <div className="pt-4 pb-3 flex items-center gap-3">
        <Link href="/clubs" className="shrink-0 p-1.5 rounded-full bg-gray-100 hover:bg-gray-200 transition">
          <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div>
          <h1 className="font-bold text-gray-900">{brand}</h1>
          <p className="text-xs text-gray-400">{clubs.length}个圈子 · {totalPosts}篇内容</p>
        </div>
      </div>

      {/* View Toggle */}
      <div className="flex items-center gap-3 mb-4 overflow-x-auto scrollbar-hide" style={{ scrollbarWidth: "none" }}>
        <div className="flex bg-gray-100 rounded-full p-0.5 shrink-0">
          <button
            onClick={() => setView("posts")}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              view === "posts" ? "bg-white text-gray-800 shadow-sm" : "text-gray-500"
            }`}
          >
            笔记
          </button>
          <button
            onClick={() => setView("clubs")}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              view === "clubs" ? "bg-white text-gray-800 shadow-sm" : "text-gray-500"
            }`}
          >
            圈子
          </button>
        </div>
      </div>

      {view === "posts" ? (
        <WaterfallGrid posts={allPosts} gap={10} />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 pb-6">
          {clubs.map((club) => (
            <Link
              key={club.id}
              href={`/clubs/${club.slug}`}
              className="bg-white border border-gray-100 rounded-2xl overflow-hidden hover:shadow-md transition"
            >
              <div className="h-16 bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
                {club.avatar ? (
                  <img src={club.avatar} alt={club.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-2xl font-bold text-gray-300">{club.name[0]}</span>
                )}
                <div className="absolute top-2 right-2 bg-black/40 text-white text-xs px-1.5 py-0.5 rounded-full">
                  {club._count?.posts || club.posts.length}
                </div>
              </div>
              <div className="p-2.5">
                <h3 className="font-semibold text-sm text-gray-800 truncate">{club.name}</h3>
                {club.city && <p className="text-xs text-gray-400 mt-0.5">📍{club.city}</p>}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
