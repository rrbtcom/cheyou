import type { Metadata } from "next";
import "./globals.css";
import UserNav from "@/components/UserNav";
import SearchBox from "@/components/SearchBox";

export const metadata: Metadata = {
  title: { default: "车友荟 - 新能源车资讯与二手车撮合平台", template: "%s | 车友荟" },
  description: "车友荟是专注新能源车的新车资讯与二手车信息撮合平台，帮您选好车、买好车。提供最新新能源车资讯、真实二手车源信息，买卖双方直接对接。",
  keywords: ["新能源车", "电动车", "二手车", "新车资讯", "车友荟", "买电动车", "二手车交易", "车型对比"],
  metadataBase: new URL("https://cheyou.com.cn"),
  openGraph: { type: "website", locale: "zh_CN", siteName: "车友荟" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body className="antialiased min-h-screen flex flex-col">
        <header className="bg-white border-b border-gray-100 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
            <div className="flex items-center gap-6 shrink-0">
              <a href="/" className="text-xl font-bold text-blue-600">车友荟</a>
              <nav className="hidden md:flex gap-5 text-sm">
                <a href="/new-cars" className="text-gray-600 hover:text-blue-600">新车资讯</a>
                <a href="/used-cars" className="text-gray-600 hover:text-blue-600">二手车</a>
                <a href="/pk" className="text-gray-600 hover:text-blue-600">车型PK</a>
                <a href="/sales-rank" className="text-gray-600 hover:text-blue-600">销量榜</a>
                <a href="/clubs" className="text-gray-600 hover:text-blue-600">车友会</a>
                <a href="/about" className="text-gray-600 hover:text-blue-600">关于</a>
              </nav>
            </div>
            <div className="hidden md:flex flex-1 max-w-md">
              <SearchBox size="sm" />
            </div>
            <UserNav />
          </div>
        </header>
        <main className="flex-1">{children}</main>
        <footer className="bg-gray-50 border-t border-gray-100 py-8">
          <div className="max-w-7xl mx-auto px-4 text-center text-sm text-gray-400">
            <p>© 2026 车友荟 cheyou.com.cn — 专注新能源车的新车资讯与二手车撮合平台</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
