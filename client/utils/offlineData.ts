// 离线数据：当后端不可用时，APK 使用这些预置数据
// 所有数据从后端数据库导出，打包进 APK

import wordbooksList from '@/assets/data/wordbooks.json';
import wordbook1 from '@/assets/data/wordbook_1.json';
import wordbook2 from '@/assets/data/wordbook_2.json';
import wordbook3 from '@/assets/data/wordbook_3.json';
import wordbook4 from '@/assets/data/wordbook_4.json';
import wordbookX from '@/assets/data/wordbook_x.json';
import wordbookY from '@/assets/data/wordbook_y.json';
import wordbookZ from '@/assets/data/wordbook_z.json';
import wordbookX1 from '@/assets/data/wordbook_x1.json';
import wordbookY1 from '@/assets/data/wordbook_y1.json';
import wordbookZ1 from '@/assets/data/wordbook_z1.json';
import wordbook111 from '@/assets/data/wordbook_111.json';

const TABLE_MAP: Record<string, any> = {
  'words_a': wordbook1,
  'words_b': wordbook2,
  'words_c': wordbook3,
  'words_d': wordbook4,
  'words_x': wordbookX,
  'words_y': wordbookY,
  'words_z': wordbookZ,
  'x1': wordbookX1,
  'y1': wordbookY1,
  'z1': wordbookZ1,
  '111': wordbook111,
};

export function getOfflineData(path: string): any | null {
  // 词汇书列表
  if (path === '/api/v1/wordbooks' || path === '/api/v1/wordbooks/') {
    return wordbooksList;
  }

  // 单词表 /api/v1/wordbooks/:table
  const match = path.match(/^\/api\/v1\/wordbooks\/([^/]+)$/);
  if (match) {
    const table = match[1];
    if (TABLE_MAP[table]) {
      return TABLE_MAP[table];
    }
  }

  // 用户分类单词 /api/v1/user-words/category/:category
  const categoryMatch = path.match(/^\/api\/v1\/user-words\/category\/([^/]+)$/);
  if (categoryMatch) {
    const category = categoryMatch[1];
    if (TABLE_MAP[category]) {
      return TABLE_MAP[category];
    }
    return [];
  }

  // 用户分类单词计数 /api/v1/user-words/category/:category/count
  const countMatch = path.match(/^\/api\/v1\/user-words\/category\/([^/]+)\/count$/);
  if (countMatch) {
    const category = countMatch[1];
    const data = TABLE_MAP[category] || [];
    return { count: data.length };
  }

  return null;
}
