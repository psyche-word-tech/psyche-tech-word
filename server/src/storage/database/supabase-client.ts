import { createClient, SupabaseClient } from '@supabase/supabase-js';
import path from 'path';
import { config as dotenvConfig } from 'dotenv';

let supabaseClientInstance: any = null;
let lastHealthCheck = 0;
let isHealthy = false;
let clientCreatedAt = 0;
const HEALTH_CHECK_INTERVAL = 30000; // 30秒
const DB_TIMEOUT = 60000;
const CLIENT_MAX_AGE = 300000; // 5分钟，超过自动重建

function loadEnv(): void {
  try {
    const dotenvPath = path.resolve(process.cwd(), '.env');
    dotenvConfig({ path: dotenvPath });
  } catch {
    // ignore
  }
}

function getSupabaseCredentials(): { url: string; anonKey: string } {
  loadEnv();

  const url = process.env.COZE_SUPABASE_URL;
  if (!url) {
    throw new Error('COZE_SUPABASE_URL is not set');
  }

  const anonKey = process.env.COZE_SUPABASE_ANON_KEY;
  if (!anonKey) {
    throw new Error('COZE_SUPABASE_ANON_KEY is not set');
  }

  return { url, anonKey };
}

function getSupabaseServiceRoleKey(): string | undefined {
  loadEnv();
  return process.env.COZE_SUPABASE_SERVICE_ROLE_KEY;
}

function createSupabaseClient(token?: string): SupabaseClient {
  const { url, anonKey } = getSupabaseCredentials();

  let key: string;
  if (token) {
    key = anonKey;
  } else {
    const serviceRoleKey = getSupabaseServiceRoleKey();
    key = serviceRoleKey ?? anonKey;
  }

  const commonOptions: any = {
    db: {
      schema: 'public',
    },
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
    global: {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    },
  };

  return createClient(url, key, commonOptions);
}

/**
 * 获取 Supabase 客户端（单例模式）
 * 如果连接断开，自动重新创建
 */
export function getSupabaseClient(token?: string): SupabaseClient {
  // 如果传入了 token，必须创建新实例（因为 token 不同）
  if (token) {
    return createSupabaseClient(token);
  }

  // 单例模式：复用同一个客户端实例
  const now = Date.now();
  if (!supabaseClientInstance || (now - clientCreatedAt > CLIENT_MAX_AGE)) {
    if (supabaseClientInstance && (now - clientCreatedAt > CLIENT_MAX_AGE)) {
      console.log('[Supabase] Client exceeded max age, recreating...');
    }
    console.log('[Supabase] Creating new client instance');
    supabaseClientInstance = createSupabaseClient();
    clientCreatedAt = now;
  }

  return supabaseClientInstance;
}

/**
 * 执行 Supabase 查询并自动处理连接断开重试
 * 当连接超时时，自动重置客户端并重试一次
 */
export async function queryWithRetry<T>(
  queryFn: (client: SupabaseClient) => Promise<{ data: T | null; error: any }>
): Promise<{ data: T | null; error: any }> {
  const client = getSupabaseClient();
  let result = await queryFn(client);

  // 如果出错且是连接问题，重置后重试一次
  if (result.error) {
    const errMsg = result.error.message || '';
    if (errMsg.includes('timeout') || errMsg.includes('Connection') || errMsg.includes('closed') || errMsg.includes('ECONNREFUSED')) {
      console.log('[Supabase] Connection lost, resetting and retrying...');
      resetSupabaseClient();
      const newClient = getSupabaseClient();
      result = await queryFn(newClient);
    }
  }

  return result;
}

/**
 * 检查数据库连接健康状态
 * 如果连接断开，会重置实例并重新创建
 */
export async function checkDatabaseHealth(): Promise<{ healthy: boolean; error?: string }> {
  const now = Date.now();

  // 如果在健康检查间隔内，直接返回缓存结果
  if (now - lastHealthCheck < HEALTH_CHECK_INTERVAL && isHealthy) {
    return { healthy: true };
  }

  try {
    const client = getSupabaseClient();
    const { data, error } = await client
      .from('wordbooks')
      .select('id')
      .limit(1)
      .abortSignal(AbortSignal.timeout(10000));

    if (error) {
      console.error('[Supabase] Health check failed:', error.message);
      // 重置实例，下次会重新创建
      supabaseClientInstance = null;
      isHealthy = false;
      lastHealthCheck = now;
      return { healthy: false, error: error.message };
    }

    isHealthy = true;
    lastHealthCheck = now;
    return { healthy: true };
  } catch (err: any) {
    console.error('[Supabase] Health check exception:', err.message);
    supabaseClientInstance = null;
    isHealthy = false;
    lastHealthCheck = now;
    return { healthy: false, error: err.message };
  }
}

/**
 * 强制重置 Supabase 客户端连接
 * 用于错误恢复场景
 */
export function resetSupabaseClient(): void {
  console.log('[Supabase] Resetting client instance');
  supabaseClientInstance = null;
  isHealthy = false;
  lastHealthCheck = 0;
  clientCreatedAt = 0;
}

/**
 * 初始化数据库连接保活
 * 定期执行健康检查，防止连接被数据库端断开
 */
export function startKeepAlive(intervalMs: number = 60000): NodeJS.Timeout {
  console.log(`[Supabase] Starting keep-alive with ${intervalMs}ms interval`);
  return setInterval(async () => {
    try {
      const result = await checkDatabaseHealth();
      if (!result.healthy) {
        console.warn('[Supabase] Keep-alive detected unhealthy connection, resetting...');
        resetSupabaseClient();
      }
    } catch (err) {
      console.error('[Supabase] Keep-alive error:', err);
    }
  }, intervalMs);
}

export { loadEnv, getSupabaseCredentials, getSupabaseServiceRoleKey };
