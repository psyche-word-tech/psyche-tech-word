/* eslint-disable react-hooks/refs */
import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Dimensions, PanResponder } from 'react-native';
import { useSafeRouter, useSafeSearchParams } from '@/hooks/useSafeRouter';
import { Screen } from '@/components/Screen';
import { useFocusEffect } from 'expo-router';
import { FontAwesome6 } from '@expo/vector-icons';
import { API_BASE_URL } from '@/utils/apiConfig';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// 卡片尺寸常量
const CARD_WIDTH = 160;
const CARD_GAP = 16;
const VISIBLE_CARDS = 3; // 左中右各显示一个

// 中心卡片在屏幕中的水平偏移（让中心卡片居中）
const CENTER_OFFSET = (SCREEN_WIDTH - CARD_WIDTH) / 2;

interface Word {
	id: number;
	word: string;
	meaning: string;
	phonetic?: string;
	example?: string;
	example_translation?: string;
	image_url?: string;
}

// 单个单词卡片（纯展示，无手势）
interface SwipeableWordCardProps {
	word: Word;
	index: number;
	currentIndex: number;
	panX: Animated.Value;
	onPress: () => void;
}

function SwipeableWordCard({ word, index, currentIndex, panX, onPress }: SwipeableWordCardProps) {
	// 每张卡片的基准位置 = CENTER_OFFSET + (index - 1) * (CARD_WIDTH + CARD_GAP)
	// index=0(左卡): CENTER_OFFSET - step, index=1(中卡): CENTER_OFFSET, index=2(右卡): CENTER_OFFSET + step
	// 加上 panX 的偏移量，实现整体联动滑动
	const translateX = Animated.add(
		panX,
		new Animated.Value(CENTER_OFFSET + (index - 1) * (CARD_WIDTH + CARD_GAP))
	);

	// 根据距离中心的距离计算缩放和透明度
	const distanceFromCenter = Math.abs(index - 1);
	const scale = distanceFromCenter === 1 ? 0.85 : 1;
	const opacity = distanceFromCenter >= 2 ? 0 : distanceFromCenter === 1 ? 0.5 : 1;

	return (
		<Animated.View
			style={[
				styles.swipeCard,
				{
					transform: [
						{ translateX },
						{ scale },
					],
					opacity,
				},
			]}
		>
			<TouchableOpacity
				activeOpacity={0.8}
				style={styles.swipeCardInner}
				onPress={onPress}
			>
				<Text style={styles.wordText}>{word.word}</Text>
				{word.phonetic && <Text style={styles.phoneticText}>{word.phonetic}</Text>}
				{word.meaning && (
					<Text style={styles.meaningText} numberOfLines={2}>{word.meaning}</Text>
				)}
			</TouchableOpacity>
		</Animated.View>
	);
}

