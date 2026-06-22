import type { Metadata } from "next";
import "./globals.css";
import RedNoteLayout from "@/components/RedNoteLayout";

export const metadata: Metadata = {
  title: { default: "车友荟", template: "%s | 车友荟" },
  description: "车友荟 - 真实车友分享，发现用车乐趣。专注新能源车的车友社区、选车PK与销量排行。",
  keywords: ["新能源车", "电动车", "车友会", "车友荟", "车型对比", "销量榜", "提车作业", "用车分享"],
  metadataBase: new URL("https://cheyou.com.cn"),
  openGraph: { type: "website", locale: "zh_CN", siteName: "车友荟" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body className="antialiased">
        <RedNoteLayout>{children}</RedNoteLayout>
      </body>
    </html>
  );
}
