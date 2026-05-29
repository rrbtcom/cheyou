import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "关于车友荟",
  description: "车友荟是专注新能源车的新车资讯与二手车信息撮合平台，帮您选好车、买好车。",
};

export default function AboutPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">关于车友荟</h1>
      
      <div className="prose prose-gray">
        <p>
          车友荟（cheyou.com.cn）是专注新能源车的新车资讯与二手车信息撮合平台。
        </p>
        
        <h2>我们的使命</h2>
        <p>帮用户选好车、买好车。</p>
        
        <h2>三大核心板块</h2>
        <ul>
          <li><strong>新车资讯</strong> — 专业、客观的新能源车资讯，覆盖主流品牌与车型</li>
          <li><strong>二手车撮合</strong> — 真实车源信息，买卖双方直接对接，无中间商赚差价</li>
          <li><strong>车主社交</strong> — 即将上线，分享真实用车体验</li>
        </ul>

        <h2>联系方式</h2>
        <p>邮箱：contact@cheyou.com.cn</p>
      </div>
    </div>
  );
}
