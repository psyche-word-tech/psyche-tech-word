/**
 * 数据同步服务
 * 负责在首次启动时从服务器全量同步数据到本地SQLite
 * 以及在有网时增量同步学习进度到云端
 */
import { getDatabase, initDatabase, batchInsertWords, addWordCategory, updateSyncStatus, getSyncStatus } from './localDatabase';

const EXPO_PUBLIC_BACKEND_BASE_URL = process.env.EXPO_PUBLIC_BACKEND_BASE_URL;

/**
 * 检查网络是否可用
 */
async function isNetworkAvailable(): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const response = await fetch(`${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/health`, {
      method: 'GET',
      signal: controller.signal,
    });
    clearTimeout(timeout);
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * 首次启动全量同步数据
 * 从服务器拉取所有单词、分类等数据到本地
 */
export async function performInitialSync(): Promise<{ success: boolean; message: string }> {
  try {
    // 先初始化本地数据库
    await initDatabase();

    // 检查网络
    const hasNetwork = await isNetworkAvailable();
    if (!hasNetwork) {
      return { success: false, message: '网络不可用，请连接网络后重试' };
    }

    // 检查是否已同步过
    const status = await getSyncStatus();
    if (status.isInitialSync) {
      return { success: true, message: '数据已是最新' };
    }

    // 同步单词数据
    const syncResult = await syncAllWords();
    if (!syncResult.success) {
      return syncResult;
    }

    // 同步分类数据
    const categoryResult = await syncAllCategories();
    if (!categoryResult.success) {
      return categoryResult;
    }

    // 更新同步状态
    await updateSyncStatus(Math.floor(Date.now() / 1000), true);

    return { success: true, message: '数据同步完成' };
  } catch (error) {
    console.error('Initial sync error:', error);
    return { success: false, message: '同步失败: ' + (error as Error).message };
  }
}

/**
 * 同步所有单词数据
 */
async function syncAllWords(): Promise<{ success: boolean; message: string }> {
  try {
    // 获取 words_a 表
    const resA = await fetch(`${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/words`);
    if (resA.ok) {
      const wordsA = await resA.json();
      if (Array.isArray(wordsA)) {
        const mapped = wordsA.map((w: any) => ({ ...w, source_table: 'words_a' }));
        await batchInsertWords(mapped);
      }
    }

    // 获取 words_b 表
    const resB = await fetch(`${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/wordbooks/words_b`);
    if (resB.ok) {
      const wordsB = await resB.json();
      if (Array.isArray(wordsB)) {
        const mapped = wordsB.map((w: any) => ({ ...w, source_table: 'words_b' }));
        await batchInsertWords(mapped);
      }
    }

    // 获取 words_x 表
    const resX = await fetch(`${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/wordbooks/words_x`);
    if (resX.ok) {
      const wordsX = await resX.json();
      if (Array.isArray(wordsX)) {
        const mapped = wordsX.map((w: any) => ({ ...w, source_table: 'words_x' }));
        await batchInsertWords(mapped);
      }
    }

    // 获取 words_y 表
    const resY = await fetch(`${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/wordbooks/words_y`);
    if (resY.ok) {
      const wordsY = await resY.json();
      if (Array.isArray(wordsY)) {
        const mapped = wordsY.map((w: any) => ({ ...w, source_table: 'words_y' }));
        await batchInsertWords(mapped);
      }
    }

    // 获取 words_z 表
    const resZ = await fetch(`${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/wordbooks/words_z`);
    if (resZ.ok) {
      const wordsZ = await resZ.json();
      if (Array.isArray(wordsZ)) {
        const mapped = wordsZ.map((w: any) => ({ ...w, source_table: 'words_z' }));
        await batchInsertWords(mapped);
      }
    }

    // 获取 111 表单词
    const res111 = await fetch(`${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/wordbooks/111`);
    if (res111.ok) {
      const words111 = await res111.json();
      if (Array.isArray(words111)) {
        const mapped = words111.map((w: any) => ({ ...w, source_table: '111' }));
        await batchInsertWords(mapped);
      }
    }

    return { success: true, message: '单词同步完成' };
  } catch (error) {
    console.error('Sync words error:', error);
    return { success: false, message: '单词同步失败' };
  }
}

