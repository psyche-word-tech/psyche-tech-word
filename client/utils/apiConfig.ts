import Constants from 'expo-constants';

// 优先从环境变量读取，其次从 expoConfig.extra 读取兜底地址
const envUrl = process.env.EXPO_PUBLIC_BACKEND_BASE_URL;
const extraUrl = (Constants.expoConfig?.extra as Record<string, string> | undefined)?.backendBaseUrl;

const API_BASE_URL = envUrl || extraUrl || 'http://localhost:9091';

console.log('[API_BASE_URL]', API_BASE_URL);

// 导出兼容函数
export const fetchApiConfig = async (): Promise<string> => {
  return API_BASE_URL;
};

export const getApiUrl = (): string => {
  return API_BASE_URL;
};

export { API_BASE_URL };
export default API_BASE_URL;
