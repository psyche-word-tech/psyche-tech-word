import { View, Text } from 'react-native';
import { Screen } from '@/components/Screen';

export default function CalendarPage() {
  return (
    <Screen>
      <View className="flex-1 items-center justify-center bg-white">
        <Text className="text-lg text-gray-500">日历页面</Text>
      </View>
    </Screen>
  );
}
