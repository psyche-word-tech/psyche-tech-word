/**
 * 离线数据 - 动态加载版本
 * Web: 使用 fetch 从静态资源加载，不打包进 bundle
 * Mobile: 数据由 build 时嵌入
 */

const DATA_BASE_URL = '/assets/data';

// table name -> JSON file mapping
const TABLE_TO_FILE: Record<string, string> = {
  words_a: 'wordbook_1_minimal',
  words_b: 'wordbook_2_minimal',
  words_c: 'wordbook_3_minimal',
  words_d: 'wordbook_4_minimal',
  words_x: 'wordbook_x_minimal',
  words_y: 'wordbook_y_minimal',
  words_z: 'wordbook_z_minimal',
};

interface WordRecord {
  id: number;
  word: string;
  phonetic?: string;
  definition?: string;
  audioUrl?: string;
  category?: string;
}

type OfflineData = WordRecord[] | { count: number } | null;

const cache: Record<string, OfflineData> = {};

async function loadJSON<T>(url: string): Promise<T | null> {
  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    return await response.json();
  } catch {
    return null;
  }
}

// 异步版本 - web 使用
export async function getOfflineDataAsync(path: string): Promise<OfflineData> {
  if (cache[path] !== undefined) return cache[path];

  // wordbooks 列表
  if (path === '/api/v1/wordbooks' || path === '/api/v1/wordbooks/') {
    cache[path] = await loadJSON<any[]>(`${DATA_BASE_URL}/wordbooks.json`);
    return cache[path];
  }

  // /api/v1/wordbooks/:table
  const tableMatch = path.match(/^\/api\/v1\/wordbooks\/([^/]+)$/);
  if (tableMatch) {
    const table = tableMatch[1];
    const fileName = TABLE_TO_FILE[table];
    if (!fileName) return null;
    const url = `${DATA_BASE_URL}/${fileName}.json`;
    const data = await loadJSON<WordRecord[]>(url);
    cache[path] = data;
    return cache[path];
  }

  // /api/v1/words/:id
  const wordMatch = path.match(/^\/api\/v1\/words\/(\d+)$/);
  if (wordMatch) {
    const id = parseInt(wordMatch[1]);
    // 从 wordbook_1 中查找（包含完整数据）
    const data = await loadJSON<WordRecord[]>(`${DATA_BASE_URL}/wordbook_1_minimal.json`);
    cache[path] = data ? data.filter(w => w.id === id) : null;
    return cache[path];
  }

  // /api/v1/user-words/category/:category -> 映射到 wordbook 数据
  const catMatch = path.match(/^\/api\/v1\/user-words\/category\/([^/]+)(\/count)?$/);
  if (catMatch) {
    const category = catMatch[1];
    const isCount = !!catMatch[2];
    const fileName = TABLE_TO_FILE[category];
    if (fileName) {
      const url = `${DATA_BASE_URL}/${fileName}.json`;
      const data = await loadJSON<WordRecord[]>(url);
      if (isCount) {
        // 返回 { count: number } 格式
        cache[path] = { count: data?.length ?? 0 };
        return cache[path];
      }
      cache[path] = data;
      return cache[path];
    }
    cache[path] = [];
    return cache[path];
  }

  cache[path] = null;
  return null;
}

// 预加载所有离线数据（可选调用）
export async function preloadOfflineData(): Promise<void> {
  const paths = [
    '/api/v1/wordbooks',
    '/api/v1/wordbooks/words_a',
    '/api/v1/wordbooks/words_b',
    '/api/v1/wordbooks/words_c',
    '/api/v1/wordbooks/words_d',
    '/api/v1/wordbooks/words_x',
    '/api/v1/wordbooks/words_y',
    '/api/v1/wordbooks/words_z',
    '/api/v1/user-words/category/words_b',
    '/api/v1/user-words/category/words_x',
    '/api/v1/user-words/category/words_y',
    '/api/v1/user-words/category/words_z',
  ];
  await Promise.all(paths.map(p => getOfflineDataAsync(p)));
}
