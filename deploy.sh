#!/bin/bash
set -e

echo "🚀 车友荟部署脚本"
echo "=================="

PROJECT_DIR="/var/www/cheyou"
BACKUP_DIR="/var/www/cheyou-backup"

# 1. 备份当前版本
if [ -d "$PROJECT_DIR" ]; then
  echo "📦 备份当前版本..."
  rm -rf $BACKUP_DIR
  cp -r $PROJECT_DIR $BACKUP_DIR
fi

# 2. 拉取最新代码
echo "📥 拉取最新代码..."
cd $PROJECT_DIR
git pull origin main

# 3. 安装依赖
echo "📦 安装依赖..."
npm ci --production=false

# 4. 生成Prisma Client
echo "🔧 生成Prisma Client..."
npx prisma generate

# 5. 执行数据库迁移
echo "🗄️ 执行数据库迁移..."
npx prisma migrate deploy

# 6. 构建项目
echo "🔨 构建项目..."
npm run build

# 7. 重启服务
echo "🔄 重启服务..."
pm2 restart cheyou || pm2 start ecosystem.config.js

# 8. 清理
echo "🧹 清理旧构建缓存..."
rm -rf .next/cache

echo "✅ 部署完成！"
pm2 status
