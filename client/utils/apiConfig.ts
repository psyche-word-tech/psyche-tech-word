// API 配置
// 在开发环境使用 localhost，在生产环境使用系统注入的环境变量

import Constants from 'expo-constants';

const getApiBaseUrl = (): string => {
  // 优先级1：使用 Expo Constants 中的 extra 配置（由部署平台注入）
  const extraUrl = Constants.expoConfig?.extra?.backendBaseUrl;
  if (extraUrl && typeof extraUrl === 'string' && extraUrl.length > 0) {
    return extraUrl;
  }
  
  // 优先级2：使用环境变量
  const envUrl = process.env.EXPO_PUBLIC_BACKEND_BASE_URL;
  if (envUrl && typeof envUrl === 'string' && envUrl.length > 0) {
    return envUrl;
  }
  
  // 兜底：开发环境使用 localhost（仅用于本地开发）
  // 注意：生产环境中 APP 无法访问 localhost
  console.warn('API_BASE_URL not configured, using localhost fallback');
  return 'http://localhost:9091';
};

export const API_BASE_URL = getApiBaseUrl();
