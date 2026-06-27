"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

const platformLabel: Record<string, string> = {
  wechat: "微信公众号",
  douyin: "抖音",
  xiaohongshu: "小红书",
  autohome: "汽车之家",
  dcar: "懂车帝",
  pcauto: "太平洋汽车",
  yiche: "易车",
  toutiao: "今日头条",
};
const platformColor: Record<string, string> = {
  wechat: "bg-green-50 text-green-600",
  douyin: "bg-pink-50 text-pink-600",
  xiaohongshu: "bg-red-50 text-red-500",
  autohome: "bg-blue-50 text-blue-600",
  dcar: "bg-orange-50 text-orange-600",
  pcauto: "bg-teal-50 text-teal-600",
  yiche: "bg-yellow-50 text-yellow-600",
  toutiao: "bg-gray-50 text-gray-600",
};

export type PostCardData = {
  id: string;
  title: string;
  content?: string | null;
  images?: string[] | null;
  videoUrl?: string | null;
  sourceUrl?: string | null;
  sourcePlatform?: string | null;
  username?: string | null;
  publishedAt?: string | null;
  clubId?: string;
  clubName?: string;
  clubBrand?: string;
  clubSlug?: string;
};

function PostCard({ post, style }: { post: PostCardData; style?: React.CSSProperties }) {
  const coverImage =
    post.images && Array.isArray(post.images) && post.images.length > 0
      ? post.images[0]
      : null;

  const linkHref = post.clubSlug
    ? `/clubs/${post.clubSlug}/${post.id}`
    : `/clubs/${post.clubId}/${post.id}`;

  const platform = post.sourcePlatform || "";
  const platLabel = platformLabel[platform] || platform;
  const platColor = platformColor[platform] || "bg-gray-50 text-gray-500";

  const timeLabel = post.publishedAt
    ? new Date(post.publishedAt).toLocaleDateString("zh-CN", { month: "short", day: "numeric" })
    : "";

  const [imgError, setImgError] = useState(false);

  return (
    <Link
      href={linkHref}
      className="block bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 cursor-pointer"
      style={style}
    >
      {/* Cover */}
      <div className="relative overflow-hidden bg-gray-100" style={{ aspectRatio: coverImage ? undefined : "4/3" }}>
        {coverImage && !imgError ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={coverImage}
            alt={post.title}
            className="w-full object-cover"
            style={{ minHeight: "120px", maxHeight: "420px" }}
            onError={() => setImgError(true)}
            loading="lazy"
          />
        ) : (
          <div className="w-full bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center" style={{ minHeight: "120px" }}>
            <span className="text-4xl opacity-30">🚗</span>
          </div>
        )}
        {/* Video badge */}
        {post.videoUrl && (
          <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-0.5 rounded-full flex items-center gap-1">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
            </svg>
            视频
          </div>
        )}
        {/* Image count badge */}
        {coverImage && post.images && Array.isArray(post.images) && post.images.length > 1 && (
          <div className="absolute top-2 right-2 bg-black/50 text-white text-xs px-1.5 py-0.5 rounded">
            {post.images.length}图
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-3">
        {/* Title */}
        <h3 className="text-sm font-medium text-gray-800 leading-snug line-clamp-2 mb-2">
          {post.title}
        </h3>

        {/* Meta row */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 min-w-0">
            {post.username && (
              <span className="text-xs text-gray-600 truncate max-w-[80px]">
                {post.username}
              </span>
            )}
            {post.clubBrand && (
              <span className="text-xs text-red-500 font-medium bg-red-50 px-1.5 py-0.5 rounded-full whitespace-nowrap">
                {post.clubBrand}
              </span>
            )}
            {post.clubName && !post.clubBrand && (
              <span className="text-xs text-gray-500 bg-gray-50 px-1.5 py-0.5 rounded-full truncate max-w-[80px]">
                {post.clubName}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            {timeLabel && <span className="text-xs text-gray-300">{timeLabel}</span>}
            {platform && (
              <span className={`text-xs px-1.5 py-0.5 rounded ${platColor}`}>
                {platLabel}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

export type WaterfallItem = PostCardData & { _height?: number };

interface WaterfallGridProps {
  posts: PostCardData[];
  columnCount?: number;
  gap?: number;
  className?: string;
}

export function WaterfallGrid({ posts, columnCount = 2, gap = 12, className = "" }: WaterfallGridProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [columns, setColumns] = useState(columnCount);
  const [colHeights, setColHeights] = useState<number[]>(Array(columnCount).fill(0));

  // Responsive column count
  useEffect(() => {
    const update = () => {
      const w = window.innerWidth;
      if (w < 480) setColumns(2);
      else if (w < 768) setColumns(2);
      else if (w < 1024) setColumns(3);
      else if (w < 1280) setColumns(4);
      else setColumns(4);
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  // Masonry layout: assign each post to the shortest column
  useEffect(() => {
    setColHeights(Array(columns).fill(0));
  }, [columns, posts]);

  const getItemStyle = (post: PostCardData, colIndex: number): React.CSSProperties => {
    return {};
  };

  // Distribute posts into columns
  const cols: PostCardData[][] = Array.from({ length: columns }, () => []);
  const heights: number[] = Array(columns).fill(0);

  posts.forEach((post) => {
    const shortestCol = heights.indexOf(Math.min(...heights));
    cols[shortestCol].push(post);
    // Estimate card height based on content
    const coverH = (post.images && Array.isArray(post.images) && post.images.length > 0 && !post.images[0]?.endsWith('.gif'))
      ? Math.floor(180 + Math.random() * 120) // random height for waterfall effect
      : 160;
    const titleLines = post.title.length > 30 ? 2 : 1;
    const metaH = 36;
    heights[shortestCol] += coverH + titleLines * 18 + metaH + 24;
  });

  return (
    <div ref={containerRef} className={`flex gap-3 ${className}`} style={{ alignItems: "flex-start" }}>
      {cols.map((col, colIdx) => (
        <div key={colIdx} className="flex-1" style={{ gap: `${gap}px` }}>
          <div className="flex flex-col" style={{ gap: `${gap}px` }}>
            {col.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export default PostCard;
