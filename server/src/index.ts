import dotenv from 'dotenv';
dotenv.config();

import express from "express";
import cors from "cors";
import wordsRouter from "./routes/words";
import userWordsRouter from "./routes/user-words";
import wordbooksRouter from "./routes/wordbooks";
import authRouter from "./routes/auth";
import commentsRouter from "./routes/comments";
import exampleImagesRouter from "./routes/example-images";
import grammarCheckRouter from "./routes/grammar-check";
import speechEvalRouter from "./routes/speech-eval";
import ttsRouter from "./routes/tts";
import { getSupabaseClient } from "./storage/database/supabase-client";

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
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/comments', commentsRouter);
app.use('/api/v1/example-images', exampleImagesRouter);
app.use('/api/v1/grammar-check', grammarCheckRouter);
app.use('/api/v1/speech-eval', speechEvalRouter);
app.use('/api/v1/tts', ttsRouter);


// Seed data: ensure words_b has default words if empty
async function seedWords() {
  try {
    const client = getSupabaseClient();
    const { data, error } = await client.from('words_b').select('id', { count: 'exact', head: true });
    if (error) {
      console.error('Seed check error:', error.message);
      return;
    }
    if (!data || data.length === 0) {
      console.log('words_b is empty, seeding default words...');
      const defaultWords = [
        { word: 'abandon', phonetic: "/ə'bændən/", meaning: 'v. 放弃，抛弃', example: 'He abandoned his car and ran for help.', translation: '他弃车跑去求救。', example_translation: 'He abandoned his car and ran for help.', image_url: '' },
        { word: 'ability', phonetic: "/ə'bɪləti/", meaning: 'n. 能力，才能', example: 'She has the ability to solve complex problems.', translation: '她有能力解决复杂问题。', example_translation: 'She has the ability to solve complex problems.', image_url: '' },
        { word: 'absence', phonetic: "'æbsəns", meaning: 'n. 缺席，缺乏', example: 'His absence was noted by everyone.', translation: '大家都注意到了他的缺席。', example_translation: 'His absence was noted by everyone.', image_url: '' },
        { word: 'absolute', phonetic: "'æbsəluːt", meaning: 'adj. 绝对的，完全的', example: 'I have absolute confidence in you.', translation: '我对你有绝对的信心。', example_translation: 'I have absolute confidence in you.', image_url: '' },
        { word: 'absorb', phonetic: "əb'zɔːrb", meaning: 'v. 吸收，吸引', example: 'The sponge can absorb a lot of water.', translation: '海绵能吸收大量水分。', example_translation: 'The sponge can absorb a lot of water.', image_url: '' },
        { word: 'abstract', phonetic: "'æbstrækt", meaning: 'adj. 抽象的', example: 'The painting is very abstract.', translation: '这幅画非常抽象。', example_translation: 'The painting is very abstract.', image_url: '' },
        { word: 'abundant', phonetic: "ə'bʌndənt", meaning: 'adj. 丰富的，充裕的', example: 'The region has abundant natural resources.', translation: '该地区拥有丰富的自然资源。', example_translation: 'The region has abundant natural resources.', image_url: '' },
        { word: 'abuse', phonetic: "ə'bjuːs", meaning: 'v./n. 滥用，虐待', example: 'Drug abuse is a serious problem.', translation: '药物滥用是一个严重的问题。', example_translation: 'Drug abuse is a serious problem.', image_url: '' },
        { word: 'academic', phonetic: "ˌækə'demɪk", meaning: 'adj. 学术的', example: 'She has a strong academic background.', translation: '她有很强的学术背景。', example_translation: 'She has a strong academic background.', image_url: '' },
        { word: 'academy', phonetic: "ə'kædəmi", meaning: 'n. 学院，研究院', example: 'He studied at a military academy.', translation: '他在一所军事学院学习。', example_translation: 'He studied at a military academy.', image_url: '' },
        { word: 'accelerate', phonetic: "ək'seləreɪt", meaning: 'v. 加速，促进', example: 'The car began to accelerate.', translation: '汽车开始加速。', example_translation: 'The car began to accelerate.', image_url: '' },
        { word: 'accent', phonetic: "'æksent", meaning: 'n. 口音，重音', example: 'She speaks with a British accent.', translation: '她说话带有英国口音。', example_translation: 'She speaks with a British accent.', image_url: '' },
        { word: 'accept', phonetic: "ək'sept", meaning: 'v. 接受，认可', example: 'I accept your apology.', translation: '我接受你的道歉。', example_translation: 'I accept your apology.', image_url: '' },
        { word: 'access', phonetic: "'ækses", meaning: 'n. 通道，访问', example: 'You need a password to access the system.', translation: '你需要密码才能访问系统。', example_translation: 'You need a password to access the system.', image_url: '' },
        { word: 'accident', phonetic: "'æksɪdənt", meaning: 'n. 事故，意外', example: 'He had a car accident yesterday.', translation: '他昨天出了车祸。', example_translation: 'He had a car accident yesterday.', image_url: '' },
        { word: 'accompany', phonetic: "ə'kʌmpəni", meaning: 'v. 陪伴，伴随', example: 'She accompanied me to the hospital.', translation: '她陪我去医院。', example_translation: 'She accompanied me to the hospital.', image_url: '' },
        { word: 'accomplish', phonetic: "ə'kʌmplɪʃ", meaning: 'v. 完成，实现', example: 'We accomplished our mission.', translation: '我们完成了任务。', example_translation: 'We accomplished our mission.', image_url: '' },
        { word: 'accord', phonetic: "ə'kɔːrd", meaning: 'v. 一致，符合', example: 'His views accord with mine.', translation: '他的观点与我一致。', example_translation: 'His views accord with mine.', image_url: '' },
        { word: 'account', phonetic: "ə'kaʊnt", meaning: 'n. 账户，解释', example: 'I opened a bank account.', translation: '我开了一个银行账户。', example_translation: 'I opened a bank account.', image_url: '' },
        { word: 'accumulate', phonetic: "ə'kjuːmjəleɪt", meaning: 'v. 积累，积聚', example: 'Dust began to accumulate on the shelves.', translation: '灰尘开始在架子上积聚。', example_translation: 'Dust began to accumulate on the shelves.', image_url: '' },
      ];
      const { error: insertError } = await client.from('words_b').insert(defaultWords);
      if (insertError) {
        console.error('Seed insert error:', insertError.message);
      } else {
        console.log('Seeded', defaultWords.length, 'words into words_b');
      }
    } else {
      console.log('words_b already has', data.length, 'words, skip seeding');
    }
  } catch (e) {
    console.error('Seed error:', e);
  }
}

// Keep-alive: prevent sandbox from sleeping by pinging ourselves every 5 minutes
function startKeepAlive() {
  const backendUrl = process.env.COZE_PROJECT_DOMAIN_DEFAULT || `http://localhost:${port}`;
  setInterval(async () => {
    try {
      const res = await fetch(`${backendUrl}/api/v1/health`);
      console.log(`[KeepAlive] ${new Date().toISOString()} status: ${res.status}`);
    } catch (e) {
      console.error('[KeepAlive] ping failed:', e);
    }
  }, 5 * 60 * 1000);
}

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}/`);
  seedWords();
  startKeepAlive();
});
