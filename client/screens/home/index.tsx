import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Image } from 'react-native';
import { Screen } from '@/components/Screen';
import { useSafeRouter } from '@/hooks/useSafeRouter';

const logo = require('@/assets/logo.png');

export default function HomeScreen() {
  const router = useSafeRouter();

  const handleNext = () => {
    router.replace('/study');
  };

  return (
    <Screen>
      <SafeAreaView style={styles.container}>
        {/* Top Header Bar */}
        <View style={styles.headerBar}>
          <Text style={styles.headerText}>welcome to</Text>
        </View>

        {/* Main Content Area */}
        <View style={styles.mainContent}>
          {/* Logo Image */}
          <View style={styles.logoContainer}>
            <Image 
              source={logo} 
              style={styles.logoImage}
              resizeMode="contain"
            />
          </View>

          {/* Brand Name */}
          {/* Tagline */}
          <Text style={styles.tagline}>phantasia connects us</Text>

          {/* Divider Line */}
          <View style={styles.dividerLine} />
        </View>

        {/* Bottom Action Area */}
        <View style={styles.bottomAction}>
          {/* Next Button - bottom right */}
          <TouchableOpacity 
            style={styles.nextButton} 
            onPress={handleNext}
            activeOpacity={0.7}
          >
            <Text style={styles.nextText}>next</Text>
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
  headerBar: {
    backgroundColor: '#F5F5F5',
    paddingVertical: 20,
    alignItems: 'center',
  },
  headerText: {
    fontSize: 18,
    color: '#444444',
    fontFamily: 'serif',
    fontStyle: 'italic',
    letterSpacing: 3,
  },
  mainContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 50,
    marginLeft: 20,
  },
  logoImage: {
    width: 180,
    height: 180,
  },
  brandName: {
    fontSize: 22,
    color: '#333333',
    fontWeight: '400',
    letterSpacing: 3,
    marginBottom: 12,
  },
  tagline: {
    fontSize: 13,
    color: '#666666',
    fontFamily: 'serif',
    fontStyle: 'italic',
    letterSpacing: 3,
    marginBottom: 10,
  },
  dividerLine: {
    width: 60,
    height: 1,
    backgroundColor: '#E0E0E0',
    marginTop: 20,
  },
  bottomAction: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 80,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'flex-end',
    paddingRight: 24,
    paddingBottom: 24,
  },
  nextButton: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#000000',
    backgroundColor: '#FFFFFF',
  },
  nextText: {
    fontSize: 13,
    color: '#333333',
    fontFamily: 'serif',
    fontStyle: 'italic',
    letterSpacing: 2,
  },
});
