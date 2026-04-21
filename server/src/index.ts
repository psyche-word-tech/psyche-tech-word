import express from "express";
import cors from "cors";
import wordsRouter from "./routes/words";
import userWordsRouter from "./routes/user-words";
import wordbooksRouter from "./routes/wordbooks";

const app = express();
const port = process.env.PORT || 9091;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

app.get('/api/v1/health', (req, res) => {
  console.log('Health check success');
  res.status(200).json({ status: 'ok' });
});

// 返回 API 配置信息给前端
app.get('/api/v1/config', (req, res) => {
  // 优先使用环境变量，其次使用请求来源
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


app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}/`);
});
