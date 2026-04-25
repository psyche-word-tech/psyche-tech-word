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

// POST /api/v1/user-words/move - 将单词从 words_b 移动到 words_x/y/z
router.post('/move', async (req, res) => {
  try {
    const { wordId, targetTable } = req.body;

    if (!wordId || !targetTable) {
      res.status(400).json({ error: 'wordId and targetTable are required' });
      return;
    }

    // 验证目标表名
    const validTables = ['words_x', 'words_y', 'words_z'];
    if (!validTables.includes(targetTable)) {
      res.status(400).json({ error: 'Invalid target table' });
      return;
    }

    const client = getSupabaseClient();

    // 从 words_b 获取单词详情
    const { data: word, error: fetchError } = await client
      .from('words_b')
      .select('*')
      .eq('id', wordId)
      .single();

    if (fetchError || !word) {
      res.status(404).json({ error: 'Word not found in words_b' });
      return;
    }

    // 插入到目标表
    const { error: insertError } = await client.from(targetTable).insert({
      word: word.word,
      meaning: word.meaning,
      phonetic: word.phonetic,
      example: word.example,
      translation: word.translation,
    });

    if (insertError) {
      res.status(500).json({ error: insertError.message });
      return;
    }

    // 从 words_b 删除
    const { error: deleteError } = await client
      .from('words_b')
      .delete()
      .eq('id', wordId);

    if (deleteError) {
      res.status(500).json({ error: deleteError.message });
      return;
    }

    res.json({ success: true, message: `Word moved to ${targetTable}` });
  } catch (err) {
    console.error('Error moving word:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/v1/user-words/category/:table - 获取分类单词列表
router.get('/category/:table', async (req, res) => {
  try {
    const { table } = req.params;

    // 验证表名
    const validTables = ['words_b', 'words_x', 'words_y', 'words_z'];
    if (!validTables.includes(table)) {
      res.status(400).json({ error: 'Invalid table name' });
      return;
    }

    const client = getSupabaseClient();
    const { data, error } = await client
      .from(table)
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }

    res.json(data || []);
  } catch (err) {
    console.error('Error fetching category words:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/v1/user-words/category/:table/count - 获取分类单词数量
router.get('/category/:table/count', async (req, res) => {
  try {
    const { table } = req.params;

    // 验证表名
    const validTables = ['words_b', 'words_x', 'words_y', 'words_z'];
    if (!validTables.includes(table)) {
      res.status(400).json({ error: 'Invalid table name' });
      return;
    }

    const client = getSupabaseClient();
    const { count, error } = await client
      .from(table)
      .select('*', { count: 'exact', head: true });

    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }

    res.json({ count });
  } catch (err) {
    console.error('Error counting category words:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
