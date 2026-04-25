// API 配置
// 使用 EXPO_PUBLIC_BACKEND_BASE_URL（web端为可访问域名，native端可配合代理）
const API_BASE_URL = process.env.EXPO_PUBLIC_BACKEND_BASE_URL || 'http://localhost:9091';

// 导出兼容函数
export const fetchApiConfig = async (): Promise<string> => {
  return API_BASE_URL;
};

export const getApiUrl = (): string => {
  return API_BASE_URL;
};

export { API_BASE_URL };
export default API_BASE_URL;
