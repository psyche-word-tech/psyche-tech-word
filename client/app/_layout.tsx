import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { LogBox } from 'react-native';
import Toast from 'react-native-toast-message';
import { Provider } from '@/components/Provider';

import '../global.css';

LogBox.ignoreLogs([
  "TurboModuleRegistry.getEnforcing(...): 'RNMapsAirModule' could not be found",
]);

export default function RootLayout() {
  return (
    <Provider>
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
        <Stack.Screen name="word-detail" options={{ title: "" }} />
        <Stack.Screen name="known-words" options={{ title: "" }} />
      </Stack>
      <Toast />
    </Provider>
  );
}
