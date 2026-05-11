/**
 * 本地SQLite数据库服务
 * 用于离线模式下存储和查询单词、学习进度等数据
 */
import * as SQLite from 'expo-sqlite';

let db: SQLite.SQLiteDatabase | null = null;

const DB_NAME = 'wordstudy.db';

/**
 * 获取数据库实例（单例模式）
 */
export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (db) return db;
  db = await SQLite.openDatabaseAsync(DB_NAME);
  return db;
}

/**
 * 初始化数据库表结构
 */
export async function initDatabase(): Promise<void> {
  const database = await getDatabase();

  await database.execAsync(`
    PRAGMA journal_mode = WAL;

    -- 单词表：存储所有单词数据
    CREATE TABLE IF NOT EXISTS words_local (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      word TEXT NOT NULL UNIQUE,
      phonetic TEXT,
      meaning TEXT,
      example TEXT,
      example_translation TEXT,
      translation TEXT,
      example_image_url TEXT,
      image_url TEXT,
      example_audio_url TEXT,
      noun_phrase TEXT,
      source_table TEXT DEFAULT 'words_b',
      is_synced INTEGER DEFAULT 0,
      updated_at INTEGER DEFAULT (strftime('%s', 'now'))
    );

    -- 单词分类表：x1, y1, z1, 111 等
    CREATE TABLE IF NOT EXISTS word_categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      word TEXT NOT NULL,
      category TEXT NOT NULL,
      source_table TEXT DEFAULT 'words_b',
      is_synced INTEGER DEFAULT 0,
      created_at INTEGER DEFAULT (strftime('%s', 'now')),
      UNIQUE(word, category)
    );

    -- 用户学习记录
    CREATE TABLE IF NOT EXISTS user_words (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      word TEXT NOT NULL,
      status TEXT DEFAULT 'unknown',
      familiarity INTEGER DEFAULT 0,
      review_count INTEGER DEFAULT 0,
      last_review_at INTEGER,
      next_review_at INTEGER,
      is_synced INTEGER DEFAULT 0,
      created_at INTEGER DEFAULT (strftime('%s', 'now'))
    );

    -- 学习进度表
    CREATE TABLE IF NOT EXISTS study_progress (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      key TEXT NOT NULL UNIQUE,
      value TEXT,
      updated_at INTEGER DEFAULT (strftime('%s', 'now'))
    );

    -- 本地评论
    CREATE TABLE IF NOT EXISTS comments_local (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      word TEXT NOT NULL,
      content TEXT NOT NULL,
      user_name TEXT DEFAULT '',
      is_synced INTEGER DEFAULT 0,
      created_at INTEGER DEFAULT (strftime('%s', 'now'))
    );

    -- 同步状态记录
    CREATE TABLE IF NOT EXISTS sync_status (
      id INTEGER PRIMARY KEY,
      last_sync_at INTEGER DEFAULT 0,
      is_initial_sync INTEGER DEFAULT 0
    );

    -- 插入默认同步记录
    INSERT OR IGNORE INTO sync_status (id) VALUES (1);
  `);
}

/**
 * 插入或更新单词
 */
export async function upsertWord(word: any): Promise<void> {
  const database = await getDatabase();
  await database.runAsync(
    `INSERT OR REPLACE INTO words_local 
     (word, phonetic, meaning, example, example_translation, translation, 
      example_image_url, image_url, example_audio_url, noun_phrase, source_table, is_synced)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
    [
      word.word,
      word.phonetic || '',
      word.meaning || '',
      word.example || '',
      word.example_translation || word.translation || '',
      word.translation || '',
      word.example_image_url || word.image_url || '',
      word.image_url || word.example_image_url || '',
      word.example_audio_url || '',
      word.noun_phrase || '',
      word.source_table || 'words_b',
    ]
  );
}

/**
 * 批量插入单词
 */
export async function batchInsertWords(words: any[]): Promise<void> {
  const database = await getDatabase();
  await database.withTransactionAsync(async () => {
    for (const word of words) {
      await database.runAsync(
        `INSERT OR IGNORE INTO words_local 
         (word, phonetic, meaning, example, example_translation, translation,
          example_image_url, image_url, example_audio_url, noun_phrase, source_table, is_synced)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
        [
          word.word,
          word.phonetic || '',
          word.meaning || '',
          word.example || '',
          word.example_translation || word.translation || '',
          word.translation || '',
          word.example_image_url || word.image_url || '',
          word.image_url || word.example_image_url || '',
          word.example_audio_url || '',
          word.noun_phrase || '',
          word.source_table || 'words_b',
        ]
      );
    }
  });
}

