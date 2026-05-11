/**
 * 离线数据Hook
 * 优先从本地SQLite读取数据，本地无数据时回退到远程API
 */
import { useState, useEffect, useCallback } from 'react';
import {
  getAllWords,
  getWordByText,
  getWordsByCategory,
  getClassifiedWords,
  getUnclassifiedWords,
  getCategoryCounts,
  getMindmapCounts,
  getCommentsByWord,
  getWordCount,
  needsInitialSync,
  initDatabase,
} from '@/utils/localDatabase';
import { API_BASE_URL } from '@/utils/apiConfig';

const EXPO_PUBLIC_BACKEND_BASE_URL = API_BASE_URL;

/**
 * 通用离线数据获取Hook
 */
export function useOfflineWords(table?: string) {
  const [words, setWords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchWords = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await initDatabase();
      // 优先从本地读取
      const localWords = await getAllWords(table);
      if (localWords.length > 0) {
        setWords(localWords);
        setLoading(false);
        return;
      }

      // 本地无数据，回退到远程API
      const response = await fetch(`${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/wordbooks/${table || 'words_b'}`);
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data)) {
          setWords(data);
        }
      } else {
        setError('无法加载单词数据');
      }
    } catch (err) {
      console.error('Fetch words error:', err);
      setError('加载失败');
    } finally {
      setLoading(false);
    }
  }, [table]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchWords();
  }, [fetchWords]);

  return { words, loading, error, refetch: fetchWords };
}

/**
 * 获取单个单词详情（离线优先）
 */
export function useOfflineWordDetail(wordText: string) {
  const [word, setWord] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchWord = useCallback(async () => {
    if (!wordText) return;
    setLoading(true);
    setError(null);
    try {
      await initDatabase();
      // 优先从本地读取
      const localWord = await getWordByText(wordText);
      if (localWord) {
        setWord(localWord);
        setLoading(false);
        return;
      }

      // 本地无数据，回退到远程API
      const response = await fetch(`${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/words/search?word=${encodeURIComponent(wordText)}`);
      if (response.ok) {
        const data = await response.json();
        if (data && data.word) {
          setWord(data);
        } else {
          setError('单词未找到');
        }
      } else {
        setError('无法加载单词详情');
      }
    } catch (err) {
      console.error('Fetch word detail error:', err);
      setError('加载失败');
    } finally {
      setLoading(false);
    }
  }, [wordText]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchWord();
  }, [fetchWord]);

  return { word, loading, error, refetch: fetchWord };
}

/**
 * 获取分类单词（离线优先）
 */
export function useOfflineCategoryWords(category: string) {
  const [words, setWords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchWords = useCallback(async () => {
    setLoading(true);
    try {
      await initDatabase();
      const localWords = await getWordsByCategory(category);
      if (localWords.length > 0) {
        setWords(localWords);
        setLoading(false);
        return;
      }

      // 回退到远程API
      let endpoint = '';
      if (category === 'words_x') endpoint = '/api/v1/words-x/all';
      else if (category === 'words_y') endpoint = '/api/v1/words-y/all';
      else if (category === 'words_z') endpoint = '/api/v1/words-z/all';
      else if (category === 'x1') endpoint = '/api/v1/words-x/1';
      else if (category === 'y1') endpoint = '/api/v1/words-y/1';
      else if (category === 'z1') endpoint = '/api/v1/words-z/1';

      if (endpoint) {
        const response = await fetch(`${EXPO_PUBLIC_BACKEND_BASE_URL}${endpoint}`);
        if (response.ok) {
          const data = await response.json();
          const wordList = data?.words || data;
          if (Array.isArray(wordList)) {
            setWords(wordList);
          }
        }
      }
    } catch (err) {
      console.error('Fetch category words error:', err);
    } finally {
      setLoading(false);
    }
  }, [category]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchWords();
  }, [fetchWords]);

  return { words, loading, refetch: fetchWords };
}

/**
 * 获取分类统计（离线优先）
 */
