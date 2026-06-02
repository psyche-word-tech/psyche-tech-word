import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, Dimensions, Platform, Alert } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { fetchWithRetry } from '@/utils/apiClient';

interface Word {
	id: string;
	word: string;
	phonetic: string;
	definition: string;
	example_image_url?: string;
}

interface CategoryCounts {
	x: number;
	y: number;
	z: number;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// 触摸命中测试辅助函数
function hitTest(x: number, y: number, layout: { x: number; y: number; width: number; height: number }) {
	return (
		x >= layout.x &&
		x <= layout.x + layout.width &&
		y >= layout.y &&
		y <= layout.y + layout.height
	);
}

export default function WordPreviewScreen() {
	const [words, setWords] = useState<Word[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [categoryCounts, setCategoryCounts] = useState<CategoryCounts>({ x: 0, y: 0, z: 0 });
	const [currentIndex, setCurrentIndex] = useState(0);

	// 拖拽状态
	const [draggingWord, setDraggingWord] = useState<Word | null>(null);
	const [dragPosition, setDragPosition] = useState({ x: 0, y: 0 });
	const dragOffset = useRef({ x: 0, y: 0 });

	// 按钮布局
	const buttonRefs = useRef<{ [key: string]: View | null }>({});
	const [buttonLayouts, setButtonLayouts] = useState<{
		[key: string]: { x: number; y: number; width: number; height: number };
	}>({});

	// 获取 words_a 的单词
	const fetchWords = useCallback(async () => {
		try {
			setIsLoading(true);
			setError(null);

			const response = await fetchWithRetry(`/api/v1/user-words/category/a?page=1&limit=200`);
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
				fetchWithRetry(`/api/v1/user-words/category/x/count`),
				fetchWithRetry(`/api/v1/user-words/category/y/count`),
				fetchWithRetry(`/api/v1/user-words/category/z/count`),
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
	useFocusEffect(
		useCallback(() => {
			fetchWords();
			fetchCategoryCounts();
		}, [fetchWords, fetchCategoryCounts])
	);

	// 移动单词到分类
	const handleMoveWord = useCallback(async (word: Word, targetTable: string) => {
		try {
			const response = await fetchWithRetry(`/api/v1/user-words/classify`, {
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

	// 检测拖拽释放位置是否在按钮区域内
	const detectDropTarget = useCallback((clientX: number, clientY: number): string | null => {
		for (const [key, layout] of Object.entries(buttonLayouts)) {
			if (hitTest(clientX, clientY, layout)) {
				return key;
			}
		}
		return null;
	}, [buttonLayouts]);

	// 记录按钮布局
	const recordButtonLayout = useCallback((key: string, view: View | null) => {
		if (view) {
			buttonRefs.current[key] = view;
			view.measureInWindow((x, y, width, height) => {
				setButtonLayouts(prev => ({
					...prev,
					[key]: { x, y, width, height }
				}));
			});
		}
	}, []);

	// 鼠标/触摸事件处理 (Web 兼容)
	const handlePointerDown = useCallback((e: React.PointerEvent, word: Word) => {
		if (Platform.OS === 'web') {
			const event = e as unknown as { nativeEvent: { offsetX: number; offsetY: number; clientX: number; clientY: number } };
			dragOffset.current = {
				x: event.nativeEvent.offsetX,
				y: event.nativeEvent.offsetY
			};
			setDragPosition({
				x: event.nativeEvent.clientX - event.nativeEvent.offsetX,
				y: event.nativeEvent.clientY - event.nativeEvent.offsetY
			});
			setDraggingWord(word);
		}
	}, []);

	const handlePointerMove = useCallback((e: React.PointerEvent) => {
		if (draggingWord && Platform.OS === 'web') {
			const event = e as unknown as { nativeEvent: { clientX: number; clientY: number } };
			setDragPosition({
				x: event.nativeEvent.clientX - dragOffset.current.x,
				y: event.nativeEvent.clientY - dragOffset.current.y
			});
		}
	}, [draggingWord]);

	const handlePointerUp = useCallback((e: React.PointerEvent) => {
		if (draggingWord && Platform.OS === 'web') {
			const event = e as unknown as { nativeEvent: { clientX: number; clientY: number } };
			const target = detectDropTarget(event.nativeEvent.clientX, event.nativeEvent.clientY);
			
			if (target) {
				handleMoveWord(draggingWord, target);
			}
			
			setDraggingWord(null);
		}
	}, [draggingWord, detectDropTarget, handleMoveWord]);

	// 计算显示的单词
	const currentWord = words[currentIndex];

	if (isLoading) {
		return (
			<View style={styles.container}>
				<View style={styles.header}>
					<Text style={styles.headerTitle}>词汇预览</Text>
				</View>
				<View style={styles.centerContent}>
					<Text style={styles.loadingText}>加载中...</Text>
				</View>
			</View>
		);
	}

	if (error) {
		return (
			<View style={styles.container}>
				<View style={styles.header}>
					<Text style={styles.headerTitle}>词汇预览</Text>
				</View>
				<View style={styles.centerContent}>
					<Text style={styles.errorText}>{error}</Text>
				</View>
			</View>
		</View>
		);
	}

	return (
		<View 
			style={styles.container}
			onPointerMove={handlePointerMove}
			onPointerUp={handlePointerUp}
			onPointerLeave={handlePointerUp}
		>
			<View style={styles.header}>
				<Text style={styles.headerTitle}>词汇预览</Text>
			</View>

			<View style={styles.content}>
				{words.length === 0 ? (
					<View style={styles.completedContainer}>
						<Text style={styles.completedText}>所有单词已分类完成！</Text>
					</View>
				) : (
					<>
						<Text style={styles.remainingText}>剩余{words.length}个单词</Text>
						
						{/* 单词卡片区域 */}
						<View style={styles.wordsContainer}>
							{[0, 1, 2].map(offset => {
								const word = words[currentIndex + offset];
								if (!word) return null;
								
								const isBeingDragged = draggingWord?.id === word.id;
								
								return (
									<View
										key={word.id}
										ref={(ref) => {
											// 存储引用但不阻塞渲染
										}}
										style={[
											styles.wordCard,
											isBeingDragged && styles.wordCardDragging,
										]}
										onPointerDown={(e) => handlePointerDown(e, word)}
									>
										<Text style={styles.wordText}>{word.word}</Text>
										<Text style={styles.definitionText}>{word.definition}</Text>
									</View>
								);
							})}
						</View>

						{/* 分类按钮 */}
						<View style={styles.buttonsContainer}>
							<TouchableOpacity
								ref={(ref) => recordButtonLayout('x', ref as unknown as View)}
								style={[styles.categoryButton, styles.buttonX]}
								onPress={() => currentWord && handleMoveWord(currentWord, 'x')}
							>
								<Text style={styles.buttonText}>已会 ({categoryCounts.x})</Text>
							</TouchableOpacity>

							<TouchableOpacity
								ref={(ref) => recordButtonLayout('y', ref as unknown as View)}
								style={[styles.categoryButton, styles.buttonY]}
								onPress={() => currentWord && handleMoveWord(currentWord, 'y')}
							>
								<Text style={styles.buttonText}>模糊 ({categoryCounts.y})</Text>
							</TouchableOpacity>

							<TouchableOpacity
								ref={(ref) => recordButtonLayout('z', ref as unknown as View)}
								style={[styles.categoryButton, styles.buttonZ]}
								onPress={() => currentWord && handleMoveWord(currentWord, 'z')}
							>
								<Text style={styles.buttonText}>不会 ({categoryCounts.z})</Text>
							</TouchableOpacity>
						</View>

						<Text style={styles.hintText}>点击按钮进行分类</Text>
					</>
				)}
			</View>

			{/* 拖拽中的单词 */}
			{draggingWord && (
				<View
					style={[
						styles.draggingCard,
						{
							left: dragPosition.x,
							top: dragPosition.y,
						}
					]}
					pointerEvents="none"
				>
					<Text style={styles.wordText}>{draggingWord.word}</Text>
					<Text style={styles.definitionText}>{draggingWord.definition}</Text>
				</View>
			)}
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#f5f5f5',
	},
	header: {
		padding: 16,
		backgroundColor: '#fff',
		borderBottomWidth: 1,
		borderBottomColor: '#e0e0e0',
		alignItems: 'center',
	},
	headerTitle: {
		fontSize: 18,
		fontWeight: '600',
		color: '#333',
	},
	content: {
		flex: 1,
		padding: 16,
		justifyContent: 'center',
	},
	centerContent: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
	},
	loadingText: {
		fontSize: 16,
		color: '#666',
	},
	errorText: {
		fontSize: 16,
		color: '#e53935',
		textAlign: 'center',
		padding: 20,
	},
	completedContainer: {
		alignItems: 'center',
	},
	completedText: {
		fontSize: 18,
		color: '#4caf50',
		fontWeight: '600',
	},
	remainingText: {
		fontSize: 16,
		color: '#666',
		textAlign: 'center',
		marginBottom: 20,
	},
	wordsContainer: {
		marginBottom: 30,
	},
	wordCard: {
		backgroundColor: '#fff',
		borderRadius: 12,
		padding: 20,
		marginBottom: 12,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.1,
		shadowRadius: 4,
		elevation: 3,
	},
	wordCardDragging: {
		opacity: 0.5,
	},
	wordText: {
		fontSize: 24,
		fontWeight: 'bold',
		color: '#333',
		marginBottom: 8,
	},
	definitionText: {
		fontSize: 14,
		color: '#666',
		lineHeight: 20,
	},
	buttonsContainer: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		gap: 12,
	},
	categoryButton: {
		flex: 1,
		paddingVertical: 20,
		borderRadius: 12,
		alignItems: 'center',
		justifyContent: 'center',
	},
	buttonX: {
		backgroundColor: '#4caf50',
	},
	buttonY: {
		backgroundColor: '#ff9800',
	},
	buttonZ: {
		backgroundColor: '#f44336',
	},
	buttonText: {
		color: '#fff',
		fontSize: 16,
		fontWeight: '600',
	},
	hintText: {
		textAlign: 'center',
		marginTop: 16,
		color: '#999',
		fontSize: 14,
	},
	draggingCard: {
		position: 'absolute',
		backgroundColor: '#fff',
		borderRadius: 12,
		padding: 20,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 0.3,
		shadowRadius: 8,
		elevation: 10,
		minWidth: SCREEN_WIDTH - 64,
	},
});