/**
 * 获取所有单词
 */
export async function getAllWords(sourceTable?: string): Promise<any[]> {
  const database = await getDatabase();
  const sql = sourceTable
    ? 'SELECT * FROM words_local WHERE source_table = ? ORDER BY id'
    : 'SELECT * FROM words_local ORDER BY id';
  const params = sourceTable ? [sourceTable] : [];
  return await database.getAllAsync<any>(sql, params);
}

/**
 * 根据单词文本查询
 */
export async function getWordByText(wordText: string): Promise<any | null> {
  const database = await getDatabase();
  return await database.getFirstAsync<any>(
    'SELECT * FROM words_local WHERE word = ?',
    [wordText]
  );
}

/**
 * 获取单词总数
 */
export async function getWordCount(sourceTable?: string): Promise<number> {
  const database = await getDatabase();
  const sql = sourceTable
    ? 'SELECT COUNT(*) as count FROM words_local WHERE source_table = ?'
    : 'SELECT COUNT(*) as count FROM words_local';
  const params = sourceTable ? [sourceTable] : [];
  const result = await database.getFirstAsync<{ count: number }>(sql, params);
  return result?.count || 0;
}

/**
 * 添加单词分类
 */
export async function addWordCategory(word: string, category: string, sourceTable?: string): Promise<void> {
  const database = await getDatabase();
  await database.runAsync(
    `INSERT OR REPLACE INTO word_categories (word, category, source_table, is_synced)
     VALUES (?, ?, ?, 0)`,
    [word, category, sourceTable || 'words_b']
  );
}

/**
 * 获取分类下的单词
 */
export async function getWordsByCategory(category: string): Promise<any[]> {
  const database = await getDatabase();
  return await database.getAllAsync<any>(
    `SELECT w.* FROM words_local w
     INNER JOIN word_categories c ON w.word = c.word
     WHERE c.category = ?`,
    [category]
  );
}

/**
 * 获取已分类的单词列表
 */
export async function getClassifiedWords(categories: string[]): Promise<string[]> {
  const database = await getDatabase();
  const placeholders = categories.map(() => '?').join(',');
  const result = await database.getAllAsync<{ word: string }>(
    `SELECT DISTINCT word FROM word_categories WHERE category IN (${placeholders})`,
    categories
  );
  return result.map((r) => r.word);
}

/**
 * 获取未分类单词（不在指定分类中的单词）
 */
export async function getUnclassifiedWords(sourceTable: string, categories: string[]): Promise<any[]> {
  const database = await getDatabase();
  const placeholders = categories.map(() => '?').join(',');
  return await database.getAllAsync<any>(
    `SELECT * FROM words_local 
     WHERE source_table = ? 
     AND word NOT IN (
       SELECT DISTINCT word FROM word_categories WHERE category IN (${placeholders})
     )
     ORDER BY id`,
    [sourceTable, ...categories]
  );
}

/**
 * 移动单词到分类
 */
export async function moveWordToCategory(word: string, category: string): Promise<void> {
  const database = await getDatabase();
  await database.withTransactionAsync(async () => {
    // 先从其他分类中移除
    await database.runAsync(
      'DELETE FROM word_categories WHERE word = ?',
      [word]
    );
    // 添加到新分类
    await database.runAsync(
      `INSERT OR REPLACE INTO word_categories (word, category, is_synced)
       VALUES (?, ?, 0)`,
      [word, category]
    );
  });
}

/**
 * 获取分类数量统计
 */
