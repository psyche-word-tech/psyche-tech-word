import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { FontAwesome6 } from '@expo/vector-icons';
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
      <View style={styles.container}>
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

          {/* Tagline */}
          <Text style={styles.tagline}>phantasia connects us</Text>
        </View>

        {/* Bottom Action Area */}
        <View style={styles.bottomAction}>
          {/* Settings Button - bottom left */}
          <TouchableOpacity 
            style={styles.settingsButton} 
            activeOpacity={0.7}
          >
            <FontAwesome6 name="gear" size={24} color="#333333" />
          </TouchableOpacity>
          
          {/* Next Button - bottom right */}
          <TouchableOpacity 
            style={styles.nextButton} 
            onPress={handleNext}
            activeOpacity={0.7}
          >
            <Text style={styles.nextText}>next</Text>
          </TouchableOpacity>
        </View>
      </View>
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
    paddingVertical: 24,
    alignItems: 'center',
  },
  headerText: {
    fontSize: 16,
    color: '#333333',
    fontFamily: 'serif',
    fontStyle: 'italic',
    letterSpacing: 3,
  },
  mainContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 40,
    paddingBottom: 20,
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 40,
  },
  logoImage: {
    width: 140,
    height: 140,
  },
  tagline: {
    fontSize: 11,
    color: '#666666',
    fontFamily: 'serif',
    fontStyle: 'italic',
    letterSpacing: 2,
    marginBottom: 20,
  },

  bottomAction: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: '#FFFFFF',
  },
  settingsButton: {
    padding: 10,
    backgroundColor: '#FFFFFF',
  },
  nextButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    backgroundColor: '#FFFFFF',
  },
  nextText: {
    fontSize: 11,
    color: '#333333',
    fontFamily: 'serif',
    fontStyle: 'italic',
    letterSpacing: 2,
  },
});
