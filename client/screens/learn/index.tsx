import React, { useState, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Dimensions, PanResponder } from 'react-native';
import { useSafeRouter, useSafeSearchParams } from '@/hooks/useSafeRouter';
import { Screen } from '@/components/Screen';
import { useFocusEffect } from 'expo-router';
import { API_BASE_URL } from '@/utils/apiConfig';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface Word {
	id: number;
	word: string;
	meaning: string;
	phonetic?: string;
	example?: string;
	example_translation?: string;
	example_image_url?: string;
}

interface Category {
	id: number;
	name: string;
	letter: string;
	count: number;
}

interface DraggableWordCardProps {
	word: Word;
	onDrop: (wordId: number, categoryId: number) => void;
	onPress: () => void;
}

function DraggableWordCard({ word, onDrop, onPress }: DraggableWordCardProps) {
	const pan = useRef(new Animated.ValueXY()).current;
	const [isDragging, setIsDragging] = useState(false);

	const panResponder = useRef(
		PanResponder.create({
			onStartShouldSetPanResponder: () => true,
			onMoveShouldSetPanResponder: () => true,
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

				// 检测放置位置 - 使用相对Y位置判断是否在分类区域
				const dy = gestureState.dy;
				const absoluteX = gestureState.moveX;

				// 当卡片向下拖动超过100时，视为放入分类区域
				if (dy > 100) {
					let targetCategory = 3;
					if (absoluteX < SCREEN_WIDTH / 3) {
						targetCategory = 1;
					} else if (absoluteX < (SCREEN_WIDTH / 3) * 2) {
						targetCategory = 2;
					}
					onDrop(word.id, targetCategory);
				}

				// 回到原位
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
		})
	).current;

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
			<View style={styles.wordCard}>
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
	const [categories, setCategories] = useState<Category[]>([
		{ id: 1, name: '已会', letter: 'x', count: 0 },
		{ id: 2, name: '模糊', letter: 'y', count: 0 },
		{ id: 3, name: '不会', letter: 'z', count: 0 },
	]);
	
	// 分类颜色配置
	const categoryColors = {
		1: '#4CAF50',
		2: '#FF9800',
		3: '#F44336',
	};

	// 显示的单词（最多3个）
	const displayWords = allWords.slice(0, 3);
	const remainingCount = allWords.length;

	const fetchData = useCallback(async () => {
		try {
			const [wordsRes, xRes, yRes, zRes] = await Promise.all([
				fetch(`${API_BASE_URL}/api/v1/wordbooks/${table}`),
				fetch(`${API_BASE_URL}/api/v1/wordbooks/words_x`),
				fetch(`${API_BASE_URL}/api/v1/wordbooks/words_y`),
				fetch(`${API_BASE_URL}/api/v1/wordbooks/words_z`)
			]);

			const wordsData = await wordsRes.json();
			const xResult = await xRes.json();
			const yResult = await yRes.json();
			const zResult = await zRes.json();

			setAllWords(Array.isArray(wordsData) ? wordsData : []);
				
			setCategories([
				{ id: 1, name: '已会', letter: 'x', count: Array.isArray(xResult) ? xResult.length : 0 },
				{ id: 2, name: '模糊', letter: 'y', count: Array.isArray(yResult) ? yResult.length : 0 },
				{ id: 3, name: '不会', letter: 'z', count: Array.isArray(zResult) ? zResult.length : 0 },
			]);
		} catch (error) {
			console.error('Failed to fetch data:', error);
		}
	}, [table]);

	useFocusEffect(
		useCallback(() => {
			fetchData();
		}, [fetchData])
	);

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

		// 从allWords中移除被分类的单词
		setAllWords(prev => prev.filter(w => w.id !== wordId));
		
		// 更新分类数量
		setCategories(cats =>
			cats.map(cat =>
				cat.id === categoryId ? { ...cat, count: cat.count + 1 } : cat
			)
		);
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
				example_image_url: word.example_image_url || ''
			}),
			table: table
		});
	};

	return (
		<Screen>
			<View style={styles.container}>
				{/* Header */}
				<View style={styles.header}>
					<TouchableOpacity onPress={() => router.back()}>
						<Text style={styles.backText}>← back</Text>
					</TouchableOpacity>
					<Text style={styles.title}>词汇预览</Text>
					<View style={styles.placeholder} />
				</View>

				{/* Word Cards - 3 words in a row */}
				<View style={styles.wordCardsContainer}>
					<Text style={styles.remainingText}>剩余 {remainingCount} 个单词</Text>
					{displayWords.length > 0 ? (
						<View style={styles.wordRow}>
							{displayWords.map((word) => (
								<DraggableWordCard
									key={word.id}
									word={word}
									onDrop={handleDrop}
									onPress={() => handleWordPress(word)}
								/>
							))}
						</View>
					) : (
						<View style={styles.emptyContainer}>
							<Text style={styles.emptyText}>所有单词已分类完成！</Text>
						</View>
					)}
				</View>

				{/* Category Drop Zones - Normal layout for proper gesture handling */}
				<View style={styles.categorySection}>
					<View style={styles.categoryRow}>
						{categories.map((cat) => (
							<View key={cat.id} style={styles.categoryItem}>
								<View style={[styles.categoryCard, { backgroundColor: categoryColors[cat.id] }]}>
									<Text style={styles.categoryName}>{cat.name}</Text>
									<Text style={styles.categoryCount}>({cat.count})</Text>
								</View>
							</View>
						))}
					</View>
					<Text style={styles.instructionText}>拖动单词到上方分类区域</Text>
				</View>
		</Screen>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#FFFFFF',
		justifyContent: 'space-between',
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
	wordCardsContainer: {
		paddingHorizontal: 20,
		paddingVertical: 40,
		alignItems: 'center',
	},
	remainingText: {
		fontSize: 14,
		color: '#999999',
		marginBottom: 20,
	},
	wordRow: {
		flexDirection: 'row',
		gap: 10,
		justifyContent: 'center',
	},
	wordItemContainer: {
		width: 80,
	},
	wordCard: {
		backgroundColor: '#F0F0F0',
		paddingHorizontal: 8,
		paddingVertical: 12,
		borderRadius: 10,
		alignItems: 'center',
		minHeight: 60,
		justifyContent: 'center',
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.1,
		shadowRadius: 4,
		elevation: 3,
	},
	wordCardText: {
		fontSize: 14,
		color: '#333333',
		fontFamily: 'serif',
		fontWeight: '600',
	},
	categorySection: {
		paddingHorizontal: 20,
		paddingVertical: 20,
		backgroundColor: '#FFFFFF',
	},
	categoryRow: {
		flexDirection: 'row',
		justifyContent: 'space-around',
		gap: 10,
	},
	categoryItem: {
		flex: 1,
	},
	categoryCard: {
		paddingVertical: 20,
		borderRadius: 12,
		alignItems: 'center',
	},
	categoryName: {
		fontSize: 16,
		color: '#FFFFFF',
		fontFamily: 'serif',
		fontWeight: '600',
	},
	categoryCount: {
		fontSize: 14,
		color: 'rgba(255,255,255,0.8)',
		marginTop: 4,
	},
	instructionText: {
		fontSize: 12,
		color: '#999999',
		textAlign: 'center',
		marginTop: 12,
	},
	emptyContainer: {
		padding: 48,
		alignItems: 'center',
	},
	emptyText: {
		fontSize: 16,
		color: '#999999',
	},
});
