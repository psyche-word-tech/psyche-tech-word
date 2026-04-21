import { ExpoConfig, ConfigContext } from 'expo/config';

// 从环境变量或 .env 文件获取后端地址
const backendBaseUrl = process.env.EXPO_PUBLIC_BACKEND_BASE_URL || '';

const appName = process.env.COZE_PROJECT_NAME || process.env.EXPO_PUBLIC_COZE_PROJECT_NAME || '应用';
const projectId = process.env.COZE_PROJECT_ID || process.env.EXPO_PUBLIC_COZE_PROJECT_ID;
const slugAppName = projectId ? `app${projectId}` : 'myapp';

export default ({ config }: ConfigContext): ExpoConfig => {
  return {
    ...config,
    "name": appName,
    "slug": slugAppName,
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/images/icon.png",
    "scheme": "myapp",
    "userInterfaceStyle": "automatic",
    "newArchEnabled": true,
    "ios": {
      "supportsTablet": true
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/images/adaptive-icon.png",
        "backgroundColor": "#ffffff"
      },
      "package": `com.anonymous.x${projectId || '0'}`
    },
    "web": {
      "bundler": "metro",
      "output": "single",
      "favicon": "./assets/images/favicon.png"
    },
    // 关键：将后端地址注入到 extra 中，供运行时使用
    "extra": {
      ...config.extra,
      "backendBaseUrl": backendBaseUrl || 'https://f2541e68-91d1-4805-97c9-3bf1e0126a01.dev.coze.site'
    },
    "plugins": [
      'expo-router',
      [
        "expo-splash-screen",
        {
          "image": "./assets/images/splash-icon.png",
          "imageWidth": 200,
          "resizeMode": "contain",
          "backgroundColor": "#ffffff"
        }
      ],
      [
        "expo-image-picker",
        {
          "photosPermission": `允许单词记App访问您的相册，以便您上传或保存图片。`,
          "cameraPermission": `允许单词记App使用您的相机，以便您直接拍摄照片上传。`,
          "microphonePermission": `允许单词记App访问您的麦克风，以便您拍摄带有声音的视频。`
        }
      ],
      [
        "expo-location",
        {
          "locationWhenInUsePermission": `单词记App需要访问您的位置以提供周边服务及导航功能。`
        }
      ],
      [
        "expo-camera",
        {
          "cameraPermission": `单词记App需要相机以拍摄照片和视频。`,
          "microphonePermission": `单词记App需要麦克风以录制视频声音。`,
          "recordAudioAndroid": true
        }
      ],
      [
        "expo-font",
        {
          "fonts": ["./assets/fonts/TimesNewRoman.ttf"]
        }
      ]
    ],
    "experiments": {
      "typedRoutes": true
    }
  }
}
