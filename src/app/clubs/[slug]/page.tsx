"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { WaterfallGrid, PostCardData } from "@/components/waterfall/PostCard";

type Club = {
  id: string;
  name: string;
  slug: string;
  category: string;
  city: string | null;
  brand: string | null;
  sourcePlatform: string | null;
  avatar: string | null;
  description: string | null;
  posts: any[];
};

const platformLabel: Record<string, string> = {
  wechat: "微信公众号",
  autohome: "汽车之家",
  dcar: "懂车帝",
  pcauto: "太平洋汽车",
  yiche: "易车",
  toutiao: "今日头条",
};

export default function ClubDetailPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [club, setClub] = useState<Club | null>(null);
  const [clubPosts, setClubPosts] = useState<PostCardData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch club info
    fetch(`/api/clubs/${slug}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => { setClub(data); })
      .catch(() => { setClub(null); });

    // Fetch all posts for this club
    fetch(`/api/posts?clubId=${encodeURIComponent(slug)}&take=500`)
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
          username: p.username,
          publishedAt: p.publishedAt,
          clubId: p.club.id,
          clubName: p.club.name,
          clubBrand: p.club.brand,
          clubSlug: p.club.slug,
        }));
        setClubPosts(posts);
        setLoading(false);
      })
      .catch(() => { setClubPosts([]); setLoading(false); });
  }, [slug]);

  if (loading) return (
    <div className="max-w-5xl mx-auto px-3">
      <div className="text-center py-20 text-gray-400">加载中...</div>
    </div>
  );
  if (!club) return (
    <div className="max-w-5xl mx-auto px-3">
      <div className="text-center py-20 text-gray-400">车友会未找到</div>
    </div>
  );

  const platLabel = club.sourcePlatform ? (platformLabel[club.sourcePlatform] || club.sourcePlatform) : null;

  return (
    <div className="max-w-5xl mx-auto px-3">
      {/* Club Header */}
      <div className="py-4 flex items-center gap-3">
        <Link href="/clubs" className="shrink-0 p-1.5 rounded-full bg-gray-100 hover:bg-gray-200 transition">
          <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div className="flex items-center gap-2 min-w-0">
          {club.avatar ? (
            <img src={club.avatar} alt={club.name} className="w-8 h-8 rounded-full object-cover shrink-0" />
          ) : (
            <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center text-red-500 font-bold text-sm shrink-0">
              {club.name[0]}
            </div>
          )}
          <div className="min-w-0">
            <h1 className="font-bold text-gray-900 truncate text-base">{club.name}</h1>
            <div className="flex items-center gap-2 text-xs text-gray-400">
              {club.city && <span>📍{club.city}</span>}
              {club.brand && <span className="text-red-500">{club.brand}</span>}
              {platLabel && <span className="bg-gray-100 px-1.5 py-0.5 rounded">{platLabel}</span>}
              <span>{clubPosts.length}篇</span>
            </div>
          </div>
        </div>
      </div>

      {/* Description */}
      {club.description && (
        <div className="mb-4 px-1">
          <p className="text-sm text-gray-500 leading-relaxed">{club.description}</p>
        </div>
      )}
        </div>
      )}

      {/* Posts — Waterfall */}
      {clubPosts.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-4xl mb-3">📝</p>
          <p className="text-sm">暂无内容</p>
        </div>
      ) : (
        <WaterfallGrid posts={clubPosts} gap={10} />
      )}

      {/* Bottom padding for tab bar */}
      <div className="h-8" />
    </div>
  );
}
