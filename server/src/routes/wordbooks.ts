import express from 'express';
import { getSupabaseClient } from '@/storage/database/supabase-client';

const router = express.Router();

/**
 * POST /api/v1/wordbooks/purchase
 * 购买词汇书：将源数据库的单词复制到目标数据库
 * Body: { sourceTable: 'words_a', targetTable: 'words_b' }
 */
router.post('/purchase', async (req, res) => {
  try {
    const { sourceTable, targetTable } = req.body;

    // 验证参数
    const validTables = ['words_a', 'words_b', 'words_c', 'words_d', 'words_x', 'words_y', 'words_z'];
    if (!validTables.includes(sourceTable) || !validTables.includes(targetTable)) {
      res.status(400).json({ error: 'Invalid table name' });
      return;
    }

    const client = getSupabaseClient();

    // 清空目标表
    await client.from(targetTable).delete().neq('id', 0);

    // 从源表获取所有单词
    const { data: sourceWords, error: fetchError } = await client
      .from(sourceTable)
      .select('*');

    if (fetchError) {
      res.status(500).json({ error: fetchError.message });
      return;
    }

    if (!sourceWords || sourceWords.length === 0) {
      res.status(404).json({ error: 'No words found in source table' });
      return;
    }

    // 准备插入数据（移除 id 让数据库自动生成）
    const wordsToInsert = sourceWords.map(({ id, ...rest }) => rest);

    // 插入到目标表
    const { data: insertedWords, error: insertError } = await client
      .from(targetTable)
      .insert(wordsToInsert)
      .select();

    if (insertError) {
      res.status(500).json({ error: insertError.message });
      return;
    }

    res.json({
      success: true,
      message: `Successfully copied ${insertedWords?.length || 0} words from ${sourceTable} to ${targetTable}`,
      count: insertedWords?.length || 0
    });
  } catch (err) {
    console.error('Error purchasing wordbook:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/v1/wordbooks/move
 * 将单词移动到目标表（已会/模糊/不会）
 * Body: { sourceTable: 'words_b', targetTable: 'words_x', wordId: 1 }
 */
router.post('/move', async (req, res) => {
  try {
    const { sourceTable, targetTable, wordId } = req.body;

    // 验证参数
    const validTables = ['words_a', 'words_b', 'words_c', 'words_d', 'words_x', 'words_y', 'words_z'];
    if (!validTables.includes(sourceTable) || !validTables.includes(targetTable)) {
      res.status(400).json({ error: 'Invalid table name' });
      return;
    }

    if (!wordId) {
      res.status(400).json({ error: 'Word ID is required' });
      return;
    }

    const client = getSupabaseClient();

    // 从源表获取单词
    const { data: word, error: fetchError } = await client
      .from(sourceTable)
      .select('*')
      .eq('id', wordId)
      .maybeSingle();

    if (fetchError) {
      res.status(500).json({ error: fetchError.message });
      return;
    }

    if (!word) {
      res.status(404).json({ error: 'Word not found' });
      return;
    }

    // 准备插入数据（移除 id 让数据库自动生成）
    const { id, ...wordData } = word;

    // 插入到目标表
    const { error: insertError } = await client
      .from(targetTable)
      .insert(wordData);

    if (insertError) {
      res.status(500).json({ error: insertError.message });
      return;
    }

    // 从源表删除
    await client.from(sourceTable).delete().eq('id', wordId);

    res.json({
      success: true,
      message: `Word moved to ${targetTable}`
    });
  } catch (err) {
    console.error('Error moving word:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/v1/wordbooks/:table/count
 * 获取指定词汇表的单词数量
 */
router.get('/:table/count', async (req, res) => {
  try {
    const { table } = req.params;
    const validTables = ['words_a', 'words_b', 'words_c', 'words_d', 'words_x', 'words_y', 'words_z', 'user_words'];

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

    res.json({ table, count: count || 0 });
  } catch (err) {
    console.error('Error counting words:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/v1/wordbooks/:table
 * 获取指定词汇表的所有单词
 */
router.get('/:table', async (req, res) => {
  try {
    const { table } = req.params;
    const validTables = ['words_a', 'words_b', 'words_c', 'words_d', 'words_x', 'words_y', 'words_z'];

    if (!validTables.includes(table)) {
      res.status(400).json({ error: 'Invalid table name' });
      return;
    }

    const client = getSupabaseClient();
    const { data, error } = await client
      .from(table)
      .select('*')
      .order('id');

    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }

    res.json(data || []);
  } catch (err) {
    console.error('Error fetching words:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
