import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { useSafeRouter } from '@/hooks/useSafeRouter';
import { Screen } from '@/components/Screen';

interface Word {
	id: number;
	word: string;
	meaning: string;
}

export default function VagueWordsPage() {
	const router = useSafeRouter();
	const [vagueWords, setVagueWords] = useState<Word[]>([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		fetchVagueWords();
	}, []);

	const fetchVagueWords = async () => {
		try {
			setLoading(true);
			const response = await fetch(`${process.env.EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/words`);
			const result = await response.json();
			
			if (result.data) {
				const allWords = result.data as Word[];
				// 从后端获取模糊状态的单词ID
				const vagueWordIds: number[] = [];
				for (const word of allWords) {
					const statusRes = await fetch(`${process.env.EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/words/${word.id}/status`);
					const statusData = await statusRes.json();
					if (statusData.data?.status === 'y') {
						vagueWordIds.push(word.id);
					}
				}
				setVagueWords(allWords.filter(w => vagueWordIds.includes(w.id)));
			}
		} catch (error) {
			console.error('Failed to fetch vague words:', error);
		} finally {
			setLoading(false);
		}
	};

	const handleWordPress = (word: Word) => {
		router.push('/word-detail', { wordId: word.id, word: word.word, meaning: word.meaning });
	};

	return (
		<Screen>
			<View style={styles.container}>
				{/* Header */}
				<View style={styles.header}>
					<TouchableOpacity onPress={() => router.back()}>
						<Text style={styles.backText}>← back</Text>
					</TouchableOpacity>
					<Text style={styles.title}>模糊单词</Text>
					<View style={styles.placeholder} />
				</View>

				{/* Stats */}
				<View style={styles.statsContainer}>
					<Text style={styles.statsText}>共 {vagueWords.length} 个模糊单词</Text>
				</View>

				{/* Word List */}
				{loading ? (
					<View style={styles.loadingContainer}>
						<Text style={styles.loadingText}>加载中...</Text>
					</View>
				) : vagueWords.length > 0 ? (
					<FlatList
						data={vagueWords}
						keyExtractor={(item) => item.id.toString()}
						contentContainerStyle={styles.listContent}
						renderItem={({ item }) => (
							<TouchableOpacity 
								style={styles.wordItem}
								onPress={() => handleWordPress(item)}
							>
								<View style={styles.wordLeft}>
									<Text style={styles.wordText}>{item.word}</Text>
								</View>
								<View style={styles.wordRight}>
									<Text style={styles.meaningText}>{item.meaning}</Text>
								</View>
							</TouchableOpacity>
						)}
					/>
				) : (
					<View style={styles.emptyContainer}>
						<Text style={styles.emptyText}>暂无模糊单词</Text>
						<Text style={styles.emptyHint}>将单词拖入&quot;模糊&quot;分类即可添加</Text>
					</View>
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
		justifyContent: 'space-between',
		alignItems: 'center',
		padding: 20,
		backgroundColor: '#E5E5E5',
	},
	backText: {
		fontSize: 14,
		color: '#000000',
		fontFamily: 'serif',
	},
	title: {
		fontSize: 16,
		color: '#333333',
		fontFamily: 'serif',
		fontWeight: '600',
	},
	placeholder: {
		width: 50,
	},
	statsContainer: {
		padding: 20,
		backgroundColor: '#F8F8F8',
		borderBottomWidth: 1,
		borderBottomColor: '#E0E0E0',
	},
	statsText: {
		fontSize: 14,
		color: '#666666',
		fontFamily: 'serif',
	},
	listContent: {
		padding: 20,
	},
	wordItem: {
		backgroundColor: '#F5F5F5',
		paddingHorizontal: 20,
		paddingVertical: 18,
		borderRadius: 8,
		marginBottom: 12,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
	},
	wordLeft: {
		flex: 1,
	},
	wordText: {
		fontSize: 18,
		color: '#333333',
		fontFamily: 'serif',
		fontWeight: '600',
	},
	wordRight: {
		flex: 2,
		marginLeft: 15,
	},
	meaningText: {
		fontSize: 14,
		color: '#666666',
		fontFamily: 'serif',
		textAlign: 'right',
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
		padding: 40,
	},
	emptyText: {
		fontSize: 16,
		color: '#999999',
		fontFamily: 'serif',
		marginBottom: 10,
	},
	emptyHint: {
		fontSize: 12,
		color: '#CCCCCC',
		fontFamily: 'serif',
	},
});
