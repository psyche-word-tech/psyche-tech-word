import { View, Text, StyleSheet, TouchableOpacity, TextInput, Image } from 'react-native';
import { Screen } from '@/components/Screen';
import { useSafeRouter } from '@/hooks/useSafeRouter';
import { useState } from 'react';

const logo = require('@/assets/logo.png');

export default function LoginPage() {
  const router = useSafeRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = () => {
    if (username.trim() && password.trim()) {
      router.replace('/study');
    }
  };

  return (
    <Screen>
      <View style={styles.container}>
        {/* Top Header Bar */}
        <View style={styles.headerBar}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.backText}>← back</Text>
          </TouchableOpacity>
        </View>

        {/* Login Form */}
        <View style={styles.formContainer}>
          <Image 
            source={logo} 
            style={styles.logoImage}
            resizeMode="contain"
          />
          
          <Text style={styles.title}>登录</Text>
          
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="用户名"
              placeholderTextColor="#999999"
              value={username}
              onChangeText={setUsername}
            />
          </View>
          
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="密码"
              placeholderTextColor="#999999"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>
          
          <TouchableOpacity 
            style={styles.loginButton}
            onPress={handleLogin}
          >
            <Text style={styles.loginText}>登录</Text>
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
    padding: 20,
    backgroundColor: '#F5F5F5',
  },
  backText: {
    fontSize: 14,
    color: '#666666',
    fontFamily: 'serif',
  },
  formContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  logoImage: {
    width: 80,
    height: 80,
    marginBottom: 30,
  },
  title: {
    fontSize: 20,
    color: '#333333',
    fontFamily: 'serif',
    fontWeight: '600',
    marginBottom: 30,
  },
  inputContainer: {
    width: '100%',
    marginBottom: 16,
  },
  input: {
    width: '100%',
    padding: 14,
    fontSize: 14,
    fontFamily: 'serif',
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
  },
  loginButton: {
    width: '100%',
    padding: 14,
    backgroundColor: '#333333',
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  loginText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontFamily: 'serif',
    fontWeight: '600',
  },
});
