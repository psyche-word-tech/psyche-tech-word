import Constants from 'expo-constants';

// 线上生产环境地址（硬编码兜底，确保手机端永远可用）
const PROD_API_URL = 'https://word-voyage-api-production.up.railway.app';

function isValidApiUrl(url: string | undefined): url is string {
  return !!url && !url.includes('localhost') && !url.includes('railway.app');
}

// 强制使用有数据的后端地址，避免生产环境自动注入的空数据库域名
const API_BASE_URL = PROD_API_URL;

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
