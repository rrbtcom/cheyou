import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const article = await prisma.article.findUnique({ where: { slug } });
  if (!article) return { title: "文章未找到" };

  return {
    title: article.title,
    description: article.content.slice(0, 120) + "...",
  };
}

export default async function ArticlePage({ params }: Props) {
  const { slug } = await params;

  const article = await prisma.article.findUnique({
    where: { slug },
    include: { model: { include: { brand: true } } },
  });

  if (!article) notFound();

  // 相关文章
  const related = article.modelId
    ? await prisma.article.findMany({
        where: { modelId: article.modelId, id: { not: article.id }, publishedAt: { not: null } },
        orderBy: { publishedAt: "desc" },
        take: 5,
      })
    : [];

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* 面包屑 */}
      <nav className="text-sm text-gray-400 mb-6">
        <Link href="/" className="hover:text-blue-600">首页</Link>
        <span className="mx-1">/</span>
        <Link href="/new-cars" className="hover:text-blue-600">资讯</Link>
        <span className="mx-1">/</span>
        <span className="text-gray-600">{article.title}</span>
      </nav>

      {/* 文章头部 */}
      <article>
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs px-2 py-0.5 bg-blue-50 text-blue-600 rounded">
            {article.type === "news" ? "新闻" : article.type === "review" ? "评测" : "导购"}
          </span>
          {article.model && (
            <Link href={`/new-cars/${article.model.slug}`} className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded hover:bg-gray-200">
              {article.model.brand.name} {article.model.name}
            </Link>
          )}
        </div>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">{article.title}</h1>
        <div className="text-sm text-gray-400 mb-8">
          <span>{article.author}</span>
          <span className="mx-2">·</span>
          <span>{article.publishedAt ? new Date(article.publishedAt).toLocaleDateString("zh-CN") : "草稿"}</span>
        </div>

        {/* 文章内容 */}
        <div className="prose prose-gray max-w-none mb-10">
          <p className="text-gray-700 leading-relaxed">{article.content}</p>
          <p className="text-gray-400 text-sm mt-8">— 内容持续更新中 —</p>
        </div>

        {/* JSON-LD */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Article",
              "headline": article.title,
              "author": { "@type": "Organization", "name": article.author },
              "datePublished": article.publishedAt,
              "publisher": { "@type": "Organization", "name": "车友荟" },
            }),
          }}
        />
      </article>

      {/* 相关文章 */}
      {related.length > 0 && (
        <section className="border-t pt-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">相关资讯</h2>
          <div className="space-y-2">
            {related.map((r) => (
              <Link
                key={r.id}
                href={`/news/${r.slug}`}
                className="block p-3 rounded hover:bg-gray-50 transition"
              >
                <div className="flex justify-between items-center">
                  <h3 className="font-medium text-sm">{r.title}</h3>
                  <span className="text-xs text-gray-400 whitespace-nowrap ml-4">
                    {r.publishedAt ? new Date(r.publishedAt).toLocaleDateString("zh-CN") : ""}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
