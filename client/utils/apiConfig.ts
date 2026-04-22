// API 配置
// 直接使用生产环境地址

const PROD_API_URL = 'https://f2541e68-91d1-4805-97c9-3bf1e0126a01.dev.coze.site';

// 导出 API 地址（同步）
export const API_BASE_URL = PROD_API_URL;

// 导出 fetchApiConfig（兼容）
export const fetchApiConfig = async (): Promise<string> => {
  return PROD_API_URL;
};

// 导出 getApiUrl（兼容）
export const getApiUrl = (): string => {
  return PROD_API_URL;
};
