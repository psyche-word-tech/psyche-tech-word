import express from 'express';
import { getSupabaseClient } from '@/storage/database/supabase-client';

const router = express.Router();

interface Word {
  id: number;
  word: string;
  meaning: string | null;
}

// 获取单词列表
router.get('/', async (req, res) => {
  try {
    const client = getSupabaseClient();
    const { data, error } = await client.from('words').select('id, word, meaning').order('id');
    
    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }
    
    res.json({ data: data as Word[] });
  } catch (err) {
    console.error('Error fetching words:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 获取单个单词
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const client = getSupabaseClient();
    const { data, error } = await client.from('words').select('id, word, meaning').eq('id', parseInt(id)).maybeSingle();
    
    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }
    
    if (!data) {
      res.status(404).json({ error: 'Word not found' });
      return;
    }
    
    res.json({ data: data as Word });
  } catch (err) {
    console.error('Error fetching word:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
