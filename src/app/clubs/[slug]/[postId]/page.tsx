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
  club: {
    id: string;
    name: string;
    slug: string;
    brand: string | null;
  };
};

const platformLabel: Record<string, string> = {
  autohome: "汽车之家",
  dongchedi: "懂车帝",
  xcar: "爱卡汽车",
  pcauto: "太平洋汽车",
  bilibili: "哔哩哔哩",
  xiaohongshu: "小红书",
  douyin: "抖音",
  kuaishou: "快手",
  wechat: "微信公众号",
};

export default function PostDetailPage() {
  const params = useParams();
  const slug = params.slug as string;
  const postId = params.postId as string;
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/clubs/${slug}/posts/${postId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => { setPost(data); setLoading(false); })
      .catch(() => { setPost(null); setLoading(false); });
  }, [slug, postId]);

  if (loading) return <div className="max-w-3xl mx-auto px-4 py-8">加载中...</div>;
  if (!post) return <div className="max-w-3xl mx-auto px-4 py-8 text-gray-400">内容未找到</div>;

  const brandSlug = post.club.brand ? encodeURIComponent(post.club.brand) : "";

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <nav className="text-sm text-gray-400 mb-6 flex items-center gap-1 flex-wrap">
        <Link href="/clubs" className="hover:text-blue-600">车友会</Link>
        <span>/</span>
        <Link href={`/clubs/${post.club.slug}`} className="hover:text-blue-600">{post.club.name}</Link>
        {post.club.brand && (
          <>
            <span>/</span>
            <Link href={`/brands/${brandSlug}`} className="hover:text-blue-600">{post.club.brand}车友会</Link>
          </>
        )}
        <span>/</span>
        <span className="text-gray-600">正文</span>
      </nav>

      {/* Source info bar */}
      <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 mb-6 text-sm text-blue-700 flex items-center gap-2 flex-wrap">
        <span>内容来自：<strong>{post.club.name}</strong></span>
        {post.sourcePlatform && (
          <>
            <span>·</span>
            <span>转自{platformLabel[post.sourcePlatform] || post.sourcePlatform}</span>
          </>
        )}
        {post.sourceUrl && (
          <>
            <span>·</span>
            <a href={post.sourceUrl} target="_blank" rel="noopener noreferrer" className="underline hover:text-blue-900">
              原文链接
            </a>
          </>
        )}
      </div>

      {/* Article */}
      <article>
        <h1 className="text-2xl font-bold text-gray-900 mb-3">{post.title}</h1>
        {post.publishedAt && (
          <p className="text-sm text-gray-400 mb-6">
            {new Date(post.publishedAt).toLocaleDateString("zh-CN", { year: "numeric", month: "long", day: "numeric" })}
          </p>
        )}

        {post.images && Array.isArray(post.images) && post.images.length > 0 && (
          <div className="space-y-3 mb-6">
            {post.images.map((img: string, i: number) => (
              <img key={i} src={img} alt="" className="w-full rounded-lg" />
            ))}
          </div>
        )}

        {post.videoUrl && (
          <div className="mb-6">
            <video src={post.videoUrl} controls className="w-full rounded-lg" />
          </div>
        )}

        {post.content && (
          <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-wrap">{post.content}</div>
        )}
      </article>

      {/* Bottom Navigation */}
      <div className="mt-10 pt-6 border-t border-gray-100">
        <div className="bg-gray-50 rounded-xl p-5">
          <p className="text-xs text-gray-400 mb-3">📍 相关推荐</p>
          <div className="flex flex-col sm:flex-row gap-3">
            {post.club.brand && (
              <Link
                href={`/brands/${brandSlug}`}
                className="flex-1 flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-4 py-3 hover:border-blue-300 hover:shadow-sm transition-all group"
              >
                <span className="text-xl">🚗</span>
                <div>
                  <p className="text-xs text-gray-400">查看品牌</p>
                  <p className="text-sm font-medium text-gray-800 group-hover:text-blue-600">
                    {post.club.brand}车型大全
                  </p>
                </div>
              </Link>
            )}
            <Link
              href={`/clubs/${post.club.slug}`}
              className="flex-1 flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-4 py-3 hover:border-blue-300 hover:shadow-sm transition-all group"
            >
              <span className="text-xl">🚙</span>
              <div>
                <p className="text-xs text-gray-400">进入俱乐部</p>
                <p className="text-sm font-medium text-gray-800 group-hover:text-blue-600">
                  {post.club.name}
                </p>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
