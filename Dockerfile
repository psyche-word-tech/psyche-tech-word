FROM node:18-alpine

WORKDIR /app

# 安装 pnpm
RUN npm install -g pnpm

# 复制 package 文件
COPY server/package*.json ./

# 安装依赖
RUN pnpm install

# 复制源码
COPY server/ ./

# 构建
RUN pnpm build

# 暴露端口
EXPOSE 9091

# 启动
CMD ["pnpm", "start"]
