// API 配置
// 动态从后端获取 API 地址

const DEFAULT_API_URL = 'http://localhost:9091';

let cachedApiUrl: string | null = null;

// 从后端获取 API 配置（异步）
export const fetchApiConfig = async (): Promise<string> => {
  if (cachedApiUrl) {
    return cachedApiUrl;
  }
  
  // 尝试多个可能的地址
  const possibleUrls = [
    process.env.EXPO_PUBLIC_BACKEND_BASE_URL,
    DEFAULT_API_URL,
  ].filter(Boolean) as string[];

  for (const url of possibleUrls) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);
      
      const response = await fetch(`${url}/api/v1/config`, {
        method: 'GET',
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      
      if (response.ok) {
        const data = await response.json();
        if (data.apiBaseUrl) {
          cachedApiUrl = data.apiBaseUrl;
          return data.apiBaseUrl;
        }
      }
    } catch (e) {
      // 尝试下一个地址
      continue;
    }
  }
  
  // 所有尝试都失败，使用默认地址
  return DEFAULT_API_URL;
};

// 同步获取 API URL（使用缓存或环境变量）
export const getApiUrl = (): string => {
  if (cachedApiUrl) {
    return cachedApiUrl;
  }
  
  // 优先级1：环境变量
  const envUrl = process.env.EXPO_PUBLIC_BACKEND_BASE_URL;
  if (envUrl && envUrl.length > 0) {
    cachedApiUrl = envUrl;
    return envUrl;
  }
  
  // 兜底：返回默认地址
  return DEFAULT_API_URL;
};

// 兼容旧代码 - 同步返回
// 注意：在生产环境中，这个值可能不正确，需要先调用 fetchApiConfig
export const API_BASE_URL = getApiUrl();
