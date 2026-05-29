# 车友荟 MVP 开发记录

## 项目概况
- **技术栈**：Next.js 16 + TypeScript + Prisma 7.x + Tailwind CSS + PostgreSQL
- **项目目录**：`/root/cheyou`
- **数据库**：`postgresql://cheyou:cheyou2026@localhost:5432/cheyou`

## 已完成功能

### 基础骨架
- 项目初始化、数据库+种子数据、页面开发
- 用户认证（登录/注册/JWT）、后台管理
- SEO优化（metadata/structured data/sitemap/robots）

### 全站搜索（2026-05-29）
- 搜索API `/api/search/route.ts`（跨车型/资讯/二手车/品牌）
- SearchBox客户端组件 `src/components/SearchBox.tsx`
- 搜索结果页 `src/app/search/page.tsx`（全部/车型/资讯/二手车四个tab）
- 导航栏集成搜索框

### 车型PK（2026-05-29）
- PK页面 `src/app/pk/page.tsx`（含6组热门对比快捷入口）
- PKCompare客户端组件 `src/app/pk/PKCompare.tsx`
- 6大类参数逐项对比+高亮优胜（基本/动力/充电/车身/底盘/智能）
- 6个详细配置参数组（外观/内饰/安全/舒适/驾驶辅助/销量）
- 车型列表API `/api/models/route.ts`
- 导航栏"车型PK"入口 + 详情页"加入PK"按钮
- URL参数支持分享（`?left=slug&right=slug`）

### 销量榜单（2026-05-29）
- 榜单页面 `src/app/ranking/page.tsx`
- 四个tab：销量总榜/新能源榜/轿车榜/SUV榜
- 排名奖牌(🥇🥈🥉)+车型图片+evType标签+指导价+2025年销量

### Schema新增字段
- 25个详细配置字段（外观5+内饰5+安全4+舒适6+驾驶辅助5）
- salesVolume2025 Int? 销量字段
- 两次migration：`add_detail_config` + `add_sales_volume`

### 车型详情页增强
- 展示外观配置/内饰配置/安全配置/舒适便利/驾驶辅助/销量数据 6个新section

### 数据
- **100个车型**、**35个品牌**，全部含salesVolume2025
- 品牌：自主品牌+合资品牌全覆盖
- 23个原有车型有imageUrl，77个新增车型imageUrl为null（待补图）

## 待做
- [ ] 新增车型图片补充（77个车型imageUrl为null）
- [ ] 发布车源功能（需登录）
- [ ] 部署准备
