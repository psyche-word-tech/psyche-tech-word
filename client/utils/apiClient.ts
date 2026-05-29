import { API_BASE_URL } from './apiConfig';
import { getOfflineDataAsync } from './offlineData';

/**
 * 带超时、自动重试和离线 fallback 的 fetch 包装
 * - 超时: 3 秒（缩短，减少等待）
 * - 重试: 仅对 502/504 重试 1 次
 * - 离线: 后端不可用时自动返回预置的本地 JSON 数据
 */
export async function fetchWithRetry(
  path: string,
  options?: RequestInit,
  maxRetries = 1,
  baseUrl?: string
): Promise<Response> {
  const apiBase = baseUrl || API_BASE_URL;
  const url = path.startsWith('http') ? path : `${apiBase}${path}`;
  const timeout = 3000; // 3 秒超时（加快 fallback）

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      clearTimeout(timer);

      // 502/504 可能是 Railway 休眠中，快速重试
      if ((response.status === 502 || response.status === 504) && attempt < maxRetries) {
        console.log(`[fetchRetry] ${response.status} on attempt ${attempt + 1}, retrying...`);
        await sleep(200 + attempt * 100); // 快速重试间隔
        continue;
      }

      // 非 2xx：尝试离线数据
      if (!response.ok) {
        const offlineData = await getOfflineDataAsync(path);
        if (offlineData !== null) {
          console.log(`[fetchRetry] ${response.status} -> offline data for ${path}`);
          return new Response(JSON.stringify(offlineData), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          });
        }
        throw new Error(`HTTP ${response.status}`);
      }

      // 后端返回 200 但 body 包含 error
      try {
        const clone = response.clone();
        const body = await clone.text();
        if (body.startsWith('{"error"') || body.startsWith('{"code"')) {
          const offlineData = await getOfflineDataAsync(path);
          if (offlineData !== null) {
            console.log(`[fetchRetry] Backend error -> offline data for ${path}`);
            return new Response(JSON.stringify(offlineData), {
              status: 200,
              headers: { 'Content-Type': 'application/json' },
            });
          }
        }
      } catch { /* ignore */ }

      return response;
    } catch (err: any) {
      const isTimeout = err.name === 'AbortError';
      const isNetworkError = err.message?.includes('Network request failed');

      if ((isTimeout || isNetworkError) && attempt < maxRetries) {
        console.log(`[fetchRetry] ${isTimeout ? 'Timeout' : 'NetworkError'} on attempt ${attempt + 1}, retrying...`);
        await sleep(500 + attempt * 300);
        continue;
      }

      // 所有重试失败，尝试离线数据
      const offlineData = await getOfflineDataAsync(path);
      if (offlineData !== null) {
        console.log(`[fetchRetry] All retries failed -> offline data for ${path}`);
        return new Response(JSON.stringify(offlineData), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      throw err;
    }
  }

  // 兜底：尝试离线数据
  const offlineData = await getOfflineDataAsync(path);
  if (offlineData !== null) {
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
