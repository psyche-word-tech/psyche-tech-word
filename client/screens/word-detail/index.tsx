import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useSafeRouter, useSafeSearchParams } from '@/hooks/useSafeRouter';
import { Screen } from '@/components/Screen';

interface Word {
  id: number;
  word: string;
  phonetic: string;
  meaning: string;
}

export default function WordDetailPage() {
  const router = useSafeRouter();
  const params = useSafeSearchParams<{ word?: string }>();
  
  const word: Word | null = params.word ? JSON.parse(params.word) : null;

  if (!word) {
    return (
      <Screen>
        <View style={styles.container}>
          <Text style={styles.errorText}>单词不存在</Text>
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.backText}>← back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>单词详情</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Word Card */}
        <View style={styles.card}>
          <Text style={styles.wordText}>{word.word}</Text>
          <Text style={styles.phoneticText}>{word.phonetic}</Text>
        </View>

        {/* Meaning */}
        <View style={styles.meaningSection}>
          <Text style={styles.sectionTitle}>释义</Text>
          <Text style={styles.meaningText}>{word.meaning}</Text>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  backText: {
    fontSize: 16,
    color: '#666',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  placeholder: {
    width: 50,
  },
  card: {
    padding: 24,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  wordText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  phoneticText: {
    fontSize: 18,
    color: '#999',
  },
  meaningSection: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  meaningText: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
  },
  errorText: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    marginTop: 100,
  },
});
