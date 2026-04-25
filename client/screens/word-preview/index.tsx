import { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator } from 'react-native';
import { useSafeRouter } from '@/hooks/useSafeRouter';
import { Screen } from '@/components/Screen';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { API_BASE_URL } from '@/utils/apiConfig';

interface Word {
	id: number;
	word: string;
	phonetic: string;
	meaning: string;
	example?: string;
}

interface CategoryCount {
	words_x: number;
	words_y: number;
	words_z: number;
}

export default function WordPreviewPage() {
	const router = useSafeRouter();
	const [words, setWords] = useState<Word[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [categoryCounts, setCategoryCounts] = useState<CategoryCount>({
		words_x: 0,
		words_y: 0,
		words_z: 0,
	});

	// 获取词汇列表
	const fetchWords = useCallback(async () => {
		setIsLoading(true);
		try {
			const response = await fetch(`${API_BASE_URL}/api/v1/wordbooks/words_b`);
			const data = await response.json();
			if (Array.isArray(data)) {
				setWords(data);
			}
		} catch (error) {
			console.error('Failed to fetch words:', error);
		} finally {
			setIsLoading(false);
		}
	}, []);

	// 获取各分类数量
	const fetchCategoryCounts = useCallback(async () => {
		try {
			const [xRes, yRes, zRes] = await Promise.all([
				fetch(`${API_BASE_URL}/api/v1/user-words/category/words_x/count`),
				fetch(`${API_BASE_URL}/api/v1/user-words/category/words_y/count`),
				fetch(`${API_BASE_URL}/api/v1/user-words/category/words_z/count`),
			]);
			const [xData, yData, zData] = await Promise.all([
				xRes.json(),
				yRes.json(),
				zRes.json(),
			]);
			setCategoryCounts({
				words_x: xData.count || 0,
				words_y: yData.count || 0,
				words_z: zData.count || 0,
			});
		} catch (error) {
			console.error('Failed to fetch category counts:', error);
		}
	}, []);

	// 页面加载时获取数据
	useFocusEffect(
		useCallback(() => {
			fetchWords();
			fetchCategoryCounts();
		}, [fetchWords, fetchCategoryCounts])
	);

	// 跳转到单词详情
	const goToWordDetail = (word: Word) => {
		router.push('/word-detail', { word: JSON.stringify(word), table: 'words_b' });
	};

	// 渲染单词卡片
	const renderWordCard = ({ item }: { item: Word }) => (
		<TouchableOpacity style={styles.wordCard} onPress={() => goToWordDetail(item)}>
			<Text style={styles.wordText}>{item.word}</Text>
			<Text style={styles.phoneticText}>{item.phonetic}</Text>
			<Text style={styles.meaningText} numberOfLines={2}>{item.meaning}</Text>
		</TouchableOpacity>
	);

	return (
		<Screen>
			<View style={styles.container}>
				{/* Header */}
				<View style={styles.header}>
					<TouchableOpacity onPress={() => router.back()}>
						<Text style={styles.backText}>← Back</Text>
					</TouchableOpacity>
					<Text style={styles.headerTitle}>词汇预览</Text>
					<View style={styles.placeholder} />
				</View>

				{/* Word List */}
				{isLoading ? (
					<View style={styles.loadingContainer}>
						<ActivityIndicator size="large" color="#4F46E5" />
					</View>
				) : (
					<FlatList
						data={words}
						renderItem={renderWordCard}
						keyExtractor={(item) => item.id.toString()}
						numColumns={1}
						contentContainerStyle={styles.listContainer}
						showsVerticalScrollIndicator={false}
						ListEmptyComponent={
							<View style={styles.emptyContainer}>
								<Text style={styles.emptyText}>暂无词汇</Text>
							</View>
						}
					/>
				)}

				{/* Category Buttons */}
				<View style={styles.categorySection}>
					<TouchableOpacity 
						style={[styles.categoryButton, styles.knownButton]}
						onPress={() => router.push('/word-category', { table: 'words_x', name: '已会' })}
					>
						<Text style={styles.categoryLabel}>已会</Text>
						<View style={styles.countBadge}>
							<Text style={styles.countText}>{categoryCounts.words_x}</Text>
						</View>
						<Text style={styles.categoryHint}>(x)</Text>
					</TouchableOpacity>

					<TouchableOpacity 
						style={[styles.categoryButton, styles.vagueButton]}
						onPress={() => router.push('/word-category', { table: 'words_y', name: '模糊' })}
					>
						<Text style={styles.categoryLabel}>模糊</Text>
						<View style={styles.countBadge}>
							<Text style={styles.countText}>{categoryCounts.words_y}</Text>
						</View>
						<Text style={styles.categoryHint}>(?)</Text>
					</TouchableOpacity>

					<TouchableOpacity 
						style={[styles.categoryButton, styles.unknownButton]}
						onPress={() => router.push('/word-category', { table: 'words_z', name: '不会' })}
					>
						<Text style={styles.categoryLabel}>不会</Text>
						<View style={styles.countBadge}>
							<Text style={styles.countText}>{categoryCounts.words_z}</Text>
						</View>
						<Text style={styles.categoryHint}>(?)</Text>
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
		fontSize: 16,
		color: '#4F46E5',
	},
	headerTitle: {
		fontSize: 18,
		fontWeight: '600',
		color: '#333333',
	},
	placeholder: {
		width: 50,
	},
	loadingContainer: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
	},
	listContainer: {
		padding: 16,
		paddingBottom: 120,
	},
	wordCard: {
		backgroundColor: '#F5F5F5',
		borderRadius: 12,
		padding: 16,
		marginBottom: 12,
	},
	wordText: {
		fontSize: 20,
		fontWeight: '700',
		color: '#333333',
		marginBottom: 4,
	},
	phoneticText: {
		fontSize: 14,
		color: '#666666',
		marginBottom: 8,
	},
	meaningText: {
		fontSize: 14,
		color: '#999999',
		lineHeight: 20,
	},
	emptyContainer: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		paddingVertical: 60,
	},
	emptyText: {
		fontSize: 16,
		color: '#999999',
	},
	categorySection: {
		position: 'absolute',
		bottom: 0,
		left: 0,
		right: 0,
		flexDirection: 'row',
		justifyContent: 'space-around',
		paddingHorizontal: 16,
		paddingVertical: 16,
		backgroundColor: '#FFFFFF',
		borderTopWidth: 1,
		borderTopColor: '#E5E5E5',
		shadowColor: '#000',
		shadowOffset: { width: 0, height: -2 },
		shadowOpacity: 0.1,
		shadowRadius: 4,
		elevation: 5,
	},
	categoryButton: {
		alignItems: 'center',
		paddingVertical: 12,
		paddingHorizontal: 20,
		borderRadius: 12,
		minWidth: 90,
	},
	knownButton: {
		backgroundColor: '#4CAF50',
	},
	vagueButton: {
		backgroundColor: '#FF9800',
	},
	unknownButton: {
		backgroundColor: '#F44336',
	},
	categoryLabel: {
		fontSize: 14,
		fontWeight: '600',
		color: '#FFFFFF',
		marginBottom: 6,
	},
	countBadge: {
		backgroundColor: 'rgba(255,255,255,0.3)',
		borderRadius: 12,
		paddingHorizontal: 10,
		paddingVertical: 2,
		marginBottom: 4,
	},
	countText: {
		fontSize: 16,
		fontWeight: '700',
		color: '#FFFFFF',
	},
	categoryHint: {
		fontSize: 12,
		color: 'rgba(255,255,255,0.8)',
	},
});