/**
 * 同步所有分类数据
 */
async function syncAllCategories(): Promise<{ success: boolean; message: string }> {
  try {
    const database = await getDatabase();

    // 同步 x1 分类
    const resX1 = await fetch(`${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/wordbooks/x1`);
    if (resX1.ok) {
      const data = await resX1.json();
      const words = data?.words || data;
      if (Array.isArray(words)) {
        for (const w of words) {
          const wordText = typeof w === 'string' ? w : w.word;
          if (wordText) {
            await addWordCategory(wordText, 'x1', 'words_b');
          }
        }
      }
    }

    // 同步 y1 分类
    const resY1 = await fetch(`${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/wordbooks/y1`);
    if (resY1.ok) {
      const data = await resY1.json();
      const words = data?.words || data;
      if (Array.isArray(words)) {
        for (const w of words) {
          const wordText = typeof w === 'string' ? w : w.word;
          if (wordText) {
            await addWordCategory(wordText, 'y1', 'words_b');
          }
        }
      }
    }

    // 同步 z1 分类
    const resZ1 = await fetch(`${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/wordbooks/z1`);
    if (resZ1.ok) {
      const data = await resZ1.json();
      const words = data?.words || data;
      if (Array.isArray(words)) {
        for (const w of words) {
          const wordText = typeof w === 'string' ? w : w.word;
          if (wordText) {
            await addWordCategory(wordText, 'z1', 'words_b');
          }
        }
      }
    }

    // 同步 words_x 分类
    const resWX = await fetch(`${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/words-x/all`);
    if (resWX.ok) {
      const data = await resWX.json();
      const words = data?.words || data;
      if (Array.isArray(words)) {
        for (const w of words) {
          const wordText = typeof w === 'string' ? w : w.word;
          if (wordText) {
            await addWordCategory(wordText, 'words_x', 'words_b');
          }
        }
      }
    }

    // 同步 words_y 分类
    const resWY = await fetch(`${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/words-y/all`);
    if (resWY.ok) {
      const data = await resWY.json();
      const words = data?.words || data;
      if (Array.isArray(words)) {
        for (const w of words) {
          const wordText = typeof w === 'string' ? w : w.word;
          if (wordText) {
            await addWordCategory(wordText, 'words_y', 'words_b');
          }
        }
      }
    }

    // 同步 words_z 分类
    const resWZ = await fetch(`${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/words-z/all`);
    if (resWZ.ok) {
      const data = await resWZ.json();
      const words = data?.words || data;
      if (Array.isArray(words)) {
        for (const w of words) {
          const wordText = typeof w === 'string' ? w : w.word;
          if (wordText) {
            await addWordCategory(wordText, 'words_z', 'words_b');
          }
        }
      }
    }

    return { success: true, message: '分类同步完成' };
  } catch (error) {
    console.error('Sync categories error:', error);
    return { success: false, message: '分类同步失败' };
  }
}

/**
 * 强制重新同步（清除本地数据后重新拉取）
 */
export async function forceResync(): Promise<{ success: boolean; message: string }> {
  try {
    const database = await getDatabase();
    await database.execAsync(`
      DELETE FROM words_local;
      DELETE FROM word_categories;
      DELETE FROM user_words;
      DELETE FROM study_progress;
      DELETE FROM comments_local;
      UPDATE sync_status SET last_sync_at = 0, is_initial_sync = 0 WHERE id = 1;
    `);
    return await performInitialSync();
  } catch (error) {
    console.error('Force resync error:', error);
    return { success: false, message: '重新同步失败' };
  }
}
