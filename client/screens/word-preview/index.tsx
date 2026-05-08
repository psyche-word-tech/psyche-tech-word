import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
	View,
	Text,
	StyleSheet,
	ScrollView,
	Alert,
	Dimensions,
	FlatList,
	TouchableOpacity,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Screen } from '@/components/Screen';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH - 32;

interface Word {
	id: number;
	word: string;
	meaning: string;
	phonetic: string;
	example: string;
	translation?: string;
	image_url?: string;
}

const API_BASE_URL = process.env.EXPO_PUBLIC_BACKEND_BASE_URL;

export default function WordPreviewPage() {
	const [words, setWords] = useState<Word[]>([]);
	const [currentIndex, setCurrentIndex] = useState(0);
	const [categoryCounts, setCategoryCounts] = useState({ x: 0, y: 0, z: 0 });
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const flatListRef = useRef<FlatList>(null);

	// 获取 words_b 的单词
	const fetchWords = useCallback(async () => {
		try {
			setIsLoading(true);
			setError(null);

			const response = await fetch(`${API_BASE_URL}/api/v1/user-words/category/words_b`);
			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}
			const data = await response.json();
			setWords(data);
			setCurrentIndex(0);
		} catch (error: any) {
			console.error('Failed to fetch words:', error);
			setError(error.message || '获取单词列表失败');
		} finally {
			setIsLoading(false);
		}
	}, []);

	// 获取分类计数
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
				x: xData.count || 0,
				y: yData.count || 0,
				z: zData.count || 0,
			});
		} catch (error) {
			console.error('Failed to fetch category counts:', error);
		}
	}, []);

	// 页面加载时获取数据
	useEffect(() => {
		const timer = setTimeout(() => {
			fetchWords();
			fetchCategoryCounts();
		}, 0);
		return () => clearTimeout(timer);
	}, [fetchWords, fetchCategoryCounts]);

	useFocusEffect(
		useCallback(() => {
			fetchWords();
			fetchCategoryCounts();
		}, [fetchWords, fetchCategoryCounts])
	);

	// 移动单词到分类
	const handleMoveWord = useCallback(async (word: Word, targetTable: string) => {
		try {
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

			// 从列表中移除当前单词
			const newWords = words.filter(w => w.id !== word.id);
			setWords(newWords);
			
			// 更新索引
			if (currentIndex >= newWords.length && newWords.length > 0) {
				setCurrentIndex(newWords.length - 1);
			}
			
			// 更新分类数量
			fetchCategoryCounts();
		} catch (error) {
			console.error('Failed to move word:', error);
			Alert.alert('错误', '移动失败，请重试');
		}
	}, [words, currentIndex, fetchCategoryCounts]);

	// 渲染单词卡片
	const renderWordCard = useCallback(({ item, index }: { item: Word; index: number }) => {
		return (
			<View style={styles.cardContainer}>
				<View style={styles.wordCard}>
					<View style={styles.cardHeader}>
						<Text style={styles.indexText}>{index + 1} / {words.length}</Text>
					</View>
					<Text style={styles.wordText}>{item.word}</Text>
					<Text style={styles.phoneticText}>{item.phonetic}</Text>
					<Text style={styles.meaningText}>{item.meaning}</Text>
					{item.example && (
						<View style={styles.exampleContainer}>
							<Text style={styles.exampleText}>{item.example}</Text>
						</View>
					)}
				</View>
			</View>
		);
	}, [words.length]);

	// 处理滚动事件
	const handleScroll = useCallback((event: any) => {
		const offsetX = event.nativeEvent.contentOffset.x;
		const newIndex = Math.round(offsetX / SCREEN_WIDTH);
		setCurrentIndex(newIndex);
	}, []);

	// 当前单词
	const currentWord = words[currentIndex];

	return (
		<Screen>
			<View style={styles.container}>
				{/* Header */}
				<View style={styles.header}>
					<Text style={styles.headerTitle}>词汇预览</Text>
					<Text style={styles.headerCount}>
						{isLoading ? '加载中...' : `${words.length} 个单词待分类`}
					</Text>
					<TouchableOpacity style={styles.refreshButton} onPress={fetchWords}>
						<Text style={styles.refreshText}>刷新</Text>
					</TouchableOpacity>
				</View>

				{/* Word Cards - Horizontal Scroll */}
				<View style={styles.cardsSection}>
					{words.length > 0 ? (
						<>
							<FlatList
								ref={flatListRef}
								data={words}
								renderItem={renderWordCard}
								keyExtractor={(item) => item.id.toString()}
								horizontal
								pagingEnabled
								showsHorizontalScrollIndicator={false}
								onScroll={handleScroll}
								scrollEventThrottle={16}
								getItemLayout={(data, index) => ({
									length: SCREEN_WIDTH,
									offset: SCREEN_WIDTH * index,
									index,
								})}
							/>
							
							{/* Page Indicator */}
							<View style={styles.indicatorContainer}>
								{words.map((_, index) => (
									<View
										key={index}
										style={[
											styles.indicatorDot,
											index === currentIndex && styles.indicatorDotActive,
										]}
									/>
								))}
							</View>
						</>
					) : (
						<View style={styles.emptyContainer}>
							{error ? (
								<>
									<Text style={styles.errorText}>加载失败: {error}</Text>
									<Text style={styles.errorSubText}>API: {API_BASE_URL}</Text>
								</>
							) : (
								<Text style={styles.emptyText}>所有单词已分类完成！</Text>
							)}
						</View>
					)}
				</View>

				{/* Action Buttons */}
				{currentWord && (
					<View style={styles.actionSection}>
						<Text style={styles.actionHint}>左右滑动浏览，点击下方按钮分类</Text>
						<View style={styles.actionRow}>
							<TouchableOpacity
								style={[styles.actionButton, styles.knownButton]}
								onPress={() => handleMoveWord(currentWord, 'words_x')}
							>
								<Text style={styles.actionButtonText}>已会</Text>
							</TouchableOpacity>
							<TouchableOpacity
								style={[styles.actionButton, styles.vagueButton]}
								onPress={() => handleMoveWord(currentWord, 'words_y')}
							>
								<Text style={styles.actionButtonText}>模糊</Text>
							</TouchableOpacity>
							<TouchableOpacity
								style={[styles.actionButton, styles.unknownButton]}
								onPress={() => handleMoveWord(currentWord, 'words_z')}
							>
								<Text style={styles.actionButtonText}>不会</Text>
							</TouchableOpacity>
						</View>
					</View>
				)}

				{/* Category Stats */}
				<View style={styles.statsSection}>
					<View style={styles.statsRow}>
						<View style={[styles.statsItem, { backgroundColor: '#4CAF50' }]}>
							<Text style={styles.statsLabel}>已会</Text>
							<Text style={styles.statsCount}>{categoryCounts.x}</Text>
						</View>
						<View style={[styles.statsItem, { backgroundColor: '#FF9800' }]}>
							<Text style={styles.statsLabel}>模糊</Text>
							<Text style={styles.statsCount}>{categoryCounts.y}</Text>
						</View>
						<View style={[styles.statsItem, { backgroundColor: '#F44336' }]}>
							<Text style={styles.statsLabel}>不会</Text>
							<Text style={styles.statsCount}>{categoryCounts.z}</Text>
						</View>
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
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
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
		fontFamily: 'serif',
		flex: 1,
		marginLeft: 12,
	},
	refreshButton: {
		backgroundColor: '#4F46E5',
		paddingHorizontal: 12,
		paddingVertical: 6,
		borderRadius: 8,
	},
	refreshText: {
		color: '#FFFFFF',
		fontSize: 12,
		fontWeight: '600',
	},
	cardsSection: {
		flex: 1,
		justifyContent: 'center',
	},
	cardContainer: {
		width: SCREEN_WIDTH,
		paddingHorizontal: 16,
		justifyContent: 'center',
		alignItems: 'center',
	},
	wordCard: {
		width: CARD_WIDTH,
		backgroundColor: '#FFFFFF',
		borderRadius: 20,
		padding: 24,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 0.15,
		shadowRadius: 12,
		elevation: 8,
		minHeight: 300,
	},
	cardHeader: {
		flexDirection: 'row',
		justifyContent: 'flex-end',
		marginBottom: 16,
	},
	indexText: {
		fontSize: 14,
		color: '#999999',
		fontFamily: 'serif',
	},
	wordText: {
		fontSize: 36,
		fontWeight: '700',
		color: '#333333',
		fontFamily: 'serif',
		textAlign: 'center',
	},
	phoneticText: {
		fontSize: 18,
		color: '#666666',
		marginTop: 8,
		fontFamily: 'serif',
		textAlign: 'center',
	},
	meaningText: {
		fontSize: 18,
		color: '#4F46E5',
		marginTop: 16,
		fontFamily: 'serif',
		textAlign: 'center',
		lineHeight: 28,
	},
	exampleContainer: {
		marginTop: 20,
		paddingTop: 16,
		borderTopWidth: 1,
		borderTopColor: '#F0F0F0',
	},
	exampleText: {
		fontSize: 14,
		color: '#888888',
		fontFamily: 'serif',
		fontStyle: 'italic',
		lineHeight: 22,
		textAlign: 'center',
	},
	indicatorContainer: {
		flexDirection: 'row',
		justifyContent: 'center',
		alignItems: 'center',
		paddingVertical: 16,
		gap: 8,
	},
	indicatorDot: {
		width: 8,
		height: 8,
		borderRadius: 4,
		backgroundColor: '#D1D5DB',
	},
	indicatorDotActive: {
		width: 24,
		backgroundColor: '#4F46E5',
	},
	emptyContainer: {
		padding: 48,
		alignItems: 'center',
		justifyContent: 'center',
	},
	emptyText: {
		fontSize: 18,
		color: '#999999',
		textAlign: 'center',
	},
	errorText: {
		fontSize: 14,
		color: '#E53935',
		marginBottom: 8,
		textAlign: 'center',
	},
	errorSubText: {
		fontSize: 12,
		color: '#999999',
		textAlign: 'center',
	},
	actionSection: {
		backgroundColor: '#FFFFFF',
		paddingHorizontal: 16,
		paddingVertical: 20,
		borderTopLeftRadius: 24,
		borderTopRightRadius: 24,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: -4 },
		shadowOpacity: 0.1,
		shadowRadius: 12,
		elevation: 10,
	},
	actionHint: {
		fontSize: 13,
		color: '#999',
		textAlign: 'center',
		marginBottom: 16,
	},
	actionRow: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		gap: 12,
	},
	actionButton: {
		flex: 1,
		paddingVertical: 16,
		borderRadius: 16,
		alignItems: 'center',
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
	actionButtonText: {
		fontSize: 16,
		fontWeight: '600',
		color: '#FFFFFF',
		fontFamily: 'serif',
	},
	statsSection: {
		backgroundColor: '#FFFFFF',
		paddingHorizontal: 16,
		paddingVertical: 12,
		borderTopWidth: 1,
		borderTopColor: '#F0F0F0',
	},
	statsRow: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		gap: 12,
	},
	statsItem: {
		flex: 1,
		alignItems: 'center',
		paddingVertical: 12,
		borderRadius: 12,
	},
	statsLabel: {
		fontSize: 12,
		fontWeight: '600',
		color: '#FFFFFF',
		fontFamily: 'serif',
	},
	statsCount: {
		fontSize: 20,
		fontWeight: '700',
		color: '#FFFFFF',
		marginTop: 2,
		fontFamily: 'serif',
	},
});
