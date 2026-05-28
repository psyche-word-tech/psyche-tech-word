import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { LogBox, View, Text, StyleSheet } from 'react-native';
import { Provider } from '@/components/Provider';
import { ApiConfigProvider } from '@/contexts/ApiConfigContext';
import { AuthProvider } from '@/contexts/AuthContext';
import AnimatedSplash from '@/components/AnimatedSplash';
import { useState, useEffect } from 'react';

LogBox.ignoreLogs([
  "TurboModuleRegistry.getEnforcing(...): 'RNMapsAirModule' could not be found",
]);

// 全局错误捕获，用于 APK 诊断
let globalErrorInfo = '';
const g = global as any;
if (typeof g !== 'undefined' && g.ErrorUtils) {
  const originalHandler = g.ErrorUtils.getGlobalHandler();
  g.ErrorUtils.setGlobalHandler((error: any, isFatal?: boolean) => {
    globalErrorInfo = `${isFatal ? 'FATAL' : 'ERROR'}: ${error?.message || String(error)}\n${error?.stack || ''}`;
    if (originalHandler) originalHandler(error, isFatal);
  });
}

export default function RootLayout() {
  const [diagnostics, setDiagnostics] = useState('JS loaded [BUILD v2025-05-29]. Waiting for splash...');

  useEffect(() => {
    setDiagnostics('RootLayout mounted. Splash should start soon.');
    const t1 = setTimeout(() => {
      setDiagnostics((prev) => prev + '\n[TIMEOUT] Splash not finished after 10s');
    }, 10000);
    return () => clearTimeout(t1);
  }, []);

  return (
    <ApiConfigProvider>
      <AuthProvider>
        <Provider>
          <AnimatedSplash onStatusChange={(status) => setDiagnostics(status)} />
          <StatusBar style="dark" />
          <Stack
          screenOptions={{
            animation: 'slide_from_right',
            gestureEnabled: true,
            gestureDirection: 'horizontal',
            headerShown: false
          }}
        >
          <Stack.Screen name="index" options={{ title: "" }} />
          <Stack.Screen name="study" options={{ title: "" }} />
          <Stack.Screen name="learn" options={{ title: "" }} />
          <Stack.Screen name="notebook" options={{ title: "" }} />
          <Stack.Screen name="engrave" options={{ title: "" }} />
          <Stack.Screen name="vocabulary" options={{ title: "" }} />
          <Stack.Screen name="purchase" options={{ title: "" }} />
          <Stack.Screen name="my-vocabulary" options={{ title: "" }} />
          <Stack.Screen name="word-list" options={{ title: "" }} />
          <Stack.Screen name="word-detail" options={{ title: "" }} />
			  <Stack.Screen name="word-preview" options={{ title: "" }} />
			  <Stack.Screen name="word-category" options={{ title: "" }} />
          <Stack.Screen name="known-words" options={{ title: "" }} />
          <Stack.Screen name="vague-words" options={{ title: "" }} />
          <Stack.Screen name="unknown-words" options={{ title: "" }} />
          <Stack.Screen name="profile" options={{ title: "" }} />
          <Stack.Screen name="settings" options={{ title: "" }} />
          <Stack.Screen name="login" options={{ title: "" }} />
          <Stack.Screen name="register" options={{ title: "" }} />
          <Stack.Screen name="sms-login" options={{ title: "" }} />
          <Stack.Screen name="calendar" options={{ title: "" }} />
          <Stack.Screen name="tree-diagram" options={{ title: "" }} />
          <Stack.Screen name="subcategory-words" options={{ title: "" }} />
          <Stack.Screen name="splash-preview" options={{ title: "" }} />
        </Stack>
        {/* APK 诊断层：始终显示在最上方，帮助定位启动问题 */}
        <View style={styles.debugOverlay} pointerEvents="none">
          <Text style={styles.debugText}>
            {globalErrorInfo ? `GLOBAL ERR:\n${globalErrorInfo}\n\n` : ''}
            {diagnostics}
          </Text>
        </View>
      </Provider>
      </AuthProvider>
    </ApiConfigProvider>
  );
}

const styles = StyleSheet.create({
  debugOverlay: {
    position: 'absolute',
    bottom: 40,
    left: 10,
    right: 10,
    backgroundColor: 'rgba(0,0,0,0.85)',
    padding: 10,
    borderRadius: 8,
    zIndex: 10000,
  },
  debugText: {
    color: '#00ff00',
    fontSize: 11,
    fontFamily: 'monospace',
  },
});
