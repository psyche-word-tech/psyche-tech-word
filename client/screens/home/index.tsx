import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, StatusBar } from 'react-native';
import { Screen } from '@/components/Screen';
import { useSafeRouter } from '@/hooks/useSafeRouter';

export default function HomeScreen() {
  const router = useSafeRouter();

  const handleNext = () => {
    router.replace('/study');
  };

  return (
    <Screen>
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" />
        
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.greeting}>welcome to</Text>
        </View>

        {/* Logo Icon - Geometric butterfly shape */}
        <View style={styles.logoContainer}>
          <View style={styles.logoIcon}>
            <View style={styles.logoTop}>
              <View style={[styles.wing, styles.wingLeft]} />
              <View style={[styles.wing, styles.wingRight]} />
            </View>
            <View style={styles.logoBottom}>
              <View style={[styles.wing, styles.wingLeftDown]} />
              <View style={[styles.wing, styles.wingRightDown]} />
            </View>
          </View>
        </View>

        {/* Brand Name */}
        <View style={styles.brandSection}>
          <View style={styles.divider} />
          <Text style={styles.brandName}>word mastery</Text>
          <View style={styles.divider} />
          <Text style={styles.brandTagline}>phantasia connects us</Text>
        </View>

        {/* Next Button with Arrow */}
        <View style={styles.actionContainer}>
          <View style={styles.arrowContainer}>
            <Text style={styles.arrow}>↓</Text>
          </View>
          <TouchableOpacity 
            style={styles.nextBtn} 
            onPress={handleNext}
            activeOpacity={0.7}
          >
            <Text style={styles.nextBtnText}>next</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    alignItems: 'center',
    marginTop: 80,
  },
  greeting: {
    fontSize: 18,
    color: '#000000',
    fontWeight: '300',
    letterSpacing: 3,
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: 60,
  },
  logoIcon: {
    width: 160,
    height: 160,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoTop: {
    flexDirection: 'row',
    marginBottom: -8,
  },
  logoBottom: {
    flexDirection: 'row',
    marginTop: -8,
  },
  wing: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
  },
  wingLeft: {
    borderRightWidth: 45,
    borderTopWidth: 45,
    borderRightColor: 'transparent',
    borderTopColor: '#000000',
    marginRight: 4,
    transform: [{ rotate: '-15deg' }],
  },
  wingRight: {
    borderLeftWidth: 45,
    borderTopWidth: 45,
    borderLeftColor: 'transparent',
    borderTopColor: '#000000',
    marginLeft: 4,
    transform: [{ rotate: '15deg' }],
  },
  wingLeftDown: {
    borderRightWidth: 45,
    borderBottomWidth: 45,
    borderRightColor: 'transparent',
    borderBottomColor: '#000000',
    marginRight: 4,
    transform: [{ rotate: '15deg' }],
  },
  wingRightDown: {
    borderLeftWidth: 45,
    borderBottomWidth: 45,
    borderLeftColor: 'transparent',
    borderBottomColor: '#000000',
    marginLeft: 4,
    transform: [{ rotate: '-15deg' }],
  },
  brandSection: {
    alignItems: 'center',
    marginTop: 60,
    paddingHorizontal: 40,
  },
  divider: {
    width: 80,
    height: 1,
    backgroundColor: '#E0E0E0',
    marginVertical: 16,
  },
  brandName: {
    fontSize: 24,
    color: '#000000',
    fontWeight: '400',
    letterSpacing: 4,
    textAlign: 'center',
  },
  brandTagline: {
    fontSize: 12,
    color: '#666666',
    fontWeight: '300',
    letterSpacing: 2,
    marginTop: 16,
  },
  actionContainer: {
    position: 'absolute',
    bottom: 60,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  arrowContainer: {
    marginBottom: 16,
  },
  arrow: {
    fontSize: 24,
    color: '#CC0000',
  },
  nextBtn: {
    paddingHorizontal: 40,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#000000',
  },
  nextBtnText: {
    fontSize: 14,
    color: '#000000',
    fontWeight: '400',
    letterSpacing: 2,
  },
});
