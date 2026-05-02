import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useSafeRouter, useSafeSearchParams } from '@/hooks/useSafeRouter';
import { Screen } from '@/components/Screen';

interface WordDetail {
  id: number;
  word: string;
  phonetic: string | null;
  meaning: string | null;
  example_sentence: string | null;
}

export default function WordDetailPage() {
  const router = useSafeRouter();
  const { id } = useSafeSearchParams<{ id: number }>();

  const [detail, setDetail] = useState<WordDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    let cancelled = false;

    /**
     * 服务端文件：server/src/routes/user-words.ts 或 wordbooks.ts
     * 接口：GET /api/v1/wordbooks/:table/:id （获取单个单词详情）
     */
    const fetchDetail = async () => {
      // 先尝试从 words_b 表获取
      try {
        const res = await fetch(
          `${process.env.EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/wordbooks/words_b/${id}`
        );
        if (!cancelled && res.ok) {
          const data = await res.json();
          setDetail(data);
          setLoading(false);
          return;
        }
      } catch (e) {
        if (!cancelled) console.error('fetchWordDetail error:', e);
      }

      // 如果失败，尝试 user-words 接口
      try {
        const res2 = await fetch(
          `${process.env.EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/user-words/${id}`
        );
        if (!cancelled && res2.ok) {
          const data = await res2.json();
          setDetail(data);
        }
      } catch (e) {
        if (!cancelled) console.error('fetchWordDetail error:', e);
      }
      if (!cancelled) setLoading(false);
    };

    fetchDetail();

    return () => { cancelled = true; };
  }, [id]);

  return (
    <Screen>
      {/* 头部 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={8}>
          <Text style={styles.backText}>← 返回</Text>
        </TouchableOpacity>
        <Text style={styles.titleText}>单词详情</Text>
        <View style={{ width: 60 }} />
      </View>

      {/* 内容 */}
      {loading ? (
        <View style={styles.centerArea}>
          <Text style={styles.loadingText}>加载中...</Text>
        </View>
      ) : detail ? (
        <View style={styles.content}>
          {/* 单词大卡片 */}
          <View style={styles.wordCard}>
            <Text style={styles.wordText}>{detail.word}</Text>
            {detail.phonetic ? (
              <Text style={styles.phoneticText}>{detail.phonetic}</Text>
            ) : null}
          </View>

          {/* 释义 */}
          {detail.meaning ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>释义</Text>
              <Text style={styles.sectionContent}>{detail.meaning}</Text>
            </View>
          ) : null}

          {/* 例句 */}
          {detail.example_sentence ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>例句</Text>
              <Text style={styles.exampleText}>{detail.example_sentence}</Text>
            </View>
          ) : null}
        </View>
      ) : (
        <View style={styles.centerArea}>
          <Text style={styles.loadingText}>未找到单词信息</Text>
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backText: {
    fontSize: 16,
    color: '#4F46E5',
    fontWeight: '500',
  },
  titleText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  centerArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#9CA3AF',
    fontSize: 16,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  wordCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingVertical: 32,
    paddingHorizontal: 28,
    alignItems: 'center',

    borderWidth: 1.5,
    borderColor: '#E5E7EB',

    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 6,

    marginBottom: 28,
  },
  wordText: {
    fontSize: 36,
    fontWeight: '800',
    color: '#1F2937',
    letterSpacing: 0.5,
  },
  phoneticText: {
    fontSize: 18,
    color: '#6B7280',
    marginTop: 8,
    fontStyle: 'italic',
  },
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 18,
    marginBottom: 16,

    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#9CA3AF',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
  },
  sectionContent: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    lineHeight: 28,
  },
  exampleText: {
    fontSize: 17,
    color: '#4B5563',
    lineHeight: 28,
    fontStyle: 'italic',
  },
});
