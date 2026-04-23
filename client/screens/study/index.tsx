import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { Screen } from '@/components/Screen';
import { useSafeRouter } from '@/hooks/useSafeRouter';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function StudyScreen() {
  const router = useSafeRouter();

  return (
    <Screen safeAreaEdges={[]}>
      <View style={styles.container}>
        {/* 上半部分：刻字区域 */}
        <TouchableOpacity 
          style={styles.topCard} 
          activeOpacity={0.9} 
          onPress={() => router.push('/engrave')}
        >
          <View style={styles.labelContainer}>
            <Text style={styles.topLabel}>刻字</Text>
          </View>
        </TouchableOpacity>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topCard: {
    height: '100%',
    width: '100%',
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  labelContainer: {
    alignItems: 'center',
  },
  topLabel: {
    fontSize: 16,
    color: '#333333',
    fontWeight: '500',
    letterSpacing: 2,
  },
});
