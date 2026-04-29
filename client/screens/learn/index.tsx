/* eslint-disable react-hooks/refs */
import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Dimensions, PanResponder, ScrollView } from 'react-native';
import { useSafeRouter, useSafeSearchParams } from '@/hooks/useSafeRouter';
import { Screen } from '@/components/Screen';
import { useFocusEffect } from 'expo-router';
import { FontAwesome6 } from '@expo/vector-icons';
import { API_BASE_URL } from '@/utils/apiConfig';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface Word {
	id: number;
	word: string;
	meaning: string;
	phonetic?: string;
	example?: string;
	example_translation?: string;
	image_url?: string;
}

interface DraggableWordCardProps {
	word: Word;
	onDrop: (wordId: number, categoryId: number) => void;
}

function DraggableWordCard({ word, onDrop }: DraggableWordCardProps) {
	const pan = useRef(new Animated.ValueXY()).current;
	const [isDragging, setIsDragging] = useState(false);

	const panResponder = useMemo(() =>
		PanResponder.create({
			onStartShouldSetPanResponder: () => false,
			onMoveShouldSetPanResponder: (_evt, gestureState) => {
				// 只响应用明显的垂直拖动（dy > dx * 1.5 且 dy > 12）
				return Math.abs(gestureState.dy) > Math.abs(gestureState.dx) * 1.5 && Math.abs(gestureState.dy) > 12;
			},
			onPanResponderTerminationRequest: () => true,
			onPanResponderGrant: () => {
				setIsDragging(true);
				pan.setOffset({
					x: (pan.x as any)._value || 0,
					y: (pan.y as any)._value || 0,
				});
				pan.setValue({ x: 0, y: 0 });
			},
			onPanResponderMove: (evt, gestureState) => {
				pan.setValue({ x: gestureState.dx, y: gestureState.dy });
			},
			onPanResponderRelease: (evt, gestureState) => {
				setIsDragging(false);
				pan.flattenOffset();

				const dy = gestureState.dy;
				const absoluteX = gestureState.moveX;

				if (dy > 80) {
					let targetCategory = 3;
					if (absoluteX < SCREEN_WIDTH / 3) {
						targetCategory = 1;
					} else if (absoluteX < (SCREEN_WIDTH / 3) * 2) {
						targetCategory = 2;
					}
					onDrop(word.id, targetCategory);
				}

				Animated.spring(pan, {
					toValue: { x: 0, y: 0 },
					useNativeDriver: false,
				}).start();
			},
			onPanResponderTerminate: () => {
				setIsDragging(false);
				pan.flattenOffset();
				Animated.spring(pan, {
					toValue: { x: 0, y: 0 },
					useNativeDriver: false,
				}).start();
			},
		}),
		[onDrop, word.id, pan]
	);

	return (
		<Animated.View
			{...panResponder.panHandlers}
			style={[
				styles.wordItemContainer,
				{
					transform: [
						{ translateX: pan.x },
						{ translateY: pan.y },
					],
					opacity: isDragging ? 0.8 : 1,
					zIndex: isDragging ? 100 : 1,
				},
			]}
		>
			<View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
				<Text style={styles.wordCardText}>{word.word}</Text>
			</View>
		</Animated.View>
	);
}