export async function getCategoryCounts(): Promise<{ x: number; y: number; z: number }> {
  const database = await getDatabase();
  const x = await database.getFirstAsync<{ count: number }>(
    "SELECT COUNT(*) as count FROM word_categories WHERE category = 'words_x'"
  );
  const y = await database.getFirstAsync<{ count: number }>(
    "SELECT COUNT(*) as count FROM word_categories WHERE category = 'words_y'"
  );
  const z = await database.getFirstAsync<{ count: number }>(
    "SELECT COUNT(*) as count FROM word_categories WHERE category = 'words_z'"
  );
  return {
    x: x?.count || 0,
    y: y?.count || 0,
    z: z?.count || 0,
  };
}

/**
 * 获取导图分类统计（x1, y1, z1）
 */
export async function getMindmapCounts(): Promise<{ x: number; y: number; z: number }> {
  const database = await getDatabase();
  const x = await database.getFirstAsync<{ count: number }>(
    "SELECT COUNT(*) as count FROM word_categories WHERE category = 'x1'"
  );
  const y = await database.getFirstAsync<{ count: number }>(
    "SELECT COUNT(*) as count FROM word_categories WHERE category = 'y1'"
  );
  const z = await database.getFirstAsync<{ count: number }>(
    "SELECT COUNT(*) as count FROM word_categories WHERE category = 'z1'"
  );
  return {
    x: x?.count || 0,
    y: y?.count || 0,
    z: z?.count || 0,
  };
}

/**
 * 保存学习进度
 */
export async function saveStudyProgress(key: string, value: string): Promise<void> {
  const database = await getDatabase();
  await database.runAsync(
    `INSERT OR REPLACE INTO study_progress (key, value, updated_at)
     VALUES (?, ?, strftime('%s', 'now'))`,
    [key, value]
  );
}

/**
 * 获取学习进度
 */
export async function getStudyProgress(key: string): Promise<string | null> {
  const database = await getDatabase();
  const result = await database.getFirstAsync<{ value: string }>(
    'SELECT value FROM study_progress WHERE key = ?',
    [key]
  );
  return result?.value || null;
}

/**
 * 添加本地评论
 */
export async function addComment(word: string, content: string, userName?: string): Promise<void> {
  const database = await getDatabase();
  await database.runAsync(
    `INSERT INTO comments_local (word, content, user_name, is_synced)
     VALUES (?, ?, ?, 0)`,
    [word, content, userName || '']
  );
}

/**
 * 获取单词的评论
 */
export async function getCommentsByWord(word: string): Promise<any[]> {
  const database = await getDatabase();
  return await database.getAllAsync<any>(
    'SELECT * FROM comments_local WHERE word = ? ORDER BY created_at DESC',
    [word]
  );
}

/**
 * 清除所有本地数据
 */
export async function clearAllData(): Promise<void> {
  const database = await getDatabase();
  await database.execAsync(`
    DELETE FROM words_local;
    DELETE FROM word_categories;
    DELETE FROM user_words;
    DELETE FROM study_progress;
    DELETE FROM comments_local;
    UPDATE sync_status SET last_sync_at = 0, is_initial_sync = 0 WHERE id = 1;
  `);
}

/**
 * 获取同步状态
 */
export async function getSyncStatus(): Promise<{ lastSyncAt: number; isInitialSync: boolean }> {
  const database = await getDatabase();
  const result = await database.getFirstAsync<{ last_sync_at: number; is_initial_sync: number }>(
    'SELECT last_sync_at, is_initial_sync FROM sync_status WHERE id = 1'
  );
  return {
    lastSyncAt: result?.last_sync_at || 0,
    isInitialSync: !!result?.is_initial_sync,
  };
}

/**
 * 更新同步状态
 */
export async function updateSyncStatus(lastSyncAt: number, isInitialSync: boolean): Promise<void> {
  const database = await getDatabase();
  await database.runAsync(
    'UPDATE sync_status SET last_sync_at = ?, is_initial_sync = ? WHERE id = 1',
    [lastSyncAt, isInitialSync ? 1 : 0]
  );
}

/**
 * 检查是否是首次启动（需要同步数据）
 */
export async function needsInitialSync(): Promise<boolean> {
  const status = await getSyncStatus();
  return !status.isInitialSync;
}
