"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type ClubWithCount = {
  id: string;
  name: string;
  slug: string;
  city: string | null;
  brand: string | null;
  sourcePlatform: string | null;
  sourceUrl: string | null;
  avatar: string | null;
  description: string | null;
  status: string;
  isAutoCreated: boolean;
  createdAt: string;
  updatedAt: string;
  _count: { posts: number };
};

const statusLabel: Record<string, string> = {
  pending: "待审核",
  active: "已通过",
  banned: "已拒绝",
};
const statusClass: Record<string, string> = {
  pending: "bg-yellow-50 text-yellow-600",
  active: "bg-green-50 text-green-600",
  banned: "bg-red-50 text-red-600",
};
const platformLabel: Record<string, string> = {
  wechat: "微信公众号",
  douyin: "抖音",
  xiaohongshu: "小红书",
};

export default function ClubsAdmin() {
  const [clubs, setClubs] = useState<ClubWithCount[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const res = await fetch("/api/admin/clubs");
    setClubs(await res.json());
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const updateStatus = async (id: string, status: string) => {
    await fetch(`/api/admin/clubs/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    load();
  };

  const remove = async (id: string) => {
    if (!confirm("确定删除该车友会及其所有文章？")) return;
    await fetch(`/api/admin/clubs/${id}`, { method: "DELETE" });
    load();
  };

  if (loading) return <div className="max-w-5xl mx-auto px-4 py-8">加载中...</div>;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">车友会管理</h1>
        <Link
          href="/admin/clubs/new"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
        >
          + 添加车友会
        </Link>
      </div>

      {clubs.length === 0 ? (
        <p className="text-gray-400">暂无车友会数据</p>
      ) : (
        <div className="space-y-3">
          {clubs.map((c) => (
            <div
              key={c.id}
              className="border rounded-lg p-4 flex items-start justify-between gap-4 hover:shadow-sm transition"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-lg">{c.name}</span>
                  <span className={`text-xs px-2 py-0.5 rounded ${statusClass[c.status] || "bg-gray-100 text-gray-500"}`}>
                    {statusLabel[c.status] || c.status}
                  </span>
                  {c.isAutoCreated && (
                    <span className="text-xs px-2 py-0.5 rounded bg-blue-50 text-blue-600">自动创建</span>
                  )}
                  {c.sourcePlatform && (
                    <span className="text-xs px-2 py-0.5 rounded bg-purple-50 text-purple-600">
                      {platformLabel[c.sourcePlatform] || c.sourcePlatform}
                    </span>
                  )}
                </div>
                <div className="text-sm text-gray-500 mt-1 flex gap-4">
                  {c.city && <span>📍 {c.city}</span>}
                  {c.brand && <span>🚗 {c.brand}</span>}
                  <span>📝 {c._count.posts} 篇文章</span>
                </div>
                {c.description && (
                  <p className="text-sm text-gray-400 mt-1 line-clamp-1">{c.description}</p>
                )}
              </div>
              <div className="flex gap-2 shrink-0">
                {c.status === "pending" && (
                  <>
                    <button
                      onClick={() => updateStatus(c.id, "active")}
                      className="text-xs px-3 py-1.5 bg-green-600 text-white rounded hover:bg-green-700"
                    >
                      通过
                    </button>
                    <button
                      onClick={() => updateStatus(c.id, "banned")}
                      className="text-xs px-3 py-1.5 bg-red-100 text-red-600 rounded hover:bg-red-200"
                    >
                      拒绝
                    </button>
                  </>
                )}
                {c.status === "active" && (
                  <Link
                    href={`/admin/clubs/${c.id}/edit`}
                    className="text-xs px-3 py-1.5 border rounded hover:bg-gray-50"
                  >
                    编辑
                  </Link>
                  <Link
                    href={`/admin/posts?clubId=${c.id}`}
                    className="text-xs px-3 py-1.5 border rounded hover:bg-gray-50"
                  >
                    管理文章
                  </Link>
                  <Link
                    href={`/clubs/${c.slug}`}
                    className="text-xs px-3 py-1.5 border rounded hover:bg-gray-50"
                    target="_blank"
                  >
                    查看
                  </Link>
                )}
                <button
                  onClick={() => remove(c.id)}
                  className="text-xs px-3 py-1.5 text-red-500 border border-red-200 rounded hover:bg-red-50"
                >
                  删除
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
