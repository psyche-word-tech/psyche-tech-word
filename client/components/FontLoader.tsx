import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useFonts } from 'expo-font';
import { Slot } from 'expo-router';

export default function FontLoader({ children }: { children: React.ReactNode }) {
  const [fontsLoaded, fontError] = useFonts({
    'TimesNewRoman': require('@/assets/fonts/TimesNewRoman.ttf'),
  });

  if (!fontsLoaded && !fontError) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#000000" />
      </View>
    );
  }

  return <>{children}</>;
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
});
