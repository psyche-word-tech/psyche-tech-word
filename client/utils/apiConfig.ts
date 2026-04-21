// API 配置
// 在开发环境使用 localhost，在生产环境使用系统注入的环境变量

const getApiBaseUrl = (): string => {
  // 生产环境：使用系统注入的环境变量
  if (process.env.EXPO_PUBLIC_BACKEND_BASE_URL) {
    return process.env.EXPO_PUBLIC_BACKEND_BASE_URL;
  }
  
  // 开发环境：使用 localhost
  // 注意：移动端 APP 无法访问 localhost，需要使用实际 IP 地址
  // 这个值在本地开发时会被 dev_run.sh 中的环境变量覆盖
  return 'http://localhost:9091';
};

export const API_BASE_URL = getApiBaseUrl();