export function useOfflineCategoryCounts() {
  const [counts, setCounts] = useState({ x: 0, y: 0, z: 0, total: 0 });
  const [loading, setLoading] = useState(true);

  const fetchCounts = useCallback(async () => {
    setLoading(true);
    try {
      await initDatabase();
      const localCounts = await getCategoryCounts();
      const total = await getWordCount();
      if (localCounts.x > 0 || localCounts.y > 0 || localCounts.z > 0 || total > 0) {
        setCounts({ ...localCounts, total });
        setLoading(false);
        return;
      }

      // 回退到远程API
      const response = await fetch(`${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/wordbooks/counts`);
      if (response.ok) {
        const data = await response.json();
        setCounts({
          x: data.words_x || 0,
          y: data.words_y || 0,
          z: data.words_z || 0,
          total: data.total || 0,
        });
      }
    } catch (err) {
      console.error('Fetch counts error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchCounts();
  }, [fetchCounts]);

  return { counts, loading, refetch: fetchCounts };
}

/**
 * 获取导图分类统计（x1, y1, z1）
 */
export function useOfflineMindmapCounts() {
  const [counts, setCounts] = useState({ x: 0, y: 0, z: 0 });
  const [loading, setLoading] = useState(true);

  const fetchCounts = useCallback(async () => {
    setLoading(true);
    try {
      await initDatabase();
      const localCounts = await getMindmapCounts();
      if (localCounts.x > 0 || localCounts.y > 0 || localCounts.z > 0) {
        setCounts(localCounts);
        setLoading(false);
        return;
      }

      // 回退到远程API
      const [resX, resY, resZ] = await Promise.all([
        fetch(`${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/words-x/1`),
        fetch(`${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/words-y/1`),
        fetch(`${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/words-z/1`),
      ]);

      const xData = resX.ok ? await resX.json() : { words: [] };
      const yData = resY.ok ? await resY.json() : { words: [] };
      const zData = resZ.ok ? await resZ.json() : { words: [] };

      setCounts({
        x: xData.words?.length || 0,
        y: yData.words?.length || 0,
        z: zData.words?.length || 0,
      });
    } catch (err) {
      console.error('Fetch mindmap counts error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchCounts();
  }, [fetchCounts]);

  return { counts, loading, refetch: fetchCounts };
}

/**
 * 获取未分类单词（离线优先）
 */
export function useOfflineUnclassifiedWords(sourceTable: string, categories: string[]) {
  const [words, setWords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchWords = useCallback(async () => {
    setLoading(true);
    try {
      await initDatabase();
      const localWords = await getUnclassifiedWords(sourceTable, categories);
      if (localWords.length > 0) {
        setWords(localWords);
        setLoading(false);
        return;
      }

      // 回退到远程API：获取所有单词和分类单词，计算差集
      const [allRes, ...categoryRes] = await Promise.all([
        fetch(`${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/wordbooks/${sourceTable}`),
        ...categories.map((cat) => fetch(`${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/${cat}/all`)),
      ]);

      const allWords = allRes.ok ? await allRes.json() : [];
      const classifiedSet = new Set<string>();
      for (const res of categoryRes) {
        if (res.ok) {
          const data = await res.json();
          const wordsList = data?.words || data;
          if (Array.isArray(wordsList)) {
            wordsList.forEach((w: any) => classifiedSet.add(typeof w === 'string' ? w : w.word));
          }
        }
      }

      const unclassified = allWords.filter((w: any) => !classifiedSet.has(w.word));
      setWords(unclassified);
    } catch (err) {
      console.error('Fetch unclassified words error:', err);
    } finally {
      setLoading(false);
    }
  }, [sourceTable, categories]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchWords();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sourceTable, categories]);

  return { words, loading, refetch: fetchWords };
}

/**
 * 检查是否需要首次同步
 */
export function useNeedsSync() {
  const [needsSync, setNeedsSync] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const check = async () => {
      try {
        await initDatabase();
        const needs = await needsInitialSync();
        setNeedsSync(needs);
      } catch (err) {
        console.error('Check sync status error:', err);
      } finally {
        setChecking(false);
      }
    };
    check();
  }, []);

  return { needsSync, checking };
}
