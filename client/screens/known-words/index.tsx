import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { useSafeRouter } from '@/hooks/useSafeRouter';
import { Screen } from '@/components/Screen';
import { useFocusEffect } from 'expo-router';
import { useCallback } from 'react';

interface Word {
	id: number;
	word: string;
	phonetic?: string;
	meaning: string;
	example?: string;
	translation?: string;
}

export default function KnownWordsPage() {
	const router = useSafeRouter();
	const [knownWords, setKnownWords] = useState<Word[]>([]);
	const [loading, setLoading] = useState(true);

	// 页面返回时自动刷新数据
	useFocusEffect(
		useCallback(() => {
			fetchKnownWords();
		}, [])
	);

	const fetchKnownWords = async () => {
		try {
			setLoading(true);
			/**
			 * 服务端文件：server/src/routes/wordbooks.ts
			 * 接口：GET /api/v1/wordbooks/words_x
			 */
			const response = await fetch(`${process.env.EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/wordbooks/words_x`);
			const data = await response.json();
			setKnownWords(Array.isArray(data) ? data : []);
		} catch (error) {
			console.error('Failed to fetch known words:', error);
		} finally {
			setLoading(false);
		}
	};

	const handleWordPress = (word: Word) => {
		router.push('/word-detail', { 
			word: JSON.stringify({
				id: word.id,
				word: word.word,
				phonetic: word.phonetic || '',
				meaning: word.meaning,
				example: word.example || '',
				translation: word.translation || ''
			}),
			table: 'words_x'
		});
	};

	const renderItem = ({ item }: { item: Word }) => (
		<TouchableOpacity 
			style={styles.wordItem}
			onPress={() => handleWordPress(item)}
		>
			<View style={styles.wordHeader}>
				<Text style={styles.wordText}>{item.word}</Text>
				<Text style={styles.phoneticText}>{item.phonetic}</Text>
			</View>
			<Text style={styles.meaningText} numberOfLines={2}>{item.meaning}</Text>
		</TouchableOpacity>
	);

	return (
		<Screen>
			<View style={styles.container}>
				{/* Header */}
				<View style={styles.header}>
					<TouchableOpacity onPress={() => router.back()}>
						<Text style={styles.backText}>← back</Text>
					</TouchableOpacity>
					<Text style={styles.title}>已会单词</Text>
					<View style={styles.placeholder} />
				</View>

				{/* Stats */}
				<View style={styles.statsBar}>
					<Text style={styles.statsText}>共 {knownWords.length} 个单词</Text>
				</View>

				{/* Word List */}
				{loading ? (
					<View style={styles.loadingContainer}>
						<Text style={styles.loadingText}>加载中...</Text>
					</View>
				) : knownWords.length === 0 ? (
					<View style={styles.emptyContainer}>
						<Text style={styles.emptyText}>暂无已会单词</Text>
					</View>
				) : (
					<FlatList
						data={knownWords}
						renderItem={renderItem}
						keyExtractor={item => item.id.toString()}
						contentContainerStyle={styles.listContent}
						showsVerticalScrollIndicator={false}
					/>
				)}
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
		borderBottomColor: '#E5E5E5',
	},
	backText: {
		fontSize: 14,
		color: '#000000',
		fontFamily: 'serif',
	},
	title: {
		fontSize: 16,
		fontWeight: 'bold',
		color: '#000000',
		fontFamily: 'serif',
	},
	placeholder: {
		width: 50,
	},
	statsBar: {
		paddingHorizontal: 16,
		paddingVertical: 8,
		backgroundColor: '#F0F0F0',
	},
	statsText: {
		fontSize: 12,
		color: '#666666',
		fontFamily: 'serif',
	},
	loadingContainer: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
	},
	loadingText: {
		fontSize: 14,
		color: '#999999',
		fontFamily: 'serif',
	},
	emptyContainer: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
	},
	emptyText: {
		fontSize: 14,
		color: '#999999',
		fontFamily: 'serif',
	},
	listContent: {
		padding: 16,
	},
	wordItem: {
		paddingVertical: 12,
		borderBottomWidth: 1,
		borderBottomColor: '#E5E5E5',
	},
	wordHeader: {
		flexDirection: 'row',
		alignItems: 'baseline',
		marginBottom: 4,
	},
	wordText: {
		fontSize: 18,
		fontWeight: 'bold',
		color: '#000000',
		fontFamily: 'serif',
		marginRight: 8,
	},
	phoneticText: {
		fontSize: 14,
		color: '#999999',
		fontFamily: 'serif',
	},
	meaningText: {
		fontSize: 14,
		color: '#333333',
		fontFamily: 'serif',
		lineHeight: 20,
	},
});
