import { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
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
}

export default function WordPreviewPage() {
	const router = useSafeRouter();
	const [words, setWords] = useState<Word[]>([]);
	const [categoryCounts, setCategoryCounts] = useState({ x: 0, y: 0, z: 0 });
	const [refreshKey, setRefreshKey] = useState(0);

	// 获取词汇列表
	const fetchWords = useCallback(async () => {
		try {
			const response = await fetch(`${API_BASE_URL}/api/v1/user-words/category/words_b`);
			const data = await response.json();
			console.log('Fetched words:', Array.isArray(data) ? data.length : 0);
			if (Array.isArray(data)) {
				setWords(data);
			}
		} catch (error) {
			console.error('Failed to fetch words:', error);
		}
	}, []);

	// 获取分类数量
	const fetchCategoryCounts = useCallback(async () => {
		try {
			const [xRes, yRes, zRes] = await Promise.all([
				fetch(`${API_BASE_URL}/api/v1/user-words/category/words_x/count`),
				fetch(`${API_BASE_URL}/api/v1/user-words/category/words_y/count`),
				fetch(`${API_BASE_URL}/api/v1/user-words/category/words_z/count`),
			]);
			const [xData, yData, zData] = await Promise.all([xRes.json(), yRes.json(), zRes.json()]);
			setCategoryCounts({
				x: xData.count || 0,
				y: yData.count || 0,
				z: zData.count || 0,
			});
		} catch (error) {
			console.error('Failed to fetch category counts:', error);
		}
	}, []);

	// 页面加载时获取数据（每次进入页面都重新获取）
	useFocusEffect(
		useCallback(() => {
			console.log('Page focused, refreshing data...');
			fetchWords();
			fetchCategoryCounts();
		}, [fetchWords, fetchCategoryCounts, refreshKey])
	);

	// 移动单词到分类
	const moveWord = useCallback(async (word: Word, targetTable: string, status: string) => {
		try {
			/**
			 * 服务端文件：server/src/routes/user-words.ts
			 * 接口：POST /api/v1/user-words/move
			 * Body参数：wordId: number, targetTable: string
			 */
			const response = await fetch(`${API_BASE_URL}/api/v1/user-words/move`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					wordId: word.id,
					targetTable: targetTable
				})
			});

			const result = await response.json();

			if (!response.ok) {
				throw new Error(result.error || '移动失败');
			}

			// 从列表中移除
			setWords(prev => prev.filter(w => w.id !== word.id));
			
			// 更新分类数量
			fetchCategoryCounts();

			// 强制刷新列表
			setRefreshKey(prev => prev + 1);

		} catch (error) {
			console.error('Failed to move word:', error);
			Alert.alert('错误', '移动失败，请重试');
		}
	}, [fetchCategoryCounts]);

	// 显示分类确认
	const showCategoryOptions = (word: Word) => {
		Alert.alert(
			`分类: ${word.word}`,
			'选择将这个单词分类到哪个组',
			[
				{
					text: '已会',
					onPress: () => moveWord(word, 'words_x', '已会'),
					style: 'default'
				},
				{
					text: '模糊',
					onPress: () => moveWord(word, 'words_y', '模糊'),
					style: 'default'
				},
				{
					text: '不会',
					onPress: () => moveWord(word, 'words_z', '不会'),
					style: 'default'
				},
				{
					text: '取消',
					style: 'cancel'
				},
			]
		);
	};

	// 渲染单词项
	const renderItem = ({ item }: { item: Word }) => (
		<View style={styles.wordItem}>
			<View style={styles.wordInfo}>
				<Text style={styles.wordText}>{item.word}</Text>
				<Text style={styles.phoneticText}>{item.phonetic}</Text>
			</View>
			<Text style={styles.meaningText} numberOfLines={2}>{item.meaning}</Text>
			
			{/* 分类按钮组 */}
			<View style={styles.categoryButtons}>
				<TouchableOpacity 
					style={[styles.categoryBtn, styles.knownBtn]}
					onPress={() => moveWord(item, 'words_x', '已会')}
				>
					<Text style={styles.categoryBtnText}>已会</Text>
				</TouchableOpacity>
				<TouchableOpacity 
					style={[styles.categoryBtn, styles.vagueBtn]}
					onPress={() => moveWord(item, 'words_y', '模糊')}
				>
					<Text style={styles.categoryBtnText}>模糊</Text>
				</TouchableOpacity>
				<TouchableOpacity 
					style={[styles.categoryBtn, styles.unknownBtn]}
					onPress={() => moveWord(item, 'words_z', '不会')}
				>
					<Text style={styles.categoryBtnText}>不会</Text>
				</TouchableOpacity>
			</View>
		</View>
	);

	return (
		<Screen>
			<View style={styles.container}>
				{/* Header */}
				<View style={styles.header}>
					<Text style={styles.headerTitle}>词汇预览</Text>
					<Text style={styles.headerCount}>{words.length} 个单词待分类</Text>
				</View>

				{/* Word List */}
				<FlatList
					data={words}
					renderItem={renderItem}
					keyExtractor={(item) => item.id.toString()}
					contentContainerStyle={styles.listContent}
					showsVerticalScrollIndicator={false}
					ListEmptyComponent={
						<View style={styles.emptyContainer}>
							<Text style={styles.emptyText}>所有单词已分类完成！</Text>
						</View>
					}
				/>

				{/* Category Summary */}
				<View style={styles.categorySummary}>
					<View style={[styles.categoryItem, styles.knownItem]}>
						<Text style={styles.categoryLabel}>已会</Text>
						<Text style={styles.categoryCount}>{categoryCounts.x}</Text>
					</View>
					<View style={[styles.categoryItem, styles.vagueItem]}>
						<Text style={styles.categoryLabel}>模糊</Text>
						<Text style={styles.categoryCount}>{categoryCounts.y}</Text>
					</View>
					<View style={[styles.categoryItem, styles.unknownItem]}>
						<Text style={styles.categoryLabel}>不会</Text>
						<Text style={styles.categoryCount}>{categoryCounts.z}</Text>
					</View>
				</View>
			</View>
		</Screen>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#F5F5F5',
	},
	header: {
		backgroundColor: '#FFFFFF',
		paddingHorizontal: 20,
		paddingVertical: 16,
		borderBottomWidth: 1,
		borderBottomColor: '#E5E5E5',
	},
	headerTitle: {
		fontSize: 24,
		fontWeight: '700',
		color: '#333333',
		fontFamily: 'serif',
	},
	headerCount: {
		fontSize: 14,
		color: '#999999',
		marginTop: 4,
		fontFamily: 'serif',
	},
	listContent: {
		padding: 16,
		paddingBottom: 100,
	},
	wordItem: {
		backgroundColor: '#FFFFFF',
		borderRadius: 12,
		padding: 16,
		marginBottom: 12,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.05,
		shadowRadius: 4,
		elevation: 2,
	},
	wordInfo: {
		marginBottom: 8,
	},
	wordText: {
		fontSize: 20,
		fontWeight: '600',
		color: '#333333',
		fontFamily: 'serif',
	},
	phoneticText: {
		fontSize: 14,
		color: '#999999',
		marginTop: 2,
		fontFamily: 'serif',
	},
	meaningText: {
		fontSize: 14,
		color: '#666666',
		marginBottom: 12,
		fontFamily: 'serif',
	},
	categoryButtons: {
		flexDirection: 'row',
		gap: 8,
	},
	categoryBtn: {
		flex: 1,
		paddingVertical: 8,
		borderRadius: 8,
		alignItems: 'center',
	},
	knownBtn: {
		backgroundColor: '#4CAF50',
	},
	vagueBtn: {
		backgroundColor: '#FF9800',
	},
	unknownBtn: {
		backgroundColor: '#F44336',
	},
	categoryBtnText: {
		fontSize: 12,
		fontWeight: '600',
		color: '#FFFFFF',
		fontFamily: 'serif',
	},
	emptyContainer: {
		padding: 48,
		alignItems: 'center',
	},
	emptyText: {
		fontSize: 16,
		color: '#999999',
	},
	categorySummary: {
		position: 'absolute',
		bottom: 0,
		left: 0,
		right: 0,
		flexDirection: 'row',
		backgroundColor: '#FFFFFF',
		paddingHorizontal: 16,
		paddingVertical: 12,
		paddingBottom: 32,
		borderTopWidth: 1,
		borderTopColor: '#E5E5E5',
		gap: 8,
	},
	categoryItem: {
		flex: 1,
		alignItems: 'center',
		paddingVertical: 10,
		borderRadius: 10,
	},
	knownItem: {
		backgroundColor: '#E8F5E9',
	},
	vagueItem: {
		backgroundColor: '#FFF3E0',
	},
	unknownItem: {
		backgroundColor: '#FFEBEE',
	},
	categoryLabel: {
		fontSize: 12,
		color: '#666666',
		fontFamily: 'serif',
	},
	categoryCount: {
		fontSize: 20,
		fontWeight: '700',
		color: '#333333',
		marginTop: 2,
		fontFamily: 'serif',
	},
});
