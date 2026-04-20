import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { LogBox } from 'react-native';
import Toast from 'react-native-toast-message';
import { Provider } from '@/components/Provider';
import FontLoader from '@/components/FontLoader';

import '../global.css';

LogBox.ignoreLogs([
  "TurboModuleRegistry.getEnforcing(...): 'RNMapsAirModule' could not be found",
]);

export default function RootLayout() {
  return (
    <FontLoader>
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
        </Stack>
        <Toast />
      </Provider>
    </FontLoader>
  );
}