export default function LearnPage() {
	const router = useSafeRouter();
	const params = useSafeSearchParams<{ table?: string }>();
	const table = params.table || 'words_b';

	const [allWords, setAllWords] = useState<Word[]>([]);
	const [currentIndex, setCurrentIndex] = useState(0);
	const [categoryCounts, setCategoryCounts] = useState({ x: 0, y: 0, z: 0 });
	const [error, setError] = useState<string | null>(null);
	const [offset, setOffset] = useState(0);
	const [hasMore, setHasMore] = useState(true);
	const [loadingMore, setLoadingMore] = useState(false);
	const limit = 20;

	// 共享的 panX，所有卡片共用同一个偏移值
	const panX = useRef(new Animated.Value(0)).current;
	const currentIndexRef = useRef(0);
	const isDraggingRef = useRef(false);

	const categoryColors = ['#4CAF50', '#FF9800', '#F44336'];
	const categoryNames = ['已会', '模糊', '不会'];

	// 获取当前可见范围内的卡片（当前索引前后各一张）
	const visibleRange = useMemo(() => {
		const start = Math.max(0, currentIndex - 1);
		const end = Math.min(allWords.length, currentIndex + 2);
		return allWords.slice(start, end).map((word, i) => ({
			word,
			actualIndex: start + i,
			displayIndex: i,
		}));
	}, [allWords, currentIndex]);

	const remainingCount = allWords.length;

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
				fetch(`${API_BASE_URL}/api/v1/wordbooks/words_z`)
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
				if (newWords.length > 0) {
					setCurrentIndex(0);
					currentIndexRef.current = 0;
				}
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
		const timer = setTimeout(() => fetchData(), 0);
		return () => clearTimeout(timer);
	}, [fetchData]);

	useFocusEffect(
		useCallback(() => fetchData(), [fetchData])
	);

	// 加载更多
	const loadMore = useCallback(() => {
		if (!hasMore || loadingMore) return;
		setLoadingMore(true);
		const newOffset = offset + limit;
		fetchWords(newOffset, true).finally(() => {
			setOffset(newOffset);
			setLoadingMore(false);
		});
	}, [hasMore, loadingMore, offset, fetchWords]);

	// PanResponder：按住拖拽左右滑动切换单词
	const panResponder = useMemo(() =>
		PanResponder.create({
			// 按下时立即响应（不需要移动阈值）
			onStartShouldSetPanResponder: () => true,
			onMoveShouldSetPanResponder: (_evt, gestureState) => {
				// 水平方向移动超过阈值才响应
				return Math.abs(gestureState.dx) > 5;
			},
			onPanResponderGrant: () => {
				isDraggingRef.current = true;
				// 记录当前位置作为偏移起点
				panX.setOffset((panX as any)._value || 0);
				panX.setValue(0);
			},
			onPanResponderMove: (_evt, gestureState) => {
				// 只处理水平方向
				panX.setValue(gestureState.dx);
			},
			onPanResponderRelease: (_evt, gestureState) => {
				isDraggingRef.current = false;
				panX.flattenOffset();

				const dx = gestureState.dx;
				const stepWidth = CARD_WIDTH + CARD_GAP;

				// 判断滑动方向：超过半张卡片的距离就切换
				let newIndex = currentIndexRef.current;
				if (dx < -stepWidth * 0.35) {
					// 向左滑 → 下一个
					newIndex = Math.min(currentIndexRef.current + 1, allWords.length - 1);
				} else if (dx > stepWidth * 0.35) {
					// 向右滑 → 上一个
					newIndex = Math.max(currentIndexRef.current - 1, 0);
				}

				// 计算目标位置偏移量（相对于当前 panX 值）
				const targetOffset = -(newIndex - currentIndexRef.current) * stepWidth;

				Animated.spring(panX, {
					toValue: targetOffset,
					useNativeDriver: true,
					friction: 8,
					tension: 100,
				}).start(({ finished }) => {
					if (finished) {
						// 动画结束后重置 panX 为 0，并更新 currentIndex
						panX.setValue(0);
						panX.setOffset(0);
						currentIndexRef.current = newIndex;
						setCurrentIndex(newIndex);

						// 接近末尾时加载更多
						if (newIndex >= allWords.length - 3) {
							loadMore();
						}
					}
				});
			},
			onPanResponderTerminate: () => {
				isDraggingRef.current = false;
				panX.flattenOffset();
				Animated.spring(panX, {
					toValue: 0,
					useNativeDriver: true,
				}).start(() => {
					panX.setValue(0);
					panX.setOffset(0);
				});
			},
		}),
		[allWords.length, loadMore, panX]
	);

	// 垂直拖动分类的处理
	const handleDrop = useCallback(async (categoryId: number) => {
		const currentWord = allWords[currentIndex];
		if (!currentWord) return;

		const targetTableMap: Record<number, string> = {
			1: 'words_x',
			2: 'words_y',
			3: 'words_z'
		};
		const targetTable = targetTableMap[categoryId];

		try {
			await fetch(`${API_BASE_URL}/api/v1/wordbooks/move`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					sourceTable: table,
					targetTable: targetTable,
					wordId: currentWord.id
				}),
			});
		} catch (error) {
			console.error('Failed to move word:', error);
		}

		// 移除当前单词并切换到下一个
		const nextIndex = Math.min(currentIndex, allWords.length - 2);
		setAllWords(prev => prev.filter(w => w.id !== currentWord.id));
		currentIndexRef.current = nextIndex;
		setCurrentIndex(nextIndex);

		setCategoryCounts(prev => {
			const key = ['x', 'y', 'z'][categoryId - 1] as 'x' | 'y' | 'z';
			return { ...prev, [key]: prev[key] + 1 };
		});
	}, [table, allWords, currentIndex]);

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

	// 当前单词
	const currentWord = allWords[currentIndex];

	return (
		<Screen>
			<View style={styles.container}>
				{/* 头部 */}
				<View style={styles.header}>
					<TouchableOpacity onPress={() => router.back()}>
						<Text style={styles.backText}>back</Text>
					</TouchableOpacity>
					<Text style={styles.title}>词汇预览</Text>
					<TouchableOpacity onPress={() => router.push('/calendar')}>
						<FontAwesome6 name="calendar-days" size={22} color="#333333" />
					</TouchableOpacity>
				</View>

				<View style={styles.centerContainer}>
					{error ? (
						<View style={styles.emptyContainer}>
							<Text style={styles.errorText}>加载失败: {error}</Text>
							<TouchableOpacity style={styles.retryButton} onPress={fetchData}>
								<Text style={styles.retryButtonText}>重新加载</Text>
							</TouchableOpacity>
						</View>
					) : allWords.length === 0 ? (
						<View style={styles.emptyContainer}>
							<Text style={styles.emptyText}>所有单词已分类完成！</Text>
							<TouchableOpacity style={styles.retryButton} onPress={fetchData}>
								<Text style={styles.retryButtonText}>重新加载</Text>
							</TouchableOpacity>
						</View>
					) : (
						<>
							{/* 剩余数量 */}
							<Text style={styles.remainingText}>剩余 {remainingCount} 个单词</Text>

							{/* 可滑动的单词区域 */}
							<View
								{...panResponder.panHandlers}
								style={styles.swipeArea}
							>
								{/* 左右两侧的指示器 */}
								{currentIndex > 0 && (
									<View style={styles.leftIndicator}>
										<Text style={styles.indicatorText}>←</Text>
									</View>
								)}
								{currentIndex < allWords.length - 1 && (
									<View style={styles.rightIndicator}>
										<Text style={styles.indicatorText}>→</Text>
									</View>
								)}

								{/* 卡片容器 */}
								<View style={styles.cardContainer}>
									{visibleRange.map(({ word, actualIndex, displayIndex }) => (
										<SwipeableWordCard
											key={word.id || actualIndex}
											word={word}
											index={displayIndex}
											currentIndex={currentIndex - (visibleRange[0]?.actualIndex || currentIndex)}
											panX={panX}
											onPress={() => handleWordPress(word)}
										/>
									))}
								</View>

								{/* 当前位置指示器 */}
								<View style={styles.dotContainer}>
										{visibleRange.map((_, i) => {
											const dotIndex = (currentIndexRef.current - 1) + i;
											const isActive = dotIndex === currentIndex;
											return (
												<View
													key={`dot-${dotIndex}-${i}`}
													style={[
														styles.dot,
														isActive && styles.dotActive,
													]}
												/>
											);
										})}
								</View>

								<Text style={styles.hintText}>← 按住左右滑动切换单词 →</Text>
							</View>
						</>
					)}

					{/* 底部分类按钮 */}
					<View style={styles.categorySection}>
						<View style={styles.categoryRow}>
							{[1, 2, 3].map((id) => {
								const targetTable = id === 1 ? 'words_x' : id === 2 ? 'words_y' : 'words_z';
								return (
									<TouchableOpacity
										key={id}
										style={styles.categoryItem}
										onPress={() => handleDrop(id)}
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
						<Text style={styles.instructionText}>点击分类按钮将当前单词归类</Text>
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
	centerContainer: {
		flex: 1,
		justifyContent: 'center',
		paddingHorizontal: 20,
	},
	remainingText: {
		fontSize: 14,
		color: '#999999',
		marginBottom: 24,
		textAlign: 'center',
	},
	// 滑动区域
	swipeArea: {
		alignItems: 'center',
		justifyContent: 'center',
		minHeight: 260,
		position: 'relative',
	},
	leftIndicator: {
		position: 'absolute',
		left: -10,
		top: '50%',
		marginTop: -15,
		zIndex: 10,
	},
	rightIndicator: {
		position: 'absolute',
		right: -10,
		top: '50%',
		marginTop: -15,
		zIndex: 10,
	},
	indicatorText: {
		fontSize: 28,
		color: '#CCCCCC',
	},
	// 卡片容器
	cardContainer: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		width: SCREEN_WIDTH,
		overflow: 'hidden',
	},
	// 单张卡片
	swipeCard: {
		width: CARD_WIDTH,
		position: 'absolute',
		alignItems: 'center',
	},
	swipeCardInner: {
		width: CARD_WIDTH,
		height: 180,
		borderRadius: 20,
		backgroundColor: '#F5F5F5',
		alignItems: 'center',
		justifyContent: 'center',
		padding: 16,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 0.12,
		shadowRadius: 12,
		elevation: 6,
	},
	wordText: {
		fontSize: 26,
		color: '#222222',
		fontWeight: '700',
		textTransform: 'lowercase',
	},
	phoneticText: {
		fontSize: 13,
		color: '#888888',
		marginTop: 6,
	},
	meaningText: {
		fontSize: 12,
		color: '#666666',
		marginTop: 10,
		textAlign: 'center',
		lineHeight: 18,
	},
	// 圆点指示器
	dotContainer: {
		flexDirection: 'row',
		gap: 6,
		marginTop: 20,
		height: 10,
	},
	dot: {
		width: 6,
		height: 6,
		borderRadius: 3,
		backgroundColor: '#D0D0D0',
	},
	dotActive: {
		width: 18,
		backgroundColor: '#4A90D9',
	},
	hintText: {
		fontSize: 11,
		color: '#BBBBBB',
		marginTop: 14,
		textAlign: 'center',
	},
	// 分类区域
	categorySection: {
		paddingVertical: 16,
		marginTop: 20,
	},
	categoryRow: {
		flexDirection: 'row',
		gap: 12,
	},
	categoryItem: {
		flex: 1,
	},
	categoryCard: {
		paddingVertical: 14,
		borderRadius: 12,
		alignItems: 'center',
	},
	categoryName: {
		fontSize: 14,
		color: '#FFFFFF',
		fontWeight: '600',
	},
	categoryCount: {
		fontSize: 11,
		color: 'rgba(255,255,255,0.75)',
		marginTop: 2,
	},
	instructionText: {
		fontSize: 11,
		color: '#999999',
		textAlign: 'center',
		marginTop: 8,
	},
	emptyContainer: {
		padding: 48,
		alignItems: 'center',
	},
	errorText: {
		fontSize: 14,
		color: '#F44336',
		marginBottom: 8,
	},
	errorSubText: {
		fontSize: 12,
		color: '#999999',
		marginBottom: 16,
	},
	emptyText: {
		fontSize: 15,
		color: '#666666',
		marginBottom: 12,
	},
	emptySubText: {
		fontSize: 12,
		color: '#999999',
		marginBottom: 16,
	},
	retryButton: {
		paddingHorizontal: 24,
		paddingVertical: 10,
		backgroundColor: '#4A90D9',
		borderRadius: 8,
		marginTop: 8,
	},
	retryButtonText: {
		fontSize: 14,
		color: '#FFFFFF',
		fontWeight: '600',
	},
});


