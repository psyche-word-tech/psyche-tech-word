// API 配置

// 使用相对路径（配合代理）
// Metro代理会将 /api/* 请求转发到 http://localhost:9091
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:9091/api';

// 导出兼容函数
export const fetchApiConfig = async (): Promise<string> => {
  return API_BASE_URL;
};

export const getApiUrl = (): string => {
  return API_BASE_URL;
};

export { API_BASE_URL };
export default API_BASE_URL;
