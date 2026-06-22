"use client";

import { useEffect, useState } from "react";
import { useParams, usePathname } from "next/navigation";
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
  club: {
    id: string;
    name: string;
    slug: string;
    brand: string | null;
  };
};

const platformLabel: Record<string, string> = {
  autohome: "汽车之家",
  dcar: "懂车帝",
  pcauto: "太平洋汽车",
  yiche: "易车",
  toutiao: "今日头条",
  wechat: "微信公众号",
  xiaohongshu: "小红书",
  douyin: "抖音",
};

export default function PostDetailPage() {
  const params = useParams();
  const pathname = usePathname();
  const slug = params.slug as string;
  const postId = params.postId as string;
  const [post, setPost] = useState<Post | null>(null);
  const [currentImageIdx, setCurrentImageIdx] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/clubs/${slug}/posts/${postId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => { setPost(data); setLoading(false); })
      .catch(() => { setPost(null); setLoading(false); });
  }, [slug, postId]);

  if (loading) return (
    <div className="max-w-2xl mx-auto px-4">
      <div className="text-center py-20 text-gray-400">加载中...</div>
    </div>
  );
  if (!post) return (
    <div className="max-w-2xl mx-auto px-4">
      <div className="text-center py-20 text-gray-400">内容未找到</div>
    </div>
  );

  const images = post.images && Array.isArray(post.images) ? post.images : [];
  const brandSlug = post.club.brand ? encodeURIComponent(post.club.brand) : "";

  return (
    <div className="max-w-2xl mx-auto pb-24">
      {/* Sticky top bar */}
      <div className="sticky top-12 z-30 bg-white/90 backdrop-blur-sm border-b border-gray-100 px-4 py-2.5 flex items-center gap-3">
        <Link href={`/clubs/${post.club.slug}`} className="p-1 rounded-full hover:bg-gray-100 transition">
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div className="flex items-center gap-2 min-w-0">
          {post.club.avatar ? (
            <img src={post.club.avatar} alt={post.club.name} className="w-6 h-6 rounded-full object-cover" />
          ) : (
            <div className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center text-red-500 text-xs font-bold">
              {post.club.name[0]}
            </div>
          )}
          <span className="text-sm font-medium text-gray-700 truncate">{post.club.name}</span>
        </div>
        {post.sourcePlatform && (
          <span className="ml-auto text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full shrink-0">
            {platformLabel[post.sourcePlatform] || post.sourcePlatform}
          </span>
        )}
      </div>

      {/* Images carousel */}
      {images.length > 0 && (
        <div className="relative bg-black">
          <div className="overflow-x-auto snap-x snap-mandatory scrollbar-hide" style={{ scrollbarWidth: "none" }}>
            <div className="flex" style={{ transition: "transform 0.3s" }}>
              {images.map((img, i) => (
                <div key={i} className="w-full shrink-0 snap-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={img}
                    alt={`图片${i + 1}`}
                    className="w-full object-contain max-h-[70vh]"
                    style={{ maxHeight: "70vh" }}
                  />
                </div>
              ))}
            </div>
          </div>
          {images.length > 1 && (
            <div className="absolute bottom-3 right-3 bg-black/50 text-white text-xs px-2 py-0.5 rounded-full">
              {images.length}图
            </div>
          )}
        </div>
      )}

      {/* Video */}
      {post.videoUrl && (
        <div className="bg-black">
          <video
            src={post.videoUrl}
            controls
            className="w-full max-h-[70vh] object-contain"
          />
        </div>
      )}

      {/* Content */}
      <div className="px-4 py-5">
        <h1 className="text-lg font-bold text-gray-900 leading-snug mb-3">{post.title}</h1>

        {/* Meta */}
        <div className="flex items-center gap-3 text-xs text-gray-400 mb-5 flex-wrap">
          {post.publishedAt && (
            <span>{new Date(post.publishedAt).toLocaleDateString("zh-CN", { year: "numeric", month: "long", day: "numeric" })}</span>
          )}
          {post.club.brand && (
            <Link href={`/brands/${brandSlug}`} className="text-red-500 bg-red-50 px-2 py-0.5 rounded-full">
              {post.club.brand}
            </Link>
          )}
          {post.sourceUrl && (
            <a href={post.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
              原文 ↗
            </a>
          )}
        </div>

        {/* Text content */}
        {post.content && (
          <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
            {post.content}
          </div>
        )}
      </div>

      {/* Bottom recommendation */}
      <div className="mx-4 bg-gray-50 rounded-2xl p-4">
        <p className="text-xs text-gray-400 mb-3">相关推荐</p>
        <div className="flex gap-3">
          {post.club.brand && (
            <Link
              href={`/?brand=${brandSlug}`}
              className="flex-1 flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-2.5 hover:border-red-300 transition group"
            >
              <span className="text-lg">🚗</span>
              <div>
                <p className="text-xs text-gray-400">浏览更多</p>
                <p className="text-xs font-medium text-gray-700 group-hover:text-red-500">{post.club.brand}笔记</p>
              </div>
            </Link>
          )}
          <Link
            href={`/clubs/${post.club.slug}`}
            className="flex-1 flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-2.5 hover:border-red-300 transition group"
          >
            <span className="text-lg">👥</span>
            <div>
              <p className="text-xs text-gray-400">进入</p>
              <p className="text-xs font-medium text-gray-700 group-hover:text-red-500">{post.club.name}</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