export default function LearnPage() {
	const router = useSafeRouter();
	const params = useSafeSearchParams<{ table?: string }>();
	const table = params.table || 'words_b';
	
	const [allWords, setAllWords] = useState<Word[]>([]);
	const [categoryCounts, setCategoryCounts] = useState({ x: 0, y: 0, z: 0 });
	const [error, setError] = useState<string | null>(null);
	const [offset, setOffset] = useState(0);
	const [hasMore, setHasMore] = useState(true);
	const [loadingMore, setLoadingMore] = useState(false);
	const limit = 20;

	const categoryColors = ['#4CAF50', '#FF9800', '#F44336'];
	const categoryNames = ['已会', '模糊', '不会'];

	const displayWords = allWords;
	const remainingCount = allWords.length;

	// 单词卡片的尺寸常量
	const ITEM_WIDTH = 80;
	const ITEM_GAP = 28;
	const WORDS_PER_PAGE = 3; // 每页显示3个单词
	const PAGE_PADDING = 8; // 页面左右内边距
	const PAGE_WIDTH = WORDS_PER_PAGE * ITEM_WIDTH + (WORDS_PER_PAGE - 1) * ITEM_GAP + PAGE_PADDING * 2; // = 320

	const scrollViewRef = useRef<ScrollView>(null);

	const fetchWords = useCallback(async (currentOffset: number, append: boolean) => {
		setError(null);
		try {
			/**
			 * 服务端文件：server/src/routes/wordbooks.ts
			 * 接口：GET /api/v1/wordbooks/:table
			 * Query 参数：offset: number, limit: number
			 */
			const [wordsRes, xRes, yRes, zRes] = await Promise.all([
				fetch(`${API_BASE_URL}/api/v1/wordbooks/${table}?offset=${currentOffset}&limit=${limit}`),
				fetch(`${API_BASE_URL}/api/v1/wordbooks/words_x`),
				fetch(`${API_BASE_URL}/api/v1/wordbooks/words_y`),
				fetch(`${API_BASE_URL}/api/v1/wordbooks/words_z`),
			]);

			const wordsData = await wordsRes.json();
			const xResult = await xRes.json();
			const yResult = await yRes.json();
			const zResult = await zRes.json();

			const newWords = Array.isArray(wordsData) ? wordsData : [];
			if (append) {
				setAllWords(prev => [...prev, ...newWords]);
			} else {
				setAllWords(newWords);
			}
			setHasMore(newWords.length === limit);
			setCategoryCounts({
				x: Array.isArray(xResult) ? xResult.length : 0,
				y: Array.isArray(yResult) ? yResult.length : 0,
				z: Array.isArray(zResult) ? zResult.length : 0,
			});
		} catch (err: any) {
			console.error('Failed to fetch data:', err);
			setError(err?.message || '网络请求失败');
		}
	}, [table]);

	const fetchData = useCallback(() => {
		setOffset(0);
		fetchWords(0, false);
	}, [fetchWords]);

	useEffect(() => {
		const timer = setTimeout(() => {
			fetchData();
		}, 0);
		return () => clearTimeout(timer);
	}, [fetchData]);

	useFocusEffect(
		useCallback(() => {
			fetchData();
		}, [fetchData])
	);

	const loadMore = useCallback(() => {
		if (!hasMore || loadingMore) return;
		setLoadingMore(true);
		const newOffset = offset + limit;
		fetchWords(newOffset, true).finally(() => {
			setOffset(newOffset);
			setLoadingMore(false);
		});
	}, [hasMore, loadingMore, offset, fetchWords]);

	const handleDrop = useCallback(async (wordId: number, categoryId: number) => {
		const targetTableMap: Record<number, string> = {
			1: 'words_x',
			2: 'words_y',
			3: 'words_z'
		};
		const targetTable = targetTableMap[categoryId];

		/**
		 * 服务端文件：server/src/routes/wordbooks.ts
		 * 接口：POST /api/v1/wordbooks/move
		 * Body 参数：sourceTable: string, targetTable: string, wordId: number
		 */
		try {
			await fetch(`${API_BASE_URL}/api/v1/wordbooks/move`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					sourceTable: table,
					targetTable: targetTable,
					wordId: wordId
				}),
			});
		} catch (error) {
			console.error('Failed to move word:', error);
		}

		setAllWords(prev => prev.filter(w => w.id !== wordId));
		
		setCategoryCounts(prev => {
			const key = ['x', 'y', 'z'][categoryId - 1] as 'x' | 'y' | 'z';
			return { ...prev, [key]: prev[key] + 1 };
		});
	}, [table]);

	const handleWordPress = (word: Word) => {
		router.push('/word-detail', { 
			word: JSON.stringify({
				id: word.id,
				word: word.word,
				phonetic: word.phonetic || '',
				meaning: word.meaning,
				example: word.example || '',
				example_translation: word.example_translation || '',
				image_url: word.image_url || ''
			}),
			table: table
		});
	};

	// 将单词按每页3个分组
	const wordPages = useMemo(() => {
		const pages: Word[][] = [];
		for (let i = 0; i < displayWords.length; i += WORDS_PER_PAGE) {
			pages.push(displayWords.slice(i, i + WORDS_PER_PAGE));
		}
		return pages;
	}, [displayWords]);

	// 滑动结束时检查是否需要加载更多
	const handleScrollEndDrag = useCallback(({ nativeEvent }: { nativeEvent: { contentOffset: { x: number }; contentSize: { width: number }; layoutMeasurement: { width: number } } }) => {
		const { contentOffset, contentSize, layoutMeasurement } = nativeEvent;
		const distanceToEnd = contentSize.width - (contentOffset.x + layoutMeasurement.width);
		
		// 距离末尾不到一页宽度时加载更多
		if (distanceToEnd < PAGE_WIDTH && hasMore && !loadingMore) {
			loadMore();
		}
	}, [hasMore, loadingMore, loadMore]);

	// 调试信息：显示当前渲染状态
	const debugInfo = `共${displayWords.length}词 ${wordPages.length}页`;

	return (
		<Screen>
			<ScrollView 
				scrollEnabled={false} 
				pointerEvents="none" 
				contentContainerStyle={{ flexGrow: 1 }}
			>
				<View style={styles.container} pointerEvents="auto">
					<View style={styles.header} pointerEvents="auto">
						<TouchableOpacity onPress={() => router.navigate('/my-vocabulary')}>
							<Text style={styles.backText}>back</Text>
						</TouchableOpacity>
						<Text style={styles.title}>词汇预览</Text>
						<TouchableOpacity onPress={() => router.push('/calendar')}>
							<FontAwesome6 name="calendar-days" size={22} color="#333333" />
						</TouchableOpacity>
					</View>

					<View style={styles.centerContainer}>
						<View style={styles.content}>
							{error ? (
								<View style={styles.emptyContainer}>
									<Text style={styles.errorText}>加载失败: {error}</Text>
									<TouchableOpacity style={styles.retryButton} onPress={fetchData}>
										<Text style={styles.retryButtonText}>重新加载</Text>
									</TouchableOpacity>
								</View>
							) : (
								<>
									<Text style={styles.remainingText}>
										剩余 {remainingCount} 个单词
										<Text style={styles.debugText}> | {debugInfo}</Text>
									</Text>
									
									{displayWords.length > 0 ? (
										// 固定宽度的视口容器，严格裁切溢出
										<View style={[styles.wordViewport, { width: PAGE_WIDTH }]}>
											<ScrollView
												ref={scrollViewRef}
												horizontal
												showsHorizontalScrollIndicator={false}
												snapToInterval={PAGE_WIDTH} // 按页宽度吸附
												decelerationRate="fast"
												onScrollEndDrag={handleScrollEndDrag}
												contentContainerStyle={styles.scrollContent}
											>
												{wordPages.map((pageWords, pageIndex) => (
													<View 
														key={pageIndex} 
														style={[styles.wordPage, { width: PAGE_WIDTH }]}
													>
														{pageWords.map((word) => (
															<DraggableWordCard
																key={word.id}
																word={word}
																onDrop={handleDrop}
															/>
														))}
														{/* 填充空白位置保持布局稳定 */}
														{Array.from({ length: WORDS_PER_PAGE - pageWords.length }).map((_, emptyIdx) => (
															<View 
																key={`empty-${pageIndex}-${emptyIdx}`} 
																style={styles.wordItemContainer} 
															/>
														))}
													</View>
												))}
											</ScrollView>
										</View>
									) : (
										<View style={styles.emptyContainer}>
											<Text style={styles.emptyText}>所有单词已分类完成！</Text>
											<TouchableOpacity style={styles.retryButton} onPress={fetchData}>
												<Text style={styles.retryButtonText}>重新加载</Text>
											</TouchableOpacity>
										</View>
									)}
								</>
							)}
						</View>

						<View style={styles.categorySection}>
							<View style={styles.categoryRow}>
								{[1, 2, 3].map((id) => {
									const targetTable = id === 1 ? 'words_x' : id === 2 ? 'words_y' : 'words_z';
									return (
										<TouchableOpacity
											key={id}
											style={styles.categoryItem}
											onPress={() => router.push('/word-list', { table: targetTable })}
										>
											<View style={[styles.categoryCard, { backgroundColor: categoryColors[id - 1] }]}>
												<Text style={styles.categoryName}>{categoryNames[id - 1]}</Text>
												<Text style={styles.categoryCount}>
													({id === 1 ? categoryCounts.x : id === 2 ? categoryCounts.y : categoryCounts.z})
												</Text>
											</View>
										</TouchableOpacity>
									);
								})}
							</View>
							<Text style={styles.instructionText}>拖动单词到上方分类区域</Text>
						</View>
					</View>
				</View>
			</ScrollView>
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
	},
	title: {
		fontSize: 16,
		color: '#333333',
		fontWeight: '600',
	},
	placeholder: {
		width: 50,
	},
	centerContainer: {
		flex: 1,
		justifyContent: 'center',
		paddingHorizontal: 20,
	},
	content: {
		paddingVertical: 16,
		alignItems: 'center',
		transform: [{ translateY: -100 }],
	},
	remainingText: {
		fontSize: 14,
		color: '#999999',
		marginBottom: 20,
	},
	debugText: {
		fontSize: 11,
		color: '#CCCCCC',
		fontWeight: '400',
	},
	// 关键：视口容器 - 固定宽度 + overflow hidden 裁切
	wordViewport: {
		height: 52,
		overflow: 'hidden',
		alignSelf: 'center',
		backgroundColor: 'transparent',
	},
	// ScrollView 内容容器
	scrollContent: {
		flexDirection: 'row',
	},
	// 每一页的容器 - 固定宽度
	wordPage: {
		flexDirection: 'row',
		gap: 28,
		paddingHorizontal: 8,
	},
	wordItemContainer: {
		width: 80,
		backgroundColor: '#F0F0F0',
		borderRadius: 12,
		paddingVertical: 6,
		paddingHorizontal: 8,
		alignItems: 'center',
		justifyContent: 'center',
		borderWidth: 1,
		borderColor: '#E0E0E0',
	},
	wordCardText: {
		fontSize: 13,
		color: '#1A1A1A',
		fontWeight: '700',
		letterSpacing: 0.3,
	},
	categorySection: {
		paddingVertical: 10,
		backgroundColor: '#FFFFFF',
	},
	categoryRow: {
		flexDirection: 'row',
		gap: 10,
	},
	categoryItem: {
		flex: 1,
	},
	categoryCard: {
		paddingVertical: 10,
		borderRadius: 10,
		alignItems: 'center',
	},
	categoryName: {
		fontSize: 13,
		color: '#FFFFFF',
		fontWeight: '600',
	},
	categoryCount: {
		fontSize: 11,
		color: 'rgba(255,255,255,0.8)',
		marginTop: 2,
	},
	instructionText: {
		fontSize: 11,
		color: '#999999',
		textAlign: 'center',
		marginTop: 6,
	},
	emptyContainer: {
		padding: 48,
		alignItems: 'center',
	},
	emptyText: {
		fontSize: 16,
		color: '#999999',
	},
	errorText: {
		fontSize: 14,
		color: '#E53935',
		marginBottom: 12,
	},
	retryButton: {
		backgroundColor: '#4CAF50',
		paddingHorizontal: 20,
		paddingVertical: 10,
		borderRadius: 8,
	},
	retryButtonText: {
		color: '#FFFFFF',
		fontSize: 14,
		fontWeight: '600',
	},
});
