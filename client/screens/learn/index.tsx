/* eslint-disable react-hooks/refs */
import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Dimensions, PanResponder, ScrollView } from 'react-native';
import { useSafeRouter, useSafeSearchParams } from '@/hooks/useSafeRouter';
import { Screen } from '@/components/Screen';
import { useFocusEffect } from 'expo-router';
import { FontAwesome6 } from '@expo/vector-icons';
import { API_BASE_URL } from '@/utils/apiConfig';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

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
	onPress: () => void;
}

function DraggableWordCard({ word, onDrop, onPress }: DraggableWordCardProps) {
	const pan = useRef(new Animated.ValueXY()).current;
	const [isDragging, setIsDragging] = useState(false);

	const panResponder = useMemo(() =>
		PanResponder.create({
			onStartShouldSetPanResponder: () => false,
			onMoveShouldSetPanResponder: (_evt, gestureState) => {
				return Math.abs(gestureState.dy) > Math.abs(gestureState.dx) && Math.abs(gestureState.dy) > 10;
			},
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
			<TouchableOpacity onPress={onPress} activeOpacity={0.7}>
				<View style={styles.wordCard}>
					<Text style={styles.wordCardText}>{word.word}</Text>
				</View>
			</TouchableOpacity>
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

	const fetchWords = useCallback(async (currentOffset: number, append: boolean) => {
		setError(null);
		try {
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

	const handleScroll = useCallback((event: any) => {
		const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
		const isNearEnd = contentOffset.x + layoutMeasurement.width >= contentSize.width - 50;
		if (isNearEnd) {
			loadMore();
		}
	}, [loadMore]);

	const handleDrop = useCallback(async (wordId: number, categoryId: number) => {
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

	return (
		<Screen>
			{/* scrollEnabled=false 阻止 Screen 自动包裹外层垂直滚动容器，避免干扰水平滚动 */}
			<ScrollView scrollEnabled={false} contentContainerStyle={{ flexGrow: 1 }}>
				<View style={styles.container}>
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
						<View style={styles.content}>
							{error ? (
								<View style={styles.emptyContainer}>
									<Text style={styles.errorText}>加载失败: {error}</Text>
									<Text style={styles.errorSubText}>API: {API_BASE_URL}</Text>
									<TouchableOpacity style={styles.retryButton} onPress={fetchData}>
										<Text style={styles.retryButtonText}>重新加载</Text>
									</TouchableOpacity>
								</View>
							) : (
								<>
									<Text style={styles.remainingText}>剩余 {remainingCount} 个单词</Text>
									{displayWords.length > 0 ? (
										<ScrollView
											horizontal
											showsHorizontalScrollIndicator={false}
											snapToInterval={96}
											decelerationRate="fast"
											contentContainerStyle={styles.scrollContent}
											onScroll={handleScroll}
											scrollEventThrottle={200}
										>
											{displayWords.map((word) => (
												<DraggableWordCard
													key={word.id}
													word={word}
													onDrop={handleDrop}
													onPress={() => handleWordPress(word)}
												/>
											))}
										</ScrollView>
									) : (
										<View style={styles.emptyContainer}>
											<Text style={styles.emptyText}>所有单词已分类完成！</Text>
											<Text style={styles.emptySubText}>若数据异常，请尝试刷新</Text>
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
	scrollContent: {
		gap: 28,
		paddingHorizontal: 20,
	},
	wordItemContainer: {
		width: 68,
	},
	wordCard: {
		backgroundColor: '#F0F0F0',
		paddingHorizontal: 6,
		paddingVertical: 8,
		borderRadius: 8,
		alignItems: 'center',
		minHeight: 44,
		justifyContent: 'center',
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.1,
		shadowRadius: 4,
		elevation: 3,
	},
	wordCardText: {
		fontSize: 12,
		color: '#333333',
		fontWeight: '600',
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
		marginBottom: 8,
	},
	errorSubText: {
		fontSize: 12,
		color: '#999999',
		marginBottom: 12,
	},
	emptySubText: {
		fontSize: 12,
		color: '#999999',
		marginTop: 8,
		marginBottom: 12,
	},
	retryButton: {
		backgroundColor: '#4CAF50',
		paddingHorizontal: 20,
		paddingVertical: 10,
		borderRadius: 8,
		marginTop: 8,
	},
	retryButtonText: {
		fontSize: 14,
		color: '#FFFFFF',
		fontWeight: '600',
	},
	debugContainer: {
		marginTop: 12,
		padding: 10,
		backgroundColor: '#FFFDE7',
		borderRadius: 6,
	},
	debugText: {
		fontSize: 10,
		color: '#666666',
		fontFamily: 'monospace',
	},
});

