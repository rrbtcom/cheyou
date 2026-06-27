"use client";
import { useEffect, useState } from "react";

type Club = { id: string; name: string; city: string | null; brand: string | null };
type Post = {
  id: string; title: string; content: string; images: string[];
  sourceUrl: string | null; sourcePlatform: string | null;
  username: string | null;
  publishedAt: string | null;
  club: { name: string; city: string | null; brand: string | null };
};

export default function PostsAdmin() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [clubs, setClubs] = useState<Club[]>([]);
  const [total, setTotal] = useState(0);
  const [filterClub, setFilterClub] = useState("");
  const [page, setPage] = useState(0);
  const [editPost, setEditPost] = useState<Post | null>(null);
  const [form, setForm] = useState({ title: "", content: "", images: "", sourceUrl: "", sourcePlatform: "" });
  const [addForm, setAddForm] = useState({ clubId: "", title: "", content: "", images: "", sourceUrl: "", sourcePlatform: "" });
  const [loading, setLoading] = useState(true);

  const load = async (clubId = filterClub, p = page) => {
    setLoading(true);
    const url = "/api/admin/posts?limit=20&offset=" + (p * 20) + (clubId ? "&clubId=" + clubId : "");
    const data = await fetch(url).then(r => r.json());
    setPosts(data.posts);
    setTotal(data.total);
    setLoading(false);
  };

  useEffect(() => {
    fetch("/api/admin/clubs").then(r => r.json()).then(c => setClubs(c));
    load();
  }, []);

  useEffect(() => { load(filterClub, page); }, [filterClub, page]);

  const openEdit = (post: Post) => {
    setEditPost(post);
    const imgs = Array.isArray(post.images) ? post.images.join("\n") : "";
    setForm({ title: post.title, content: post.content, images: imgs, sourceUrl: post.sourceUrl || "", sourcePlatform: post.sourcePlatform || "" });
  };

  const saveEdit = async () => {
    if (!editPost) return;
    await fetch("/api/admin/posts/" + editPost.id, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: form.title, content: form.content,
        images: form.images.split("\n").filter(Boolean),
        sourceUrl: form.sourceUrl || null, sourcePlatform: form.sourcePlatform || null,
      }),
    });
    setEditPost(null);
    load(filterClub, page);
  };

  const deletePost = async (id: string) => {
    if (!confirm("确定删除这篇文章？")) return;
    await fetch("/api/admin/posts/" + id, { method: "DELETE" });
    load(filterClub, page);
  };

  const addPost = async () => {
    if (!addForm.clubId || !addForm.title) return;
    await fetch("/api/admin/posts", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        clubId: addForm.clubId, title: addForm.title, content: addForm.content,
        images: addForm.images.split("\n").filter(Boolean),
        sourceUrl: addForm.sourceUrl || null, sourcePlatform: addForm.sourcePlatform || null,
      }),
    });
    setAddForm({ clubId: "", title: "", content: "", images: "", sourceUrl: "", sourcePlatform: "" });
    load(filterClub, page);
  };

  const totalPages = Math.ceil(total / 20);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">文章管理</h1>
      <form onSubmit={e => { e.preventDefault(); setPage(0); load(filterClub, 0); }} className="flex gap-3 mb-4 items-end">
        <div>
          <label className="text-xs text-gray-500 block mb-1">按车友会筛选</label>
          <select value={filterClub} onChange={e => { setFilterClub(e.target.value); setPage(0); }}
            className="border rounded px-3 py-2 min-w-[200px]">
            <option value="">全部车友会</option>
            {clubs.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">筛选</button>
        <span className="text-sm text-gray-500 ml-auto">{total} 篇</span>
      </form>
      <div className="bg-gray-50 rounded-lg p-4 mb-6 border">
        <h2 className="font-semibold mb-3 text-sm">新增文章</h2>
        <div className="grid grid-cols-4 gap-3 mb-3">
          <select value={addForm.clubId} onChange={e => setAddForm(f => ({ ...f, clubId: e.target.value }))} className="border rounded px-2 py-2">
            <option value="">选车友会</option>
            {clubs.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <input placeholder="标题" value={addForm.title} onChange={e => setAddForm(f => ({ ...f, title: e.target.value }))} className="border rounded px-2 py-2" />
          <input placeholder="来源平台" value={addForm.sourcePlatform} onChange={e => setAddForm(f => ({ ...f, sourcePlatform: e.target.value }))} className="border rounded px-2 py-2" />
          <input placeholder="来源URL" value={addForm.sourceUrl} onChange={e => setAddForm(f => ({ ...f, sourceUrl: e.target.value }))} className="border rounded px-2 py-2" />
        </div>
        <div className="flex gap-3 items-end">
          <textarea placeholder="内容" value={addForm.content} onChange={e => setAddForm(f => ({ ...f, content: e.target.value }))} className="border rounded px-2 py-2 flex-1 h-20" />
          <textarea placeholder="图片URL（每行一个）" value={addForm.images} onChange={e => setAddForm(f => ({ ...f, images: e.target.value }))} className="border rounded px-2 py-2 w-48 h-20" />
          <button onClick={addPost} className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 shrink-0">发布</button>
        </div>
      </div>
      {loading ? <p className="text-gray-400 py-8 text-center">加载中...</p> : (
        <div className="space-y-3">
          {posts.map(p => {
            const imgArr = Array.isArray(p.images) ? p.images : [];
            return (
              <div key={p.id} className="border rounded-lg p-4 hover:shadow-sm transition">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="font-medium">{p.title}</span>
                      {p.username && <span className="text-xs px-2 py-0.5 rounded bg-green-50 text-green-600">{p.username}</span>}
                      {p.sourcePlatform && <span className="text-xs px-2 py-0.5 rounded bg-purple-50 text-purple-600">{p.sourcePlatform}</span>}
                    </div>
                    <div className="text-sm text-gray-500 flex gap-4 flex-wrap">
                      <span>🚗 {p.club.name}</span>
                      {p.club.city && <span>📍 {p.club.city}</span>}
                      {p.publishedAt && <span>🗓 {new Date(p.publishedAt).toLocaleDateString("zh-CN")}</span>}
                      {imgArr.length > 0 && <span>🖼 {imgArr.length}张</span>}
                    </div>
                    {p.sourceUrl && <a href={p.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-500 mt-1 block truncate max-w-md">🔗 {p.sourceUrl}</a>}
                    <p className="text-sm text-gray-400 mt-1 line-clamp-2">{p.content?.slice(0, 120)}...</p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button onClick={() => openEdit(p)} className="text-xs px-3 py-1.5 border rounded hover:bg-gray-50">编辑</button>
                    <button onClick={() => deletePost(p.id)} className="text-xs px-3 py-1.5 text-red-500 border border-red-200 rounded hover:bg-red-50">删除</button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          <button disabled={page === 0} onClick={() => setPage(p => p - 1)} className="px-3 py-1 border rounded disabled:opacity-30">上一页</button>
          <span className="px-3 py-1 text-sm text-gray-500">{page + 1} / {totalPages}</span>
          <button disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)} className="px-3 py-1 border rounded disabled:opacity-30">下一页</button>
        </div>
      )}
      {editPost && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setEditPost(null)}>
          <div className="bg-white rounded-lg p-6 w-[600px] max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <h2 className="font-bold text-lg mb-4">编辑文章</h2>
            <div className="space-y-3">
              <div><label className="text-xs text-gray-500 block mb-1">标题</label><input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className="border rounded px-2 py-2 w-full" /></div>
              <div><label className="text-xs text-gray-500 block mb-1">内容</label><textarea value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} className="border rounded px-2 py-2 w-full h-32" /></div>
              <div><label className="text-xs text-gray-500 block mb-1">图片URL（每行一个）</label><textarea value={form.images} onChange={e => setForm(f => ({ ...f, images: e.target.value }))} className="border rounded px-2 py-2 w-full h-20" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-xs text-gray-500 block mb-1">来源平台</label><input value={form.sourcePlatform} onChange={e => setForm(f => ({ ...f, sourcePlatform: e.target.value }))} className="border rounded px-2 py-2 w-full" /></div>
                <div><label className="text-xs text-gray-500 block mb-1">来源URL</label><input value={form.sourceUrl} onChange={e => setForm(f => ({ ...f, sourceUrl: e.target.value }))} className="border rounded px-2 py-2 w-full" /></div>
              </div>
            </div>
            <div className="flex gap-3 mt-4">
              <button onClick={saveEdit} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">保存</button>
              <button onClick={() => setEditPost(null)} className="px-4 py-2 border rounded">取消</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
