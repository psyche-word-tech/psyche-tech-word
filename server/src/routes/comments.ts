import { Router } from 'express';
import { getSupabaseClient } from '../storage/database/supabase-client';

const router = Router();

const supabase = getSupabaseClient();

// 获取某个单词的评论列表
router.get('/:wordId', async (req, res) => {
  try {
    const { wordId } = req.params;
    
    const { data, error } = await supabase
      .from('comments')
      .select('*')
      .eq('word_id', wordId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    
    res.json(data || []);
  } catch (error) {
    console.error('Failed to fetch comments:', error);
    res.status(500).json({ error: 'Failed to fetch comments' });
  }
});

// 创建评论
router.post('/', async (req, res) => {
  try {
    const { wordId, wordText, userName, content } = req.body;

    if (!wordId || !content) {
      return res.status(400).json({ error: 'wordId and content are required' });
    }

    const { data, error } = await supabase
      .from('comments')
      .insert({
        word_id: wordId,
        word_text: wordText || '',
        user_name: userName || '匿名用户',
        content: content
      })
      .select()
      .single();

    if (error) throw error;
    
    res.json(data);
  } catch (error) {
    console.error('Failed to create comment:', error);
    res.status(500).json({ error: 'Failed to create comment' });
  }
});

export default router;
