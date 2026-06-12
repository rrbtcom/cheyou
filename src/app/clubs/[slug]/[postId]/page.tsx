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
  };
};

const platformLabel: Record<string, string> = {
  wechat: "微信公众号",
  douyin: "抖音",
  xiaohongshu: "小红书",
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

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <nav className="text-sm text-gray-400 mb-6 flex items-center gap-1">
        <Link href="/clubs" className="hover:text-blue-600">车友会</Link>
        <span>/</span>
        <Link href={`/clubs/${post.club.slug}`} className="hover:text-blue-600">{post.club.name}</Link>
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

        {/* Images */}
        {post.images && Array.isArray(post.images) && post.images.length > 0 && (
          <div className="space-y-3 mb-6">
            {post.images.map((img: string, i: number) => (
              <img key={i} src={img} alt="" className="w-full rounded-lg" />
            ))}
          </div>
        )}

        {/* Video */}
        {post.videoUrl && (
          <div className="mb-6">
            <video src={post.videoUrl} controls className="w-full rounded-lg" />
          </div>
        )}

        {/* Content */}
        {post.content && (
          <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-wrap">{post.content}</div>
        )}
      </article>
    </div>
  );
}
