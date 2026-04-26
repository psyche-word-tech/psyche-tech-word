import Constants from 'expo-constants';

// 线上生产环境地址（硬编码兜底，确保手机端永远可用）
const PROD_API_URL = 'https://f2541e68-91d1-4805-97c9-3bf1e0126a01.dev.coze.site';

function isValidApiUrl(url: string | undefined): url is string {
  return !!url && !url.includes('localhost') && !url.includes('railway.app');
}

// 优先从环境变量读取，过滤掉明显错误的地址，其次从 expoConfig.extra 读取，最后使用硬编码兜底
const envUrl = process.env.EXPO_PUBLIC_BACKEND_BASE_URL;
const extraUrl = (Constants.expoConfig?.extra as Record<string, string> | undefined)?.backendBaseUrl;

const API_BASE_URL = isValidApiUrl(envUrl) ? envUrl : isValidApiUrl(extraUrl) ? extraUrl : PROD_API_URL;

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
