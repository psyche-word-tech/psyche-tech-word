import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { performInitialSync, forceResync } from '@/utils/syncService';
import { needsInitialSync, getSyncStatus } from '@/utils/localDatabase';

interface SyncModalProps {
  visible: boolean;
  onClose: () => void;
  onSyncComplete: () => void;
}

export default function SyncModal({ visible, onClose, onSyncComplete }: SyncModalProps) {
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<{ success: boolean; message: string } | null>(null);
  const [progress] = useState(new Animated.Value(0));

  const handleSync = async () => {
    setSyncing(true);
    setSyncResult(null);

    Animated.timing(progress, {
      toValue: 1,
      duration: 3000,
      useNativeDriver: false,
    }).start();

    const result = await performInitialSync();
    setSyncing(false);
    setSyncResult(result);

    if (result.success) {
      setTimeout(() => {
        onSyncComplete();
        onClose();
      }, 1500);
    }
  };

  const handleRetry = async () => {
    setSyncResult(null);
    setSyncing(true);

    Animated.timing(progress, {
      toValue: 1,
      duration: 3000,
      useNativeDriver: false,
    }).start();

    const result = await forceResync();
    setSyncing(false);
    setSyncResult(result);

    if (result.success) {
      setTimeout(() => {
        onSyncComplete();
        onClose();
      }, 1500);
    }
  };

  const handleSkip = () => {
    onClose();
  };

  useEffect(() => {
    if (visible && !syncing && !syncResult) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      handleSync();
    }
  }, [visible]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleSkip}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          <Text style={styles.title}>数据同步</Text>
          <Text style={styles.subtitle}>首次使用需要同步单词数据到本地，断网后也能继续学习</Text>

          {syncing && (
            <View style={styles.syncingContainer}>
              <ActivityIndicator size="large" color="#4CAF50" />
              <Text style={styles.syncingText}>正在同步数据...</Text>
              <View style={styles.progressBarContainer}>
                <Animated.View
                  style={[
                    styles.progressBar,
                    {
                      width: progress.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['0%', '100%'],
                      }),
                    },
                  ]}
                />
              </View>
            </View>
          )}

          {syncResult && (
            <View style={styles.resultContainer}>
              <Text
                style={[
                  styles.resultText,
                  syncResult.success ? styles.successText : styles.errorText,
                ]}
              >
                {syncResult.success ? '✓' : '✗'} {syncResult.message}
              </Text>
              {!syncResult.success && (
                <View style={styles.buttonRow}>
                  <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
                    <Text style={styles.retryButtonText}>重试</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
                    <Text style={styles.skipButtonText}>跳过</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}

          {!syncing && !syncResult && (
            <TouchableOpacity style={styles.syncButton} onPress={handleSync}>
              <Text style={styles.syncButtonText}>开始同步</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 360,
    alignItems: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  syncingContainer: {
    alignItems: 'center',
    width: '100%',
  },
  syncingText: {
    fontSize: 16,
    color: '#333333',
    marginTop: 16,
    marginBottom: 16,
  },
  progressBarContainer: {
    width: '100%',
    height: 6,
    backgroundColor: '#E0E0E0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 3,
  },
  resultContainer: {
    alignItems: 'center',
    width: '100%',
  },
  resultText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  successText: {
    color: '#4CAF50',
  },
  errorText: {
    color: '#F44336',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  retryButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  skipButton: {
    backgroundColor: '#F5F5F5',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  skipButtonText: {
    color: '#666666',
    fontSize: 16,
  },
  syncButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
  },
  syncButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
