import express from "express";
import { getSupabaseClient } from "@/storage/database/supabase-client";

const router = express.Router();

interface Word {
  id: number;
  word: string;
  meaning: string | null;
  phonetic: string | null;
  example: string | null;
}

// GET /api/v1/user-words - 获取用户已购词汇列表
router.get('/', async (req, res) => {
  try {
    const client = getSupabaseClient();
    const { data, error } = await client
      .from('user_words')
      .select(`
        word_id,
        words (id, word, meaning, phonetic, example)
      `)
      .order('purchased_at', { ascending: false });

    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }

    // 格式化数据
    const words = data?.map((item: any) => item.words).filter(Boolean) || [];
    res.json(words);
  } catch (err) {
    console.error('Error fetching user words:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/v1/user-words/count - 获取用户词汇数量
router.get('/count', async (req, res) => {
  try {
    const client = getSupabaseClient();
    const { count, error } = await client
      .from('user_words')
      .select('*', { count: 'exact', head: true });

    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }

    res.json({ count });
  } catch (err) {
    console.error('Error counting user words:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/v1/user-words/purchase - 购买词汇
router.post('/purchase', async (req, res) => {
  try {
    const { wordIds, userId = 1 } = req.body;

    if (!wordIds || !Array.isArray(wordIds)) {
      res.status(400).json({ error: 'wordIds is required and must be an array' });
      return;
    }

    const client = getSupabaseClient();

    // 插入用户词汇记录
    const records = wordIds.map((wordId: number) => ({
      word_id: wordId,
      user_id: userId,
    }));

    const { error } = await client.from('user_words').upsert(records, {
      onConflict: 'word_id,user_id',
      ignoreDuplicates: true,
    });

    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }

    res.json({ success: true, message: 'Words purchased successfully' });
  } catch (err) {
    console.error('Error purchasing words:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
