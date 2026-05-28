import { API_BASE_URL } from './apiConfig';
import { getOfflineData } from './offlineData';

/**
 * 带超时、自动重试和离线 fallback 的 fetch 包装
 * - 超时: 15 秒
 * - 重试: 失败/502/504 时自动重试 2 次
 * - 离线: 后端不可用时自动返回预置的本地 JSON 数据
 */
export async function fetchWithRetry(
  path: string,
  options?: RequestInit,
  maxRetries = 2,
  baseUrl?: string
): Promise<Response> {
  const apiBase = baseUrl || API_BASE_URL;
  const url = path.startsWith('http') ? path : `${apiBase}${path}`;
  const timeout = 15000; // 15 秒超时

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      clearTimeout(timer);

      // 502/504 可能是 Railway 休眠中，需要重试
      if ((response.status === 502 || response.status === 504) && attempt < maxRetries) {
        console.log(`[fetchRetry] ${response.status} on attempt ${attempt + 1}, retrying...`);
        await sleep(2000 + attempt * 1000); // 递增延迟
        continue;
      }

      return response;
    } catch (err: any) {
      const isTimeout = err.name === 'AbortError';
      const isNetworkError = err.message?.includes('Network request failed');

      if ((isTimeout || isNetworkError) && attempt < maxRetries) {
        console.log(`[fetchRetry] ${isTimeout ? 'Timeout' : 'NetworkError'} on attempt ${attempt + 1}, retrying...`);
        await sleep(2000 + attempt * 1000);
        continue;
      }

      // 所有重试失败，尝试离线数据
      const offlineData = getOfflineData(path);
      if (offlineData !== null) {
        console.log(`[fetchRetry] Using offline data for ${path}`);
        return new Response(JSON.stringify(offlineData), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      throw err;
    }
  }

  // 兜底：尝试离线数据
  const offlineData = getOfflineData(path);
  if (offlineData !== null) {
    console.log(`[fetchRetry] Using offline data for ${path}`);
    return new Response(JSON.stringify(offlineData), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  throw new Error(`Request failed after ${maxRetries + 1} attempts`);
}

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
