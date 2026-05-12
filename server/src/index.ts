import dotenv from 'dotenv';
dotenv.config();

import express from "express";
import cors from "cors";
import { checkDatabaseHealth, startKeepAlive, resetSupabaseClient } from "./storage/database/supabase-client";
import wordsRouter from "./routes/words";
import userWordsRouter from "./routes/user-words";
import wordbooksRouter from "./routes/wordbooks";
import authRouter from "./routes/auth";
import commentsRouter from "./routes/comments";
import exampleImagesRouter from "./routes/example-images";
import grammarCheckRouter from "./routes/grammar-check";
import speechEvalRouter from "./routes/speech-eval";
import ttsRouter from "./routes/tts";

const app = express();
const port = process.env.PORT || 9091;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

/**
 * 根路径健康检查 - Railway 默认健康检查
 */
app.get('/', (req, res) => {
  res.status(200).json({ status: 'ok', service: 'word-voyage-api' });
});

/**
 * 健康检查接口 - 验证数据库连接
 * Railway 使用此接口判断服务是否健康
 */
app.get('/api/v1/health', async (req, res) => {
  const result = await checkDatabaseHealth();
  if (result.healthy) {
    res.status(200).json({ status: 'ok', db: 'connected' });
  } else {
    console.error('Health check failed:', result.error);
    res.status(503).json({ status: 'error', db: 'disconnected', error: result.error });
  }
});

/**
 * 重置数据库连接接口（用于手动恢复）
 */
app.post('/api/v1/health/reset', (req, res) => {
  resetSupabaseClient();
  res.status(200).json({ status: 'ok', message: 'Database connection reset' });
});

// 返回 API 配置信息给前端
app.get('/api/v1/config', (req, res) => {
  const baseUrl = process.env.EXPO_PUBLIC_BACKEND_BASE_URL || 
                  `${req.protocol}://${req.get('host')}`;
  res.json({ 
    apiBaseUrl: baseUrl,
    version: '1.0.0'
  });
});

// Routes
app.use('/api/v1/words', wordsRouter);
app.use('/api/v1/user-words', userWordsRouter);
app.use('/api/v1/wordbooks', wordbooksRouter);
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/comments', commentsRouter);
app.use('/api/v1/example-images', exampleImagesRouter);
app.use('/api/v1/grammar-check', grammarCheckRouter);
app.use('/api/v1/speech-eval', speechEvalRouter);
app.use('/api/v1/tts', ttsRouter);

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}/`);
  // 启动数据库连接保活（每60秒检查一次）
  startKeepAlive(60000);
  console.log('Database keep-alive started');
});
