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

  const handleSmsLogin = () => {
    router.push('/sms-login');
  };

  const handleRegister = () => {
    router.push('/register');
  };

  return (
    <Screen>
      <View style={styles.container}>
        {/* Top Header Bar */}
        <View style={styles.headerBar}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.backText}>← 返回</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>密码登录</Text>
          <View style={styles.headerRight} />
        </View>

        {/* Login Form */}
        <View style={styles.formContainer}>
          <Image 
            source={logo} 
            style={styles.logoImage}
            resizeMode="contain"
          />
          
          {/* Username Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>用户名 / 手机号</Text>
            <TextInput
              style={styles.input}
              placeholder="请输入用户名或手机号"
              placeholderTextColor="#999999"
              value={username}
              onChangeText={setUsername}
            />
          </View>
          
          {/* Password Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>密码</Text>
            <TextInput
              style={styles.input}
              placeholder="请输入密码"
              placeholderTextColor="#999999"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>
          
          {/* Login Button */}
          <TouchableOpacity 
            style={styles.loginButton}
            onPress={handleLogin}
          >
            <Text style={styles.loginText}>登录</Text>
          </TouchableOpacity>

          {/* SMS Login Link */}
          <TouchableOpacity 
            style={styles.switchButton}
            onPress={handleSmsLogin}
          >
            <Text style={styles.switchText}>短信验证码登录</Text>
          </TouchableOpacity>

          {/* Register Link */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>还没有账号？</Text>
            <TouchableOpacity onPress={handleRegister}>
              <Text style={styles.linkText}>立即注册</Text>
            </TouchableOpacity>
          </View>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F5F5F5',
  },
  backText: {
    fontSize: 14,
    color: '#666666',
    fontFamily: 'serif',
  },
  headerTitle: {
    fontSize: 16,
    color: '#333333',
    fontFamily: 'serif',
    fontWeight: '600',
  },
  headerRight: {
    width: 50,
  },
  formContainer: {
    flex: 1,
    paddingHorizontal: 30,
    paddingTop: 20,
  },
  logoImage: {
    width: 60,
    height: 60,
    alignSelf: 'center',
    marginBottom: 30,
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    color: '#666666',
    fontFamily: 'serif',
    marginBottom: 8,
  },
  input: {
    padding: 14,
    fontSize: 14,
    fontFamily: 'serif',
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
  },
  loginButton: {
    padding: 16,
    backgroundColor: '#333333',
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  loginText: {
    fontSize: 15,
    color: '#FFFFFF',
    fontFamily: 'serif',
    fontWeight: '600',
  },
  switchButton: {
    alignSelf: 'center',
    marginTop: 20,
    padding: 8,
  },
  switchText: {
    fontSize: 13,
    color: '#666666',
    fontFamily: 'serif',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 30,
  },
  footerText: {
    fontSize: 13,
    color: '#999999',
    fontFamily: 'serif',
  },
  linkText: {
    fontSize: 13,
    color: '#333333',
    fontFamily: 'serif',
    fontWeight: '600',
    marginLeft: 4,
  },
});
